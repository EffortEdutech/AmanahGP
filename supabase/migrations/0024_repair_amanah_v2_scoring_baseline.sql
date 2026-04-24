-- =============================================================
-- Migration: 0024_repair_amanah_v2_scoring_baseline.sql
-- Purpose:
--   Repair Amanah v2 scoring so event-based score does not collapse
--   new/seeded organisations to 0.50 / 0.60.
--
-- Model:
--   final_score =
--     baseline_score * 0.70
--     + event_score * 0.30
--     - risk_penalties
--
-- Notes:
--   - Keeps amanah_v2_events version.
--   - Keeps 1000-point pillar breakdown for UI.
--   - Adds baseline + event_score into breakdown.
-- =============================================================

create or replace function public.recalculate_amanah_score_v2(
  p_org_id uuid,
  p_trigger_event_id uuid default null
)
returns numeric
language plpgsql
security definer
set search_path = public
as $$
declare
  -- Raw pillar sums from events
  v_fi_raw    numeric := 0;
  v_gov_raw   numeric := 0;
  v_com_raw   numeric := 0;
  v_trn_raw   numeric := 0;
  v_imp_raw   numeric := 0;

  -- Capped pillar scores
  v_fi_capped  numeric;
  v_gov_capped numeric;
  v_com_capped numeric;
  v_trn_capped numeric;
  v_imp_capped numeric;

  -- Risk flags
  v_fi_cap_pct    numeric := 1.0;
  v_gov_cap_pct   numeric := 1.0;
  v_com_cap_pct   numeric := 1.0;

  v_no_close_3mo    boolean := false;
  v_segregation_vio boolean := false;
  v_audit_overdue   boolean := false;

  -- Maxima
  FI_MAX    constant numeric := 300;
  GOV_MAX   constant numeric := 200;
  COM_MAX   constant numeric := 200;
  TRN_MAX   constant numeric := 150;
  IMP_MAX   constant numeric := 150;
  TOTAL_MAX constant numeric := 1000;

  -- Baseline
  v_baseline_score numeric := 0;
  v_cert_score     numeric := null;
  v_org_status     text := null;
  v_listing_status text := null;

  -- Final
  v_raw_total       numeric;
  v_event_score     numeric;
  v_risk_penalty    numeric := 0;
  v_final_score     numeric;
  v_breakdown       jsonb;
begin
  -- 1. Sum event deltas by pillar
  select
    coalesce(sum(case when pillar = 'financial_integrity' then score_delta else 0 end), 0),
    coalesce(sum(case when pillar = 'governance'          then score_delta else 0 end), 0),
    coalesce(sum(case when pillar = 'compliance'          then score_delta else 0 end), 0),
    coalesce(sum(case when pillar = 'transparency'        then score_delta else 0 end), 0),
    coalesce(sum(case when pillar = 'impact'              then score_delta else 0 end), 0)
  into v_fi_raw, v_gov_raw, v_com_raw, v_trn_raw, v_imp_raw
  from public.trust_events
  where organization_id = p_org_id
    and score_delta is not null;

  -- 2. Get organisation status for fallback baseline
  select onboarding_status::text, listing_status::text
  into v_org_status, v_listing_status
  from public.organizations
  where id = p_org_id;

  -- 3. Get latest certification score if available
  --    Try total_score first. If your schema uses a different field,
  --    adjust here after checking certification_evaluations.
  select total_score
  into v_cert_score
  from public.certification_evaluations
  where organization_id = p_org_id
  order by computed_at desc nulls last, created_at desc nulls last
  limit 1;

  -- 4. Baseline fallback
  v_baseline_score :=
    case
      when v_cert_score is not null then greatest(0, least(v_cert_score, 100))
      when v_org_status = 'approved' and v_listing_status = 'listed' then 55
      when v_org_status = 'approved' then 45
      when v_org_status = 'submitted' then 30
      else 15
    end;

  -- 5. Risk flags and pillar caps
  v_no_close_3mo := not exists (
    select 1
    from public.fund_period_closes
    where organization_id = p_org_id
      and closed_at > now() - interval '3 months'
  );

  if v_no_close_3mo then
    v_fi_cap_pct := 0.60;
    v_risk_penalty := v_risk_penalty + 2;
  end if;

  v_segregation_vio := exists (
    select 1
    from public.trust_events
    where organization_id = p_org_id
      and event_type = 'gov_payment_self_approved'
      and occurred_at > now() - interval '12 months'
  );

  if v_segregation_vio then
    v_gov_cap_pct := 0.40;
    v_risk_penalty := v_risk_penalty + 6;
  end if;

  v_audit_overdue := exists (
    select 1
    from public.trust_events
    where organization_id = p_org_id
      and event_type = 'com_audit_overdue'
      and occurred_at > now() - interval '12 months'
      and not exists (
        select 1
        from public.trust_events t2
        where t2.organization_id = p_org_id
          and t2.event_type = 'com_audit_submitted'
          and t2.occurred_at > now() - interval '12 months'
      )
  );

  if v_audit_overdue then
    v_com_cap_pct := 0.50;
    v_risk_penalty := v_risk_penalty + 5;
  end if;

  -- 6. Cap raw pillar scores
  v_fi_capped  := greatest(0, least(v_fi_raw,  FI_MAX  * v_fi_cap_pct));
  v_gov_capped := greatest(0, least(v_gov_raw, GOV_MAX * v_gov_cap_pct));
  v_com_capped := greatest(0, least(v_com_raw, COM_MAX * v_com_cap_pct));
  v_trn_capped := greatest(0, least(v_trn_raw, TRN_MAX));
  v_imp_capped := greatest(0, least(v_imp_raw, IMP_MAX));

  v_raw_total := v_fi_capped + v_gov_capped + v_com_capped + v_trn_capped + v_imp_capped;

  -- 7. Event score still uses 1000-point model, but only contributes 30%.
  v_event_score := round((v_raw_total / TOTAL_MAX) * 100, 2);

  -- 8. Final score includes baseline, event behaviour and risk penalty.
  v_final_score := round(
    greatest(
      0,
      least(
        100,
        (v_baseline_score * 0.70)
        + (v_event_score * 0.30)
        - v_risk_penalty
      )
    ),
    2
  );

  -- 9. Breakdown
  v_breakdown := jsonb_build_object(
    'version', 'amanah_v2_events',
    'model', 'baseline_plus_events_v1',
    'baseline', jsonb_build_object(
      'score', v_baseline_score,
      'source',
        case
          when v_cert_score is not null then 'certification_evaluations.total_score'
          else 'organization_status_fallback'
        end,
      'certification_score', v_cert_score,
      'onboarding_status', v_org_status,
      'listing_status', v_listing_status,
      'weight', 0.70
    ),
    'events', jsonb_build_object(
      'raw_total', v_raw_total,
      'event_score', v_event_score,
      'weight', 0.30
    ),
    'financial_integrity', jsonb_build_object(
      'raw', v_fi_raw,
      'capped', v_fi_capped,
      'max', FI_MAX,
      'pct', round((v_fi_capped / FI_MAX) * 100, 1),
      'risk_cap_applied', v_no_close_3mo
    ),
    'governance', jsonb_build_object(
      'raw', v_gov_raw,
      'capped', v_gov_capped,
      'max', GOV_MAX,
      'pct', round((v_gov_capped / GOV_MAX) * 100, 1),
      'risk_cap_applied', v_segregation_vio
    ),
    'compliance', jsonb_build_object(
      'raw', v_com_raw,
      'capped', v_com_capped,
      'max', COM_MAX,
      'pct', round((v_com_capped / COM_MAX) * 100, 1),
      'risk_cap_applied', v_audit_overdue
    ),
    'transparency', jsonb_build_object(
      'raw', v_trn_raw,
      'capped', v_trn_capped,
      'max', TRN_MAX,
      'pct', round((v_trn_capped / TRN_MAX) * 100, 1),
      'risk_cap_applied', false
    ),
    'impact', jsonb_build_object(
      'raw', v_imp_raw,
      'capped', v_imp_capped,
      'max', IMP_MAX,
      'pct', round((v_imp_capped / IMP_MAX) * 100, 1),
      'risk_cap_applied', false
    ),
    'raw_total', v_raw_total,
    'risk_penalty', v_risk_penalty,
    'risk_flags', jsonb_build_object(
      'no_close_3mo', v_no_close_3mo,
      'segregation_vio', v_segregation_vio,
      'audit_overdue', v_audit_overdue
    ),
    'final_score', v_final_score
  );

  -- 10. Append score history
  insert into public.amanah_index_history (
    organization_id,
    score_version,
    score_value,
    computed_from_event_id,
    breakdown,
    public_summary
  ) values (
    p_org_id,
    'amanah_v2_events',
    v_final_score,
    p_trigger_event_id,
    v_breakdown,
    case
      when v_final_score >= 85 then 'Platinum — Exceptional Amanah governance'
      when v_final_score >= 70 then 'Gold — Highly trusted organisation'
      when v_final_score >= 55 then 'Silver — Good governance practices'
      when v_final_score >= 40 then 'Bronze — Developing governance'
      else                          'Foundation — Early stage governance'
    end
  );

  return v_final_score;
end;
$$;

comment on function public.recalculate_amanah_score_v2 is
  'Recalculates Amanah Index from certification baseline plus trust events. '
  'Uses baseline_score * 70% + event_score * 30% minus risk penalties. '
  'Keeps 1000-point pillar breakdown for UI but prevents immature event histories '
  'from collapsing the final 0-100 score.';