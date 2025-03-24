// Listen for messages from content script
chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
    if (request.action === 'webAppToContentjs') {
        console.log("BG Received Message", request);

        // Process the message using wppconnect-wa-v3.16.6.js
        const response = await processMessage(request.message);
        
        // Send the response back to the content script
        sendResponse(response);
        return true; // Indicate that the response will be sent asynchronously
    }
});

// Function to process messages using wppconnect-wa-v3.16.6.js
async function processMessage(message) {
    try {
        // Example: Sending a message using WPP (WhatsApp Web API)
        await WPP.chat.sendTextMessage(message.to, message.content);
        return { success: true, response: "Message sent successfully" };
    } catch (error) {
        console.error("Error sending message:", error);
        return { success: false, response: error.message };
    }
}