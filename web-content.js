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
    if (event.source !== window) return;

    if (event.data && event.data.action === 'wppBridgeResponse') {
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
    } else if (event.data && event.data.action === 'openBatchPage') {
      // Trigger batch page opening
      chrome.runtime.sendMessage({ type: 'OPEN_BATCH_PAGE' }, response => {
        if (response.status === 'ok') {
          console.log('Batch page opened');
        }
      });
    } else if (event.data && event.data.action === 'startWABatchProcessing') {
      // Forward full batch to the WhatsApp tab context (web-bridge.js)
      chrome.runtime.sendMessage({ type: 'WA_BATCH_PROCESS', payload: event.data }, (response) => {
        console.log('Batch forward status:', response?.status || response);
      });
    }
  });
})();
