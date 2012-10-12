## Ajax API

+ 执行基本ajax请求, 返回XMLHttpRequest
	<pre>
	Ajax.request(url, {
		async   是否异步 true(默认)
		method  请求方式 POST or GET(默认)
		type	数据格式 text(默认) or xml or json
		encode  请求的编码 UTF-8(默认)
		timeout 请求超时时间 0(默认)
		data	请求参数 (字符串或json)
		scope   成功回调执行上下文
		success 请求成功后响应函数 参数为text,json,xml数据
		failure 请求失败后响应函数 参数为xmlHttp, msg, exp
	})
	</pre>
	
+ 执行ajax请求, 返回纯文本
	<pre>
	Ajax.text(url, {
		...
	})
	</pre>
	
+ 执行ajax请求, 返回JSON
	<pre>
	Ajax.json(url,{
		...
	})
	</pre>
	
+ 执行ajax请求, 返回XML
	<pre>
	Ajax.xml(url,{
		...
	})
	</pre>
	
## JSONP API
	Sjax.debug = true; // 开启调试模式
	Sjax.get({
		url	      // 请求url 
		param	  // 请求参数 (键值对字符串或js对象)
		success   // 请求成功回调函数
		failure   // 请求失败回调函数
		scope	  // 回调函数执行上下文
		timestamp // 是否加时间戳
		jsonpCallback // 指定回调函数名称，不使用随机函数名，用在缓存时，此时timestamp应该设为false
	})
