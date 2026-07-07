# Amanah Index V2.1 Sprint Plan

## Purpose

This document converts the score deduction and trust freshness discussion into an executable upgrade plan for Amanah Governance Platform.

The goal is to evolve AGP from a mostly static certification score into a layered trust model that can show both:

- the organisation's official certified trust position; and
- the organisation's current trust health based on recent governance activity, freshness, momentum, and risk.

This upgrade must not discard the existing Amanah Index, CTCF, trust event, or AmanahOS finance work. It should harden the existing implementation and introduce a clearer V2.1 scoring contract on top of it.

## Current State Summary

The current codebase already contains several pieces of the future model:

- `amanah_v1` scoring exists in `packages/scoring`.
- `amanah_index_history.score_value` is bounded at 0-100.
- `trust_events` already exists as an append-only event log.
- `amanah_v2_events` exists as an event-based score version.
- `0024_repair_amanah_v2_scoring_baseline.sql` already repaired event-only scoring into a hybrid model:
  - 70% certification baseline
  - 30% event score
  - risk penalties
- `apply_score_decay` exists but is still a fixed monthly negative-event mechanism.
- AmanahOS finance actions already emit trust events through database triggers for:
  - period close
  - bank reconciliation
  - payment approval
  - bank account creation
- AmanahHub public profile code has moved toward canonical `amanah_index_*` fields.

The next upgrade should therefore be an evolution, not a rewrite.

## Core Product Decision

AGP should separate four concepts that are currently partially mixed:

| Concept | Meaning | Public? | Can Decay? | Can Exceed 100? |
|---|---|---:|---:|---:|
| Certified Trust Score | Official reviewer/certification score | Yes | No | No |
| Current Trust Health | Current trust condition after freshness, momentum, and risk | Yes, if published | Yes | No |
| Trust Momentum | Recent positive operational activity | Maybe | Windowed | Internally normalized |
| Risk Modifier | Active unresolved risks | Maybe as status | Yes | No |

The public should not see a single unexplained score that silently mixes certification, recent behaviour, and risk.

Recommended public language:

- **Certified Trust Score**
- **Current Trust Health**
- **Freshness**
- **Risk Status**

## Proposed Amanah Index V2.1 Formula

The recommended model is:

```text
current_trust_health =
  (
    certified_score * 0.65
    + event_score * 0.20
    + momentum_score * 0.15
  )
  * freshness_factor
  * risk_modifier
```

Rules:

- Final score must always be clamped to 0-100.
- Certified Trust Score remains separately visible and append-only.
- Good events improve current health slowly, especially near 100.
- Inactivity reduces current trust health, not the certified score itself.
- Serious unresolved risk can cap or reduce current health.
- Old `amanah_v1` and `amanah_v2_events` history rows must remain untouched.
- New calculations should use `score_version = 'amanah_v2_1'`.

## Sprint 0 - Stabilisation And Audit

### Objective

Make sure the existing database and code assumptions are safe before changing scoring.

### Scope

- Fix local Git safe-directory issue so project changes can be tracked.
- Audit the migration chain against the generated database schema.
- Confirm whether live DB contains event types that are missing from migration files.
- Identify all code paths reading:
  - `amanah_index_history`
  - `trust_events`
  - public AmanahHub views
  - AmanahOS trust dashboard
  - AGP Console trust snapshots/events

### Known Risks To Verify

- App code inserts `trust_snapshot_published`.
- App code inserts `trust_snapshot_unpublished`.
- App code inserts `gov_case_*` event types.
- `publication-command` uses `source = 'approval'`.
- Base schema allows only `source in ('user','reviewer','webhook','system')`.
- Migration `0023_trust_event_engine.sql` may not include all event types used by later AGP Console code.

### Deliverables

- Migration and app mismatch report.
- Event type compatibility list.
- Decision on canonical `trust_events.source` values.
- No scoring algorithm changes yet.

### Acceptance Criteria

- Every app-emitted trust event type is accepted by the database.
- Every app-emitted trust event source is accepted by the database.
- We know which score source each frontend currently uses.
- Git can report status cleanly.

## Sprint 1 - Scoring Contract V2.1

### Objective

Create a formal scoring contract before coding the new model.

### Scope

Define the exact meaning of:

- `certified_score`
- `event_score`
- `freshness_factor`
- `momentum_score`
- `risk_modifier`
- `current_trust_health`

### Decisions Required

- Should public AmanahHub show both certified score and current trust health?
- Should freshness affect all organisations equally or depend on organisation type?
- Should mosque, waqf, zakat body, and NGO expectations differ?
- Should risk reduce final score, cap domain score, or both?
- Should momentum be public or AmanahOS-only?

### Deliverables

- `docs/00_Upgrade/Amanah Index V2.1 Scoring Contract.md`
- Final approved formula.
- Final approved domain list.
- Final approved decay/freshness windows.

### Acceptance Criteria

- A reviewer can explain the score.
- An organisation can understand how to improve current health.
- A donor can understand the difference between certified score and current health.
- The model cannot produce scores above 100.

## Sprint 2 - Schema Upgrade

### Objective

Add first-class storage for trust domains, freshness, momentum, and risk.

### Proposed Table

```sql
create table public.organization_trust_domains (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  domain text not null check (domain in (
    'financial_integrity',
    'governance',
    'compliance',
    'transparency',
    'impact',
    'risk'
  )),
  base_score numeric(5,2) not null default 0 check (base_score between 0 and 100),
  freshness_factor numeric(4,3) not null default 1.000 check (freshness_factor between 0 and 1),
  momentum_score numeric(5,2) not null default 0 check (momentum_score between 0 and 100),
  risk_modifier numeric(4,3) not null default 1.000 check (risk_modifier between 0 and 1),
  effective_score numeric(5,2) not null default 0 check (effective_score between 0 and 100),
  last_positive_event_at timestamptz,
  last_negative_event_at timestamptz,
  last_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, domain)
);
```

### Proposed View

```text
public.v_amanah_index_v21_current
```

Suggested fields:

- `organization_id`
- `certified_score`
- `event_score`
- `freshness_score`
- `momentum_score`
- `risk_modifier`
- `current_trust_health`
- `breakdown`
- `computed_at`

### Deliverables

- Supabase migration.
- RLS policies.
- Indexes.
- Backfill script or SQL function.

### Acceptance Criteria

- Every listed organisation can have one row per trust domain.
- Domain scores are tenant-scoped by `organization_id`.
- No score-related numeric field can exceed its valid range.

## Sprint 3 - Freshness Engine

### Objective

Replace crude monthly point deduction with a defensible freshness model.

### Domain Expectations

| Domain | Expected Activity | Expected Frequency |
|---|---|---|
| Financial Integrity | month close, bank reconciliation | monthly |
| Governance | board meeting, policy review, approvals | quarterly |
| Compliance | audit, regulatory filing, shariah review | annually |
| Transparency | annual report, public financial disclosure | annually |
| Impact | project report, beneficiary verification | quarterly |

### Suggested Default Freshness Curve

```text
0-30 days:     1.00
31-60 days:    0.95
61-90 days:    0.90
91-180 days:   0.80
181-365 days:  0.70
365+ days:     0.60
```

### Suggested Finance Freshness Curve

```text
0-45 days:     1.00
46-75 days:    0.90
76-120 days:   0.80
121+ days:     0.65
```

### Deliverables

- `calculate_trust_freshness(p_org_id uuid)`
- Scheduled Edge Function or RPC wrapper.
- Updated breakdown JSON for `amanah_v2_1`.
- Decision on whether old `apply_score_decay` remains active, is deprecated, or is converted into freshness updates.

### Acceptance Criteria

- An organisation with no finance activity for 8 months loses current health.
- Certified Trust Score remains unchanged.
- The score reduction is explainable by domain freshness.
- No repeated monthly negative events are required to represent freshness.

## Sprint 4 - Momentum Engine

### Objective

Reward continuous governance activity without inflating the public score.

### Momentum Windows

Calculate activity across:

- 30 days
- 90 days
- 365 days

### Example Event Weights

| Event | Momentum Effect |
|---|---:|
| `fi_period_closed` | +8 |
| `fi_bank_reconciled` | +6 |
| `gov_payment_dual_approved` | +4 |
| `gov_policy_uploaded` | +10 |
| `trn_financial_published` | +12 |
| `trn_annual_report_published` | +15 |
| `imp_program_completed` | +12 |
| `gov_payment_self_approved` | -20 |
| `fi_bank_discrepancy` | -12 |
| `com_audit_overdue` | -25 |

### Deliverables

- `calculate_trust_momentum(p_org_id uuid)`
- Domain-level momentum breakdown.
- AmanahOS dashboard section for recent momentum.

### Acceptance Criteria

- Momentum can rise with regular good activity.
- Momentum does not allow current health to exceed 100.
- Momentum declines naturally as events age out of the rolling window.

## Sprint 5 - Risk Modifier Engine

### Objective

Make serious unresolved risks reduce trust in a controlled and explainable way.

### Risk Examples

- Self-approval in the last 12 months.
- Audit overdue.
- No month close for 3 months.
- Unresolved complaint.
- Unresolved bank discrepancy.
- Shariah non-compliance.
- Suspicious login or audit tampering.

### Suggested Modifier Scale

| Risk State | Modifier |
|---|---:|
| No active risk | 1.00 |
| Minor unresolved issue | 0.95 |
| Medium risk | 0.85 |
| Serious risk | 0.70 |
| Critical risk | 0.50 |

### Deliverables

- `calculate_risk_modifier(p_org_id uuid)`
- Risk registry in scoring breakdown.
- AGP Console risk review panel.
- AmanahOS remediation recommendations.

### Acceptance Criteria

- A self-approval event reduces current trust health.
- A resolved/remediated issue can stop future penalty.
- Risk status is visible to AGP Console.
- Public display can show simplified risk status.

## Sprint 6 - V2.1 Recalculation Function

### Objective

Create the canonical V2.1 scoring function.

### Function

```sql
public.recalculate_amanah_index_v21(
  p_org_id uuid,
  p_trigger_event_id uuid default null
)
```

### Function Steps

1. Load latest certified score from `certification_evaluations`.
2. Calculate event score from `trust_events`.
3. Calculate freshness factor from domain recency.
4. Calculate momentum score from rolling windows.
5. Calculate risk modifier.
6. Calculate `current_trust_health`.
7. Clamp score to 0-100.
8. Append to `amanah_index_history`.
9. Store `score_version = 'amanah_v2_1'`.
10. Store a full JSON breakdown.

### Deliverables

- Supabase migration.
- SQL test cases.
- Optional TypeScript mirror in `packages/scoring`.

### Acceptance Criteria

- `95 + good activity` never becomes more than 100.
- Inactivity reduces current health.
- Risk reduces current health.
- Certified score remains unchanged.
- Every recalculation is append-only.

## Sprint 7 - Public Display Contract

### Objective

Make score presentation understandable and non-misleading.

### AmanahHub Public Display

Recommended fields:

```text
Certified Trust Score: 95/100
Current Trust Health: 91/100
Freshness: Active
Risk Status: Low
Last Updated: 25 June 2026
```

### AmanahOS Display

Show operational detail:

- Current Trust Health
- Certified Trust Score
- Freshness by domain
- Momentum this quarter
- Active risk flags
- Recommended next actions

### AGP Console Display

Show full audit detail:

- Certified score source
- Event score
- Freshness calculation
- Risk modifier
- Domain breakdown
- Triggering event
- Reviewer notes

### Deliverables

- Updated AmanahHub profile components.
- Updated AmanahOS trust dashboard wording.
- Updated AGP Console trust event/snapshot pages.

### Acceptance Criteria

- Donors understand the public score.
- Organisations understand what to improve.
- Reviewers can audit every score component.
- No UI describes the old `1000 points normalized to 100` model if the real formula is V2.1 hybrid scoring.

## Sprint 8 - Trust Event Registry

### Objective

Centralize trust event definitions so DB triggers, app code, scoring, and UI do not drift.

### Proposed Location

Either:

- `packages/scoring/src/trust-events.ts`; or
- a new package `packages/trust-engine`.

### Example Registry Entry

```ts
{
  eventType: 'fi_bank_reconciled',
  domain: 'financial_integrity',
  defaultScoreDelta: 6,
  momentumWeight: 6,
  freshnessSignal: true,
  riskSignal: false,
  publicSafe: true,
  label: 'Bank account reconciled'
}
```

### Deliverables

- Event registry.
- Shared TypeScript types.
- Updated UI labels where practical.
- Event compatibility documentation.

### Acceptance Criteria

- No new event type is introduced without registry entry.
- Score deltas and UI labels are not duplicated across many files.
- Migration event constraints match the registry.

## Sprint 9 - Backfill And Migration Safety

### Objective

Safely migrate existing organisations into V2.1.

### Backfill Steps

1. For each organisation, load latest certification score.
2. Read existing trust events.
3. Calculate domain freshness.
4. Calculate momentum.
5. Calculate risk modifier.
6. Insert one `amanah_v2_1` row into `amanah_index_history`.
7. Do not delete or mutate old rows.

### Validation Queries

- No `amanah_v2_1` score below 0.
- No `amanah_v2_1` score above 100.
- Every listed organisation has a current V2.1 row.
- Every published public profile resolves a public score.
- Every event used by scoring has a registered event type.

### Deliverables

- Backfill SQL or script.
- Dry-run report.
- Rollback notes.

### Acceptance Criteria

- Backfill can run repeatedly without duplicating unintended rows.
- Public scores remain available after migration.
- Old score history remains intact.

## Sprint 10 - QA And Governance Acceptance

### Objective

Prove the model is trustworthy before launch.

### Required Test Cases

#### Case 1: Excellent Organisation With Continued Compliance

Input:

- Certified score: 95
- Several good events in the year

Expected:

- Certified score remains 95.
- Current trust health improves slightly or remains strong.
- Score never exceeds 100.

#### Case 2: Excellent Organisation With No Activity

Input:

- Certified score: 95
- No finance, governance, transparency, or impact activity for 8 months

Expected:

- Certified score remains 95.
- Current trust health declines.
- Freshness shows stale domains.

#### Case 3: Self-Approval Risk

Input:

- Payment request approved by creator

Expected:

- Governance risk appears.
- Risk modifier applies.
- Current trust health drops.
- Remediation is visible.

#### Case 4: Annual Report Published

Input:

- Annual report published

Expected:

- Transparency freshness resets.
- Momentum improves.
- Current health may improve within cap.

#### Case 5: Bank Discrepancy

Input:

- Bank reconciliation discrepancy recorded

Expected:

- Financial risk appears.
- Current trust health drops.
- Later reconciliation/remediation can restore freshness/risk state.

### Deliverables

- QA checklist.
- SQL validation queries.
- Updated runbook.
- Launch decision note.

### Acceptance Criteria

- Product owner can explain the model.
- Reviewers can audit it.
- Organisations can act on it.
- Donors are not misled.
- No score can exceed 100.

## Recommended Execution Order

1. Sprint 0 - Stabilisation And Audit
2. Sprint 1 - Scoring Contract V2.1
3. Sprint 2 - Schema Upgrade
4. Sprint 3 - Freshness Engine
5. Sprint 4 - Momentum Engine
6. Sprint 5 - Risk Modifier Engine
7. Sprint 6 - V2.1 Recalculation Function
8. Sprint 7 - Public Display Contract
9. Sprint 8 - Trust Event Registry
10. Sprint 9 - Backfill And Migration Safety
11. Sprint 10 - QA And Governance Acceptance

## Implementation Guardrails

- Do not delete old `amanah_v1` or `amanah_v2_events` history.
- Do not mutate append-only score or trust event history.
- Do not make event activity the official certification score.
- Do not expose raw operational risk details publicly without reviewer approval.
- Do not let public score fields silently switch meaning without UI label changes.
- Keep `organization_id` as the tenant boundary everywhere.
- Keep service role usage server-side only.
- Every new scoring function must clamp output to 0-100.
- Every public score must be explainable from stored breakdown data.

## Open Decisions

- Should `current_trust_health` be public by default, or only after a trust snapshot is published?
- Should org type affect freshness windows?
- Should risk apply as a multiplier, hard cap, fixed penalty, or a combination?
- Should momentum be shown publicly or only internally?
- Should `apply_score_decay` be fully deprecated after freshness is introduced?
- Should `packages/trust-engine` be created now, or should V2.1 stay inside `packages/scoring` first?

## Recommended Next Step

Begin with Sprint 0 and Sprint 1 only.

The current implementation already contains V2 pieces, but the migration chain, event registry, and UI meaning must be made consistent before changing the scoring algorithm. Once the scoring contract is approved, implementation can proceed safely.
