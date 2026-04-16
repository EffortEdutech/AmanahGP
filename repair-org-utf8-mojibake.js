const fs = require('fs');
const path = require('path');

const root = path.join(process.cwd(), 'apps', 'org');
if (!fs.existsSync(root)) {
  throw new Error('apps/org not found. Run this script from the repository root.');
}

const exts = new Set(['.ts', '.tsx', '.js', '.jsx', '.md', '.json', '.css']);

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === '.next' || entry.name === 'node_modules') continue;
      walk(full, out);
    } else if (exts.has(path.extname(entry.name))) {
      out.push(full);
    }
  }
  return out;
}

// Targeted replacements only. Do not full-transcode entire files.
const replacements = new Map([
  ['\uFEFF', ''],          // remove UTF-8 BOM anywhere, especially file start
  ['\u00c2\u00b7', '\u00b7'],       // Â· -> ·

  // icons / glyphs
  ['\u00e2\u2030\u00a1', '\u2261'], // â‰¡ -> ≡
  ['\u00e2\u2014\u017d', '\u25ce'], // â—Ž -> ◎
  ['\u00e2\u20ac\u201d\u2030', '\u25c9'], // â—‰ -> ◉
  ['\u00e2\u2122\u0178', '\u265f'], // â™Ÿ -> ♟
  ['\u00e2\u0160\u017e', '\u229e'], // âŠž -> ⊞
  ['\u00e2\u2013\u00a6', '\u25a6'], // â–¦ -> ▦
  ['\u00e2\u2021\u201e', '\u21c4'], // â‡„ -> ⇄
  ['\u00e2\u0153\u2030', '\u2709'], // âœ‰ -> ✉
  ['\u00e2\u20ac\u201c\u00b2', '\u25b2'], // â–² -> ▲
  ['\u00e2\u02dc\u2018', '\u2611'], // â˜‘ -> ☑
  ['\u00e2\u02dc\u2026', '\u2605'], // â˜… -> ★
  ['\u00e2\u0153\u2026', '\u2705'], // âœ… -> ✅
  ['\u00e2\u0153\u008d', '\u270d'], // âœ -> ✍
  ['\u00e2\u0153\u00a8', '\u2728'], // âœ¨ -> ✨
  ['\u00e2\u0160\u00a0', '\u22a0'], // âŠ  -> ⊠

  // arrows / symbols
  ['\u00e2\u2020\u2019', '\u2192'], // â†’ -> →
  ['\u00e2\u2020\u0090', '\u2190'], // â† -> ←
  ['\u00e2\u2020\u2018', '\u2191'], // â†‘ -> ↑
  ['\u00e2\u2020\u201c', '\u2193'], // â†“ -> ↓

  // punctuation
  ['\u00e2\u20ac\u00a2', '\u2022'], // â€¢ -> •
  ['\u00e2\u20ac\u201d', '\u2014'], // â€” -> —
  ['\u00e2\u20ac\u201c', '\u2013'], // â€“ -> –
  ['\u00e2\u20ac\u02dc', '\u2018'], // â€˜ -> ‘
  ['\u00e2\u20ac\u2122', '\u2019'], // â€™ -> ’
  ['\u00e2\u20ac\u0153', '\u201c'], // â€œ -> “
  ['\u00e2\u20ac\u009d', '\u201d'], // â€ -> ”
  ['\u00e2\u20ac\u00a6', '\u2026'], // â€¦ -> …
  ['\u00c3\u2014', '\u00d7'],       // Ã— -> ×

  // occasional double-corruption leftovers
  ['\u00c3\u00a2\u00e2\u20ac\u0153\u00c2\u00a2', '\u2022'], // Ã¢â‚¬Â¢ -> •
  ['\u00c3\u00a2\u00e2\u20ac\u0153\u00e2\u20ac\u201d', '\u2014'], // Ã¢â‚¬â€ -> —
]);

function replaceAll(text, from, to) {
  return text.split(from).join(to);
}

const changed = [];
const report = [];

for (const file of walk(root)) {
  let text = fs.readFileSync(file, 'utf8');
  const original = text;
  const fileChanges = [];

  // strip BOM at file start if present
  if (text.charCodeAt(0) === 0xFEFF) {
    text = text.slice(1);
    fileChanges.push({ from: 'BOM', to: '' });
  }

  for (const [bad, good] of replacements.entries()) {
    if (text.includes(bad)) {
      const count = text.split(bad).length - 1;
      text = replaceAll(text, bad, good);
      fileChanges.push({ from: bad, to: good, count });
    }
  }

  if (text !== original) {
    fs.writeFileSync(file, text, 'utf8');
    changed.push(path.relative(process.cwd(), file));
    report.push({
      file: path.relative(process.cwd(), file),
      changes: fileChanges,
    });
  }
}

const reportPath = path.join(process.cwd(), 'org-mojibake-report.json');
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');

console.log('');
console.log('Changed files:');
if (!changed.length) {
  console.log('  None');
} else {
  for (const file of changed) console.log('  ' + file);
}
console.log('');
console.log('Report written to: org-mojibake-report.json');
console.log('Now run: node .\\scan-org-mojibake.js');
console.log('Then run: pnpm -C apps/org build');