chrome.runtime.onMessageExternal.addListener(
  function(request, sender, sendResponse) {
    alert(request.messagebody);
  });

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (request.greeting == "hello")
      sendResponse({
        msg: "goodbye!"
      });
  });
