-- Wrapper view: use live repaired Amanah Index score for AmanahHub public profiles.
-- Keeps the original v_amanahhub_public_trust_profiles shape and overrides score/tier fields.

create or replace view public.v_amanahhub_public_trust_profiles_live_score as
with latest_scores as (
  select distinct on (h.organization_id)
    h.organization_id,
    h.score_value,
    h.breakdown,
    h.computed_at
  from public.amanah_index_history h
  where h.score_version = 'amanah_v2_events'
    and h.breakdown->>'model' = 'baseline_plus_events_v1'
  order by h.organization_id, h.computed_at desc
)
select
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
  coalesce(ls.score_value, p.trust_score) as trust_score,
  case
    when coalesce(ls.score_value, p.trust_score) >= 85 then 'platinum'
    when coalesce(ls.score_value, p.trust_score) >= 70 then 'gold'
    when coalesce(ls.score_value, p.trust_score) >= 55 then 'silver'
    when coalesce(ls.score_value, p.trust_score) >= 40 then 'bronze'
    when coalesce(ls.score_value, p.trust_score) is not null then 'foundation'
    else p.trust_tier
  end as trust_tier,
  p.summary_public,
  p.notes_public,
  coalesce(ls.breakdown, p.pillar_scores) as pillar_scores,
  p.signals_public,
  p.published_at,
  p.effective_from,
  p.effective_to,
  coalesce(ls.computed_at, p.last_reviewed_at) as last_reviewed_at,
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
  coalesce(ls.computed_at, p.public_updated_at) as public_updated_at,
  p.created_at,
  p.updated_at
from public.v_amanahhub_public_trust_profiles p
left join latest_scores ls
  on ls.organization_id = p.organization_id;
