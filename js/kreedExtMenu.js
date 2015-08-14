$( document ).ready(function() {
    $("#about").click(function(){        
        chrome.runtime.openOptionsPage(function(){});
    });
    $("#openReader").click(function(){        
        chrome.runtime.sendMessage({type:'open_kreeder'});
    });
});

