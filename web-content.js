(function() {
  console.log('Web content script initialized in MAIN world');

  const pendingRequests = new Map();

  const WPPHandler = {
    get(target, prop) {
      if (typeof prop === 'string') {
        return new Proxy({ path: [prop] }, WPPModuleHandler);
      }
      return undefined;
    }
  };

  const WPPModuleHandler = {
    get(target, prop) {
      if (typeof prop === 'string') {
        const newPath = [...target.path, prop];
        if (prop.startsWith('send') || prop === 'queryExist' || prop === 'isAuthenticated') {
          return async (...args) => {
            return new Promise((resolve, reject) => {
              const requestId = 'req_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
              pendingRequests.set(requestId, { resolve, reject });
              console.log('Sending WPP request:', { requestId, path: newPath, args });
              window.postMessage({
                action: 'callWPPBridge',
                requestId,
                path: newPath,
                args
              }, '*');
            });
          };
        }
        return new Proxy({ path: newPath }, WPPModuleHandler);
      }
      return undefined;
    }
  };

  window.WPPBridge = {
    WPP: new Proxy({}, WPPHandler)
  };

  window.addEventListener('message', (event) => {
    if (event.source !== window) {
      console.log('Ignoring message from different source:', event.source);
      return;
    }

    if (event.data && event.data.action === 'wppBridgeResponse') {
      console.log('Received WPP bridge response:', event.data);
      const { requestId, success, result, error } = event.data;
      const request = pendingRequests.get(requestId);
      if (request) {
        if (success) {
          request.resolve(result);
        } else {
          request.reject(new Error(error || 'Unknown error'));
        }
        pendingRequests.delete(requestId);
      }
    } else if (event.data && event.data.action === 'startWABatchProcessing') {
      console.log('Received batch processing request:', event.data);
      // Forward full batch to the WhatsApp tab context (web-bridge.js)
      try {
        chrome.runtime.sendMessage({ 
          type: 'WA_BATCH_PROCESS', 
          payload: event.data 
        }, (response) => {
          if (chrome.runtime.lastError) {
            console.error('Error sending batch to background:', chrome.runtime.lastError);
            return;
          }
          console.log('Batch forward status:', response?.status || response);
        });
        console.log('Batch message sent to background script');
      } catch (error) {
        console.error('Failed to send batch message:', error);
      }
    }
  });

  console.log('Web content script setup completed');
})();
