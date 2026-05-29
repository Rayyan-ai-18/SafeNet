// Run once: node scripts/generate-pwa-icons.cjs
// Generates the PWA install icons as PNG (no dependencies). Chrome's
// installability check requires raster icons at 192 and 512; an SVG-only
// manifest never fires `beforeinstallprompt`, so the app can't be installed.
// Renders the brand app icon: #0F7B4D rounded square + white shield + check.

const fs = require('fs')
const path = require('path')
const zlib = require('zlib')

const BG = [15, 123, 77] // #0F7B4D SafeNet green
const FG = [255, 255, 255]

// `pad` carves a transparent margin (maskable safe-zone). 0 = full bleed.
function createPNG(size, { pad = 0 } = {}) {
  const w = size, h = size
  const px = Buffer.alloc(w * h * 4)
  const inset = Math.round(size * pad)
  const left = inset, top = inset, right = w - inset, bottom = h - inset
  const radius = (right - left) * 0.22 // rounded-square corners

  // Rounded-square green background.
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (x < left || x >= right || y < top || y >= bottom) continue
      const a = roundedRectAlpha(x + 0.5, y + 0.5, left, top, right, bottom, radius)
      if (a <= 0) continue
      const idx = (y * w + x) * 4
      px[idx] = BG[0]; px[idx + 1] = BG[1]; px[idx + 2] = BG[2]
      px[idx + 3] = Math.round(255 * a)
    }
  }

  drawShield(px, w, h, left, top, right, bottom)
  return encodePNG(w, h, px)
}

// Anti-aliased rounded-rectangle coverage for a pixel center.
function roundedRectAlpha(x, y, l, t, r, b, rad) {
  const dx = Math.max(l + rad - x, 0, x - (r - rad))
  const dy = Math.max(t + rad - y, 0, y - (b - rad))
  const dist = Math.hypot(dx, dy)
  if (dist <= rad - 0.5) return 1
  if (dist >= rad + 0.5) return dx === 0 && dy === 0 ? 1 : 0
  return Math.min(1, Math.max(0, rad + 0.5 - dist))
}

// White shield outline + check, centred within the icon box.
function drawShield(px, w, h, l, t, r, b) {
  const boxW = r - l, boxH = b - t
  const cx = l + boxW / 2
  const sTop = t + boxH * 0.20
  const sBottom = t + boxH * 0.84
  const halfW = boxW * 0.24
  const shoulder = t + boxH * 0.44

  const blend = (x, y, alpha) => {
    if (x < 0 || y < 0 || x >= w || y >= h) return
    const idx = (Math.round(y) * w + Math.round(x)) * 4
    px[idx] = Math.round(px[idx] * (1 - alpha) + FG[0] * alpha)
    px[idx + 1] = Math.round(px[idx + 1] * (1 - alpha) + FG[1] * alpha)
    px[idx + 2] = Math.round(px[idx + 2] * (1 - alpha) + FG[2] * alpha)
    px[idx + 3] = 255
  }

  function shieldHalfWidth(y) {
    if (y < sTop || y > sBottom) return -1
    if (y <= shoulder) return halfW
    const k = (y - shoulder) / (sBottom - shoulder)
    return halfW * (1 - k * k)
  }

  // Solid stroke with a 1px anti-aliased edge (no soft glow).
  const half = Math.max(1, boxW * 0.028) // half stroke width
  const aa = (d) => (d <= half - 0.5 ? 1 : d >= half + 0.5 ? 0 : half + 0.5 - d)
  for (let y = Math.floor(sTop) - 2; y <= Math.ceil(sBottom) + 2; y++) {
    const hw = shieldHalfWidth(y)
    for (let x = Math.floor(cx - halfW - half - 2); x <= Math.ceil(cx + halfW + half + 2); x++) {
      let a = 0
      if (hw >= 0) a = Math.max(a, aa(Math.abs(Math.abs(x - cx) - hw))) // left/right edges
      if (Math.abs(x - cx) <= hw + half) a = Math.max(a, aa(Math.abs(y - sTop))) // flat top bar
      if (a > 0) blend(x, y, Math.min(1, a))
    }
  }

  const ck = Math.max(1, boxW * 0.055)
  const pA = [cx - boxW * 0.11, t + boxH * 0.54]
  const pB = [cx - boxW * 0.02, t + boxH * 0.63]
  const pC = [cx + boxW * 0.14, t + boxH * 0.43]
  drawLine(blend, pA, pB, ck)
  drawLine(blend, pB, pC, ck)
}

function drawLine(blend, [x0, y0], [x1, y1], stroke) {
  const steps = Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 4)
  const rad = stroke / 2
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const px = x0 + (x1 - x0) * t
    const py = y0 + (y1 - y0) * t
    const span = Math.ceil(rad) + 1
    for (let dy = -span; dy <= span; dy++) {
      for (let dx = -span; dx <= span; dx++) {
        const d = Math.hypot(dx, dy)
        const a = d <= rad - 0.5 ? 1 : d >= rad + 0.5 ? 0 : rad + 0.5 - d
        if (a > 0) blend(px + dx, py + dy, a)
      }
    }
  }
}

function encodePNG(width, height, pixels) {
  const crc32 = makeCRC32()
  function chunk(type, data) {
    const len = Buffer.alloc(4)
    len.writeUInt32BE(data.length)
    const typeBuffer = Buffer.from(type, 'ascii')
    const crcVal = Buffer.alloc(4)
    crcVal.writeInt32BE(crc32(Buffer.concat([typeBuffer, data])))
    return Buffer.concat([len, typeBuffer, data, crcVal])
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8; ihdr[9] = 6
  const raw = []
  for (let y = 0; y < height; y++) {
    raw.push(0)
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4
      raw.push(pixels[idx], pixels[idx + 1], pixels[idx + 2], pixels[idx + 3])
    }
  }
  const compressed = zlib.deflateSync(Buffer.from(raw))
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', compressed), chunk('IEND', Buffer.alloc(0))])
}

function makeCRC32() {
  const table = new Int32Array(256)
  for (let i = 0; i < 256; i++) {
    let c = i
    for (let j = 0; j < 8; j++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1)
    table[i] = c
  }
  return function crc(buf) {
    let c = -1
    for (let i = 0; i < buf.length; i++) c = table[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
    return c ^ -1
  }
}

const dir = path.join(__dirname, '..', 'public', 'icons')
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })

// "any" purpose: full-bleed rounded square. Maskable: pad to keep the shield
// inside the platform safe zone (some launchers crop ~10% on every side).
const jobs = [
  { name: 'icon-192.png', size: 192, pad: 0 },
  { name: 'icon-512.png', size: 512, pad: 0 },
  { name: 'icon-maskable-512.png', size: 512, pad: 0.12 },
  { name: 'apple-touch-icon.png', size: 180, pad: 0 },
]
for (const j of jobs) {
  const png = createPNG(j.size, { pad: j.pad })
  fs.writeFileSync(path.join(dir, j.name), png)
  console.log(`Created icons/${j.name} (${png.length} bytes)`)
}
console.log('Done.')
