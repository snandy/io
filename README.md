## Ajax API

+ 执行基本ajax请求, 返回XMLHttpRequest
	<pre>
	IO.ajax(url, {
		async      是否异步 true(默认)
		method     请求方式 POST or GET(默认)
		type       数据格式 json(默认) or xml or text
		encode     请求的编码 UTF-8(默认)
		timeout    请求超时时间 0(默认)
		credential 跨域请求时是否带证书(默认false，不带http认证信息如cookie)
		data       请求参数 (字符串或json)
		scope      成功回调执行上下文
		success    请求成功后响应函数 参数为text,json,xml数据
		failure    请求失败后响应函数 参数为xmlHttp, msg, exp
	})
	</pre>

+ 也可只传一个配置对象
	<pre>
	IO.ajax({
		url        请求
		async      是否异步 true(默认)
		method     请求方式 POST or GET(默认)
		...
	})
	</pre>
		
+ 执行ajax请求, 返回纯文本
	<pre>
	IO.text(url, {
		...
	})
	</pre>
	
+ 执行ajax请求, 返回JSON
	<pre>
	IO.json(url, {
		...
	})
	</pre>
	
+ 执行ajax请求, 返回XML
	<pre>
	IO.xml(url, {
		...
	})
	</pre>
	
+ GET 请求
	<pre>
	IO.get(url, {
		...
	})
	</pre>

+ POST 请求
	<pre>
	IO.post(url, {
		...
	})
	</pre>

+ 简写
	<pre>
	IO.get(url)
	IO.get(url, success)
	IO.get(url, data, success)
	
	IO.post(url)
	IO.post(url, success)
	IO.post(url, data, success)
	</pre>


## JSONP API

+ 两个参数
	<pre>
	IO.jsonp(url, {
		param     // 请求参数 (键值对字符串或js对象)
		success   // 请求成功回调函数
		failure   // 请求失败回调函数
		scope     // 回调函数执行上下文
		timestamp // 是否加时间戳
		jsonpCallback // 指定回调函数名称，不使用随机函数名，用在缓存时，此时timestamp应该设为false
	})
	</pre>
	
+ 一个参数
	<pre>
	IO.jsonp({
		url       // 请求url 
		param     // 请求参数 (键值对字符串或js对象)
		success   // 请求成功回调函数
		failure   // 请求失败回调函数
		scope     // 回调函数执行上下文
		timestamp // 是否加时间戳
		jsonpCallback // 指定回调函数名称，不使用随机函数名，用在缓存时，此时timestamp应该设为false
	})
	</pre>
	
+ 简写
	<pre>
		IO.jsonp(url)
		IO.jsonp(url, success)
		IO.jsonp(url, data, success)
	</pre>
	