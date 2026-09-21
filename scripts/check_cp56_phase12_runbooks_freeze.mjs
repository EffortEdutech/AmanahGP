import fs from 'node:fs';

const requiredDocs = new Map([
  ['docs/pilot-main-jain/STATE_POLICY_CONFIGURATION_GUIDE.md', ['policy_sets', 'policy_versions', 'policy_rules', 'Authority View', 'must not grant']],
  ['docs/pilot-main-jain/AUTHORITY_USER_ONBOARDING.md', ['authority_members', 'authority_jurisdiction_assignments', 'not super-admin access', 'Negative Checks']],
  ['docs/pilot-main-jain/MOSQUE_SURAU_PILOT_ONBOARDING.md', ['pilot_cohort_organizations', 'AmanahOS', 'organisation-private', 'Evidence boundary']],
  ['docs/pilot-main-jain/SUBMISSION_REVIEW_RUNBOOK.md', ['regulatory_submissions', 'changes requested', 'Evidence Boundary', 'evidence_files', 'payment_requests']],
  ['docs/pilot-main-jain/ACCESS_REVOCATION_INCIDENT_RUNBOOK.md', ['Immediate Revocation', 'authority_members.status', 'cross-jurisdiction', 'service-role']],
  ['docs/pilot-main-jain/PILOT_KPI_DEFINITION_SHEET.md', ['MAIN-PILOT-2026-Q3', 'pilot_kpi_snapshots', 'pilot_metric_events', 'summary']],
  ['docs/pilot-main-jain/PILOT_FREEZE_CHECKLIST.md', ['Freeze Criteria', '0059', '0067', 'check_cp55_phase11_pilot_fixtures_e2e', 'Graphify']],
]);

const requiredPhaseScripts = [
  'scripts/check_cp47_phase3_policy_engine_lite.mjs',
  'scripts/check_cp48_phase4_regulatory_submissions.mjs',
  'scripts/check_cp49_phase5_obligations_exceptions.mjs',
  'scripts/check_cp50_phase6_approval_delegation_engine.mjs',
  'scripts/check_cp51_phase7_evidence_authority_boundary.mjs',
  'scripts/check_cp52_phase8_authority_view_mvp.mjs',
  'scripts/check_cp53_phase9_state_reporting_pack.mjs',
  'scripts/check_cp54_phase10_pilot_telemetry_kpi.mjs',
  'scripts/check_cp55_phase11_pilot_fixtures_e2e.mjs',
];

const requiredMigrations = [
  'supabase/migrations/0059_authority_domain.sql',
  'supabase/migrations/0060_authority_rls.sql',
  'supabase/migrations/0061_policy_engine_lite.sql',
  'supabase/migrations/0062_regulatory_submissions.sql',
  'supabase/migrations/0063_obligations_exceptions.sql',
  'supabase/migrations/0064_approval_delegation_engine.sql',
  'supabase/migrations/0065_evidence_authority_boundary.sql',
  'supabase/migrations/0066_state_reporting_pack.sql',
  'supabase/migrations/0067_pilot_telemetry.sql',
  'supabase/seed_authority_pilot.sql',
];

function fail(message) {
  console.error(`[phase12-freeze] ${message}`);
  process.exitCode = 1;
}

for (const [file, snippets] of requiredDocs) {
  if (!fs.existsSync(file)) {
    fail(`missing runbook: ${file}`);
    continue;
  }
  const text = fs.readFileSync(file, 'utf8');
  if (text.trim().length < 500) fail(`runbook is too thin or empty: ${file}`);
  const missing = snippets.filter((snippet) => !text.includes(snippet));
  if (missing.length) fail(`${file} missing snippets: ${missing.join(', ')}`);
}

for (const file of requiredPhaseScripts) {
  if (!fs.existsSync(file)) fail(`missing phase check script: ${file}`);
}

for (const file of requiredMigrations) {
  if (!fs.existsSync(file)) fail(`missing migration/seed: ${file}`);
}

const checklist = fs.readFileSync('docs/AGP_MAIN_JAIN_CODEBASE_POLISH_CHECKLIST.md', 'utf8');
for (const snippet of [
  'Phase 12 - Runbooks And Freeze',
  'state policy configuration guide',
  'authority user onboarding guide',
  'pilot KPI definition sheet',
  'Run full pilot freeze checks',
]) {
  if (!checklist.includes(snippet)) fail(`checklist missing Phase 12 snippet: ${snippet}`);
}

if (!process.exitCode) {
  console.log('[phase12-freeze] runbooks and pilot freeze contract OK');
}
