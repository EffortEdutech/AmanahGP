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

function readUtf8(file) {
  return fs.readFileSync(file, 'utf8');
}

function writeUtf8(file, text) {
  fs.writeFileSync(file, text, 'utf8');
}

function ensureHelper(text, helperName, helperCode) {
  if (!text.includes(`${helperName}<`) || text.includes(`function ${helperName}<`)) {
    return text;
  }
  const match = text.match(/^\s*export\b/m);
  if (match) {
    return text.slice(0, match.index) + helperCode + '\n\n' + text.slice(match.index);
  }
  return helperCode + '\n\n' + text;
}

function replaceIfPresent(text, oldText, newText) {
  return text.includes(oldText) ? text.split(oldText).join(newText) : text;
}

const relationOneHelper = `function relationOne<T>(value: unknown): T | null {
  if (Array.isArray(value)) {
    return (value[0] as T | undefined) ?? null;
  }
  return (value as T | null) ?? null;
}`;

const relationManyHelper = `function relationMany<T extends Record<string, unknown>>(
  value: unknown,
  nestedOneKeys: (keyof T)[] = []
): T[] {
  const rows = Array.isArray(value) ? value : value ? [value] : [];
  return rows.map((row) => {
    const obj = { ...(row as Record<string, unknown>) };
    for (const key of nestedOneKeys) {
      obj[key as string] = relationOne(obj[key as string]);
    }
    return obj as T;
  });
}`;

const mojibakeMap = new Map([
  ['\u00e2\u2013\u00a6', '\u25a6'], // â–¦ -> ▦
  ['\u00e2\u0160\u017e', '\u229e'], // âŠž -> ⊞
  ['\u00e2\u0153\u201c', '\u2713'], // âœ“ -> ✓
  ['\u00e2\u0153\u2014', '\u2717'], // âœ— -> ✗
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
  ['\u00f0\u0178\u2019\u00a1', '\ud83d\udca1'], // ðŸ’¡ -> 💡
  ['\u00f0\u0178\u201c\u201e', '\ud83d\udcc4'], // ðŸ“„ -> 📄
  ['\u00f0\u0178\u201c\u0160', '\ud83d\udcca'], // ðŸ“Š -> 📊
  ['\u00f0\u0178\u201c\u0152', '\ud83d\udccc'], // ðŸ“Œ -> 📌
  ['\u00f0\u0178\u2019\u00b0', '\ud83d\udcb0'], // ðŸ’° -> 💰
  ['\u00f0\u0178\u201d\u2019', '\ud83d\udd12'], // ðŸ”’ -> 🔒
  ['\u00f0\u0178\u201c\u2039', '\ud83d\udccb'], // ðŸ“‹ -> 📋
  ['\u00f0\u0178\u201c\u02c6', '\ud83d\udcc8'], // ðŸ“ˆ -> 📈
  ['\u00f0\u0178\u2014\u201a', '\ud83d\uddc2'], // ðŸ—‚ -> 🗂
  ['\u00f0\u0178\u2019\u00b3', '\ud83d\udcb3'], // ðŸ’³ -> 💳
  ['\u00f0\u0178\u201c\u00a6', '\ud83d\udce6'], // ðŸ“¦ -> 📦
  ['\u00f0\u0178\u0161\u00a8', '\ud83d\udea8'], // ðŸš¨ -> 🚨
  ['\u00f0\u0178\u2018\u00a5', '\ud83d\udc65'], // ðŸ‘¥ -> 👥
  ['\u00f0\u0178\u00a7\u00be', '\ud83e\uddfE'.toLowerCase()], // placeholder corrected below
]);

// fix one entry that cannot be represented by simple toLowerCase trick:
mojibakeMap.delete('\u00f0\u0178\u00a7\u00be');
mojibakeMap.set('\u00f0\u0178\u00a7\u00be', '\ud83e\uddfe'); // ðŸ§¾ -> 🧾
mojibakeMap.set('\u00f0\u0178\u017d\u00af', '\ud83c\udfaf'); // ðŸŽ¯ -> 🎯

const files = walk(root);
const changed = [];

for (const file of files) {
  let text = readUtf8(file);
  const original = text;

  // 1) repair common mojibake
  for (const [bad, good] of mojibakeMap.entries()) {
    if (text.includes(bad)) {
      text = text.split(bad).join(good);
    }
  }

  // 2) generic direct relation casts: const x = something.rel as { ... } | null;
  text = text.replace(
    /(const\s+\w+\s*=\s*)([A-Za-z0-9_?.\[\]]+\.[A-Za-z0-9_?.\[\]]+)\s+as\s+(\{[\s\S]*?\})\s+\|\s+null;/g,
    '$1relationOne<$3>($2);'
  );

  // const x = something.rel as Record<string, unknown> | null;
  text = text.replace(
    /(const\s+\w+\s*=\s*)([A-Za-z0-9_?.\[\]]+\.[A-Za-z0-9_?.\[\]]+)\s+as\s+((?!\{)[A-Za-z0-9_<>, \[\]]+)\s+\|\s+null;/g,
    '$1relationOne<$3>($2);'
  );

  // const x = (Array.isArray(orgRaw) ? orgRaw[0] : orgRaw) as | { ... } | null;
  text = text.replace(
    /(const\s+\w+\s*=\s*)\(Array\.isArray\((\w+)\)\s*\?\s*\2\[0\]\s*:\s*\2\)\s+as\s*\|\s*(\{[\s\S]*?\})\s*\|\s*null;/g,
    '$1relationOne<$3>($2);'
  );

  // 3) specific known nested array cases already surfaced by build
  if (file.endsWith(path.join('app', '(protected)', 'accounting', 'page.tsx'))) {
    text = replaceIfPresent(
      text,
      "const lines  = (entry.journal_lines as Line[]) ?? [];",
      "const lines  = relationMany<Line>(entry.journal_lines, ['funds']);"
    );
  }

  if (file.endsWith(path.join('app', '(protected)', 'accounting', 'transactions', 'page.tsx'))) {
    text = replaceIfPresent(
      text,
      "(e.journal_lines as Array<{ fund_id: string }>).some((l) => l.fund_id === params.fundId)",
      "relationMany<{ fund_id: string }>(e.journal_lines).some((l) => l.fund_id === params.fundId)"
    );
    text = replaceIfPresent(
      text,
      "for (const l of (e.journal_lines as Line[])) {",
      "for (const l of relationMany<Line>(e.journal_lines, ['accounts', 'funds'])) {"
    );
    text = replaceIfPresent(
      text,
      "const lines     = (entry.journal_lines as Line[]) ?? [];",
      "const lines     = relationMany<Line>(entry.journal_lines, ['accounts', 'funds']);"
    );
  }

  if (file.endsWith(path.join('app', '(protected)', 'accounting', 'payment-requests', 'page.tsx'))) {
    text = replaceIfPresent(
      text,
      "const fund    = req.funds    as FundShape;",
      "const fund    = relationOne<NonNullable<FundShape>>(req.funds);"
    );
    text = replaceIfPresent(
      text,
      "const acct    = req.accounts as AccountShape;",
      "const acct    = relationOne<NonNullable<AccountShape>>(req.accounts);"
    );
  }

  if (file.endsWith(path.join('app', '(protected)', 'accounting', 'reports', 'zakat-utilisation', 'page.tsx'))) {
    text = text.replace(
      /const filteredLines = \(allZakatLines \?\? \[\]\)\.filter\(\(l\) => \{\s*const je = relationOne<\{ period_year: number \}>\(l\.journal_entries\);\s*return je\?\.period_year === selectedYear;\s*\}\) as JL\[];/s,
      `const filteredLines = relationMany<JL>(allZakatLines, ['journal_entries']).filter((l) => {
    const je = l.journal_entries;
    return je?.period_year === selectedYear;
  });`
    );
  }

  text = ensureHelper(text, 'relationOne', relationOneHelper);
  text = ensureHelper(text, 'relationMany', relationManyHelper);

  if (text !== original) {
    writeUtf8(file, text);
    changed.push(path.relative(process.cwd(), file));
  }
}

console.log('');
console.log('Changed files:');
if (changed.length === 0) {
  console.log('  None');
} else {
  for (const file of changed) console.log('  ' + file);
}
console.log('');
console.log('Now run: pnpm -C apps/org build');