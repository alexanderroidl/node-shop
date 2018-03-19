module.exports = {
	user: function(row) {
		return {
			id: row.ID,
			username: row.Username,
			email: row.Email,
			firstName: row.FirstName,
			lastName: row.LastName,
			admin: row.IsAdmin
		};
	},

	product: function(row) {
		return {
			id: row.ID,
			name: row.Name,
			fullName: row.FullName,
			price: row.Price,
			description: row.Description,
			imagePath: row.ImagePath,
			quantity: row.Quantity
		};
	},

	address: function(row) {
		return {
			id: row.ID,
			userId: row.UserID,
			firstName: row.FirstName,
			lastName: row.LastName,
			street: row.Street,
			streetNr: row.StreetNr,
			city: row.City,
			zip: row.ZIP,
			dimension: row.Dimension,
			planet: row.Planet,
			additional: row.Additional
		};
	},

	payMethod: function(row) {
		return {
			id: row.ID,
			userId: row.UserID,
			type: row.Type,
			data: row.Data
		};
	},

	purchase: function(row) {
		return {
			id: row.ID,
			userId: row.UserID,
			payMethod: row.Paymethod,
			address: JSON.parse(row.Address),
			items: JSON.parse(row.Data),
			total: row.Total,
			time: row.Time
		}
	}
}
