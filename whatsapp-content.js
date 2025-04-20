console.log('WhatsApp content script initialized');

function injectWPPLibrary() {
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('wppconnect-wa.js');
    script.onload = () => console.log('WPP library loaded successfully');
    script.onerror = (error) => console.error('Failed to load WPP library:', error);
    document.head.appendChild(script);
    console.log('WPP library injected');
}

function isWhatsAppLoaded() {
    return document.querySelector('#side') !== null;
}

function setupWhatsApp() {
    if (isWhatsAppLoaded()) {
        console.log('WhatsApp UI already loaded, injecting WPP');
        injectWPPLibrary();
    } else {
        const observer = new MutationObserver(() => {
            if (isWhatsAppLoaded()) {
                observer.disconnect();
                console.log('WhatsApp UI loaded');
                injectWPPLibrary();
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }
}

// Initial setup
setupWhatsApp();

// Re-run setup on SPA navigation
window.addEventListener('popstate', setupWhatsApp);
window.addEventListener('pushstate', setupWhatsApp);
window.addEventListener('replacestate', setupWhatsApp);

// Notify background script
chrome.runtime.sendMessage({ type: 'WHATSAPP_TAB_READY' });

// Handle messages
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'CALL_WPP') {
        console.log(`Calling WPP.${message.path.join('.')}`);
        const requestId = message.requestId;
        const responseListener = (event) => {
            if (event.data && event.data.action === 'wppResponse' && event.data.requestId === requestId) {
                window.removeEventListener('message', responseListener);
                sendResponse({
                    success: event.data.success,
                    result: event.data.success ? JSON.parse(event.data.result) : null,
                    error: event.data.error
                });
            }
        };
        window.addEventListener('message', responseListener);
        window.postMessage({
            action: 'callWPP',
            requestId,
            path: message.path,
            args: message.args
        }, '*');
        return true; // Keep channel open
    }
});
