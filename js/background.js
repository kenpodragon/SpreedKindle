//Messaging from the back to the frunt
chrome.runtime.onConnectExternal.addListener(function(port) {
    port.onMessage.addListener(function(msg) {
        alert(msg);
    });
  
    port.postMessage("Back at you");
});

//Messaging function to pass information to other Extension scripts
chrome.runtime.onMessage.addListener(
        function(request, sender, sendResponse) {
            if (request.greeting === "hello")
        sendResponse({
            msg: "goodbye!"
        });
});
