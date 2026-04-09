// ============================================================
// MouthScroll — popup.js
// Reads/writes chrome.storage.sync and updates UI in real time.
// ============================================================

const chkEnabled  = document.getElementById('chk-enabled');
const chkPreview  = document.getElementById('chk-preview');
const sliderSens  = document.getElementById('slider-sensitivity');
const sliderBrow  = document.getElementById('slider-brow');
const sliderCool  = document.getElementById('slider-cooldown');
const hintSens    = document.getElementById('hint-sensitivity');
const hintBrow    = document.getElementById('hint-brow');
const hintCool    = document.getElementById('hint-cooldown');

function save(key, value) { chrome.storage.sync.set({ [key]: value }); }

function levelLabel(v, lo, hi) {
  return v <= lo ? 'Low' : v >= hi ? 'High' : 'Med';
}

function refreshHints(s) {
  hintSens.textContent = `${levelLabel(s.sensitivity,    0.25, 0.45)} (${(+s.sensitivity).toFixed(2)})`;
  hintBrow.textContent = `${levelLabel(s.browSensitivity,0.22, 0.40)} (${(+s.browSensitivity).toFixed(2)})`;
  hintCool.textContent = `${(s.cooldown / 1000).toFixed(1)}s`;
}

// Load saved settings
chrome.storage.sync.get(
  { enabled:true, sensitivity:0.35, browSensitivity:0.30, showPreview:true, cooldown:1500 },
  s => {
    chkEnabled.checked = s.enabled;
    chkPreview.checked = s.showPreview;
    sliderSens.value   = s.sensitivity;
    sliderBrow.value   = s.browSensitivity;
    sliderCool.value   = s.cooldown;
    refreshHints(s);
  }
);

chkEnabled.addEventListener('change', () => save('enabled',    chkEnabled.checked));
chkPreview.addEventListener('change', () => save('showPreview', chkPreview.checked));

sliderSens.addEventListener('input', () => {
  save('sensitivity', parseFloat(sliderSens.value));
  refreshHints({ sensitivity: sliderSens.value, browSensitivity: sliderBrow.value, cooldown: sliderCool.value });
});
sliderBrow.addEventListener('input', () => {
  save('browSensitivity', parseFloat(sliderBrow.value));
  refreshHints({ sensitivity: sliderSens.value, browSensitivity: sliderBrow.value, cooldown: sliderCool.value });
});
sliderCool.addEventListener('input', () => {
  save('cooldown', parseInt(sliderCool.value, 10));
  refreshHints({ sensitivity: sliderSens.value, browSensitivity: sliderBrow.value, cooldown: sliderCool.value });
});
