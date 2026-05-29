// Run once: node generate-icons.js
// Generates the SafeNet SA shield-orb icons as PNG files (no dependencies).
// Brand orb: center #86EFAC (light green) → edge #0F7B4D (SafeNet green),
// with a white shield glyph so it reads as protection at 16px.

const fs = require('fs');
const path = require('path');

// center #86EFAC, edge #0F7B4D
const CENTER = [134, 239, 172];
const EDGE = [15, 123, 77];

function createPNG(size) {
  const width = size;
  const height = size;
  const pixels = Buffer.alloc(width * height * 4);
  const cx = width / 2;
  const cy = height / 2;
  const r = width / 2;

  // Radial green gradient disc with a soft anti-aliased edge.
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const idx = (y * width + x) * 4;
      if (dist <= r) {
        const t = dist / r; // 0=center, 1=edge
        pixels[idx]     = Math.round(CENTER[0] - t * (CENTER[0] - EDGE[0]));
        pixels[idx + 1] = Math.round(CENTER[1] - t * (CENTER[1] - EDGE[1]));
        pixels[idx + 2] = Math.round(CENTER[2] - t * (CENTER[2] - EDGE[2]));
        pixels[idx + 3] = dist > r - 1 ? Math.round(255 * (r - dist)) : 255;
      }
    }
  }

  // Top-left highlight, gives the orb its glossy depth.
  const glowX = Math.round(cx - r * 0.25);
  const glowY = Math.round(cy - r * 0.30);
  const glowR = Math.max(1, Math.round(r * 0.20));
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const dx = x - glowX;
      const dy = y - glowY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= glowR) {
        const idx = (y * width + x) * 4;
        const a = (180 * (1 - dist / glowR)) / 255;
        pixels[idx]     = Math.round(pixels[idx]     * (1 - a) + 255 * a);
        pixels[idx + 1] = Math.round(pixels[idx + 1] * (1 - a) + 255 * a);
        pixels[idx + 2] = Math.round(pixels[idx + 2] * (1 - a) + 255 * a);
      }
    }
  }

  drawShield(pixels, width, height);
  return encodePNG(width, height, pixels);
}

// White shield outline + check, centred. Drawn as a filled point-test so it
// scales cleanly from 16px to 128px without bundling an SVG rasteriser.
function drawShield(pixels, width, height) {
  const cx = width / 2;
  // Shield bounding box (normalised, then scaled to icon size).
  const top = height * 0.24;
  const bottom = height * 0.78;
  const halfW = width * 0.22;
  const shoulder = height * 0.42; // where the sides start curving inward

  const blend = (x, y, alpha) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const idx = (Math.round(y) * width + Math.round(x)) * 4;
    const a = alpha;
    pixels[idx]     = Math.round(pixels[idx]     * (1 - a) + 255 * a);
    pixels[idx + 1] = Math.round(pixels[idx + 1] * (1 - a) + 255 * a);
    pixels[idx + 2] = Math.round(pixels[idx + 2] * (1 - a) + 255 * a);
    pixels[idx + 3] = 255;
  };

  // Half-width of the shield at a given y (flat top, tapering to a point).
  function shieldHalfWidth(y) {
    if (y < top || y > bottom) return -1;
    if (y <= shoulder) return halfW;
    const t = (y - shoulder) / (bottom - shoulder); // 0..1 down to the tip
    return halfW * (1 - t * t); // quadratic taper to a rounded point
  }

  const stroke = Math.max(1, width * 0.055);
  for (let y = Math.floor(top); y <= Math.ceil(bottom); y++) {
    const hw = shieldHalfWidth(y);
    if (hw < 0) continue;
    for (let x = Math.floor(cx - hw - stroke); x <= Math.ceil(cx + hw + stroke); x++) {
      const edgeDist = Math.abs(Math.abs(x - cx) - hw);
      const insideTop = Math.abs(y - top) <= stroke && Math.abs(x - cx) <= hw;
      if (edgeDist <= stroke || insideTop) {
        const alpha = Math.max(0, 1 - edgeDist / (stroke + 0.5));
        blend(x, y, Math.min(1, alpha * 0.95));
      }
    }
  }

  // Check mark inside the shield.
  const ckStroke = Math.max(1, width * 0.06);
  const pA = [cx - width * 0.10, height * 0.50];
  const pB = [cx - width * 0.02, height * 0.585];
  const pC = [cx + width * 0.13, height * 0.40];
  drawLine(blend, pA, pB, ckStroke);
  drawLine(blend, pB, pC, ckStroke);
}

function drawLine(blend, [x0, y0], [x1, y1], stroke) {
  const steps = Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 3);
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const px = x0 + (x1 - x0) * t;
    const py = y0 + (y1 - y0) * t;
    const rad = stroke / 2;
    for (let dy = -rad; dy <= rad; dy++) {
      for (let dx = -rad; dx <= rad; dx++) {
        const d = Math.hypot(dx, dy);
        if (d <= rad) blend(px + dx, py + dy, Math.max(0, 1 - d / rad) * 0.9);
      }
    }
  }
}

function encodePNG(width, height, pixels) {
  const crc32 = makeCRC32();

  function chunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const typeBuffer = Buffer.from(type, 'ascii');
    const crcVal = Buffer.alloc(4);
    crcVal.writeInt32BE(crc32(Buffer.concat([typeBuffer, data])));
    return Buffer.concat([len, typeBuffer, data, crcVal]);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // RGBA
  ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

  const raw = [];
  for (let y = 0; y < height; y++) {
    raw.push(0); // filter type: None
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      raw.push(pixels[idx], pixels[idx + 1], pixels[idx + 2], pixels[idx + 3]);
    }
  }

  const zlib = require('zlib');
  const compressed = zlib.deflateSync(Buffer.from(raw));

  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', compressed),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function makeCRC32() {
  const table = new Int32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    table[i] = c;
  }
  return function crc(buf) {
    let c = -1;
    for (let i = 0; i < buf.length; i++) c = table[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
    return c ^ -1;
  };
}

const sizes = [16, 48, 128];
const dir = path.join(__dirname, 'icons');
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
for (const size of sizes) {
  const png = createPNG(size);
  fs.writeFileSync(path.join(dir, `icon-${size}.png`), png);
  console.log(`Created icon-${size}.png (${png.length} bytes)`);
}
console.log('Done! Load safenet-sa/extension as an unpacked extension in Chrome.');
