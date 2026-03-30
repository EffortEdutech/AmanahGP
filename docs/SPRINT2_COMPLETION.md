# Amanah Governance Platform — Sprint 2 Completion Report

**Document ID:** 00-PROJ-SPRINT2-COMPLETION-P1  
**Sprint:** S3–S4 (Projects + Reports + Evidence + Financial + Certification + Reviewer Workflow)  
**Version:** v1.0  
**Date:** 27 Mar 2026  
**Owner:** Darya Malak  
**Status:** Delivered

---

## Sprint Goal
> Projects, Reports, and Evidence end-to-end. Financial Snapshot. Certification application. Full reviewer workflow: approve org, verify report, approve evidence. Every decision writes an audit log. Report verification triggers a trust event.

---

## Epics Delivered

| Epic | Status |
|---|---|
| EPIC-04 Projects + Reports + Evidence | ✅ Complete |
| EPIC-05 Financial Snapshot + Compliance | ✅ Complete |
| EPIC-06 Certification Engine (CTCF) — Application layer | ✅ Complete |
| EPIC-10 Admin/Reviewer Workflow | ✅ Complete |

---

## Deliverables

### Shared Packages

| File | Purpose |
|---|---|
| `packages/validation/src/project.ts` | Zod: create/update project |
| `packages/validation/src/report.ts` | Zod: create report, financial snapshot, reviewer decision, evidence confirm |

---

### Projects

| File | Purpose |
|---|---|
| `orgs/[orgId]/projects/actions.ts` | createProject, updateProject, archiveProject — all with RBAC + audit log |
| `orgs/[orgId]/projects/page.tsx` | Projects list (org admin view) |
| `orgs/[orgId]/projects/new/page.tsx` | Create project form (client component) |
| `orgs/[orgId]/projects/[projectId]/page.tsx` | Project detail: info + reports list + archive |

---

### Reports + Evidence

| File | Purpose |
|---|---|
| `reports/actions.ts` | createReport (draft), submitReport — RBAC + audit log |
| `reports/new/page.tsx` | New report form (narrative, beneficiaries, spend, milestones, next steps) |
| `reports/[reportId]/page.tsx` | Report detail: body + evidence section + submit CTA |
| `api/evidence/upload-url/route.ts` | POST: generate pre-signed upload URL + create `evidence_files` record |
| `api/evidence/[evidenceId]/confirm/route.ts` | POST: confirm upload metadata (capturedAt, geo, visibility) |
| `components/report/evidence-section.tsx` | Full 3-step upload widget: get URL → PUT to storage → confirm |
| `components/report/submit-report-button.tsx` | Client submit button with `useActionState` |

---

### Financial Snapshot

| File | Purpose |
|---|---|
| `orgs/[orgId]/financials/actions.ts` | upsertFinancialSnapshot (draft), submitFinancialSnapshot — RBAC + audit log |
| `orgs/[orgId]/financials/page.tsx` | Financial form with year selector, all fields, save/submit buttons |
| `api/orgs/[orgId]/financials/[year]/route.ts` | GET: read snapshot by year (for client-side year switching) |

---

### Certification

| File | Purpose |
|---|---|
| `orgs/[orgId]/certification/actions.ts` | applyForCertification — creates + submits application, blocks duplicates |
| `orgs/[orgId]/certification/page.tsx` | Full certification page: current status, score breakdown, Amanah score, history, apply button |
| `components/certification/apply-cert-button.tsx` | Client apply button with `useActionState` |

---

### Reviewer Workflow

| File | Purpose |
|---|---|
| `review/actions.ts` | orgOnboardingDecision, reportVerificationDecision, approveEvidencePublic — all reviewer-guarded, audit-logged, trust-event-appending |
| `review/onboarding/page.tsx` | Onboarding queue: all submitted orgs ordered by submission date |
| `review/onboarding/[orgId]/page.tsx` | Org review detail: full profile + classification + members + decision form |
| `review/reports/page.tsx` | Reports queue: all submitted+pending reports |
| `review/reports/[reportId]/page.tsx` | Report review detail: content + evidence approval controls + decision form |
| `components/review/review-decision-form.tsx` | Reusable decision form (approve/changes_requested/reject) with radio UI |
| `components/review/approve-evidence-button.tsx` | Per-evidence approve-public button |

---

## User Journeys Delivered

### Org Admin — Full Project + Report Flow
```
Org approved → Create project
→ Project page → New report → Fill narrative + milestones
→ Save draft → Upload evidence (pre-signed URL → storage → confirm)
→ Submit report for review
→ Report shows "pending" status
```

### Org Admin — Financial Snapshot
```
Org page → Financials → Select year
→ Fill income, expenditure, audit details → Save draft
→ Submit for review → Status: "submitted"
```

### Org Admin — Certification Application
```
Org page → Certification → Review current status + score
→ Verified report + financial snapshot in place → Apply
→ Application created in "submitted" state
→ Reviewer assigned queue item
```

### Reviewer — Full Decision Flow
```
Sign in as reviewer@agp.test
→ Dashboard → Onboarding queue
→ Review org profile + classification + members
→ Approve / request changes / reject → audit logged
→ Reports queue → Review report content + evidence
→ Approve evidence for public display (is_approved_public=true)
→ Verify report → trust_event(report_verified) appended
```

---

## RBAC Enforcement

| Action | Role Required | Enforced By |
|---|---|---|
| Create / update project | org_manager+ | `requireOrgRole()` in action |
| Archive project | org_manager+ | `requireOrgRole()` in action |
| Create / submit report | org_manager+ | `requireOrgRole()` in action |
| Upload evidence | org_manager+ | API route RBAC check |
| Upsert financial snapshot | org_manager+ | `requireOrgRole()` in action |
| Apply for certification | org_admin | `requireOrgRole()` in action |
| Org onboarding decision | reviewer/super_admin | `requireReviewer()` in action |
| Report verification | reviewer/super_admin | `requireReviewer()` in action |
| Approve evidence public | reviewer/super_admin | `requireReviewer()` in action |

---

## Audit Log Coverage

| Action | Logged |
|---|---|
| `PROJECT_CREATED` | ✅ |
| `PROJECT_ARCHIVED` | ✅ |
| `REPORT_CREATED` | ✅ |
| `REPORT_SUBMITTED` | ✅ |
| `FINANCIAL_SUBMITTED` | ✅ |
| `CERTIFICATION_SUBMITTED` | ✅ |
| `ORG_APPROVED` | ✅ |
| `ORG_REJECTED` | ✅ |
| `ORG_CHANGES_REQUESTED` | ✅ |
| `REPORT_VERIFIED` | ✅ |
| `REPORT_REJECTED` | ✅ |
| `REPORT_CHANGES_REQUESTED` | ✅ |
| `EVIDENCE_APPROVED_PUBLIC` | ✅ |

---

## Trust Events Triggered

| Event | Trigger |
|---|---|
| `report_verified` | reviewer marks report as verified |

---

## Evidence Upload Flow (3-step, private by default)

```
1. Client requests upload URL
   POST /api/orgs/{orgId}/reports/{reportId}/evidence/upload-url
   → Returns: { uploadUrl, evidenceId, storagePath }
   → Creates evidence_files record with visibility='private'

2. Client PUTs file directly to Supabase Storage
   PUT signedUrl (browser → storage, bypasses server)

3. Client confirms upload
   POST /api/orgs/{orgId}/reports/{reportId}/evidence/{evidenceId}/confirm
   → Updates: capturedAt, geo, visibility

Reviewer approves for public:
   approveEvidencePublic() → is_approved_public=true, visibility='public'
```

---

## Regression Path (QA checklist items now covered)

- ✅ Org admin: onboard → project → report + evidence → submit
- ✅ Reviewer: approve org → verify report → approve evidence
- ✅ Evidence privacy: private by default, `is_approved_public` gate enforced

---

## Known Gaps (Sprint 5 picks up)

| Item | When |
|---|---|
| CTCF scoring computation (ctcf_v1 formula) | Sprint 5 |
| Amanah Index recalculation function | Sprint 5 |
| Reviewer certification evaluation + decision | Sprint 5 |
| Email notifications (org approved, report verified) | Sprint 8 |
| Org profile edit form (Sprint 1 gap) | Sprint 3 |
| Password reset UI | Sprint 3 |

---

## Sprint 3 Picks Up From Here

- Public transparency pages (AmanahHub): charity directory, org profiles, project pages
- Donation checkout flow (ToyyibPay)
- Donor receipt page
- Org profile edit form
- Password reset UI

**Bismillah — proceed to Sprint 3.**  
**Alhamdulillah.**
