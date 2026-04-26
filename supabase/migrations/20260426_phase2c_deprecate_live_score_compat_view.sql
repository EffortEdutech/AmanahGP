-- 20260426_phase2c_deprecate_live_score_compat_view.sql
-- AmanahGP / AmanahHub — Phase 2C
--
-- Purpose:
--   Deprecate public.v_amanahhub_public_trust_profiles_live_score safely.
--
-- What this patch does:
--   1) Keeps the old live_score view available as a compatibility wrapper.
--   2) Forces its legacy trust_score/trust_tier/pillar_scores aliases to map only from
--      public.v_amanahhub_public_profiles amanah_index_* columns.
--   3) Adds deprecation comments so future developers know not to use it.
--   4) Does NOT drop the old view yet.
--
-- Canonical rule after this patch:
--   New app code must use public.v_amanahhub_public_profiles:
--     amanah_index_score
--     amanah_index_tier
--     amanah_index_breakdown
--
-- Do not use these legacy aliases in new code:
--     trust_score
--     trust_tier
--     pillar_scores

BEGIN;

DO $$
BEGIN
  IF to_regclass('public.v_amanahhub_public_profiles') IS NULL THEN
    RAISE EXCEPTION
      'Missing public.v_amanahhub_public_profiles. Run Phase 2A canonical public profile SQL before Phase 2C.';
  END IF;

  IF to_regclass('public.v_amanah_index_current') IS NULL THEN
    RAISE EXCEPTION
      'Missing public.v_amanah_index_current. Run Phase 1 single-source Amanah Index SQL before Phase 2C.';
  END IF;
END;
$$;

-- -----------------------------------------------------------------------------
-- Deprecated compatibility wrapper
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.v_amanahhub_public_trust_profiles_live_score AS
SELECT
  p.organization_id,
  p.slug,
  p.name,
  p.display_name,
  p.legal_name,
  p.registration_no,
  p.org_type,
  p.website_url,
  p.contact_email,
  p.contact_phone,
  p.country_code,
  p.state,
  p.city,
  p.address,
  p.summary,
  p.description,
  p.workspace_status,
  p.onboarding_status,
  p.listing_status,
  p.compliance_status,
  p.verification_status,
  p.oversight_authority,
  p.snapshot_id,
  p.snapshot_case_id,
  p.snapshot_status,
  p.review_status,

  -- Deprecated aliases retained only for old/unknown code paths.
  -- These now come from the canonical Amanah Index source through
  -- public.v_amanahhub_public_profiles, not from legacy snapshot score fields.
  p.amanah_index_score::numeric AS trust_score,
  p.amanah_index_tier::text AS trust_tier,

  p.summary_public,
  p.notes_public,
  p.amanah_index_breakdown::jsonb AS pillar_scores,
  p.signals_public,
  p.published_at,
  p.effective_from,
  p.effective_to,
  COALESCE(p.amanah_index_computed_at, p.last_reviewed_at) AS last_reviewed_at,
  p.current_case_id,
  p.current_case_code,
  p.current_case_type,
  p.current_case_status,
  p.current_case_priority,
  p.current_case_opened_at,
  p.governance_stage_key,
  p.governance_stage_label,
  p.governance_stage_description,
  p.governance_stage_sort,
  p.has_published_snapshot,
  p.has_active_governance_case,
  p.public_updated_at,
  p.created_at,
  p.updated_at
FROM public.v_amanahhub_public_profiles p;

COMMENT ON VIEW public.v_amanahhub_public_trust_profiles_live_score IS
  'DEPRECATED compatibility wrapper only. Do not use in new app code. Use public.v_amanahhub_public_profiles and amanah_index_score / amanah_index_tier / amanah_index_breakdown. Legacy aliases trust_score, trust_tier and pillar_scores are mapped from the canonical Amanah Index source only.';

COMMENT ON COLUMN public.v_amanahhub_public_trust_profiles_live_score.trust_score IS
  'DEPRECATED alias. Use public.v_amanahhub_public_profiles.amanah_index_score.';

COMMENT ON COLUMN public.v_amanahhub_public_trust_profiles_live_score.trust_tier IS
  'DEPRECATED alias. Use public.v_amanahhub_public_profiles.amanah_index_tier.';

COMMENT ON COLUMN public.v_amanahhub_public_trust_profiles_live_score.pillar_scores IS
  'DEPRECATED alias. Use public.v_amanahhub_public_profiles.amanah_index_breakdown.';

-- Also label the older base public trust profile view, if present, to reduce future confusion.
DO $do$
BEGIN
  IF to_regclass('public.v_amanahhub_public_trust_profiles') IS NOT NULL THEN
    EXECUTE $sql$COMMENT ON VIEW public.v_amanahhub_public_trust_profiles IS
      'LEGACY public trust profile base view. Do not use trust_score/trust_tier as Amanah Index. New donor-facing app code must use public.v_amanahhub_public_profiles and amanah_index_* columns.'$sql$;
  END IF;
END;
$do$;

GRANT SELECT ON public.v_amanahhub_public_trust_profiles_live_score TO anon;
GRANT SELECT ON public.v_amanahhub_public_trust_profiles_live_score TO authenticated;
GRANT SELECT ON public.v_amanahhub_public_trust_profiles_live_score TO service_role;

COMMIT;
