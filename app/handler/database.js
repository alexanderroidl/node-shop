/**
 * Module dependencies
 */

const shopCfg  		= require('../cfg/shop');

const EventEmitter  = require('events').EventEmitter;
var mysql	 		= require('mysql');
var security 		= require('../lib/security');
var sql 			= require('../handler/sql');
var sqlDataModel	= require('../models/sqlData');

require('../lib/string');

/**
 * Helper functions
 */
function _call(callback, err, data) {
	if(typeof callback === 'function') callback(err, data);
}

function escTrim(object, connection) {
	for(var key in object) {
		if(typeof object[key] === 'string') {
			object[key] = object[key].trim();
			if(connection) object[key] = connection.escape(object[key]);
		}
	}
	return object;
}

/**
 * Database Model
 */
class DatabaseHandler extends EventEmitter {
	//========================
	// Constructor
	//========================
	constructor(host, user, password, db) {
		super();

		this._connection = mysql.createConnection({
			host: host,
			user: user,
			password: password,
			multipleStatements: true
		});

		this._database = db;
	}


	//========================
	// Escape
	//========================
	escape(str) {
		return this._connection.escape(str);
	}


	//========================
	// Initialize
	//========================
	init(callback) {
		// This was made a seperate method to create better readable class structure
		var self = this;

		var connection = this._connection;
		var database = this._database;

		// Check if database exists already
		connection.query(`SHOW DATABASES LIKE '${database}'`, function (err, result) {
			if(!result.length) { // Doesn't exist
				// Create database
				connection.query(`
					CREATE DATABASE ${database};
					USE ${database}`,

					function (err, result) {
						// Create tables
						connection.query(
							sql.merge(sql.users.create, sql.products.create, sql.addresses.create, sql.purchases.create, sql.paymethods.create),
							function(err, results) {
								self.emit('ready'); // Fire ready event
						  	});
					}
				)
			}
			else { // Already exists, so use it
				connection.query(`USE ${database}`, function(err, result) {
					self.emit('ready'); // Fire ready event
				});
			}
		});
	}



	//========================
	// Create tables
	//========================
	createTables(callback) {
		this._connection.query(
			sql.merge(sql.users.create, sql.products.create, sql.addresses.create, sql.purchases.create, sql.paymethods.create),
			function(err, result) {
				if(typeof callback === 'function')
					callback(err);
			});
	}


	//========================
	// Delete tables
	//========================
	deleteTables(callback) {
		this._connection.query(sql.all.delete, function(err, result) {
			if(typeof callback === 'function')
				callback(err);
		});
	}


	//========================
	// Empty tables
	//========================
	emptyTables(callback) {
		this._connection.query(sql.all.empty, function(err, result) {
			if(typeof callback === 'function')
				callback(err);
		});
	}


	//========================
	// Add user
	//========================
	addUser(username, email, firstName, lastName, admin, password, clientHash, callback) { // TODO: Use cfg object instead of params
		// Helper
		function _callback(err, data) { _call(callback, err, data); }

		// Validate values (No need to escape them anymore)
		var usernameRegEx = /^[_a-zA-Z0-9]+$/;
		var nameRegEx = /^[a-zA-Z]+$/;

		if(username.length < 4)
			return _callback("Invalid username. Use at least four characters");

		if(firstName.length < 2)
			return _callback("Invalid first name. Use at least two characters");

		if(lastName.length < 2)
			return _callback("Invalid last name. Use at least two characters");

		if(!username.match(usernameRegEx))
			return _callback("Invalid username. Only letters, numbers and underscores allowed");

		if(username.charAt(0) == '_')
			return _callback("Invalid username. First character has to be a letter or number");

		if(!email.isEmail())
			return _callback("Invalid email format");

		if(!firstName.match(nameRegEx))
			return _callback("Invalid first name. Only letters allowed");

		if(!lastName.match(nameRegEx))
			return _callback("Invalid last name. Only letters allowed");

		// Database
		var connection = this._connection;

		// Set values
		username = connection.escape(username.trim());
		email = connection.escape(email.trim());
		firstName = connection.escape(firstName.trim());
		lastName = connection.escape(lastName.trim());
		admin = (admin ? 1 : 0) + '';

 		// Run SQL statement
		var _sql = `SELECT 1 FROM users WHERE Username=${username}`;
		connection.query(_sql, function (err, result, fields) {
			if(result && result.length > 0)
				return _callback("Username already exists");

			// Doesn't exist yet -> hash password
			security.hashPassword(password, clientHash ? username : null, function(hash) {
				// Insert user into database
				var __sql = sql.users.add(username, email, firstName, lastName, admin, hash);
				connection.query(__sql, function(err, result, fields) {
					if(err) throw err;
					_callback(null, result.insertId);
				});
			});
		});
	}


	//========================
	// Login user
	//========================
	loginUser(username, email, password, clientHash, callback) { // TODO: Use cfg object instead of params
		var connection = this._connection;

		var columnName = "Username";
		if(email) columnName = "Email";

		// Create SQL statement
		var checkValue = username ? username : email;
		var condition = `${columnName}=${checkValue}`;
		var _sql = `SELECT ID,Password FROM users WHERE ${condition}`;

		// Run SQL statement
		connection.query(_sql, function(err, result, fields) {
			if(err) throw err;

			var authError = `Wrong ${columnName} or password`; // No special error to avoid abuse

			// User not found
			if(!result || !result.length) return callback(authError);

			// Compare passwords
			security.comparePassword(password, clientHash ? username : null, result[0].Password, function(success) {
				if(success) {
					var token = security.createToken(result[0].ID);
					return callback(null, { token: token });
				}
				// Passwords don't match
				callback(authError);
			});
		});
	}


	//========================
	// Get user by ID
	//========================
	getUserById(id, callback) {
		var connection = this._connection;

		// Escape value
		var _id = id; // Safe for later use
		id = connection.escape(id);

		// Run SQL statement
		var _sql = sql.users.byId(id);
		connection.query(_sql, function(err, result) {
			if(err) throw err;

			if(!result.length)
				return callback("User not found");

			// Transform and return user
			result[0].ID = _id; // Hasn't been included in SQL result before
			var user = sqlDataModel.user(result[0]);
			callback(null, user);
		});
	}


	//========================
	// Add product
	//========================
	addProduct(user, product, callback) {
		// Authorize
		if(user && !user.admin)
			return _call(callback, "You must be an admin to do that");

		var connection = this._connection;

		// Prepare values
		product = escTrim(product, connection);

		// Run query
		var _sql = sql.products.add(product.name, product.fullName, product.price, product.description, product.imagePath, product.quantity);
		connection.query(_sql, function(err, result) {
			if(err) throw err;

			_call(callback, null, { id: result.insertId });
		});
	}


	//========================
	// Get products
	//========================
	getProducts(page, callback) {
		var connection = this._connection;

		// Calculations
		var itemsPerPage = shopCfg.itemsPerPage + 1;

		var id = page - 1;
		if(id < 0) id = 0;

		var start = id * itemsPerPage + 1;
		var end = (id + 1) * itemsPerPage;

		// Get products
		var _sql = sql.products.range(start, end);
		connection.query(_sql, function (err, result, fields) {
			if (err) throw err;

			// Transform products
			var products = [];
			result.forEach(function(row) {
				var product = sqlDataModel.product(row);
				products.push(product)
			});

			// Return products
			callback(null, products);
		});
	}


	//========================
	// Get product by id
	//========================
	getProductById(id, callback) {
		var _sql = sql.products.byId(id);
		this._connection.query(_sql, function (err, result) {
			if(err) throw err;

			if(!result.length)
				return callback(`Couldn't find product matching id "${id}"`);

			// Transform and return paymethod
			var product = sqlDataModel.product(result[0]);
			callback(null, product);
		});
	}


	//========================
	// Add purchase
	//========================
	addPurchase(user, purchase, preview, callback) {
		var payMethodId = purchase.payMethodId;

		var connection = this._connection;
		var _sql = sql.paymethods.byId(purchase.payMethodId);
		connection.query(_sql, function (err, result) {
			if(err || !result.length)
				return callback(`Couldn't find paymethod matching id "${payMethodId}"`);

			// Get paymethod
			var payMethod = sqlDataModel.payMethod(result[0]);
			if(payMethod.userId != user.id) // Isn't users own paymethod
				return callback("Invalid paymethod id");

			// Prepare final purchase object
			var final = {};

			// Save full paymethod
			final.payMethod = payMethod.type;

			// Continue by checking address
			var addressId = purchase.addressId;
			var _sql = sql.addresses.byId(purchase.addressId);
			connection.query(_sql, function(err, result) {
				if(err || !result.length)
					return callback(`Couldn't find address matching id "${addressId}"`);

				// Get address
				var address = sqlDataModel.address(result[0]);
				if(address.userId != user.id)  // Isn't users own address
					return callback("Invalid address id");

				final.address = {
					name: address.firstName + " " + address.lastName,
					street: address.street + " " + address.streetNr,
					city: address.city, zip: address.zip,
					dimension: address.dimension, planet: address.planet,
					additional: address.additional
				};

				// Iterate through products
				var items = [];

				// Asynchronious SQL statements inside loop
				var count = purchase.products.length;
				purchase.products.forEach(function(single) {
					var productId = single.id;
					var quantity = single.quantity;

					var _sql = sql.products.byId(productId);
					connection.query(_sql, function(err, result) {
						if(!err && result.length) {
							var product = sqlDataModel.product(result[0]);

							var fullName = product.fullName;
							var maxQuantity = product.quantity;

							if(quantity > maxQuantity)
								return callback(`Quantity of product "${fullName}" too high`);

							var price = product.price;
							var shipping = shopCfg.shipping;
							var total = (price * quantity + shipping).toFixed(2); // Two digits max

							items.push({
								name: fullName,
								price: price,
								quantity: quantity,
								shipping: shipping,
								total: total
							});
						}
						proceed(--count);
					});

					// Function to handle async operations
					function proceed(count) {
						if(count > 0) return; // Not done yet

						// Calculate total costs
						var total = 0;
						items.forEach(item => {
							total += item.total;
						})

						// Save items and total costs to final purchase
						final.items = items;
						final.total = total;

						// Preview only
						if(preview)
							return callback(null, { items: items });

						// Stringify data
						var payMethod = connection.escape(final.payMethod);
						var address = connection.escape(JSON.stringify(final.address));
						var products = connection.escape(JSON.stringify(final.items));
						total = connection.escape(total);

						// Save final purchase to database
						var _sql = sql.purchases.add(user.id, payMethod, address, products, total);
						connection.query(_sql, function(err, result) {
							if(err) throw err;

							callback(null, { id: result.insertId });
						});
					}
				});
			});
		});
	}


	//========================
	// Get purchases
	//========================
	getPurchases(user, callback) {
		var _sql = sql.purchases.byUserId(user.id);
		this._connection.query(_sql, function (err, result) {
			if(err) throw err;

			// Transform purchases
			var purchases = [];
			result.forEach(function(row) {
				var purchase = sqlDataModel.purchase(row);
				purchases.push(purchase);
			})

			// Return purchases
			callback(null, purchases);
		});
	}


	//========================
	// Get purchase by id
	//========================
	getPurchaseById(purchaseId, callback) {
		var _sql = sql.purchases.byId(purchaseId);
		this._connection.query(_sql, function (err, result) {
			if(err) throw err;

			if(!result.length)
				return callback(`Couldn't find purchase matching id ${purchaseId}`);

			// Transform and return purchase
			result[0].ID = purchaseId;
			var purchase = sqlDataModel.purchase(result[0]);
			callback(null, purchase);
		});
	}


	//========================
	// Add address
	//========================
	addAddress(user, targetUserId, address, callback) {
		// Authorize
		if(user && user.id && targetUserId != user.id && !user.admin)
			return _call(callback, "You must be an admin to do that");

		// Create SQL statement
		var _sql =
			sql.addresses.add(
				targetUserId,
				address.firstName, address.lastName,
				address.street, address.streetNr,
				address.city, address.zip,
				address.dimension, address.planet,
				address.additional
			);

		// Run SQL statement
		this._connection.query(_sql, function(err, result) {
			if(err) throw err;

			// Return id of created address
			_call(callback, null, { id: result.insertId });
		});
	}


	//========================
	// Get addresses
	//========================
	getAddresses(user, callback) {
		var _sql = sql.addresses.byUserId(user.id);
		this._connection.query(_sql, function (err, result) {
			if(err) throw err;

			// Transform addresses
			var addresses = [];
			result.forEach(function(row) {
				var address = sqlDataModel.address(row);
				addresses.push(address);
			})

			// Return addresses
			callback(null, addresses);
		});
	}


	//========================
	// Get address by id
	//========================
	getAddressById(id, callback) {
		var connection = this._connection;

		// Safe for later use
		var _id = id;
		// Escape value
		id = connection.escape(id);

		// SQL statement
		var _sql = sql.addresses.byId(id);
		connection.query(_sql, function (err, result) {
			if(err) throw err;

			if(!result.length)
				return callback(`Couldn't find address matching id ${id}`);

			// Transform and return address
			result[0].ID = _id; // Wasn't provided before
			var address = sqlDataModel.address(result[0]);
			callback(null, address);
		});
	}


	//========================
	// Add pay method
	//========================
	addPayMethod(user, payMethod, callback) {
		var connection = this._connection;

		// Escape
		payMethod = escTrim(payMethod, connection);

		// Run SQL statement
		var _sql = sql.paymethods.add(user.id, payMethod.type, payMethod.data);
		connection.query(_sql, function(err, result) {
			if(err) throw err;

			// Return id of created paymethod
			_call(callback, null, { id: result.insertId });
		});
	}


	//========================
	// Get pay methods
	//========================
	getPayMethods(user, callback) {
		var _sql = sql.paymethods.byUserId(user.id);
		this._connection.query(_sql, function (err, result) {
			if(err) throw err;

			// Transform paymethods
			var payMethods = [];
			result.forEach(function(row) {
				var payMethod = sqlDataModel.payMethod(row);
				payMethods.push(payMethod);
			});

			// Return paymethods
			callback(null, payMethods);
		});
	}


	//========================
	// Get pay method by id
	//========================
	getPayMethodById(id, callback) {
		var _sql = sql.paymethods.byId(id);
		this._connection.query(_sql, function (err, result) {
			if(err) throw err;

			if(!result.length)
				return callback(`Couldn't find pay method matching id "${id}"`);

			// Transform and return paymethod
			var payMethod = sqlDataModel.payMethod(result[0]);
			callback(null, payMethod);
		});
	}
}

// Export function to provide config option with safe usage
module.exports = function(cfg, callback) {
	var host = cfg.host;
	var user = cfg.user;
	var password = cfg.password;
	var db = cfg.database;

	// Don't apply 'truthy' check on password to allow empty string
	if(!(host && user && password != null && db))
		throw new Error("Invalid configuration");

	var database = new DatabaseHandler(host, user, password, db);
	database.init();

	return database;
}
