import fs from 'node:fs';

const requiredSqlSnippets = [
  'create table if not exists public.policy_sets',
  'create table if not exists public.policy_versions',
  'create table if not exists public.policy_rules',
  'create table if not exists public.policy_effective_periods',
  'create table if not exists public.policy_exceptions',
  'agp_reject_overlapping_policy_periods',
  'trg_reject_overlapping_policy_periods',
  'agp_active_policy_version_id',
  'alter table public.policy_sets force row level security',
  'policy_versions_write_authority_admin',
  'policy_rules_select_scoped_authority',
];

const requiredServiceSnippets = [
  'export async function listPolicySets',
  'export async function listPolicyVersions',
  'export async function listPolicyRules',
  'export async function getActivePolicyRules',
  'agp_active_policy_version_id',
];

const requiredValidationSnippets = [
  'POLICY_RULE_CATEGORY_OPTIONS',
  'submission',
  'obligation',
  'approval',
  'governance_review',
  'export type PolicyRuleCategory',
];

function assertIncludes(label, text, snippets) {
  const missing = snippets.filter((snippet) => !text.includes(snippet));
  if (missing.length) {
    console.error(`[phase3-policy] ${label} missing required snippets:`);
    for (const snippet of missing) console.error(`- ${snippet}`);
    process.exitCode = 1;
  }
}

const sql = fs.readFileSync('supabase/migrations/0061_policy_engine_lite.sql', 'utf8');
const service = fs.readFileSync('apps/agp-console/lib/console/policy-engine.ts', 'utf8');
const validation = fs.readFileSync('packages/validation/src/org.ts', 'utf8');

assertIncludes('migration', sql, requiredSqlSnippets);
assertIncludes('Console policy service', service, requiredServiceSnippets);
assertIncludes('shared validation vocabulary', validation, requiredValidationSnippets);

const duplicateAuthorityMemberClause = /or public\.agp_is_authority_member\(authority_id\)\s+or public\.agp_is_authority_member\(authority_id\)/;
if (duplicateAuthorityMemberClause.test(sql)) {
  console.error('[phase3-policy] migration has duplicate agp_is_authority_member read clauses.');
  process.exitCode = 1;
}

if (!process.exitCode) {
  console.log('[phase3-policy] migration, service, and shared vocabulary contract OK');
}
