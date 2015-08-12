//Messaging from the back to the frunt
var $readingContent;
var $port;

chrome.runtime.onConnectExternal.addListener(function(port) {
    port.onMessage.addListener(storeMsg); 
    $port = port;    
});

//Messaging function to pass information to other Extension scripts
chrome.runtime.onMessage.addListener(
        function(request, sender, sendResponse) {
            if (request.greeting === "hello"){
                $port.postMessage("You Cheese");
                sendResponse({msg: $readingContent});
    }
});

function storeMsg(msg){
    alert("Returned message: " + msg);
    $readingContent = msg;
}
