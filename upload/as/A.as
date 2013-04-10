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
	import md5.MD5;
	
	public class A extends Sprite {

		public function A() {
			Security.allowDomain("*");
			stage.scaleMode = StageScaleMode.NO_SCALE;
			stage.align = StageAlign.TOP_LEFT;
			if (this.loaderInfo.parameters.preview) {
				//initPreview();
			} else {
				initSelection();
			}
			
			var str:String = MD5.hash('hello,MD5.');
			trace(str);
			ExternalInterface.call("console.log", str);
		}
		
		
		private function initSelection() {
			var holder:Sprite = new Sprite();
			holder.buttonMode = true;
			holder.graphics.beginFill(0, 0);
			holder.graphics.drawRect(0, 0, 480, 360);
			holder.graphics.endFill();
			this.addChild(holder);
			
			var fileList:FileReferenceList;
			var cache:Object = {};
			var filter:Array = [new FileFilter("图片文件 (*.jpg,*.gif,*.png)", "*.jpeg;*.jpg;*.gif;*.png")];
			
			addEventListener(MouseEvent.CLICK, function(e:MouseEvent) {
				fileList = new FileReferenceList();
				fileList.addEventListener(Event.SELECT, onSelect);
				ExternalInterface.call("console.log", "aaa");
				fileList.browse(filter);
			});

			
			function onSelect(e:Event) {
				var tmp:Array = fileList.fileList;
				ExternalInterface.call("console.log", tmp[0].name);
				var file:FileReference = tmp[0];
				file.addEventListener(Event.COMPLETE, onRead);
				file.load();
			}
			function onRead(e:Event) {
				var file:FileReference = e.target as FileReference;
				ExternalInterface.call("console.log", file.data);
			}
		}

		ExternalInterface.marshallExceptions = true;
	
	}
	
}
