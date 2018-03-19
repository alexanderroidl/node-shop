module.exports = {
	merge: function(/*..*/) {
		var query = "";
		for (var i = 0; i < arguments.length; i++) {
			query += arguments[i] + ";";
		} return query;
	},

	all: {
		delete: `
			DROP TABLE IF EXISTS products;
			DROP TABLE IF EXISTS users;
			DROP TABLE IF EXISTS addresses;
			DROP TABLE IF EXISTS paymethods;
			DROP TABLE IF EXISTS purchases;`,

		empty: `
			TRUNCATE TABLE products;
			TRUNCATE TABLE users;
			TRUNCATE TABLE addresses;
			TRUNCATE TABLE paymethods;
			TRUNCATE TABLE purchases;`
	},

	products: {
		create: `
			CREATE TABLE products (
				ID int(11) AUTO_INCREMENT PRIMARY KEY,
				Name char(64) COMMENT 'Short description',
				FullName varchar(128),
				Price double,
				Description text,
				ImagePath tinytext,
				Quantity int(11)
			)`,

		add: function(name, fullName, price, description, imagePath, quantity) {
			return `
				INSERT INTO products
				(ID, Name, FullName, Price, Description, ImagePath, Quantity)
				VALUES
				(null, ${name}, ${fullName}, ${price}, ${description}, ${imagePath}, ${quantity})`;
		},

		range: function(start, end) {
			return `
				SELECT
				ID, Name, FullName, Price, Description, ImagePath, Quantity
				FROM products
				WHERE ID BETWEEN ${start} AND ${end}`;
		},

		byId: function(productId) {
			return `
				SELECT
				Name, FullName, Price, Description, ImagePath, Quantity
				FROM products
				WHERE ID=${productId}`;
		}
	},

	users: {
		create: `
			CREATE TABLE users (
				ID int(11) AUTO_INCREMENT PRIMARY KEY,
				Username varchar(64),
				Email varchar(128),
				FirstName varchar(64),
				LastName varchar(64),
				IsAdmin tinyint(1),
				Password varchar(512) COMMENT 'Hashed'
			)`,

		add: function(username, email, firstName, lastName, admin, password) {
			return `
				INSERT INTO users
				(ID, Username, Email, FirstName, LastName, IsAdmin, Password)
				VALUES
				(NULL, ${username}, ${email}, ${firstName}, ${lastName}, '${admin}', '${password}')`
		},

		byId: function(id) {
			return `
				SELECT
				Username, Email, FirstName, LastName, IsAdmin
				FROM
				users
				WHERE ID=${id}`;
		}
	},

	addresses: {
		create: `
			CREATE TABLE addresses (
				ID int(11) AUTO_INCREMENT PRIMARY KEY,
				UserID int(11),
				FirstName varchar(64),
				LastName varchar(64),
				Street varchar(128),
				StreetNr int(11),
				City varchar(64),
				ZIP int(11),
				Dimension varchar(64),
				Planet varchar(64),
				Additional varchar(256)
			)`,

		add: function(userId, firstName, lastName, street, streetNr, city, zip, dimension, planet, additional) {
			return `
				INSERT INTO addresses
				(ID, UserID, FirstName, LastName, Street, StreetNr, City, ZIP, Dimension, Planet, Additional)
				VALUES
				(null, ${userId}, ${firstName}, ${lastName}, ${street}, ${streetNr}, ${city}, ${zip}, ${dimension}, ${planet}, ${additional})`
		},

		byId: function(id) {
			return `
				SELECT
				UserID, FirstName, LastName, Street, StreetNr, City, ZIP, Dimension, Planet, Additional
				FROM
				addresses
				WHERE ID=${id}`;
		},

		byUserId: function(userId) {
			return `
				SELECT
				ID, FirstName, LastName, Street, StreetNr, City, ZIP, Dimension, Planet, Additional
				FROM
				addresses
				WHERE UserID=${userId}`
		}
	},

	purchases: {
		create: `
			CREATE TABLE purchases (
				ID int(11) AUTO_INCREMENT PRIMARY KEY,
				UserID int(11),
				Paymethod varchar(32),
				Address mediumtext COMMENT 'JSON',
				Data mediumtext COMMENT 'JSON',
				Total int(11),
				Time datetime DEFAULT CURRENT_TIMESTAMP
			)`,

		add: function(userId, payMethod, address, data, total) {
			return `
				INSERT INTO
				purchases
				(ID, UserID, Paymethod, Address, Data, Total, Time)
				VALUES
				(null, ${userId}, ${payMethod}, ${address}, ${data}, ${total}, NOW())`;
		},

		byId: function(id) {
			return `
				SELECT
				UserID, Paymethod, Address, Data, Total, Time
				FROM purchases
				WHERE ID=${id}`;
		},

		byUserId: function(userId) {
			return `
				SELECT
				ID, Paymethod, Address, Data, Total, Time
				FROM purchases
				WHERE UserID=${userId}`;
		}
	},

	paymethods: {
		create: `
			CREATE TABLE paymethods (
				ID int(11) AUTO_INCREMENT PRIMARY KEY,
				UserID int(11),
				Type enum('Bill','Spacecard','Bank','Paypal','Bitcoin'),
				Data mediumtext COMMENT 'JSON'
			)`,

		add: function(userId, type, data) {
			return `
				INSERT INTO paymethods
				(ID, UserID, Type, Data)
				VALUES
				(null, ${userId}, ${type}, ${data})`;
		},

		byId: function(id) {
			return `
				SELECT
				UserID, Type, Data
				FROM paymethods
				WHERE ID=${id}`;
		},

		byUserId: function(userId) {
			return `
				SELECT
				ID, Type, Data
				FROM paymethods
				WHERE UserID=${userId}`;
		}
	}
}
