# Sadaqah Jariah Platform — Phase 1 Scope Contract

**Document ID:** 00-PROJ-SCOPE-P1  
**Version:** v1.0  
**Date:** 27 Feb 2026  
**Owner:** Darya Malak  
**Status:** Draft (scope lock)

---

## 1) Purpose
This document **locks Phase 1 scope** to prevent drift and ensure a stable MVP + pilot launch.  
Anything not listed as in-scope is **Phase 2 by default**, unless approved via change control.

---

## 2) Product Boundaries (Non-negotiables)
1. **Non-custodial donations:** platform never holds funds; payment goes direct-to-charity.
2. **Transparency-first:** public profiles show evidence-backed reporting and trust indicators.
3. **Auditability:** score/certification changes are logged with who/what/when.
4. **Explainability:** trust scores show breakdown or rationale (at least category-level).

---

## 3) In-Scope Features (Phase 1)

### 3.1 Accounts, Auth, and Roles
- Auth and role-based access control (RBAC)
- Roles: Donor, Charity Admin/Manager, Reviewer/Admin, Scholar, Super Admin

**Acceptance**
- Protected actions require correct role
- Admin actions write audit logs

### 3.2 Organization Onboarding + Malaysia Classification
- Org registration and profile
- Malaysia classification fields: org type, oversight authority, fund types
- Basic onboarding status workflow

### 3.3 Projects + Reporting + Evidence
- Create/edit projects
- Submit reports with evidence uploads (timestamp; optional geo-tag)
- Public project pages for approved/listed orgs

### 3.4 Financial Snapshot + Compliance (MVP)
- Minimal finance inputs
- Fund tagging (zakat/waqf/sadaqah)
- Attach supporting docs (optional)

### 3.5 Certification Engine (CTCF)
- Versioned criteria + scoring breakdown
- Certification lifecycle + history
- Reviewer approval workflow

### 3.6 Amanah Index™ Trust Score
- Event-driven recalculation
- Score history timeline
- Explainable breakdown

### 3.7 Donations (Direct-to-Charity) + Optional Fees
- Donation initiation (checkout)
- Webhook confirmation (idempotent)
- Donation receipt/logs
- Optional transparent fee

### 3.8 Public Transparency Dashboard
- Directory + charity profiles + project pages
- Certification status/history + Amanah timeline

### 3.9 Admin/Reviewer/Scholar Workflow (MVP)
- Review queues for onboarding/reports/certification
- Approve/reject/request changes
- Scholar notes (advisory)

### 3.10 Security, Audit, Observability (Baseline)
- Audit logs for key events
- Webhook verification (as supported)
- Basic monitoring/alerts

### 3.11 Testing + Release Readiness
- Unit/integration tests for scoring + webhooks
- E2E smoke tests for critical journeys
- Pilot go-live checklist + rollback plan

---

## 4) Out of Scope (Phase 1)
- Custodial wallet / platform-held fundraising
- Multi-country compliance/localization
- Advanced AML automation beyond basic controls
- Native mobile apps
- Complex donor CRM/marketing automation

---

## 5) Phase 1 “Done” Definition
Phase 1 is complete when:
1. 3–5 pilot charities can onboard and publish profiles with projects and verified reports.
2. Certification + Amanah Index are computed and displayed with history.
3. Donations can be made direct-to-charity and confirmed via webhook reliably.
4. Admin workflow can review and approve end-to-end.
5. Audit logs exist for critical actions and release checklist is passed.

---

## 6) Change Control (Mandatory)
Any change request must include:
- Description + rationale
- Impact on timeline/cost/security/compliance
- Phase classification (Phase 1 vs Phase 2)
- Product Owner approval before entering backlog
