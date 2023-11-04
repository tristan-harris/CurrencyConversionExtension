const hideButton = document.querySelector("#cce-hide-button");
const showButton = document.querySelector("#cce-show-button");

const hideButtonColor = "rgb(225, 47, 47)";
const showButtonColor = "rgb(112, 228, 77)";

let websiteDomain = "";
let selectedButton;

// getting the active tab
chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    if(tabs[0] != undefined) {
        let currentUrl = tabs[0].url;

        // if not chrome://, file:// etc
        if(currentUrl.startsWith("https://") || currentUrl.startsWith("http://")) 
        {
            websiteDomain = currentUrl.replace("https://", "").replace("http://", "");
            websiteDomain = websiteDomain.substring(0, websiteDomain.indexOf("/"));

            document.querySelector("#cce-current-website").textContent = websiteDomain;

            hideButton.removeAttribute("disabled");
            showButton.removeAttribute("disabled");

            hideButton.addEventListener("click", onHideButtonClicked);
            showButton.addEventListener("click", onShowButtonClicked);

            updateButtons();
        }
    } else {
        console.error("Cannot access tab information");
    }
});

function updateButtons() {
    chrome.storage.local.get(
        {[websiteDomain]: false}, // default value of false if websiteDomain not stored in chrome storage
        (items) => {
            if(items[websiteDomain]) {
                selectedButton = showButton;
            } else {
                selectedButton = hideButton;
            }
            updateButtonColors();
        }
    );
}

function updateButtonColors() {
    if(selectedButton == showButton) {
        hideButton.setAttribute("style", "");
        showButton.setAttribute("style", `background-color: ${showButtonColor}; border-radius: 2px;`);
    } else {
        hideButton.setAttribute("style", `background-color: ${hideButtonColor}; border-radius: 2px;`);
        showButton.setAttribute("style", "");
    }
}

function onHideButtonClicked() {
    chrome.storage.local.set({[websiteDomain]: false});
    selectedButton = hideButton;
    updateButtonColors();
    sendMessageToMain("destroyPopup");
}

function onShowButtonClicked() {
    chrome.storage.local.set({[websiteDomain]: true});
    selectedButton = showButton;
    updateButtonColors();
    sendMessageToMain("createPopup");
}

function sendMessageToMain(message) {
    chrome.tabs.query({active: true, currentWindow: true}, 
    (tabs) => {
        console.log(tabs[0]);
        chrome.tabs.sendMessage(tabs[0].id, {message: message});
    });
}