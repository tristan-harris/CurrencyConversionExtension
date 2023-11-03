chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    if(tabs[0] != undefined) {
        let currentUrl = tabs[0].url;

        // if not chrome://, file:// etc
        if(currentUrl.startsWith("https://") || currentUrl.startsWith("http://")) 
        {
            let websiteDomain = currentUrl.replace("https://", "").replace("http://", "");
            websiteDomain = websiteDomain.substr(0, websiteDomain.indexOf("/"));

            document.querySelector("#cce-current-website").textContent = websiteDomain;
            document.querySelector("#cce-hide-button").removeAttribute("disabled");
            document.querySelector("#cce-show-button").removeAttribute("disabled");
        }
    }
});