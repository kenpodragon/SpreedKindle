var $backPort;
var $frontPort;

chrome.commands.onCommand.addListener(function(command) {
    if (command === "kreed-speed-UP")
        $frontPort.postMessage({type: "spdUp"});
    else if (command === "kreed-speed-Down")
        $frontPort.postMessage({type: "spdDwn"});
    else if (command === "kreed-read-this-page")
        openPopup();
});

var kreedPopup = -1;
chrome.runtime.onMessage.addListener(function(request) {
    if (request.type === 'open_kreeder')
        openPopup();
});

chrome.runtime.onConnect.addListener(function(port) {
    if (port.name === "content") {
        port.onMessage.addListener(fromBack);
        $backPort = port;
    } else if (port.name === "popup") {
        port.onMessage.addListener(fromFront);
        $frontPort = port;
    }
});

function openPopup() {
    chrome.windows.getAll({}, function(window_list) {
        for (var i = 0; i < window_list.length; i++) {
            if (window_list[i].id === kreedPopup) {
                chrome.windows.update(kreedPopup, {focused: true});
                return;
            }
        }
        chrome.tabs.create({
            url: chrome.runtime.getURL('menus/kreedPopup.html'),
            active: false
        }, function(tab) {
            chrome.windows.create({
                tabId: tab.id,
                type: 'popup',
                focused: true,
                width: 700,
                height: 500
            },
            function(chromeWindow) {
                kreedPopup = chromeWindow.id;
            });
        });
    });
}

function fromBack(msg) {
    $frontPort.postMessage(msg);
}

function fromFront(msg) {
    $backPort.postMessage(msg);
}
