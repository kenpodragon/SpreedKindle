//Utility function to inject into loaded pages
var actualCode = ['var editorExtensionId = "'+chrome.runtime.id+'"'];

var varinject = document.createElement('script');
varinject.textContent = actualCode;
(document.head||document.documentElement).appendChild(varinject);
varinject.parentNode.removeChild(varinject);

var s = document.createElement('script');
s.src = chrome.extension.getURL('js/contentExtractor.js');
s.onload = function() {
    this.parentNode.removeChild(this);
};
(document.head||document.documentElement).appendChild(s);




