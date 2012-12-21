/**
 * JavaScript JSONP tool
 * Copyright (c) 2011 snandy
 * 
 * 增加对请求失败的处理，虽然这个功能用处不太大，但研究了各个浏览器下script的差异性
 * 1, IE6/7/8 支持script的onreadystatechange事件
 * 2, IE9/10 支持script的onload和onreadystatechange事件
 * 3, Firefox/Safari/Chrome/Opera支持script的onload事件
 * 4, IE6/7/8/Opera 不支持script的onerror事件; IE9/10/Firefox/Safari/Chrome支持
 * 5, Opera虽然不支持onreadystatechange事件,但其具有readyState属性.这点甚是神奇
 * 6, 用IE9和IETester测试IE6/7/8，其readyState总为loading,loaded。没出现过complete。
 * 
 * 最后的实现思路：
 * 1, IE9/Firefox/Safari/Chrome 成功回调使用onload事件，错误回调使用onerror事件
 * 2, Opera 成功回调也使用onload事件（它压根不支持onreadystatechange），由于其不支持onerror，这里使用了延迟处理。
 *	即等待与成功回调success，success后标志位done置为true。failure则不会执行，否则执行。
 *	这里延迟的时间取值很有技巧，之前取2秒，在公司测试没问题。但回家用3G无线网络后发现即使所引用的js文件存在，但由于
 *	网速过慢，failure还是先执行了，后执行了success。所以这里取5秒是比较合理的。当然也不是绝对的。
 * 3, IE6/7/8 成功回调使用onreadystatechange事件，错误回调几乎是很难实现的。也是最有技术含量的。
 *	参考了http://stackoverflow.com/questions/3483919/script-onload-onerror-with-iefor-lazy-loading-problems
 *	使用nextSibling，发现不能实现。
 *	令人恶心的是，即使请求的资源文件不存在。它的readyState也会经历“loaded”状态。这样你就没法区分请求成功或失败。
 *	怕它了，最后使用前后台一起协调的机制解决最后的这个难题。无论请求成功或失败都让其调用callback(true)。
 *	此时已经将区别成功与失败的逻辑放到了callback中，如果后台没有返回jsonp则调用failure，否则调用success。
 *	
 * 
 * 接口
 * Sjax.debug = true; // 开启调试模式
 * 
 * Sjax.get({
 *	url	      // 请求url 
 *	param	  // 请求参数 (键值对字符串或js对象)
 *	success   // 请求成功回调函数
 *	failure   // 请求失败回调函数
 *	scope	  // 回调函数执行上下文
 *	timestamp // 是否加时间戳
 *  jsonpCallback // 指定回调函数名称，不使用随机函数名，用在缓存时，此时timestamp应该设为false
 * });
 * 
 * 后台接受一个callback参数，为响应函数
 * 格式： snandy_jsonp_xxx(json)
 */

Sjax = function(global) {
		
var ie678 = !-[1,],
	opera = global.opera,
	doc = global.document,
	head = doc.head || doc.getElementsByTagName('head')[0],
	timeout = 3000, done = false

function paramsToString(obj) {
	var a = [], key, val
	for (key in obj) {
		val = obj[key]
		if (val.constructor === Array) {
			for(var i = 0, len = val.length; i < len; i++) {
				a.push(key + '=' + encodeURIComponent(val[i]))
			}
		} else {
			a.push(key + '=' + encodeURIComponent(val))
		}
	}
	return a.join('&')
}
//Thanks to Kevin Hakanson
//http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript/873856#873856
function generateRandomName() {
	var uuid = '', s = [], i = 0, hexDigits = '0123456789ABCDEF'
	for (i = 0; i < 32; i++) {
		s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1)
	}
	// bits 12-15 of the time_hi_and_version field to 0010
	s[12] = '4'
	// bits 6-7 of the clock_seq_hi_and_reserved to 01	
	s[16] = hexDigits.substr((s[16] & 0x3) | 0x8, 1)
	uuid = 'snandy_jsonp_' + s.join('')
	return uuid
}

function noop() {}

var target = {
	debug: false,
	log: function(msg) {
		if (global.console && this.debug) {
			global.console.log(msg)
		}
	},
	get: function(options) {
		if (!options || !options.url) {
			return
		}
		var me      = this, 
			url     = options.url,
			param   = options.param,
			success = options.success || noop,
			failure = options.failure || noop,
			scope   = options.scope || global,
			timestamp = options.timestamp,
			callbackName = options.jsonpCallback || generateRandomName()
		
		if (param && typeof param === 'object') {
			param = paramsToString(param)
		}
		var script = doc.createElement('script')
		
		function callback(isSucc) {
			if (isSucc) {
				done = true
				me.log('Request success!')
			} else {
				failure.call(scope)
				me.log('Request failed!')
			}
			// Handle memory leak in IE
			script.onload = script.onerror = script.onreadystatechange = null
			if ( head && script.parentNode ) {
				head.removeChild(script)
				script = null
				global[callbackName] = undefined
				me.log("Garbage collecting!")
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
			}
			
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
		if (param) {
			url += '?' + param
		}
		if (timestamp) {
			if (param) {
				url += '&ts='
			} else {
				url += '?ts='
			}
			url += (new Date).getTime()
		}
		
		global[callbackName] = function(json) {
			success.call(scope, json)
		}
		
		url += '&callback=' + callbackName
		this.log('Getting JSONP data')
		script.src = url
		head.insertBefore(script, head.firstChild)
	}
}

return target
}(this);
