import fs from 'node:fs';

const sql = fs.readFileSync('supabase/migrations/0066_state_reporting_pack.sql', 'utf8');
const service = fs.readFileSync('apps/agp-console/lib/console/authority-report-packs.ts', 'utf8');
const page = fs.readFileSync('apps/agp-console/app/(console)/authority/reports/page.tsx', 'utf8');
const checklist = fs.readFileSync('docs/AGP_MAIN_JAIN_CODEBASE_POLISH_CHECKLIST.md', 'utf8');

const requiredSql = [
  'create table if not exists public.authority_state_report_packs',
  'create table if not exists public.authority_state_report_lines',
  'agp_refresh_state_report_pack',
  'receipts_expenditure',
  'bank_reconciliation',
  'fund_balance',
  'exception_summary',
  'evidence_index',
  'reconciliation_check',
  'summary_only_no_authority_ledger_access',
  'This migration intentionally adds no authority policy to journal_lines, fund_period_closes, bank_reconciliations, bank_accounts, payment_requests, evidence_files, or org_documents',
];

const requiredService = [
  'export async function listAuthorityStateReportPacks',
  'export async function listAuthorityStateReportLines',
  'export async function getAuthorityStateReportSummary',
  'authority_state_report_packs',
  'authority_state_report_lines',
];

const requiredPage = [
  'Monthly receipts / expenditure',
  'Bank reconciliation summary',
  'Fund balance summary',
  'Evidence index',
  'Source private accounting tables remain protected',
];

function assertIncludes(label, text, snippets) {
  const missing = snippets.filter((snippet) => !text.includes(snippet));
  if (missing.length) {
    console.error(`[phase9-state-reporting] ${label} missing required snippets:`);
    for (const snippet of missing) console.error(`- ${snippet}`);
    process.exitCode = 1;
  }
}

assertIncludes('migration', sql, requiredSql);
assertIncludes('service', service, requiredService);
assertIncludes('reports page', page, requiredPage);

for (const privateTable of ['journal_lines', 'fund_period_closes', 'bank_reconciliations', 'bank_accounts', 'payment_requests']) {
  const pattern = new RegExp(`create policy[\\s\\S]+on public\\.${privateTable}`);
  if (pattern.test(sql)) {
    console.error(`[phase9-state-reporting] migration must not add authority policies to ${privateTable}.`);
    process.exitCode = 1;
  }
}

if (!checklist.includes('Phase 9 - State Reporting Pack') || !checklist.includes('0066_state_reporting_pack.sql')) {
  console.error('[phase9-state-reporting] checklist must mention Phase 9 and migration 0066.');
  process.exitCode = 1;
}

if (!process.exitCode) {
  console.log('[phase9-state-reporting] state reporting pack contract OK');
}
