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

const suspicious = [
  'Â', 'Ã', 'â‰¡', 'â—Ž', 'â—‰', 'â™Ÿ', 'âŠ', 'âœ', 'â€“', 'â€”', 'â€œ', 'â€', 'â€™', 'â€¢', 'â†'
];

const results = [];
for (const file of walk(root)) {
  const text = fs.readFileSync(file, 'utf8');
  const hits = suspicious.filter((s) => text.includes(s));
  if (hits.length) {
    results.push({
      file: path.relative(process.cwd(), file),
      hits,
    });
  }
}

console.log('');
if (!results.length) {
  console.log('No suspicious mojibake patterns found in apps/org');
} else {
  console.log('Suspicious files:');
  for (const row of results) {
    console.log('  ' + row.file + '  [' + row.hits.join(', ') + ']');
  }
}
console.log('');
console.log('Count:', results.length);