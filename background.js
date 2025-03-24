//VALS: Background script is currently minimal, acting as a placeholder
//VALS: Will be used for future Google Sheets integration to handle API calls securely

//VALS: Listen for messages from content.js (for future use)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  //VALS: For now, no logic is needed since my-code.js handles WPP interactions
  //VALS: In the future, this will handle Sheets API calls and forward data to my-code.js
  sendResponse({ success: true, response: "Background script ready" });
});
