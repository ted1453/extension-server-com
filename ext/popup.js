document.addEventListener('DOMContentLoaded', function() { 
    document.getElementById('sendMessageButton').addEventListener('click', async () => {
        const message = document.getElementById('messageInput').value;

        let anchors = {};

        // Wrapping chrome.tabs.query and chrome.tabs.sendMessage in a Promise
        const getAnchorsFromActiveTab = () => {
            return new Promise((resolve, reject) => {
                chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
                    if (tabs.length === 0) {
                        return reject('No active tab found.');
                    }

                    chrome.tabs.sendMessage(tabs[0].id, {action: "getAnchors"}, (response) => {
                        if (response && response.anchors) {
                            resolve(response.anchors);
                        } else {
                            resolve({});
                        }
                    });
                });
            });
        };

        try {
            // Get anchors from the active tab
            anchors = await getAnchorsFromActiveTab();
            // console.log("popup:",anchors)
        } catch (error) {
            console.error("Error fetching anchors: ", error);
        }

        if (message) {
            try {
                // Send the message and anchors to the server
                const response = await fetch('http://127.0.0.1:8000/process_message/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ message: message, anchors: anchors }),
                });

                const data = await response.json();
                document.getElementById('serverResponse').textContent = data.response;
                if (data.url) {
                    const a = document.createElement('a');
                    a.href = data.url; 
                    a.target = '_blank';//generates a new tab for click
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                }
            } catch (error) {
                console.error('Error sending data to server: ', error);
            }
        } else {
            alert('Please enter a message.');
        }
    });
});
