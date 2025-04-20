(function() {
    console.log('WPP injector initialized in MAIN world');

    window.addEventListener('message', async (event) => {
        if (event.source !== window) return;
        if (event.data && event.data.action === 'callWPP') {
            const { requestId, path, args } = event.data;
            try {
                if (!window.WPP) {
                    let attempts = 0;
                    while (!window.WPP && attempts < 30) {
                        await new Promise(resolve => setTimeout(resolve, 500));
                        attempts++;
                    }
                    if (!window.WPP) {
                        throw new Error('WPP library not loaded after waiting');
                    }
                }
                let func = window.WPP;
                for (const key of path) {
                    func = func[key];
                    if (!func) {
                        throw new Error(`WPP.${path.join('.')} is not defined`);
                    }
                }
                if (typeof func !== 'function') {
                    throw new Error(`WPP.${path.join('.')} is not a function`);
                }
                const result = await func(...args);
                window.postMessage({
                    action: 'wppResponse',
                    requestId,
                    success: true,
                    result: JSON.stringify(result)
                }, '*');
            } catch (error) {
                window.postMessage({
                    action: 'wppResponse',
                    requestId,
                    success: false,
                    error: error.message
                }, '*');
            }
        }
    });
})();
