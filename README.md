# 👄 MouthScroll

Scroll YouTube Shorts and Instagram Reels **without touching your phone or mouse**.

Just **open your mouth** → next video.
**Raise your eyebrows** → previous video.

Your camera never leaves your computer. Nothing is uploaded anywhere.

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

You now have a folder called **`YT-scroller-main`**. **Don't delete or move this folder after installing** — Chrome loads the extension from it every time.

> Tip: drag the folder somewhere permanent, like your Documents folder, before continuing.

### Step 3 — Open Chrome's extensions page

1. Open Chrome.
2. Click the **puzzle piece icon** 🧩 in the top-right corner.
3. Click **Manage extensions** at the bottom of that menu.

(Or just type `chrome://extensions` in the address bar and press Enter.)

### Step 4 — Turn on Developer mode

In the **top-right** of the extensions page, flip the **Developer mode** switch **ON**.

Three new buttons appear at the top-left of the page.

### Step 5 — Load the extension

1. Click **Load unpacked** (top-left).
2. A file picker opens. Find the folder you unzipped in Step 2.
3. Open the **`YT-scroller-main`** folder so you can see the files inside it — you should see `manifest.json`, `popup.html`, and a few others.
4. Click **Select Folder** (Windows) or **Select** (Mac).

**Important:** pick the folder that *contains* `manifest.json`. If Chrome says "Manifest file is missing or unreadable," you selected the wrong folder — try the folder one level in, or one level out.

MouthScroll now appears in your list of extensions. 🎉

### Step 6 — Pin it (optional but handy)

Click the puzzle piece 🧩 again, then click the **pin** icon next to MouthScroll so its 👄 icon stays visible in your toolbar.

---

## How to use it

1. Go to **YouTube Shorts** or **Instagram Reels**.
2. A small MouthScroll panel appears in the bottom-right corner.
3. Chrome asks to use your camera — click **Allow**.
4. **Open your mouth, then close it** → next video.
5. **Raise your eyebrows** → previous video.

On regular YouTube videos, opening your mouth **pauses and resumes** instead.

### Settings

Click the 👄 icon in your toolbar to open the settings panel:

| Setting | What it does |
|---|---|
| **ON / OFF** | Turns MouthScroll on or off completely |
| **Sensitivity** | How wide you have to open your mouth |
| **Brow sensitivity** | How far you have to raise your eyebrows |
| **Cooldown** | How long to wait before it can scroll again |
| **Show camera preview** | Show or hide the little camera window |

---

## If something isn't working

| Problem | What to do |
|---|---|
| Nothing appears on the page | Refresh the page (F5), then check the extension is toggled ON in the popup |
| Camera didn't ask for permission | Click the camera icon 📷 in Chrome's address bar and choose **Allow** |
| It doesn't notice my face | Turn on a light in front of you and sit a bit closer to the camera |
| It scrolls when I didn't mean to | Drag **Sensitivity** toward **Low**, or drag **Cooldown** toward **Slow** |
| It ignores me when I do open my mouth | Drag **Sensitivity** toward **High** |
| "Manifest file is missing or unreadable" | You picked the wrong folder in Step 5 — pick the one containing `manifest.json` |
| The extension disappeared | You probably moved or deleted the unzipped folder. Put it back, or repeat Step 5 |

---

## Privacy

- Face detection runs **entirely on your own computer**.
- **No video, photos, or face data are ever sent anywhere.**
- The camera only turns on while you're on YouTube or Instagram with the extension enabled.

---

## For developers

See [SETUP.md](SETUP.md) for the project layout and how the face-api.js library and model
files were added. Everything needed to run the extension is already in this repo — the
download steps there are only relevant if you're rebuilding it from scratch.
