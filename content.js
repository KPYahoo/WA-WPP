// Listen for custom events from the web application
window.addEventListener("sendMessageEvent", async (event) => {
    // Extract the message details from the event
    const message = event.detail;

    // Validate the message (Ensure it is a string)
    if (message && typeof message === "string") {
        // Prepare the message data to be sent to the background script
        const messageData = {
            action: 'webAppToContentjs',
            message: message
        };

        // Send the validated message to the background script and wait for a response
        const response = await chrome.runtime.sendMessage(messageData);

        // Check if the response indicates success or failure
        if (!response.success) {
            // Dispatch a custom event with the response details to notify the web application
            triggerMessageResponse(response.response, response.success, message);
        } else {
            // Dispatch a custom event with the response details to notify the web application
            triggerMessageResponse(response.response, response.success, message);
        }
    }
});

// Existing code: Listen for MyCustomEvent from the web application
window.addEventListener("MyCustomEvent", (event) => {
    // Log the event details
    console.log("FROM CONTENT SCRIPT: " + event.detail);
});

// Event listener for responses from the background script
const responseEvent = 'whatsappSendResponse';
document.addEventListener(responseEvent, (e) => {
    // Handle the response event as needed (e.g., log the response)
    console.log("Response from background script:", e.detail);
});

// Function to dispatch a custom event with the response details
function triggerMessageResponse(response, isSuccess, message) {
    // Prepare the data to be included in the custom event
    let data = { message: message, success: isSuccess, response: response };
    
    // Dispatch the custom event with the prepared data
    document.dispatchEvent(new CustomEvent(responseEvent, { detail: data }));
}

// Set up an observer to monitor when WhatsApp Web is fully loaded
function setWhatsappLoadingObserver() {
    // Select the target element by its ID
    const targetId = "side";
    console.log("Setting observer to monitor WhatsApp Web loading");

    // Create a new MutationObserver instance
    const observer = new MutationObserver((mutationsList) => {
        // Check if the target element is now present in the DOM
        if (document.getElementById(targetId)) {
            // Disconnect the observer
            observer.disconnect();
            // Call the function to handle the event
            whatsappLoaded();
        }
    });

    // Start observing the document body for changes
    observer.observe(document.body, { childList: true, subtree: true });
}

// Function to be called when WhatsApp Web is fully loaded
function whatsappLoaded() {
    console.log("WhatsApp Web is fully loaded");

    // Example of attaching additional scripts after loading (if needed)
    setTimeout(() => {
        // Uncomment and modify the following lines to add additional scripts to the DOM
        // addScriptToDom('path/to/your/script.js');
    }, 1000);
}

// Function to dynamically add a script to the DOM
function addScriptToDom(path) {
    console.log("Adding script to DOM:", path);
    var s = document.createElement('script');
    s.src = chrome.runtime.getURL(path);
    (document.head || document.documentElement).appendChild(s);
}

// Function to execute a code snippet in the DOM context
function executeSnippetToDom(source) {
    var script = document.createElement("script");
    script.textContent = source;
    (document.head || document.documentElement).appendChild(script);
}

// Function to post a message to the window
function postWidownMessage(action, data) {
    window.postMessage({
        action: action,
        ...data
    }, "*");
}

// Initialize the WhatsApp loading observer if on the WhatsApp Web URL
if (window.location.href.includes('web.whatsapp.com')) {
    setWhatsappLoadingObserver();
}