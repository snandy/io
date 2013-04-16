package {
	import flash.display.Sprite;
	import flash.events.FocusEvent;
	import flash.events.MouseEvent;
	import flash.display.Stage;
	import flash.net.*;
	import flash.events.*;
	
	public class Hello extends Sprite{
		private var size:uint    = 100;
		private var bgColor:uint = 0xFFCC00;
		
		public function Hello() {
			// constructor code
			trace('hello');
			
			this.stage.addEventListener(MouseEvent.CLICK, mouseClk);
//			this.graphics.beginFill(bgColor);
//			this.graphics.drawRect(0, 0, size, size);
//			this.graphics.endFill();
			
//			var child:Sprite = new Sprite();
//			child.addEventListener(MouseEvent.CLICK, mouseClk);
//			child.graphics.beginFill(bgColor);
//			child.graphics.drawRect(0, 0, size, size);
//			child.graphics.endFill();
//			addChild(child);
			
		}
		private function mouseClk(e:MouseEvent):void {
			trace(e);
			var loader:URLLoader = new URLLoader();
            configureListeners(loader);
			var url = 'http://jquery.com';
			var request:URLRequest = new URLRequest(url);
			try {
                loader.load(request);
            } catch (error:Error) {
                trace("Unable to load requested document.");
            }
		}
		
		private function configureListeners(dispatcher:IEventDispatcher):void {
            dispatcher.addEventListener(Event.COMPLETE, completeHandler);
            dispatcher.addEventListener(Event.OPEN, openHandler);
            dispatcher.addEventListener(ProgressEvent.PROGRESS, progressHandler);
            dispatcher.addEventListener(SecurityErrorEvent.SECURITY_ERROR, securityErrorHandler);
            dispatcher.addEventListener(HTTPStatusEvent.HTTP_STATUS, httpStatusHandler);
            dispatcher.addEventListener(IOErrorEvent.IO_ERROR, ioErrorHandler);
        }
		
        private function completeHandler(event:Event):void {
            var loader:URLLoader = URLLoader(event.target);
            trace("completeHandler: " + loader.data);
        }

        private function openHandler(event:Event):void {
            trace("openHandler: " + event);
        }

        private function progressHandler(event:ProgressEvent):void {
            trace("progressHandler loaded:" + event.bytesLoaded + " total: " + event.bytesTotal);
        }

        private function securityErrorHandler(event:SecurityErrorEvent):void {
            trace("securityErrorHandler: " + event);
        }

        private function httpStatusHandler(event:HTTPStatusEvent):void {
            trace("httpStatusHandler: " + event);
        }

        private function ioErrorHandler(event:IOErrorEvent):void {
            trace("ioErrorHandler: " + event);
        }
		

	}
	
}
