const PDFCfg  = require('../cfg/pdf');

var pdf 	  = require('html-pdf');
var pug		  = require('pug');
var path	  = require('path');
var base64Img = require('base64-img');

module.exports = {
	render: function(user, purchase, callback) {
		var dir = path.resolve(__dirname) + '/';

		// Base64 encode images
		b64Img = {
			header: base64Img.base64Sync(dir + "img/header.jpg"),
			th: base64Img.base64Sync(dir + "img/th.jpg")
		};

		// Render HTML
		var html = pug.renderFile(dir + 'pug/template.pug', {
			base64Img: b64Img,

			user: user,
			purchaseId: purchase.id,
			payMethod: purchase.payMethod,
			address: purchase.address,
			time: purchase.time,
			items: purchase.items,
			total: purchase.total
		});

		// Create PDF
		pdf.create(html, {
			border: {
		      top: PDFCfg.border.top + 'cm',
		      right: PDFCfg.border.right + 'cm',
		      bottom: PDFCfg.border.bottom + 'cm',
		      left: PDFCfg.border.left + 'cm'
		    },

			footer: {
			  height: PDFCfg.footer.height + 'cm',
			  contents: `<footer>${PDFCfg.footer.html}</footer>`
			}
		}).toStream(function(err, stream){
			callback(stream);
		});
	}
}
