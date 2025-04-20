console.log('WhatsApp Web Bridge initialized in content script');

const pendingRequests = new Map();

function sendToBackground(message, requestId, retryCount = 0) {
    const maxRetries = 3;
    chrome.runtime.sendMessage(message, response => {
        if (chrome.runtime.lastError) {
            console.error('Runtime error:', chrome.runtime.lastError.message);
            if (retryCount < maxRetries) {
                console.log(`Retrying (${retryCount + 1}/${maxRetries})...`);
                setTimeout(() => sendToBackground(message, requestId, retryCount + 1), 1000);
                return;
            }
            window.postMessage({
                action: 'wppBridgeResponse',
                requestId,
                success: false,
                error: 'Extension context invalidated or communication failed: ' + chrome.runtime.lastError.message
            }, '*');
            pendingRequests.delete(requestId);
            return;
        }
        window.postMessage({
            action: 'wppBridgeResponse',
            requestId,
            success: response.success,
            result: response.result,
            error: response.error
        }, '*');
        pendingRequests.delete(requestId);
    });
}

// Listen for messages from web-content.js
window.addEventListener('message', async (event) => {
    if (event.source !== window) return;
    if (event.data && event.data.action === 'callWPPBridge') {
        const { requestId, path, args } = event.data;
        console.log('Received callWPPBridge:', path.join('.'));
        pendingRequests.set(requestId, { path, args });
        sendToBackground({
            type: 'CALL_WPP',
            requestId,
            path,
            args
        }, requestId);
    } else if (event.data && event.data.action === 'startWABatchProcessing') {
        console.log('Received startWABatchProcessing:', event.data.messages.length, 'messages');
        const { messages, webAppUrl } = event.data;
        for (const msg of messages) {
            try {
                if (!msg.id || !msg.phone || !msg.text) {
                    throw new Error(`Invalid message: ${JSON.stringify(msg)}`);
                }
                const whatsappId = `${msg.phone}@c.us`;
                console.log(`Sending to ${whatsappId}...`);
                await window.WPPBridge.WPP.chat.sendTextMessage(whatsappId, msg.text, { createChat: true });
                await fetch(webAppUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: msg.id, status: 'Sent' })
                });
                console.log(`Sent to ${whatsappId}`);
            } catch (err) {
                console.error(`Error sending to ${msg.phone}: ${err.message}`);
                await fetch(webAppUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: msg.id, status: 'Failed', error: err.message })
                });
            }
        }
        console.log('Batch processing completed');
    }
});

// Handle WHATSAPP_TAB_READY
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'WHATSAPP_TAB_READY') {
        console.log('WhatsApp tab is ready');
        sendResponse({ status: 'ok' });
    } else if (message.type === 'WA_BATCH_PROCESS') {
        console.log('Received WA_BATCH_PROCESS:', message.payload.messages.length, 'messages');
        window.postMessage(message.payload, '*');
        sendResponse({ status: 'ok' });
    }
});
