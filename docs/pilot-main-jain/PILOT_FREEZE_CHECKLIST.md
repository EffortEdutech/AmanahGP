# MAIN/JAIN Pilot Freeze Checklist

Purpose: final operational gate before closing the codebase polish and moving into pilot execution. Graphify must be refreshed as part of the freeze evidence.

## Freeze Criteria

- All P0 migrations `0059` through `0067` are present.
- Authority RLS/security boundary is documented and checked.
- Authority View MVP screens exist.
- Phase 11 pilot fixtures exist.
- The 14 Authority View MVP acceptance scenarios are represented in the pilot smoke check.
- Evidence boundary blocks private source files by default.
- Pilot KPI snapshot can be generated or verified for seeded cohort.
- Operator runbooks exist for policy configuration, authority onboarding, mosque/surau onboarding, submission review, access revocation/incidents, and KPI definitions.
- No unresolved P0 security defect remains.

## Required Commands

Run before freeze where the environment permits:

```powershell
node scripts\check_cp47_phase3_policy_engine_lite.mjs
node scripts\check_cp48_phase4_regulatory_submissions.mjs
node scripts\check_cp49_phase5_obligations_exceptions.mjs
node scripts\check_cp50_phase6_approval_delegation_engine.mjs
node scripts\check_cp51_phase7_evidence_authority_boundary.mjs
node scripts\check_cp52_phase8_authority_view_mvp.mjs
node scripts\check_cp53_phase9_state_reporting_pack.mjs
node scripts\check_cp54_phase10_pilot_telemetry_kpi.mjs
node scripts\check_cp55_phase11_pilot_fixtures_e2e.mjs
node scripts\check_cp56_phase12_runbooks_freeze.mjs
pnpm typecheck
pnpm -C apps/agp-console build
.\scripts\graphify.ps1 update .
```

## Manual Pilot Walkthrough

1. Sign in as authority officer.
2. Open `/authority` dashboard.
3. Confirm only assigned pilot organisations are visible.
4. Open Submission Monitor and verify accepted, late, and overdue examples.
5. Open Obligation Monitor and verify satisfied, open, and overdue examples.
6. Open Exception Centre and verify late/overdue examples.
7. Open Evidence Viewer and confirm linked metadata is visible while raw private files remain governed by source RLS.
8. Open Reports and verify state report packs and KPI snapshot.
9. Confirm Activity/Audit page is available.
10. Revoke a test authority assignment and confirm access is denied.

## Freeze Decision

Freeze can be declared only when P0 checks pass or any blocker is documented with owner, impact, and mitigation. P1/P2 issues may remain if they do not weaken jurisdiction scope, evidence boundary, submission history, or authority-role attribution.
