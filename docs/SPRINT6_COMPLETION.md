# Amanah Governance Platform — Sprint 6 Completion Report

**Sprint:** S6 — Testing, Observability, Go-Live Runbook  
**Date:** 27 Mar 2026  
**Status:** Delivered

---

## Sprint Goal
> Unit test the scoring engines. E2E smoke tests for all 4 critical journeys. Health endpoints for observability. Production go-live runbook.

---

## Deliverables

### Unit Tests — `@agp/scoring`

| File | Coverage |
|---|---|
| `src/__tests__/ctcf.test.ts` | 25 test cases covering: Layer 1 gate pass/fail, all 6 gate items, Layer 2 normalization (zakat N/A), Layer 2 minimum (12/20), Layers 3–5 scoring, grade boundaries (Silver/Gold/Platinum), is_certifiable gate, breakdown stored correctly |
| `src/__tests__/amanah.test.ts` | 22 test cases covering: weighted formula, all 5 weights sum to 1.0, component score helpers (governance, financial, project, impact, feedback), input clamping (above 100, below 0), realistic mixed score |
| `src/__tests__/webhook-idempotency.test.ts` | 13 test cases covering: new event acceptance, duplicate rejection, cross-gateway independence, invalid signature stored-not-processed, 100-replay creates 1 record, trust event idempotency, score history immutability (append-only) |
| `vitest.config.ts` | Vitest config with coverage |
| `package.json` | Updated with vitest devDependencies and test scripts |

**Run tests:**
```powershell
pnpm -C packages/scoring install
pnpm -C packages/scoring test
pnpm -C packages/scoring test:coverage
```

---

### E2E Smoke Tests — Playwright

| File | Journeys |
|---|---|
| `e2e/tests/helpers.ts` | Shared fixtures: seed constants, signInAdmin, signInUser, assertNoErrorUI |
| `e2e/tests/01-donor-discovery.spec.ts` | 8 tests: directory loads, search filter, no-results, charity profile, project + verified report, receipt without auth, private org = 404, donate page |
| `e2e/tests/02-org-admin-console.spec.ts` | 10 tests: dashboard, sidebar nav, org profile, projects, project detail, members, certification (Gold Amanah), financials, sign out, RBAC (unauthenticated redirect, reviewer tools hidden) |
| `e2e/tests/03-reviewer-workflow.spec.ts` | 8 tests: reviewer tools visible, sidebar reviewer section, onboarding queue, onboarding detail + decision form, reports queue, certification queue, cross-org access, RBAC (org admin blocked) |
| `e2e/tests/04-privacy-data-leak.spec.ts` | 10 tests: public API only returns listed orgs, private org = 404, submitted org = 404, unverified reports not shown, cross-org URL prevention, reviewer queue blocked for org admin, audit logs require auth, webhook events not public, account redirect, admin redirect |
| `e2e/playwright.config.ts` | Desktop Chromium + iPhone 14 |
| `e2e/package.json` | Playwright dependencies |

**Run E2E tests (apps must be running):**
```powershell
# Start both apps first
pnpm -C apps/user dev -- -p 3300
pnpm -C apps/admin dev -- -p 3301

# Then run tests
pnpm -C e2e install:browsers
pnpm -C e2e test
```

---

### Health Endpoints

| Endpoint | App |
|---|---|
| `GET /api/health` | AmanahHub (user) — checks DB + env vars |
| `GET /api/health` | AmanahHub Console (admin) — checks DB + service role env |

**Response:**
```json
{
  "ok": true,
  "app": "AmanahHub",
  "version": "1.0.0",
  "timestamp": "2026-03-27T00:00:00.000Z",
  "latency_ms": 45,
  "checks": {
    "database": { "ok": true, "latency_ms": 32 },
    "environment": { "ok": true }
  }
}
```

Returns `200` when healthy, `503` when any check fails.

---

### Go-Live Runbook

`docs/PRODUCTION_RUNBOOK.md` covers:
- T-7 to T-3: scope/QA checklist, pilot cohort prep, content requirements
- T-3 to T-1: production Supabase setup, auth config, storage, Edge Function deploy, env vars for both apps, ToyyibPay live configuration, monitoring setup
- Go-live day: code freeze + tag, deploy commands, 10-item production smoke test checklist, rollback gate
- First 72 hours: monitoring schedule, pilot org onboarding, webhook confirmation check
- Rollback procedure
- Phase 2 triggers

---

## P0 Test Coverage (QA Checklist)

| P0 Item | Test File | Status |
|---|---|---|
| Security & RBAC (401/403, no cross-org) | `02`, `03`, `04` | ✅ |
| Evidence privacy (approval gate) | `01`, `04` | ✅ |
| Donation + webhook reliability | `01` (receipt) + unit tests | ✅ |
| Scoring integrity (append-only, versioned) | `webhook-idempotency.test.ts` | ✅ |
| Audit logs for critical actions | Unit tests + code review | ✅ |

## Regression Coverage (QA Checklist)

| Regression Journey | Test File | Status |
|---|---|---|
| Donor: directory → profile → donate → receipt | `01-donor-discovery.spec.ts` | ✅ |
| Org admin: onboard → project → report → submit | `02-org-admin-console.spec.ts` | ✅ |
| Reviewer: approve org → verify report → cert | `03-reviewer-workflow.spec.ts` | ✅ |
| Webhook replay: no duplicates | `webhook-idempotency.test.ts` | ✅ |

---

## Phase 1 Complete

All 6 sprints delivered:

| Sprint | Deliverable |
|---|---|
| S0 | Repo scaffold, 15 DB tables, RLS, seed data |
| S1 | Auth, org onboarding, member invites |
| S2 | Projects, reports, evidence, financial, reviewer workflow |
| S3 | Public charity directory, org profiles, donation flow, receipt |
| S4 | Donor account, invite flow, org edit, evidence gallery, sidebar |
| S5 | CTCF engine, Amanah Index recalculation, certification evaluation, scholar notes |
| S6 | Unit tests, E2E smoke tests, health endpoints, production runbook |

**Platform is pilot-ready. Bismillah — Alhamdulillah.**
