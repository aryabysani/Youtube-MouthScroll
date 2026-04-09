// ============================================================
// MouthScroll — background.js (Service Worker)
// Handles: default settings init, tab URL change notifications
// ============================================================

// Set default settings on first install
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({
    enabled: true,
    sensitivity: 0.35,      // normalized mouth-open ratio (0.2 – 0.6)
    browSensitivity: 0.25,  // normalized eyebrow-raise ratio (0.2 – 0.5)
    showPreview: true,
    cooldown: 1500           // ms between triggers
  });
});

// Notify content script when navigation happens within the same tab
// (needed for YouTube SPA navigation between /shorts/ pages)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url) {
    chrome.tabs.sendMessage(tabId, {
      type: 'URL_CHANGED',
      url: changeInfo.url
    }).catch(() => {
      // Content script may not be ready yet — safe to ignore
    });
  }
});
