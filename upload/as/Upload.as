package {
	import flash.display.*;
	import flash.errors.IOError;
	import flash.events.*;
	import flash.net.FileFilter;
	import flash.net.FileReference;
	import flash.net.FileReferenceList;
	import flash.external.ExternalInterface
	import flash.net.URLRequest;
	import flash.system.Security;
	import flash.utils.ByteArray;
	import flash.utils.Dictionary;
	
	public class Upload extends Sprite {
		public function Upload() {
			Security.allowDomain("*");
			stage.scaleMode = StageScaleMode.NO_SCALE;
			stage.align = StageAlign.TOP_LEFT;
			if (this.loaderInfo.parameters.preview) {
				initPreview();
			} else {
				initSelection();
			}
		}
		const BASE64_CHARS:String = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
		
		private function initPreview() {
			var WIDTH:int = parseInt(this.loaderInfo.parameters.width), HEIGHT:int = parseInt(this.loaderInfo.parameters.height);
			
			var loader:Loader = new Loader();
			loader.contentLoaderInfo.addEventListener(Event.COMPLETE, onLoad);
			addChild(loader);
			
			ExternalInterface.addCallback('setBase64', setBase64);
			
			function setBase64(b64:String) {
				loader.loadBytes(decodeToByteArray(b64));
			}
			function onLoad(e:Event) {
				try {
					var ref:DisplayObject = loader.content;
					var scale:Number = Math.min(WIDTH / ref.width, HEIGHT / ref.height);
					loader.scaleX = loader.scaleY = scale;
					loader.x = (WIDTH - loader.width) / 2;
					loader.y = (HEIGHT - loader.height) / 2;
				} catch (e) {
					ExternalInterface.call("console.log", "error:", e.toString());
				}
			}
			
			function decodeToByteArray(data:String):ByteArray {
				// Initialise output ByteArray for decoded data
				var output:ByteArray = new ByteArray();
				
				// Create data and output buffers
				var dataBuffer:Array = new Array(4);
				var outputBuffer:Array = new Array(3);
				
				// While there are data bytes left to be processed
				for (var i:uint = 0; i < data.length; i += 4) {
					// Populate data buffer with position of Base64 characters for
					// next 4 bytes from encoded data
					for (var j:uint = 0; j < 4 && i + j < data.length; j++) {
						dataBuffer[j] = BASE64_CHARS.indexOf(data.charAt(i + j));
					}
					
					// Decode data buffer back into bytes
					outputBuffer[0] = (dataBuffer[0] << 2) + ((dataBuffer[1] & 0x30) >> 4);
					outputBuffer[1] = ((dataBuffer[1] & 0x0f) << 4) + ((dataBuffer[2] & 0x3c) >> 2);
					outputBuffer[2] = ((dataBuffer[2] & 0x03) << 6) + dataBuffer[3];
					
					// Add all non-padded bytes in output buffer to decoded data
					for (var k:uint = 0; k < outputBuffer.length; k++) {
						if (dataBuffer[k + 1] == 64)
							break;
						output.writeByte(outputBuffer[k]);
					}
				}
				
				// Rewind decoded data ByteArray
				output.position = 0;
				
				// Return decoded data
				return output;
			}
		}
		
		private function initSelection() {
			var holder:Sprite = new Sprite();
			with (holder) {
				buttonMode = true;
				useHandCursor = true;
				var g:Graphics = this.graphics;
				graphics.beginFill(0, 0); // 
				graphics.drawRect(0, 0, 480, 360);
				graphics.endFill();
			}
			addChild(holder);
			
			const flashID:String = ExternalInterface.objectID;
			var fileList:FileReferenceList;
			var cache:Object = {}, cache2:Dictionary = new Dictionary();
			var filter:Array = [new FileFilter("图片文件 (*.jpg,*.gif,*.png)", "*.jpeg;*.jpg;*.gif;*.png")];
			var nextID = 0;
			
			addEventListener(MouseEvent.CLICK, function(e:MouseEvent) {
				fileList = new FileReferenceList();
				fileList.addEventListener(Event.SELECT, onSelect);
				fileList.browse(filter);
			});
			
			function onSelect(e:Event) {
				var tmp:Array = fileList.fileList;
				fileList = null;
				// store selected file aside
				var arr:Array = new Array(tmp.length);
				for (var i:int = 0, L:int = arr.length; i < L; i++) {
					var file:FileReference = tmp[i];
					cache[cache2[file] = nextID] = file;
					arr[i] = {type: "image/" + file.type.substr(1), name: file.name, size: file.size, id: nextID++, flashUpload: true, flashID: flashID};
				}
				ExternalInterface.call("iFlashCallback.selected", flashID, arr);
//				actions.read(arr[0].id);
			}
			
			var actions = {read: function(id) {
				}, upload: function(id:*, url:String, fieldName:String) {
					var file:FileReference = cache[id];
					if (!file) {
						throw "Wrong parameters";
					}
					file.addEventListener(ProgressEvent.PROGRESS, onProgress);
					file.addEventListener(DataEvent.UPLOAD_COMPLETE_DATA, onComplete);
					file.addEventListener(IOErrorEvent.IO_ERROR, onError);
					file.upload(new URLRequest(url), fieldName);
				}, abort: function(id:*) {
					var file:FileReference = cache[id];
					if (!file) {
						throw "Wrong parameters";
					}
					freeEvent(file);
					file.cancel();
				}, readBase64: function(id:*) {
					var file:FileReference = cache[id];
					if (!file) {
						throw "Wrong parameters";
					}
					file.addEventListener(Event.COMPLETE, onRead);
					file.load();
				}};
			ExternalInterface.marshallExceptions = true;
			ExternalInterface.addCallback("callFlash", function(fn:String, ... args) {
					actions[fn].apply(this, args);
				});
			
			function onRead(e:Event) {
				var file:FileReference = e.target as FileReference;
				var b64:String = encodeByteArray(file.data);
				ExternalInterface.call("iFlashCallback." + flashID + "$" + cache2[file] + "$getBase64", b64);
			}
			
			function log(arg1, arg2:String = '') {
				ExternalInterface.call("console.log", flashID, arg1, arg2);
			}
			
			function onProgress(e:ProgressEvent) {
				ExternalInterface.call("iFlashCallback." + flashID + "$" + cache2[e.target] + "$upload", "progress", e.bytesLoaded, e.bytesTotal);
			}
			
			function onComplete(e:DataEvent) {
				var target:EventDispatcher = e.target as EventDispatcher;
				freeEvent(target);
				ExternalInterface.call("iFlashCallback." + flashID + "$" + cache2[e.target] + "$upload", "complete", e.data);
			}
			
			function onError(e:IOErrorEvent) {
				var target:EventDispatcher = e.target as EventDispatcher;
				freeEvent(target);
				ExternalInterface.call("iFlashCallback." + flashID + "$" + cache2[target] + "$upload", "error");
			}
			function freeEvent(target:EventDispatcher) {
				target.removeEventListener(IOErrorEvent.IO_ERROR, onError);
				target.removeEventListener(ProgressEvent.PROGRESS, onProgress);
				target.removeEventListener(DataEvent.UPLOAD_COMPLETE_DATA, onComplete);
			
			}
			function encodeByteArray(data:ByteArray):String {
				// Initialise output
				var output:String = "";
				
				// Create data and output buffers
				var dataBuffer:Array;
				var outputBuffer:Array = new Array(4);
				
				// Rewind ByteArray
				data.position = 0;
				
				// while there are still bytes to be processed
				while (data.bytesAvailable > 0) {
					// Create new data buffer and populate next 3 bytes from data
					dataBuffer = new Array();
					for (var i:uint = 0; i < 3 && data.bytesAvailable > 0; i++) {
						dataBuffer[i] = data.readUnsignedByte();
					}
					
					// Convert to data buffer Base64 character positions and 
					// store in output buffer
					outputBuffer[0] = (dataBuffer[0] & 0xfc) >> 2;
					outputBuffer[1] = ((dataBuffer[0] & 0x03) << 4) | ((dataBuffer[1]) >> 4);
					outputBuffer[2] = ((dataBuffer[1] & 0x0f) << 2) | ((dataBuffer[2]) >> 6);
					outputBuffer[3] = dataBuffer[2] & 0x3f;
					
					// If data buffer was short (i.e not 3 characters) then set
					// end character indexes in data buffer to index of '=' symbol.
					// This is necessary because Base64 data is always a multiple of
					// 4 bytes and is basses with '=' symbols.
					for (var j:uint = dataBuffer.length; j < 3; j++) {
						outputBuffer[j + 1] = 64;
					}
					
					// Loop through output buffer and add Base64 characters to 
					// encoded data string for each character.
					for (var k:uint = 0; k < outputBuffer.length; k++) {
						output += BASE64_CHARS.charAt(outputBuffer[k]);
					}
				}
				
				// Return encoded data
				return output;
			}
		}
	
	}
}
