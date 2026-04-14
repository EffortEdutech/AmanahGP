# Sadaqah Jariah Platform — Phase 1 Kickoff & Execution Plan

**Document ID:** 00-PROJ-KICKOFF-P1  
**Version:** v1.0  
**Date:** 27 Feb 2026  
**Owner:** Darya Malak  
**Status:** Draft

---

## 1) Lock Phase 1 Scope Contract
Agree Phase 1 boundaries before code to prevent drift:
- Islamic charities only
- MVP target: 10–20 orgs
- Pilot: 3–5 seed charities
- Non-custodial donations (direct-to-charity; optional transparent fee)
- Trust model: CTCF + Amanah Index event-driven updates

## 2) Malaysia Governance Classification From Day 1
Minimum fields:
- org_type
- oversight_authority
- fund_types (zakat/waqf/sadaqah)

## 3) Sprint 0 (1 week)
- repo + docker + docs placeholders + seed scripts
- DB migrations + seed data
- choose backend stack and freeze naming conventions

## 4) Execute 12 Sprint Roadmap With DoD Gates
Each sprint ships a demoable slice:
- UI + API + RBAC + audit logging + seed demo updated

## 5) Keep 3 Core Engines Modular
- Certification/Scoring Engine (CTCF)
- Amanah Index Engine (events + history)
- Donation Engine + Webhooks (no custody)

## 6) Parallel Streams Only When Safe
- overlap sprints 1–4 (FE/BE)
- parallel sprints 5–6 after schema stabilizes
- start mobile polish while scoring work ongoing

## 7) First Day Actions
- create repo + docker + env templates
- DB init + seed demo
- auth + RBAC skeleton
- API skeleton routes
- org classification fields added
