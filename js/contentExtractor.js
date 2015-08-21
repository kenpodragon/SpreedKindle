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
        $port.postMessage({type: "ext", contents: extractContents()});
    else if (msg==="loc")
        $port.postMessage({type: "loc", contents: extractLoc()}); 
    else if (msg==="slider")
        $port.postMessage({type: "slider", contents: extractPagesBottom()}); 
    else if (msg.indexOf('-moveTo') > 0)
        manageGotoPage(msg);

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

function extractPagesBottom(){
    return $("#kindleReader_footer_message").text();    
}

function extractLoc(){
    return $("#kindleReader_immersiveFooter").text();    
}

function goNext(){
    $(".kindleReader_arrowBtn")[1].click();
}

var gtinterval = '';
function manageGotoPage(msg){
    msg = msg.split('-');
    msg = parseInt(msg[0]);
    gotoPage(msg);

    setTimeout(function(){
        gtinterval = setInterval(function(){
            if (!$('#loading_spinner').is(":visible"))
            {
                clearInterval(gtinterval);
                $port.postMessage({type: "continue", contents: 'continue'}); 
            }
        }, 250);
    }, 250)
}

function gotoPage(page){

    $('#kindleReader_button_goto').click();
    $('#kindleReader_goToMenuItem_goToLocation').click();
    $("#kindleReader_dialog_gotoField").val(page);
    $('button.ui-button.ui-widget.ui-state-default.ui-corner-all.ui-button-text-only').each(function(){
        if ($(this).text() == 'Go to location')
            $(this).click();
    });
}

function goPrev(){
    $(".kindleReader_arrowBtn")[0].click();
}
