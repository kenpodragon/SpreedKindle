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
    $("#viewOptions").click(function(){        
        chrome.runtime.openOptionsPage(function(){});
    });   
});

//Function to retrieve information from background.js
function getMsgFromBack(option){    
    $port.postMessage(option);    
}

function fromBkgJS(msg){    
    //alert("kreed Message recieved: " + msg);
}


