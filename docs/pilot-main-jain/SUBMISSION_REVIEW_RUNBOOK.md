# Submission Review Runbook

Purpose: run a monthly or annual submission from AmanahOS to Authority View without mutating the organisation's source report history.

## Review Flow

1. Organisation submits the report from AmanahOS.
2. The platform records or refreshes a `regulatory_submissions` row.
3. Authority officer opens Authority View Submission Monitor.
4. Reviewer checks submission metadata, period, status, late status, linked evidence, and report pack summary.
5. Reviewer records one of the allowed outcomes:
   - received;
   - under review;
   - accepted;
   - changes requested;
   - rejected or withdrawn where policy permits.
6. If changes are requested, the organisation responds through the submission cycle. Do not delete the old status history.
7. If accepted, preserve the frozen source metadata and report pack summary for audit.

## Review Standards

- Use policy version effective for the submitted period.
- Compare dashboard counts with monitor detail rows.
- Check evidence links, not private file stores.
- Keep review decisions attributable to the authority officer.
- Use exception workflow when late, missing evidence, discrepancy, or corrective action triggers appear.

## Evidence Boundary

Reviewable evidence must appear through `authority_evidence_links` or submission/report pack summaries. Authority officers must not be given blanket access to:

- `evidence_files`;
- `org_documents`;
- `journal_lines`;
- `bank_accounts`;
- `bank_reconciliations`;
- `payment_requests`.

## Escalation

Escalate to authority manager/admin when:

- cross-jurisdiction data appears;
- private source records appear directly;
- a reviewer sees actions outside their role;
- a submission status cannot be reconciled with the status event trail;
- KPI totals do not match source summary counts.
