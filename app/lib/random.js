module.exports = {
	max: function(max) {
		return Math.floor(Math.random() * max);
	},

	range: function(min, max) {
		return Math.floor(Math.random() * (max - min + 1)) + min;
	},

	bool: function() {
		return Math.random() >= 0.5;
	}
}
