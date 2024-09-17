// Listen for messages from the popup or background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "getAnchors") {
        // Get all anchor tags on the page
        const anchors = document.querySelectorAll('a'); // Get all anchor elements
        const hrefs = []; // Initialize an empty array for hrefs
        // Loop through each anchor and push the href to the array
        anchors.forEach(anchor => {
            hrefs.push(anchor.href);
        });
        // Convert the array of hrefs to a JSON string
        const hrefsJson = JSON.stringify(hrefs);
        // const hrefsJson =  JSON.stringify(document.querySelector('a')?.href || '');
        console.log("content:", hrefsJson);
        sendResponse({anchors: hrefsJson});
    }
});