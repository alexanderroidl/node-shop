var purchasePDF = require('../pdf/purchasePDF');

module.exports = function(dbHandler) {
	return {
		// Public
			// Accounting
			login: function(username, email, password, clientHash, callback) {
				// Check values
				if(!((username || email) && password)) return callback("Empty values");

				// Set values
				if(username) username = dbHandler.escape(username.trim());
				if(email) email = dbHandler.escape(email.trim());
				clientHash = clientHash ? true : false;

				// Login user
				dbHandler.loginUser(username, email, password, clientHash, function(err, data) {
					if(err) return callback(err)
					callback(null, data)
				});
			},

			register: function(username, email, firstName, lastName, password, passwordRepeat, clientHash, callback) {
				// Check values
				if(!(username && email && firstName && lastName && password && passwordRepeat))
					return callback("Empty values");

				if(username == "root")
					return callback("Username forbidden");

				if(password != passwordRepeat)
					return callback("Passwords don't match");

				// Set values
				// We don't escape here because everything will be regex validated
				clientHash = clientHash ? true : false;

				// Add user
				dbHandler.addUser(username, email, firstName, lastName, false, password, clientHash, function(err, id) {
					if(err) return callback(err);
					callback();
				});
			},

			products: {
				all: function(page, callback) {
					// Validate value
					page = parseInt(page);
					if(isNaN(page)) return callback("Page must be an integer");
					if(!page) return callback("Page must be greater than zero");

					// Get products
					dbHandler.getProducts(page, function(err, products) {
						if(err) return callback(err);
						callback(null, products);
					});
				},

				byId: function(id, callback) {
					// Validate value
					id = parseInt(id);
					if(isNaN(id)) return callback("ID must be an integer");

					// Get product by id
					dbHandler.getProductById(id, function(err, product) {
						if(err) return callback(err);

						product.id = id;
						callback(null, product);
					});
				},

				add: function(token, name, fullName, price, description, imagePath, quantity, callback) {
					// Check values
					if(!(name && fullName && price && description && imagePath && quantity))
						return callback("Empty values");

					// Get user by id
					dbHandler.getUserById(token.id, function(err, user) {
						if(err) return callback(err);

						// Add product to database
						dbHandler.addProduct(user, {
							name: name,
							fullName: fullName,
							price: price,
							description: description,
							imagePath: imagePath,
							quantity: quantity
						}, function(err, data) {
							if(err) return callback(err);

							// Retrieve created product by id
							var productId = data.id;
							dbHandler.getProductById(productId, function(err, product) {
								product.id = productId;
								callback(null, product);
							});
						})
					});
				}
			},

		// Protected
		account: function(token, callback) {
			dbHandler.getUserById(token.id, function(err, user) {
				if(err) return callback(err);

				delete user.id; // Never provide user id
				callback(null, user);
			});
		},

		purchases: {
			all: function(token, callback) {
				// Get user by id
				dbHandler.getUserById(token.id, function(err, user) {
					if(err) return callback(err);

					// Get purchases
					dbHandler.getPurchases(user, function(err, purchases) {
						if(err) return callback(err);

						callback(null, purchases);
					});
				});
			},

			byId: function(token, purchaseId, callback) {
				// Get user by id
				dbHandler.getUserById(token.id, function(err, user) {
					if(err) return callback(err);

					// Get purchase by id
					dbHandler.getPurchaseById(purchaseId, function(err, purchase) {
						if(err) return callback(err);

						if(purchase.userId != user.id) // Isn't users own purchase
							return callback("Invalid purchase id");

						delete purchase.userId;
						callback(null, purchase);
					});
				});
			},

			pdf: function(token, purchaseId, callback) {
				// Get user by id
				dbHandler.getUserById(token.id, function(err, user) {
					if(err) return callback(err);

					// Get purchase by id
					dbHandler.getPurchaseById(purchaseId, function(err, purchase) {
						if(err) return callback(err);

						if(purchase.userId != user.id)
							return callback("Invalid purchase id");

						// Render PDF
						purchasePDF.render(user, purchase, function(stream) {
							callback(null, stream);
						});
					});
				});
			},

			add: function(token, payMethodId, addressId, products, preview, callback) {
				if(!(payMethodId && addressId && products))
					return callback("Empty values");

				// Parse and validate products
				try {
					products = JSON.parse(products);

					// Isn't an array or is empty
					if(!(Array.isArray(products) && products.length))
						throw(true);

					// Iterate through elements
					products.forEach(function(product) {
						if(typeof product !== 'object') throw(true);

						if(typeof product.id !== 'number') throw(true);
						if(typeof product.quantity !== 'number') throw(true);
					});
				} catch(err) {
					return callback("Invalid product data provided");
				}

				// Get user by id
				dbHandler.getUserById(token.id, function(err, user) {
					if(err) return callback(err);

					// New purchase
					dbHandler.addPurchase(user, {
						payMethodId: payMethodId,
						addressId: addressId,
						products: products
					}, preview, function(err, data) {
						if(err) return callback(err);

						// Stop here and return preview
						if(preview)
							return callback(null, data);

						// Retrieve created purchase by id
						var purchaseId = data.id;
						dbHandler.getPurchaseById(purchaseId, function(err, purchase) {
							purchase.id = purchaseId;
							delete purchase.userId; // Never provide user id

							callback(null, purchase);
						});
					});
				})
			}
		},

		addresses: {
			all: function(token, callback) {
				// Get user by id
				dbHandler.getUserById(token.id, function(err, user) {
					if(err) return callback(err);

					// Get adresses by user
					dbHandler.getAddresses(user, function(err, addresses) {
						if(err) return callback(err);
						callback(null, addresses);
					});
				})
			},

			add: function(token, targetUserId, firstName, lastName, street, streetNr, city, zip, planet, dimension, additional, callback) {
				if(!(street && streetNr && city && zip && planet && dimension))
					return callback('Empty values');

				// Save address for right user
				dbHandler.getUserById(token.id, function(err, user) {
					if(err) return callback(err);

					// Create address object
					var address = {
						firstName: firstName ? firstName : user.firstName, // Additional
						lastName: lastName ? lastName : user.lastName, // Additional
						street: street,
						streetNr: streetNr,
						city: city,
						zip: zip,
						planet: planet,
						dimension: dimension,
						additional: additional ? additional : '' // Additional
					};

					// Escape and trim all values
					for(var key in address) {
						if(typeof address[key] === 'string')
							address[key] = dbHandler.escape(address[key].trim());
					}

					if(!targetUserId) targetUserId = user.id;

					// Add address to database
					dbHandler.addAddress(user, targetUserId, address, function(err, data) {
						if(err) return callback(err);

						dbHandler.getAddressById(data.id, function(err, address) {
							delete address.userId; // Never provide user id
							address.id = data.id; // Safe address id from before

							callback(null, address);
						});
					});
				});
			}
		},

		paymethods: {
			all: function(token, callback) {
				dbHandler.getUserById(token.id, function(err, user) {
					if(err) return callback(err);

					dbHandler.getPayMethods(user, function(err, paymethods) {
						if(err) return callback(err);
						callback(null, paymethods);
					});
				});
			},

			add: function(token, type, data, callback) {
				// Check values
				if(!(type && data)) return callback('Empty values');

				// Trim values
				type = type.trim();
				data = data.trim();

				// Get user by id
				dbHandler.getUserById(token.id, function(err, user) {
					if(err) return callback(err);

					// Add pay method to database
					dbHandler.addPayMethod(user, {
						type: type,
						data: data
					}, function(err, data) {
						if(err) return callback(err);

						// Retrieve complete created pay method
						var payMethodId = data.id;
						dbHandler.getPayMethodById(payMethodId, function(err, payMethod) {
							// Prepare pay method
							delete payMethod.userId; // Never provide user id
							payMethod.id = payMethodId;

							// Return pay method
							callback(null, payMethod);
						});
					});
				})
			}
		}
	};
}
