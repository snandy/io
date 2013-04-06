var url = require('url');
var path = require('path');

var str = 'http://localhost:8081?name=snandy&age=28',
	str2 = 'http://localhost:8081/a/b/c'

var obj = url.parse(str, false);

console.log(obj)

var name = path.basename(str2)
console.log(name)
