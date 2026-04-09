// ============================================================
// MouthScroll — content.js
// Gestures:
//   Shorts / Reels  — mouth open+close → next video
//                   — eyebrows raise   → previous video
//   YouTube /watch  — mouth open+close → pause / resume
// All processing is local — no data leaves the browser.
// ============================================================

(function () {
  'use strict';

  if (window.__mouthScrollActive) return;
  window.__mouthScrollActive = true;

  // ── Platform detection ──────────────────────────────────────
  function detectPlatform(url = window.location.href) {
    if (url.includes('youtube.com/shorts')) return 'youtube';
    if (url.includes('youtube.com/watch'))  return 'youtube-video';
    if (url.includes('instagram.com/reels')) return 'instagram';
    return null;
  }

  // ── State ───────────────────────────────────────────────────
  let platform = detectPlatform();
  let settings = {
    enabled: true,
    sensitivity: 0.35,      // mouth open threshold (normalized)
    browSensitivity: 0.25,  // eyebrow raise threshold (normalized)
    showPreview: true,
    cooldown: 1500
  };

  let stream            = null;
  let animFrameId       = null;
  let modelsLoaded      = false;
  let isRunning         = false;

  // Mouth state: CLOSED → OPEN → CLOSED triggers action
  let mouthWasOpen      = false;
  let lastActionTime    = 0;  // shared cooldown for mouth + brow

  // Brow state: NEUTRAL → RAISED → NEUTRAL triggers scroll-up
  let browWasRaised     = false;

  let lastDetectionTime = 0;

  // DOM refs
  let videoEl       = null;
  let overlayEl     = null;
  let previewEl     = null;
  let mouthDot      = null;  // orange indicator dot
  let browDot       = null;  // blue indicator dot
  let statusEl      = null;
  let modeLabelEl   = null;

  // ── Euclidean distance ──────────────────────────────────────
  function dist(a, b) {
    return Math.sqrt((a.x-b.x)**2 + (a.y-b.y)**2);
  }

  // ── Mouth openness (normalized) ─────────────────────────────
  // Ratio: (upper lip ↔ lower lip) / (left eye corner ↔ right eye corner)
  function getMouthOpenness(pts) {
    const gap     = dist(pts[51], pts[57]); // lip top-center → bottom-center
    const eyeSpan = dist(pts[36], pts[45]); // eye corners
    return eyeSpan > 0 ? gap / eyeSpan : 0;
  }

  // ── Eyebrow raise (normalized) ──────────────────────────────
  // Averages ALL 5 brow points per side vs ALL upper-lid points per side.
  // Ratio: avg(brow→eyeTop gap) / eye-span.  Grows as brows lift.
  function getBrowRaise(pts) {
    // Left brow: 17–21  |  Right brow: 22–26
    // Left eye upper lid: 37, 38  |  Right eye upper lid: 43, 44
    const avgY = (indices) => indices.reduce((s, i) => s + pts[i].y, 0) / indices.length;

    const leftBrowY   = avgY([17, 18, 19, 20, 21]);
    const rightBrowY  = avgY([22, 23, 24, 25, 26]);
    const leftEyeTopY = avgY([37, 38]);
    const rightEyeTopY= avgY([43, 44]);

    // y-down coords: eyeTop.y > browY always; gap grows when brows lift
    const gap = ((leftEyeTopY - leftBrowY) + (rightEyeTopY - rightBrowY)) / 2;

    const eyeSpan = dist(pts[36], pts[45]);
    return eyeSpan > 0 ? gap / eyeSpan : 0;
  }

  // ── Audio feedback ──────────────────────────────────────────
  let audioCtx = null;
  function playTone(freq1 = 800, freq2 = 400, dur = 0.1) {
    try {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc  = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain); gain.connect(audioCtx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq1, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(freq2, audioCtx.currentTime + dur);
      gain.gain.setValueAtTime(0.35, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
      osc.start(); osc.stop(audioCtx.currentTime + dur);
    } catch (_) {}
  }

  // ── Actions ─────────────────────────────────────────────────
  function canAct() {
    const now = Date.now();
    if (now - lastActionTime < settings.cooldown) return false;
    lastActionTime = now;
    return true;
  }

  function flashDot(dot, cls) {
    if (!dot) return;
    dot.classList.add(cls);
    setTimeout(() => dot.classList.remove(cls), 450);
  }

  // Scroll down (next) — Shorts / Reels
  function scrollNext() {
    if (!canAct()) return;
    playTone(800, 400);
    flashDot(mouthDot, 'ms-triggered');

    if (platform === 'youtube') {
      const btn = document.querySelector(
        '#navigation-button-down button, ' +
        'ytd-button-renderer#navigation-button-down button, ' +
        'ytd-shorts button[aria-label*="Next" i]'
      );
      if (btn) btn.click();
      else window.dispatchEvent(new KeyboardEvent('keydown',
        { key:'ArrowDown', keyCode:40, which:40, bubbles:true, cancelable:true, composed:true }));

    } else if (platform === 'instagram') {
      blurActiveInput();
      ['document', 'body', 'window'].forEach(t => {
        const target = t === 'window' ? window : t === 'body' ? document.body : document;
        target.dispatchEvent(new KeyboardEvent('keydown',
          { key:'ArrowDown', keyCode:40, which:40, bubbles:true, cancelable:true, composed:true }));
      });
    }

    setStatus('⬇️ Next!');
    setTimeout(() => setStatus('👀 Watching…'), 800);
  }

  // Scroll up (prev) — Shorts / Reels
  function scrollPrev() {
    if (!canAct()) return;
    playTone(500, 900); // reversed pitch = going up
    flashDot(browDot, 'ms-triggered-brow');

    if (platform === 'youtube') {
      const btn = document.querySelector(
        '#navigation-button-up button, ' +
        'ytd-button-renderer#navigation-button-up button, ' +
        'ytd-shorts button[aria-label*="Previous" i]'
      );
      if (btn) btn.click();
      else window.dispatchEvent(new KeyboardEvent('keydown',
        { key:'ArrowUp', keyCode:38, which:38, bubbles:true, cancelable:true, composed:true }));

    } else if (platform === 'instagram') {
      blurActiveInput();
      ['document', 'body', 'window'].forEach(t => {
        const target = t === 'window' ? window : t === 'body' ? document.body : document;
        target.dispatchEvent(new KeyboardEvent('keydown',
          { key:'ArrowUp', keyCode:38, which:38, bubbles:true, cancelable:true, composed:true }));
      });
    }

    setStatus('⬆️ Previous!');
    setTimeout(() => setStatus('👀 Watching…'), 800);
  }

  // Seek forward 5s — YouTube /watch (spams while brows held up)
  let lastSeekTime = 0;
  function seekForward5() {
    const now = Date.now();
    if (now - lastSeekTime < 500) return; // fire every 500 ms while held
    lastSeekTime = now;
    playTone(700, 1000, 0.07);
    flashDot(browDot, 'ms-triggered-brow');
    const video = document.querySelector('video.html5-main-video') ||
                  document.querySelector('video');
    if (video) {
      video.currentTime = Math.min(video.currentTime + 5, video.duration || Infinity);
    } else {
      // Fallback: ArrowRight = YouTube +5s shortcut
      document.dispatchEvent(new KeyboardEvent('keydown',
        { key:'ArrowRight', keyCode:39, which:39, bubbles:true, cancelable:true }));
    }
    setStatus('⏩ +5s');
  }

  // Pause / Resume — YouTube /watch
  function togglePlayback() {
    if (!canAct()) return;
    const video = document.querySelector('video.html5-main-video') ||
                  document.querySelector('video');
    if (video) {
      if (video.paused) { video.play(); setStatus('▶️ Resumed'); playTone(600, 900, 0.08); }
      else              { video.pause(); setStatus('⏸️ Paused'); playTone(900, 400, 0.12); }
    } else {
      // Fallback: press 'k' (YouTube keyboard shortcut)
      document.dispatchEvent(new KeyboardEvent('keydown',
        { key:'k', keyCode:75, bubbles:true, cancelable:true }));
    }
    flashDot(mouthDot, 'ms-triggered');
    setTimeout(() => setStatus('👀 Watching…'), 1200);
  }

  function blurActiveInput() {
    if (document.activeElement && document.activeElement !== document.body) {
      document.activeElement.blur();
    }
    document.body.focus();
  }

  // ── Overlay UI ───────────────────────────────────────────────
  function buildOverlay() {
    if (overlayEl) return;
    overlayEl = document.createElement('div');
    overlayEl.id = 'ms-overlay';
    overlayEl.innerHTML = `
      <div id="ms-header">
        <span id="ms-logo">👄</span>
        <span id="ms-title">MouthScroll</span>
        <button id="ms-collapse" title="Minimize">−</button>
      </div>
      <div id="ms-body">
        <div id="ms-preview-wrap">
          <video id="ms-preview" autoplay muted playsinline></video>
          <div id="ms-dots">
            <div class="ms-dot-wrap">
              <div id="ms-mouth-dot" class="ms-dot" title="Mouth"></div>
              <span>👄</span>
            </div>
            <div class="ms-dot-wrap">
              <div id="ms-brow-dot" class="ms-dot" title="Brows"></div>
              <span>🤨</span>
            </div>
          </div>
        </div>
        <div id="ms-mode-label">—</div>
        <div id="ms-status">Loading…</div>
      </div>
    `;
    document.body.appendChild(overlayEl);

    previewEl    = overlayEl.querySelector('#ms-preview');
    mouthDot     = overlayEl.querySelector('#ms-mouth-dot');
    browDot      = overlayEl.querySelector('#ms-brow-dot');
    statusEl     = overlayEl.querySelector('#ms-status');
    modeLabelEl  = overlayEl.querySelector('#ms-mode-label');

    const collapseBtn = overlayEl.querySelector('#ms-collapse');
    const body = overlayEl.querySelector('#ms-body');
    collapseBtn.addEventListener('click', () => {
      const hidden = body.style.display === 'none';
      body.style.display = hidden ? '' : 'none';
      collapseBtn.textContent = hidden ? '−' : '+';
    });

    makeDraggable(overlayEl, overlayEl.querySelector('#ms-header'));
    applyPreviewVisibility();
    updateModeLabel();
  }

  function updateModeLabel() {
    if (!modeLabelEl) return;
    const labels = {
      'youtube':       '▼ next  ▲ brows  (Shorts)',
      'youtube-video': '👄 pause/resume · 🤨 hold = +5s',
      'instagram':     '▼ next  ▲ brows  (Reels)',
    };
    modeLabelEl.textContent = labels[platform] || '—';
  }

  function setStatus(msg) { if (statusEl) statusEl.textContent = msg; }

  function applyPreviewVisibility() {
    const wrap = document.getElementById('ms-preview-wrap');
    if (wrap) wrap.style.display = settings.showPreview ? '' : 'none';
  }

  function makeDraggable(el, handle) {
    let ox=0, oy=0, sx=0, sy=0;
    handle.style.cursor = 'grab';
    handle.addEventListener('mousedown', e => {
      e.preventDefault();
      sx=e.clientX; sy=e.clientY;
      const r = el.getBoundingClientRect();
      ox=r.left; oy=r.top;
      const mv = e2 => { el.style.left=(ox+e2.clientX-sx)+'px'; el.style.top=(oy+e2.clientY-sy)+'px'; el.style.right='auto'; el.style.bottom='auto'; };
      const up = () => { document.removeEventListener('mousemove',mv); document.removeEventListener('mouseup',up); };
      document.addEventListener('mousemove',mv);
      document.addEventListener('mouseup',up);
    });
  }

  // ── Models ──────────────────────────────────────────────────
  async function loadModels() {
    if (modelsLoaded) return true;
    const url = chrome.runtime.getURL('models');
    try {
      await faceapi.nets.tinyFaceDetector.loadFromUri(url);
      await faceapi.nets.faceLandmark68TinyNet.loadFromUri(url);
      modelsLoaded = true;
      return true;
    } catch (err) {
      console.error('[MouthScroll] Model load failed:', err);
      setStatus('❌ Models missing — run download_models.js');
      return false;
    }
  }

  // ── Camera ──────────────────────────────────────────────────
  async function startCamera() {
    if (stream) return stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { width:320, height:240, facingMode:'user' }, audio:false
      });
      return stream;
    } catch (err) {
      setStatus('❌ Camera access denied');
      return null;
    }
  }

  // ── Detection loop ───────────────────────────────────────────
  async function detectionLoop() {
    if (!isRunning || !stream || !modelsLoaded) return;

    const now = Date.now();
    if (now - lastDetectionTime < 66) { // ~15 fps cap
      animFrameId = requestAnimationFrame(detectionLoop);
      return;
    }
    lastDetectionTime = now;

    try {
      if (!videoEl || videoEl.readyState < 2 || videoEl.videoWidth === 0) {
        animFrameId = requestAnimationFrame(detectionLoop);
        return;
      }

      const opts   = new faceapi.TinyFaceDetectorOptions({ inputSize:224, scoreThreshold:0.5 });
      const result = await faceapi.detectSingleFace(videoEl, opts).withFaceLandmarks(true);

      if (result) {
        const pts      = result.landmarks.positions;
        const mouth    = getMouthOpenness(pts);
        const brow     = getBrowRaise(pts);

        const isOpen   = mouth > settings.sensitivity;
        const isRaised = brow  > settings.browSensitivity;

        // Update dots
        if (mouthDot) mouthDot.classList.toggle('ms-active', isOpen);
        if (browDot)  browDot.classList.toggle('ms-active-brow', isRaised);

        // ── Mouth state machine ──────────────────────────────
        if (isOpen && !mouthWasOpen) {
          mouthWasOpen = true;
          setStatus(`😮 Mouth open (${mouth.toFixed(2)})`);
        } else if (!isOpen && mouthWasOpen) {
          mouthWasOpen = false;
          if (platform === 'youtube-video') togglePlayback();
          else scrollNext();
        }

        // ── Brow state machine ───────────────────────────────
        if (platform === 'youtube-video') {
          // Hold brows up → spam +5s every 500 ms
          if (isRaised) {
            browWasRaised = true;
            seekForward5(); // internally rate-limited to 500 ms
          } else {
            if (browWasRaised) setStatus('👀 Watching…');
            browWasRaised = false;
          }
        } else {
          // Shorts / Reels: raise→lower cycle = scroll prev
          if (isRaised && !browWasRaised) {
            browWasRaised = true;
            setStatus(`🤨 Brows up! (${brow.toFixed(2)})`);
          } else if (!isRaised && browWasRaised) {
            browWasRaised = false;
            scrollPrev();
          }
        }

        // Always show live readings when fully idle (nothing active)
        if (!isOpen && !mouthWasOpen && !isRaised && !browWasRaised) {
          setStatus(`👄 ${mouth.toFixed(2)}  🤨 ${brow.toFixed(2)}  [thresh ${settings.browSensitivity.toFixed(2)}]`);
        }

      } else {
        if (mouthDot) mouthDot.classList.remove('ms-active');
        if (browDot)  browDot.classList.remove('ms-active-brow');
        setStatus('🔍 No face detected');
        mouthWasOpen = false;
        browWasRaised = false;
      }
    } catch (_) {}

    animFrameId = requestAnimationFrame(detectionLoop);
  }

  // ── Start ────────────────────────────────────────────────────
  async function start() {
    if (!platform || isRunning) return;

    buildOverlay();
    setStatus('Loading models…');

    if (!await loadModels()) return;

    setStatus('Requesting camera…');
    if (!await startCamera()) return;

    if (!videoEl) {
      videoEl = document.createElement('video');
      videoEl.setAttribute('autoplay',''); videoEl.setAttribute('muted',''); videoEl.setAttribute('playsinline','');
      videoEl.style.cssText = 'position:fixed;top:0;left:0;width:320px;height:240px;visibility:hidden;pointer-events:none;z-index:-1;';
      document.body.appendChild(videoEl);
    }
    videoEl.srcObject = stream;
    await videoEl.play().catch(()=>{});

    if (previewEl) { previewEl.srcObject = stream; await previewEl.play().catch(()=>{}); }

    isRunning = true;
    updateModeLabel();
    setStatus('👀 Watching…');
    detectionLoop();
  }

  // ── Stop ─────────────────────────────────────────────────────
  function stop() {
    isRunning = false;
    if (animFrameId) { cancelAnimationFrame(animFrameId); animFrameId = null; }
    if (stream) { stream.getTracks().forEach(t=>t.stop()); stream = null; }
    if (videoEl)  { videoEl.srcObject = null; }
    if (overlayEl){ overlayEl.remove(); overlayEl=previewEl=mouthDot=browDot=statusEl=modeLabelEl=null; }
    mouthWasOpen = false; browWasRaised = false;
  }

  // ── Settings ─────────────────────────────────────────────────
  function loadSettings(cb) {
    chrome.storage.sync.get(
      { enabled:true, sensitivity:0.35, browSensitivity:0.30, showPreview:true, cooldown:1500 },
      s => { Object.assign(settings, s); cb && cb(); }
    );
  }

  chrome.storage.onChanged.addListener(changes => {
    if (changes.sensitivity)     settings.sensitivity     = changes.sensitivity.newValue;
    if (changes.browSensitivity) settings.browSensitivity = changes.browSensitivity.newValue;
    if (changes.showPreview)   { settings.showPreview     = changes.showPreview.newValue; applyPreviewVisibility(); }
    if (changes.cooldown)        settings.cooldown        = changes.cooldown.newValue;
    if (changes.enabled != null) {
      settings.enabled = changes.enabled.newValue;
      settings.enabled && platform ? start() : stop();
    }
  });

  // ── SPA navigation (pushState intercept) ─────────────────────
  function onURLChange(url) {
    const p = detectPlatform(url);
    if (p === platform) return;
    if (platform) stop();
    platform = p;
    if (platform && settings.enabled) setTimeout(start, 800);
  }

  const _push = history.pushState.bind(history);
  history.pushState = (...a) => { _push(...a); onURLChange(location.href); };
  const _replace = history.replaceState.bind(history);
  history.replaceState = (...a) => { _replace(...a); onURLChange(location.href); };
  window.addEventListener('popstate', () => onURLChange(location.href));

  chrome.runtime.onMessage.addListener(msg => {
    if (msg.type === 'URL_CHANGED') onURLChange(msg.url);
  });

  // ── Bootstrap ────────────────────────────────────────────────
  loadSettings(() => { if (platform && settings.enabled) start(); });

})();
