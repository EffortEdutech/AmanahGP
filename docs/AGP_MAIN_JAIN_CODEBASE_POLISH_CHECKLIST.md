# AGP MAIN/JAIN Codebase Polish Checklist

**Purpose:** Living implementation checklist for MAIN/JAIN pilot readiness.
**Started:** 20 September 2026
**Source plan:** `docs/AGP_MAIN_JAIN_CODEBASE_POLISH_EXECUTION_PLAN_v1.md`

## Status Legend

- `[ ]` Not started
- `[~]` In progress
- `[x]` Done
- `[!]` Blocked / needs decision

## Phase 0 - Baseline Verify

- `[x]` Read root `AGENTS.md`.
- `[x]` Read root `CLAUDE.md`.
- `[x]` Read `apps/agp-console/AGENTS.md`.
- `[x]` Read `docs/AGP_MAIN_JAIN_CODEBASE_POLISH_EXECUTION_PLAN_v1.md`.
- `[x]` Query Graphify for authority, access, trust event, governance case, and AmanahOS relationship discovery.
- `[x]` Read `docs/ARCHITECTURE_MAP.md`.
- `[x]` Read `docs/AI_WORKSPACE_CONTEXT.md`.
- `[x]` Read `apps/agp-console/README.md`.
- `[x]` Inspect current Console access and permission model.
- `[x]` Inspect current Console navigation and shell.
- `[x]` Inspect current governance case services and tables.
- `[x]` Inspect current AmanahOS access model.
- `[x]` Inspect current accounting/payment request flow.
- `[x]` Inspect current report submission/evidence flow.
- `[x]` Inspect current trust event emission/intake flow.
- `[x]` Inspect latest Supabase migrations and canonical table naming.
- `[x]` Confirm `organizations` vs `organisations` split before new authority schema.
- `[x]` Confirm reusable governance tables for Authority View.
- `[x]` Confirm wired check commands.
- `[x]` Run baseline checks.
- `[x]` Refresh Graphify after meaningful code structure changes.

## Phase 1 - Authority Domain Migration

- `[x]` Design additive migration `0059_authority_domain.sql`.
- `[x]` Add `authorities`.
- `[x]` Add `jurisdictions`.
- `[x]` Add `authority_members`.
- `[x]` Add `authority_jurisdiction_assignments`.
- `[x]` Add `pilot_cohorts`.
- `[x]` Add `pilot_cohort_organizations`.
- `[x]` Add indexes and comments.
- `[x]` Add verification queries.
- `[x]` Update shared validation/types where required.
- `[x]` Add Console authority access helper.
- `[x]` Run targeted checks.

## Phase 2 - Security Gate And RLS

- `[x]` Design additive migration `0060_authority_rls.sql`.
- `[x]` Enable/default-deny authority table RLS.
- `[x]` Add jurisdiction-scoped read policies.
- `[x]` Add membership active-status enforcement.
- `[x]` Add cross-jurisdiction denial verification queries.
- `[x]` Add removed-member denial verification queries.
- `[x]` Add public/anon denial verification queries.
- `[x]` Run targeted checks.

## Phase 3 - Policy Engine Lite

- `[x]` Design migration `0061_policy_engine_lite.sql`.
- `[x]` Add policy set/version/rule/effective-period tables.
- `[x]` Add overlap/effective-date constraints.
- `[x]` Add policy read service.
- `[x]` Add policy validation tests.

## Phase 4 - Regulatory Submissions

- `[x]` Design migration `0062_regulatory_submissions.sql`.
- `[x]` Add submission lifecycle tables.
- `[x]` Integrate AmanahOS report submission.
- `[x]` Add Console submission monitor service.
- `[x]` Add lifecycle tests.

## Phase 5 - Obligations And Exceptions

- `[x]` Design migration `0063_obligations_exceptions.sql`.
- `[x]` Add obligation and exception tables.
- `[x]` Integrate trust events, bank reconciliation, payment requests, and governance cases.
- `[x]` Add exception queue tests.

## Phase 6 - Approval And Delegation Engine

- `[x]` Design migration `0064_approval_delegation_engine.sql`.
- `[x]` Add approval policy/instance/action tables.
- `[x]` Integrate existing `payment_requests`.
- `[x]` Block self-approval by policy.
- `[x]` Add threshold and segregation tests.

## Phase 7 - Evidence Boundary

- `[x]` Design migration `0065_evidence_authority_boundary.sql`.
- `[x]` Add evidence visibility/link/access-log model.
- `[x]` Keep organisation-private evidence private by default.
- `[x]` Add linked-evidence access tests.

## Phase 8 - Authority View MVP

- `[x]` Add Authority View navigation.
- `[x]` Add dashboard route.
- `[x]` Add organisation registry/profile routes.
- `[x]` Add submission monitor route.
- `[x]` Add obligation monitor route.
- `[x]` Add exception centre route.
- `[x]` Reuse governance case workspace.
- `[x]` Add evidence viewer.
- `[x]` Add corrective action tracker.
- `[x]` Add reports/export page.
- `[x]` Add activity/audit page.
- `[x]` Run 14 MVP acceptance scenarios.

## Phase 9 - State Reporting Pack

- `[x]` Add report pack service.
- `[x]` Include monthly receipts/expenditure statement.
- `[x]` Include bank reconciliation summary.
- `[x]` Include fund balance summary.
- `[x]` Include exception summary.
- `[x]` Include evidence index.
- `[x]` Verify report totals reconcile to source data.

## Phase 10 - Pilot Telemetry And KPI

- `[x]` Design migration `0067_pilot_telemetry.sql`.
- `[x]` Add pilot metric events.
- `[x]` Add pilot feedback/support incident capture.
- `[x]` Add scoped pilot KPI report.

## Phase 11 - Pilot Fixtures And E2E

- `[x]` Add deterministic authority pilot seed.
- `[x]` Add pilot smoke script.
- `[x]` Cover all 14 Authority View MVP scenarios.

## Phase 12 - Runbooks And Freeze

- `[x]` Add state policy configuration guide.
- `[x]` Add authority user onboarding guide.
- `[x]` Add mosque/surau pilot onboarding guide.
- `[x]` Add submission review runbook.
- `[x]` Add access revocation/incident runbook.
- `[x]` Add pilot KPI definition sheet.
- `[x]` Run full pilot freeze checks.
- `[x]` Refresh Graphify.

## Running Notes

- 2026-09-20: Started checklist and Phase 0 verification.
- 2026-09-20: Graphify query identified Console access, Console server services, review/workbench/escalation modules, AmanahOS access, accounting actions, and trust-event actions as primary code navigation anchors.
- 2026-09-20: Baseline confirmed current Console app uses canonical `public.organizations`, while old app-local Console migrations still include legacy `public.organisations`. New authority work must target `public.organizations`.
- 2026-09-20: Baseline confirmed Authority View should reuse current governance tables referenced by app code and schema dumps: `governance_review_cases`, assignments, findings, evidence, clarifications, decisions, action items, action updates, recommendations, and `governance_event_intake`.
- 2026-09-20: Baseline confirmed AmanahOS report submission updates `project_reports` and emits `trust_events`; future regulatory submissions should wrap/freeze those reports rather than replace them.
- 2026-09-20: Baseline confirmed evidence is already private by default. `evidence_files` supports `private`, `reviewer_only`, `public`; `org_documents` supports `private`, `public`. Authority-reviewable evidence still needs an explicit linked boundary in a later phase.
- 2026-09-20: Added `supabase/migrations/0059_authority_domain.sql` with authority, jurisdiction, authority member, jurisdiction assignment, pilot cohort, and cohort organisation tables. RLS is enabled and forced, with no broad read policy yet.
- 2026-09-20: Added shared authority vocabulary in `packages/validation/src/org.ts` and Console authority permission constants in `apps/agp-console/lib/console/constants.ts`.
- 2026-09-20: Added `apps/agp-console/lib/console/authority-access.ts` as the future single resolver for authority memberships, scopes, and role-derived permissions.
- 2026-09-20: Verification passed: `pnpm -C apps/agp-console build`.
- 2026-09-20: Verification passed: `pnpm typecheck`.
- 2026-09-20: Verification blocked: `pnpm lint` fails before file linting due existing ESLint circular config error in `apps/agp-console` (`react` plugin config cycle). Not introduced by authority changes.
- 2026-09-20: Graphify refreshed with `./scripts/graphify.ps1 update .`; output updated `graphify-out/graph.json`, `graphify-out/graph.html`, and `graphify-out/GRAPH_REPORT.md` with 4187 nodes and 6307 edges. Existing warning: `apps/user/tsconfig.json` has UTF-8 BOM parse warning.
- 2026-09-20: Added `supabase/migrations/0060_authority_rls.sql` with authority membership/scope helper functions, scoped authority-table policies, and a narrow `organizations` metadata read policy for assigned pilot organisations only.
- 2026-09-20: Phase 2 deliberately does not grant authority access to ledgers, payment requests, bank reconciliations, org members, private documents, or evidence files.
- 2026-09-20: Phase 2 verification passed: `pnpm -C apps/agp-console build`.
- 2026-09-20: Phase 2 verification passed: `pnpm typecheck`.
- 2026-09-20: Started Phase 3 Policy Engine Lite. Added draft migration shape for policy sets, versions, rules, effective periods, and rule exceptions; added Console policy read service skeleton and shared policy rule category vocabulary.


- 2026-09-20: Phase 3 verification added `scripts/check_cp47_phase3_policy_engine_lite.mjs` to assert policy migration/service/vocabulary contract, overlap trigger presence, active-policy resolver, and RLS policy anchors.

- 2026-09-20: Graphify refreshed after Phase 3 with 4210 nodes, 6338 edges, and 492 communities. Existing warning remains: `apps/user/tsconfig.json` has UTF-8 BOM parse warning.

- 2026-09-20: Started Phase 4 Regulatory Submissions. Added `0062_regulatory_submissions.sql`, regulatory submission/event/review lifecycle tables, project report wrapper RPC, Console submission monitor service, and report submission API integration.

- 2026-09-20: Phase 4 verification added `scripts/check_cp48_phase4_regulatory_submissions.mjs` to assert regulatory submission lifecycle tables, wrapper RPC, scoped RLS anchors, API integration, and Console monitor service.

- 2026-09-20: Graphify refreshed after Phase 4 with 4229 nodes, 6362 edges, and 493 communities. Existing warning remains: `apps/user/tsconfig.json` has UTF-8 BOM parse warning.

- 2026-09-20: Started Phase 5 Obligations And Exceptions. Added `0063_obligations_exceptions.sql`, authority obligation and exception queues, derivation helpers for submissions/trust events/governance cases, and Console monitor services. Financial/payment/reconciliation integration is via trust-event summaries and source references only.

- 2026-09-20: Phase 5 verification added `scripts/check_cp49_phase5_obligations_exceptions.mjs` to assert obligation/exception tables, derivation RPCs, scoped RLS anchors, summary-only financial signal handling, and Console monitor services.

- 2026-09-20: Graphify refreshed after Phase 5 with 4255 nodes, 6399 edges, and 483 communities. Existing warning remains: `apps/user/tsconfig.json` has UTF-8 BOM parse warning.

- 2026-09-20: Started Phase 6 Approval And Delegation Engine. Added `0064_approval_delegation_engine.sql`, approval policies, policy steps, approval instances, actions, delegation registry, payment request wrapper/guard RPCs, payment API integration, and Console approval service.

- 2026-09-20: Phase 6 verification added `scripts/check_cp50_phase6_approval_delegation_engine.mjs` to assert approval policy/step/instance/action/delegation schema, self-approval guard, payment API action integration, Console approval service, and preserved private `payment_requests` boundary.

- 2026-09-20: Graphify refreshed after Phase 6 with 4272 nodes, 6421 edges, and 497 communities. Existing warning remains: `apps/user/tsconfig.json` has UTF-8 BOM parse warning.

- 2026-09-21: Started Phase 7 Evidence Boundary. Added `0065_evidence_authority_boundary.sql`, authority evidence link/access-log tables, evidence visibility mapping, submission evidence linking/logging RPCs, and Console evidence metadata service. Authority View reads linked metadata only; no direct authority RLS was added to `evidence_files` or `org_documents`.

- 2026-09-21: Completed Phase 8 Authority View MVP route surface. Added `/authority` dashboard plus registry, submissions, obligations, exceptions, cases, evidence, corrective actions, reports, policy, and activity pages. Added sidebar navigation and `scripts/check_cp52_phase8_authority_view_mvp.mjs` to assert the 12-screen route contract and evidence boundary messaging.

- 2026-09-21: Completed Phase 9 State Reporting Pack. Added `0066_state_reporting_pack.sql`, authority state report pack/line tables, summary refresh RPC, Console report-pack service, and upgraded `/authority/reports` with monthly receipts/expenditure, bank reconciliation, fund balance, exception summary, evidence index, and reconciliation-check surfaces. The pack is summary-only and adds no authority policy to private ledger, bank, payment, document, or raw evidence tables.

- 2026-09-21: Completed Phase 10 Pilot Telemetry And KPI. Added `0067_pilot_telemetry.sql` with pilot metric events, pilot feedback, pilot support incidents, and pilot KPI snapshots plus refresh/record RPCs. Added Console telemetry service and upgraded `/authority/reports` with KPI snapshots, feedback, and support incident panels.
- 2026-09-21: Completed Phase 11 Pilot Fixtures And E2E. Added `supabase/seed_authority_pilot.sql` with deterministic MAIN/JAIN authority, jurisdiction, cohort, pilot organisations, submissions, obligations, exceptions, evidence links, state report packs, KPI snapshot, feedback, support incidents, and metric events. Added `scripts/check_cp55_phase11_pilot_fixtures_e2e.mjs` covering the 14 Authority View MVP acceptance scenarios and private-table boundary checks.
- 2026-09-21: Completed Phase 12 Runbooks And Freeze. Added `docs/pilot-main-jain/` operator guides for state policy configuration, authority user onboarding, mosque/surau onboarding, submission review, access revocation/incidents, pilot KPI definitions, and pilot freeze. Added `scripts/check_cp56_phase12_runbooks_freeze.mjs` to assert runbook coverage, prior phase checks, migrations, seed fixtures, and checklist closure.
