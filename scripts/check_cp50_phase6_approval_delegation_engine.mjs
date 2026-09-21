import fs from 'node:fs';

const requiredSqlSnippets = [
  'create table if not exists public.approval_policies',
  'create table if not exists public.approval_policy_steps',
  'create table if not exists public.approval_instances',
  'create table if not exists public.approval_actions',
  'create table if not exists public.approval_delegations',
  'agp_assert_payment_approval_allowed',
  'approval_instances_no_self_approval',
  'approval_instances_distinct_review_approval',
  'agp_upsert_payment_approval_instance',
  'PAYMENT_REQUEST_DEFAULT',
  "'policy_violation'",
];

const requiredApiSnippets = [
  'agp_assert_payment_approval_allowed',
  'agp_record_payment_approval_action',
  "p_action_type: 'approved'",
];

const requiredServiceSnippets = [
  'export async function listAuthorityApprovals',
  'export async function getAuthorityApprovalSummary',
  'approval_instances',
  'block_self_approval',
];

function assertIncludes(label, text, snippets) {
  const missing = snippets.filter((snippet) => !text.includes(snippet));
  if (missing.length) {
    console.error(`[phase6-approvals] ${label} missing required snippets:`);
    for (const snippet of missing) console.error(`- ${snippet}`);
    process.exitCode = 1;
  }
}

const sql = fs.readFileSync('supabase/migrations/0064_approval_delegation_engine.sql', 'utf8');
const api = fs.readFileSync('apps/org/app/api/accounting/payment-requests/route.ts', 'utf8');
const service = fs.readFileSync('apps/agp-console/lib/console/authority-approvals.ts', 'utf8');

assertIncludes('migration', sql, requiredSqlSnippets);
assertIncludes('payment API integration', api, requiredApiSnippets);
assertIncludes('Console approval service', service, requiredServiceSnippets);

if (/create policy[\s\S]+on public\.payment_requests/.test(sql)) {
  console.error('[phase6-approvals] migration must not add authority policies to payment_requests.');
  process.exitCode = 1;
}

if (!sql.includes('Existing payment_requests remain private')) {
  console.error('[phase6-approvals] migration must document private payment_requests boundary.');
  process.exitCode = 1;
}

if (!process.exitCode) {
  console.log('[phase6-approvals] approval policy/instance/action contract OK');
}
