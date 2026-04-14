# Sadaqah Jariah Platform — Test Strategy (Phase 1)

**Document ID:** 06-QA-TESTSTRAT-P1  
**Version:** v1.0  
**Date:** 27 Feb 2026  
**Owner:** Darya Malak  
**Status:** Draft

---

## 1) Must-Not-Fail Areas (P0)
- Webhook idempotency + donation status correctness
- Score integrity (append-only history, no double-counting events)
- Certification integrity (versioned, immutable history)
- RBAC + privacy (no leaks)
- Audit logs for critical actions

---

## 2) Test Levels
- Unit tests: scoring engines, webhook processor, validation, status transitions
- Integration: API + DB persistence, module workflows
- E2E: donor, org admin, reviewer flows
- Security/privacy: RBAC, signed URLs, webhook verification
- Performance (light): public pages + webhook processing latency

---

## 3) Required Suites
- Webhook Idempotency Suite (replay/out-of-order/unlinked events)
- Amanah History Immutability Suite (append-only, versioning, debounce)
- CTCF Versioning & Decision Integrity Suite
- Public Data Leak Prevention Suite
- RBAC Authorization Suite

---

## 4) Release Gate Smoke Tests
- Auth
- Onboarding
- Reports + evidence + verification
- Certification evaluate + decision
- Public listing visibility rules
- Donation checkout + webhook confirm + receipt
- Amanah score history updates exactly once per trigger
