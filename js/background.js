var $backPort;
var $frontPort;

chrome.commands.onCommand.addListener(function(command) {
    if (command === "kreed-speed-UP" && $frontPort)
        safeSend($frontPort, {type: "spdUp"});
    else if (command === "kreed-speed-Down" && $frontPort)
        safeSend($frontPort, {type: "spdDwn"});
    else if (command === "kreed-read-this-page")
        openPopup();
});

var kreedPopup = -1;
chrome.action.onClicked.addListener(function() {
    openPopup();
});

chrome.runtime.onMessage.addListener(function(request) {
    if (request.type === 'open_kreeder')
        openPopup();
});

chrome.runtime.onConnect.addListener(function(port) {
    console.log('Kreeder: port connected:', port.name);
    if (port.name === "content") {
        port.onMessage.addListener(fromBack);
        port.onDisconnect.addListener(function() {
            console.log('Kreeder: content port disconnected');
            $backPort = null;
        });
        $backPort = port;
    } else if (port.name === "popup") {
        port.onMessage.addListener(fromFront);
        port.onDisconnect.addListener(function() {
            console.log('Kreeder: popup port disconnected');
            $frontPort = null;
        });
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

function safeSend(port, msg) {
    try {
        port.postMessage(msg);
    } catch (e) {
        // Port moved to bfcache or disconnected
        console.warn('Kreeder: port send failed:', e.message);
        return false;
    }
    return true;
}

function fromBack(msg) {
    if ($frontPort) {
        safeSend($frontPort, msg);
    } else {
        console.warn('Kreeder: no popup port, dropping message from content:', msg.type);
    }
}

function fromFront(msg) {
    if ($backPort) {
        if (!safeSend($backPort, msg)) {
            $backPort = null;
            if ($frontPort) {
                safeSend($frontPort, {type: "ext", contents: null, error: "content_disconnected"});
            }
        }
    } else {
        console.warn('Kreeder: no content port, cannot relay:', msg);
        if ($frontPort) {
            safeSend($frontPort, {type: "ext", contents: null, error: "content_disconnected"});
        }
    }
}
