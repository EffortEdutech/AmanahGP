# Sadaqah Jariah Platform — Data Model (ERD + Data Dictionary) (Phase 1)

**Document ID:** 05-ENG-DATA-P1  
**Version:** v1.1 (Formatted)  
**Date:** 27 Feb 2026  
**Owner:** Darya Malak  
**Status:** Draft (baseline schema for Phase 1)

---

## Table of Contents
1. [Purpose](#1-purpose)  
2. [Conventions](#2-conventions)  
3. [Entity Relationship Diagram](#3-entity-relationship-diagram-erd--high-level)  
4. [Data Classification](#4-data-classification-public-vs-private)  
5. [Core Tables](#5-core-tables-data-dictionary)  
6. [Indexes & Query Strategy](#6-indexes--query-strategy)  
7. [Enumerations](#7-enumerations-recommended-values)  
8. [Access Control Rules](#8-access-control-rules-phase-1)  
9. [Seed Data Requirements](#9-seed-data-requirements-devstaging)  

---

## 1) Purpose
This document defines the **Phase 1 data model** for the Sadaqah Jariah Platform:
- Core entities and relationships (ERD)
- Table-by-table **data dictionary** (fields, types, constraints)
- Index strategy
- Public vs Private data classification
- Access rules (RBAC-oriented)

**Design principles**
- PostgreSQL as the system of record
- Immutable histories for trust: **trust_events** and **amanah_index_history**
- Versioned scoring for CTCF and Amanah Index
- Evidence files are private-by-default; public exposure is controlled by approvals

---

## 2) Conventions

### 2.1 Naming
- Tables: `snake_case` plural (e.g., `organizations`, `projects`)
- Primary keys: `id` (UUID)
- Foreign keys: `<table>_id` (e.g., `organization_id`)
- Timestamps: `created_at`, `updated_at`, optional `deleted_at` (soft delete)

### 2.2 Types (recommended)
- `uuid` for IDs
- `timestamptz` for timestamps
- `text` for strings
- `numeric(12,2)` for currency-like amounts
- `jsonb` for flexible payloads (report body, scoring breakdown, audit metadata)
- `boolean` for flags

### 2.3 Standard Columns
Use in most tables:
- `id uuid primary key default gen_random_uuid()`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

---

## 3) Entity Relationship Diagram (ERD) — High Level

```text
users
  1 ───< org_members >─── 1 organizations
  1 ───< donation_transactions
  1 ───< audit_logs
  1 ───< scholar_notes (optional)

organizations
  1 ───< projects
  1 ───< project_reports
  1 ───< financial_snapshots
  1 ───< certification_applications
  1 ───< certification_evaluations
  1 ───< certification_history
  1 ───< trust_events
  1 ───< amanah_index_history
  1 ───< evidence_files (via reports)

projects
  1 ───< project_reports
  1 ───< donation_transactions

project_reports
  1 ───< evidence_files

donation_transactions
  1 ───< payment_webhook_events
```

---

## 4) Data Classification (Public vs Private)

### 4.1 Public (only after approval/verification)
- Organization: name, summary, approved classification highlights
- Projects: title, objective, verified updates, selected approved evidence
- Certification status + validity window
- Amanah Index current score + timeline (public-safe summaries)

### 4.2 Private (never public)
- Personal data: emails, phone, internal notes
- Raw evidence files (until explicitly approved)
- Reviewer notes, scholar notes (unless marked publishable)
- Webhook payloads/signatures/internal ids
- Audit logs (internal)

### 4.3 Public exposure controls (recommended)
- `organizations.listing_status` controls directory visibility
- `project_reports.verification_status` controls report visibility
- `evidence_files.visibility` + `is_approved_public` controls file visibility

---

## 5) Core Tables (Data Dictionary)

> **Legend**  
> **PK** = Primary Key • **FK** = Foreign Key • **UQ** = Unique • **IDX** = Index recommended • **PII** = Personal data (private)

### 5.1 `users`
**Purpose:** application users linked to auth provider.

| Field | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK | Internal user id |
| auth_provider | text | not null | e.g., `supabase` |
| auth_provider_user_id | text | UQ, not null | External auth user id |
| email | text | UQ, not null | **PII** |
| display_name | text | null | optional |
| platform_role | text | not null default `donor` | `donor/reviewer/scholar/super_admin` |
| is_active | boolean | not null default true |  |
| last_login_at | timestamptz | null | optional |
| created_at | timestamptz | not null |  |
| updated_at | timestamptz | not null |  |

**Indexes**
- UQ: `(auth_provider, auth_provider_user_id)`
- UQ: `(email)`

---

### 5.2 `organizations`
**Purpose:** organization profile + onboarding lifecycle.

| Field | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK |  |
| name | text | not null | public after approval |
| legal_name | text | null | private by default |
| registration_no | text | null | private by default |
| website_url | text | null | public after approval |
| contact_email | text | null | private by default |
| contact_phone | text | null | **PII** |
| address_text | text | null | private unless published |
| country | text | not null default `MY` | Phase 1 |
| state | text | null | Malaysia state |
| org_type | text | null | e.g., `ngo`, `mosque_surau`, `waqf_institution` |
| oversight_authority | text | null | e.g., `SIRC`, `ROS`, `SSM`, trustees |
| fund_types | text[] | null | e.g., `{zakat, waqf, sadaqah}` |
| summary | text | null | public after approval |
| onboarding_status | text | not null default `draft` | lifecycle |
| listing_status | text | not null default `private` | `private/listed/unlisted/suspended` |
| onboarding_submitted_at | timestamptz | null |  |
| approved_at | timestamptz | null |  |
| approved_by_user_id | uuid | FK -> users.id | reviewer/admin |
| created_at | timestamptz | not null |  |
| updated_at | timestamptz | not null |  |

**Indexes**
- IDX: `(onboarding_status)`
- IDX: `(listing_status)`
- IDX: `(state)`
- IDX: `(org_type)`

---

### 5.3 `org_members`
**Purpose:** organization membership and org-scoped roles.

| Field | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK |  |
| organization_id | uuid | FK -> organizations.id, not null |  |
| user_id | uuid | FK -> users.id, not null |  |
| org_role | text | not null | `org_admin/org_manager/org_viewer` |
| status | text | not null default `active` | `invited/active/removed` |
| invited_by_user_id | uuid | FK -> users.id |  |
| invited_at | timestamptz | null |  |
| accepted_at | timestamptz | null |  |
| created_at | timestamptz | not null |  |
| updated_at | timestamptz | not null |  |

**Constraints**
- UQ: `(organization_id, user_id)`

**Indexes**
- IDX: `(organization_id)`
- IDX: `(user_id)`

---

### 5.4 `projects`
**Purpose:** projects owned by organizations.

| Field | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK |  |
| organization_id | uuid | FK -> organizations.id, not null |  |
| title | text | not null | public after approval |
| objective | text | not null |  |
| description | text | null |  |
| location_text | text | null | optional public |
| start_date | date | null |  |
| end_date | date | null |  |
| budget_amount | numeric(12,2) | null | MYR assumed |
| currency | text | not null default `MYR` |  |
| beneficiary_summary | text | null |  |
| kpi_targets | jsonb | null | flexible |
| status | text | not null default `active` | `draft/active/completed/archived` |
| is_public | boolean | not null default false | derived |
| created_at | timestamptz | not null |  |
| updated_at | timestamptz | not null |  |

**Indexes**
- IDX: `(organization_id)`
- IDX: `(status)`
- IDX: `(is_public)`

---

### 5.5 `project_reports`
**Purpose:** progress reports tied to projects (draft/submitted/verified).

| Field | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK |  |
| organization_id | uuid | FK -> organizations.id, not null | denormalized |
| project_id | uuid | FK -> projects.id, not null |  |
| title | text | not null |  |
| report_body | jsonb | not null default `{}` | evolving |
| report_date | date | null | event date |
| submission_status | text | not null default `draft` | `draft/submitted` |
| verification_status | text | not null default `pending` | `pending/changes_requested/verified/rejected` |
| submitted_at | timestamptz | null |  |
| verified_at | timestamptz | null |  |
| verified_by_user_id | uuid | FK -> users.id | reviewer |
| reviewer_comment | text | null | private |
| created_at | timestamptz | not null |  |
| updated_at | timestamptz | not null |  |

**Indexes**
- IDX: `(project_id)`
- IDX: `(organization_id)`
- IDX: `(verification_status)`
- IDX: `(submitted_at)`

---

### 5.6 `evidence_files`
**Purpose:** evidence artifacts linked to reports (file + metadata + visibility).

| Field | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK |  |
| organization_id | uuid | FK -> organizations.id, not null |  |
| project_report_id | uuid | FK -> project_reports.id, not null |  |
| file_name | text | not null | original name |
| mime_type | text | not null |  |
| storage_bucket | text | not null | e.g., `evidence` |
| storage_path | text | not null | object key |
| file_size_bytes | bigint | null |  |
| sha256 | text | null | optional |
| captured_at | timestamptz | null | timestamp |
| geo_lat | numeric(10,7) | null | optional |
| geo_lng | numeric(10,7) | null | optional |
| visibility | text | not null default `private` | `private/reviewer_only/public` |
| is_approved_public | boolean | not null default false | public gate |
| approved_by_user_id | uuid | FK -> users.id | reviewer/admin |
| approved_at | timestamptz | null |  |
| created_at | timestamptz | not null |  |
| updated_at | timestamptz | not null |  |

**Indexes**
- IDX: `(project_report_id)`
- IDX: `(organization_id)`
- IDX: `(visibility, is_approved_public)`

---

### 5.7 `financial_snapshots`
**Purpose:** minimal financial submission per org (versioned by period year).

| Field | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK |  |
| organization_id | uuid | FK -> organizations.id, not null |  |
| period_year | int | not null | e.g., 2025 |
| currency | text | not null default `MYR` |  |
| inputs | jsonb | not null default `{}` | form data |
| submission_status | text | not null default `draft` | `draft/submitted` |
| verification_status | text | not null default `pending` | `pending/verified/changes_requested/rejected` |
| submitted_at | timestamptz | null |  |
| verified_at | timestamptz | null |  |
| verified_by_user_id | uuid | FK -> users.id | reviewer |
| reviewer_comment | text | null | private |
| created_at | timestamptz | not null |  |
| updated_at | timestamptz | not null |  |

**Constraints**
- UQ: `(organization_id, period_year)`

**Indexes**
- IDX: `(organization_id, period_year)`
- IDX: `(verification_status)`

---

### 5.8 `certification_applications`
**Purpose:** org request to be evaluated for certification.

| Field | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK |  |
| organization_id | uuid | FK -> organizations.id, not null |  |
| status | text | not null default `draft` | `draft/submitted/under_review/approved/rejected` |
| submitted_at | timestamptz | null |  |
| submitted_by_user_id | uuid | FK -> users.id | org member |
| reviewer_assigned_user_id | uuid | FK -> users.id | optional |
| reviewer_comment | text | null | private |
| created_at | timestamptz | not null |  |
| updated_at | timestamptz | not null |  |

**Indexes**
- IDX: `(organization_id)`
- IDX: `(status)`

---

### 5.9 `certification_evaluations`
**Purpose:** computed scoring output per evaluation run (versioned criteria).

| Field | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK |  |
| organization_id | uuid | FK -> organizations.id, not null |  |
| certification_application_id | uuid | FK -> certification_applications.id | nullable |
| criteria_version | text | not null | e.g., `ctcf_v1` |
| total_score | numeric(5,2) | not null | 0–100 |
| score_breakdown | jsonb | not null default `{}` | layer/category |
| computed_at | timestamptz | not null default now() |  |
| computed_by_user_id | uuid | FK -> users.id | reviewer/admin/system |
| notes | text | null | internal |
| created_at | timestamptz | not null |  |
| updated_at | timestamptz | not null |  |

**Indexes**
- IDX: `(organization_id, computed_at desc)`
- IDX: `(criteria_version)`

---

### 5.10 `certification_history`
**Purpose:** immutable history of certification status changes.

| Field | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK |  |
| organization_id | uuid | FK -> organizations.id, not null |  |
| certification_application_id | uuid | FK -> certification_applications.id | nullable |
| evaluation_id | uuid | FK -> certification_evaluations.id | nullable |
| previous_status | text | null |  |
| new_status | text | not null | `certified/not_certified/suspended` |
| valid_from | date | null |  |
| valid_to | date | null |  |
| decided_by_user_id | uuid | FK -> users.id, not null | reviewer/admin |
| decision_reason | text | null | internal |
| decided_at | timestamptz | not null default now() |  |
| created_at | timestamptz | not null |  |
| updated_at | timestamptz | not null |  |

**Indexes**
- IDX: `(organization_id, decided_at desc)`
- IDX: `(new_status)`

---

### 5.11 `trust_events`
**Purpose:** append-only event log feeding Amanah Index™.

| Field | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK |  |
| organization_id | uuid | FK -> organizations.id, not null |  |
| event_type | text | not null | `report_verified`, `donation_confirmed`, etc. |
| event_ref_table | text | null | optional |
| event_ref_id | uuid | null | optional |
| payload | jsonb | not null default `{}` | public-safe |
| occurred_at | timestamptz | not null default now() |  |
| actor_user_id | uuid | FK -> users.id | null if system/webhook |
| source | text | not null default `system` | `user/reviewer/webhook/system` |
| idempotency_key | text | null | for dedupe |
| created_at | timestamptz | not null |  |
| updated_at | timestamptz | not null |  |

**Constraints (recommended)**
- UQ: `(organization_id, idempotency_key)` where key exists

**Indexes**
- IDX: `(organization_id, occurred_at desc)`
- IDX: `(event_type)`
- IDX: `(idempotency_key)`

---

### 5.12 `amanah_index_history`
**Purpose:** immutable score timeline (public + audit).

| Field | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK |  |
| organization_id | uuid | FK -> organizations.id, not null |  |
| score_version | text | not null | `amanah_v1` |
| score_value | numeric(5,2) | not null | 0–100 |
| computed_at | timestamptz | not null default now() |  |
| computed_from_event_id | uuid | FK -> trust_events.id | optional |
| breakdown | jsonb | not null default `{}` | internal |
| public_summary | text | null | donor-friendly |
| created_at | timestamptz | not null |  |
| updated_at | timestamptz | not null |  |

**Indexes**
- IDX: `(organization_id, computed_at desc)`
- IDX: `(score_version)`

---

### 5.13 `donation_transactions`
**Purpose:** donation initiation and status (non-custodial checkout).

| Field | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK |  |
| organization_id | uuid | FK -> organizations.id, not null |  |
| project_id | uuid | FK -> projects.id | nullable |
| donor_user_id | uuid | FK -> users.id | nullable |
| donor_email | text | null | **PII** optional |
| amount | numeric(12,2) | not null | donation |
| platform_fee_amount | numeric(12,2) | not null default 0 | optional |
| currency | text | not null default `MYR` |  |
| status | text | not null default `initiated` | `initiated/pending/confirmed/failed/canceled` |
| gateway | text | not null | `stripe/duitnow/paypal` |
| gateway_checkout_id | text | null | session id |
| gateway_transaction_id | text | null | final id |
| initiated_at | timestamptz | not null default now() |  |
| confirmed_at | timestamptz | null |  |
| failure_reason | text | null | internal |
| created_at | timestamptz | not null |  |
| updated_at | timestamptz | not null |  |

**Constraints (recommended)**
- UQ: `(gateway, gateway_transaction_id)` where transaction id exists

**Indexes**
- IDX: `(organization_id, initiated_at desc)`
- IDX: `(project_id)`
- IDX: `(status)`
- IDX: `(gateway_transaction_id)`

---

### 5.14 `payment_webhook_events`
**Purpose:** raw webhook capture + processing outcomes.

| Field | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK |  |
| gateway | text | not null |  |
| event_id | text | not null | gateway event id |
| donation_transaction_id | uuid | FK -> donation_transactions.id | nullable |
| received_at | timestamptz | not null default now() |  |
| payload | jsonb | not null | raw (sanitize as needed) |
| headers | jsonb | null | optional |
| signature_valid | boolean | not null default false |  |
| processed | boolean | not null default false |  |
| processed_at | timestamptz | null |  |
| processing_error | text | null |  |
| created_at | timestamptz | not null |  |
| updated_at | timestamptz | not null |  |

**Constraints**
- UQ: `(gateway, event_id)`

**Indexes**
- IDX: `(donation_transaction_id)`
- IDX: `(received_at desc)`
- IDX: `(processed, signature_valid)`

---

### 5.15 `audit_logs`
**Purpose:** append-only audit records for sensitive actions.

| Field | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK |  |
| actor_user_id | uuid | FK -> users.id | null if system |
| actor_role | text | null | snapshot |
| organization_id | uuid | FK -> organizations.id | nullable |
| action | text | not null | e.g., `REPORT_VERIFIED` |
| entity_table | text | null | e.g., `project_reports` |
| entity_id | uuid | null |  |
| metadata | jsonb | not null default `{}` | context |
| occurred_at | timestamptz | not null default now() |  |
| ip_address | text | null | optional |
| user_agent | text | null | optional |
| created_at | timestamptz | not null |  |
| updated_at | timestamptz | not null |  |

**Indexes**
- IDX: `(occurred_at desc)`
- IDX: `(organization_id, occurred_at desc)`
- IDX: `(actor_user_id, occurred_at desc)`
- IDX: `(action)`

---

## 6) Indexes & Query Strategy
**Common queries**
- Directory: listed orgs by `(listing_status, org_type, state)`
- Charity profile: latest certification + latest amanah + recent verified reports
- Reviewer queues: items by status and submission time
- Timelines: events and score history by `(organization_id, occurred_at desc)`

**Performance notes**
- Keep `trust_events` and `amanah_index_history` append-only
- Use pagination for histories and directory
- Add read-optimized views later only if needed

---

## 7) Enumerations (Recommended Values)
See: platform roles, org roles, onboarding statuses, listing statuses, report verification statuses, donation statuses, evidence visibility.

---

## 8) Access Control Rules (Phase 1)
- Org members access only their org’s resources
- Reviewers/Admins can access review queues and decisions
- Scholars have restricted reads + notes
- Public reads only listed/verified/approved resources

If using Supabase RLS:
- enable RLS on all tables
- enforce org-scoped access via `org_members`
- restrict webhook/audit tables to admin roles only

---

## 9) Seed Data Requirements (Dev/Staging)
Minimum seed set for stable demos:
- Users: super_admin, reviewer, scholar, org_admin, donor
- Orgs: one draft, one submitted, one approved+listed
- Approved org has: 1 project, 1 verified report, 1 public-approved evidence
- Financial snapshot: verified for the approved org
- Certification: evaluation + history entry
- Amanah: at least one history entry
- Donations: one initiated, one confirmed + corresponding webhook event and trust event
