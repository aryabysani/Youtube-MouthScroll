// ============================================================
// MouthScroll — download_models.js
// Run with: node download_models.js
// Downloads the two face-api.js models needed by MouthScroll.
// ============================================================

const https = require('https');
const fs    = require('fs');
const path  = require('path');

const BASE_URL = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/';
const MODELS_DIR = path.join(__dirname, 'models');
const LIBS_DIR   = path.join(__dirname, 'libs');

const MODEL_FILES = [
  'tiny_face_detector_model-weights_manifest.json',
  'tiny_face_detector_model-shard1',
  'face_landmark_68_tiny_model-weights_manifest.json',
  'face_landmark_68_tiny_model-shard1',
];

const FACE_API_URL = 'https://cdn.jsdelivr.net/npm/face-api.js/dist/face-api.min.js';

// Create directories if needed
[MODELS_DIR, LIBS_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    const get = (u) => {
      https.get(u, (res) => {
        // Follow redirects
        if (res.statusCode === 301 || res.statusCode === 302) {
          return get(res.headers.location);
        }
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode} for ${u}`));
          return;
        }
        res.pipe(file);
        file.on('finish', () => { file.close(); resolve(); });
      }).on('error', (err) => { fs.unlink(dest, () => {}); reject(err); });
    };
    get(url);
  });
}

async function main() {
  console.log('MouthScroll — Downloading models...\n');

  // Download model files
  for (const file of MODEL_FILES) {
    const dest = path.join(MODELS_DIR, file);
    if (fs.existsSync(dest)) {
      console.log(`  ✓ (exists) ${file}`);
      continue;
    }
    process.stdout.write(`  ⬇ Downloading ${file}...`);
    try {
      await download(BASE_URL + file, dest);
      console.log(' done');
    } catch (err) {
      console.log(` FAILED: ${err.message}`);
    }
  }

  // Download face-api.min.js
  const faceApiDest = path.join(LIBS_DIR, 'face-api.min.js');
  if (fs.existsSync(faceApiDest)) {
    console.log('\n  ✓ (exists) libs/face-api.min.js');
  } else {
    process.stdout.write('\n  ⬇ Downloading libs/face-api.min.js...');
    try {
      await download(FACE_API_URL, faceApiDest);
      console.log(' done');
    } catch (err) {
      console.log(` FAILED: ${err.message}`);
      console.log('    → Try manually: https://cdn.jsdelivr.net/npm/face-api.js/dist/face-api.min.js');
    }
  }

  console.log('\n✅ Done! Now follow Steps 3–5 in SETUP.md to load the extension.');
}

main().catch(console.error);
