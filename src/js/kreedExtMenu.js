$( document ).ready(function() {
    chrome.tabs.query({active:true,currentWindow:true},function(tabArray){
        var activeTab = tabArray[0].url;

        if (activeTab.indexOf('read.amazon') === -1)
        {
            $('.notkindle').show();
            $('.kindle').hide();
        }
        else
        {
            $('.kindle').show();
            $('.notkindle').hide();
        }

        $("#about").click(function(){        
            chrome.runtime.openOptionsPage(function(){});
        });
        $("#openReader").click(function(){        
            chrome.runtime.sendMessage({type:'open_kreeder'});
        });
    });


    
});

