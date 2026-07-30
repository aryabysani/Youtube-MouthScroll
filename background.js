// ============================================================
// MouthScroll — background.js (Service Worker)
// Handles: default settings init, tab URL change notifications
// ============================================================

const DEFAULTS = {
  enabled: true,
  sensitivity: 0.35,      // normalized mouth-open ratio (0.2 – 0.6)
  browSensitivity: 0.25,  // normalized eyebrow-raise ratio (0.2 – 0.5)
  showPreview: true,
  cooldown: 1500,         // ms between triggers
  collapsed: false        // overlay minimized
};

// Fill in only the settings that have never been set.
//
// onInstalled does NOT mean "first install" — it also fires on extension
// update, on Chrome update, and on every reload of an unpacked extension.
// Writing DEFAULTS unconditionally here wiped the user's saved settings on
// each of those, most visibly switching MouthScroll (and the camera) back ON
// after they had turned it off.
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.get(null, stored => {
    const missing = {};
    for (const [key, value] of Object.entries(DEFAULTS)) {
      if (stored[key] === undefined) missing[key] = value;
    }
    if (Object.keys(missing).length) chrome.storage.sync.set(missing);
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
