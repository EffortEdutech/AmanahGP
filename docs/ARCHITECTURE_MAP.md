# Amanah Governance Platform — Architecture Map

**Version:** v1.0  
**Date:** April 2026  
**Owner:** Darya Malak  
**Status:** Phase 2 Baseline  
**Scope:** Full repo audit at `v0.1.0-phase1-complete` tag

---

## Purpose

This document maps every module, file group, and architectural concern in the AmanahGP repo against four migration decisions:

| Tag | Meaning |
|-----|---------|
| `[KEEP]` | Works correctly. No action needed. Do not touch during Phase 2 refactor. |
| `[REFACTOR]` | Core value preserved but needs modification — either to extract org-management logic to amanahOS, or to sharpen its evaluator-authority role. |
| `[MOVE → apps/org]` | Logic currently living in the Console that should migrate to amanahOS. Do not delete until amanahOS equivalents are live and tested. |
| `[BUILD NEW]` | Does not yet exist. Needs to be created as part of Phase 2. |
| `[DEFER]` | Valid future direction but requires team/budget beyond current scope. Do not build in Phase 2. |

---

## 1. Monorepo Root

| Path | Status | Notes |
|------|--------|-------|
| `pnpm-workspace.yaml` | `[KEEP]` | Add `apps/org` to workspace packages |
| `package.json` (root) | `[KEEP]` | Add `packageManager` field if not present |
| `.env.example` | `[KEEP]` | Add `apps/org` vars section |
| `README.md` | `[REFACTOR]` | Update to reflect 3-app architecture |
| `RUNBOOK_LOCAL_DEV_SADAQAH.md` | `[REFACTOR]` | Rename to `RUNBOOK_LOCAL_DEV_AGP.md`, add apps/org port 3302 |

---

## 2. apps/user — AmanahHub (Public + Donor App)

Overall status: `[KEEP]` — 70–75% complete. Minor trust API wiring needed in Phase 2.

### Auth & Middleware

| Path | Status | Notes |
|------|--------|-------|
| `apps/user/middleware.ts` | `[KEEP]` | Correct route protection |
| `apps/user/app/(auth)/login/page.tsx` | `[KEEP]` | |
| `apps/user/app/(auth)/signup/page.tsx` | `[KEEP]` | Guest donation supported |
| `apps/user/app/(auth)/callback/route.ts` | `[KEEP]` | |
| `apps/user/lib/supabase/client.ts` | `[KEEP]` | Browser client |
| `apps/user/lib/supabase/server.ts` | `[KEEP]` | Server client |

### Public Pages

| Path | Status | Notes |
|------|--------|-------|
| `apps/user/app/page.tsx` (landing) | `[KEEP]` | Islamic governance landing page complete |
| `apps/user/app/directory/page.tsx` | `[KEEP]` | Charity directory listing |
| `apps/user/app/organizations/[slug]/page.tsx` | `[KEEP]` | Public org profile |
| `apps/user/app/organizations/[slug]/projects/page.tsx` | `[KEEP]` | Public project listing |
| `apps/user/app/organizations/[slug]/projects/[id]/page.tsx` | `[KEEP]` | Public project detail |

### Trust Display (Phase 2 enhancement)

| Path | Status | Notes |
|------|--------|-------|
| Trust score display (org profile) | `[REFACTOR]` | Phase 2: wire to `@agp/scoring` API route instead of reading raw score from DB. Add trust badge component. |
| Trust timeline component | `[BUILD NEW]` | Show certification history + trust events on public profile |
| Amanah badge display | `[BUILD NEW]` | Gold / Silver / Platinum badge component — reads from `certification_history` |

### Donation Flow

| Path | Status | Notes |
|------|--------|-------|
| `apps/user/app/donate/[orgId]/page.tsx` | `[KEEP]` | ToyyibPay checkout flow |
| `apps/user/app/receipt/[token]/page.tsx` | `[KEEP]` | Donor receipt page |

### Supabase Clients

| Path | Status | Notes |
|------|--------|-------|
| `apps/user/lib/supabase/` | `[KEEP]` | Correct client/server split |

---

## 3. apps/admin — AmanahHub Console

Overall status: `[REFACTOR]` — currently serves both org-management AND evaluator functions. Phase 2 gradually moves org-management to `apps/org`. Console sharpens toward evaluator authority.

### Auth & Middleware

| Path | Status | Notes |
|------|--------|-------|
| `apps/admin/middleware.ts` | `[KEEP]` | Correct route protection |
| `apps/admin/app/(auth)/` | `[KEEP]` | Login, signup, forgot-password, callback |
| `apps/admin/lib/supabase/` | `[KEEP]` | Correct client/server/service split |

### Dashboard

| Path | Status | Notes |
|------|--------|-------|
| `apps/admin/app/(protected)/dashboard/page.tsx` | `[KEEP]` | Works for all roles |

### Org Management (→ amanahOS over time)

| Path | Status | Notes |
|------|--------|-------|
| `apps/admin/app/(protected)/orgs/[orgId]/page.tsx` | `[MOVE → apps/org]` | Org overview — migrate to amanahOS. Keep in Console until amanahOS equivalent is live. |
| `apps/admin/app/(protected)/orgs/[orgId]/projects/` | `[MOVE → apps/org]` | Project CRUD belongs in the org's own SaaS product |
| `apps/admin/app/(protected)/orgs/[orgId]/financials/` | `[MOVE → apps/org]` | Financial snapshots → amanahOS accounting module |
| `apps/admin/app/(protected)/orgs/[orgId]/certification/` | `[MOVE → apps/org]` (application) / `[KEEP]` (status view) | Orgs apply via amanahOS; Console handles the evaluation side |
| `apps/admin/app/(protected)/orgs/[orgId]/members/` | `[MOVE → apps/org]` | Member management belongs in org SaaS |
| `apps/admin/app/(protected)/orgs/[orgId]/scholar/` | `[KEEP]` | Scholar notes are evaluator function, not org function |
| `apps/admin/app/(protected)/onboarding/new/` | `[REFACTOR]` | Initial org registration may stay in Console short-term; migrate to amanahOS in Sprint 15 |

### Reviewer & Evaluator Tools (KEEP — Console's permanent core)

| Path | Status | Notes |
|------|--------|-------|
| `apps/admin/app/(protected)/review/onboarding/` | `[KEEP]` | Reviewer queue — permanent Console function |
| `apps/admin/app/(protected)/review/onboarding/[orgId]/` | `[KEEP]` | Org review detail + decision form |
| `apps/admin/app/(protected)/review/reports/` | `[KEEP]` | Report verification queue |
| `apps/admin/app/(protected)/review/reports/[reportId]/` | `[KEEP]` | Report review + evidence approval |
| `apps/admin/app/(protected)/review/certification/` | `[KEEP]` | CTCF evaluation queue |
| `apps/admin/app/(protected)/review/certification/[appId]/` | `[KEEP]` | Full 5-layer CTCF evaluation form + decision |
| `apps/admin/app/(protected)/review/scholar/` | `[KEEP]` | Scholar notes list |
| `apps/admin/app/(protected)/review/amanah/` | `[KEEP]` | Amanah score manual recalculation |
| `apps/admin/components/review/ctcf-evaluation-form.tsx` | `[KEEP]` | Full 5-layer form |
| `apps/admin/components/review/review-decision-form.tsx` | `[KEEP]` | Decision form (approve/reject/changes) |
| `apps/admin/components/review/scholar-note-form.tsx` | `[KEEP]` | Scholar note form |

### Platform Admin (super_admin — KEEP)

| Path | Status | Notes |
|------|--------|-------|
| `apps/admin/app/(protected)/admin/organizations/` | `[KEEP]` | Platform-level org oversight — evaluator authority function |
| `apps/admin/app/(protected)/admin/users/` | `[KEEP]` | Platform user management |
| `apps/admin/app/(protected)/admin/audit/` | `[KEEP]` | Audit log viewer |

### Server Actions

| Path | Status | Notes |
|------|--------|-------|
| `review/certification-actions.ts` | `[KEEP]` | CTCF submission + certification decision |
| `review/actions.ts` | `[KEEP]` | Org decision, report verification, evidence approval |
| `review/recalculate.ts` | `[KEEP]` | Amanah recalculation triggers |
| `orgs/[orgId]/scholar/scholar-actions.ts` | `[KEEP]` | Scholar notes |
| `orgs/[orgId]/projects/actions.ts` | `[MOVE → apps/org]` | Project CRUD → org SaaS |
| `reports/actions.ts` | `[MOVE → apps/org]` | Report submission → org SaaS |
| `orgs/[orgId]/financials/actions.ts` | `[MOVE → apps/org]` | Financial snapshot → org accounting module |
| `orgs/[orgId]/certification/actions.ts` (apply) | `[MOVE → apps/org]` | Org applies via amanahOS |

### Layout & Components

| Path | Status | Notes |
|------|--------|-------|
| `apps/admin/components/layout/sidebar.tsx` | `[REFACTOR]` | Phase 2: remove org-management nav items as routes migrate to amanahOS. Sidebar becomes evaluator-authority focused. |
| `apps/admin/components/layout/header.tsx` | `[KEEP]` | |

### Documents

| Path | Status | Notes |
|------|--------|-------|
| `apps/admin/app/api/documents/` | `[KEEP]` | Document upload/view/signed URL API |
| `apps/admin/app/(protected)/orgs/[orgId]/documents/` | `[MOVE → apps/org]` | Org compliance documents upload → amanahOS |

---

## 4. packages/scoring — @agp/scoring

Overall status: `[KEEP]` — this IS the trust engine. No separate microservice needed in Phase 2.

| Path | Status | Notes |
|------|--------|-------|
| `packages/scoring/src/ctcf.ts` | `[KEEP]` | `ctcf_v1` scoring engine — pure TypeScript, no dependencies |
| `packages/scoring/src/amanah.ts` | `[KEEP]` | `amanah_v1` weighted formula engine |
| `packages/scoring/src/index.ts` | `[KEEP]` | Package exports |
| `packages/scoring/src/__tests__/ctcf.test.ts` | `[KEEP]` | 25 test cases |
| `packages/scoring/src/__tests__/amanah.test.ts` | `[KEEP]` | 22 test cases |
| `packages/scoring/src/__tests__/webhook-idempotency.test.ts` | `[KEEP]` | 13 test cases |

### Phase 2 additions to @agp/scoring

| Item | Status | Notes |
|------|--------|-------|
| Fund accounting score contribution | `[BUILD NEW]` | New scoring dimension feeding CTCF Layer 2 from fund accounting data |
| Trust event type registry | `[BUILD NEW]` | Centralised list of all trust event codes, pillar mapping, base scores |
| Public Trust API route | `[BUILD NEW]` | `apps/user/app/api/trust/[orgId]/route.ts` — exposes score without raw DB access |

---

## 5. packages/config — @agp/config

| Path | Status | Notes |
|------|--------|-------|
| `packages/config/src/roles.ts` | `[KEEP]` | Platform + org role constants |
| `packages/config/src/constants.ts` | `[KEEP]` | Brand, fund types, org types |
| `packages/config/src/index.ts` | `[KEEP]` | |

### Phase 2 additions to @agp/config

| Item | Status | Notes |
|------|--------|-------|
| Fund type constants (`ZAKAT`, `SADAQAH`, `WAQF`, `GENERAL`, `PROJECT`) | `[BUILD NEW]` | Used by amanahOS accounting module |
| Chart of accounts codes | `[BUILD NEW]` | Standardised CoA for Islamic nonprofit accounting |
| amanahOS app brand constants | `[BUILD NEW]` | App name, port, URL |

---

## 6. packages/validation — @agp/validation

| Path | Status | Notes |
|------|--------|-------|
| `packages/validation/src/project.ts` | `[KEEP]` | Project Zod schemas |
| `packages/validation/src/report.ts` | `[KEEP]` | Report + financial Zod schemas |

### Phase 2 additions to @agp/validation

| Item | Status | Notes |
|------|--------|-------|
| Fund account Zod schemas | `[BUILD NEW]` | Used by amanahOS accounting |
| Transaction Zod schemas | `[BUILD NEW]` | Fund transaction validation |
| Compliance report Zod schemas | `[BUILD NEW]` | ROS / JAKIM report structure |
| Governance policy template schemas | `[BUILD NEW]` | Policy upload + metadata |

---

## 7. Supabase — Schema & Migrations

### Existing Tables (Sprints 0–12)

| Table | Status | Notes |
|-------|--------|-------|
| `users` | `[KEEP]` | Platform users + role |
| `organizations` | `[KEEP]` | Core org table with governance classification |
| `org_members` | `[KEEP]` | Tenant boundary through `organization_id` |
| `projects` | `[KEEP]` | Project CRUD |
| `project_reports` | `[KEEP]` | Reports against projects |
| `evidence_files` | `[KEEP]` | Private-by-default evidence artifacts |
| `financial_snapshots` | `[KEEP]` | One per org per year |
| `certification_applications` | `[KEEP]` | CTCF application workflow |
| `certification_evaluations` | `[KEEP]` | Reviewer CTCF evaluation + score breakdown |
| `certification_history` | `[KEEP]` | Append-only certification status changes |
| `amanah_index_history` | `[KEEP]` | Append-only Amanah Index score snapshots |
| `trust_events` | `[KEEP]` | Append-only trust signal log |
| `donation_transactions` | `[KEEP]` | Provider-neutral donation records |
| `payment_webhook_events` | `[KEEP]` | Append-only webhook log |
| `audit_logs` | `[KEEP]` | Append-only platform audit trail |
| `org_documents` | `[KEEP]` | Org-level compliance PDFs |
| `scholar_notes` | `[KEEP]` | Scholar annotations |
| `org_invites` | `[KEEP]` | Member invitation tokens |

### Phase 2 New Tables (Fund Accounting — Sprint 15)

| Table | Status | Notes |
|-------|--------|-------|
| `fund_types` | `[BUILD NEW]` | Master list: Zakat, Sadaqah, Waqf, General, Project |
| `fund_accounts` | `[BUILD NEW]` | Chart of accounts per org |
| `fund_transactions` | `[BUILD NEW]` | Double-entry fund ledger entries |
| `fund_balances` | `[BUILD NEW]` | Current balance per fund account (materialised view or computed) |
| `compliance_reports` | `[BUILD NEW]` | Auto-generated ROS / MAIN / donor transparency packs |
| `governance_policies` | `[BUILD NEW]` | Policy template uploads (financial control, PDPA, Zakat SOP, etc.) |

### Migrations

| File | Status | Notes |
|------|--------|-------|
| `0001_core_schema.sql` | `[KEEP]` | 15 Phase 1 tables |
| `0002_rls_policies.sql` | `[KEEP]` | Default-deny RLS |
| `0003_sprint3_*.sql` through latest | `[KEEP]` | All sprint migrations applied |
| `0020_fund_accounting.sql` (proposed) | `[BUILD NEW]` | Fund accounting schema — Sprint 15 |
| `0021_governance_policies.sql` (proposed) | `[BUILD NEW]` | Governance policy table — Sprint 17 |

---

## 8. Supabase — Edge Functions

| Function | Status | Notes |
|----------|--------|-------|
| `recalculate-amanah/index.ts` | `[KEEP]` | Reads org data, computes all 5 component scores, appends to `amanah_index_history` |
| `send-invite-email/index.ts` | `[KEEP]` | Invitation email delivery |
| `webhook-payments/index.ts` | `[KEEP]` | ToyyibPay webhook handler |

### Phase 2 new edge functions

| Function | Status | Notes |
|----------|--------|-------|
| `emit-trust-event/index.ts` | `[BUILD NEW]` | Receives trust event from any app, writes to `trust_events`, optionally triggers recalculate-amanah |
| `generate-compliance-report/index.ts` | `[BUILD NEW]` | Sprint 16 — auto-generates ROS / MAIN pack as PDF |

---

## 9. Supabase — Storage Buckets

| Bucket | Status | Notes |
|--------|--------|-------|
| `evidence` (private) | `[KEEP]` | Report evidence files |
| `documents` (private) | `[KEEP]` | Org compliance documents |
| `org-assets` (public/private) | `[KEEP]` | Org logos, public profile assets |
| `fund-records` (private) | `[BUILD NEW]` | Bank statements, receipts, invoices for fund accounting |
| `policy-templates` (private) | `[BUILD NEW]` | Governance policy uploads |

---

## 10. apps/org — amanahOS (NEW APP)

This entire app does not yet exist. It is the core Phase 2 build target.

### Identity

| Field | Value |
|-------|-------|
| App name | amanahOS |
| Full name in UI | amanahOS — Governance Workspace |
| Repo path | `apps/org/` |
| Local port | `3302` |
| Target domain | `org.amanahhub.my` or `os.amanahhub.my` |
| Users | org_admin, org_manager, org_viewer (org-scoped roles only) |

### Modules to build

| Module | Status | Source |
|--------|--------|--------|
| Auth + middleware | `[BUILD NEW]` | Mirror apps/admin auth pattern |
| Dashboard (org overview) | `[BUILD NEW]` | Org health, trust score, certification status |
| Profile management | `[MOVE → apps/org]` | From apps/admin org overview + edit forms |
| Projects CRUD | `[MOVE → apps/org]` | From apps/admin orgs/[orgId]/projects |
| Reports submission | `[MOVE → apps/org]` | From apps/admin reports flow |
| Evidence upload | `[MOVE → apps/org]` | From apps/admin evidence upload widget |
| Financial snapshots | `[MOVE → apps/org]` | From apps/admin orgs/[orgId]/financials |
| **Fund accounting (new)** | `[BUILD NEW]` | Core amanahOS differentiator — Sprint 15 |
| **Compliance reports (new)** | `[BUILD NEW]` | Auto-generate ROS / MAIN / donor packs — Sprint 16 |
| **Governance policy kit (new)** | `[BUILD NEW]` | Policy template upload + management — Sprint 17 |
| Certification application | `[MOVE → apps/org]` | From apps/admin cert apply flow |
| Trust score dashboard | `[BUILD NEW]` | Live Amanah Index, pillar breakdown, improvement tips |
| Member management | `[MOVE → apps/org]` | From apps/admin orgs/[orgId]/members |
| Invites | `[MOVE → apps/org]` | From apps/admin invite flow |
| Document vault | `[MOVE → apps/org]` | From apps/admin org documents |

---

## 11. Deferred Architecture (Phase 3+, needs team + budget)

These are valid items from the amanah_gp_OS.md that are explicitly out of scope for Phase 2 with a solo builder on zero budget:

| Item | Status | Reason deferred |
|------|--------|-----------------|
| `trust-engine` as separate microservice/repo | `[DEFER]` | `@agp/scoring` already handles this correctly as a shared package. Separate NestJS service only needed when external consumers (3rd party apps, public API) require it. |
| `trust-events` event bus (Kafka / RabbitMQ / AWS SNS) | `[DEFER]` | All paid infrastructure. Supabase Edge Functions handle event processing at current scale. Revisit when event volume exceeds edge function limits. |
| Managed bookkeeping partner network | `[DEFER]` | Requires partner relationships, legal agreements, financial services compliance |
| Audit marketplace (external auditor assignment) | `[DEFER]` | Phase 3+ — needs reviewer marketplace design |
| Mobile apps (iOS/Android) | `[DEFER]` | Web-first through Phase 2 |
| Multi-country regulatory support (Indonesia, GCC) | `[DEFER]` | Malaysia-first through Phase 2 |
| Advanced AML automation | `[DEFER]` | Requires regulatory engagement |

---

## 12. Documentation — Status

| File | Status | Notes |
|------|--------|-------|
| `docs/BRANDING_GUIDE.md` | `[KEEP]` | |
| `docs/ADR-001` through `ADR-004` | `[KEEP]` | |
| `docs/DECISION_LOG.md` | `[KEEP]` | |
| `docs/SPRINT0_COMPLETION.md` through `SPRINT12_COMPLETION.md` | `[KEEP]` | Historical record |
| `docs/VERCEL_DEPLOYMENT_GUIDE.md` | `[REFACTOR]` | Update for 3-app deployment when apps/org is ready |
| `RUNBOOK_LOCAL_DEV_SADAQAH.md` | `[REFACTOR]` | Rename + add apps/org section |
| `ARCHITECTURE_MAP.md` (this file) | `[KEEP]` | Update at end of each sprint |
| `docs/SPRINT13_COMPLETION.md` | `[BUILD NEW]` | Document Phase 2 start |

---

## 13. Phase 2 Build Order

Based on this map, the correct execution sequence for a solo builder is:

```
Sprint 13 — Tag + Architecture map + Phase 2 branch
Sprint 14 — apps/org scaffold (auth, middleware, dashboard shell, shared packages)
Sprint 15 — Fund accounting schema (new migration, fund tables, RLS)
Sprint 16 — amanahOS accounting module (transaction UI, fund balance, reports)
Sprint 17 — Governance policy kit (templates, upload, evidence vault expansion)
Sprint 18 — Console refactor Sprint 1 (move project/report pages to apps/org, Console cleanup)
Sprint 19 — Certification flow migration (org applies via amanahOS, Console evaluates)
Sprint 20 — Trust score public API + AmanahHub trust badge/timeline wiring
Sprint 21 — Compliance report generation (ROS / MAIN packs auto-export)
Sprint 22 — Hardening, E2E tests for 3-app system, Vercel deployment for apps/org
```

---

## 14. Key Constraints (Never Violate During Phase 2)

- `organization_id` remains the canonical tenant boundary everywhere
- `super_admin` always uses `createServiceClient()` to bypass RLS
- Append-only tables (`audit_logs`, `trust_events`, `amanah_index_history`, `payment_webhook_events`) are never mutated
- Evidence remains private by default — public requires `is_approved_public = true` AND reviewer approval
- Service role key never exposed in browser code in any of the three apps
- `@agp/scoring` remains the single source of trust calculation — no duplicate scoring logic in any app

---

*Last updated: April 2026 — Sprint 13 (Phase 2 start)*  
*Alhamdulillah.*
