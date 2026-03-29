# Amanah Governance Platform — Sprint 5 Completion Report

**Sprint:** S5 — CTCF Engine + Amanah Index™ + Scholar Notes + Invite Email  
**Date:** 27 Mar 2026  
**Status:** Delivered

---

## Sprint Goal
> Build the trust engines. CTCF scoring formula (ctcf_v1) computed from reviewer input. Amanah Index recalculated via Edge Function after every trust event. Reviewer certification evaluation page end-to-end. Scholar notes. Invitation email delivery.

---

## Epics Delivered

| Epic | Status |
|---|---|
| EPIC-06 Certification Engine (CTCF) | ✅ Complete |
| EPIC-07 Amanah Index™ Engine | ✅ Complete |
| EPIC-10 Scholar Workflow | ✅ Complete |
| EPIC-08 Invite email delivery | ✅ Complete |

---

## Deliverables

### New Package — `@agp/scoring`

| File | Purpose |
|---|---|
| `packages/scoring/src/ctcf.ts` | CTCF scoring engine (ctcf_v1) — pure TypeScript, no dependencies. Implements all 5 layers exactly per Doc08. Gate check, N/A normalization, grade computation. |
| `packages/scoring/src/amanah.ts` | Amanah Index™ engine (amanah_v1) — weighted formula per Doc09. Component score helpers for governance, financial, project, impact, feedback. |
| `packages/scoring/src/index.ts` | Package exports |
| `packages/scoring/package.json` | `@agp/scoring` workspace package |

---

### Database

| File | Purpose |
|---|---|
| `supabase/migrations/0005_scholar_notes.sql` | Scholar notes table + RLS (scholar/reviewer can write, org_admin can read publishable) |

---

### Edge Functions

| File | Purpose |
|---|---|
| `supabase/functions/recalculate-amanah/index.ts` | Full recalculation function — reads org data, computes all 5 component scores, appends to `amanah_index_history` (NEVER overwrites), writes audit log |
| `supabase/functions/send-invite-email/index.ts` | Sends invitation email via Supabase Auth + falls back to console log |

---

### Admin App Pages + Actions

| File | Purpose |
|---|---|
| `review/certification/page.tsx` | Certification queue — all submitted/under_review applications |
| `review/certification/[appId]/page.tsx` | Full CTCF evaluation page — org context, previous eval, evaluation form |
| `review/certification-actions.ts` | `submitCtcfEvaluation` (computes score via engine, appends to DB) + `certificationDecision` (records in cert_history, appends trust_event, triggers Amanah recalc) |
| `review/recalculate.ts` | `triggerAmanahRecalc` + `manualAmanahRecalc` server actions |
| `orgs/[orgId]/scholar/page.tsx` | Scholar notes page — list + add form |
| `orgs/[orgId]/scholar/scholar-actions.ts` | `addScholarNote` action with publishable flag |
| `apps/admin/tsconfig.json` | Updated — adds `@agp/scoring` path alias |

### Admin App Components

| File | Purpose |
|---|---|
| `components/review/ctcf-evaluation-form.tsx` | Full 5-layer evaluation form with Yes/No/N/A per criterion → shows score after compute → decision form (certify/reject) |
| `components/review/scholar-note-form.tsx` | Scholar note form with publishable toggle |

---

## Key Flows

### Reviewer — Full CTCF Evaluation + Decision
```
Certification queue → Click application
→ See org context (type, fund types, verified reports, financial status)
→ Fill in all 5 CTCF layers (Yes / No / N/A per criterion)
→ Click "Compute CTCF score"
→ ctcf_v1 engine runs:
    - Layer 1 gate check (all 6 items must pass)
    - Layers 2–5 scored with N/A normalization
    - Total score computed and graded
→ Score card shown (e.g., 78.0 / Gold Amanah)
→ Decision form appears (Grant / Do not certify)
→ Click "Submit decision"
→ certification_history appended (immutable)
→ certification_applications status updated
→ trust_event(certification_updated) appended
→ recalculate-amanah Edge Function triggered
→ amanah_index_history appended (new score)
→ Audit log written
→ Redirect back to certification queue
```

### Amanah Recalculation
```
Trust event occurs (report_verified, certification_updated, etc.)
→ triggerAmanahRecalc() called server-side
→ Edge Function fetches org data:
    - onboarding/listing status → governance score
    - financial_snapshots → financial score
    - verified reports → project score
    - report bodies (beneficiary/spend/KPI) → impact score
    - feedback baseline = 70 (Phase 1)
→ Weighted sum: 0.30×G + 0.25×F + 0.20×P + 0.15×I + 0.10×FB
→ Appends to amanah_index_history (NEVER overwrites)
→ Writes audit_log(AMANAH_RECALCULATED)
```

---

## CTCF Formula (ctcf_v1) — Implemented Exactly Per Spec

| Layer | Max Pts | Notes |
|---|---|---|
| Layer 1 | Gate | All 6 items must pass. Fail = score 0. |
| Layer 2 | 20 | 5pts each. Zakat criterion = N/A if non-zakat org. Min 12/20 for certification. |
| Layer 3 | 25 | 5pts each. No N/A items. |
| Layer 4 | 20 | 5pts each. No N/A items. |
| Layer 5 | 15 | Advisor=5, Policy=3, Zakat gov=3 (N/A if applicable), Waqf gov=4 (N/A if applicable). |

Certification threshold: ≥55/100 AND Layer 2 ≥12/20.

---

## Sprint 6 Picks Up From Here

- UX polish (mobile responsiveness, loading states)
- Observability (error monitoring, webhook failure alerts)
- End-to-end test suite (Playwright smoke tests for critical journeys)
- Pilot onboarding documentation
- Go-live checklist review

**Bismillah — proceed to Sprint 6.**
**Alhamdulillah.**
