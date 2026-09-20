# AGP MAIN/JAIN Codebase Polish Execution Plan v1.0

**Project:** Amanah Governance Platform (AGP)  
**Purpose:** File-by-file, migration-by-migration, test-by-test execution plan for MAIN/JAIN pilot readiness  
**Date:** 19 September 2026  
**Status:** Codex implementation baseline  

## 1. Baseline Context

This plan converts the MAIN/JAIN strategy and product backlog into concrete codebase work.

Source inputs:

- `Marketing/AGP_JAKIM_MAIN_Compliance_Mapping_Matrix_v1.md`
- `Marketing/AGP_MAIN_JAIN_Pilot_Specification_v1.md`
- `Marketing/AGP_Product_Development_Gap_Backlog_v1.md`
- `Marketing/AGP_Authority_View_Functional_Specification_v1.md`
- ChatGPT conversation: `Strategi Pitch Majlis Agama`

Current implementation foundation to preserve:

- `apps/org` already contains AmanahOS organisation workflows, accounting pages, payment requests, bank reconciliation, period close, reporting, policy kit, evidence upload, and organisation-scoped access.
- `apps/agp-console` already contains console auth, platform roles, organisation lifecycle, governance review cases, assignments, findings, evidence, decisions, clarifications, publication command, trust events, audit log, review queues, and production readiness.
- `supabase/migrations` already contains the canonical operational schema: `organizations`, `org_members`, `audit_logs`, `org_documents`, `financial_snapshots`, `bank_accounts`, `bank_reconciliations`, `payment_requests`, `trust_events`, and governance case tables.
- `packages/validation` already contains shared validation surfaces for organisation/report/auth data.

Architectural rule:

> MAIN/JAIN Authority View must extend the existing AGP Console governance layer. It must not become a super-admin skin, and it must not weaken AmanahOS organisation privacy boundaries.

## 2. Pilot Scope

This plan only covers P0 and pilot-critical P1 work.

In scope for pilot readiness:

- GAP-01 Jurisdiction & State Policy Engine
- GAP-02 Authority Identity, Scope & Access
- GAP-03 Authority View / Oversight Workspace
- GAP-04 Regulatory Submission Register
- GAP-05 Configurable Approval & Delegation Engine
- GAP-06 State Reporting Pack Generator
- GAP-07 Exception & Obligation Engine
- GAP-08 Evidence / Document Authority Boundary
- GAP-09 Pilot Telemetry & KPI Baseline
- GAP-20 Audit / Inspection Pack, pilot minimum
- GAP-21 Security, RLS & Audit Hardening
- GAP-22 Pilot Data Seeding & Test Fixtures
- GAP-23 Documentation & Operator Runbooks

Out of scope until pilot scope is explicitly expanded:

- Petty cash/PWR full module
- Cheque and physical custody registers
- Investment register
- Asset disposal workflow
- Full statewide rollout features
- Direct JAKIM production access
- Public disclosure of authority review data
- CTCF/Amanah Index as a pilot blocker

## 3. Execution Sequence

Codex should execute in this order. Do not start UI-first implementation before the authority domain and RLS/security gate are in place.

### Phase 0 - Baseline Verify

Goal: prove current repo shape before changing schema.

Read and verify:

- `AGENTS.md`
- `CLAUDE.md`
- `docs/ARCHITECTURE_MAP.md`
- `docs/AI_WORKSPACE_CONTEXT.md`
- `apps/agp-console/AGENTS.md`
- `apps/agp-console/README.md`
- `apps/agp-console/lib/console/access.ts`
- `apps/agp-console/lib/console/server.ts`
- `apps/agp-console/lib/console/navigation.ts`
- `apps/org/lib/access/amanahos-access.ts`
- `apps/org/lib/accounting-actions.ts`
- `apps/org/lib/trust-event-actions.ts`
- `supabase/migrations/0022_accounting_full.sql`
- `supabase/migrations/0023_trust_event_engine.sql`
- latest root Supabase migration files

Deliverables:

- Confirm canonical table naming. Prefer root `public.organizations` model used by AmanahOS and current AGP Console.
- Identify any remaining `organisations` vs `organizations` split before adding authority schema.
- List exact existing governance tables to reuse.
- Confirm current test/check commands that are actually wired in each package.

Verification:

- `pnpm typecheck`
- `pnpm lint`

### Phase 1 - Authority Domain Migration

Goal: add explicit authority and jurisdiction entities without changing existing organisation ownership.

Migration:

- Add `supabase/migrations/0059_authority_domain.sql`.

Tables:

- `authorities`
- `jurisdictions`
- `authority_members`
- `authority_jurisdiction_assignments`
- `pilot_cohorts`
- `pilot_cohort_organizations`

Key requirements:

- `authorities` represent MAIN/JAIN or other oversight bodies.
- `jurisdictions` represent state/district/zone scope.
- `authority_members` link an auth/public user to an authority role.
- `authority_jurisdiction_assignments` define exactly what jurisdiction the member can see.
- `pilot_cohort_organizations` maps selected 3-5 mosque/surau organisations into the pilot.
- Do not grant authority users automatic access to source accounting records.

Likely files:

- `supabase/migrations/0059_authority_domain.sql`
- `packages/validation/src/org.ts`
- `packages/validation/src/auth.ts`
- `apps/agp-console/lib/console/access.ts`
- new `apps/agp-console/lib/console/authority-access.ts`
- new `apps/agp-console/lib/console/authority-domain.ts`

Tests/checks:

- SQL verification queries proving one authority member sees only assigned pilot organisations.
- TypeScript checks for new role/permission constants.

### Phase 2 - Security Gate And RLS

Goal: enforce jurisdiction access at the database layer before UI exists.

Migration:

- Add `supabase/migrations/0060_authority_rls.sql`.

RLS/security requirements:

- Default deny for authority tables.
- Authority members can read only assigned authority/jurisdiction/cohort rows.
- Authority users cannot read cross-jurisdiction organisation metadata.
- Removed/inactive authority members lose access.
- Platform owner/admin access remains audited and explicit.
- No browser code uses service-role keys.

Likely files:

- `supabase/migrations/0060_authority_rls.sql`
- `apps/agp-console/lib/console/authority-access.ts`
- `apps/agp-console/lib/console/access.ts`

Tests/checks:

- SQL negative tests for cross-jurisdiction denial.
- SQL negative tests for removed authority member.
- SQL negative tests for public/anon access.
- `pnpm typecheck`

Gate:

> Do not proceed to Authority View UI until this phase passes.

### Phase 3 - Policy Engine Lite

Goal: make MAIN/JAIN rules data-driven and versioned.

Migration:

- Add `supabase/migrations/0061_policy_engine_lite.sql`.

Tables:

- `policy_sets`
- `policy_versions`
- `policy_rules`
- `policy_effective_periods`
- `policy_exceptions`

Minimum rule categories:

- reporting due dates
- approval thresholds
- bank reconciliation requirements
- required evidence
- escalation thresholds
- corrective action due periods

Likely files:

- `apps/agp-console/lib/console/policy-engine.ts`
- `apps/agp-console/app/(console)/authority/policy/page.tsx`
- `apps/agp-console/components/authority/policy-version-table.tsx`
- `packages/validation/src/org.ts`

Acceptance tests:

- State A and State B can have different due dates.
- Future policy version affects future obligations only.
- Historic submission retains old policy version.
- Overlapping active policy versions are rejected.

### Phase 4 - Regulatory Submission Domain

Goal: create first-class monthly/annual submission lifecycle from AmanahOS to Authority View.

Migration:

- Add `supabase/migrations/0062_regulatory_submissions.sql`.

Tables:

- `regulatory_submissions`
- `regulatory_submission_items`
- `regulatory_submission_status_events`

Lifecycle:

```text
draft -> submitted -> received -> under_review -> accepted
                              |-> changes_requested -> resubmitted
                              |-> rejected / withdrawn where policy permits
```

Likely files:

- `apps/org/app/api/reports/submit/route.ts`
- `apps/org/components/reports/report-actions.tsx`
- `apps/org/app/(protected)/reports/[id]/page.tsx`
- new `apps/org/lib/regulatory-submission-actions.ts`
- new `apps/agp-console/lib/console/authority-submissions.ts`
- new `apps/agp-console/app/(console)/authority/submissions/page.tsx`
- new `apps/agp-console/components/authority/submission-monitor-table.tsx`

Acceptance tests:

- Organisation can submit a monthly report.
- Submission stores report/document snapshot references.
- Authority can acknowledge without mutating source report.
- Changes requested creates a new response cycle without deleting history.
- Late status derives from policy.

### Phase 5 - Obligation And Exception Engine

Goal: generate authority-visible obligations and exceptions from policy plus source data.

Migration:

- Add `supabase/migrations/0063_obligations_exceptions.sql`.

Tables:

- `compliance_obligations`
- `obligation_instances`
- `exception_events`

Pilot exception types:

- overdue submission
- unreconciled bank account
- bank discrepancy
- missing evidence
- self-approval attempt
- approval overdue
- fund restriction exception
- corrective action overdue

Likely files:

- `apps/agp-console/lib/console/authority-obligations.ts`
- `apps/agp-console/lib/console/authority-exceptions.ts`
- `apps/agp-console/app/(console)/authority/obligations/page.tsx`
- `apps/agp-console/app/(console)/authority/exceptions/page.tsx`
- `apps/agp-console/components/authority/obligation-monitor-table.tsx`
- `apps/agp-console/components/authority/exception-centre-table.tsx`

Integration points:

- `trust_events`
- `bank_reconciliations`
- `payment_requests`
- `governance_review_cases`

Acceptance tests:

- Overdue submission appears in exception queue.
- Bank discrepancy creates exception.
- Self-approval test creates governance exception.
- Closing exception preserves history.
- Dashboard counts equal detail rows.

### Phase 6 - Approval And Delegation Engine

Goal: extend current `payment_requests` review/approval into policy-driven approval instances.

Migration:

- Add `supabase/migrations/0064_approval_delegation_engine.sql`.

Tables:

- `approval_policies`
- `approval_policy_steps`
- `approval_instances`
- `approval_actions`
- `office_holders`
- `office_holder_assignments`

Likely files:

- `apps/org/lib/accounting-actions.ts`
- `apps/org/components/accounting/payment-request-actions.tsx`
- `apps/org/app/api/accounting/payment-requests/route.ts`
- `apps/agp-console/lib/console/authority-exceptions.ts`
- `packages/validation/src/report.ts`

Rules:

- Do not duplicate `payment_requests`.
- Link approval instances back to `payment_requests`.
- Store policy version used at approval time.
- Block self-approval.
- Support multi-step approval for configured thresholds.

Acceptance tests:

- RM thresholds are loaded from policy data, not hard-coded.
- Creator cannot approve own payment where segregation is required.
- Amount crossing threshold creates the configured approval steps.
- Authority escalation threshold creates authority-visible event/exception.

### Phase 7 - Evidence Boundary

Goal: separate organisation-private evidence from authority-reviewable evidence.

Migration:

- Add `supabase/migrations/0065_evidence_authority_boundary.sql`.

Schema changes:

- Add visibility/status columns to `org_documents` and/or create linking tables:
  - `authority_evidence_links`
  - `submission_evidence_links`
  - `evidence_access_logs`

Visibility classes:

- `org_private`
- `authority_reviewable`
- `approved_public`

Likely files:

- `apps/org/app/api/evidence/route.ts`
- `apps/org/components/reports/evidence-uploader.tsx`
- `apps/agp-console/lib/console/authority-evidence.ts`
- `apps/agp-console/components/authority/evidence-viewer.tsx`
- `apps/agp-console/lib/console/server.ts` for audit log reuse

Acceptance tests:

- Authority cannot browse unrelated private documents.
- Authority can view evidence linked to submission/case.
- Evidence view/download is audited.
- Public visibility is not inferred from authority visibility.

### Phase 8 - Authority View MVP

Goal: build the MAIN/JAIN workspace in AGP Console.

Navigation:

- Add an Authority View group to `apps/agp-console/lib/console/navigation.ts`.

Routes:

- `apps/agp-console/app/(console)/authority/dashboard/page.tsx`
- `apps/agp-console/app/(console)/authority/organisations/page.tsx`
- `apps/agp-console/app/(console)/authority/organisations/[orgId]/page.tsx`
- `apps/agp-console/app/(console)/authority/submissions/page.tsx`
- `apps/agp-console/app/(console)/authority/obligations/page.tsx`
- `apps/agp-console/app/(console)/authority/exceptions/page.tsx`
- `apps/agp-console/app/(console)/authority/cases/page.tsx`
- `apps/agp-console/app/(console)/authority/corrective-actions/page.tsx`
- `apps/agp-console/app/(console)/authority/reports/page.tsx`
- `apps/agp-console/app/(console)/authority/activity/page.tsx`

Components:

- `apps/agp-console/components/authority/authority-dashboard-cards.tsx`
- `apps/agp-console/components/authority/authority-organisation-registry.tsx`
- `apps/agp-console/components/authority/authority-organisation-profile.tsx`
- `apps/agp-console/components/authority/submission-monitor-table.tsx`
- `apps/agp-console/components/authority/obligation-monitor-table.tsx`
- `apps/agp-console/components/authority/exception-centre-table.tsx`
- `apps/agp-console/components/authority/corrective-action-tracker.tsx`
- `apps/agp-console/components/authority/authority-activity-table.tsx`

Service layer:

- `apps/agp-console/lib/console/authority-dashboard.ts`
- `apps/agp-console/lib/console/authority-organisations.ts`
- `apps/agp-console/lib/console/authority-submissions.ts`
- `apps/agp-console/lib/console/authority-obligations.ts`
- `apps/agp-console/lib/console/authority-exceptions.ts`
- `apps/agp-console/lib/console/authority-reports.ts`

Acceptance tests:

- Officer sees only assigned pilot organisations.
- Dashboard cards drill down to matching rows.
- Authority user from another jurisdiction receives denial.
- Viewer cannot perform reviewer/manager actions.
- Bahasa Melayu labels are used for pilot-facing screens where practical.

### Phase 9 - State Reporting Pack

Goal: produce a scoped monthly/annual reporting pack for submission and review.

Likely files:

- `apps/org/app/(protected)/accounting/reports/page.tsx`
- `apps/org/app/(protected)/accounting/reports/statement-of-activities/page.tsx`
- `apps/org/app/(protected)/accounting/reports/statement-of-financial-position/page.tsx`
- `apps/org/app/(protected)/accounting/reports/fund-changes/page.tsx`
- `apps/org/app/(protected)/accounting/reports/cash-flow/page.tsx`
- `apps/org/app/(protected)/accounting/bank-accounts/[id]/reconcile/page.tsx`
- `apps/org/app/api/audit-package/route.ts`
- new `apps/org/lib/state-report-pack.ts`
- `apps/agp-console/lib/console/authority-reports.ts`

Pilot outputs:

- monthly receipts/expenditure statement
- bank reconciliation summary
- fund balance summary
- exception summary
- evidence index
- submission cover metadata

Acceptance tests:

- Report totals reconcile to ledger/snapshot totals.
- Generated report includes policy/report template version.
- Regeneration does not mutate historical submission.
- Export respects authority scope.

### Phase 10 - Pilot Telemetry And KPI

Goal: capture pilot exit evidence.

Migration:

- Add `supabase/migrations/0066_pilot_telemetry.sql`.

Tables:

- `pilot_metric_events`
- `pilot_feedback`
- `pilot_support_incidents`

Likely files:

- `apps/agp-console/lib/console/authority-kpi.ts`
- `apps/agp-console/app/(console)/authority/reports/page.tsx`
- `apps/agp-console/components/authority/pilot-kpi-report.tsx`

Metrics:

- submission timeliness
- review duration
- reconciliation completion
- exception resolution time
- corrective-action cycle time
- missing evidence count
- clarification cycles

Acceptance tests:

- KPI report generated for pilot cohort.
- Baseline and pilot period use same metric definitions.
- Metrics are portfolio scoped and do not expose cross-jurisdiction data.

### Phase 11 - Pilot Fixtures And E2E Scenarios

Goal: deterministic test data for all 14 MVP acceptance scenarios.

Files:

- new `supabase/seed_authority_pilot.sql`
- new `scripts/seed-main-jain-pilot.mjs`
- optional `scripts/smoke-main-jain-pilot.mjs`
- update `apps/agp-console/app/(console)/e2e-governance-uat/page.tsx` or add authority-specific UAT page.

Scenarios:

1. Officer sees only 3-5 assigned pilot organisations.
2. Mosque submits monthly report and it appears in Submission Monitor.
3. Authority acknowledges and reviews the submission.
4. Reviewer sees linked evidence but not unrelated private files.
5. Reviewer requests clarification; mosque responds from AmanahOS.
6. Reviewer creates finding and corrective action.
7. Mosque submits remediation; authority verifies it.
8. Overdue submission appears in exception queue.
9. Bank discrepancy creates exception/case.
10. Self-approval creates governance exception.
11. Policy change affects future obligations only.
12. Cross-jurisdiction user receives DB-level denial.
13. Dashboard totals equal detail rows.
14. Pilot KPI report can be generated.

Verification:

- `pnpm typecheck`
- `pnpm lint`
- targeted smoke script for the 14 scenarios

### Phase 12 - Operator Runbooks And Pilot Freeze

Docs to add:

- `docs/pilot-main-jain/STATE_POLICY_CONFIGURATION_GUIDE.md`
- `docs/pilot-main-jain/AUTHORITY_USER_ONBOARDING.md`
- `docs/pilot-main-jain/MOSQUE_SURAU_PILOT_ONBOARDING.md`
- `docs/pilot-main-jain/SUBMISSION_REVIEW_RUNBOOK.md`
- `docs/pilot-main-jain/ACCESS_REVOCATION_INCIDENT_RUNBOOK.md`
- `docs/pilot-main-jain/PILOT_KPI_DEFINITION_SHEET.md`

Freeze criteria:

- All P0 migrations applied locally.
- RLS negative tests pass.
- Authority View MVP scenarios pass.
- One full monthly submission flows from AmanahOS to Authority View and reaches accepted/changes-requested states.
- Evidence boundary blocks private files.
- Pilot KPI report works for the seeded cohort.
- No unresolved P0 security defects remain.

## 4. Migration Map

| Migration | Purpose | Depends on |
|---|---|---|
| `0059_authority_domain.sql` | authorities, jurisdictions, authority members, pilot cohorts | current org/users schema |
| `0060_authority_rls.sql` | DB-level authority isolation | `0059` |
| `0061_policy_engine_lite.sql` | policy versions/rules/effective periods | `0059`, `0060` |
| `0062_regulatory_submissions.sql` | monthly/annual submission lifecycle | `0061` |
| `0063_obligations_exceptions.sql` | obligation instances and exception events | `0061`, `0062` |
| `0064_approval_delegation_engine.sql` | policy-driven approval instances | `0061`, existing `payment_requests` |
| `0065_evidence_authority_boundary.sql` | reviewable evidence links/access logs | `0062`, existing documents/evidence |
| `0066_pilot_telemetry.sql` | pilot KPI events/feedback/incidents | `0059`, `0062`, `0063` |

Every migration must include:

- additive schema changes where possible;
- indexes for `authority_id`, `jurisdiction_id`, `organization_id`, period/status fields;
- comments explaining pilot purpose;
- verification queries;
- RLS policies where relevant;
- no destructive table rewrites.

## 5. Permission And Role Map

New logical permissions:

- `authority.dashboard.read`
- `authority.organizations.read`
- `authority.submissions.read`
- `authority.submissions.review`
- `authority.obligations.read`
- `authority.exceptions.read`
- `authority.exceptions.manage`
- `authority.cases.read`
- `authority.cases.write`
- `authority.evidence.read`
- `authority.policy.read`
- `authority.policy.write`
- `authority.audit.read`
- `authority.reports.export`

Authority roles:

- `authority_viewer`
- `authority_reviewer`
- `authority_manager`
- `authority_admin`

Implementation note:

Do not overload `platform_owner`, `platform_admin`, or `super_admin` as authority roles. Platform roles can administer setup, but authority workflow actions must identify whether the actor is acting as platform operator or authority officer.

## 6. Security Tests Required Before Pilot

Mandatory negative tests:

1. Authority user from State A cannot read State B organisation metadata.
2. Authority viewer cannot record findings.
3. Authority reviewer cannot activate policy version.
4. Authority user cannot read `org_private` document unrelated to submission/case.
5. Removed authority member loses access immediately.
6. Organisation member cannot access Authority View datasets.
7. Public/anon user cannot access authority datasets.
8. Export endpoint applies same scope as UI.
9. Signed evidence URL expires.
10. Service-role key is never exposed to browser code.

## 7. Checks

Run the narrowest relevant checks after each phase:

- `pnpm typecheck`
- `pnpm lint`
- migration verification SQL
- targeted smoke script once available

Run broader checks before pilot freeze:

- `pnpm build`
- full authority pilot smoke script
- manual browser pass for Authority View dashboard, submissions, evidence, and exceptions

## 8. Done Criteria

The codebase is MAIN/JAIN pilot-ready when:

- authority/jurisdiction schema exists and is RLS-protected;
- authority users only see assigned pilot cohort organisations;
- state policy rules are versioned and data-driven;
- monthly submission lifecycle works from AmanahOS to AGP Console;
- obligations and exceptions are derived from policy/source data;
- approval thresholds are configurable and self-approval is blocked;
- evidence visibility separates private, authority-reviewable, and public material;
- Authority View MVP implements dashboard, registry, submission monitor, obligations, exceptions, review cases, evidence, corrective actions, reports, and audit/activity;
- KPI report can be generated for the pilot cohort;
- all 14 MVP acceptance scenarios pass;
- operator runbooks are complete.

