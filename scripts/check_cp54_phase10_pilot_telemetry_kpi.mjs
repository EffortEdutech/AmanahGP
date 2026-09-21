import fs from 'node:fs';

const sql = fs.readFileSync('supabase/migrations/0067_pilot_telemetry.sql', 'utf8');
const service = fs.readFileSync('apps/agp-console/lib/console/authority-telemetry.ts', 'utf8');
const page = fs.readFileSync('apps/agp-console/app/(console)/authority/reports/page.tsx', 'utf8');
const checklist = fs.readFileSync('docs/AGP_MAIN_JAIN_CODEBASE_POLISH_CHECKLIST.md', 'utf8');

const requiredSql = [
  'create table if not exists public.pilot_metric_events',
  'create table if not exists public.pilot_feedback',
  'create table if not exists public.pilot_support_incidents',
  'create table if not exists public.pilot_kpi_snapshots',
  'agp_record_pilot_metric_event',
  'agp_refresh_pilot_kpi_snapshot',
  'pilot_metric_events_select_scoped',
  'pilot_feedback_select_scoped',
  'pilot_support_incidents_select_scoped',
  'pilot_kpi_snapshots_select_scoped',
  'summary_only_pilot_kpi',
  'This migration intentionally adds no authority policy to private finance, bank, payment, document, or raw evidence tables',
];

const requiredService = [
  'export async function listPilotKpiSnapshots',
  'export async function listPilotFeedback',
  'export async function listPilotSupportIncidents',
  'export async function getPilotKpiSummary',
  'pilot_kpi_snapshots',
  'pilot_feedback',
  'pilot_support_incidents',
];

const requiredPage = [
  'Pilot KPI snapshots',
  'Recent feedback',
  'Support incidents',
  'getPilotKpiSummary',
  'listPilotKpiSnapshots',
  'summary-only',
];

function assertIncludes(label, text, snippets) {
  const missing = snippets.filter((snippet) => !text.includes(snippet));
  if (missing.length) {
    console.error(`[phase10-telemetry] ${label} missing required snippets:`);
    for (const snippet of missing) console.error(`- ${snippet}`);
    process.exitCode = 1;
  }
}

assertIncludes('migration', sql, requiredSql);
assertIncludes('service', service, requiredService);
assertIncludes('reports page', page, requiredPage);

for (const privateTable of ['journal_lines', 'fund_period_closes', 'bank_reconciliations', 'bank_accounts', 'payment_requests', 'evidence_files', 'org_documents']) {
  const pattern = new RegExp(`create policy[\\s\\S]+on public\\.${privateTable}`);
  if (pattern.test(sql)) {
    console.error(`[phase10-telemetry] migration must not add authority policies to ${privateTable}.`);
    process.exitCode = 1;
  }
}

if (!checklist.includes('Phase 10 - Pilot Telemetry And KPI') || !checklist.includes('0067_pilot_telemetry.sql')) {
  console.error('[phase10-telemetry] checklist must mention Phase 10 and migration 0067.');
  process.exitCode = 1;
}

if (!process.exitCode) {
  console.log('[phase10-telemetry] pilot telemetry and KPI contract OK');
}
