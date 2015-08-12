$( document ).ready(function() {
    $("#checkPage").click(function(){
        getMsgFromBack();
    });
    $("#viewOptions").click(function(){
        var myid = chrome.runtime.id;
        alert(myid);
        //TODO: OPEN chrome://extensions/?options=Extension-ID
    });    
});

//Function to retrieve information from background.js
function getMsgFromBack(){
    chrome.runtime.sendMessage({greeting: "hello" }, processResponse);
}

function processResponse(response){
    alert("processed msg: " +response.msg);
}