#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const rootArg = process.argv[2] || 'apps/org';
const repoRoot = process.cwd();
const targetRoot = path.resolve(repoRoot, rootArg);

if (!fs.existsSync(targetRoot)) {
  console.error(`Target folder not found: ${targetRoot}`);
  process.exit(1);
}

const TEXT_EXT = new Set([
  '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs',
  '.json', '.md', '.mdx', '.css', '.scss', '.txt', '.yml', '.yaml'
]);

const SKIP_DIRS = new Set([
  '.git', '.next', 'node_modules', 'dist', 'build', 'coverage', '.vercel'
]);

const cp1252Reverse = new Map(Object.entries({
  '€': 0x80,
  '‚': 0x82,
  'ƒ': 0x83,
  '„': 0x84,
  '…': 0x85,
  '†': 0x86,
  '‡': 0x87,
  'ˆ': 0x88,
  '‰': 0x89,
  'Š': 0x8A,
  '‹': 0x8B,
  'Œ': 0x8C,
  'Ž': 0x8E,
  '‘': 0x91,
  '’': 0x92,
  '“': 0x93,
  '”': 0x94,
  '•': 0x95,
  '–': 0x96,
  '—': 0x97,
  '˜': 0x98,
  '™': 0x99,
  'š': 0x9A,
  '›': 0x9B,
  'œ': 0x9C,
  'ž': 0x9E,
  'Ÿ': 0x9F,
}));

const mojibakeMarkerRegex = /[ÂÃâð]/;
const suspiciousTokenRegex = /[ÂÃâð][^\s"'`<>\[\]{}()]+/g;
const leftoverRegex = /(?:[ÂÃâð][^\s"'`<>\[\]{}()]*)/g;

function encodeCp1252Byte(ch) {
  const code = ch.codePointAt(0);
  if (code <= 0xff) return code;
  if (cp1252Reverse.has(ch)) return cp1252Reverse.get(ch);
  throw new Error(`Cannot CP1252-encode char ${JSON.stringify(ch)} U+${code.toString(16).toUpperCase()}`);
}

function decodeMojibakeToken(token) {
  let current = token;

  for (let i = 0; i < 2; i += 1) {
    if (!mojibakeMarkerRegex.test(current)) break;

    let bytes;
    try {
      bytes = [];
      for (const ch of current) bytes.push(encodeCp1252Byte(ch));
    } catch {
      break;
    }

    let decoded;
    try {
      decoded = Buffer.from(bytes).toString('utf8');
    } catch {
      break;
    }

    if (!decoded || decoded === current) break;

    const beforeScore = scoreString(current);
    const afterScore = scoreString(decoded);
    if (afterScore >= beforeScore) {
      current = decoded;
    } else {
      break;
    }
  }

  return current;
}

function scoreString(value) {
  const markerCount = (value.match(/[ÂÃâð]/g) || []).length;
  const replacementCount = (value.match(/�/g) || []).length;
  const readableBonus = (value.match(/[≥≤→←↗↘▲▼○◉◎⊞♟★✓✗📦📊🏆🌙🏛]/gu) || []).length;
  return readableBonus * 5 - markerCount * 10 - replacementCount * 30;
}

function explicitFixes(text) {
  return text
    .replace(/Â\u00A0/g, ' ')
    .replace(/Â /g, ' ')
    .replace(/Â·/g, '·')
    .replace(/Â:/g, ':')
    .replace(/Â,/g, ',')
    .replace(/Â;/g, ';');
}

function repairText(original) {
  let text = explicitFixes(original);

  text = text.replace(suspiciousTokenRegex, (match) => {
    const fixed = decodeMojibakeToken(match);
    return fixed;
  });

  return text;
}

function walk(dir, out = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      walk(path.join(dir, entry.name), out);
      continue;
    }
    const ext = path.extname(entry.name).toLowerCase();
    if (TEXT_EXT.has(ext)) out.push(path.join(dir, entry.name));
  }
  return out;
}

function relative(p) {
  return path.relative(repoRoot, p).replace(/\\/g, '/');
}

const files = walk(targetRoot);
const changed = [];
const leftovers = [];

for (const file of files) {
  const before = fs.readFileSync(file, 'utf8');
  const after = repairText(before);

  if (after !== before) {
    fs.writeFileSync(file, after, 'utf8');
    changed.push(relative(file));
  }

  const check = fs.readFileSync(file, 'utf8');
  const matches = check.match(leftoverRegex);
  if (matches && matches.length > 0) {
    const interesting = [...new Set(matches)]
      .filter((m) => /[ÂÃâð]/.test(m))
      .slice(0, 12);
    if (interesting.length > 0) {
      leftovers.push({ file: relative(file), tokens: interesting });
    }
  }
}

if (changed.length === 0) {
  console.log('No text changes were needed.');
} else {
  console.log('Changed files:');
  for (const file of changed) console.log(`  ${file}`);
}

if (leftovers.length > 0) {
  console.log('\nResidual suspicious tokens to review:');
  for (const item of leftovers) {
    console.log(`  ${item.file}`);
    for (const token of item.tokens) console.log(`    - ${token}`);
  }
} else {
  console.log('\nNo remaining mojibake-style tokens were detected in scanned text files.');
}

console.log('\nNow run: pnpm -C apps/org build');
