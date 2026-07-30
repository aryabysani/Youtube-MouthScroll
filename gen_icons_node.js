// MouthScroll — icon generator (no npm deps, pure Node.js)
// Dot-matrix glyph on a black squircle. Monochrome + one red accent.
//   node gen_icons_node.js          → writes icons/icon{16,48,128}.png
//   node gen_icons_node.js --ascii  → prints the glyph grid, writes nothing

const fs   = require('fs');
const path = require('path');
const zlib = require('zlib');

// ── PNG helpers ──────────────────────────────────────────────
function crc32(buf) {
  const t = [];
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) c = (c & 1) ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
    t[i] = c;
  }
  let c = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) c = t[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}
function chunk(type, data) {
  const tb = Buffer.from(type, 'ascii');
  const body = Buffer.concat([tb, data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(body));
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  return Buffer.concat([len, tb, data, crc]);
}
function buildPNG(pixels, size) {
  const stride = size * 4 + 1;
  const rows = Buffer.alloc(size * stride);
  for (let y = 0; y < size; y++) {
    rows[y * stride] = 0;
    pixels.copy(rows, y * stride + 1, y * size * 4, (y + 1) * size * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from([137,80,78,71,13,10,26,10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(rows, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ── Geometry ─────────────────────────────────────────────────
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

// Signed distance to a rounded rectangle
function sdRoundRect(px, py, cx, cy, hw, hh, r) {
  const qx = Math.abs(px - cx) - hw + r;
  const qy = Math.abs(py - cy) - hh + r;
  return Math.min(Math.max(qx, qy), 0) + Math.hypot(Math.max(qx,0), Math.max(qy,0)) - r;
}
function sdCircle(px, py, cx, cy, r) { return Math.hypot(px - cx, py - cy) - r; }

// Approximate signed distance to an ellipse, scaled back to pixel units
function sdEllipse(px, py, cx, cy, rx, ry) {
  const dx = (px - cx) / rx, dy = (py - cy) / ry;
  return (Math.hypot(dx, dy) - 1) * Math.min(rx, ry);
}

// SDF → coverage 0..255
function aa(d, feather) { return clamp(Math.round((-d / feather + 0.5) * 255), 0, 255); }

// src over dst, both straight alpha
function blend(dR,dG,dB,dA, sR,sG,sB,sA) {
  const sa = sA / 255, da = dA / 255;
  const oA = sa + da * (1 - sa);
  if (oA === 0) return [0,0,0,0];
  return [
    Math.round((sR*sa + dR*da*(1-sa)) / oA),
    Math.round((sG*sa + dG*da*(1-sa)) / oA),
    Math.round((sB*sa + dB*da*(1-sa)) / oA),
    Math.round(oA * 255),
  ];
}

// ── Palette ──────────────────────────────────────────────────
const BLACK = [ 10,  10,  10];
const WHITE = [255, 255, 255];
const RED   = [215,  25,  33];   // Nothing red

// ── The glyph: an open mouth, drawn as a dot matrix ──────────
// '.' = empty, '@' = white dot (lips), 'o' = red dot (the opening)
// Deliberately wide and flat so it reads as a mouth, not an eye.
const GLYPH = [
  '...........',
  '...........',
  '...........',
  '.@@@@@@@@@.',
  '@@ooooooo@@',
  '@@ooooooo@@',
  '.@@ooooo@@.',
  '..@@@@@@@..',
  '...........',
  '...........',
  '...........',
];
const GRID = GLYPH.length;

function glyphGrid() {
  return GLYPH.map(row =>
    [...row].map(ch => (ch === '@' ? 1 : ch === 'o' ? 2 : 0))
  );
}

// A dot matrix turns to mush below ~64px, so the small icons state the same
// shape in solid form: white lip ring, red opening.
function drawSmallIcon(size) {
  const px = Buffer.alloc(size * size * 4);
  const cx = size / 2, cy = size / 2;
  const pad = size * 0.035;
  const hw = size / 2 - pad;
  const r  = size * 0.235;

  const rx = size * 0.36, ry = size * 0.215;
  const ring = Math.max(size * 0.105, 1.4);   // lip thickness

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      let R = 0, G = 0, B = 0, A = 0;
      const sx = x + 0.5, sy = y + 0.5;

      const bgA = aa(sdRoundRect(sx, sy, cx, cy, hw, hw, r), 1.0);
      if (bgA === 0) { px[i+3] = 0; continue; }
      [R,G,B,A] = blend(R,G,B,A, BLACK[0],BLACK[1],BLACK[2], bgA);

      const lipA = aa(sdEllipse(sx, sy, cx, cy, rx, ry), 0.9);
      if (lipA > 0) [R,G,B,A] = blend(R,G,B,A, WHITE[0],WHITE[1],WHITE[2], Math.min(lipA, bgA));

      const openA = aa(sdEllipse(sx, sy, cx, cy, rx - ring, ry - ring), 0.9);
      if (openA > 0) [R,G,B,A] = blend(R,G,B,A, RED[0],RED[1],RED[2], Math.min(openA, bgA));

      px[i]=R; px[i+1]=G; px[i+2]=B; px[i+3]=A;
    }
  }
  return buildPNG(px, size);
}

function drawIcon(size) {
  if (size < 64) return drawSmallIcon(size);
  const px = Buffer.alloc(size * size * 4);   // transparent
  const cx = size / 2, cy = size / 2;
  const grid = glyphGrid();

  // squircle body
  const pad = size * 0.035;
  const hw  = size / 2 - pad;
  const r   = size * 0.235;

  // dot lattice inside the body
  const inset = size * 0.15;
  const cell  = (size - inset * 2) / GRID;
  // small icons need fatter dots to survive downscaling
  const dotR  = cell * (size <= 24 ? 0.46 : 0.34);
  const feather = Math.max(size / 128 * 1.3, 0.75);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      let R = 0, G = 0, B = 0, A = 0;

      const bgA = aa(sdRoundRect(x + 0.5, y + 0.5, cx, cy, hw, hw, r), feather * 1.2);
      if (bgA === 0) { px[i+3] = 0; continue; }
      [R,G,B,A] = blend(R,G,B,A, BLACK[0],BLACK[1],BLACK[2], bgA);

      // nearest lattice cell is enough — dots never overlap
      const gx = Math.floor((x + 0.5 - inset) / cell);
      const gy = Math.floor((y + 0.5 - inset) / cell);
      if (gx >= 0 && gx < GRID && gy >= 0 && gy < GRID) {
        const kind = grid[gy][gx];
        if (kind) {
          const dcx = inset + (gx + 0.5) * cell;
          const dcy = inset + (gy + 0.5) * cell;
          const dA  = aa(sdCircle(x + 0.5, y + 0.5, dcx, dcy, dotR), feather);
          if (dA > 0) {
            const c = kind === 2 ? RED : WHITE;
            // clip the glyph to the body so dots never bleed past the corners
            [R,G,B,A] = blend(R,G,B,A, c[0],c[1],c[2], Math.min(dA, bgA));
          }
        }
      }

      px[i]=R; px[i+1]=G; px[i+2]=B; px[i+3]=A;
    }
  }
  return buildPNG(px, size);
}

// ── Run ──────────────────────────────────────────────────────
if (process.argv.includes('--ascii')) {
  console.log(glyphGrid()
    .map(r => r.map(c => (c === 1 ? '@' : c === 2 ? 'o' : '.')).join(' '))
    .join('\n'));
} else {
  const dir = path.join(__dirname, 'icons');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir);

  [16, 48, 128].forEach(s => {
    fs.writeFileSync(path.join(dir, `icon${s}.png`), drawIcon(s));
    console.log(`✓ icons/icon${s}.png`);
  });
  console.log('Icons done.');
}
