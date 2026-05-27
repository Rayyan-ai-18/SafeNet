// Run once: node generate-icons.js
// Generates simple Luna AI icons as PNG files (no dependencies)

const fs = require('fs');
const path = require('path');

// Minimal PNG encoder (no dependencies)
function createPNG(size) {
  // We'll write raw PNG with a purple gradient circle

  const width = size;
  const height = size;

  // Create RGBA pixel data
  const pixels = Buffer.alloc(width * height * 4);
  const cx = width / 2;
  const cy = height / 2;
  const r  = width / 2;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const idx = (y * width + x) * 4;

      if (dist <= r) {
        // Purple gradient: center lighter, edge darker
        const t = dist / r; // 0=center, 1=edge
        // center: #a78bfa, edge: #4c1d95
        const red   = Math.round(167 - t * (167 - 76));
        const green = Math.round(139 - t * (139 - 29));
        const blue  = Math.round(250 - t * (250 - 149));
        const alpha = dist > r - 1 ? Math.round(255 * (r - dist)) : 255;

        pixels[idx]     = red;
        pixels[idx + 1] = green;
        pixels[idx + 2] = blue;
        pixels[idx + 3] = alpha;
      }
      // else: transparent (all zeros)
    }
  }

  // Add glow dots (white highlight at top-left)
  const glowX = Math.round(cx - r * 0.25);
  const glowY = Math.round(cy - r * 0.30);
  const glowR = Math.max(1, Math.round(r * 0.18));
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const dx = x - glowX;
      const dy = y - glowY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= glowR) {
        const idx = (y * width + x) * 4;
        const t = dist / glowR;
        const alpha = Math.round(180 * (1 - t));
        // Blend white over existing pixel
        const a = alpha / 255;
        pixels[idx]     = Math.round(pixels[idx]     * (1 - a) + 255 * a);
        pixels[idx + 1] = Math.round(pixels[idx + 1] * (1 - a) + 255 * a);
        pixels[idx + 2] = Math.round(pixels[idx + 2] * (1 - a) + 255 * a);
      }
    }
  }

  return encodePNG(width, height, pixels);
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

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // RGBA
  ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

  // IDAT - raw scanlines with filter byte 0
  const raw = [];
  for (let y = 0; y < height; y++) {
    raw.push(0); // filter type: None
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      raw.push(pixels[idx], pixels[idx+1], pixels[idx+2], pixels[idx+3]);
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
for (const size of sizes) {
  const png = createPNG(size);
  const outPath = path.join(__dirname, 'icons', `icon-${size}.png`);
  fs.writeFileSync(outPath, png);
  console.log(`Created icon-${size}.png (${png.length} bytes)`);
}

console.log('Done! You can now load the extension in Chrome.');
