import fs from 'node:fs';

const requiredSqlSnippets = [
  'create table if not exists public.regulatory_submissions',
  'create table if not exists public.regulatory_submission_events',
  'create table if not exists public.regulatory_submission_reviews',
  'agp_upsert_regulatory_submission_for_project_report',
  'agp_submission_late_status',
  'regulatory_submissions_source_unique',
  'alter table public.regulatory_submissions force row level security',
  'regulatory_submissions_select_scoped',
  'public.agp_can_access_pilot_organization',
];

const requiredServiceSnippets = [
  'export async function listRegulatorySubmissions',
  'export async function getRegulatorySubmissionSummary',
  'frozen_source',
  'late_or_overdue',
];

const requiredApiSnippets = [
  'agp_upsert_regulatory_submission_for_project_report',
  'p_project_report_id',
  'p_actor_user_id',
];

function assertIncludes(label, text, snippets) {
  const missing = snippets.filter((snippet) => !text.includes(snippet));
  if (missing.length) {
    console.error(`[phase4-submissions] ${label} missing required snippets:`);
    for (const snippet of missing) console.error(`- ${snippet}`);
    process.exitCode = 1;
  }
}

const sql = fs.readFileSync('supabase/migrations/0062_regulatory_submissions.sql', 'utf8');
const service = fs.readFileSync('apps/agp-console/lib/console/authority-submissions.ts', 'utf8');
const submitRoute = fs.readFileSync('apps/org/app/api/reports/submit/route.ts', 'utf8');
const createRoute = fs.readFileSync('apps/org/app/api/reports/route.ts', 'utf8');

assertIncludes('migration', sql, requiredSqlSnippets);
assertIncludes('Console submission service', service, requiredServiceSnippets);
assertIncludes('resubmit API route', submitRoute, requiredApiSnippets);
assertIncludes('create report API route', createRoute, requiredApiSnippets);

if (sql.includes('payment_requests') || sql.includes('bank_reconciliations') || sql.includes('ledger_entries')) {
  console.error('[phase4-submissions] migration should not grant or couple to private financial tables.');
  process.exitCode = 1;
}

if (!process.exitCode) {
  console.log('[phase4-submissions] regulatory submission migration, API wrapper, and Console service contract OK');
}
