import fs from 'node:fs';

const requiredSqlSnippets = [
  'create table if not exists public.authority_evidence_links',
  'create table if not exists public.authority_evidence_access_logs',
  "check (visibility_scope in ('organisation_private', 'authority_reviewable', 'approved_public'))",
  'agp_evidence_visibility_scope',
  'agp_link_authority_evidence_for_submission',
  'agp_log_authority_evidence_access',
  'authority_evidence_links_select_scoped',
  'authority_evidence_access_logs_insert_scoped',
  'source_access',
  'not_granted_by_link',
];

const requiredServiceSnippets = [
  'export async function listAuthorityEvidenceLinks',
  'export async function getAuthorityEvidenceSummary',
  'authority_evidence_links',
  'visibility_scope',
  'organisation_private',
  'authority_reviewable',
  'approved_public',
];

function assertIncludes(label, text, snippets) {
  const missing = snippets.filter((snippet) => !text.includes(snippet));
  if (missing.length) {
    console.error(`[phase7-evidence] ${label} missing required snippets:`);
    for (const snippet of missing) console.error(`- ${snippet}`);
    process.exitCode = 1;
  }
}

const sql = fs.readFileSync('supabase/migrations/0065_evidence_authority_boundary.sql', 'utf8');
const service = fs.readFileSync('apps/agp-console/lib/console/authority-evidence.ts', 'utf8');
const checklist = fs.readFileSync('docs/AGP_MAIN_JAIN_CODEBASE_POLISH_CHECKLIST.md', 'utf8');

assertIncludes('migration', sql, requiredSqlSnippets);
assertIncludes('Console evidence service', service, requiredServiceSnippets);

if (/create policy[\s\S]+on public\.evidence_files/.test(sql)) {
  console.error('[phase7-evidence] migration must not add authority policies to evidence_files.');
  process.exitCode = 1;
}

if (/create policy[\s\S]+on public\.org_documents/.test(sql)) {
  console.error('[phase7-evidence] migration must not add authority policies to org_documents.');
  process.exitCode = 1;
}

if (!sql.includes('This migration intentionally adds no authority policy to evidence_files or org_documents')) {
  console.error('[phase7-evidence] migration must document the source evidence/document RLS boundary.');
  process.exitCode = 1;
}

if (!checklist.includes('Phase 7 - Evidence Boundary') || !checklist.includes('0065_evidence_authority_boundary.sql')) {
  console.error('[phase7-evidence] checklist must mention Phase 7 and migration 0065.');
  process.exitCode = 1;
}

if (!process.exitCode) {
  console.log('[phase7-evidence] authority evidence boundary contract OK');
}
