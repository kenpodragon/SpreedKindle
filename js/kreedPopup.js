var $port = chrome.extension.connect(chrome.runtime.id);
$port.onMessage.addListener(fromBkgJS);

$( document ).ready(function() {
    $("#nextPage").click(function(){
        fetchNextPage();
    });
    $("#previousPage").click(function(){
        fetchPreviousPage();
    });
    $("#extractPage").click(function(){
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
});

//Function to retrieve information from background.js
function getMsgFromBack(option){    
    $port.postMessage(option);    
}

function fromBkgJS(msg){    
    if(msg.type==="ext")   
        processExtractedText(msg.contents);
    else if (msg.type ==="spdUp")
        speedUp();
    else if (msg.type ==="spdDwn")
        speedDown();
    else if (msg.type ==="loc")
        setLoc(msg.contents);
}

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
        .replace(/[,;:.!?]([^\s^"])/g, ", $1")
        .replace(/\."/g, '." ')
        .replace(/\?"/g, '?" ')
        .replace(/!"/g, '!" ')
        .replace(/""/g, '" "')        
        .trim().split(" ");
    $loc = 0;    
    $playing = false;
    playPause();
}

function fetchNextPage(){    
    $playing = false;
    getMsgFromBack("next");    
    setTimeout(function(){
       processNextPage(); 
    },PAGE_FETCH_TIMEOUT);
}

function fetchPreviousPage(){
    $playing = false;
    getMsgFromBack("prev");
    setTimeout(function(){
       processNextPage(); 
    },PAGE_FETCH_TIMEOUT);      
}

function processNextPage(){
    getCurrentLoc(); 
    getMsgFromBack("ext");  
}

function getCurrentPageContents(){
    if($playing===true)
        return;
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
        $("#playPause").text("Play");
        return;
    }
    $playing = true;
    $("#playPause").text("Pause");
    wordPlayer();
}

function wordPlayer(){
    if(!$playing)
        return;
    if(hasNextBlock()){
        //TODO: formula corrections
        var dispDelay = calculateWPM();
        displayWord(getNextWords());
        updateVariableDisplay();
        setTimeout(function(){
        wordPlayer(); 
            },dispDelay);
    } else {
        $playing = false;
        if(kreederVars.autoAdvance)
            fetchNextPage();
    }    
}

function calculateWPM(){
    return 60*2000 / kreederVars.speed;
}

function getNextWords(){
    var output = [];
    var counter = 1;
    while (counter <= kreederVars.wCount && $loc-1 < $words.length){
        output.push($words[$loc]);
        counter ++;
        $loc ++;
    }
    return output;
}

function hasNextBlock(){
    return $loc-1 < $words.length;    
}

function displayWord(words){
    $("#wordDisplay").text(words.join(" "));
}

var $currentLoc = 0;
var $oldLoc = 0;
function setLoc(newLoc){
    $oldLoc = $currentLoc;
    $currentLoc = newLoc;
    if($oldLoc === $currentLoc){
        setAutoAdvance(false);
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
    fontsize: 20,
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
var MAX_FONT_SIZE = 50;
var MIN_FONT_SIZE = 1;
var WCOUNT_INC = 1;
var MAX_WCONT = 5;
var MIN_WCONT = 1;
var PAGE_FETCH_TIMEOUT = 500;

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
        fontsize: 20,
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
    //TODO: refresh font size for display page
}

document.addEventListener('DOMContentLoaded', load_options);
document.addEventListener('DOMContentLoaded', getCurrentPageContents);