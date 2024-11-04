// Listen for messages from the popup or background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "getAnchors") {
        // Get all anchor tags on the page
        let anchors = Array.from(document.querySelectorAll('a')).map(anchor => anchor.href);
        
        // Send the list of anchor URLs back to the background script
        chrome.runtime.sendMessage({ action: 'processAnchors', anchors: anchors });
        
        // Send the anchors as a response to the sender
        sendResponse({ anchors: anchors });
    } else {
        // Handle any other actions if needed
        sendResponse({ error: "Unknown action" });
    }
});