/* Swap a placeholder SVG scene for a real photograph.
 *
 *   node swap-scene.js                        list every slot with its index
 *   node swap-scene.js index 1 bar-night.jpg  swap slot 1 on index.html
 *   node swap-scene.js index 1 bar.jpg "alt"  override the alt text
 *
 * Images live in site/img/scenes/. The hidden <span> stays: it is already
 * invisible via .shot.has-scene and documents what the slot is for.
 */
const fs = require('fs');
const path = require('path');

const SITE = path.join(__dirname, 'site');
const PAGES = ['index', 'about', 'knite-campus', 'knite-exchange'];
// The media is optional: a slot with only its caption is a placeholder still
// awaiting photography, and should still be listed.
const SLOT_RE = /<div class="(shot[^"]*)"([^>]*)>\s*(<svg class="scene"[\s\S]*?<\/svg>|<img class="scene"[^>]*>)?\s*<span>Photo:\s*([^<]*)<\/span>/g;

function slots(page) {
  const html = fs.readFileSync(path.join(SITE, page + '.html'), 'utf8');
  const found = [];
  let m;
  SLOT_RE.lastIndex = 0;
  while ((m = SLOT_RE.exec(html)) !== null) {
    found.push({ cls: m[1], attrs: m[2], media: m[3] || '', desc: m[4].trim(),
                 start: m.index, end: m.index + m[0].length, full: m[0] });
  }
  return { html, found };
}

// Page CSS can override a slot's ratio. `.pick-card .shot` is set to 16/10 in the
// EDU pages' own <style> blocks, which the class and inline-style checks below
// cannot see — so it is recorded here.
const CSS_OVERRIDES = {};

function ratio(s, page) {
  const inline = /aspect-ratio:\s*([^;"]+)/.exec(s.attrs || '');
  if (inline) { const v = inline[1].trim(); return v === '1' ? '1:1' : v.replace('/', ':'); }
  if (s.cls.includes('wide')) return '16:9';
  if (s.cls.includes('tall')) return '3:4';
  return CSS_OVERRIDES[page] || '4:3';
}

const [page, nStr, file, altArg] = process.argv.slice(2);

if (!page) {
  let total = 0, done = 0;
  for (const p of PAGES) {
    const { found } = slots(p);
    console.log('\n' + p + '.html');
    found.forEach((s, i) => {
      const isImg = s.media.startsWith('<img');
      const state = isImg ? 'PHOTO' : s.media ? 'svg  ' : 'EMPTY';
      total++; if (isImg) done++;
      console.log(`  ${i + 1}. [${ratio(s, p).padEnd(5)}] ${state}  ${s.desc}`);
    });
  }
  console.log(`\n${done}/${total} slots have real photography.`);
  console.log('usage: node swap-scene.js <page> <slot#> <filename.jpg> ["alt text"]');
  process.exit(0);
}

if (!PAGES.includes(page)) { console.error('unknown page: ' + page + '\nexpected: ' + PAGES.join(', ')); process.exit(1); }
const n = parseInt(nStr, 10);
const { html, found } = slots(page);
const slot = found[n - 1];
if (!slot) { console.error(`slot ${nStr} not found on ${page}.html (has ${found.length})`); process.exit(1); }
if (!file) { console.error('no image filename given'); process.exit(1); }

const abs = path.join(SITE, 'img', 'scenes', file);
if (!fs.existsSync(abs)) { console.error('image not found: ' + abs); process.exit(1); }

const alt = (altArg || slot.desc).replace(/"/g, '&quot;');
const img = `<img class="scene" src="img/scenes/${file}" alt="${alt}" loading="lazy">`;

fs.copyFileSync(path.join(SITE, page + '.html'), path.join(SITE, page + '.html.bak'));
fs.writeFileSync(path.join(SITE, page + '.html'),
  html.slice(0, slot.start) +
  (slot.media ? slot.full.replace(slot.media, img) : slot.full.replace('<span>Photo:', img + '<span>Photo:'))
    .replace(/class="shot(?! )/, 'class="shot has-scene') + html.slice(slot.end));

console.log(`${page}.html slot ${n} [${ratio(slot, page)}] -> img/scenes/${file} (${(fs.statSync(abs).size/1024).toFixed(0)} KB)`);
console.log('  alt: ' + alt);
console.log('  backup: ' + page + '.html.bak');
