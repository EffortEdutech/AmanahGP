# Amanah Tier Platform-Wide Patch

Extract this ZIP at the repository root.

Included:
- Canonical shared tier logic in `packages/scoring/src/amanah-tiers.ts`
- Package export update in `packages/scoring/src/index.ts`
- AmanahHub compatibility wrapper and badge file
- AmanahHub live-score wrapper view migration
- PowerShell script to switch AmanahHub pages from `v_amanahhub_public_trust_profiles` to `v_amanahhub_public_trust_profiles_live_score`
- AmanahOS uploaded pages patched to import shared tier helper where inline grade labels were found

After extract:
1. Run the SQL migration in Supabase cloud if not already created.
2. Run: `powershell -ExecutionPolicy Bypass -File scripts/patch-amanahhub-live-score-view.ps1`
3. Restart apps.
4. Run searches to verify no app-level numeric tier logic remains.
