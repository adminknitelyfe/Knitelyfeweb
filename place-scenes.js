/* Place every scene photograph into its slot in one pass.
 *
 *   node place-scenes.js          report which files are present / missing
 *   node place-scenes.js --write  place all files that are present
 *
 * Slots are matched by their caption text, NOT by position. Reordering cards on
 * a page therefore cannot transpose photographs — an earlier version keyed off
 * the slot index and silently swapped two images when the homepage cards moved.
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const SCENES = path.join(__dirname, 'site', 'img', 'scenes');
const EXT = ['.jpg', '.jpeg', '.png', '.webp'];

// filename  ->  distinctive words from the slot's own caption
const MAP = [
  { name: 'going-out',           match: 'leaving a bar' },
  { name: 'meeting-someone-new', match: 'coffee at a window table' },
  { name: 'marketplace',         match: 'public parking lot' },
  { name: 'college-life',        match: 'campus quad' },
  { name: 'travel',              match: 'train station' },
  { name: 'getting-there',       match: 'rideshare' },
  { name: 'campus-wide',         match: 'crossing between buildings' },
  { name: 'doorstep-goodbye',    match: 'doorstep at night' },
  { name: 'residence-hall',      match: 'residence hall at night' },
];

const find = n => { for (const e of EXT) if (fs.existsSync(path.join(SCENES, n + e))) return n + e; return null; };
const write = process.argv.includes('--write');

// locate every slot on every page by its caption
const list = execFileSync('node', [path.join(__dirname, 'swap-scene.js')], { encoding: 'utf8' });
const slots = [];
let page = null;
for (const line of list.split('\n')) {
  const p = line.match(/^(\S+)\.html$/);
  if (p) { page = p[1]; continue; }
  const m = line.match(/^\s+(\d+)\.\s+\[[^\]]*\]\s+\S+\s+(.*)$/);
  if (m && page) slots.push({ page, slot: +m[1], desc: m[2].trim() });
}

let present = 0, placed = 0, total = 0;
for (const m of MAP) {
  const hit = slots.find(s => s.desc.toLowerCase().includes(m.match.toLowerCase()));
  const file = find(m.name);
  if (!hit) { console.log(`  NO SLOT  ${m.name.padEnd(20)} (no caption matching "${m.match}")`); continue; }
  if (!file) { console.log(`  MISSING  ${m.name.padEnd(20)} -> ${hit.page}.html slot ${hit.slot}`); continue; }
  present++;
  const kb = (fs.statSync(path.join(SCENES, file)).size / 1024).toFixed(0);
  total += fs.statSync(path.join(SCENES, file)).size;
  if (!write) { console.log(`  ready    ${file.padEnd(24)} -> ${hit.page}.html slot ${hit.slot}  ${kb} KB`); continue; }
  try {
    execFileSync('node', [path.join(__dirname, 'swap-scene.js'), hit.page, String(hit.slot), file], { stdio: 'pipe' });
    console.log(`  placed   ${file.padEnd(24)} -> ${hit.page}.html slot ${hit.slot}  (${kb} KB)`);
    placed++;
  } catch (e) {
    console.log(`  FAILED   ${file}: ${e.stderr ? e.stderr.toString().trim() : e.message}`);
  }
}
console.log(`\n${present}/${MAP.length} files present.` + (write ? ` ${placed} placed.` : ' Run with --write to place them.'));
if (total) console.log(`Total image weight: ${(total / 1024 / 1024).toFixed(2)} MB`);
