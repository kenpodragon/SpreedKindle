// The ID of the extension we want to talk to.
window.addEventListener("load", myMain, false);

function myMain(evt) {    
    var port = chrome.runtime.connect(editorExtensionId);
    port.onMessage.addListener(function(msg) {
        alert(msg)
    });
    port.postMessage("Cheese Long Time");    
};
