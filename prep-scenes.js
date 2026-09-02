/* Crop, resize and compress the raw scene exports for the web.
 *
 *   1. Save the eleven images into  raw/  using the basenames below.
 *      Any format works (.png .jpg .jpeg .webp). Don't worry about size.
 *   2. node prep-scenes.js          report what's there and what it would do
 *   3. node prep-scenes.js --write  process into site/img/scenes/
 *
 * Each image is centre-cropped to its slot's exact aspect ratio, resized so the
 * long edge is 1600px, and compressed to JPEG. raw/ sits outside site/ so the
 * originals never ship.
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const RAW = path.join(__dirname, 'raw');
const OUT = path.join(__dirname, 'site', 'img', 'scenes');
const EXT = ['.png', '.jpg', '.jpeg', '.webp'];
const LONG_EDGE = 1600;
const QUALITY = 82;

const MAP = [
  { name: 'going-out',           ar: 4 / 3 },
  { name: 'meeting-someone-new', ar: 4 / 3 },
  { name: 'marketplace',         ar: 4 / 3 },
  { name: 'college-life',        ar: 4 / 3 },
  { name: 'travel',              ar: 4 / 3 },
  { name: 'getting-there',       ar: 4 / 3 },
  { name: 'campus-wide',         ar: 16 / 9 },
  { name: 'doorstep-goodbye',    ar: 1 },
  { name: 'residence-hall',      ar: 3 / 4 },
];

const label = ar => ({ [4/3]: '4:3', [16/9]: '16:9', [1]: '1:1', [3/4]: '3:4', [16/10]: '16:10' })[ar] || ar.toFixed(3);
const find = n => { for (const e of EXT) { const p = path.join(RAW, n + e); if (fs.existsSync(p)) return p; } return null; };
const kb = b => (b / 1024).toFixed(0) + ' KB';

(async () => {
  const write = process.argv.includes('--write');
  if (write) fs.mkdirSync(OUT, { recursive: true });

  let found = 0, outTotal = 0;
  for (const m of MAP) {
    const src = find(m.name);
    if (!src) { console.log(`  MISSING   ${m.name.padEnd(20)} [${label(m.ar)}]`); continue; }
    found++;

    let meta = await sharp(src).metadata();
    let pipeline = sharp(src);
    if (m.trimBottom) {
      pipeline = pipeline.extract({ left: 0, top: 0, width: meta.width, height: meta.height - m.trimBottom });
      meta = { width: meta.width, height: meta.height - m.trimBottom };
    }
    const srcAr = meta.width / meta.height;
    const drift = Math.abs(srcAr - m.ar) / m.ar;

    // Largest box at the slot's exact ratio that fits INSIDE the source, so a
    // wide source cropped to a taller ratio is never scaled up to fill it.
    let bw = Math.min(meta.width, meta.height * m.ar);
    let bh = bw / m.ar;
    const long = Math.max(bw, bh);
    if (long > LONG_EDGE) { const k = LONG_EDGE / long; bw *= k; bh *= k; }
    const w = Math.round(bw), h = Math.round(bh);

    const note = drift < 0.01 ? 'exact' : drift < 0.12 ? `crop ${(drift*100).toFixed(0)}%` : `CROP ${(drift*100).toFixed(0)}% — check`;

    if (!write) {
      console.log(`  ready     ${m.name.padEnd(20)} [${label(m.ar)}]  ${meta.width}x${meta.height} ${kb(fs.statSync(src).size)} -> ${w}x${h}  (${note})`);
      continue;
    }

    const dest = path.join(OUT, m.name + '.jpg');
    await pipeline
      .resize(w, h, { fit: 'cover', position: 'centre' })
      .jpeg({ quality: QUALITY, mozjpeg: true, progressive: true })
      .toFile(dest);

    const size = fs.statSync(dest).size;
    outTotal += size;
    console.log(`  done      ${(m.name + '.jpg').padEnd(24)} ${w}x${h}  ${kb(size)}  (${note})`);
  }

  console.log(`\n${found}/${MAP.length} raw files found.`);
  if (write && outTotal) console.log(`Total output weight: ${(outTotal / 1024 / 1024).toFixed(2)} MB`);
  if (!write && found) console.log('Run with --write to process into site/img/scenes/');
})();
