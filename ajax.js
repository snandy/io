/*******************************************************************************************************
 *
 * 1 使用新API解析JSON，对解析JSON出现可能出现的异常进行了处理
 * 2 超时处理做了修改，先给isTimeout赋值，再调用abort（不采用条件status==0指定超时）
 * 3 XHR创建方式修改（勿重复检测浏览器http://www.cnblogs.com/snandy/archive/2011/05/24/2055048.html）
 * 4 增加scope参数，success可指定上下文
 * 5 接口方式修改，增加get，post方法
 * 
 * 
 *******************************************************************************************************/

/**
 * JavaScript Ajax tool
 * 
 * 1,执行基本ajax请求,返回XMLHttpRequest
 * Ajax.request(url, {
 *	 async   是否异步 true(默认)
 *	 method  请求方式 POST or GET(默认)
 *	 type	  数据格式 text(默认) or xml or json
 *	 encode  请求的编码 UTF-8(默认)
 *	 timeout 请求超时时间 0(默认)
 *	 data	  请求参数 (字符串或json)
 *	 scope   成功回调执行上下文
 *	 success 请求成功后响应函数 参数为text,json,xml数据
 *	 failure 请求失败后响应函数 参数为xmlHttp, msg, exp
 * });
 * 
 * 2,执行ajax请求,返回纯文本
 * Ajax.text(url,{
 *		 ...
 * });
 * 
 * 3,执行ajax请求,返回JSON
 * Ajax.json(url,{
 *		 ...
 * });
 * 
 * 4,执行ajax请求,返回XML
 * Ajax.xml(url,{
 *		 ...
 * });
 */

Ajax = function(window, undefined) {

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

function noop() {}

function serialize(obj) {
	var a = [], key, val
	for (key in obj) {
		val = obj[key]
		if (val.constructor === Array) {
			for (var i = 0, len = val.length; i<len; i++) {
				a.push(key + '=' + encodeURIComponent( val[i]) )
			}
		} else {
			a.push(key + '=' + encodeURIComponent(val))
		}
	}
	
	return a.join('&')
}

function request(url, opt) {
	if (typeof url === 'object') {
		opt = url
		url = opt.url
	}
	var xhr, isTimeout, timer, opt = opt || {}
	var async   = opt.async !== false,
		method  = opt.method  || 'GET',
		type	= opt.type	  || 'text',
		encode  = opt.encode  || 'UTF-8',
		timeout = opt.timeout || 0,
		data	= opt.data,
		scope   = opt.scope,
		success = opt.success || noop,
		failure = opt.failure || noop
		
	method  = method.toUpperCase()
	// 对象转换成字符串键值对
	if (data && typeof data === 'object') {
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
				failure(xhr,'request timeout')
			} else {
				onStateChange(xhr, type, success, failure, scope)
				clearTimeout(timer)
			}
		}
	}
	xhr.open(method,url,async)
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
				result = function(str) {
					try {
						return JSON.parse(str)
					} catch(e) {
						try {
							return (new Function('return ' + str))()
						} catch(e) {
							failure(xhr,'parse json error', e)
						}
					}
				}(xhr.responseText)
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

return (function() {
	var Ajax = {request: request}, types = ['text','json','xml']
	for (var i = 0, len = types.length; i<len; i++) {
		Ajax[ types[i] ] = function(i) {
			return function(url, opt) {
				opt = opt || {}
				opt.type = types[i]
				return request(url, opt)
			}
		}(i)
	}
	return Ajax
})()

}(this);