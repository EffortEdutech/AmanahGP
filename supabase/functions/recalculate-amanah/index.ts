// supabase/functions/recalculate-amanah/index.ts
// Amanah Governance Platform — Amanah Index™ Recalculation Edge Function
//
// Triggered by:
//   - POST /functions/v1/recalculate-amanah (from reviewer server action)
//   - Internally after webhook confirms donation or report verified
//
// Contract:
//   Body: { organization_id: string, trigger_event: string, actor_user_id?: string }
//   Auth: service_role (called server-side only)
//
// Rules from spec:
//   - Append-only: always insert new row into amanah_index_history
//   - Never update or delete previous scores
//   - Idempotency: caller passes trigger_event + org_id; debounce handled by caller

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// We inline the scoring logic here to avoid ESM import issues in Deno runtime.
// The same logic lives in packages/scoring/src/amanah.ts for Next.js usage.

const AMANAH_WEIGHTS = {
  governance:             0.30,
  financial_transparency: 0.25,
  project_transparency:   0.20,
  impact_efficiency:      0.15,
  feedback:               0.10,
};

function clamp(v: number, min: number, max: number) {
  return Math.min(Math.max(v, min), max);
}

function monthsSince(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24 * 30));
}

function daysSince(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24));
}

Deno.serve(async (req: Request) => {
  try {
    const body = await req.json() as {
      organization_id:  string;
      trigger_event:    string;
      actor_user_id?:   string;
    };

    const { organization_id, trigger_event, actor_user_id } = body;
    if (!organization_id || !trigger_event) {
      return new Response(
        JSON.stringify({ ok: false, error: 'organization_id and trigger_event required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { persistSession: false } }
    );

    // ── 1. Fetch org status ───────────────────────────────────
    const { data: org } = await supabase
      .from('organizations')
      .select('onboarding_status, listing_status, fund_types, org_type')
      .eq('id', organization_id)
      .single();

    if (!org) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Organization not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // ── 2. Compute governance score ───────────────────────────
    const { data: latestEval } = await supabase
      .from('certification_evaluations')
      .select('score_breakdown')
      .eq('organization_id', organization_id)
      .order('computed_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const ctcfGatePassed = latestEval?.score_breakdown?.layer1_gate?.passed === true;

    let governanceScore = 0;
    if (org.onboarding_status === 'approved' && org.listing_status === 'listed') {
      governanceScore = ctcfGatePassed ? 100 : 80;
    } else if (org.onboarding_status === 'approved') {
      governanceScore = 60;
    } else if (org.onboarding_status === 'submitted') {
      governanceScore = 30;
    }

    // ── 3. Compute financial score ────────────────────────────
    const { data: latestFinancial } = await supabase
      .from('financial_snapshots')
      .select('verification_status, verified_at')
      .eq('organization_id', organization_id)
      .order('period_year', { ascending: false })
      .limit(1)
      .maybeSingle();

    let financialScore = 0;
    if (latestFinancial?.verification_status === 'verified' && latestFinancial.verified_at) {
      financialScore = monthsSince(latestFinancial.verified_at) <= 18 ? 100 : 70;
    } else if (latestFinancial?.verification_status === 'submitted') {
      financialScore = 50;
    }

    // ── 4. Compute project transparency score ─────────────────
    const { data: reports } = await supabase
      .from('project_reports')
      .select('verified_at')
      .eq('organization_id', organization_id)
      .eq('verification_status', 'verified')
      .order('verified_at', { ascending: false });

    const verifiedCount = reports?.length ?? 0;
    const mostRecentAt  = reports?.[0]?.verified_at ?? null;

    let projectScore = 0;
    if (verifiedCount === 0) {
      projectScore = 0;
    } else if (!mostRecentAt) {
      projectScore = 30;
    } else {
      const d = daysSince(mostRecentAt);
      if (verifiedCount >= 3 && d <= 90) projectScore = 100;
      else if (verifiedCount >= 2 || d <= 90) projectScore = 80;
      else projectScore = 60;
    }

    // ── 5. Compute impact efficiency score ────────────────────
    const { data: reportBodies } = await supabase
      .from('project_reports')
      .select('report_body')
      .eq('organization_id', organization_id)
      .eq('verification_status', 'verified')
      .limit(5);

    let hasBeneficiaryData = false;
    let hasSpendData       = false;

    for (const r of reportBodies ?? []) {
      const b = r.report_body as Record<string, any>;
      if (b.beneficiaries_reached != null) hasBeneficiaryData = true;
      if (b.spend_to_date != null)         hasSpendData = true;
    }

    const { data: projWithKpis } = await supabase
      .from('projects')
      .select('kpi_targets')
      .eq('organization_id', organization_id)
      .not('kpi_targets', 'is', null)
      .limit(1)
      .maybeSingle();

    const hasKpiTargets = !!projWithKpis;

    const impactCount = [hasBeneficiaryData, hasSpendData, hasKpiTargets].filter(Boolean).length;
    const impactScore = impactCount === 3 ? 100 : impactCount === 2 ? 70 : impactCount === 1 ? 40 : 0;

    // ── 6. Feedback score (Phase 1 baseline) ──────────────────
    const feedbackScore = 70; // No complaint system in Phase 1

    // ── 7. Compute weighted total ─────────────────────────────
    const gs  = clamp(governanceScore,  0, 100);
    const fs  = clamp(financialScore,   0, 100);
    const ps  = clamp(projectScore,     0, 100);
    const is_ = clamp(impactScore,      0, 100);
    const fbs = clamp(feedbackScore,    0, 100);

    const scoreValue = parseFloat((
      gs  * AMANAH_WEIGHTS.governance +
      fs  * AMANAH_WEIGHTS.financial_transparency +
      ps  * AMANAH_WEIGHTS.project_transparency +
      is_ * AMANAH_WEIGHTS.impact_efficiency +
      fbs * AMANAH_WEIGHTS.feedback
    ).toFixed(2));

    const breakdown = {
      governance_score:             gs,
      financial_transparency_score: fs,
      project_transparency_score:   ps,
      impact_efficiency_score:      is_,
      feedback_score:               fbs,
      weights: AMANAH_WEIGHTS,
    };

    // ── 8. Build public summary ───────────────────────────────
    const triggerMessages: Record<string, string> = {
      report_verified:       'Verified progress report added.',
      financial_verified:    'Financial snapshot verified.',
      financial_submitted:   'Financial snapshot submitted.',
      certification_updated: 'Certification status updated.',
      donation_confirmed:    'Donation confirmed.',
      manual_recalc:         'Score manually recalculated by platform.',
    };
    const triggerMsg  = triggerMessages[trigger_event] ?? 'Trust score updated.';
    const gradeMsg    = scoreValue >= 85 ? 'Platinum Amanah' :
                        scoreValue >= 70 ? 'Gold Amanah' :
                        scoreValue >= 55 ? 'Silver Amanah' : 'Building trust profile';
    const publicSummary = `${triggerMsg} ${gradeMsg} grade.`;

    // ── 9. Fetch latest trust event id for reference ──────────
    const { data: latestTrustEvent } = await supabase
      .from('trust_events')
      .select('id')
      .eq('organization_id', organization_id)
      .order('occurred_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // ── 10. Append to amanah_index_history (NEVER update) ─────
    const { data: historyRow, error: historyError } = await supabase
      .from('amanah_index_history')
      .insert({
        organization_id:        organization_id,
        score_version:          'amanah_v1',
        score_value:            scoreValue,
        breakdown,
        public_summary:         publicSummary,
        computed_from_event_id: latestTrustEvent?.id ?? null,
      })
      .select('id')
      .single();

    if (historyError) {
      console.error('[recalc] Failed to insert history:', historyError.message);
      return new Response(
        JSON.stringify({ ok: false, error: historyError.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // ── 11. Audit log ─────────────────────────────────────────
    await supabase.from('audit_logs').insert({
      actor_user_id:   actor_user_id ?? null,
      actor_role:      actor_user_id ? 'reviewer' : 'system',
      organization_id: organization_id,
      action:          'AMANAH_RECALCULATED',
      entity_table:    'amanah_index_history',
      entity_id:       historyRow.id,
      metadata:        { trigger_event, score_value: scoreValue, breakdown },
    });

    console.log(`[recalc] ✅ ${organization_id} → ${scoreValue} (${gradeMsg}) trigger: ${trigger_event}`);

    return new Response(
      JSON.stringify({
        ok:          true,
        score_value: scoreValue,
        grade:       gradeMsg,
        history_id:  historyRow.id,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    console.error('[recalc] Unexpected error:', err);
    return new Response(
      JSON.stringify({ ok: false, error: 'Internal error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
