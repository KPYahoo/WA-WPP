(async () => {
    // All code within a scope to avoid conflicts with possible variables defined on the zap page

    // Wait for WPP to be ready to use
    await new Promise(r => {
        const interval = setInterval(() => {
            if (WPP.isFullReady) {
                clearInterval(interval);
                r();
            }
        });
    });

    // Indicate that WPP is injected and ready
    window.WPPConnect = true;
    console.log('WA-WPP is injected and ready. window.WPPConnect is set to true.');

    // Use WPP
    const myProfileName = WPP.profile.getMyProfileName();
    console.log("FROM PAGE SCRIPT: " + myProfileName);

    // If you need to use the Chrome API, you must call it from a separate content script, such as content.js
    // You can exchange messages between this script and the content script through custom events:
    window.dispatchEvent(new CustomEvent("MyCustomEvent", { detail: myProfileName }));
})();
