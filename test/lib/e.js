/**
 * e.js
 * weibo: @snandy
 * Blog: http://www.cnblogs.com/snandy
 * Date: 2012-09-10
 */

~function(window, document, undefined) {
	
// Variables -------------------------------------------------------------------------------------

	// 每个element上绑定的一个唯一属性，递增
var	guid = 1,

	guidStr = '__guid__',
	
	// 存放所有事件handler, 以guid为key, cache[1] = {}
	// cache[1] = {handle: evnetHandle, events: {}}, events = {click: [handler1, handler2, ..]}
	cache = {},
	// 优先使用标准API
	w3c = !!window.addEventListener,
	
	util, toString = Object.prototype.toString, slice = Array.prototype.slice

// Utility functions -----------------------------------------------------------------------------

util = {
	each: function(arr, callback) {
		for (var i=0; i<arr.length; i++) {
			if ( callback(arr[i], i) === true ) return
		}
	},
	isEmpty: function(obj) {
		for (var a in obj) {
			return false
		}
		return true
	},
	isFunction: function(obj) {
		return toString.call(obj) == '[object Function]'
	},
	isObject: function(obj) {
		return obj === Object(obj)
	},
	once: function(func) {
		var run, memo
		return function() {
			if (run) return memo
			run = true
			return memo = func.apply(this, arguments)
		}
	},
	delay: function(func, wait) {
		return function() {
			var context = this, args = arguments
			setTimeout(function() {
				func.apply(context, args)
			}, wait)
		}
	},
	debounce: function(func, wait, immediate) {
		var timeout
		return function() {
			var context = this, args = arguments
			later = function() {
				timeout = null
				if (!immediate) func.apply(context, args)
			}
			var callNow = immediate && !timeout
			clearTimeout(timeout)
			timeout = setTimeout(later, wait)
			if (callNow) func.apply(context, args)
		}
	},
	throttle: function(func, wait) {
		var context, args, timeout, throttling, more, result,
			whenDone = util.debounce(function() {
				more = throttling = false
			}, wait)
		return function() {
			context = this, args = arguments
			var later = function() {
				timeout = null
				if (more) func.apply(context, args)
				whenDone()
			}
			if (!timeout) {
				timeout = setTimeout(later, wait)
			}
			if (throttling) {
				more = true
			} else {
				result = func.apply(context, args)
			}
			whenDone()
			throttling = true
			return result
		}
	},
	addListener: function() {
		if (w3c) {
			return function(el, type, handler) { el.addEventListener(type, handler, false) } 
		} else {
			return function(el, type, handler) { el.attachEvent('on' + type, handler) }
		}
	}(),
	removeListener: function() {
		if (w3c) {
			return function(el, type, handler) { el.removeEventListener(type, handler, false) }
		} else {
			return function(el, type, handler) { el.detachEvent('on' + type, handler) }
		}
	}()
}

// Private functions ---------------------------------------------------------------------------

function returnFalse() {
	return false
}
function returnTrue() {
	return true
}
function now() {
	return (new Date).getTime()
}
function excuteHandler(elem, e, args/*only for trigger*/) {
	if (!elem || !e) return
	
	var e      = fix(e, elem),
		type   = e.type,
		id     = elem[guidStr],
		elData = cache[id],
		events = elData.events,
		handlers = events[type]
	
	for (var i=0, handlerObj; handlerObj = handlers[i++];) {
		if (args) {
			handlerObj.args = handlerObj.args.concat(args)
		}
		if (e.namespace) {
			if (e.namespace===handlerObj.namespace) {
				callback(elem, type, e, handlerObj)
			} 
		} else {
			callback(elem, type, e, handlerObj)
		}
	}
}
function callback(elem, type, e, handlerObj) {
	var args      = handlerObj.args,
		stop      = handlerObj.stop,
		data      = handlerObj.data,
		handler   = handlerObj.handler,
		prevent   = handlerObj.prevent,
		context   = handlerObj.context || elem,
		stopBubble = handlerObj.stopBubble
	
	// 如果数组第一个元素不是事件对象，将事件对象插入到数组第一个位置; 如果是则用新的事件对象替换
	if (args[0] && args[0].type === e.type) {
		args.shift()
		args.unshift(e)
	} else {
		args.unshift(e)
	}
	
	if (stop) {
		e.preventDefault()
		e.stopPropagation()
	}
	
	if (prevent) {
		e.preventDefault()
	}
	
	if (data) {
		e.data = data
	}
	
	if (stopBubble) {
		e.stopPropagation()
	}
	
	handler.apply(context, args)
}
// handlerObj class
function Handler(config) {
	this.handler   = config.handler
	this.once      = config.once
	this.delay     = config.delay
	this.debounce  = config.debounce
	this.immediate = config.immediate
	this.throttle  = config.throttle
	this.context   = config.context
	this.stop      = config.stop
	this.prevent   = config.prevent
	this.stopBubble = config.stopBubble
	this.args       = config.args || []
	this.data       = config.data
}
// 删除事件的注册，从缓存中去除
function remove(elem, type, guid) {
	var elData = cache[guid],
		handle = elData.handle,
		events = elData.events
	
	// 从缓存中删除指定类型事件相关数据
	delete events[type]
	delete elData.elem
	delete elData.handle
	
	// DOM中事件取消注册
	util.removeListener(elem, type, handle)
	// events是空对象时，从cache中删除
	if ( util.isEmpty(events) ) {
		delete elData.events
		delete cache[guid]
	}
}
// Custom event class
function Event(event) {
	var namespace
	if (event.type) {
		this.originalEvent = event
		this.type          = event.type
	} else {
		if (event.indexOf('.') > -1) {
			namespace = event.split('.')
			this.type = namespace[0]
			this.namespace = namespace[1]
		} else {
			this.type = event
			this.namespace = ''
		}
	}
	this.timeStamp     = now()
}
Event.prototype = {
	preventDefault: function() {
		this.isDefaultPrevented = returnTrue
		var e = this.originalEvent
		if (e.preventDefault) {
			e.preventDefault()
		}
		e.returnValue = false
	},
	stopPropagation: function() {
		this.isPropagationStopped = returnTrue
		var e = this.originalEvent
		if (e.stopPropagation) {
			e.stopPropagation()
		}
		e.cancelBubble = true
	},
	stopImmediatePropagation: function() {
		this.isImmediatePropagationStopped = returnTrue
		this.stopPropagation()
	},
	isDefaultPrevented: returnFalse,
	isPropagationStopped: returnFalse,
	isImmediatePropagationStopped: returnFalse
};
// Fix evnet object
function fix(e, elem) {
	var i, prop, props = [], originalEvent = e
	
	props = props.concat('altKey bubbles button cancelable charCode clientX clientY ctrlKey currentTarget'.split(' '))
	props = props.concat('data detail eventPhase fromElement handler keyCode layerX layerY metaKey'.split(' '))
	props = props.concat('newValue offsetX offsetY originalTarget pageX pageY prevValue relatedTarget'.split(' '))
	props = props.concat('screenX screenY shiftKey target toElement view wheelDelta which'.split(' '))
	
	e = new Event(originalEvent)
	for (i=props.length; i;) {
		prop = props[--i]
		e[prop] = originalEvent[prop]
	}
	
	if (!e.target) {
		e.target = originalEvent.srcElement || elem // elem for trigger event
	}
	if (e.target.nodeType === 3) {
		e.target = e.target.parentNode
	}
	if (!e.relatedTarget && e.fromElement) {
		e.relatedTarget = e.fromElement === e.target ? e.toElement : e.fromElement
	}
	if (e.pageX == null && e.clientX != null) {
		var doc = document.documentElement, body = document.body
		e.pageX = e.clientX + 
			(doc && doc.scrollLeft || body && body.scrollLeft || 0) -
			(doc && doc.clientLeft || body && body.clientLeft || 0)
		e.pageY = e.clientY + 
			(doc && doc.scrollTop  || body && body.scrollTop  || 0) -
			(doc && doc.clientTop  || body && body.clientTop  || 0)
	}
	if (!e.which && ((e.charCode || e.charCode === 0) ? e.charCode : e.keyCode)) {
		e.which = e.charCode || e.keyCode
	}
	if (!e.metaKey && e.ctrlKey) {
		e.metaKey = e.ctrlKey
	}
	if (!e.which && e.button !== undefined) {
		e.which = (e.button & 1 ? 1 : ( e.button & 2 ? 3 : ( e.button & 4 ? 2 : 0 ) ))
	}
	
	return e
}

// Public functions -----------------------------------------------------------------------------

// Add event handler
function bind(elem, type, handler) {
	if (!elem || elem.nodeType === 3 || elem.nodeType === 8 || !type) {
		return
	}
	
	var id     = elem[guidStr] = elem[guidStr] || guid++,
		elData = cache[id] = cache[id] || {},
		events = elData.events,
		handle = elData.handle,
		handlerObj, eventType, i=0, arrType, namespace
	
	// 批量添加, 递归
	if ( util.isObject(type) ) {
		for (eventType in type) {
			bind(elem, eventType, type[eventType])
		}
		return
	} else {
		arrType = type.split(' ')
	}
	
	// handle parameter handler
	if ( util.isFunction(handler) ) {
		handlerObj = new Handler({handler: handler})
	} else {
		if ( !util.isFunction(handler.handler) ) return
		handlerObj = new Handler(handler)
	}
	
	handler = handlerObj.handler
	
	// once 仅执行一次
	if (handlerObj.once) {
		handlerObj.special = handler
		handlerObj.handler = util.once(handler)
	}
	
	// delay延迟执行
	if (handlerObj.delay) {
		handlerObj.special = handler
		handlerObj.handler = util.delay(handler, handlerObj.delay)
	}
	
	// debounce防弹跳
	if (handlerObj.debounce) {
		handlerObj.special = handler
		handlerObj.handler = util.debounce(handler, handlerObj.debounce)
	}
	
	// immediate 执行后立即延迟指定时间，如避免重复提交
	if (handlerObj.immediate) {
		handlerObj.special = handler
		handlerObj.handler = util.debounce(handler, handlerObj.immediate, true)
	}
	
	// throttle 事件节流
	if (handlerObj.throttle) {
		handlerObj.special = handler
		handlerObj.handler = util.throttle(handler, handlerObj.throttle)
	}
	
	// 初始化events
	if (!events) {
		elData.events = events = {}
	}
	
	// 初始化handle
	if (!handle) {
		elData.handle = handle = function(e) {
			excuteHandler(elData.elem, e)
		}
	}
	
	// elem暂存到handle
	elData.elem = elem
	
	while ( eventType=arrType[i++] ) {
		// Namespaced event handlers
		if ( eventType.indexOf('.') > -1 ) {
			namespace = type.split('.')
			eventType = namespace[0]
			handlerObj.namespace = namespace[1]
		} else {
			handlerObj.namespace = ''
		}
		
		// 取指定类型事件(如click)的所有handlers, 如果有则是一个数组, 第一次是undefined则初始化为空数组
		// 也仅在handlers为undefined时注册事件, 即每种类型事件仅注册一次, 再次添加handler只是push到数组handlers中
		handlers  = events[eventType]
		if (!handlers) {
			handlers = events[eventType] = []
			util.addListener(elem, eventType, handle)
		}
		// 添加到数组
		handlers.push(handlerObj)
	}
	
	// 避免IE低版本内存泄露
	elem = null
}

// Remove event handler
function unbind(elem, type, handler) {
	if (!elem || elem.nodeType === 3 || elem.nodeType === 8) {
		return
	}
	
	var id       = elem[guidStr],
		elData   = id && cache[id],
		events   = elData && elData.events,
		handlers = events && events[type],
		length   = arguments.length
	
	switch (length) {
		case 1:
			for (var type in events) {
				remove(elem, type, id)
			}
			break
		case 2:
			remove(elem, type, id)
			break
		case 3:
			util.each(handlers, function(handlerObj, i) {
				if (handlerObj.handler === handler || handlerObj.special === handler) {
					handlers.splice(i, 1)
					return true
				}
			})
			if (handlers.length === 0) {
				remove(elem, type, id)
			}
			break
	}
}

// Fire event
function trigger(elem, type) {
	if (!elem || elem.nodeType === 3 || elem.nodeType === 8) {
		return
	}
	var id       = elem[guidStr],
		elData   = id && cache[id],
		events   = elData && elData.events,
		handlers = events && events[type],
		args     = slice.call(arguments, 2),
		length   = arguments.length
	
	if (length===1 && elem.nodeType===1) {
		for (var type in events) {
			excuteHandler(elem, type, args)
		}
	} else {
		excuteHandler(elem, type, args)
	}
}

var E = {
	on: bind,
	bind: bind,
	un: unbind,
	unbind: unbind,
	fire: trigger,
	trigger: trigger,
	one: function(elem, type, handler) {
		bind(elem, type, {
			once: true,
			handler: handler
		})
	},
	delay: function(elem, type, handler, wait) {
		bind(elem, type, {
			delay: wait,
			handler: handler
		})
	},
	debounce: function(elem, type, handler, wait) {
		bind(elem, type, {
			debounce: wait,
			handler: handler
		})
	},
	immediate: function(elem, type, handler, wait) {
		bind(elem, type, {
			immediate: wait,
			handler: handler
		})
	},
	throttle: function(elem, type, handler, wait) {
		bind(elem, type, {
			throttle: wait,
			handler: handler
		})
	},
	viewCache: function() {
		if (window.console) {
			console.log(cache)
		}
	},
	destroy: function() {
		for (var num in cache) {
			var elData = cache[num], elem = elData.elem
			unbind(elem)
		}
		guid = 1
	}
}

// Expose E to the global object or as AMD module
if (typeof define === 'function' && define.amd) {
	define('E', [], function() { return E } )
} else {
	window.E = E
}

}(this, this.document);