module.exports = {
	root: {
		password: 'root'
	},

	users: {
		max: 200,
		nameMinLength: 8,
		password: "g3t5chw1f7y",

		adresses: {
			min: 1,
			max: 1
		},
		purchases: {
			min: 0,
			max: 4
		},
		paymethods: {
			min: 0,
			max: 2
		},
	},

	adresses: {
		maxNumber: 100
	},
	
	products: {
		min: 300,
		max: 300,

		price: {
			min: 5,
			max: 1000,
			digits: 2
		},

		quantity: {
			min: 0,
			max: 200
		}
	}
}
