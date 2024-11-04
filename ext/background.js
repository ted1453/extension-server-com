let anchorQueue = []; // Queue to store anchors to be processed
let processedTabs = new Set(); // To keep track of processed tabs
let parentTabsToClose = new Set(); // Track parent tabs that need to be closed
let collectedUrls = []; // Array to store all collected URLs
let firstParentTabId = null;
let childTabs = new Set(); // Store IDs of child tabs opened

chrome.runtime.onInstalled.addListener(() => {
    console.log("Extension installed.");
});

// Listen for incoming messages from content scripts
chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
    if (request.action === 'processAnchors') {
        // Add the anchor URLs to the queue
        anchorQueue.push(...request.anchors);
        if (!firstParentTabId) {
            firstParentTabId = sender.tab.id;
        }
        
        // Start processing the queue if it's not started yet
        if (anchorQueue.length > 0 && !processedTabs.has(sender.tab.id)) {
            processedTabs.add(sender.tab.id);
            await processNextAnchors(sender.tab.id);
        }
    }
    
    if (request.action === 'sendUrls') {
        // Respond with the collected URLs
        sendResponse({ urls: collectedUrls });
    }
});

// Function to process the next set of anchors and open new tabs
async function processNextAnchors(parentTabId) {
    while (anchorQueue.length > 0) {
        let currentLevelUrls = [...anchorQueue]; // Copy current level
        anchorQueue = []; // Clear the main queue for the next level

        // Open all URLs from the current level in new tabs
        for (const url of currentLevelUrls) {
            collectedUrls.push(url); // Collect the URL in BFS order
            try {
                await openTabAndWait(url); // Wait until each child tab is fully loaded
            } catch (error) {
                console.error("Error processing tab for URL:", url, error);
            }
        }

        // Close the parent tab after child tabs are opened
        if (parentTabId && !parentTabsToClose.has(parentTabId) && parentTabId !== firstParentTabId) {
            await closeTab(parentTabId);
            parentTabsToClose.add(parentTabId); // Mark parent tab as closed
        }
    }

    console.log("No more anchors to process.");
    checkAndCloseTabs();
}

// Function to open a tab and wait until it's loaded
function openTabAndWait(url) {
    return new Promise((resolve, reject) => {
        chrome.tabs.create({ url: url }, function (childTab) {
            if (chrome.runtime.lastError) {
                return reject(chrome.runtime.lastError.message);
            }

            childTabs.add(childTab.id);

            chrome.tabs.onUpdated.addListener(function listener(tabId, changeInfo) {
                if (tabId === childTab.id && changeInfo.status === 'complete') {
                    // Tab has fully loaded
                    chrome.tabs.sendMessage(tabId, { action: 'getAnchors' }, (response) => {
                        if (chrome.runtime.lastError) {
                            console.error("Error sending message to tab:", chrome.runtime.lastError.message);
                        }

                        chrome.tabs.onUpdated.removeListener(listener); // Clean up listener
                        resolve(); // Resolve when tab is fully loaded and anchors are processed
                    });
                }
            });
        });
    });
}

// Function to close a tab
function closeTab(tabId) {
    return new Promise((resolve, reject) => {
        chrome.tabs.remove(tabId, () => {
            if (chrome.runtime.lastError) {
                return reject(chrome.runtime.lastError.message);
            }
            console.log("Closed tab: " + tabId);
            resolve();
        });
    });
}

// Function to check if all child tabs are done and close them except the first parent tab
function checkAndCloseTabs() {
    let allProcessed = true;

    // Check if any child tab is still active
    childTabs.forEach(tabId => {
        chrome.tabs.get(tabId, (tab) => {
            if (tab && tab.status !== 'complete') {
                allProcessed = false; // If any tab is still loading, don't close yet
            }
        });
    });

    // If all child tabs are processed, close them
    if (allProcessed) {
        closeAllChildTabs();
    } else {
        // Retry after a short delay to check again
        setTimeout(checkAndCloseTabs, 1000); // Check again after 1 second
    }
}

// Function to close all child tabs
function closeAllChildTabs() {
    childTabs.forEach(async (tabId) => {
        try {
            await closeTab(tabId);
        } catch (error) {
            console.error("Error closing tab: " + tabId, error);
        }
    });

    // Clear the set after closing all child tabs
    childTabs.clear();
}
