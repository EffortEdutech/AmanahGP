import fs from 'node:fs';

const seed = fs.readFileSync('supabase/seed_authority_pilot.sql', 'utf8');
const checklist = fs.readFileSync('docs/AGP_MAIN_JAIN_CODEBASE_POLISH_CHECKLIST.md', 'utf8');

const routeFiles = [
  'apps/agp-console/app/(console)/authority/page.tsx',
  'apps/agp-console/app/(console)/authority/organisations/page.tsx',
  'apps/agp-console/app/(console)/organisations/[orgId]/page.tsx',
  'apps/agp-console/app/(console)/authority/submissions/page.tsx',
  'apps/agp-console/app/(console)/authority/obligations/page.tsx',
  'apps/agp-console/app/(console)/authority/exceptions/page.tsx',
  'apps/agp-console/app/(console)/authority/cases/page.tsx',
  'apps/agp-console/app/(console)/authority/evidence/page.tsx',
  'apps/agp-console/app/(console)/authority/actions/page.tsx',
  'apps/agp-console/app/(console)/authority/reports/page.tsx',
  'apps/agp-console/app/(console)/authority/policy/page.tsx',
  'apps/agp-console/app/(console)/authority/activity/page.tsx',
];

const requiredSeedSnippets = [
  'MAIN-PILOT-2026-Q3',
  'Majlis Agama Islam Negeri Pilot',
  'Selangor MAIN Pilot Jurisdiction',
  'Masjid Nur Al-Amanah',
  'Surau Amanah Bestari',
  'Masjid Hidayah Waqf',
  'insert into public.regulatory_submissions',
  'insert into public.authority_obligations',
  'insert into public.authority_exceptions',
  'insert into public.authority_evidence_links',
  'insert into public.authority_state_report_packs',
  'insert into public.pilot_kpi_snapshots',
  'source_access":"not_granted_by_link',
  'summary_only_no_authority_ledger_access',
  'summary_only_pilot_kpi',
];

const acceptanceScenarios = [
  ['AV-01 Authority Dashboard', ['apps/agp-console/app/(console)/authority/page.tsx', 'MAIN-PILOT-2026-Q3']],
  ['AV-02 Organisation Registry', ['apps/agp-console/app/(console)/authority/organisations/page.tsx', 'Masjid Nur Al-Amanah', 'Surau Amanah Bestari', 'Masjid Hidayah Waqf']],
  ['AV-03 Organisation Oversight Profile', ['apps/agp-console/app/(console)/organisations/[orgId]/page.tsx', 'pilot_cohort_organizations']],
  ['AV-04 Submission Monitor', ['apps/agp-console/app/(console)/authority/submissions/page.tsx', 'regulatory_submissions', 'late', 'overdue']],
  ['AV-05 Obligation Monitor', ['apps/agp-console/app/(console)/authority/obligations/page.tsx', 'authority_obligations', 'satisfied', 'open', 'overdue']],
  ['AV-06 Exception Centre', ['apps/agp-console/app/(console)/authority/exceptions/page.tsx', 'authority_exceptions', 'late_submission', 'overdue_obligation']],
  ['AV-07 Governance Review Case Workspace', ['apps/agp-console/app/(console)/authority/cases/page.tsx']],
  ['AV-08 Evidence Viewer', ['apps/agp-console/app/(console)/authority/evidence/page.tsx', 'authority_evidence_links', 'not_granted_by_link']],
  ['AV-09 Corrective Action Tracker', ['apps/agp-console/app/(console)/authority/actions/page.tsx']],
  ['AV-10 Reports / Exports', ['apps/agp-console/app/(console)/authority/reports/page.tsx', 'authority_state_report_packs', 'totals_reconcile']],
  ['AV-11 Policy & Jurisdiction', ['apps/agp-console/app/(console)/authority/policy/page.tsx', 'authority_jurisdiction_assignments']],
  ['AV-12 Activity / Audit', ['apps/agp-console/app/(console)/authority/activity/page.tsx']],
  ['Negative security boundary', ['not_granted_by_link', 'summary_only_no_authority_ledger_access']],
  ['Pilot KPI telemetry', ['pilot_kpi_snapshots', 'KPI-MAIN-PILOT-2026-08', 'metric_events_total']],
];

function fail(message) {
  console.error(`[phase11-pilot] ${message}`);
  process.exitCode = 1;
}

function assertIncludes(label, text, snippets) {
  const missing = snippets.filter((snippet) => !text.includes(snippet));
  if (missing.length) fail(`${label} missing required snippets: ${missing.join(', ')}`);
}

assertIncludes('seed', seed, requiredSeedSnippets);

for (const file of routeFiles) {
  if (!fs.existsSync(file)) fail(`missing Authority View route: ${file}`);
}

for (const [scenario, snippets] of acceptanceScenarios) {
  const missing = snippets.filter((snippet) => !seed.includes(snippet) && !fs.existsSync(snippet));
  if (missing.length) fail(`${scenario} is not represented by fixtures/routes: ${missing.join(', ')}`);
}

for (const privateTable of ['journal_lines', 'fund_period_closes', 'bank_reconciliations', 'bank_accounts', 'payment_requests', 'evidence_files', 'org_documents']) {
  const insertPattern = new RegExp(`insert\\s+into\\s+public\\.${privateTable}\\b`, 'i');
  const policyPattern = new RegExp(`create\\s+policy[\\s\\S]+on\\s+public\\.${privateTable}\\b`, 'i');
  if (insertPattern.test(seed)) fail(`seed must not insert into private table public.${privateTable}`);
  if (policyPattern.test(seed)) fail(`seed must not create authority policy on private table public.${privateTable}`);
}

if (!checklist.includes('Phase 11 - Pilot Fixtures And E2E') || !checklist.includes('seed_authority_pilot.sql')) {
  fail('checklist must mention Phase 11 and seed_authority_pilot.sql');
}

if (!process.exitCode) {
  console.log('[phase11-pilot] pilot fixtures and acceptance contract OK');
}
