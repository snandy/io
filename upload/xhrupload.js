/*
 * 	XHRUpload(input, {
 *		// url: '/web/servlet/XHRUpload',
 *		url: '/upload',
 * 		filePostName: 上传文件名 对应于后台的(默认 “file”)
 *		fileType: /(?:png|jpg|jpeg|gif)/,
 * 		credential: 跨域请求时是否带证书(默认false，不带http认证信息如cookie) 
 *		params: {
 *			name: 'aaa',
 *			age: 33
 *		},
 *		success: function() {
 *			console.log('success')
 *		},
 *		progress: function(position, totalSize) {
 *			console.log('progress' + position)
 *			console.log('progress' + totalSize)
 *			//pp.width =  position+'%';
 *		},
 *		failure: function() {
 *			console.log('error')
 *		}
 *	}) 
 *
 */
XHRUpload = function(input, settings) {

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

// empty function
function noop() {}

var exports = {
	init: function(input, settings) {
		var me = this
		if (!input || input.nodeName !== 'INPUT') {
			return
		}
		settings || (settings = {})
		
		this.guid = 0
		this.xhrs = {}
		// 上传按钮
		this.input = input
		// 上传url
		this.url = settings.url
		// 上传文件名 对应于后台的
		this.filePostName = settings.filePostName || 'file'
		// 请求参数，JS对象类型
		this.params = settings.params
		// 允许的单个文件大小 10M
		this.maximize = settings.maximize || 10 * 1024 * 1024
		// 允许一次上传的文件数量
		this.maximum  = settings.maximum || 5
		// 允许上传的文件类型 正则
		this.fileType = settings.fileType || /\S/
		// 跨域带证书
		this.credential = settings.credential
		// 进度函数
		this.progress = settings.progress || noop
		// 成功函数
		this.success  = settings.success || noop
		// 失败函数
		this.failure  = settings.failure || noop

		this.checkMaximize = settings.checkMaximize || noop

		this.checkMaximun  = settings.checkMaximun || noop

		this.checkFileType = settings.checkFileType || noop
		
		this.fileQueued = settings.fileQueued || noop

		input.onchange = function(e) {
			var i = 0
			var files = this.files
			if (files.length > me.maximum) {
				me.checkMaximun()
				return
			}
			var filter = me.preprocess(files)
			if (filter.sizes.length > 0) {
				me.checkMaximize(filter.sizes)
				return
			}
			if (filter.types.length > 0) {
				me.checkFileType(filter.types)
				return
			}
			
			// 不要一个循环一次全部提交，间隔500ms，性能考虑，一次提交N多请求容易alort
			var timer = setInterval(sched, 500)
			function sched() {
				var file = files[i],
					xhr = new XMLHttpRequest()
					
				if (!file) {
					clearInterval(timer)
					input.value = ''
				} else {
					file.id = me.guid++
					me.fileQueued(file, xhr)
					me.request(file, xhr)
					me.xhrs[file.id] = xhr
				}
				i++
			}
		}
		return this
	},
	preprocess: function(files) {
		var a1 = [],
			a2 = [],
			type = this.fileType
			
		forEach(files, function(file) {
			if (file.size > this.maximize) {
				a1.push(file)
			}
			if (!type.test(file.type)) {
				a2.push(file)
			}
		})
		return {sizes: a1, types: a2}
	},
	request: function(file, xhr) {
		var me = this, 
			params = me.params;
			
		xhr.upload.onprogress = function(e) {
			if (e.lengthComputable) {
				me.progress(file, e.loaded, e.total)
			}
		}
		xhr.addEventListener('readystatechange', function() {
			if (xhr.readyState === 4) {
				if (xhr.status === 200) {
					var data = JSON.parse(xhr.responseText)
					me.success(file, data)
				} else {
					me.failure()
				}
			}
		}, false)
		xhr.addEventListener('error', function(e) {
			me.failure()
		}, false)
		
		if (this.credential) {
			xhr.withCredentials = true
		}
		xhr.open('POST', me.url, true)
		
		var key, form = new FormData()
		form.append(this.filePostName, file)
		// params
		for (key in params) {
			form.append(key, params[key])
		}
		xhr.send(form)
	},
	cancel: function(fileId) {
		this.xhrs[fileId].abort()
	}
}

exports.init(input, settings)
return exports

};