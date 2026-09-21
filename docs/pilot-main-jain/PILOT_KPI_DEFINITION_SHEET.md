# Pilot KPI Definition Sheet

Purpose: define the pilot KPI baseline so MAIN/JAIN exit evidence is consistent across cohorts and reporting periods.

## Cohort

Primary seeded cohort: `MAIN-PILOT-2026-Q3`.

KPI snapshots are stored in `pilot_kpi_snapshots` and supported by `pilot_metric_events`, `pilot_feedback`, and `pilot_support_incidents`.

## KPI Definitions

| KPI | Definition | Source |
|---|---|---|
| Active organisations | Count of active pilot organisations in cohort | `pilot_cohort_organizations` |
| Submission total | Count of regulatory submissions in period | `regulatory_submissions` |
| Accepted submissions | Count of accepted submissions in period | `regulatory_submissions.review_status` |
| Late or overdue submissions | Count with `late` or `overdue` late status | `regulatory_submissions.late_status` |
| Obligations total | Count of authority obligations in period/cohort | `authority_obligations` |
| Overdue obligations | Count of obligations with overdue status | `authority_obligations.status` |
| Exceptions total | Count of authority exceptions | `authority_exceptions` |
| High/critical exceptions | Count of exceptions marked high or critical | `authority_exceptions.severity` |
| Evidence links total | Count of reviewable evidence links | `authority_evidence_links` |
| State report packs total | Count of generated state report packs | `authority_state_report_packs` |
| Feedback average rating | Average rating from pilot feedback | `pilot_feedback.rating` |
| Support incidents open/resolved | Support incident status counts | `pilot_support_incidents.status` |
| Metric events total | Count of metric events captured | `pilot_metric_events` |

## Reporting Rules

- KPI outputs are portfolio-scoped by authority, jurisdiction, and cohort.
- KPI outputs must not expose private ledger lines, bank account records, private documents, payment request internals, or raw evidence files.
- Baseline and pilot-period calculations must use the same definitions.
- Any manual KPI adjustment must be recorded in `kpi_payload` or the freeze note.

## Pilot Exit Evidence

The pilot freeze pack should include:

- latest KPI snapshot reference;
- submission timeliness summary;
- exception and obligation summary;
- evidence boundary confirmation;
- support incident summary;
- feedback summary;
- known limitations and unresolved non-P0 items.
