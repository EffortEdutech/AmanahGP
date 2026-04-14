# Sadaqah Jariah Platform — System Architecture (Phase 1)

**Document ID:** 05-ENG-ARCH-P1  
**Version:** v1.2 (Formatted)  
**Date:** 27 Feb 2026  
**Owner:** Darya Malak  
**Status:** Draft (baseline architecture for Phase 1)

---

## Table of Contents
1. [Purpose](#1-purpose)  
2. [Architecture Goals](#2-architecture-goals-phase-1)  
3. [High-Level Architecture](#3-high-level-architecture)  
4. [Backend Modules](#4-backend-modules-phase-1)  
5. [Data Architecture](#5-data-architecture)  
6. [Core System Flows](#6-core-system-flows-sequence)  
7. [Security Architecture](#7-security-architecture-phase-1)  
8. [Observability & Reliability](#8-observability--reliability-phase-1)  
9. [Deployment Architecture](#9-deployment-architecture)  
10. [Scalability Roadmap](#10-scalability-roadmap-post-phase-1)  
11. [Open Decisions](#11-open-decisions-must-be-adrs)  
12. [Next Architecture Documents](#12-next-architecture-documents)  

---

## 1) Purpose
This document defines the **Phase 1 system architecture** for the Sadaqah Jariah Platform, including:

- Major components and responsibilities  
- Data stores and boundaries  
- Core flows (donation, reporting, certification, scoring)  
- Security and operational requirements  
- Deployment environments (dev/staging/prod)

**Non-custodial principle:** the platform **never holds donation funds**. Donations are processed **direct-to-charity** via a payment gateway; the platform logs confirmations and transparency events.

---

## 2) Architecture Goals (Phase 1)
1. **Trustworthy by design** — audit trails, explainable scoring, immutable histories  
2. **Operationally safe** — idempotent webhooks, controlled releases, monitoring  
3. **Modular monolith first** — fast delivery with strict module boundaries; microservices later if needed  
4. **Malaysia-first realism** — org classification influences workflows/scoring fairly  
5. **Pilot-ready** — reliable for 3–5 real charities, real reports, real donation confirmations  

---

## 3) High-Level Architecture

```text
[ Web Frontend (Next.js) ]
          |
          | HTTPS (JWT)
          v
[ Backend API (Modular Monolith) ]  <----->  [ Auth Provider (Supabase Auth / JWT) ]
          |
          | SQL
          v
[ PostgreSQL (Core DB + JSONB) ]
          |
          | Signed URLs / Storage API
          v
[ Object Storage (Evidence Files) ]

External Integrations:
[ Payment Gateway ]  ---> (Webhook) --->  [ Webhook Receiver ] ---> [ Donation Engine ] ---> [ Trust Events ]
```

### 3.1 Key Components
- **Frontend (Web):** Next.js + Tailwind; role-aware views (Donor / Org Admin / Reviewer / Scholar / Super Admin)
- **Backend (API):** Node.js (NestJS recommended) **or** Python (FastAPI)  
  - Phase 1 assumes **one backend** with strict internal module boundaries
- **Database:** PostgreSQL with selective **JSONB** usage for flexible report payloads and scoring breakdowns
- **Evidence Storage:** Supabase Storage or S3-compatible storage using **signed URLs**
- **Payment Gateway:** Stripe / DuitNow / PayPal (final selection via ADR)  
  - Must support **server-side confirmation via webhook** (preferred)
- **Background Jobs / Queue (optional but recommended):** score recalculation, retries, scheduled checks (Redis + worker)
- **Monitoring/Alerts:** API health checks, webhook failure alerts, error spikes, donation confirmation latency

### 3.2 Architectural Style
- **Modular monolith** in Phase 1 (single deployable backend)
- Clear internal boundaries to enable Phase 2 service extraction
- **Append-only** history tables for trust (events + score snapshots)

---

## 4) Backend Modules (Phase 1)
Phase 1 is implemented as a **modular monolith**: one deployable backend with strict internal boundaries.

### 4.1 Module List & Responsibilities

#### Auth Module
- Session validation (JWT)
- Role resolution (platform role + org role)
- Password reset / email verification (provider dependent)

#### Organizations Module
- Org CRUD (draft)
- Malaysia classification fields (org type, oversight authority, fund types)
- Org membership management and invitations
- Onboarding lifecycle: `draft → submitted → changes_requested → approved/rejected`

#### Projects Module
- Project CRUD
- Project lifecycle: `draft/active/completed/archived`
- Public-facing read models (approved only)

#### Reporting Module
- Report draft + submission
- Evidence linkage + metadata
- Verification workflow (reviewer decision)

#### Financial Module
- Financial snapshot create/versioning (year-based)
- Fund handling flags: `zakat/waqf/general`
- Optional supporting document uploads

#### Certification (CTCF) Module
- Criteria/weights (versioned)
- Score computation + breakdown storage
- Certification lifecycle + certification history
- Reviewer decision records

#### Amanah Index™ Module
- Trust event ingestion (append-only)
- Score calculation (versioned formula)
- Score timeline/history (immutable)
- Recalculation triggers + scheduled recalcs

#### Donations Module
- Donation initiation (`initiated/pending`)
- Payment gateway checkout creation
- Receipt/confirmation read model
- Donation trust-event generation

#### Webhook Module
- Receives payment confirmations
- Signature verification
- **Idempotent processing** + replay safety
- Persist raw webhook events (forensics)

#### Admin/Reviewer Module
- Review queues (onboarding / reports / certification)
- Approve/reject/request-changes actions
- Audit log viewer

#### Scholar Module (MVP)
- Shariah layer review notes (where applicable)
- Constraint: advisory notes only; **no external “fatwa issuance” claims** in-product

#### Audit & Observability Module
- Append-only audit logs for critical actions
- Correlation IDs + error logging
- Operational metrics hooks

---

## 5) Data Architecture

### 5.1 Primary Database (PostgreSQL)
**Role:** system-of-record for identity linkage, org/project/report states, certification, scoring history, donations, and audits.

**Phase 1 table families**
- `users`, `organizations`, `org_members`
- `projects`, `project_reports`
- `evidence_files`
- `financial_snapshots`
- `certification_applications`, `certification_evaluations`, `certification_history`
- `trust_events`, `amanah_index_history`
- `donation_transactions`, `payment_webhook_events`
- `audit_logs`

### 5.2 JSONB Strategy
Use **JSONB** for:
- Evolving report payloads (metrics + narrative sections)
- Scoring breakdowns (layer/criterion details)
- Audit metadata (context fields)

Use relational columns for:
- Keys, relationships, lifecycle statuses, timestamps, filterable fields

### 5.3 Evidence Storage (Object Storage)
- Files **private by default**
- Signed URLs for:
  - Org admins viewing their evidence
  - Reviewers verifying evidence
  - Public viewing **only approved evidence** (public bucket or short TTL signed URL)

---

## 6) Core System Flows (Sequence)

### 6.1 Donation Flow (Non-custodial)
```text
Donor -> Frontend -> Backend (create donation initiated)
Backend -> Payment Gateway (create checkout session)
Donor -> Payment Gateway (pay)
Payment Gateway -> Webhook -> Backend (verify signature, idempotent confirm)
Backend -> DB (mark succeeded/failed, store webhook event)
Backend -> Trust Events (append donation_confirmed)
Amanah Engine -> Recalculate -> Store history entry
Frontend -> Receipt page (reads donation status)
```

**Rules**
- Donation record is created **before redirect** (for reconciliation)
- Webhook handler is **idempotent** (no duplicates)
- Confirmation triggers trust event + score update (sync or queued)

### 6.2 Report Submission & Verification
```text
Org Admin -> Create report (draft)
Org Admin -> Upload evidence (metadata captured)
Org Admin -> Submit report
Reviewer -> Verify / Reject / Request changes
System -> trust_event(report_verified)
Amanah Engine -> Recalculate -> history entry
Public -> View verified report/evidence (approved only)
```

### 6.3 Certification Scoring
```text
Org Admin -> Apply for certification
Reviewer -> Review evidence + financial snapshot + governance checklist
CTCF Engine -> Compute (versioned) -> store breakdown
Reviewer -> Approve/Reject -> certification_history entry
System -> trust_event(certification_updated)
Amanah Engine -> Recalculate -> history entry
```

---

## 7) Security Architecture (Phase 1)

### 7.1 Identity & Access
- JWT sessions (Supabase Auth or custom)
- RBAC checks:
  - **API routes:** mandatory
  - **UI routes:** convenience only

**Role model**
- Platform roles: `donor`, `reviewer`, `scholar`, `super_admin`
- Org roles: `org_admin`, `org_manager`, `org_viewer`

### 7.2 Webhook Security
- Verify gateway signature (if supported)
- Persist raw payload + headers for auditing
- Idempotency keys:
  - gateway event id **or** transaction id composite (gateway dependent)

### 7.3 Data Protection
- Evidence private by default; signed URLs
- Encryption at rest (managed services) + TLS in transit
- Secrets via env/secret manager (**never** in frontend)

### 7.4 Auditability
Actions affecting:
- certification status
- score recalculation
- report verification
- onboarding approval
- donation status confirmation  
must write to `audit_logs` and/or `trust_events`.

---

## 8) Observability & Reliability (Phase 1)

### 8.1 Minimum Monitoring
- Health endpoint checks
- Error rate monitoring
- Webhook failure alerts
- Donation confirmation latency monitoring

### 8.2 Reliability Patterns
- Idempotency for webhooks and recalculation triggers
- Safe retries (webhooks + workers)
- Minimal reconciliation tool:
  - reprocess webhook event
  - reconcile donation transaction

---

## 9) Deployment Architecture

### 9.1 Environments
- **Dev:** docker-compose (frontend + backend + postgres)
- **Staging:** mirrors production; used for demos + QA
- **Production (Pilot):** controlled release; monitoring enabled

### 9.2 Container Layout
- `frontend` (Next.js)
- `backend` (API)
- `db` (Postgres) in dev; managed DB in staging/prod
- Optional:
  - `worker` (jobs)
  - `redis` (queue)

### 9.3 CI/CD
- Lint + tests on PR
- Deploy to staging on merge
- Production deploy via tagged release + go-live checklist

---

## 10) Scalability Roadmap (Post-Phase 1)
Possible service splits:
- Donations/Webhooks
- Scoring/Certification
- Reporting/Evidence
- Public Read API (cached/read-optimized)

Phase 1 enablers:
- clean boundaries
- versioned scoring
- append-only trust + score history
- minimal shared mutable state

---

## 11) Open Decisions (must be ADRs)
- ADR-001: Backend framework (NestJS vs FastAPI)
- ADR-003: Payment gateway + webhook capabilities
- ADR-004: Donor identity policy (anonymous vs login)
- ADR-005: Evidence storage + public-access policy
- ADR-006: Background jobs/queue (now vs later)

---

## 12) Next Architecture Documents
- `05-Engineering/Data-Model-ERD-and-Dictionary.md` (Doc #6)
- `05-Engineering/API-Spec.md` (Doc #7)
- `02-Trust-Framework/CTCF-Criteria-and-Scoring.md` (Doc #8)
- `02-Trust-Framework/Amanah-Index-Spec.md` (Doc #9)
