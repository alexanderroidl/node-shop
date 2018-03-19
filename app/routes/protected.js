module.exports = function(app, responseHandler) {
	//========================
	// Account
	//========================
	app.get('/account', function(req, res) {
		console.log("/account GET request");

		responseHandler.account(req.decoded, function(err, data) {
			if(err) {
				res.json({
					success: false,
					message: err
				});
			} else {
				res.json({
					success: true,
					data: data
				});
			}
		});
	});


	//========================
	// Addresses
	//========================
	app.get('/addresses', function(req, res) {
		console.log("/addresses GET request");

		responseHandler.addresses.all(req.decoded, function(err, data) {
			if(err) {
				res.json({
					success: false,
					message: err
				})
			} else {
				res.json({
					success: true,
					data: data
				});
			}
		});
	});


	//========================
	// Add address
	//========================
	app.post('/addresses/add', function(req, res) {
		console.log("/addresses/add POST request");

		var userId = req.body.user_id;

		var firstName = req.body.first_name;
		var lastName = req.body.last_name;
		var street = req.body.street;
		var streetNr = req.body.street_nr;
		var city = req.body.city;
		var zip = req.body.zip;
		var planet = req.body.planet;
		var dimension = req.body.dimension;
		var additional = req.body.additional;

		responseHandler.addresses.add(
			req.decoded,
			userId,

			firstName,
			lastName,
			street,
			streetNr,
			city,
			zip,
			planet,
			dimension,
			additional,

			function(err, data) {
				if(err) {
					res.json({
						success: false,
						message: err
					})
				} else {
					res.json({
						success: true,
						message: 'Address successfully added',
						data: data
					});
				}
			}
		);
	});


	//========================
	// Pay methods
	//========================
	app.get('/paymethods', function(req, res) {
		console.log("/paymethods GET request");

		responseHandler.paymethods.all(req.decoded, function(err, data) {
			if(err) {
				res.json({
					success: false,
					message: err
				})
			} else {
				res.json({
					success: true,
					data: data
				});
			}
		});
	});


	//========================
	// Add pay method
	//========================
	app.post('/paymethods/add', function(req, res) {
		console.log("/paymethods/add POST request");

		var type = req.body.type;
		var data = req.body.data;

		responseHandler.paymethods.add(req.decoded, type, data, function(err, data) {
			if(err) {
				res.json({
					success: false,
					message: err
				})
			} else {
				res.json({
					success: true,
					message: 'Pay method successfully added',
					data: data
				});
			}
		});
	});


	//========================
	// New purchase
	//========================
	app.post('/purchases/new', function(req, res) {
		console.log("/purchases/new POST request");

		var payMethodId = req.body.paymethod_id;
		var addressId = req.body.address_id;
		var products = req.body.data;
		var preview = req.body.preview;

		responseHandler.purchases.add(req.decoded, payMethodId, addressId, products, preview, function(err, data) {
			if(err) {
				res.json({
					success: false,
					message: err
				})
			} else {
				res.json({
					success: true,
					message: preview ? '' : 'Purchase was successfull!',
					data: data
				});
			}
		});
	});


	//========================
	// Get purchases
	//========================
	app.get('/purchases', function(req, res) {
		console.log("/purchases GET request");

		responseHandler.purchases.all(req.decoded, function(err, data) {
			if(err) {
				res.json({
					success: false,
					message: err
				})
			} else {
				res.json({
					success: true,
					data: data
				});
			}
		});
	});


	//========================
	// Get purchase
	//========================
	app.get('/purchases/:id', function(req, res) {
		var purchaseId = req.params.id;

		console.log(`/purchases/${purchaseId} GET request`);

		responseHandler.purchases.byId(req.decoded, purchaseId, function(err, data) {
			if(err) {
				res.json({
					success: false,
					message: err
				})
			} else {
				res.json({
					success: true,
					data: data
				});
			}
		});
	});


	//========================
	// PDF from purchase
	//========================
	app.get('/purchases/:id/pdf', function(req, res) {
		var token = req.decoded;

		var purchaseId = req.params.id;

		console.log(`/purchases/${purchaseId}/pdf GET request`);

		responseHandler.purchases.pdf(token, purchaseId, function(err, stream) {
			if(err) {
				res.json({
					success: false,
					message: err
				})
			} else {
				var filename = `purchase_${purchaseId}.pdf`;

				res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
				res.setHeader('Content-Type', 'application/pdf');

				stream.pipe(res);
			}
		});
	});
}
