// MouthScroll — icon generator (no npm deps, pure Node.js)
// Draws a deep purple pill with white lips + eyebrows

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
  const rows = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) {
    rows[y * (size * 4 + 1)] = 0;
    pixels.copy(rows, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from([137,80,78,71,13,10,26,10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(rows)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ── Per-pixel drawing ────────────────────────────────────────
function lerp(a, b, t) { return a + (b - a) * t; }
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

// Signed distance to a rounded rectangle
function sdRoundRect(px, py, cx, cy, hw, hh, r) {
  const qx = Math.abs(px - cx) - hw + r;
  const qy = Math.abs(py - cy) - hh + r;
  return Math.min(Math.max(qx, qy), 0) + Math.sqrt(Math.max(qx,0)**2 + Math.max(qy,0)**2) - r;
}

// Signed distance to ellipse (approximate)
function sdEllipse(px, py, cx, cy, rx, ry) {
  const dx = (px - cx) / rx;
  const dy = (py - cy) / ry;
  return Math.sqrt(dx*dx + dy*dy) - 1;
}

// AA fill: returns 0-255 alpha based on SDF
function aa(d, feather = 1.2) {
  return clamp(Math.round((-d / feather + 0.5) * 255), 0, 255);
}

// Blend src (premult) over dst
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

function drawIcon(size) {
  const px = Buffer.alloc(size * size * 4); // start transparent

  const cx = size / 2, cy = size / 2;
  const pad = size * 0.06;
  const hw = size / 2 - pad;       // half-width of background rect
  const hh = size / 2 - pad;
  const r  = size * 0.22;          // corner radius

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      let R = 0, G = 0, B = 0, A = 0;

      // ── 1. Background: deep purple → indigo gradient ─────
      const bgDist = sdRoundRect(x, y, cx, cy, hw, hh, r);
      const bgA = aa(bgDist, 1.5);
      if (bgA > 0) {
        const t = clamp((x + y) / (size * 1.6), 0, 1);
        const bR = Math.round(lerp(88, 50, t));   // purple → deep indigo
        const bG = Math.round(lerp(28, 10, t));
        const bB = Math.round(lerp(180, 130, t));
        [R,G,B,A] = blend(R,G,B,A, bR,bG,bB, bgA);
      }

      // ── 2. Inner glow (lighter center) ─────────────────
      const glowD = sdRoundRect(x, y, cx, cy*0.95, hw*0.7, hh*0.55, r*0.8);
      const glowA = Math.round(clamp(-glowD / (size*0.3), 0, 1) * 30);
      if (glowA > 0) [R,G,B,A] = blend(R,G,B,A, 160,120,255, glowA);

      // ── 3. Eyebrows (two arched thick lines) ────────────
      // Left brow: arc from (-0.30, -0.22) to (-0.07, -0.28) relative to center
      // Model as a rotated ellipse outline
      const browY  = cy - size * 0.20;
      const browHH = size * 0.028;  // half-height (thickness)

      // Left brow
      const lbCX = cx - size * 0.165;
      const lbDist = sdEllipse(x, y + size*0.025, lbCX, browY, size*0.13, size*0.04);
      // Clip to top half of ellipse (arch shape)
      const lbInner = sdEllipse(x, y + size*0.025, lbCX, browY, size*0.08, size*0.01);
      const lbA = (y < browY + browHH*0.5)
        ? Math.min(aa(lbDist, 1.2), aa(-lbInner + size*0.025, 1.2))
        : 0;
      if (lbA > 0) [R,G,B,A] = blend(R,G,B,A, 255,255,255, Math.min(lbA, A > 0 ? 255 : 0));

      // Right brow (mirror)
      const rbCX = cx + size * 0.165;
      const rbDist = sdEllipse(x, y + size*0.025, rbCX, browY, size*0.13, size*0.04);
      const rbInner = sdEllipse(x, y + size*0.025, rbCX, browY, size*0.08, size*0.01);
      const rbA = (y < browY + browHH*0.5)
        ? Math.min(aa(rbDist, 1.2), aa(-rbInner + size*0.025, 1.2))
        : 0;
      if (rbA > 0) [R,G,B,A] = blend(R,G,B,A, 255,255,255, Math.min(rbA, A > 0 ? 255 : 0));

      // ── 4. Upper lip (fat arc) ───────────────────────────
      const lipY   = cy + size * 0.06;
      const ulCX   = cx;
      const ulDist = sdEllipse(x, y, ulCX, lipY - size*0.06, size*0.28, size*0.13);
      const ulHoleDist = sdEllipse(x, y, ulCX, lipY - size*0.06, size*0.20, size*0.07);
      // Only bottom half → lip arch
      const ulA = (y > lipY - size*0.13 && y < lipY + size*0.02)
        ? Math.min(aa(ulDist, 1.2), aa(-ulHoleDist, 1.2))
        : 0;
      if (ulA > 0) [R,G,B,A] = blend(R,G,B,A, 255,220,225, Math.min(ulA, A > 0 ? 255 : 0));

      // ── 5. Lower lip (fatter ellipse) ───────────────────
      const llDist = sdEllipse(x, y, cx, lipY + size*0.09, size*0.27, size*0.10);
      const llHoleDist = sdEllipse(x, y, cx, lipY + size*0.09, size*0.19, size*0.04);
      const llA = (y > lipY)
        ? Math.min(aa(llDist, 1.2), aa(-llHoleDist + size*0.04, 1.2))
        : 0;
      if (llA > 0) [R,G,B,A] = blend(R,G,B,A, 255,200,210, Math.min(llA, A > 0 ? 255 : 0));

      // ── 6. Teeth (white gap between lips) ───────────────
      const teethDist = sdEllipse(x, y, cx, lipY + size*0.02, size*0.17, size*0.05);
      const teethA = aa(teethDist, 1.0);
      if (teethA > 0 && A > 0) [R,G,B,A] = blend(R,G,B,A, 245,240,245, teethA);

      px[i]=R; px[i+1]=G; px[i+2]=B; px[i+3]=A;
    }
  }
  return buildPNG(px, size);
}

const dir = path.join(__dirname, 'icons');
if (!fs.existsSync(dir)) fs.mkdirSync(dir);

[16, 48, 128].forEach(s => {
  fs.writeFileSync(path.join(dir, `icon${s}.png`), drawIcon(s));
  console.log(`✓ icons/icon${s}.png`);
});
console.log('Icons done!');
