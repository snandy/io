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

	public class A extends Sprite {

		public function A() {
			Security.allowDomain("*");
			stage.scaleMode = StageScaleMode.NO_SCALE;
			stage.align = StageAlign.TOP_LEFT;
			ExternalInterface.call("console.log", "aaaa");
			if (this.loaderInfo.parameters.preview) {
				//initPreview();
			} else {
				ExternalInterface.call("console.log", "aaaa");
				initSelection();
			}
		}

		private function initSelection() {
			var holder:Sprite = new Sprite();
			holder.buttonMode = true;
			holder.graphics.beginFill(0, 0);
			holder.graphics.drawRect(0, 0, 480, 360);
			holder.graphics.endFill();
			this.addChild(holder);
			
			var fileList:FileReferenceList;
			var cache:Object = {}, cache2:Dictionary = new Dictionary();
			var filter:Array = [new FileFilter("图片文件 (*.jpg,*.gif,*.png)", "*.jpeg;*.jpg;*.gif;*.png")];
			var nextID = 0;
			
			addEventListener(MouseEvent.CLICK, function(e:MouseEvent) {
				fileList = new FileReferenceList();
				//fileList.addEventListener(Event.SELECT, onSelect);
				ExternalInterface.call("console.log", "aaa");
				fileList.browse(filter);
			});

			
		}

		ExternalInterface.marshallExceptions = true;
	
	}
	
}
