# Sadaqah Jariah Platform — Project Charter (Phase 1)

**Document ID:** 00-PROJ-CHTR  
**Version:** v1.0  
**Date:** 27 Feb 2026  
**Owner:** Darya Malak  
**Status:** Draft

---

## 1) Project Overview

### 1.1 Background
Sadaqah Jariah Platform is an **Islamic charity transparency and trust infrastructure** designed to help donors give with confidence and help charities operate with stronger governance, measurable impact reporting, and documented amanah.

### 1.2 Vision
Build the most trusted Islamic charity transparency infrastructure—starting in Malaysia—so giving becomes easier, safer, and more impactful.

### 1.3 Mission
The platform **does not collect or distribute donation funds**. It provides:
- Transparency infrastructure
- Certification framework (CTCF)
- Trust scoring (Amanah Index™)
- Evidence and reporting tools
- Admin/reviewer workflow
- Shariah compliance advisory layer support

### 1.4 Operating Principle (Non-custodial)
**Payment Flow Model:** Donor → Payment Gateway → Charity Bank Account  
The platform **never holds donation funds**.

---

## 2) Goals & Success Metrics

### 2.1 Phase 1 Goals (MVP + Pilot)
1. Enable charities to onboard, manage projects, and submit transparency reports + evidence.
2. Provide a structured certification framework (CTCF) and generate a trust score (Amanah Index™).
3. Allow donors to browse verified charities/projects, view trust indicators, and donate via direct gateway payment.
4. Provide reviewer workflow to validate submissions and update certification/score history.
5. Launch a pilot with a small cohort and produce credible public transparency dashboards.

### 2.2 Success Metrics (Phase 1)
**Adoption**
- 10–20 charities onboarded (pilot-ready), 3–5 actively participating
- ≥70% onboarded charities complete minimum profile + at least 1 project

**Transparency & Trust**
- ≥60% of pilot charities submit ≥1 verified report with evidence
- Score history (Amanah Index™ timeline) visible and understandable

**Donation Operations**
- Webhook confirmation success rate ≥99% (idempotent)
- Donation receipts/logs created for ≥99% successful payments

**Product Quality**
- RBAC enforced for all protected actions
- No P0 security issues open at pilot launch
- Release checklist completed per release

---

## 3) Phase 1 Scope Summary

### 3.1 In Scope (Phase 1)
- Organization onboarding + Malaysia classification
- Projects + progress reporting + evidence uploads
- Financial snapshot + compliance forms (initial version)
- CTCF certification scoring + certification history
- Amanah Index™ scoring + timeline/history + recalculation triggers
- Donation initiation (direct-to-charity) + optional transparent fees + webhook confirmation
- Public transparency profiles/dashboard (charity and project pages)
- Admin/reviewer workflow (review/approve/reject/request changes)
- Audit logging + baseline security + observability
- Testing + pilot deployment + documentation

### 3.2 Out of Scope (Phase 1)
- Custodial wallets or platform-held fundraising
- Multi-country regulatory support
- Advanced AML beyond basic controls + manual review triggers
- Native mobile apps (Phase 1 is responsive web)

---

## 4) Stakeholders & Roles
- **Product Owner / Sponsor:** Darya Malak
- **Engineering Lead:** (to be assigned)
- **Developers:** Backend, Frontend, DevOps (as applicable)
- **Reviewers/Admin:** Platform operations team (pilot stage)
- **Scholar / Shariah Advisor(s):** Advisory governance (pilot stage)
- **Pilot Charity Partners:** Early onboarding cohort
- **End Users:** Donors (individual + institutional)

---

## 5) Delivery Approach
- Agile sprints (2 weeks), Phase 1 baseline: 12 sprints
- Each sprint must produce a demoable vertical slice (UI + API + data + RBAC)

---

## 6) Governance & Change Control
- Key decisions recorded as ADRs (Architecture Decision Records)
- Any scope change must include impact and Product Owner approval

---

## 7) Key Risks (Phase 1)
- Regulatory ambiguity → mitigate via classification + disclaimers + advisory input
- Misinterpretation of scoring → explainability + audit trail + history
- Webhook failures → idempotency + retries + reconciliation logs
- Adoption friction → minimal templates + guided onboarding
- PDPA/privacy → data classification + least privilege + retention plan

---

## 8) Deliverables (Phase 1)
- MVP platform (web) with in-scope modules
- Admin/reviewer workflow
- Pilot onboarding kit + documentation
- Runbook basics + release checklist
