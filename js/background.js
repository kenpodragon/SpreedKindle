var $backPort;
var $frontPort;

chrome.runtime.onConnectExternal.addListener(function(port) {
    port.onMessage.addListener(fromBack); 
    $backPort = port;    
});

chrome.extension.onConnect.addListener(function(port) {
    port.onMessage.addListener(fromFront); 
    $frontPort = port;    
});

function fromBack(msg){    
    console.info(msg);
    $frontPort.postMessage(msg);    
}

function fromFront(msg){   
    $backPort.postMessage(msg);
}
