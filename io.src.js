/*!
 * io.js v0.1.0
 * https://github.com/snandy/io
 * @snandy 2013-04-03 17:09:55
 *
 */
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
forEach(['Array', 'Boolean', 'Function', 'Object', 'String', 'Number'], function(name) {
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


/**
 *  Ajax API
 * 	IO.ajax, IO.get, IO.post, IO.text, IO.json, IO.xml
 *  
 */
~function(IO) {
	
var createXHR = window.XMLHttpRequest ?
	function() {
		try{
			return new window.XMLHttpRequest()
		} catch(e){}
	} :
	function() {
		try{
			return new window.ActiveXObject('Microsoft.XMLHTTP')
		} catch(e){}
	}
	
function ajax(url, opt) {
	if ( IO.isObject(url) ) {
		opt = url
		url = opt.url
	}
	var xhr, isTimeout, timer, opt = opt || {}
	var async      = opt.async !== false,
		method     = opt.method  || 'GET',
		type       = opt.type	  || 'text',
		encode     = opt.encode  || 'UTF-8',
		timeout    = opt.timeout || 0,
		credential = opt.credential,
		data	   = opt.data,
		scope      = opt.scope,
		success    = opt.success || noop,
		failure    = opt.failure || noop
	
	// 大小写都行，但大写是匹配HTTP协议习惯
	method  = method.toUpperCase()
	
	// 对象转换成字符串键值对
	if ( IO.isObject(data) ) {
		data = serialize(data)
	}
	if (method === 'GET' && data) {
		url += (url.indexOf('?') === -1 ? '?' : '&') + data
	}
	
	xhr = createXHR()
	if (!xhr) {
		return
	}
	
	isTimeout = false
	if (async && timeout>0) {
		timer = setTimeout(function() {
			// 先给isTimeout赋值，不能先调用abort
			isTimeout = true
			xhr.abort()
		}, timeout)
	}
	xhr.onreadystatechange = function() {
		if (xhr.readyState === 4) {
			if (isTimeout) {
				failure(xhr, 'request timeout')
			} else {
				onStateChange(xhr, type, success, failure, scope)
				clearTimeout(timer)
			}
		}
	}
	xhr.open(method, url, async)
	if (credential) {
		xhr.withCredentials = true
	}
	if (method == 'POST') {
		xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded;charset=' + encode)
	}
	xhr.send(data)
	return xhr
}

function onStateChange(xhr, type, success, failure, scope) {
	var s = xhr.status, result
	if (s>= 200 && s < 300) {
		switch (type) {
			case 'text':
				result = xhr.responseText
				break
			case 'json':
				result = JSONParse(xhr.responseText)
				break
			case 'xml':
				result = xhr.responseXML
				break
		}
		// text, 返回空字符时执行success
		// json, 返回空对象{}时执行suceess，但解析json失败，函数没有返回值时默认返回undefined
		result !== undefined && success.call(scope, result)
		
	} else {
		failure(xhr, xhr.status)
	}
	xhr = null
}

// exports to IO
var options = {
	method: ['get', 'post'],
	type: ['text','json','xml']
}

// Low-level Interface: IO.ajax
IO.ajax = ajax

// Shorthand Methods: IO.get, IO.post, IO.text, IO.json, IO.xml
forEach(options, function(val, key) {
	forEach(val, function(item, index) {
		IO[item] = function(key, item) {
			return function(url, opt) {
				if ( IO.isObject(url) ) {
					opt = url
				}
				opt = opt || {}
				opt[key] = item
				return ajax(url, opt)
			}
		}(key, item)
	})
})

}(IO)

/**
 *  JSONP API
 *  IO.jsonp
 *  
 */
~function(IO) {
	
var ie678 = !-[1,],
	opera = window.opera,
	doc = window.document,
	head = doc.head || doc.getElementsByTagName('head')[0],
	timeout = 3000, 
	done = false

//Thanks to Kevin Hakanson
//http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript/873856#873856
function generateRandomName() {
	var uuid = '', s = [], i = 0, hexDigits = '0123456789ABCDEF';
	for (i = 0; i < 32; i++) {
		s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
	}
	// bits 12-15 of the time_hi_and_version field to 0010
	s[12] = '4';
	// bits 6-7 of the clock_seq_hi_and_reserved to 01	
	s[16] = hexDigits.substr((s[16] & 0x3) | 0x8, 1);
	uuid = 'jsonp_' + s.join('');
	return uuid;
}

function jsonp(url, options) {
	if ( IO.isObject(url) ) {
		options = url;
		url = options.url;
	}
	var me      = this, 
		url     = url + '?',
		param   = options.param,
		charset = options.charset,
		success = options.success || noop,
		failure = options.failure || noop,
		scope   = options.scope || window,
		timestamp = options.timestamp,
		jsonpName = options.jsonpName || 'callback',
		callbackName = options.jsonpCallback || generateRandomName()
	
	if ( IO.isObject(param) ) {
		param = serialize(param)
	}
	var script = doc.createElement('script')
	
	function callback(isSucc) {
		if (isSucc) {
			done = true
		} else {
			failure.call(scope)
		}
		// Handle memory leak in IE
		script.onload = script.onerror = script.onreadystatechange = null
		if ( head && script.parentNode ) {
			head.removeChild(script)
			script = null
			window[callbackName] = undefined
		}
	}
	function fixOnerror() {
		setTimeout(function() {
			if (!done) {
				callback()
			}
		}, timeout)
	}
	if (ie678) {
		script.onreadystatechange = function() {
			var readyState = this.readyState
			if (!done && (readyState == 'loaded' || readyState == 'complete')) {
				callback(true)
			}
		};
		
	} else {
		script.onload = function() {
			callback(true)
		}
		script.onerror = function() {
			callback()
		}
		if (opera) {
			fixOnerror()
		}
	}
	
	url += jsonpName + '=' + callbackName
	
	if (charset) {
		script.charset = charset
	}
	if (param) {
		url += '&' + param
	}
	if (timestamp) {
		url += '&ts='
		url += (new Date).getTime()
	}
	
	window[callbackName] = function(json) {
		success.call(scope, json)
	};
	
	script.src = url
	head.insertBefore(script, head.firstChild)
}

IO.jsonp = jsonp

}(IO)


window.IO = IO

}(this);
