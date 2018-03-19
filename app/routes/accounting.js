module.exports = function(app, responseHandler) {
	//========================
	// Login
	//========================
	app.post('/login', function (req, res) {
		var username 	= req.body.username;
		var email 		= req.body.email;
		var password 	= req.body.password;
		var clientHash  = req.body.client_hash;

		console.log("/login POST request");

		responseHandler.login(username, email, password, clientHash, function(err, data) {
			if(err) {
				res.json({
					success: false,
					message: err
				})
			} else {
				res.json({
					success: true,
					message: 'Login successfull',
					data: data
				});
			}
		});
	});


	//========================
	// Register
	//========================
	app.post('/register', function (req, res) {
		var username 	= req.body.username;
		var email 		= req.body.email;
		var firstName 	= req.body.first_name;
		var lastName 	= req.body.last_name;
		var pass 		= req.body.password;
		var passRepeat 	= req.body.password_repeat;
		var clientHash  = req.body.client_hash;

		console.log("/register POST request");

		responseHandler.register(username, email, firstName, lastName, pass, passRepeat, clientHash, function(err, data) {
			if(err) {
				res.json({
					success: false,
					message: err
				});
			} else {
				res.json({
					success: true,
					message: 'Register successfull'
				});
			}
		});
	});
}
