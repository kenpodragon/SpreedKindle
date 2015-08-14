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
    $("#setFontType").click(function(){
        setFontType("ARIAL");
    });
    $("#setBackground").click(function(){
        setBackground("COLOR");
    });
    $("#setForeground").click(function(){
        setForeground("COLOR");
    });
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
        setAutoAdvance();
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
}

function processExtractedText(contents){
    //TODO: Need to smush punctuation together
    //TODO: "open parens to the next word
    //TODO: closed parens to the previous word
    //TODO: period/comma/semicolon/colon/exclaimation point to the previous word
    //TODO: ' merge word before and after
    $words = contents;
    $playing = false;
    playPause();
}

function fetchNextPage(){
    //TODO: test and see if the next page actually exists
    //TODO: extract LOC out of the window and use as test variable
    //TODO: if no other next page set playing = false
    getMsgFromBack("next");
    //TODO: extract contents
}

function fetchPreviousPage(){
    getMsgFromBack("prev");
}

function getCurrentPageContents(){
    getMsgFromBack("ext");    
}

function rewindWord(){
    //TODO: only available when playing = false
    $loc --;
    if($loc > 0)
        $loc = 0;
    updateVariableDisplay();
}

function playPause(){
    //TODO: Change icon when playing or pausing
    if($playing){
        $playing = false;
        return;
    }
    $playing = true;    
    wordPlayer();
}

function wordPlayer(){
    //TODO: while playing = true do loop
    //TODO: if end of words arrives then check status of next page
    //TODO: if auto play enabled then fetch next/page and play otherwise stop
}

function stopPlayback(){
    $playing = false;
    $loc = 0;
}

function forwardWord(){
    //TODO: only available when playing = false
    $loc ++;
    if($loc >= $words.length)
        $loc = $words.length -1;
    updateVariableDisplay();
}

var $playing = false;
var $words = [];
var $loc = 0;
var kreederVars = {
    speed: 15,
    fontsize: 20,
    wCount: 1,
    bkgColor: "blue",
    fgColor: "yellow",
    fontType : {name: "Arial", url: ""},
    autoAdvance : true
};

var SPEED_INC = 10;
var MAX_LIMIT = 1500;
var MIN_LIMIT = 10;
var FONT_INC = 1;
var MAX_FONT_SIZE = 50;
var MIN_FONT_SIZE = 1;
var WCOUNT_INC = 1;
var MAX_WCONT = 5;
var MIN_WCONT = 1;

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

function setAutoAdvance(){    
    kreederVars.autoAdvance = document.getElementById('autoAdvance').checked;    
    chrome.storage.sync.set({ autoAdvance: kreederVars.autoAdvance});
    updateVariableDisplay();
}

function load_options() {
    chrome.storage.sync.get({
        speed: 15,
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
    //TODO: show current word
}

document.addEventListener('DOMContentLoaded', load_options);