// MouthScroll — README banner generator (no npm deps, pure Node.js)
// Dot-matrix wordmark on black, matching the extension icon.
//   node gen_banner_node.js   → writes assets/banner.png

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
function buildPNG(px, w, h) {
  const stride = w * 4 + 1;
  const rows = Buffer.alloc(h * stride);
  for (let y = 0; y < h; y++) {
    rows[y * stride] = 0;
    px.copy(rows, y * stride + 1, y * w * 4, (y + 1) * w * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from([137,80,78,71,13,10,26,10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(rows, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ── Palette ──────────────────────────────────────────────────
const BG    = [ 10,  10,  10];
const GRID  = [ 32,  32,  32];   // faint background lattice
const WHITE = [255, 255, 255];
const RED   = [215,  25,  33];

// ── 5x7 dot font ─────────────────────────────────────────────
const FONT = {
  A:'01110,10001,10001,11111,10001,10001,10001',
  B:'11110,10001,10001,11110,10001,10001,11110',
  C:'01110,10001,10000,10000,10000,10001,01110',
  D:'11110,10001,10001,10001,10001,10001,11110',
  E:'11111,10000,10000,11110,10000,10000,11111',
  F:'11111,10000,10000,11110,10000,10000,10000',
  G:'01110,10001,10000,10111,10001,10001,01111',
  H:'10001,10001,10001,11111,10001,10001,10001',
  I:'11111,00100,00100,00100,00100,00100,11111',
  J:'00111,00010,00010,00010,00010,10010,01100',
  K:'10001,10010,10100,11000,10100,10010,10001',
  L:'10000,10000,10000,10000,10000,10000,11111',
  M:'10001,11011,10101,10101,10001,10001,10001',
  N:'10001,11001,10101,10011,10001,10001,10001',
  O:'01110,10001,10001,10001,10001,10001,01110',
  P:'11110,10001,10001,11110,10000,10000,10000',
  Q:'01110,10001,10001,10001,10101,10010,01101',
  R:'11110,10001,10001,11110,10100,10010,10001',
  S:'01111,10000,10000,01110,00001,00001,11110',
  T:'11111,00100,00100,00100,00100,00100,00100',
  U:'10001,10001,10001,10001,10001,10001,01110',
  V:'10001,10001,10001,10001,10001,01010,00100',
  W:'10001,10001,10001,10101,10101,11011,10001',
  X:'10001,10001,01010,00100,01010,10001,10001',
  Y:'10001,10001,01010,00100,00100,00100,00100',
  Z:'11111,00001,00010,00100,01000,10000,11111',
  ' ':'00000,00000,00000,00000,00000,00000,00000',
};
const GLYPH_W = 5, GLYPH_H = 7;

// The mouth mark — same pattern the icon uses.
const MARK = [
  '.@@@@@@@@@.',
  '@@ooooooo@@',
  '@@ooooooo@@',
  '.@@ooooo@@.',
  '..@@@@@@@..',
];

// ── Drawing ──────────────────────────────────────────────────
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

function makeCanvas(w, h, rgb) {
  const px = Buffer.alloc(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    px[i*4] = rgb[0]; px[i*4+1] = rgb[1]; px[i*4+2] = rgb[2]; px[i*4+3] = 255;
  }
  return px;
}

// Anti-aliased filled circle, blended onto an opaque canvas
function dot(px, w, h, cx, cy, r, rgb) {
  const x0 = Math.max(0, Math.floor(cx - r - 1)), x1 = Math.min(w - 1, Math.ceil(cx + r + 1));
  const y0 = Math.max(0, Math.floor(cy - r - 1)), y1 = Math.min(h - 1, Math.ceil(cy + r + 1));
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy) - r;
      const a = clamp(-d + 0.5, 0, 1);
      if (a <= 0) continue;
      const i = (y * w + x) * 4;
      px[i]   = Math.round(rgb[0] * a + px[i]   * (1 - a));
      px[i+1] = Math.round(rgb[1] * a + px[i+1] * (1 - a));
      px[i+2] = Math.round(rgb[2] * a + px[i+2] * (1 - a));
    }
  }
}

function textWidth(text, pitch) {
  return text.length * (GLYPH_W + 1) * pitch - pitch;   // 1 blank column between glyphs
}

function drawText(px, w, h, text, originX, originY, pitch, r, rgb) {
  [...text.toUpperCase()].forEach((ch, ci) => {
    const rows = (FONT[ch] || FONT[' ']).split(',');
    for (let gy = 0; gy < GLYPH_H; gy++) {
      for (let gx = 0; gx < GLYPH_W; gx++) {
        if (rows[gy][gx] !== '1') continue;
        dot(px, w, h,
            originX + (ci * (GLYPH_W + 1) + gx) * pitch + pitch / 2,
            originY + gy * pitch + pitch / 2,
            r, rgb);
      }
    }
  });
}

function drawMark(px, w, h, originX, originY, pitch, r) {
  MARK.forEach((row, gy) => {
    [...row].forEach((ch, gx) => {
      if (ch === '.') return;
      dot(px, w, h,
          originX + gx * pitch + pitch / 2,
          originY + gy * pitch + pitch / 2,
          r, ch === 'o' ? RED : WHITE);
    });
  });
}

// ── Compose ──────────────────────────────────────────────────
function buildBanner() {
  const W = 1200, H = 400;
  const px = makeCanvas(W, H, BG);

  // faint background lattice
  for (let y = 20; y < H; y += 20) {
    for (let x = 20; x < W; x += 20) dot(px, W, H, x, y, 1.4, GRID);
  }

  const WORD = 'MOUTHSCROLL';
  const wordPitch = 12, wordR = wordPitch * 0.36;
  const wordW = textWidth(WORD, wordPitch);
  const wordH = GLYPH_H * wordPitch;

  const markPitch = 19, markR = markPitch * 0.36;
  const markW = MARK[0].length * markPitch;
  const markH = MARK.length * markPitch;

  const gap = 52;
  const totalH = markH + gap + wordH;
  const top = Math.round((H - totalH) / 2);

  drawMark(px, W, H, Math.round((W - markW) / 2), top, markPitch, markR);
  drawText(px, W, H, WORD, Math.round((W - wordW) / 2), top + markH + gap,
           wordPitch, wordR, WHITE);

  return buildPNG(px, W, H);
}

const dir = path.join(__dirname, 'assets');
if (!fs.existsSync(dir)) fs.mkdirSync(dir);
fs.writeFileSync(path.join(dir, 'banner.png'), buildBanner());
console.log('✓ assets/banner.png');
