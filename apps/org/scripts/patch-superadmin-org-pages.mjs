#!/usr/bin/env node
// apps/org/scripts/patch-superadmin-org-pages.mjs
//
// Patches page-level org_members guards so super_admin/platform_owner can open
// every /org/[orgId]/... page without being inserted into org_members.
//
// Run from repository root:
//   node apps/org/scripts/patch-superadmin-org-pages.mjs

import fs from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const orgRoot = path.join(repoRoot, 'apps', 'org', 'app', '(protected)', 'org', '[orgId]');
const helperImport = "import { getOrgAccessOrRedirect } from '@/lib/access/org-access';";
const replacement = "const { authUser: user, platformUser, membership, isManager: accessIsManager, isSuperAdmin } = await getOrgAccessOrRedirect(orgId);";

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.isFile() && entry.name === 'page.tsx') out.push(full);
  }
  return out;
}

function addHelperImport(source) {
  if (source.includes(helperImport)) return source;
  const importMatches = [...source.matchAll(/^import[\s\S]*?;\s*$/gm)];
  if (!importMatches.length) return `${helperImport}\n${source}`;
  const last = importMatches[importMatches.length - 1];
  const insertAt = last.index + last[0].length;
  return `${source.slice(0, insertAt)}\n${helperImport}${source.slice(insertAt)}`;
}

function patchAccessBlock(source) {
  if (!source.includes('not_member_of_org')) return { source, changed: false, reason: 'no membership blocker' };
  if (source.includes('getOrgAccessOrRedirect(orgId)')) return { source, changed: false, reason: 'already patched' };

  const startRe = /const\s+\{\s*data:\s*\{\s*user\s*\}\s*\}\s*=\s*await\s+supabase\.auth\.getUser\(\);\s*if\s*\(!user\)\s*redirect\('\/login'\);/m;
  const start = source.search(startRe);
  if (start < 0) return { source, changed: false, reason: 'auth block pattern not found' };

  const failNeedle = "if (!membership) redirect('/no-access?reason=not_member_of_org');";
  let end = source.indexOf(failNeedle, start);
  let failLen = failNeedle.length;

  if (end < 0) {
    const failRe = /if\s*\(!membership\)\s*redirect\('\/no-access\?reason=not_member_of_org'\);/m;
    const m = failRe.exec(source.slice(start));
    if (!m) return { source, changed: false, reason: 'membership fail line not found' };
    end = start + m.index;
    failLen = m[0].length;
  }

  let after = end + failLen;
  while (after < source.length && /[ \t]/.test(source[after])) after++;
  if (source[after] === '\r') after++;
  if (source[after] === '\n') after++;

  let patched = `${source.slice(0, start)}${replacement}\n${source.slice(after)}`;
  patched = addHelperImport(patched);
  patched = patched.replace(
    /const\s+isManager\s*=\s*\[[^\]]*org_admin[^\]]*org_manager[^\]]*\]\.includes\(membership\.org_role\);/g,
    'const isManager = accessIsManager;'
  );
  return { source: patched, changed: true, reason: 'patched' };
}

const files = walk(orgRoot);
const changed = [];
const skipped = [];

for (const file of files) {
  const original = fs.readFileSync(file, 'utf8');
  const result = patchAccessBlock(original);
  if (result.changed) {
    const backup = `${file}.bak-superadmin-v8`;
    if (!fs.existsSync(backup)) fs.writeFileSync(backup, original, 'utf8');
    fs.writeFileSync(file, result.source, 'utf8');
    changed.push(path.relative(repoRoot, file));
  } else if (original.includes('not_member_of_org')) {
    skipped.push(`${path.relative(repoRoot, file)} — ${result.reason}`);
  }
}

console.log('\nAGP amanahOS super_admin page guard codemod v8');
console.log('Changed files:', changed.length);
for (const f of changed) console.log('  +', f);
if (skipped.length) {
  console.log('\nFiles still containing not_member_of_org but not patched automatically:');
  for (const f of skipped) console.log('  !', f);
}
console.log('\nNext checks:');
console.log('  pnpm -C apps/org typecheck  (if available)');
console.log('  pnpm -C apps/org build');
console.log('  pnpm -C apps/org dev');
