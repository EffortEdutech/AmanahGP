-- 20260426_phase2c_deprecation_validation.sql
-- Run after 20260426_phase2c_deprecate_live_score_compat_view.sql

-- 1) Deprecated live_score view still exists, but is documented as deprecated.
SELECT
  'deprecation_comment_check' AS check_name,
  obj_description('public.v_amanahhub_public_trust_profiles_live_score'::regclass) AS live_score_view_comment;

-- 2) Deprecated compatibility aliases must match canonical amanah_index_* values exactly.
-- Expected result: 0 rows.
SELECT
  'live_score_alias_mismatch' AS check_name,
  p.organization_id,
  p.name,
  p.amanah_index_score AS canonical_amanah_index_score,
  l.trust_score AS deprecated_trust_score,
  p.amanah_index_tier AS canonical_amanah_index_tier,
  l.trust_tier AS deprecated_trust_tier,
  p.amanah_index_breakdown AS canonical_breakdown,
  l.pillar_scores AS deprecated_pillar_scores
FROM public.v_amanahhub_public_profiles p
JOIN public.v_amanahhub_public_trust_profiles_live_score l
  ON l.organization_id = p.organization_id
WHERE p.amanah_index_score IS DISTINCT FROM l.trust_score::numeric
   OR p.amanah_index_tier IS DISTINCT FROM l.trust_tier
   OR p.amanah_index_breakdown IS DISTINCT FROM l.pillar_scores
ORDER BY p.name;

-- 3) Canonical view should not expose legacy trust score column names.
-- Expected: canonical_has_legacy_columns = false.
WITH cols AS (
  SELECT column_name
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'v_amanahhub_public_profiles'
)
SELECT
  'canonical_no_legacy_columns' AS check_name,
  EXISTS (SELECT 1 FROM cols WHERE column_name IN ('trust_score', 'trust_tier', 'pillar_scores'))
    AS canonical_has_legacy_columns;

-- 4) Deprecated view keeps the old column contract only for compatibility.
-- Expected: deprecated_view_has_legacy_aliases = true.
WITH cols AS (
  SELECT column_name
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'v_amanahhub_public_trust_profiles_live_score'
)
SELECT
  'deprecated_view_column_contract' AS check_name,
  EXISTS (SELECT 1 FROM cols WHERE column_name = 'trust_score')
    AND EXISTS (SELECT 1 FROM cols WHERE column_name = 'trust_tier')
    AND EXISTS (SELECT 1 FROM cols WHERE column_name = 'pillar_scores')
    AS deprecated_view_has_legacy_aliases;

-- 5) Confirm both views return same organisation count.
SELECT
  'row_count_compare' AS check_name,
  (SELECT COUNT(*) FROM public.v_amanahhub_public_profiles) AS canonical_rows,
  (SELECT COUNT(*) FROM public.v_amanahhub_public_trust_profiles_live_score) AS deprecated_live_score_rows;

-- 6) Preview deprecated wrapper values for manual sanity check.
SELECT
  'deprecated_wrapper_preview' AS check_name,
  organization_id,
  name,
  trust_score AS deprecated_trust_score_alias,
  trust_tier AS deprecated_trust_tier_alias,
  pillar_scores IS NOT NULL AS has_deprecated_pillar_scores_alias,
  last_reviewed_at
FROM public.v_amanahhub_public_trust_profiles_live_score
ORDER BY trust_score DESC NULLS LAST, name ASC
LIMIT 50;
