// Utility to dispatch events with a strict safeguard
const eventQueue = new Set();
function dispatchEvent(eventName, detail) {
  if (eventQueue.has(eventName)) return; // Block re-dispatch
  eventQueue.add(eventName);
  setTimeout(() => {
    try {
      window.dispatchEvent(new CustomEvent(eventName, { detail: detail || {} }));
    } finally {
      eventQueue.delete(eventName);
    }
  }, 0); // Async dispatch to break the call stack
}

// Listen for requests from external scripts
window.addEventListener("wppExecuteAction", (event) => {
  const { method, args } = event.detail || {};
  if (!method || !Array.isArray(args)) {
    dispatchEvent("wppActionResponse", {
      success: false,
      response: "Invalid method or arguments",
    });
    return;
  }
  dispatchEvent("wppExecuteActionInternal", { method, args });
});

// Listen for responses and prevent loop
window.addEventListener("wppActionResponse", (event) => {
  const { success, response } = event.detail || {};
  // Only dispatch if not already in progress
  if (!eventQueue.has("whatsappSendResponse") && !eventQueue.has("wppActionResponse")) {
    dispatchEvent("whatsappSendResponse", { success, response });
  }
});

// Monitor WhatsApp Web loading
function whatsappLoaded() {
  dispatchEvent("whatsappLoaded", { success: true });
}

// Check if WhatsApp Web is loaded
const observer = new MutationObserver((mutations, obs) => {
  if (document.querySelector("#side")) {
    whatsappLoaded();
    obs.disconnect();
  }
});
observer.observe(document, { childList: true, subtree: true });
