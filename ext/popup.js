document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('sendMessageButton').addEventListener('click', async () => {
        const message = document.getElementById('messageInput').value;
        let anchors = {};

        // Wrapping chrome.tabs.query and chrome.tabs.sendMessage in a Promise
        const getAnchorsFromActiveTab = () => {
            return new Promise((resolve, reject) => {
                chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                    if (tabs.length === 0) {
                        return reject('No active tab found.');
                    }

                    chrome.tabs.sendMessage(tabs[0].id, { action: "getAnchors" }, (response) => {
                        if (chrome.runtime.lastError) {
                            // Catch any error in the communication with the content script
                            return reject(chrome.runtime.lastError.message);
                        }
                        if (response && response.anchors) {
                            return resolve(response.anchors);
                        } else {
                            return resolve([]);
                        }
                    });
                });
            });
        };

        try {
            // Get anchors from the active tab
            anchors = await getAnchorsFromActiveTab();
            console.log("popup - anchors received:", anchors);
        } catch (error) {
            console.error("Error fetching anchors from active tab:", error);
            return; // Exit if we cannot fetch anchors
        }

        // Move listener setup outside button click to avoid re-adding listeners
        const getUrlsFromBackground = () => {
            return new Promise((resolve, reject) => {
                const handleMessage = (request) => {
                    if (request.action === 'sendUrls') {
                        console.log("popup - URLs received:", request.urls);
                        resolve(request.urls); // Resolve the promise with the collected URLs
                    } else {
                        console.error('No valid action in the background message.');
                        reject('No valid action received.');
                    }
                };

                // Remove existing listener to avoid multiple listeners
                chrome.runtime.onMessage.removeListener(handleMessage); 
                // Add new listener for message from background script
                chrome.runtime.onMessage.addListener(handleMessage);
            });
        };

        let urls = [];
        try {
            // Get URLs collected by the background script
            urls = await getUrlsFromBackground();
            console.log("popup - final URLs:", urls);
        } catch (error) {
            console.error("Error fetching URLs from background script:", error);
            return; // Exit if we cannot fetch URLs
        }

        // Send data to the server only if the message is not empty
        if (message && urls.length > 0) {
            try {
                const response = await fetch('http://127.0.0.1:8000/process_message/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ message: message, urls: urls }),
                });

                if (response.headers.get('content-type')?.includes('application/json')) {
                    const data = await response.json();
                    if (data && data.response) {
                        document.getElementById('serverResponse').textContent = data.response;
                    } else {
                        console.error('Invalid JSON structure received from server.');
                    }
                } else {
                    const text = await response.text();
                    console.error("Received non-JSON response:", text);
                    throw new Error("Unexpected server response. Not JSON.");
                }
            } catch (error) {
                console.error('Error sending data to server:', error);
            }
        } else {
            console.warn("Message or URLs are empty. Skipping the server request.");
        }
    });
});
