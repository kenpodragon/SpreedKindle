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
    $port = chrome.runtime.connect({name: "content"});
    $port.onMessage.addListener(processMessage);
    $port.onDisconnect.addListener(function() {
        // Service worker restarted — reconnect
        connectContentPort();
    });
}

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
        $port.postMessage({type: "loc", contents: extractLoc()});
    else if (msg === "slider")
        $port.postMessage({type: "slider", contents: extractPagesBottom()});
}

function capturePageImage() {
    // Find the Kindle page image rendered as a blob
    var container = document.querySelector('div.kg-full-page-img');
    if (!container) {
        $port.postMessage({type: "ext", contents: null});
        return;
    }

    var img = container.querySelector('img[src^="blob:"]');
    if (!img) {
        // Fallback: try any img inside the container
        img = container.querySelector('img');
    }
    if (!img || !img.complete || img.naturalWidth === 0) {
        $port.postMessage({type: "ext", contents: null});
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
        $port.postMessage({type: "ext", contents: dataUrl});
    } catch (e) {
        // Canvas tainted (cross-origin blob) — send null so popup can fallback
        $port.postMessage({type: "ext", contents: null});
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

function goNext() {
    var btn = document.getElementById('kr-chevron-right');
    if (btn) btn.click();
}

function goPrev() {
    var btn = document.getElementById('kr-chevron-left');
    if (btn) btn.click();
}

// Navigate to next/prev page, then poll until a new image is ready before capturing
var navPollInterval = null;
function navigateAndCapture(direction) {
    // Remember current image src so we can detect when it changes
    var container = document.querySelector('div.kg-full-page-img');
    var currentImg = container ? container.querySelector('img') : null;
    var currentSrc = currentImg ? currentImg.src : '';

    // Click the navigation button
    if (direction === "next") goNext();
    else goPrev();

    // Poll until the image changes and is fully loaded
    var attempts = 0;
    var maxAttempts = 30; // 30 * 300ms = 9 seconds max wait
    if (navPollInterval) clearInterval(navPollInterval);

    navPollInterval = setInterval(function() {
        attempts++;
        var newContainer = document.querySelector('div.kg-full-page-img');
        var newImg = newContainer ? newContainer.querySelector('img') : null;

        if (newImg && newImg.complete && newImg.naturalWidth > 0 && newImg.src !== currentSrc) {
            // New image is loaded — capture it
            clearInterval(navPollInterval);
            navPollInterval = null;
            capturePageImage();
        } else if (attempts >= maxAttempts) {
            // Timed out — try to capture whatever is there
            clearInterval(navPollInterval);
            navPollInterval = null;
            capturePageImage();
        }
    }, 300);
}
