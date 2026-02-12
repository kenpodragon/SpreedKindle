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
        } else if (msg.contents === null) {
            $("#wordDisplay").html('<span style="color:orange">Could not capture page image. Make sure a book is open.</span>');
        } else if (Array.isArray(msg.contents)) {
            // Legacy: direct text array
            processExtractedText(msg.contents);
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
    getMsgFromBack("next_and_extract");
}

function fetchPreviousPage(){
    $playing = false;
    $("#wordDisplay").html('<img src="../icons/ajax.svg" /><br><small>Loading previous page...</small>');
    getMsgFromBack("prev_and_extract");
}


var interval = '';
function getCurrentPageContents(){
    if($playing===true && $('#wordDisplay').text() != '')
        return;

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
        if(kreederVars.autoAdvance)
            fetchNextPage();
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

// --- Tesseract.js OCR ---
var ocrWorker = null;
var ocrInitPromise = null;

function initOCR() {
    if (ocrWorker) return Promise.resolve();
    if (ocrInitPromise) return ocrInitPromise;
    ocrInitPromise = Tesseract.createWorker('eng', 0, {
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
        return ocrWorker.recognize(imageDataUrl);
    }).then(function(result) {
        return result.data.text;
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