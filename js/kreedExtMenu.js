var $port = chrome.extension.connect(chrome.runtime.id);
$port.onMessage.addListener(fromBkgJS);

$( document ).ready(function() {
    $("#checkPage").click(function(){
        getMsgFromBack();
    });
    $("#viewOptions").click(function(){        
        chrome.runtime.openOptionsPage(function(){});
    });    
});

//Function to retrieve information from background.js
function getMsgFromBack(){    
    $port.postMessage("Cheese");    
}

function fromBkgJS(msg){    
    alert("kreed Message recieved: " + msg);
}