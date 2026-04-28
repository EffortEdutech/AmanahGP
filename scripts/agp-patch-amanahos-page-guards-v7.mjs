#!/usr/bin/env node
/*
  AGP amanahOS v7 page guard patcher

  Purpose:
  Existing page files under apps/org/app/(protected)/org/[orgId] often do their own:
    service.from('org_members')...eq('user_id', platformUser.id)...single()

  That blocks platform super_admin because super_admin is intentionally not an org_members row.
  This script rewrites those local membership lookups into:
    - super_admin: synthetic membership from public.organizations
    - normal user: original org_members lookup

  Run once from repo root:
    node scripts/agp-patch-amanahos-page-guards-v7.mjs
*/

import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const targetDir = path.join(root, 'apps', 'org', 'app', '(protected)', 'org', '[orgId]');

if (!fs.existsSync(targetDir)) {
  console.error(`[AGP v7] Target folder not found: ${targetDir}`);
  process.exit(1);
}

const PAGE_GUARD_MARKER = 'AGP_SUPER_ADMIN_PATCH_V7';

function walk(dir) {
  const out = [];
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, item.name);
    if (item.isDirectory()) out.push(...walk(p));
    else if (item.isFile() && item.name === 'page.tsx') out.push(p);
  }
  return out;
}

function patchRoleChecks(text) {
  let next = text;

  next = next.replace(
    /\[([^\]]*'org_admin'[^\]]*)\]\.includes\(membership\.org_role\)/g,
    (match, inside) => {
      if (inside.includes('super_admin')) return match;
      return `[${inside}, 'super_admin'].includes(membership.org_role)`;
    },
  );

  next = next.replace(
    /membership\.org_role\s*===\s*'org_admin'\s*\|\|\s*membership\.org_role\s*===\s*'org_manager'/g,
    "membership.org_role === 'org_admin' || membership.org_role === 'org_manager' || membership.org_role === 'super_admin'",
  );

  next = next.replace(
    /membership\.org_role\s*===\s*'org_admin'/g,
    "(membership.org_role === 'org_admin' || membership.org_role === 'super_admin')",
  );

  next = next.replace(
    /membership\.org_role\s*!==\s*'org_admin'/g,
    "(membership.org_role !== 'org_admin' && membership.org_role !== 'super_admin')",
  );

  return next;
}

function patchMembershipBlock(text, file) {
  if (text.includes(PAGE_GUARD_MARKER)) return text;
  if (!text.includes(".from('org_members')") && !text.includes('.from("org_members")')) return text;
  if (!text.includes('platformUser.platform_role')) return text;

  const membershipRegex = /const\s+\{\s*data:\s*membership(?:\s*,\s*error:\s*([A-Za-z_$][\w$]*))?\s*\}\s*=\s*await\s+([A-Za-z_$][\w$]*)\s*([\s\S]*?\.from\(['\"]org_members['\"]\)[\s\S]*?)(\.single\(\)|\.maybeSingle\(\))\s*;/m;

  const match = text.match(membershipRegex);
  if (!match) return text;

  const errorVar = match[1] ?? null;
  const clientVar = match[2];
  const chain = match[3];
  const terminator = match[4];

  const errorDecl = errorVar ? `  let ${errorVar}: any = null;\n` : '';
  const errorSelect = errorVar ? `, error: ${errorVar}Data` : '';
  const errorAssign = errorVar ? `\n    ${errorVar} = ${errorVar}Data;` : '';

  const replacement = `/* ${PAGE_GUARD_MARKER} */
  const isSuperAdmin = platformUser.platform_role === 'super_admin';
  let membership: any = null;
${errorDecl}  if (isSuperAdmin) {
    const { data: orgForSuperAdmin, error: orgForSuperAdminError } = await ${clientVar}
      .from('organizations')
      .select('*')
      .eq('id', orgId)
      .single();

    if (orgForSuperAdminError) {
      console.error('[amanahOS] super_admin organization lookup failed:', orgForSuperAdminError.message);
    }

    if (!orgForSuperAdmin) redirect('/no-access?reason=org_not_found');

    membership = {
      organization_id: orgId,
      org_role: 'super_admin',
      status: 'active',
      organizations: orgForSuperAdmin,
    };
  } else {
    const { data: membershipData${errorSelect} } = await ${clientVar}${chain}${terminator};
    membership = membershipData;${errorAssign}
  }`;

  const next = text.replace(membershipRegex, replacement);
  console.log(`[AGP v7] Patched membership guard: ${path.relative(root, file)}`);
  return next;
}

let patched = 0;
let scanned = 0;

for (const file of walk(targetDir)) {
  scanned += 1;
  const original = fs.readFileSync(file, 'utf8');
  let next = original;

  next = patchMembershipBlock(next, file);
  next = patchRoleChecks(next);

  if (next !== original) {
    fs.writeFileSync(file, next, 'utf8');
    patched += 1;
  }
}

console.log(`[AGP v7] Scanned ${scanned} page.tsx files.`);
console.log(`[AGP v7] Updated ${patched} files.`);
console.log('[AGP v7] Next: run pnpm -C apps/org build');
