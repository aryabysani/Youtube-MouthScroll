# MouthScroll — Developer Setup

Just want to install and use it? See the [README](README.md) — you don't need
anything on this page.

This page is for working on the code.

---

## Nothing to install

There is no build step, no bundler, and no npm dependencies. The face
detection library and its model weights are **committed to the repo** so the
extension runs straight from a ZIP download.

```
Youtube-MouthScroll/
├── manifest.json              Manifest V3
├── background.js              service worker — defaults, SPA nav events
├── content.js                 face tracking, gestures, page overlay
├── content.css                overlay styling
├── popup.html / .css / .js    toolbar settings panel
├── gen_icons_node.js          icon generator (Node built-ins only)
├── download_models.js         re-downloads libs/ and models/
├── icons/
│   ├── icon16.png             solid mark — toolbar
│   ├── icon48.png             solid mark — extensions page
│   └── icon128.png            dot-matrix mark — store / details
├── libs/
│   └── face-api.min.js        vendored, committed
└── models/
    ├── tiny_face_detector_model-weights_manifest.json
    ├── tiny_face_detector_model-shard1
    ├── face_landmark_68_tiny_model-weights_manifest.json
    └── face_landmark_68_tiny_model-shard1
```

## Load it in Chrome

1. `chrome://extensions`
2. Turn on **Developer mode** (top-right).
3. **Load unpacked** → select this folder.
4. After editing, click **reload** ↻ on the extension card. Content-script
   changes also need a page refresh.

---

## Scripts

```bash
node gen_icons_node.js           # regenerate icons/
node gen_icons_node.js --ascii   # print the icon glyph as text, write nothing
node download_models.js          # re-fetch libs/face-api.min.js and models/
```

### Icons

`gen_icons_node.js` is the single source of truth for the icons — it writes
PNGs by hand with `zlib`, no image library involved.

The mark is a dot-matrix open mouth: white lips, red opening, black squircle.
The matrix is a hand-authored ASCII pattern near the top of the file; edit
that string art to change the glyph, then run `--ascii` to check it before
generating. Below about 64px a dot matrix turns to mush, so 16px and 48px
render the same shape in solid form instead.

### Models

Only needed if the committed weights ever have to be refreshed. Sources:

- face-api.js — <https://github.com/justadudewhohacks/face-api.js>
- weights — <https://github.com/justadudewhohacks/face-api.js/tree/master/weights>

---

## How the detection works

`TinyFaceDetector` finds the face; `FaceLandmark68TinyNet` gives 68 landmarks.

- **Mouth openness** — distance between landmarks 51 and 57 (upper to lower
  lip), divided by the distance between the eye corners (36 to 45).
- **Brow raise** — average gap between the five brow points and the upper eye
  lid on each side, divided by the same eye-corner distance.

Dividing by eye-corner distance is what makes both measures independent of how
near you are to the camera.

Each gesture is a state machine, so an action fires on a *transition*
(open → closed), not while the gesture is held. The exception is brow-hold on
long videos, which repeats +5s every 500 ms. A shared cooldown stops both from
double-firing.

## Settings

Stored in `chrome.storage.sync`: `enabled`, `sensitivity`, `browSensitivity`,
`showPreview`, `cooldown`, `collapsed`.

`background.js` fills in only the keys that have never been set.
`chrome.runtime.onInstalled` also fires on extension update and on every
reload of an unpacked extension, so writing all the defaults there would wipe
the user's saved settings — which used to switch the extension, and the
camera, back on by itself.

## Testing a change

There are three surfaces and their gestures differ, so check all three:

| URL | Mouth | Brows |
|---|---|---|
| `youtube.com/shorts/…` | next | previous |
| `instagram.com/reels/` | next | previous |
| `youtube.com/watch?v=…` | play / pause | hold to skip +5s |

Watch the live numbers in the overlay (`MTH 0.42 · BRW 0.19 · THR 0.30`) while
tuning sensitivity.
