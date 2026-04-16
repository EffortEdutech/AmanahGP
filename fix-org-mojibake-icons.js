const fs = require('fs');
const path = require('path');

const root = path.join(process.cwd(), 'apps', 'org');
if (!fs.existsSync(root)) {
  throw new Error('apps/org not found. Run this script from the repository root.');
}

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '.next') continue;
      walk(full, out);
    } else if (/\.(ts|tsx|md)$/.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

const map = new Map([
  ['\u00c2\u00b7', '\u00b7'],       // Â· -> ·
  ['\u00e2\u20ac\u009d\u00e2\u20ac\u009d', '\u2500\u2500'], // â”€â”€ -> ──
  ['\u00e2\u2021\u201e', '\u21c4'], // â‡„ -> ⇄
  ['\u00e2\u0153\u2030', '\u2709'], // âœ‰ -> ✉
  ['\u00e2\u0160\u00a0', '\u22a0'], // âŠ  -> ⊠
  ['\u00e2\u20ac\u201c\u00b2', '\u25b2'], // â–² -> ▲
  ['\u00e2\u02dc\u2018', '\u2611'], // â˜‘ -> ☑
  ['\u00e2\u20ac\u201d\u2030', '\u25c9'], // â—‰ -> ◉
  ['\u00e2\u02dc\u2026', '\u2605'], // â˜… -> ★
  ['\u00e2\u2122\u0178', '\u265f'], // â™Ÿ -> ♟

  ['\u00e2\u20ac\u00a2', '\u2022'], // â€¢ -> •
  ['\u00e2\u20ac\u201d', '\u2014'], // â€” -> —
  ['\u00e2\u20ac\u201c', '\u2013'], // â€“ -> –
  ['\u00e2\u20ac\u02dc', '\u2018'], // â€˜ -> ‘
  ['\u00e2\u20ac\u2122', '\u2019'], // â€™ -> ’
  ['\u00e2\u20ac\u0153', '\u201c'], // â€œ -> “
  ['\u00e2\u20ac\u009d', '\u201d'], // â€ -> ”
  ['\u00e2\u2020\u2019', '\u2192'], // â†’ -> →
  ['\u00e2\u2020\u0090', '\u2190'], // â† -> ←
  ['\u00e2\u2020\u2018', '\u2191'], // â†‘ -> ↑
  ['\u00e2\u2020\u201c', '\u2193'], // â†“ -> ↓
  ['\u00e2\u2013\u00a6', '\u25a6'], // â–¦ -> ▦
  ['\u00e2\u0160\u017e', '\u229e'], // âŠž -> ⊞
]);

const changed = [];
for (const file of walk(root)) {
  let text = fs.readFileSync(file, 'utf8');
  const original = text;

  for (const [bad, good] of map.entries()) {
    if (text.includes(bad)) text = text.split(bad).join(good);
  }

  if (text !== original) {
    fs.writeFileSync(file, text, 'utf8');
    changed.push(path.relative(process.cwd(), file));
  }
}

console.log('');
console.log('Changed files:');
if (!changed.length) {
  console.log('  None');
} else {
  for (const file of changed) console.log('  ' + file);
}
console.log('');
console.log('Now run: pnpm -C apps/org build');