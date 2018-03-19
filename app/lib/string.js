String.prototype.isAlphaNumeric = function() {
	return this.match(/^[a-zA-Z0-9]+$/);
}

String.prototype.isEmail = function() {
	// Regular expression by http://emailregex.com
	var regEx = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
	return this.match(regEx);
}
