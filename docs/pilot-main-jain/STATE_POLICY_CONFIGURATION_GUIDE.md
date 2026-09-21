# State Policy Configuration Guide

Purpose: configure MAIN/JAIN pilot rules without hard-coding operational policy into application code.

## Scope

This guide covers pilot policy data used by Authority View:

- reporting due dates;
- approval thresholds;
- bank reconciliation requirements;
- required evidence;
- escalation thresholds;
- corrective action due periods.

Authority policy is metadata and oversight configuration. It must not grant MAIN/JAIN officers direct access to organisation-private ledgers, payment records, bank accounts, private documents, or raw evidence files.

## Configuration Order

1. Confirm the authority exists in `authorities`.
2. Confirm each state or zone exists in `jurisdictions`.
3. Add or update `policy_sets` for the authority and jurisdiction.
4. Create a draft `policy_versions` row for the effective period.
5. Add `policy_rules` using one of the pilot rule categories.
6. Add `policy_effective_periods` and verify there is no active overlap.
7. Activate the policy version only after review by an authorised authority manager/admin.
8. Record the activation decision in the audit trail or implementation note.

## Freeze Rules

- Never edit historical policy versions to change past obligations.
- Use a new future-dated policy version for new state requirements.
- Keep source submission/report history immutable after submission.
- Ensure exported report packs reference the policy version used at generation time.

## Pre-Pilot Checklist

- Authority and jurisdiction status are `active`.
- Each pilot organisation is mapped through `pilot_cohort_organizations`.
- Policy rules exist for reporting due date, required evidence, review response due period, escalation threshold, and corrective action due period.
- Overlap checks pass.
- Authority View policy page shows the intended jurisdiction and policy status.
