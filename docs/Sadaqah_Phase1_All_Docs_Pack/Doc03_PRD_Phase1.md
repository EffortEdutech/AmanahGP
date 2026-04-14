# Sadaqah Jariah Platform — PRD (Phase 1)

**Document ID:** 01-PROD-PRD-P1  
**Version:** v1.0  
**Date:** 27 Feb 2026  
**Owner:** Darya Malak  
**Status:** Draft

---

## 1) Executive Summary
Malaysia-first Islamic charity transparency platform.  
**Non-custodial:** platform does not hold funds; donations are direct-to-charity with webhook-confirmed logging.

---

## 2) Problem Statement
### Donors
- Hard to verify trustworthiness and impact evidence.
- Need clarity on governance, reporting, and historical behavior.

### Charities
- Lack structured reporting/evidence tools.
- Credible charities struggle to demonstrate accountability consistently.

---

## 3) Goals & Success Metrics
- MVP + pilot for 3–5 seed charities; onboard 10–20 orgs (target).
- Verified reporting and evidence visible publicly.
- Webhook confirmation ≥99% and idempotent.
- RBAC enforced; no P0 security issues at pilot launch.

---

## 4) Personas
- Donor (individual/family)
- Institutional donor
- Charity admin/manager
- Reviewer/admin
- Scholar advisor (workflow role)
- Super admin / ops

---

## 5) Scope (Phase 1)
In scope: onboarding + classification, projects/reports/evidence, financial snapshot, CTCF, Amanah Index, donations + webhooks, public dashboard, admin workflow, audit/security/obs, testing + pilot launch.  
Out of scope: custodial funds, multi-country, native apps, advanced AML, complex CRM.

---

## 6) Key User Journeys
- Donor: discover → evaluate → donate → receipt
- Charity: onboard → publish → maintain reporting → improve score
- Reviewer: validate → certify → update trust events/score

---

## 7) Functional Requirements (high level)
- Auth + RBAC roles and org membership
- Org onboarding + Malaysia classification fields
- Projects CRUD + reports + evidence uploads + verification workflow
- Financial snapshot + compliance (MVP)
- CTCF scoring + certification history
- Amanah Index scoring + event triggers + immutable timeline
- Donations checkout + optional fee + webhook confirmation + receipts
- Public directory + charity/project pages
- Admin review queues + audit logs

---

## 8) Non-Functional Requirements
- Security: RBAC, signed URLs, webhook verification
- Privacy: data minimization, PDPA-aligned disclosure
- Reliability: idempotency, retries, reconciliation logs
- Performance: fast public pages (mobile-first)
