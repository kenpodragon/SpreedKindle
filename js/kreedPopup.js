var $port = chrome.extension.connect(chrome.runtime.id);
$port.onMessage.addListener(fromBkgJS);

$( document ).ready(function() {
    $("#nextPage").click(function(){
        getMsgFromBack("next");
    });
    $("#previousPage").click(function(){
        getMsgFromBack("prev");
    });
    $("#extractPage").click(function(){
        getMsgFromBack("ext");
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
});

//Function to retrieve information from background.js
function getMsgFromBack(option){    
    $port.postMessage(option);    
}

function fromBkgJS(msg){    
    if(msg.type==="ext")   
        alert("Content Extracted: " + msg.contents);
    else if (msg.type ==="spdUp")
        speedUp();
    else if (msg.type ==="spdDwn")
        speedDown();
}

var kreederVars = {
    speed: 15,
    fontsize: 20,
    wCount: 1,
    bkgColor: "blue",
    fgColor: "yellow",
    fontType : {name: "Arial", url: ""}
};

var SPEED_INC = 50;
var MAX_LIMIT = 1500;
var MIN_LIMIT = 1;
var FONT_INC = 1;
var MAX_FONT_SIZE = 50;
var MIN_FONT_SIZE = 1;
var WCOUNT_INC = 1;
var MAX_WCONT = 5;
var MIN_WCONT = 1;

function speedUp(){       
    kreederVars.speed += SPEED_INC;
    if(kreederVars.speed> MAX_LIMIT)
        kreederVars.speed += MAX_LIMIT;
    chrome.storage.sync.set({ speed: kreederVars.speed});
    updateVariableDisplay();
}

function speedDown(){    
    kreederVars.speed -= SPEED_INC;
    if(kreederVars.speed> MIN_LIMIT)
        kreederVars.speed += MIN_LIMIT;
    chrome.storage.sync.set({ speed: kreederVars.speed});
    updateVariableDisplay();
}

function fontBigger(){
    kreederVars.fontsize += FONT_INC;
    if(kreederVars.fontsize> MAX_FONT_SIZE)
        kreederVars.fontsize += MAX_FONT_SIZE;
    chrome.storage.sync.set({ fontSize: kreederVars.fontsize});
    updateVariableDisplay();
}

function fontSmaller(){
    kreederVars.fontsize -= FONT_INC;
    if(kreederVars.fontsize> MIN_FONT_SIZE)
        kreederVars.fontsize += MIN_FONT_SIZE;
    chrome.storage.sync.set({ fontSize: kreederVars.fontsize});
    updateVariableDisplay();
}

function numWordsUp(){
    kreederVars.wCount += WCOUNT_INC;
    if(kreederVars.wCount> MAX_WCONT)
        kreederVars.wCount += MAX_WCONT;
    chrome.storage.sync.set({ wCount: kreederVars.wCount});
    updateVariableDisplay();
}

function numWordsDown(){
    kreederVars.wCount -= WCOUNT_INC;
    if(kreederVars.wCount> MAX_WCONT)
        kreederVars.wCount += MAX_WCONT;
    chrome.storage.sync.set({ wCount: kreederVars.wCount});
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

function load_options() {
    // Use default value color = 'red' and likesColor = true.
    chrome.storage.sync.get({
        speed: 15,
        fontsize: 20,
        wCount: 1,
        bkgColor: "blue",
        fgColor: "yellow",
        fontType : {name: "Arial", url: ""}
    }, function(items) {
        kreederVars.speed = items.speed;
        kreederVars.fontsize = items.fontsize;
        kreederVars.wCount = items.wCount;
        kreederVars.bkgColor = items.bkgColor;
        kreederVars.fgColor = items.fgColor;
        kreederVars.fontType = items.fontType;        
    });
    updateVariableDisplay();
}

function updateVariableDisplay(){
    //TODO: redraw variables on the display and refresh (colors/sizes/fonts)
}

document.addEventListener('DOMContentLoaded', load_options);