// Run once: node generate-assets.js
// Generates og-image.png and PWA icons (no external dependencies)

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// ── PNG encoder ──────────────────────────────────────────────────────────────

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
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

  const raw = [];
  for (let y = 0; y < height; y++) {
    raw.push(0); // filter type: None
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      raw.push(pixels[idx], pixels[idx+1], pixels[idx+2], pixels[idx+3]);
    }
  }

  const compressed = zlib.deflateSync(Buffer.from(raw));
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', compressed),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ── Draw helpers ─────────────────────────────────────────────────────────────

function setPixel(pixels, width, x, y, r, g, b, a) {
  if (x < 0 || y < 0 || x >= width) return;
  const idx = (y * width + x) * 4;
  pixels[idx]     = r;
  pixels[idx + 1] = g;
  pixels[idx + 2] = b;
  pixels[idx + 3] = a;
}

function blendPixel(pixels, width, x, y, r, g, b, srcA) {
  if (x < 0 || y < 0 || x >= width) return;
  const idx = (y * width + x) * 4;
  const a = srcA / 255;
  pixels[idx]     = Math.round(pixels[idx]     * (1 - a) + r * a);
  pixels[idx + 1] = Math.round(pixels[idx + 1] * (1 - a) + g * a);
  pixels[idx + 2] = Math.round(pixels[idx + 2] * (1 - a) + b * a);
  pixels[idx + 3] = Math.min(255, pixels[idx + 3] + Math.round(255 * a));
}

function fillRect(pixels, width, x0, y0, w, h, r, g, b, a) {
  for (let y = y0; y < y0 + h; y++) {
    for (let x = x0; x < x0 + w; x++) {
      setPixel(pixels, width, x, y, r, g, b, a);
    }
  }
}

function drawCircle(pixels, width, height, cx, cy, radius, colorFn) {
  const r2 = Math.ceil(radius);
  for (let y = Math.max(0, cy - r2 - 1); y < Math.min(height, cy + r2 + 2); y++) {
    for (let x = Math.max(0, cx - r2 - 1); x < Math.min(width, cx + r2 + 2); x++) {
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= radius + 0.5) {
        const [r, g, b, a] = colorFn(dist, radius, dx, dy);
        blendPixel(pixels, width, x, y, r, g, b, a);
      }
    }
  }
}

// ── Icon generator (same orb style as extension) ─────────────────────────────

function createIcon(size) {
  const width = size;
  const height = size;
  const pixels = Buffer.alloc(width * height * 4, 0);

  const cx = width / 2;
  const cy = height / 2;
  const r  = width / 2 * 0.92;

  // Draw orb
  drawCircle(pixels, width, height, cx, cy, r, (dist, radius) => {
    const t = dist / radius;
    const red   = Math.round(167 - t * (167 - 76));
    const green = Math.round(139 - t * (139 - 29));
    const blue  = Math.round(250 - t * (250 - 149));
    const alpha = dist > radius - 1 ? Math.round(255 * (radius - dist)) : 255;
    return [red, green, blue, alpha];
  });

  // Highlight glow
  const glowX = Math.round(cx - r * 0.25);
  const glowY = Math.round(cy - r * 0.30);
  const glowR = Math.max(1, Math.round(r * 0.18));
  drawCircle(pixels, width, height, glowX, glowY, glowR, (dist, radius) => {
    const t = dist / radius;
    const alpha = Math.round(180 * (1 - t));
    return [255, 255, 255, alpha];
  });

  return encodePNG(width, height, pixels);
}

// ── OG Image (1200×630) ──────────────────────────────────────────────────────

function createOGImage() {
  const width  = 1200;
  const height = 630;
  const pixels = Buffer.alloc(width * height * 4, 0);

  // Background: #060610
  fillRect(pixels, width, 0, 0, width, height, 6, 6, 16, 255);

  // Subtle gradient overlay - lighter center
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const dx = x - width * 0.38;
      const dy = y - height * 0.5;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const maxD = Math.sqrt(width * width + height * height) * 0.4;
      if (dist < maxD) {
        const t = 1 - dist / maxD;
        const glow = Math.round(20 * t * t);
        const idx = (y * width + x) * 4;
        pixels[idx]     = Math.min(255, pixels[idx]     + glow);
        pixels[idx + 1] = Math.min(255, pixels[idx + 1] + Math.round(glow * 0.5));
        pixels[idx + 2] = Math.min(255, pixels[idx + 2] + Math.round(glow * 2.5));
      }
    }
  }

  // Large purple orb on the right-center area
  const orbCX = Math.round(width * 0.72);
  const orbCY = Math.round(height * 0.5);
  const orbR  = 200;
  drawCircle(pixels, width, height, orbCX, orbCY, orbR, (dist, radius) => {
    const t = dist / radius;
    const red   = Math.round(167 - t * (167 - 76));
    const green = Math.round(139 - t * (139 - 29));
    const blue  = Math.round(250 - t * (250 - 149));
    const alpha = dist > radius - 1 ? Math.round(255 * (radius - dist)) : 220;
    return [red, green, blue, alpha];
  });

  // Orb highlight
  drawCircle(pixels, width, height,
    orbCX - Math.round(orbR * 0.25),
    orbCY - Math.round(orbR * 0.30),
    Math.round(orbR * 0.22),
    (dist, radius) => {
      const alpha = Math.round(160 * (1 - dist / radius));
      return [255, 255, 255, alpha];
    }
  );

  // Outer glow ring
  drawCircle(pixels, width, height, orbCX, orbCY, orbR + 40, (dist, radius) => {
    const t = 1 - (dist - (radius - 40)) / 40;
    if (t < 0) return [0, 0, 0, 0];
    const alpha = Math.round(40 * t);
    return [139, 92, 246, alpha];
  });

  return encodePNG(width, height, pixels);
}

// ── Main ─────────────────────────────────────────────────────────────────────

// Ensure icons directory exists
const iconsDir = path.join(__dirname, 'icons');
if (!fs.existsSync(iconsDir)) fs.mkdirSync(iconsDir, { recursive: true });

// Icons
for (const size of [192, 512]) {
  const png = createIcon(size);
  const outPath = path.join(iconsDir, `icon-${size}.png`);
  fs.writeFileSync(outPath, png);
  console.log(`Created icons/icon-${size}.png (${png.length} bytes)`);
}

// OG image
const ogPng = createOGImage();
const ogPath = path.join(__dirname, 'og-image.png');
fs.writeFileSync(ogPath, ogPng);
console.log(`Created og-image.png (${ogPng.length} bytes)`);

console.log('Done!');
