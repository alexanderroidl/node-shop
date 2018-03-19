module.exports = function(app, responseHandler) {
	app.post('/products/add', function(req, res) {
		var name = req.body.name;
		var fullName = req.body.full_name;
		var price = req.body.price;
		var description = req.body.description;
		var imagePath = req.body.image_path;
		var quantity = req.body.quantity;

		console.log("/products/add POST request");

		responseHandler.products.add(
			req.decoded,
			name, fullName, price, description, imagePath, quantity,

			function(err, data) {
				if(err) {
					res.json({
						success: false,
						message: err
					});
				} else {
					res.json({
						success: true,
						message: 'Product successfully added',
						data: data
					});
				}
			});
	});
}
