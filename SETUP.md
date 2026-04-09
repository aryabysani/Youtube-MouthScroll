# MouthScroll — Setup Guide

Open your mouth → next video. Works on YouTube Shorts and Instagram Reels.

---

## Folder Structure (after setup)

```
mouthscroll/
├── manifest.json
├── background.js
├── content.js
├── content.css
├── popup.html
├── popup.js
├── popup.css
├── generate_icons.html
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── libs/
│   └── face-api.min.js       ← download this (step 1)
└── models/
    ├── tiny_face_detector_model-weights_manifest.json
    ├── tiny_face_detector_model-shard1
    ├── face_landmark_68_tiny_model-weights_manifest.json
    └── face_landmark_68_tiny_model-shard1   ← download these (step 2)
```

---

## Step 1 — Download face-api.js

1. Go to: https://github.com/justadudewhohacks/face-api.js/releases
2. Download the latest release ZIP.
3. Inside the ZIP, find `dist/face-api.min.js`.
4. Copy it to: `libs/face-api.min.js`

**OR** run in a terminal (Node.js required):
```bash
npx --yes download-file https://cdn.jsdelivr.net/npm/face-api.js/dist/face-api.min.js -o libs/face-api.min.js
```

---

## Step 2 — Download face-api.js models

You need two models:
- **TinyFaceDetector** — detects the face
- **FaceLandmark68TinyNet** — gets the 68 lip/eye landmarks

Download the `models/` folder from the face-api.js GitHub repo:

```bash
# Option A: use the provided download script
node download_models.js

# Option B: manual download
# Go to: https://github.com/justadudewhohacks/face-api.js/tree/master/weights
# Download these 4 files into your models/ folder:
#   tiny_face_detector_model-weights_manifest.json
#   tiny_face_detector_model-shard1
#   face_landmark_68_tiny_model-weights_manifest.json
#   face_landmark_68_tiny_model-shard1
```

Run the download script (creates `models/` automatically):
```bash
node download_models.js
```

---

## Step 3 — Generate Icons

1. Open `generate_icons.html` in Chrome.
2. Click **⬇ Download All Icons**.
3. Save each file into the `icons/` folder as prompted.

---

## Step 4 — Load the Extension in Chrome

1. Open Chrome → `chrome://extensions`
2. Enable **Developer mode** (top-right toggle).
3. Click **Load unpacked**.
4. Select this folder (`mouthscroll/`).
5. The extension icon (👄) will appear in the toolbar.

---

## Step 5 — Usage

1. Go to **YouTube Shorts** (`youtube.com/shorts/...`) or **Instagram Reels** (`instagram.com/reels/`).
2. The floating MouthScroll panel will appear in the bottom-right corner.
3. Allow camera access when prompted.
4. **Open your mouth** (hold briefly) then **close it** → the next video plays.

### Popup Controls

| Control | Description |
|---------|-------------|
| ON/OFF toggle | Enable or disable the extension entirely |
| Sensitivity slider | How wide you need to open your mouth (Low = wider required) |
| Cooldown slider | Minimum time between consecutive scrolls (0.5s – 3s) |
| Show camera preview | Show/hide the small camera feed in the overlay |

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| "Models missing" status | Check that all 4 model files are in `models/` |
| Camera access denied | Click the camera icon in Chrome's address bar and allow access |
| No face detected | Improve lighting; sit closer to the camera |
| Scrolling too sensitive | Move the Sensitivity slider to the left (Low) |
| Scrolling too easily triggered | Increase Cooldown slider |
| Extension not activating on Instagram | Instagram may require you to be on `/reels/` tab |

---

## Privacy

- All face detection runs **locally in your browser** using TensorFlow.js.
- **No video, images, or biometric data** are sent to any server.
- Camera is only active while you are on a supported page and the extension is enabled.
