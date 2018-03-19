/**
 * Dependencies
 */
const securityCfg = require('../cfg/security');

var bcrypt 	= require('bcrypt');
var unorm 	= require('unorm');
var sjcl 	= require('sjcl');
var jwt 	= require('jsonwebtoken');

/**
 * Security functions
 */
function pbkdf2(plaintext, extra) {
	var password = unorm.nfc(plaintext);

	var secret = securityCfg.pbkdf.secret;
	if(extra) secret += unorm.nfc(extra).toLowerCase();
	var salt = sjcl.codec.utf8String.toBits(secret);
	var rounds = securityCfg.pbkdf.rounds;

	// PBKDF2
	var key = sjcl.misc.pbkdf2(password, salt, rounds, 32 * 8, function(key) {
		var hasher = new sjcl.misc.hmac(key, sjcl.hash.sha256);

		this.encrypt = function () {
			return hasher.encrypt.apply(hasher, arguments);
		};
	});
	return sjcl.codec.hex.fromBits(key);
}

module.exports = {
	//========================
	// Hash password
	//========================
	hashPassword: function(password, extra, callback) {
		// Client hash if extra provided
		if(extra) password = pbkdf2(password, extra)

		// BCrypt hash
		bcrypt.hash(password, securityCfg.passwordSaltRounds, function (err, hash) {
			if (err) throw err;
			callback(hash);
		});
	},

	//========================
	// Compare password
	//========================
	comparePassword: function(password, extra, compare, callback) {
		// Client hash if extra provided
		if(extra) password = pbkdf2(password, extra)

		// BCrypt compare
		bcrypt.compare(password, compare, function(err, res) {
			callback(!err && res);
		});
	},

	//========================
	// Create token
	//========================
	createToken: function(userId) {
		return jwt.sign({
			id: userId
		} /*Payload*/, securityCfg.token.secret, {
			expiresIn: securityCfg.token.expiresIn
		} /*Options*/);
	},


	//========================
	// Verify token
	//========================
	verifyToken: function(token, callback) {
		jwt.verify(token, securityCfg.token.secret, function(err, decoded) {
			if (err) return callback(err);
			return callback(null, decoded);
		});
	}
}
