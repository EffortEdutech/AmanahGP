-- 20260426_phase2_validation_run_before_2c.sql
-- AmanahGP / AmanahHub — Phase 2 validation before Phase 2C
--
-- Purpose:
--   Confirm the canonical AmanahHub public profile view exists and reads Amanah Index
--   from the canonical current index view before deprecating the old live_score view.
--
-- Expected:
--   * object_check should show all key views/tables exist.
--   * mismatch checks should return 0 rows.
--   * preview query should return public profiles using amanah_index_* columns.

-- 1) Object existence check.
SELECT
  'object_check' AS check_name,
  to_regclass('public.amanah_index_history') IS NOT NULL AS has_amanah_index_history,
  to_regclass('public.v_amanah_index_current') IS NOT NULL AS has_v_amanah_index_current,
  to_regclass('public.v_amanahhub_public_profiles') IS NOT NULL AS has_canonical_public_profiles,
  to_regclass('public.v_amanahhub_public_trust_profiles') IS NOT NULL AS has_legacy_base_public_trust_profiles,
  to_regclass('public.v_amanahhub_public_trust_profiles_live_score') IS NOT NULL AS has_legacy_live_score_view;

-- 2) Canonical public profile count and Amanah Index coverage.
SELECT
  'canonical_profile_summary' AS check_name,
  COUNT(*) AS public_profile_rows,
  COUNT(*) FILTER (WHERE amanah_index_score IS NOT NULL) AS rows_with_amanah_index_score,
  COUNT(*) FILTER (WHERE has_amanah_index IS TRUE) AS rows_with_has_amanah_index_true,
  MIN(amanah_index_score) AS min_amanah_index_score,
  MAX(amanah_index_score) AS max_amanah_index_score
FROM public.v_amanahhub_public_profiles;

-- 3) Canonical AmanahHub score must exactly match the canonical current score.
-- Expected result: 0 rows.
SELECT
  'canonical_score_mismatch' AS check_name,
  p.organization_id,
  p.name,
  p.amanah_index_score AS amanahhub_public_score,
  ai.amanah_index_score AS canonical_current_score,
  p.amanah_index_tier,
  p.amanah_index_computed_at
FROM public.v_amanahhub_public_profiles p
LEFT JOIN public.v_amanah_index_current ai
  ON ai.organization_id = p.organization_id
WHERE p.amanah_index_score IS DISTINCT FROM ai.amanah_index_score
ORDER BY p.name;

-- 4) Canonical AmanahHub breakdown must exactly match the canonical current breakdown.
-- Expected result: 0 rows.
SELECT
  'canonical_breakdown_mismatch' AS check_name,
  p.organization_id,
  p.name,
  p.amanah_index_breakdown AS amanahhub_public_breakdown,
  ai.amanah_index_breakdown AS canonical_current_breakdown
FROM public.v_amanahhub_public_profiles p
LEFT JOIN public.v_amanah_index_current ai
  ON ai.organization_id = p.organization_id
WHERE p.amanah_index_breakdown IS DISTINCT FROM ai.amanah_index_breakdown
ORDER BY p.name;

-- 5) Show historical difference from legacy snapshot score.
-- This may return rows. That is acceptable and proves why the canonical view is needed.
SELECT
  'legacy_snapshot_difference_preview' AS check_name,
  p.organization_id,
  p.name,
  b.trust_score AS legacy_snapshot_trust_score,
  p.amanah_index_score AS canonical_amanah_index_score,
  p.amanah_index_tier,
  p.amanah_index_computed_at
FROM public.v_amanahhub_public_profiles p
JOIN public.v_amanahhub_public_trust_profiles b
  ON b.organization_id = p.organization_id
WHERE b.trust_score IS NOT NULL
  AND b.trust_score::numeric IS DISTINCT FROM p.amanah_index_score
ORDER BY p.name
LIMIT 50;

-- 6) Column naming check.
-- Expected: canonical_has_required_columns = true, canonical_has_legacy_trust_columns = false.
WITH cols AS (
  SELECT column_name
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'v_amanahhub_public_profiles'
)
SELECT
  'canonical_column_contract' AS check_name,
  EXISTS (SELECT 1 FROM cols WHERE column_name = 'amanah_index_score')
    AND EXISTS (SELECT 1 FROM cols WHERE column_name = 'amanah_index_tier')
    AND EXISTS (SELECT 1 FROM cols WHERE column_name = 'amanah_index_breakdown')
    AS canonical_has_required_columns,
  EXISTS (SELECT 1 FROM cols WHERE column_name = 'trust_score')
    OR EXISTS (SELECT 1 FROM cols WHERE column_name = 'trust_tier')
    OR EXISTS (SELECT 1 FROM cols WHERE column_name = 'pillar_scores')
    AS canonical_has_legacy_trust_columns;

-- 7) Donor-facing preview for quick UI check.
SELECT
  'public_profile_preview' AS check_name,
  organization_id,
  name,
  org_type,
  state,
  governance_stage_label,
  snapshot_status,
  review_status,
  amanah_index_score,
  amanah_index_tier,
  has_amanah_index,
  amanah_index_breakdown IS NOT NULL AS has_amanah_index_breakdown,
  amanah_index_computed_at
FROM public.v_amanahhub_public_profiles
ORDER BY governance_stage_sort ASC, amanah_index_score DESC NULLS LAST, name ASC
LIMIT 50;
