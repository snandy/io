~function(window, undefined) {

var IO = {}
var toString = Object.prototype.toString

// Iterator
function forEach(obj, iterator, context) {
	if ( obj.length === +obj.length ) {
		for (var i=0; i<obj.length; i++) {
			if (iterator.call(context, obj[i], i, obj) === true) return
		}
	} else {
		for (var k in obj) {
			if (iterator.call(context, obj[k], k, obj) === true) return
		}
	}
}

// IO.isArray, IO.isBoolean, ...
forEach(['Array', 'Boolean', 'Function', 'Object', 'String', 'Number', 'RegExp'], function(name) {
	IO['is' + name] = function(obj) {
		return toString.call(obj) === '[object ' + name + ']'
	}
})

// object to queryString
function serialize(obj) {
	var a = []
	forEach(obj, function(val, key) {
		if ( IO.isArray(val) ) {
			forEach(val, function(v, i) {
				a.push( key + '=' + encodeURIComponent(v) )
			})
		} else {
			a.push(key + '=' + encodeURIComponent(val))
		}
	})
	return a.join('&')
}

// parse json string
function JSONParse(str) {
	try {
		return JSON.parse(str)
	} catch(e) {
		try {
			return (new Function('return ' + str))()
		} catch(e) {
		}
	}
}
	
// empty function
function noop() {}

