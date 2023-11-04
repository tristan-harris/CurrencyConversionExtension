const FREE_CURRENCY_API_KEY = "fca_live_mtOy0KqifmhLA6JTN1vBUz8bsiv3Ig2LTGluARij"; // temporary, replace with better method later
const BASE_CURRENCY_CODE = "AUD";
const CURRENCY_DATA_UPDATE_INTERVAL = 3600; // how much time (in seconds) before making another request to update currency data

// will use data from freecurrencyapi.com with AUD as base currency
let currencyDataObject = {};

// when currency data was last requested (unix time)
let requestTimestamp = 0;

let currentTimestamp = getCurrentTimestamp();
let currentDomain = getCurrentDomain();

let cceDiv;
let popupHtml;

let font = new FontFace("Roboto", chrome.runtime.getURL("/res/font/Roboto-Medium.tff"));
document.fonts.add(font);

// execute functions in response to messages from window.js
chrome.runtime.onMessage.addListener(messageObj => {
    switch(messageObj.message) {
        case "createPopup":
            createPopup();
            break;
        case "destroyPopup":
            destroyPopup();
            break;
        default:
            console.error(`Unknown message "${message}" from window.js`);
            break;
    }
});

chrome.storage.local.get(
    {requestTimestamp: 0, [currentDomain]: false, currencyData: null},
    (items) => 
    {
        // if popup is set to show for current web domain
        if(items[currentDomain]) {
            createPopup();
        }

        requestTimestamp = items.requestTimestamp;

        // if request timestamp not set yet
        if(requestTimestamp == 0) {
            chrome.storage.local.set({requestTimestamp: getCurrentTimestamp()});
            updateCurrencyData(BASE_CURRENCY_CODE);
        }
        // if need to update with new currency data
        else if(currentTimestamp - requestTimestamp >= CURRENCY_DATA_UPDATE_INTERVAL) {
            updateCurrencyData(BASE_CURRENCY_CODE);
        }

        currencyDataObject = items.currencyData;
    }
);

function getPopupHtml(_callback) {
    fetch(chrome.runtime.getURL("/res/popup.html"))
    .then((res) => res.text())
    .then((html) => {
        _callback(html);
    })
    .catch((e) => console.error(`${e}`));
}

function createPopup() {
    if(!document.querySelector(".cce-popup-div"))
    {
        getPopupHtml((popupHtml) => 
        {
            document.body.insertAdjacentHTML("beforeend", popupHtml);
            cceDiv = document.querySelector(".cce-popup-div");

            cceDiv.querySelector("#cce-base-currency-input-value").addEventListener("input", updateCurrencyCalculation);
            cceDiv.querySelector("#cce-base-currency-input-code").addEventListener("change", updateCurrencyCalculation);
            cceDiv.querySelector("#cce-comparison-currency-input-code").addEventListener("change", updateCurrencyCalculation);

            cceDiv.querySelector("#cce-swap-currencies-arrow").src = chrome.runtime.getURL("/res/images/horizontal-flip.png");

            cceDiv.querySelector("#cce-swap-currencies-arrow").addEventListener("click", onSwapArrowClicked);
        });
    }
}

function destroyPopup() {
    if(cceDiv != undefined) {
        cceDiv.remove();
        cceDiv = undefined;
    }
}

function onSwapArrowClicked() {
    let baseCurrencySelect = cceDiv.querySelector("#cce-base-currency-input-code");
    let comparisonCurrencySelect = cceDiv.querySelector("#cce-comparison-currency-input-code");

    let baseCurrencySelectedIndex = baseCurrencySelect.selectedIndex;
    baseCurrencySelect.selectedIndex = comparisonCurrencySelect.selectedIndex;
    comparisonCurrencySelect.selectedIndex = baseCurrencySelectedIndex;

    updateCurrencyCalculation();
}

function updateCurrencyCalculation() 
{
    // check that popup exists and currency data is available
    if(cceDiv == undefined || currencyDataObject == null) {
        return;
    }

    let baseCurrencyCode = cceDiv.querySelector("#cce-base-currency-input-code").value;
    let comparisonCurrencyCode = cceDiv.querySelector("#cce-comparison-currency-input-code").value;
    let baseCurrencyValue = cceDiv.querySelector("#cce-base-currency-input-value").value;
    let comparisonCurrencyValue = 0;

    // first convert base currency to AUD value
    baseCurrencyValue /= currencyDataObject["data"][baseCurrencyCode];

    // then multiply by value of comparison currency (relative to AUD)
    comparisonCurrencyValue = baseCurrencyValue * currencyDataObject["data"][comparisonCurrencyCode];

    // round to two decimal places
    comparisonCurrencyValue = comparisonCurrencyValue.toFixed(2);

    cceDiv.querySelector("#cce-comparison-currency-input-value").value = comparisonCurrencyValue;
}

function updateCurrencyData(baseCurrencyCode) 
{
    // getting the values of all currencies compared to AUD so don't need to make multiple requests
    let allCurrencyCodes = "AUD%2CBRL%2CGBP%2CBGN%2CCAD%2CCNY%2CHRK%2CCZK%2CDKK%2CEUR%2CHKD%2CHUF%2CISK%2CINR%2CIDR%2CILS%2CJPY%2CMYR%2CMXN%2CNZD%2CNOK%2CPHP%2CPLN%2CRON%2CRUB%2CSGD%2CZAR%2CKRW%2CSEK%2CCHF%2CTHB%2CTRY%2CUSD"; // %2C = ','
    let requestUrl = `https://api.freecurrencyapi.com/v1/latest?apikey=${FREE_CURRENCY_API_KEY}&currencies=${allCurrencyCodes}&base_currency=${baseCurrencyCode}`;

    fetch(requestUrl)
        .then((response) => {
            if (response.ok) {
                return response.json(); // Parse the response data as JSON
            } else {
                console.error(`Error: HTTP Status Code ${response.status}`);
            }
        })
        .then((data) => {
            chrome.storage.local.set({requestTimestamp: getCurrentTimestamp(), currencyData: data});
            currencyDataObject = data;
        })
        .catch((error) => {
            console.error(error);
        });
}

function getCurrentTimestamp() {
    return Math.floor(Date.now() / 1000); // seconds
}

function getCurrentDomain() {
    let currentUrl = window.location.href;
    currentUrl = currentUrl.replace("https://", "").replace("http://", "");
    currentUrl = currentUrl.substring(0, currentUrl.indexOf("/"));
    return currentUrl;
}