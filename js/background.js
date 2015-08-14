var $backPort;
var $frontPort;

chrome.commands.onCommand.addListener(function(command) {
    if(command==="kreed-speed-UP")
        console.log('Command:', command);
    else if(command==="kreed-speed-Down")
        console.log('Command:', command);
    else if(command==="kreed-read-this-page")
        console.log('Command:', command);
});

var kreedPopup=-1;
chrome.runtime.onMessage.addListener(function(request) {
    if (request.type === 'open_kreeder') {
        //TODO: figure out why the window_list isn't working (might be unix)
        chrome.windows.getAll({}, function(window_list) {            
            for (var chromeWindow in window_list) {               
                if(chromeWindow.id === kreedPopup) {
                    chrome.windows.update(kreedPopup, {focused: true});
                    return;
                }
            }
            chrome.tabs.create({
                url: chrome.extension.getURL('menus/kreedPopup.html'),
                active: false
            }, function(tab) {
                chrome.windows.create({
                    tabId: tab.id,
                    type: 'popup',
                    focused: true                
                },
                function(chromeWindow) {                    
                    kreedPopup = chromeWindow.id;
                });
            });
        });        
    }
});

chrome.runtime.onConnectExternal.addListener(function(port) {
    port.onMessage.addListener(fromBack); 
    $backPort = port;    
});

chrome.extension.onConnect.addListener(function(port) {
    port.onMessage.addListener(fromFront); 
    $frontPort = port;    
});

function fromBack(msg){    
    $frontPort.postMessage(msg);    
}

function fromFront(msg){   
    $backPort.postMessage(msg);
}
