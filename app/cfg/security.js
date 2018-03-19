module.exports = {
	// Password hashing
	passwordSaltRounds: 10,

	// PBKGF
	pbkdf: {
		secret: 'fakedoors.com',
		rounds: 1000
	},
	
	// Tokens
	token: {
		secret: 'RICKandMORTY4242',
		expiresIn: '24h'
	}
}
