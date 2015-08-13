// The ID of the extension we want to talk to.
window.addEventListener("load", myMain, false);

var $port;

function myMain(evt) {    
    $port = chrome.runtime.connect(editorExtensionId);
    $port.onMessage.addListener(processMessage);      
};

function processMessage(msg){    
    $port.postMessage(extractContents()); 
}

function extractContents(){
    var str = $('body').text();
    str = str.replace(/\s+/g, '');
    
    /*$('.k4w').each(function(){       
        str += 1;
    });*/
    
    return str;   
}
