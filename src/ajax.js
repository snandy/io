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
	
function ajax(url, options) {
	if ( IO.isObject(url) ) {
		options = url
		url = options.url
	}
	if ( IO.isFunction(options) ) {
		options = {success: options}
	}
	var xhr, isTimeout, timer, options = options || {}
	var async      = options.async !== false,
		method     = options.method  || 'GET',
		type       = options.type    || 'json',
		encode     = options.encode  || 'UTF-8',
		timeout    = options.timeout || 0,
		credential = options.credential,
		data	   = options.data,
		scope      = options.scope,
		success    = options.success || noop,
		failure    = options.failure || noop
	
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
	type: ['text','json','xml'],
	async: ['sync', 'async']
}

// Low-level Interface: IO.ajax
IO.ajax = ajax

// Shorthand Methods: IO.get, IO.post, IO.text, IO.json, IO.xml
forEach(options, function(val, key) {
	forEach(val, function(item, index) {
		IO[item] = function(key, item) {
			return function(url, opt, success) {
				if ( IO.isObject(url) ) {
					opt = url
				}
				if ( IO.isFunction(opt) ) {
					opt = {success: opt}
				}
				if ( IO.isFunction(success) ) {
					opt = {data: opt}
					opt.success = success
				}
				if (key === 'async') {
					item = item==='async' ? true : false
				}
				opt = opt || {}
				opt[key] = item
				return ajax(url, opt)
			}
		}(key, item)
	})
})

}(IO)
