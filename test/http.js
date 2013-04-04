var url = require('url');
var qs  = require('querystring');
var http = require('http');

var server = http.createServer(function(request, response) {
	var repsHeader = {
		'Access-Control-Allow-Origin': '*',
		"Content-Type": "text/html"
	}
    response.writeHead(200, repsHeader);
	var parts = url.parse(request.url,true);
	console.log(parts.query);
    // response.write('{name: "snandy"}');
    response.write(parts.query.callback + '({name: "snandy"})');
    response.end();
});
server.listen(8081);