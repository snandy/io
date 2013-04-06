var url = require('url')
var qs  = require('querystring')
var http = require('http')
var path = require('path')

var server = http.createServer(function(req, res) {
	var resHeader = {
		"Content-Type": "text/html"
	}
	var pages = [
		{route: '', output: 'Woohoo!'},
		{route: 'about', output: 'A simple routing with Node example'},
		{route: 'page1', output: function() {
			return 'Here\'s ' + this.route
		}}
	]
	var lookup = path.basename( decodeURI(req.url) )
	pages.forEach(function(page) {
		if (page.route === lookup) {
			res.writeHead(200, resHeader)
			var output = typeof page.output === 'function' ? page.output() : page.output
			output += '<br>' + lookup + '<br>' + req.url
			res.end(output)
		}
	})
	if (!res.finished) {
		res.writeHead(404)
		res.end('Page not Found!')
	}
});
server.listen(8081)