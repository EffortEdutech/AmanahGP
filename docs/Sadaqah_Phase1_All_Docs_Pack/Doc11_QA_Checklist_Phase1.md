# Sadaqah Jariah Platform — QA Checklist (Phase 1)

**Document ID:** 06-QA-QACHECK-P1  
**Version:** v1.0  
**Date:** 27 Feb 2026  
**Owner:** Darya Malak  
**Status:** Draft

---

## P0 Release Blockers (Must Pass)
- Security & RBAC (401/403 correct; no cross-org access)
- Evidence privacy (no public leak; signed URLs; approval gates)
- Donation + webhook reliability (signature, idempotency, correct receipts)
- Scoring integrity (CTCF versioned; Amanah history append-only)
- Audit logs written for critical actions

---

## Module Checklist (Run each sprint)
- Auth/session
- Org onboarding + Malaysia classification
- Memberships
- Projects
- Reports + verification
- Evidence upload + visibility
- Financial snapshot
- Certification (CTCF)
- Amanah Index timeline and triggers
- Donations + receipts + webhook confirmations
- Public transparency pages
- Admin/reviewer queues

---

## Regression (Must Pass)
- Donor: directory → profile → donate → receipt
- Org admin: onboard → project → report + evidence → submit
- Reviewer: approve org → verify report → evaluate certification → approve
- Webhook replay: no duplicates
