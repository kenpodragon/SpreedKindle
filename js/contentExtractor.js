// The ID of the extension we want to talk to.
window.addEventListener("load", myMain, false);

var $port;

function myMain(evt) {    
    $port = chrome.runtime.connect(editorExtensionId);
    $port.onMessage.addListener(processMessage);      
};

function processMessage(msg){
    alert("Alerted Message"+msg);
    $port.postMessage("Cheese Long Time"); 
}
