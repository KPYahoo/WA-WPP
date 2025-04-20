console.log('Background script initialized');

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background received:', message);

  if (message.type === 'CALL_WPP') {
    chrome.tabs.query({ url: 'https://web.whatsapp.com/*' }, tabs => {
      if (tabs.length === 0) {
        sendResponse({
          success: false,
          error: 'WhatsApp Web tab not found'
        });
        return;
      }

      chrome.tabs.sendMessage(tabs[0].id, {
        type: 'CALL_WPP',
        requestId: message.requestId,
        path: message.path,
        args: message.args
      }, response => {
        if (chrome.runtime.lastError) {
          sendResponse({
            success: false,
            error: 'Failed to communicate with WhatsApp Web tab: ' + chrome.runtime.lastError.message
          });
          return;
        }
        sendResponse(response);
      });
    });
    return true;
  } else if (message.type === 'WHATSAPP_TAB_READY') {
    console.log('WhatsApp tab ready from tab:', sender.tab.id);
    sendResponse({ status: 'ok' });
  } else if (message.type === 'WA_BATCH_PROCESS') {
    chrome.tabs.query({ url: 'https://web.whatsapp.com/*' }, tabs => {
      if (tabs.length === 0) {
        sendResponse({
          success: false,
          error: 'WhatsApp Web tab not found'
        });
        return;
      }
      chrome.tabs.sendMessage(tabs[0].id, message, response => {
        if (chrome.runtime.lastError) {
          sendResponse({
            success: false,
            error: 'Failed to communicate with WhatsApp Web tab: ' + chrome.runtime.lastError.message
          });
          return;
        }
        sendResponse(response);
      });
    });
    return true;
  }
});

chrome.runtime.onSuspend.addListener(() => {
  console.log('Background script suspending');
});
