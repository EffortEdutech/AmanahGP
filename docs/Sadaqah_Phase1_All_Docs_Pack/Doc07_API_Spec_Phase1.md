# Sadaqah Jariah Platform — API Specification (Phase 1)

**Document ID:** 05-ENG-API-P1  
**Version:** v1.1 (Formatted)  
**Date:** 27 Feb 2026  
**Owner:** Darya Malak  
**Status:** Draft (endpoint baseline; OpenAPI conversion-ready)

---

## Table of Contents
1. [Purpose](#1-purpose)  
2. [API Conventions](#2-api-conventions)  
3. [Roles & Access](#3-roles--access-summary)  
4. [Public APIs](#4-public-apis-no-auth)  
5. [Auth & User](#5-auth--user)  
6. [Organizations](#6-organizations-org-scoped)  
7. [Projects](#7-projects)  
8. [Reports](#8-reports)  
9. [Evidence](#9-evidence)  
10. [Financial Snapshots](#10-financial-snapshots)  
11. [Certification (CTCF)](#11-certification-ctcf)  
12. [Amanah Index™](#12-amanah-index)  
13. [Donations](#13-donations)  
14. [Webhooks](#14-webhooks-no-auth--signature-required)  
15. [Admin / Reviewer](#15-admin--reviewer)  
16. [Scholar (MVP)](#16-scholar-mvp)  
17. [Audit Logs](#17-audit-logs-admin)  
18. [Operational Endpoints](#18-operational-endpoints-optional)  

---

## 1) Purpose
Defines the **Phase 1 REST API** for:
- Org onboarding, projects, reports, evidence
- Financial snapshots
- Certification + scoring
- Amanah Index™ score + history
- Donations + webhooks
- Admin/reviewer queues
- Audit logs

**Principles**
- JSON over HTTPS
- JWT Bearer auth for protected routes
- Idempotent webhooks
- Append-only histories (trust + score + audit)

---

## 2) API Conventions

### 2.1 Base URL
- `https://api.<domain>/v1`

### 2.2 Authentication
Protected endpoints require:
- `Authorization: Bearer <JWT>`

The server resolves:
- `users.platform_role`
- org-scoped role from `org_members.org_role`

### 2.3 Standard Response Envelope (recommended)
```json
{
  "ok": true,
  "data": {},
  "error": null
}
```

### 2.4 Error Format
```json
{
  "ok": false,
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Missing required field: name",
    "details": { "field": "name" }
  }
}
```

### 2.5 Pagination
- Query: `?limit=20&cursor=<opaque>`  
- Response:
```json
{
  "items": [],
  "next_cursor": null
}
```

### 2.6 Idempotency
For endpoints that create checkout sessions or trigger recalculation:
- Optional header: `Idempotency-Key: <string>`
- Server should return the same result when the same key is replayed within a defined window.

---

## 3) Roles & Access Summary
- **Public:** read-only directory and profiles
- **Donor:** donate and view own receipt (or via receipt token if anonymous)
- **Org Admin/Manager:** manage own org, projects, reports, evidence, financials, certification application
- **Reviewer:** review queues + decisions + evaluations
- **Scholar:** notes (MVP) + restricted reads
- **Super Admin:** full access + audit logs + operational tools

---

## 4) Public APIs (No Auth)

### 4.1 Charity Directory
#### `GET /public/charities`
Lists charities where `listing_status='listed'`.

**Query**
- `q` (search name)
- `org_type`
- `state`
- `limit`, `cursor`

**Response (200)**
```json
{
  "items": [
    {
      "id": "uuid",
      "name": "Charity Name",
      "summary": "Short public summary",
      "org_type": "ngo",
      "state": "Selangor",
      "certification_status": "certified",
      "amanah_score": 84.5,
      "updated_at": "2026-02-26T00:00:00Z"
    }
  ],
  "next_cursor": null
}
```

### 4.2 Charity Profile (Public)
#### `GET /public/charities/:orgId`
Returns public-safe org profile + certification + Amanah timeline preview.

### 4.3 Public Project Detail
#### `GET /public/projects/:projectId`
Returns public-safe project + verified report previews + approved evidence previews.

### 4.4 Public Evidence URL (Approved Only)
#### `GET /public/evidence/:evidenceId`
Returns a signed URL (or redirects) only if evidence is approved public.

---

## 5) Auth & User

### 5.1 Current User
#### `GET /me` (Auth required)
Returns current user and memberships.

---

## 6) Organizations (Org-scoped)
- `POST /orgs` — create organization (creator becomes org_admin)
- `GET /orgs/:orgId` — private org view (org member/reviewer/admin)
- `PATCH /orgs/:orgId` — update org (org_admin/org_manager)
- `POST /orgs/:orgId/onboarding/submit` — submit onboarding
- Memberships:
  - `GET /orgs/:orgId/members`
  - `POST /orgs/:orgId/members/invite`
  - `PATCH /orgs/:orgId/members/:memberId`

---

## 7) Projects
- `POST /orgs/:orgId/projects`
- `GET /orgs/:orgId/projects`
- `GET /orgs/:orgId/projects/:projectId`
- `PATCH /orgs/:orgId/projects/:projectId`
- `POST /orgs/:orgId/projects/:projectId/archive`

---

## 8) Reports
- `POST /orgs/:orgId/projects/:projectId/reports` — create draft
- `PATCH /orgs/:orgId/projects/:projectId/reports/:reportId` — update draft/changes_requested
- `POST /orgs/:orgId/projects/:projectId/reports/:reportId/submit`
- `GET /orgs/:orgId/projects/:projectId/reports/:reportId`
- `GET /orgs/:orgId/projects/:projectId/reports`

---

## 9) Evidence
- `POST /orgs/:orgId/reports/:reportId/evidence/upload-url` — pre-signed URL
- `POST /orgs/:orgId/reports/:reportId/evidence/:evidenceId/confirm` — metadata confirm
- `GET /orgs/:orgId/reports/:reportId/evidence` — list evidence for report

---

## 10) Financial Snapshots
- `PUT /orgs/:orgId/financials/:periodYear` — create/update
- `GET /orgs/:orgId/financials/:periodYear`
- `POST /orgs/:orgId/financials/:periodYear/submit`

---

## 11) Certification (CTCF)
- `POST /orgs/:orgId/certification/applications`
- `POST /orgs/:orgId/certification/applications/:applicationId/submit`
- `POST /orgs/:orgId/certification/applications/:applicationId/evaluate` (reviewer)
- `POST /orgs/:orgId/certification/applications/:applicationId/decision` (reviewer)
- `GET /orgs/:orgId/certification/status`

---

## 12) Amanah Index™
- `GET /orgs/:orgId/amanah`
- `GET /public/charities/:orgId/amanah`
- `POST /orgs/:orgId/amanah/recalculate` (reviewer/admin; audited)

---

## 13) Donations

### 13.1 Create Checkout Session
#### `POST /donations/checkout`
**Headers:** optional `Idempotency-Key`

**Body**
```json
{
  "organization_id": "uuid",
  "project_id": "uuid_optional",
  "amount": 50.00,
  "currency": "MYR",
  "platform_fee_amount": 2.00,
  "donor_email": "optional@example.com"
}
```

**Response**
```json
{
  "donation_transaction_id": "uuid",
  "status": "initiated",
  "gateway": "stripe",
  "checkout_url": "https://gateway/checkout/..."
}
```

### 13.2 Get Receipt/Status
#### `GET /donations/:donationTransactionId`
Returns receipt/status for donor (or via receipt token if anonymous policy is enabled).

---

## 14) Webhooks (No Auth — Signature Required)
#### `POST /webhooks/payments/:gateway`
**Behavior**
- Store event in `payment_webhook_events` (UQ: gateway+event_id)
- Verify signature (`signature_valid`)
- Resolve donation transaction
- Update donation status
- Append `trust_events(donation_confirmed)`
- Trigger Amanah recalculation (sync or queued)

**Response**
- `200 OK` accepted (including idempotent replays)
- `400` invalid signature (optional; still store event)

---

## 15) Admin / Reviewer
- Review queues:
  - `GET /admin/review-queue/onboarding`
  - `GET /admin/review-queue/reports`
  - `GET /admin/review-queue/certification`
- Decisions:
  - `POST /admin/orgs/:orgId/onboarding/decision`
  - `POST /admin/reports/:reportId/decision`
- Optional evidence publishing:
  - `POST /admin/evidence/:evidenceId/approve-public`

---

## 16) Scholar (MVP)
- `POST /orgs/:orgId/scholar/notes`
- `GET /orgs/:orgId/scholar/notes`

---

## 17) Audit Logs (Admin)
- `GET /admin/audit-logs`
Filters: `org_id`, `actor_user_id`, `action`, `from`, `to`, `limit`, `cursor`

---

## 18) Operational Endpoints (Optional)
- `GET /health`
- `POST /admin/reconcile/donations/:donationTransactionId`
