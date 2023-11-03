const FREE_CURRENCY_API_KEY = "fca_live_mtOy0KqifmhLA6JTN1vBUz8bsiv3Ig2LTGluARij"; // temporary, replace with better method later
const BASE_CURRENCY_CODE = "AUD";
const CURRENCY_DATA_UPDATE_INTERVAL = 3600; // how much time (in seconds) before making another request to update currency data

// will use data from freecurrencyapi.com with AUD as base currency
let currencyDataObject = {};

// when currency data was last requested (unix time)
let requestTimestamp = 0;

let currentTimestamp = Math.floor(Date.now() / 1000); // seconds

let cceDiv;

fetch(chrome.runtime.getURL("/res/popup.html"))
    .then((res) => res.text())
    .then((html) => {
        initialize(html);
    })
    .catch((e) => console.error(`${e}`));

chrome.storage.local.get(
    {requestTimestamp: currentTimestamp},
    (items) => 
    {
        requestTimestamp = items.currentTimestamp;

        if(currentTimestamp - requestTimestamp >= CURRENCY_DATA_UPDATE_INTERVAL) {
            getCurrencyData();
        }
    }
);

function initialize(html) 
{
    let font = new FontFace("Roboto", chrome.runtime.getURL("/res/font/Roboto-Medium.tff"));
    document.fonts.add(font);
    
    // getCurrencyData(BASE_CURRENCY_CODE);

    document.body.insertAdjacentHTML("beforeend", html);
    cceDiv = document.querySelector(".cce-popup-div");

    cceDiv.querySelector("#cce-swap-currencies-arrow").src = chrome.runtime.getURL("/res/images/horizontal-flip.png");

    // let convertButton = cceDiv.querySelector("#cce-convert-button");
    // convertButton.addEventListener("click", onConvertButtonClicked);
}

function onConvertButtonClicked() {
    let baseCurrencyCode = cceDiv.querySelector("#cce-base-currency-input-code").value;
    let comparisonCurrencyCode = cceDiv.querySelector("#cce-comparison-currency-input-code").value;

    let baseCurrencyValue = cceDiv.querySelector("#cce-base-currency-input-value").value;
    let comparisonCurrencyValue = 0;

    console.log(baseCurrencyValue);
    
    // first convert base currency to AUD value
    baseCurrencyValue /= currencyDataObject["data"][baseCurrencyCode];

    // then multiply by value of comparison currency (relative to AUD)
    comparisonCurrencyValue = baseCurrencyValue * currencyDataObject["data"][comparisonCurrencyCode];

    // round to two decimal places
    comparisonCurrencyValue = comparisonCurrencyValue.toFixed(2);

    cceDiv.querySelector("#cce-comparison-currency-input-value").value = comparisonCurrencyValue;

    console.log(baseCurrencyValue);
}

function getCurrencyData(baseCurrencyCode) 
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
            currencyDataObject = data;
        })
        .catch((error) => {
            console.error(error);
        });
}
