$( document ).ready(function() {
    $("#checkPage").click(function(){
	chrome.runtime.sendMessage({
      		greeting: "hello"
    	},
    	function(response) {
      		document.getElementById("div").textContent = response.msg;
    });
	});
});
