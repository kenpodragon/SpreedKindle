// The ID of the extension we want to talk to.
window.addEventListener("load", myMain, false);

var $port;

function myMain(evt) {    
    $port = chrome.runtime.connect(editorExtensionId);
    $port.onMessage.addListener(processMessage);      
};

function processMessage(msg){    
    if(msg==="next")
        goNext(); 
    else if (msg==="prev")
        goPrev();
    else if (msg==="ext")
        $port.postMessage(extractContents()); 
}

function extractContents(){   
    var output = new Array();    
    $('div#kindleReader_content').find('iframe').each(function(){        
        var visible = $(this)[0].style.visibility;
        var height = parseFloat($(this)[0].style.height);
        if(visible === 'visible')
            $(this).contents().find('.k4w').each(function(){
                //Get the parent body top value
                //Get the span offsetHeight
                //Calculate to see if it is in range
                //TODO: Find where the current page starts and stops
                //TODO: Only return the displayed text
                if($(this).offset().top>=0&&$(this).offset().top<=(height-$(this)[0].offsetHeight))                    
                    output.push($(this).text());                
            });
    });        
    return output;   
}

function goNext(){
    $(".kindleReader_arrowBtn")[1].click();
}

function goPrev(){
    $(".kindleReader_arrowBtn")[0].click();
}
