// The ID of the extension we want to talk to.
var editorExtensionId = "opdmbhapgdfklljklphbenadjbdopplh";

// Make a simple request:
chrome.runtime.sendMessage(editorExtensionId, {messagebody: "Cheese"},
  function(response) {    
  });




