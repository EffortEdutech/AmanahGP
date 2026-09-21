import fs from 'node:fs';

const requiredSqlSnippets = [
  'create table if not exists public.authority_obligations',
  'create table if not exists public.authority_exceptions',
  'agp_upsert_obligation_for_submission',
  'agp_upsert_exception_for_submission',
  'agp_upsert_exception_for_trust_event',
  'agp_upsert_exception_for_governance_case',
  'agp_sync_submission_obligations_and_exceptions',
  'alter table public.authority_obligations force row level security',
  'alter table public.authority_exceptions force row level security',
  'public.agp_can_access_pilot_organization',
];

const requiredObligationService = [
  'export async function listAuthorityObligations',
  'export async function getAuthorityObligationSummary',
  'authority_obligations',
  'urgent_high',
];

const requiredExceptionService = [
  'export async function listAuthorityExceptions',
  'export async function getAuthorityExceptionSummary',
  'authority_exceptions',
  'high_critical',
];

function assertIncludes(label, text, snippets) {
  const missing = snippets.filter((snippet) => !text.includes(snippet));
  if (missing.length) {
    console.error(`[phase5-obligations] ${label} missing required snippets:`);
    for (const snippet of missing) console.error(`- ${snippet}`);
    process.exitCode = 1;
  }
}

const sql = fs.readFileSync('supabase/migrations/0063_obligations_exceptions.sql', 'utf8');
const obligations = fs.readFileSync('apps/agp-console/lib/console/authority-obligations.ts', 'utf8');
const exceptions = fs.readFileSync('apps/agp-console/lib/console/authority-exceptions.ts', 'utf8');

assertIncludes('migration', sql, requiredSqlSnippets);
assertIncludes('obligation service', obligations, requiredObligationService);
assertIncludes('exception service', exceptions, requiredExceptionService);

const forbiddenAuthorityCoupling = /create policy[\s\S]+on public\.(payment_requests|bank_reconciliations|journal_entries|journal_lines)/;
if (forbiddenAuthorityCoupling.test(sql)) {
  console.error('[phase5-obligations] migration must not add authority policies to private finance tables.');
  process.exitCode = 1;
}

if (!sql.includes('Negative trust events produce exception summaries only')) {
  console.error('[phase5-obligations] migration must document summary-only trust event exception behavior.');
  process.exitCode = 1;
}

if (!process.exitCode) {
  console.log('[phase5-obligations] obligations/exceptions migration and Console services contract OK');
}
