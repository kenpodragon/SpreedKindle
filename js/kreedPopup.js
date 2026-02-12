var $port;
function connectPopupPort() {
    $port = chrome.runtime.connect({name: "popup"});
    $port.onMessage.addListener(fromBkgJS);
    $port.onDisconnect.addListener(function() {
        // Service worker restarted — reconnect
        connectPopupPort();
    });
}
connectPopupPort();
var lastpage = 0;
var currentpage = 0;


$( document ).ready(function() {



    setSliderPosition($loc);

    $("#nextPage").click(function(){
        fetchNextPage();
    });
    $("#previousPage").click(function(){
        fetchPreviousPage();
    });
    $('body').delegate('#extractNextPage', 'click', function(event) {
        $('#nextPage').click();
    });
    $('#extractPage').click(function(){        
        getCurrentPageContents();
    });
    $("#about").click(function(){        
        chrome.runtime.openOptionsPage(function(){});
    });
    $("#speedUp").click(function(){
        speedUp();
    });
    $("#speedDown").click(function(){
        speedDown();
    });
    $("#fontBigger").click(function(){
        fontBigger();
    });
    $("#fontSmaller").click(function(){
        fontSmaller();
    });
    $("#numWordsUp").click(function(){
        numWordsUp();
    });
    $("#numWordsDown").click(function(){
        numWordsDown();
    });
    /*$("#setFontType").click(function(){
        setFontType("ARIAL");
    });
    $("#setBackground").click(function(){
        setBackground("COLOR");
    });
    $("#setForeground").click(function(){
        setForeground("COLOR");
    });*/
    $("#rewindWord").click(function(){
        rewindWord();
    });
    $("#playPause").click(function(){
        playPause();
    });
    $("#stop").click(function(){
        stopPlayback();
    });
    $("#forwardWord").click(function(){
        forwardWord();
    });
    $("#autoAdvance").click(function(){
        setAutoAdvance(document.getElementById('autoAdvance').checked);
    });
    $('#autoadvanceoff, #autoadvanceon').click(function(){
        $("#autoAdvance").click();
    });
});

//Function to retrieve information from background.js
function getMsgFromBack(option){    
    $port.postMessage(option);    
}

function fromBkgJS(msg){
    if(msg.type==="ext") {
        if (typeof msg.contents === 'string' && msg.contents.indexOf('data:image/') === 0) {
            // Image data URL — run OCR to extract text
            $("#wordDisplay").html('<img src="../icons/ajax.svg" /><br><small>Running OCR...</small>');
            runOCR(msg.contents).then(function(text) {
                processExtractedText([text]);
            }).catch(function(err) {
                $("#wordDisplay").html('<span style="color:red">OCR failed: ' + err.message + '</span>');
            });
        } else if (msg.contents === null && msg.error === "content_disconnected") {
            $("#wordDisplay").html('<span style="color:orange">Content script not connected. Please refresh the Kindle tab and try again.</span>');
        } else if (msg.contents === null && msg.error === "nav_button_not_found") {
            $("#wordDisplay").html('<span style="color:orange">Navigation button not found on page. Is a book open?</span>');
        } else if (msg.contents === null) {
            $("#wordDisplay").html('<span style="color:orange">Could not capture page image. Make sure a book is open.</span>');
        } else if (Array.isArray(msg.contents)) {
            // Legacy: direct text array
            processExtractedText(msg.contents);
        }
    }
    else if (msg.type === "prefetch") {
        $prefetchNavigated = true;

        if (typeof msg.contents === 'string' && msg.contents.indexOf('data:image/') === 0) {
            runOCR(msg.contents).then(function(text) {
                $prefetchedText = text;
                $prefetching = false;

                if ($waitingForPrefetch) {
                    $waitingForPrefetch = false;
                    usePrefetchedWords();
                }
            }).catch(function(err) {
                console.error('Kreeder: prefetch OCR failed', err);
                $prefetching = false;
                $prefetchedText = null;

                if ($waitingForPrefetch) {
                    $waitingForPrefetch = false;
                    $("#wordDisplay").html('<img src="../icons/ajax.svg" /><br><small>Running OCR...</small>');
                    getMsgFromBack("ext");
                }
            });
        } else {
            // Image capture failed
            console.warn('Kreeder: prefetch capture failed', msg.error || 'no image');
            $prefetching = false;
            $prefetchedText = null;
            if (msg.error === "nav_button_not_found") {
                $prefetchNavigated = false;
            }

            if ($waitingForPrefetch) {
                $waitingForPrefetch = false;
                if ($prefetchNavigated) {
                    $("#wordDisplay").html('<img src="../icons/ajax.svg" /><br><small>Loading next page...</small>');
                    getMsgFromBack("ext");
                } else {
                    fetchNextPage();
                }
            }
        }
    }
    else if (msg.type ==="spdUp")
        speedUp();
    else if (msg.type ==="spdDwn")
        speedDown();
    else if (msg.type ==="loc")
        setLoc(msg.contents);
}

function changeValueSlider(nv){
    $('.slider').remove();
    $('body').append('<input class="slider" type="text" />');
    setSliderPosition(nv);   
};
var sliderhover = true;
function setSliderPosition(pos){
    try{
        var last = $words.length;


        if ($('.slider.slider-horizontal').length>0)
        {
            changeValue(currentpage);
            return;
        }

        $('.slider').removeClass('hidden');
        $('.slider').slider({
                                min:1,max:last,value:parseInt(pos),
                                formater: function(value) {
                                    return 'Word ' + value +' of '+last;
                                }
                            })
            .on('slideStart', function(ev){
                
            })
            .on('slideStop', function(ev){
                $(this).slider('setValue', ev.value);
                $loc = (ev.value)-1;

                displayWord(getNextWords(1));
            });
        $('.slider').mouseenter(function(){
            sliderhover = $playing;
            if ($playing == true)
                playPause();
        }).mouseleave(function(){
            if ($playing != sliderhover)
                playPause();
        });


    } catch(err) {
    }
};

function processExtractedText(contents){
    clearPrefetchState();
    //TODO: looks like some words are going missing
    $words = contents.join(" ")
        .replace(/[\u2018\u2019\u201A]/g, "\'")
        .replace(/[\u201C\u201D\u201E]/g, "\"")
        .replace(/\u2026/g, "...")
        .replace(/[\u2013\u2014]/g, "-")
        .replace(/\u02C6/g, "^")
        .replace(/\u2039/g, "<")
        .replace(/\u203A/g, ">")
        .replace(/[\u02DC\u00A0]/g, " ")
        .replace(/(\W)\s+/g, "$1")
        .replace(/\s+(\W)/g, "$1")
        .replace(/[,]([^\s^"])/g, ", $1")
        .replace(/[;]([^\s^"])/g, "; $1")
        .replace(/[:]([^\s^"])/g, ": $1")
        .replace(/[.]([^\s^"])/g, ". $1")
        .replace(/[!]([^\s^"])/g, "! $1")
        .replace(/[?]([^\s^"])/g, "? $1")
        .replace(/\."/g, '." ')
        .replace(/\?"/g, '?" ')
        .replace(/\!"/g, '!" ')
        .replace(/""/g, '" "')        
        .trim().split(" ");
    $loc = 0;    
    $playing = false;
    playPause();
}

function fetchNextPage(){
    $playing = false;
    $("#wordDisplay").html('<img src="../icons/ajax.svg" /><br><small>Loading next page...</small>');

    if ($prefetchNavigated) {
        // Kindle already on next page from prefetch — just capture it
        clearPrefetchState();
        getMsgFromBack("ext");
    } else {
        clearPrefetchState();
        getMsgFromBack("next_and_extract");
    }
}

function fetchPreviousPage(){
    $playing = false;
    $("#wordDisplay").html('<img src="../icons/ajax.svg" /><br><small>Loading previous page...</small>');

    if ($prefetchNavigated) {
        // Kindle is one page ahead — go back twice: undo prefetch + actual previous
        clearPrefetchState();
        getMsgFromBack("prev");
        setTimeout(function() {
            getMsgFromBack("prev_and_extract");
        }, 2000);
    } else {
        clearPrefetchState();
        getMsgFromBack("prev_and_extract");
    }
}


var interval = '';
function getCurrentPageContents(){
    if($playing===true && $('#wordDisplay').text() != '')
        return;

    if ($prefetchNavigated) {
        getMsgFromBack("prev");
        clearPrefetchState();
        setTimeout(function() {
            getMsgFromBack("ext");
        }, 2000);
        return;
    }

    clearPrefetchState();

    interval = setInterval(function(){
        if ($('#wordDisplay').text() != '' && $('#wordDisplay').text().indexOf('OCR') === -1)
            clearInterval(interval);
        else if ($('#wordDisplay').text().indexOf('OCR') === -1)
            getMsgFromBack("ext");
    }, 2000);

    getMsgFromBack("ext");

}

function getCurrentLoc(){
    getMsgFromBack("loc");  
}

function rewindWord(){
    if($playing) return;    
    $loc -= 2* kreederVars.wCount;
    if($loc < 0)
        $loc = 0;
    if(hasNextBlock()){
        displayWord(getNextWords());
    }
}

function playPause(){
    //TODO: Change icon when playing or pausing
    if($playing){
        $playing = false;
        $("#playPause").html('<i class="fa fa-play"></i>');
        return;
    }
    $playing = true;
    $("#playPause").html('<i class="fa fa-pause"></i>');
    wordPlayer();
}

var wptimer = '';
function wordPlayer(){
    if (wptimer)
        clearTimeout(wptimer);
    

    if(!$playing)
        return;
    if(hasNextBlock()){
        // Trigger prefetch at threshold
        if ($words.length > 0 && $loc / $words.length >= PREFETCH_THRESHOLD) {
            triggerPrefetch();
        }

        //TODO: formula corrections
        var dispDelay = calculateWPM();
        var wordsToDisplay = getNextWords();
        if(PUNCT_PATTERN.test(wordsToDisplay))
            dispDelay = dispDelay*(1+PUNCT_DELAY/100);
        displayWord(wordsToDisplay);
        updateVariableDisplay();
        wptimer = setTimeout(function(){
        wordPlayer();
            },dispDelay);
    } else {
        $playing = false;
        if(kreederVars.autoAdvance) {
            if ($prefetchedText) {
                // Prefetch ready — instant page transition
                usePrefetchedWords();
            } else if ($prefetching) {
                // Prefetch in progress — wait for it
                $waitingForPrefetch = true;
                $("#wordDisplay").html('<img src="../icons/ajax.svg" /><br><small>Loading next page...</small>');
            } else {
                // No prefetch — fall back to normal behavior
                fetchNextPage();
            }
        }
        else
        {
            $('#wordDisplay').html('<button id="extractNextPage" class="btn btn-default">Speed read the next page now!</button>');
        }

    }    
}

var PUNCT_PATTERN = /[.?!,:;]/;
var PUNCT_DELAY = 50;

function calculateWPM(){
    return 60*1500 / kreederVars.speed;
}

function getNextWords(change){
    var output = [];
    var counter = 1;
    while (counter <= kreederVars.wCount && $loc-1 < $words.length){
        output.push($words[$loc]);
        counter ++;
        $loc ++;
    }

    if (change != 1)
        changeValueSlider($loc);


    return output;
}

function hasNextBlock(){
    return $loc-1 < $words.length;    
}
String.prototype.replaceAt=function(index, character) {
    return this.substr(0, index) + character + this.substr(index+1, 9999999);
}
function displayWord(words){
    if (words.join(' ') != '')
    {
        var newword = words.join(' ');

    
        var middle = parseInt(newword.length/2);

        
        if (newword[middle])
        {
            if (newword[middle].match(/[a-z]/i) !== null) 
            {
                newword = newword.replaceAt(middle, '</span><span class="centeredw">'+newword[middle]+'</span><span class="rightw">');
            }
            else
            {
                var replaced = false;
                if (newword[middle+1])
                {
                    if (newword[middle+1].match(/[a-z]/i) !== null) 
                    {
                        newword = newword.replaceAt(middle+1, '</span><span class="centeredw">'+newword[middle+1]+'</span><span class="rightw">');
                        replaced = true;
                    }
                }
                if (newword[middle-1] && !replaced)
                {
                    if (newword[middle-1].match(/[a-z]/i) !== null) 
                    {
                        newword = newword.replaceAt(middle-1, '</span><span class="centeredw">'+newword[middle-1]+'</span><span class="rightw">');
                    }    
                }
            }
        }

        newword = newword.replace(' <span class="centeredw">', '&nbsp;<span class="centeredw">');
        newword = newword.replace(' </span>', '&nbsp;</span>');
        newword = newword.replace('<span class="rightw"> ', '<span class="rightw">&nbsp;');
        

        newword = $('<div><span class="leftw">'+newword+'</span></div>');
        if ($('#wordDisplay table').length >0)
        {
            $('#wordDisplay .leftw').html(newword.find('.leftw').html());
            $("#wordDisplay .centeredw").html(newword.find('.centeredw').html());
            $('#wordDisplay .rightw').html(newword.find('.rightw').html());
        }
        else
        {
            newword = "<table border='0' cellspace='0' cellpadding='0' width='100%'><tr><td width='50%' align='right' class='leftw'>"+newword.find('.leftw').html()+"</td><td class='centeredw'>"+newword.find('.centeredw').html()+"</td><td align='left' width='50%' class='rightw'>"+newword.find('.rightw').html()+"</td></tr></table>" ;
            $("#wordDisplay").html(newword);
        }
        
    }
    else
    {
        
        $("#wordDisplay").html('<img src="../icons/ajax.svg" />');
        
    }
        
}

var $currentLoc = 0;
var $oldLoc = 0;
function setLoc(newLoc){
    $oldLoc = $currentLoc;
    $currentLoc = newLoc;
    if($oldLoc === $currentLoc){
        setAutoAdvance(false);
        $('#playPause').click();
        $('#wordDisplay').text('');
    }        
}

function stopPlayback(){
    $playing = false;
    $loc = 0;

    if ($prefetchNavigated) {
        getMsgFromBack("prev");
    }
    clearPrefetchState();
}

function forwardWord(){
    if($playing) return;
    if(hasNextBlock()){
        displayWord(getNextWords());
    }
}

var $playing = false;
var $words = [];
var $loc = 0;
var kreederVars = {
    speed: 500,
    fontsize: 45,
    wCount: 1,
    bkgColor: "blue",
    fgColor: "yellow",
    fontType : {name: "Arial", url: ""},
    autoAdvance : true
};

var SPEED_INC = 50;
var MAX_LIMIT = 1500;
var MIN_LIMIT = 10;
var FONT_INC = 1;
var MAX_FONT_SIZE = 125;
var MIN_FONT_SIZE = 1;
var WCOUNT_INC = 1;
var MAX_WCONT = 5;
var MIN_WCONT = 1;
var PAGE_FETCH_TIMEOUT = 1500;
var PREFETCH_THRESHOLD = 0.9;

// --- Prefetch state ---
var $prefetchedText = null;     // Pre-OCR'd raw text for next page
var $prefetching = false;       // Currently fetching/OCR'ing next page
var $prefetchNavigated = false; // Kindle tab has been navigated ahead for prefetch
var $prefetchTriggered = false; // Prefetch already triggered for this page
var $waitingForPrefetch = false;// Page ended but prefetch not ready yet

function clearPrefetchState() {
    $prefetchedText = null;
    $prefetching = false;
    $prefetchNavigated = false;
    $prefetchTriggered = false;
    $waitingForPrefetch = false;
}

function triggerPrefetch() {
    if ($prefetching || $prefetchedText || $prefetchTriggered) return;
    if (!kreederVars.autoAdvance) return;

    $prefetchTriggered = true;
    $prefetching = true;
    getMsgFromBack("prefetch_next");
}

function usePrefetchedWords() {
    var text = $prefetchedText;
    clearPrefetchState();
    processExtractedText([text]);
}

// --- Tesseract.js OCR ---
var ocrWorker = null;
var ocrInitPromise = null;

function initOCR() {
    if (ocrWorker) return Promise.resolve();
    if (ocrInitPromise) return ocrInitPromise;
    // OEM 3 (best available) — uses LSTM engine which handles multi-column
    // layouts better than legacy. Falls back to legacy if needed.
    ocrInitPromise = Tesseract.createWorker('eng', 3, {
        workerPath: chrome.runtime.getURL('js/tesseract/worker.min.js'),
        corePath: chrome.runtime.getURL('js/tesseract/'),
        langPath: chrome.runtime.getURL('js/tesseract/lang/'),
        workerBlobURL: false
    }).then(function(worker) {
        ocrWorker = worker;
        ocrInitPromise = null;
    }).catch(function(err) {
        ocrInitPromise = null;
        throw err;
    });
    return ocrInitPromise;
}

function runOCR(imageDataUrl) {
    return initOCR().then(function() {
        // Detect column layout from image pixels BEFORE running OCR
        return detectColumnGap(imageDataUrl);
    }).then(function(gap) {
        if (gap.isMultiColumn) {
            // Multi-column: split at the detected gap, OCR each half
            return splitOCR(imageDataUrl, gap.splitX).then(function(split) {
                if (split.left && split.right) return split.left + ' ' + split.right;
                return split.left || split.right || '';
            });
        }
        // Single column: OCR the full image
        return ocrWorker.recognize(imageDataUrl).then(function(result) {
            return (result.data.text || '').trim();
        });
    });
}

// Analyze image pixels to detect a column gap — a vertical whitespace
// strip in the middle of the page where content density drops to near zero.
// Scans the middle 30-70% of the image and compares content pixel density
// across vertical strips. Works regardless of background color (light/dark).
function detectColumnGap(imageDataUrl) {
    return new Promise(function(resolve) {
        var img = new Image();
        img.onload = function() {
            var w = img.width;
            var h = img.height;

            if (w < 600) {
                resolve({ isMultiColumn: false });
                return;
            }

            var canvas = document.createElement('canvas');
            canvas.width = w;
            canvas.height = h;
            var ctx = canvas.getContext('2d', { willReadFrequently: true });
            ctx.drawImage(img, 0, 0);

            // Determine background color from image corners
            var bg = sampleBackground(ctx, w, h);

            // Get pixel data for the middle 30-70% of the image
            var scanLeft = Math.round(w * 0.3);
            var scanRight = Math.round(w * 0.7);
            var scanWidth = scanRight - scanLeft;
            var allPixels = ctx.getImageData(scanLeft, 0, scanWidth, h).data;

            // Sample every Nth column and row for performance
            var colStep = Math.max(1, Math.round(scanWidth / 100));
            var rowStep = Math.max(1, Math.round(h / 200));

            var strips = [];
            var totalDensity = 0;

            for (var col = 0; col < scanWidth; col += colStep) {
                var contentCount = 0;
                var rowsSampled = 0;

                for (var row = 0; row < h; row += rowStep) {
                    var idx = (row * scanWidth + col) * 4;
                    var dr = Math.abs(allPixels[idx] - bg.r);
                    var dg = Math.abs(allPixels[idx + 1] - bg.g);
                    var db = Math.abs(allPixels[idx + 2] - bg.b);
                    if (dr + dg + db > 80) contentCount++;
                    rowsSampled++;
                }

                var density = contentCount / rowsSampled;
                strips.push({ x: scanLeft + col, density: density });
                totalDensity += density;
            }

            if (strips.length === 0) {
                resolve({ isMultiColumn: false });
                return;
            }

            var avgDensity = totalDensity / strips.length;

            // Find the strip with the lowest content density (the gap)
            var minDensity = Infinity;
            var gapX = Math.round(w / 2);
            for (var i = 0; i < strips.length; i++) {
                if (strips[i].density < minDensity) {
                    minDensity = strips[i].density;
                    gapX = strips[i].x;
                }
            }

            // Verify content exists on BOTH sides of the gap
            var leftDensity = 0, rightDensity = 0;
            var leftN = 0, rightN = 0;
            for (var i = 0; i < strips.length; i++) {
                if (strips[i].x < gapX) {
                    leftDensity += strips[i].density;
                    leftN++;
                } else if (strips[i].x > gapX) {
                    rightDensity += strips[i].density;
                    rightN++;
                }
            }
            var leftAvg = leftN > 0 ? leftDensity / leftN : 0;
            var rightAvg = rightN > 0 ? rightDensity / rightN : 0;

            // Multi-column if: clear gap AND meaningful content on both sides
            var isMultiColumn = avgDensity > 0.02 &&
                                minDensity < avgDensity * 0.2 &&
                                leftAvg > 0.02 && rightAvg > 0.02;

            resolve({ isMultiColumn: isMultiColumn, splitX: gapX });
        };
        img.onerror = function() {
            resolve({ isMultiColumn: false });
        };
        img.src = imageDataUrl;
    });
}

// Sample corner regions to determine the page background color.
// Works for both light and dark mode Kindle themes.
function sampleBackground(ctx, w, h) {
    var rSum = 0, gSum = 0, bSum = 0, count = 0;
    var size = 20;
    var corners = [[0, 0], [w - size, 0], [0, h - size], [w - size, h - size]];
    for (var c = 0; c < corners.length; c++) {
        var d = ctx.getImageData(corners[c][0], corners[c][1], size, size).data;
        for (var i = 0; i < d.length; i += 4) {
            rSum += d[i]; gSum += d[i + 1]; bSum += d[i + 2];
            count++;
        }
    }
    return {
        r: Math.round(rSum / count),
        g: Math.round(gSum / count),
        b: Math.round(bSum / count)
    };
}

// Split image at splitX, OCR each half separately.
// Returns { left, right } text strings.
function splitOCR(imageDataUrl, splitX) {
    return new Promise(function(resolve) {
        var img = new Image();
        img.onload = function() {
            var w = img.width;
            var h = img.height;
            var sx = Math.round(splitX);

            var leftCanvas = document.createElement('canvas');
            leftCanvas.width = sx;
            leftCanvas.height = h;
            leftCanvas.getContext('2d').drawImage(img, 0, 0, sx, h, 0, 0, sx, h);

            var rightCanvas = document.createElement('canvas');
            var rw = w - sx;
            rightCanvas.width = rw;
            rightCanvas.height = h;
            rightCanvas.getContext('2d').drawImage(img, sx, 0, rw, h, 0, 0, rw, h);

            var leftUrl = leftCanvas.toDataURL('image/png');
            var rightUrl = rightCanvas.toDataURL('image/png');

            ocrWorker.recognize(leftUrl).then(function(leftResult) {
                return ocrWorker.recognize(rightUrl).then(function(rightResult) {
                    resolve({
                        left: (leftResult.data.text || '').trim(),
                        right: (rightResult.data.text || '').trim()
                    });
                });
            }).catch(function() {
                resolve({ left: '', right: '' });
            });
        };
        img.onerror = function() {
            resolve({ left: '', right: '' });
        };
        img.src = imageDataUrl;
    });
}

function speedUp(){       
    kreederVars.speed += SPEED_INC;
    if(kreederVars.speed> MAX_LIMIT)
        kreederVars.speed = MAX_LIMIT;
    chrome.storage.sync.set({ speed: kreederVars.speed});
    updateVariableDisplay();
}

function speedDown(){    
    kreederVars.speed -= SPEED_INC;
    if(kreederVars.speed< MIN_LIMIT)
        kreederVars.speed = MIN_LIMIT;
    chrome.storage.sync.set({ speed: kreederVars.speed});
    updateVariableDisplay();
}

function fontBigger(){
    kreederVars.fontsize += FONT_INC;
    if(kreederVars.fontsize > MAX_FONT_SIZE)
        kreederVars.fontsize = MAX_FONT_SIZE;
    chrome.storage.sync.set({ fontsize: kreederVars.fontsize});
    updateVariableDisplay();
}

function fontSmaller(){
    kreederVars.fontsize -= FONT_INC;
    if(kreederVars.fontsize < MIN_FONT_SIZE)
        kreederVars.fontsize = MIN_FONT_SIZE;
    chrome.storage.sync.set({ fontsize: kreederVars.fontsize});
    updateVariableDisplay();
}

function numWordsUp(){
    kreederVars.wCount += WCOUNT_INC;
    if(kreederVars.wCount> MAX_WCONT)
        kreederVars.wCount = MAX_WCONT;
    chrome.storage.sync.set({ wCount: kreederVars.wCount});
    updateVariableDisplay();
}

function numWordsDown(){
    kreederVars.wCount -= WCOUNT_INC;
    if(kreederVars.wCount< MIN_WCONT)
        kreederVars.wCount = MIN_WCONT;
    chrome.storage.sync.set({ wCount: kreederVars.wCount});
    updateVariableDisplay();
}

/*
function setFontType(type){
    //TODO: drop down menu
    kreederVars.fontType = $("#fontTypeChooser").text();    
    chrome.storage.sync.set({ fontType: kreederVars.fontType});
    updateVariableDisplay();
}

function setBackground(color){
    //TODO: color picker
    kreederVars.bkgColor = $("#bgColorChooser").text();    
    chrome.storage.sync.set({ bkgColor: kreederVars.bkgColor});
    updateVariableDisplay();
}

function setForeground(color){
    //TODO: color picker
    kreederVars.fgColor = $("#fgColorChooser").text();    
    chrome.storage.sync.set({ fgColor: kreederVars.fgColor});
    updateVariableDisplay();
}
*/

function setAutoAdvance(value){
    kreederVars.autoAdvance = value;
    chrome.storage.sync.set({ autoAdvance: kreederVars.autoAdvance});

    if (!value && ($prefetching || $prefetchedText)) {
        if ($prefetchNavigated) {
            getMsgFromBack("prev");
        }
        clearPrefetchState();
    }

    updateVariableDisplay();
}

function load_options() {
    chrome.storage.sync.get({
        speed: 500,
        fontsize: 45,
        wCount: 1,
        bkgColor: "blue",
        fgColor: "yellow",
        fontType : {name: "Arial", url: ""},
        autoAdvance : true
    }, function(items) {
        kreederVars.speed = items.speed;
        kreederVars.fontsize = items.fontsize;
        kreederVars.wCount = items.wCount;
        kreederVars.bkgColor = items.bkgColor;
        kreederVars.fgColor = items.fgColor;
        kreederVars.fontType = items.fontType;
        kreederVars.autoAdvance = items.autoAdvance;
        updateVariableDisplay();
    });
    
}

function updateVariableDisplay(){
    //TODO: refresh (colors/sizes/fonts)
    $("#spdDisp").text(kreederVars.speed);
    $("#wctDisp").text(kreederVars.wCount);
    $("#fntDisp").text(kreederVars.fontsize);
    document.getElementById('autoAdvance').checked = kreederVars.autoAdvance;

    if (kreederVars.autoAdvance)
    {
        $('#autoadvanceon').removeClass('hidden').show();
        $('#autoadvanceoff').hide();

    }
    else
    {
        $('#autoadvanceoff').removeClass('hidden').show();
        $('#autoadvanceon').hide();
    }

    $("#wordDisplay").css({'font-size':kreederVars.fontsize + "px"});
    //TODO: refresh font size for display page
}

document.addEventListener('DOMContentLoaded', load_options);
document.addEventListener('DOMContentLoaded', function() {
    // Pre-initialize OCR worker so it's ready when the first page arrives
    initOCR().catch(function(err) {
        console.error('Kreeder: OCR init failed', err);
    });
    getCurrentPageContents();
});