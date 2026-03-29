'use server';
// apps/admin/app/(dashboard)/review/certification-actions.ts
// AmanahHub Console — CTCF evaluation and certification decision actions

import { revalidatePath }                    from 'next/cache';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { writeAuditLog }                     from '@/lib/audit';
import { isReviewerOrAbove, AUDIT_ACTIONS, TRUST_EVENT_TYPES } from '@agp/config';
import { computeCtcfScore }                  from '@agp/scoring';
import type { CtcfInput }                    from '@agp/scoring';
import { triggerAmanahRecalc }               from './review/recalculate';

async function requireReviewer() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from('users').select('id, platform_role')
    .eq('auth_provider_user_id', user.id).single();
  if (!data || !isReviewerOrAbove(data.platform_role)) return null;
  return data;
}

// =============================================================
// SUBMIT CTCF EVALUATION
// Computes score using ctcf_v1 engine, appends to cert_evaluations
// =============================================================
export async function submitCtcfEvaluation(
  _prev: { error?: string; success?: boolean; score?: number } | null,
  formData: FormData
): Promise<{ error?: string; success?: boolean; score?: number; grade?: string }> {
  const me = await requireReviewer();
  if (!me) return { error: 'Reviewer role required' };

  const appId  = formData.get('appId')  as string;
  const orgId  = formData.get('orgId')  as string;
  const notes  = formData.get('notes')  as string;

  const bool = (key: string) => formData.get(key) === 'true';
  const nullable = (key: string): boolean | null => {
    const v = formData.get(key);
    if (v === 'na') return null;
    return v === 'true';
  };

  // Build input from form
  const input: CtcfInput = {
    layer1: {
      hasLegalRegistration:     bool('l1_legal'),
      hasGoverningDocument:     bool('l1_governing'),
      hasNamedBoard:            bool('l1_board'),
      hasConflictOfInterest:    bool('l1_coi'),
      hasBankAccountSeparation: bool('l1_bank'),
      hasContactAndAddress:     bool('l1_contact'),
    },
    layer2: {
      hasAnnualFinancialStatement: bool('l2_financial_statement'),
      hasAuditEvidence:            bool('l2_audit'),
      hasProgramAdminBreakdown:    bool('l2_breakdown'),
      hasZakatSegregation:         nullable('l2_zakat'),
    },
    layer3: {
      hasBudgetVsActual:       bool('l3_budget'),
      hasGeoVerifiedReporting: bool('l3_geo'),
      hasBeforeAfterDocs:      bool('l3_before_after'),
      hasBeneficiaryMetrics:   bool('l3_beneficiary'),
      hasCompletionTimeliness: bool('l3_timeliness'),
    },
    layer4: {
      hasKpisDefined:          bool('l4_kpis'),
      hasSustainabilityPlan:   bool('l4_sustainability'),
      hasContinuityTracking:   bool('l4_continuity'),
      hasImpactPerCostMetric:  bool('l4_impact_cost'),
    },
    layer5: {
      hasShariahAdvisor:       bool('l5_advisor'),
      hasShariahPolicy:        bool('l5_policy'),
      hasZakatEligibilityGov:  nullable('l5_zakat_gov'),
      hasWaqfAssetGovernance:  nullable('l5_waqf_gov'),
    },
  };

  // Compute score
  const result = computeCtcfScore(input);

  const svc = createServiceClient();

  // Append evaluation (never overwrite)
  const { data: evalRow, error: evalError } = await svc
    .from('certification_evaluations')
    .insert({
      organization_id:             orgId,
      certification_application_id: appId,
      criteria_version:            'ctcf_v1',
      total_score:                 result.total_score,
      score_breakdown:             result.breakdown,
      computed_by_user_id:         me.id,
      notes:                       notes || null,
    })
    .select('id')
    .single();

  if (evalError || !evalRow) {
    return { error: 'Failed to save evaluation' };
  }

  await writeAuditLog({
    actorUserId:    me.id,
    actorRole:      me.platform_role,
    organizationId: orgId,
    action:         'CTCF_EVALUATED',
    entityTable:    'certification_evaluations',
    entityId:       evalRow.id,
    metadata:       {
      total_score:    result.total_score,
      grade:          result.grade,
      is_certifiable: result.is_certifiable,
    },
  });

  revalidatePath(`/review/certification/${appId}`);
  return { success: true, score: result.total_score, grade: result.grade };
}

// =============================================================
// CERTIFICATION DECISION
// Records decision in certification_history + appends trust_event
// =============================================================
export async function certificationDecision(
  _prev: { error?: string; success?: boolean } | null,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const me = await requireReviewer();
  if (!me) return { error: 'Reviewer role required' };

  const appId    = formData.get('appId')    as string;
  const orgId    = formData.get('orgId')    as string;
  const decision = formData.get('decision') as string; // 'certified' | 'not_certified' | 'suspended'
  const reason   = formData.get('reason')   as string;
  const evalId   = formData.get('evalId')   as string | null;

  if (!['certified', 'not_certified'].includes(decision)) {
    return { error: 'Invalid decision' };
  }

  const svc = createServiceClient();

  // Get previous certification status
  const { data: prevHist } = await svc
    .from('certification_history')
    .select('new_status')
    .eq('organization_id', orgId)
    .order('decided_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  // Compute valid_from / valid_to
  const today     = new Date();
  const validFrom = today.toISOString().split('T')[0];
  const validTo   = decision === 'certified'
    ? new Date(today.setFullYear(today.getFullYear() + 1)).toISOString().split('T')[0]
    : null;

  // Append to certification_history (immutable)
  const { data: histRow, error: histError } = await svc
    .from('certification_history')
    .insert({
      organization_id:             orgId,
      certification_application_id: appId,
      evaluation_id:               evalId || null,
      previous_status:             prevHist?.new_status ?? null,
      new_status:                  decision,
      valid_from:                  validFrom,
      valid_to:                    validTo,
      decided_by_user_id:          me.id,
      decision_reason:             reason || null,
    })
    .select('id')
    .single();

  if (histError || !histRow) {
    return { error: 'Failed to record certification decision' };
  }

  // Update application status
  await svc
    .from('certification_applications')
    .update({
      status:           decision === 'certified' ? 'approved' : 'rejected',
      reviewer_comment: reason || null,
      updated_at:       new Date().toISOString(),
    })
    .eq('id', appId);

  // Append trust event
  await svc.from('trust_events').insert({
    organization_id:  orgId,
    event_type:       TRUST_EVENT_TYPES.CERTIFICATION_UPDATED,
    event_ref_table:  'certification_history',
    event_ref_id:     histRow.id,
    payload:          { new_status: decision, reason },
    actor_user_id:    me.id,
    source:           'reviewer',
    idempotency_key:  `cert_updated_${histRow.id}`,
  });

  await writeAuditLog({
    actorUserId:    me.id,
    actorRole:      me.platform_role,
    organizationId: orgId,
    action:         decision === 'certified'
      ? AUDIT_ACTIONS.CERTIFICATION_APPROVED
      : AUDIT_ACTIONS.CERTIFICATION_REJECTED,
    entityTable:    'certification_history',
    entityId:       histRow.id,
    metadata:       { decision, reason, valid_from: validFrom, valid_to: validTo },
  });

  // Trigger Amanah recalc
  await triggerAmanahRecalc({
    organizationId: orgId,
    triggerEvent:   'certification_updated',
    actorUserId:    me.id,
  });

  revalidatePath('/review/certification');
  return { success: true };
}
