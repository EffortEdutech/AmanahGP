'use server';
// apps/org/lib/trust-event-actions.ts
// Sprint 19 — Trust Event Engine
//
// Server actions for manually emitting trust events from amanahOS pages.
// DB triggers handle automatic emission (bank recon, month close, payment approval).
// These actions handle events triggered by user UI interactions:
//   - Policy uploaded
//   - Compliance document submitted
//   - Report published
//   - Complaint resolved
//   - Manual recalculation

import { createClient }        from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';

export type TrustEventResult =
  | { success: true;  eventId: string; newScore: number }
  | { success: false; error: string };

export type TrustEventInput = {
  orgId:            string;
  eventType:        string;
  pillar:           'financial_integrity' | 'governance' | 'compliance' | 'transparency' | 'impact' | 'system';
  scoreDelta:       number;
  payload?:         Record<string, unknown>;
  idempotencyKey?:  string;
  refTable?:        string;
  refId?:           string;
};

/**
 * Emit a trust event and trigger Amanah score recalculation.
 * Called from amanahOS pages for manual/UI-triggered events.
 * DB triggers handle automatic events (close, reconcile, payment approval).
 */
export async function emitTrustEvent(input: TrustEventInput): Promise<TrustEventResult> {
  const supabase = await createClient();
  const service  = createServiceClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  const { data: platformUser } = await supabase
    .from('users').select('id')
    .eq('auth_provider_user_id', user.id).single();
  if (!platformUser) return { success: false, error: 'User not found' };

  // Verify membership
  const { data: membership } = await service
    .from('org_members').select('org_role')
    .eq('organization_id', input.orgId)
    .eq('user_id', platformUser.id)
    .eq('status', 'active').single();

  if (!membership) return { success: false, error: 'Not a member of this organisation' };

  // Call emit_trust_event() via RPC
  const { data, error } = await service.rpc('emit_trust_event', {
    p_org_id:           input.orgId,
    p_event_type:       input.eventType,
    p_pillar:           input.pillar,
    p_score_delta:      input.scoreDelta,
    p_source:           'user',
    p_payload:          input.payload ?? {},
    p_actor_user_id:    platformUser.id,
    p_idempotency_key:  input.idempotencyKey ?? null,
    p_ref_table:        input.refTable ?? null,
    p_ref_id:           input.refId ?? null,
  });

  if (error) return { success: false, error: error.message };

  // Get new safe score
  // Temporary guard: old amanah_v2_events rows may be event-only and show
  // values like 0.50 / 0.60. Prefer v2 only when it is not obviously broken;
  // otherwise fall back to amanah_v1 or the latest available row.
  const { data: scoreRows } = await service
    .from('amanah_index_history')
    .select('score_value, score_version, computed_at')
    .eq('organization_id', input.orgId)
    .order('computed_at', { ascending: false })
    .limit(10);

  const scoreRow =
    scoreRows?.find((row) => {
      const value = Number(row.score_value ?? 0);
      return row.score_version === 'amanah_v2_events' && value >= 10;
    }) ??
    scoreRows?.find((row) => row.score_version === 'amanah_v1') ??
    scoreRows?.[0] ??
    null;

  return {
    success:  true,
    eventId:  data as string,
    newScore: Number(scoreRow?.score_value ?? 0),
  };
}

/**
 * Policy uploaded — emits gov_policy_uploaded event (+15 Governance).
 * Call from policy-kit page when a policy document is uploaded.
 */
export async function emitPolicyUploaded(orgId: string, policyType: string, docId?: string) {
  return emitTrustEvent({
    orgId,
    eventType:       'gov_policy_uploaded',
    pillar:          'governance',
    scoreDelta:      15,
    payload:         { policy_type: policyType },
    idempotencyKey:  `gov_pol_${orgId}_${policyType}`,
    refTable:        docId ? 'org_documents' : undefined,
    refId:           docId as string | undefined,
  });
}

/**
 * Financial statements published — emits trn_financial_published (+12 Transparency).
 * Call when org publishes their financial statements publicly.
 */
export async function emitFinancialPublished(orgId: string, year: number) {
  return emitTrustEvent({
    orgId,
    eventType:       'trn_financial_published',
    pillar:          'transparency',
    scoreDelta:      12,
    payload:         { period_year: year },
    idempotencyKey:  `trn_fin_pub_${orgId}_${year}`,
  });
}

/**
 * Annual report published — emits trn_annual_report_published (+30 Transparency).
 */
export async function emitAnnualReportPublished(orgId: string, year: number) {
  return emitTrustEvent({
    orgId,
    eventType:       'trn_annual_report_published',
    pillar:          'transparency',
    scoreDelta:      30,
    payload:         { period_year: year },
    idempotencyKey:  `trn_annual_${orgId}_${year}`,
  });
}

/**
 * Complaint received — emits trn_complaint_received (-8 Transparency).
 */
export async function emitComplaintReceived(orgId: string, complaintRef: string) {
  return emitTrustEvent({
    orgId,
    eventType:       'trn_complaint_received',
    pillar:          'transparency',
    scoreDelta:      -8,
    payload:         { complaint_ref: complaintRef },
    idempotencyKey:  `trn_complaint_${complaintRef}`,
  });
}

/**
 * Programme completed — emits imp_program_completed (+12 Impact).
 */
export async function emitProgramCompleted(orgId: string, projectId: string, projectTitle: string) {
  return emitTrustEvent({
    orgId,
    eventType:       'imp_program_completed',
    pillar:          'impact',
    scoreDelta:      12,
    payload:         { project_id: projectId, project_title: projectTitle },
    idempotencyKey:  `imp_prg_${projectId}`,
    refTable:        'projects',
    refId:           projectId,
  });
}

/**
 * Manual score recalculation — callable from trust page.
 */
export async function manualRecalculate(orgId: string): Promise<{ success: boolean; score?: number; error?: string }> {
  const supabase = await createClient();
  const service  = createServiceClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  const { data, error } = await service.rpc('recalculate_amanah_score_v2', {
    p_org_id:           orgId,
    p_trigger_event_id: null,
  });

  if (error) return { success: false, error: error.message };
  return { success: true, score: Number(data) };
}

/**
 * Apply score decay for one org — callable from scheduled Edge Function.
 */
export async function applyDecay(orgId: string): Promise<{ success: boolean; error?: string }> {
  const service = createServiceClient();
  const { error } = await service.rpc('apply_score_decay', { p_org_id: orgId });
  if (error) return { success: false, error: error.message };
  return { success: true };
}
