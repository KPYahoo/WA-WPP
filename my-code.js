//VALS: my-code.js runs in the MAIN world, directly on WhatsApp Web
//VALS: Exposes window.WPP for external scripts and handles WPP interactions

//VALS: Wait for WPP (from wa-js) to be fully ready
function waitForWPP() {
  if (window.WPP && window.WPP.isFullReady) {
    //VALS: WPP is ready, expose it and set up listeners
    initializeWPP();
  } else {
    setTimeout(waitForWPP, 500);
  }
}

//VALS: Initialize WPP and set up event listeners
function initializeWPP() {
  //VALS: Set a flag to indicate WPP is ready
  window.WPPConnect = true;

  //VALS: window.WPP is already exposed by wa-js, no need to redefine
  //VALS: External scripts can now call any WPP method (e.g., WPP.chat.sendTextMessage)

  //VALS: Listen for action requests from content.js
  window.addEventListener("wppExecuteActionInternal", (event) => {
    const { method, args } = event.detail || {};

    //VALS: Dynamically call the WPP method (e.g., "chat.sendTextMessage")
    const methodParts = method.split(".");
    let fn = window.WPP;
    for (const part of methodParts) {
      fn = fn[part];
      if (!fn) {
        window.dispatchEvent(new CustomEvent("wppActionResponse", {
          detail: { success: false, response: `Method ${method} not found` }
        }));
        return;
      }
    }

    //VALS: Call the method with the provided arguments
    //VALS: No try-catch; let errors bubble up to the caller
    Promise.resolve(fn(...args))
      .then((result) => {
        //VALS: Dispatch success event for key actions
        if (method === "chat.sendTextMessage" || method === "chat.sendFileMessage") {
          window.dispatchEvent(new CustomEvent("wppMessageSent", {
            detail: { success: true, response: result }
          }));
        } else if (method === "group.create") {
          window.dispatchEvent(new CustomEvent("wppGroupCreated", {
            detail: { success: true, response: result }
          }));
        }

        //VALS: Forward the result to content.js
        window.dispatchEvent(new CustomEvent("wppActionResponse", {
          detail: { success: true, response: result }
        }));
      })
      .catch((error) => {
        //VALS: Forward the error to content.js; external script handles it
        window.dispatchEvent(new CustomEvent("wppActionResponse", {
          detail: { success: false, response: error.message }
        }));
      });
  });
}

//VALS: Start waiting for WPP to be ready
waitForWPP();
