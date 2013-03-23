/*
 * 	FileUpload.init(input, {
 *		// url: '/web/servlet/FileUpload',
 *		url: '/upload',
 *		fileType: /(?:png|jpg|jpeg|gif)/,
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
 
FileUpload = function(){
	
function noop() {}

var FileUpload = {
	init: function(input, options) {
		var me = this
		if (!input || input.nodeName !== 'INPUT') {
			return
		}
		options || (options = {})

		// 上传按钮
		this.input = input
		// 上传url
		this.url = options.url
		// 请求参数，JS对象类型
		this.params = options.params
		// 允许的单个文件大小 10M
		this.maximize = options.maximize || 10 * 1024 * 1024
		// 允许一次上传的文件数量
		this.maximum  = options.maximum || 5
		// 允许上传的文件类型 正则
		this.fileType = options.fileType || /\S/
		// 进度函数
		this.progress = options.progress || noop
		// 成功函数
		this.success  = options.success || noop
		// 失败函数
		this.failure  = options.failure || noop

		this.checkMaximize = options.checkMaximize || noop

		this.checkMaximun  = options.checkMaximun || noop

		this.checkFileType = options.checkFileType || noop

		input.onchange = function(e) {
			var file, files = this.files, i = 0
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

			// 不要一个循环一次全部提交，间隔100ms，性能考虑，一次提交N多请求容易alort
			var timer = setInterval(sched, 100)
			function sched() {
				file = files[i]
				me.request(file)
				if (!file) {
					clearInterval(timer)
					input.value = ''
				}
				i++
			}
		}
		return this
	},
	preprocess: function(files) {
		var file, len = files.length
		var a1 = [], a2 = []
		for (var i=0; i<len; i++) {
			file = files[i]
			console.log(typeof file.size)
			if (file.size > this.maximize) {
				a1.push(file)
			}
			if (!this.fileType.test(file.type)) {
				a2.push(file)
			}
		}
		return {sizes: a1, types: a2}
	},
	request: function(file) {
		var me = this, params = me.params, xhr = new XMLHttpRequest()
		
		xhr.addEventListener('progress', function(e) {
			if (e.lengthComputable) {
				me.progress(e.position, e.totalSize)
			}
		}, false)
		xhr.addEventListener('readystatechange', function() {
			if (xhr.readyState === 4) {
				if (xhr.status === 200) {
					me.success()
				} else {
					me.failure()
				}
			}
		}, false)
		xhr.addEventListener('error', function(e) {
			me.failure()
		}, false)

		xhr.open('POST', me.url, true)

		var data = new FormData()
		data.append('file', file)
		// params
		for (var key in params) {
			data.append(key, params[key])
		}
		
		xhr.send(data)

	}
}

return FileUpload
	
}();