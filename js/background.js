var $backPort;
var $frontPort;

chrome.commands.onCommand.addListener(function(command) {
    if(command==="kreed-speed-UP")
        $frontPort.postMessage({type: "spdUp"});
    else if(command==="kreed-speed-Down")
        $frontPort.postMessage({type: "spdDwn"});
    else if(command==="kreed-read-this-page")
        openPopup();
});

var kreedPopup=-1;
chrome.runtime.onMessage.addListener(function(request) {
    if (request.type === 'open_kreeder') 
        openPopup();   
});

chrome.runtime.onConnectExternal.addListener(function(port) {
    port.onMessage.addListener(fromBack); 
    $backPort = port;    
});

chrome.extension.onConnect.addListener(function(port) {
    port.onMessage.addListener(fromFront); 
    $frontPort = port;    
});

function openPopup(){
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

function fromBack(msg){        
    $frontPort.postMessage(msg);    
}

function fromFront(msg){   
    $backPort.postMessage(msg);
}
