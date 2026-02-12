// Content script for Kindle Cloud Reader — captures page images for OCR
// Only initialize in the top frame (no iframe injection needed)
if (window === window.top) {
    if (document.readyState === 'complete') {
        myMain();
    } else {
        window.addEventListener("load", myMain, false);
    }
}

var $port;

function myMain(evt) {
    connectContentPort();
}

function connectContentPort() {
    try {
        $port = chrome.runtime.connect({name: "content"});
    } catch (e) {
        // Extension context invalidated — nothing we can do
        return;
    }
    $port.onMessage.addListener(processMessage);
    $port.onDisconnect.addListener(function() {
        // Service worker restarted or bfcache — reconnect
        $port = null;
        connectContentPort();
    });
}

// Reconnect port when page is restored from bfcache
window.addEventListener('pageshow', function(event) {
    if (event.persisted && !$port) {
        connectContentPort();
    }
});

function processMessage(msg) {
    if (msg === "next")
        goNext();
    else if (msg === "prev")
        goPrev();
    else if (msg === "ext")
        capturePageImage();
    else if (msg === "next_and_extract")
        navigateAndCapture("next");
    else if (msg === "prev_and_extract")
        navigateAndCapture("prev");
    else if (msg === "loc")
        safeSendContent({type: "loc", contents: extractLoc()});
    else if (msg === "slider")
        safeSendContent({type: "slider", contents: extractPagesBottom()});
}

function safeSendContent(msg) {
    try {
        if ($port) $port.postMessage(msg);
    } catch (e) {
        // Port disconnected (bfcache, service worker restart, etc.)
    }
}

function capturePageImage() {
    // Find the Kindle page image rendered as a blob
    var container = document.querySelector('div.kg-full-page-img');
    if (!container) {
        safeSendContent({type: "ext", contents: null});
        return;
    }

    var img = container.querySelector('img[src^="blob:"]');
    if (!img) {
        // Fallback: try any img inside the container
        img = container.querySelector('img');
    }
    if (!img || !img.complete || img.naturalWidth === 0) {
        safeSendContent({type: "ext", contents: null});
        return;
    }

    // Draw the image to a canvas to get a data URL
    try {
        var canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        var ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        var dataUrl = canvas.toDataURL('image/png');
        safeSendContent({type: "ext", contents: dataUrl});
    } catch (e) {
        // Canvas tainted (cross-origin blob) — send null so popup can fallback
        safeSendContent({type: "ext", contents: null});
    }
}

function extractPagesBottom() {
    // Try new Kindle reader footer, fall back to old selector
    var el = document.getElementById('kindleReader_footer_message');
    if (!el) {
        // Look for any page progress indicator
        el = document.querySelector('[class*="page-progress"], [class*="location"]');
    }
    return el ? el.textContent : '';
}

function extractLoc() {
    var el = document.getElementById('kindleReader_immersiveFooter');
    if (!el) {
        el = document.querySelector('[class*="footer"], [class*="location"]');
    }
    return el ? el.textContent : '';
}

function simulateClick(element) {
    var rect = element.getBoundingClientRect();
    var x = rect.left + rect.width / 2;
    var y = rect.top + rect.height / 2;
    var opts = {bubbles: true, cancelable: true, view: window, clientX: x, clientY: y};
    element.dispatchEvent(new PointerEvent('pointerdown', opts));
    element.dispatchEvent(new MouseEvent('mousedown', opts));
    element.dispatchEvent(new PointerEvent('pointerup', opts));
    element.dispatchEvent(new MouseEvent('mouseup', opts));
    element.dispatchEvent(new MouseEvent('click', opts));
}

function goNext() {
    var btn = document.querySelector('[aria-label="Next Page"]') || document.getElementById('kr-chevron-right');  
    if (btn) {
        simulateClick(btn);
        return true;
    }
    return false;
}

function goPrev() {
    var btn = document.querySelector('[aria-label="Previous Page"]') || document.getElementById('kr-chevron-left');         
    if (btn) {
        simulateClick(btn);
        return true;
    }
    return false;
}

// Navigate to next/prev page, wait for render, then capture
function navigateAndCapture(direction) {
    var clicked;
    if (direction === "next") clicked = goNext();
    else clicked = goPrev();

    if (!clicked) {
        // Navigation button not found — report back
        safeSendContent({type: "ext", contents: null, error: "nav_button_not_found"});
        return;
    }

    // Wait for the page to render the new image, then capture
    setTimeout(function() {
        capturePageImage();
    }, 2000);
}
