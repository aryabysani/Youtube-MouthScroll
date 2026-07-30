# 👄 MouthScroll

**Scroll YouTube with your mouth. No hands required.**

Open your mouth to skip to the next video. Raise your eyebrows to go back.
Works on YouTube Shorts, Instagram Reels, and normal long YouTube videos.

Everything runs on your own computer. No video ever leaves your browser.

---

## What the gestures do

The same two gestures do different things depending on what you're watching.

**Shorts &amp; Reels**

| Gesture | Action |
|---|---|
| 😮 Open your mouth, then close it | Next video |
| 🤨 Raise your eyebrows | Previous video |

**Long YouTube videos**

| Gesture | Action |
|---|---|
| 😮 Open your mouth, then close it | Play / pause |
| 🤨 Hold your eyebrows up | Skip forward 5 seconds |

The panel on the page always shows which mode you're in.

---

## How to install (about 3 minutes)

You only need Google Chrome. No coding, no terminal.

### Step 1 — Download the extension

1. Scroll to the top of this page.
2. Click the green **`< > Code`** button.
3. Click **Download ZIP**.
4. The file lands in your **Downloads** folder.

### Step 2 — Unzip it

- **Windows:** right-click the ZIP file → **Extract All** → **Extract**
- **Mac:** double-click the ZIP file

You now have a folder called **`Youtube-MouthScroll-main`**. **Don't delete or
move this folder after installing** — Chrome loads the extension from it every
time.

> Tip: drag the folder somewhere permanent, like your Documents folder, before
> continuing.

### Step 3 — Open Chrome's extensions page

1. Open Chrome.
2. Click the **puzzle piece icon** 🧩 in the top-right corner.
3. Click **Manage extensions** at the bottom of that menu.

(Or type `chrome://extensions` in the address bar and press Enter.)

### Step 4 — Turn on Developer mode

In the **top-right** of the extensions page, flip the **Developer mode** switch
**ON**. Three new buttons appear at the top-left.

### Step 5 — Load the extension

1. Click **Load unpacked** (top-left).
2. Find the folder you unzipped in Step 2.
3. Open the **`Youtube-MouthScroll-main`** folder so you can see the files
   inside it — you should see `manifest.json`, `popup.html`, and some others.
4. Click **Select Folder** (Windows) or **Select** (Mac).

**Important:** pick the folder that *contains* `manifest.json`. If Chrome says
"Manifest file is missing or unreadable," you selected the wrong folder — try
one level in, or one level out.

Nothing else to download. The face-detection library and its model files are
already included in this repo.

### Step 6 — Pin it (optional but handy)

Click the puzzle piece 🧩 again, then click the **pin** icon next to
MouthScroll so its icon stays visible in your toolbar.

---

## How to use it

1. Go to YouTube Shorts, Instagram Reels, or any YouTube video.
2. A small MouthScroll panel appears in the bottom-right corner.
3. Chrome asks to use your camera — click **Allow**.
4. Start making faces at your screen.

Click the extension's toolbar icon for settings:

| Setting | What it does |
|---|---|
| **ON / OFF** | Turns MouthScroll off completely, camera included |
| **Sensitivity** | How wide you have to open your mouth |
| **Brow sensitivity** | How far you have to raise your eyebrows |
| **Cooldown** | How long to wait before it can trigger again |
| **Show camera preview** | Show or hide the little camera window |

Your settings are remembered, including the ON/OFF switch. If you turn
MouthScroll off, it stays off until you turn it back on.

---

## If something isn't working

| Problem | What to do |
|---|---|
| Nothing appears on the page | Refresh the page, then check the extension is toggled ON in the popup |
| Camera didn't ask for permission | Click the camera icon 📷 in Chrome's address bar and choose **Allow** |
| It doesn't notice my face | Turn on a light in front of you and sit closer to the camera |
| It triggers when I didn't mean to | Drag **Sensitivity** toward **Low**, or **Cooldown** toward **Slow** |
| It ignores me when I open my mouth | Drag **Sensitivity** toward **High** |
| "Manifest file is missing or unreadable" | Wrong folder in Step 5 — pick the one containing `manifest.json` |
| The extension disappeared | You moved or deleted the unzipped folder. Put it back, or repeat Step 5 |

---

## Privacy

- Face detection runs **entirely on your own computer**, in your browser.
- **No video, images, or face data are ever sent anywhere.** There is no server.
- The camera only runs while you're on a supported page with the extension on.
- The only thing stored is your settings, via Chrome's own settings sync.

The extension asks for camera access and permission to run on `youtube.com` and
`instagram.com`. That's all it can reach — see [manifest.json](manifest.json).

---

## For developers

Plain JavaScript, no build step. Chrome Manifest V3.

| File | Purpose |
|---|---|
| `manifest.json` | Extension manifest |
| `content.js` | Face tracking, gesture state machines, page overlay |
| `content.css` | Overlay styling |
| `popup.html` / `popup.css` / `popup.js` | Toolbar settings panel |
| `background.js` | Service worker: default settings, SPA navigation events |
| `gen_icons_node.js` | Generates the icon PNGs (no dependencies) |
| `download_models.js` | Re-downloads face-api.js and its models |
| `libs/`, `models/` | Vendored face-api.js and its weights (committed) |

```bash
node gen_icons_node.js           # regenerate icons/
node gen_icons_node.js --ascii   # preview the icon glyph as text
node download_models.js          # re-fetch libs/ and models/
```

Gesture detection uses face-api.js `TinyFaceDetector` +
`FaceLandmark68TinyNet`. Mouth openness and brow raise are both normalised
against eye-corner distance, so they hold up as you move nearer or further
from the camera.

See [SETUP.md](SETUP.md) for project structure and
[CONTRIBUTING.md](CONTRIBUTING.md) if you'd like to help.

---

## License

[MIT](LICENSE) — do what you like with it.
