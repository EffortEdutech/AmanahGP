'use server';
// apps/admin/app/(dashboard)/review/certification-actions.ts
// AmanahHub Console — CTCF evaluation and certification decision actions
// Fixed: triggerAmanahRecalc from './recalculate' (was incorrectly './review/recalculate')

import { revalidatePath }                    from 'next/cache';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { writeAuditLog }                     from '@/lib/audit';
import { isReviewerOrAbove, AUDIT_ACTIONS, TRUST_EVENT_TYPES } from '@agp/config';
import { computeCtcfScore }                  from '@agp/scoring';
import type { CtcfInput }                    from '@agp/scoring';
// triggerAmanahRecalc lives in review/recalculate.ts — same folder, not a subfolder
import { triggerAmanahRecalc }               from './recalculate';

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
// =============================================================
export async function submitCtcfEvaluation(
  _prev: { error?: string; success?: boolean; score?: number } | null,
  formData: FormData
): Promise<{ error?: string; success?: boolean; score?: number; grade?: string }> {
  const me = await requireReviewer();
  if (!me) return { error: 'Reviewer role required' };

  const appId = formData.get('appId') as string;
  const orgId = formData.get('orgId') as string;
  const notes = formData.get('notes') as string;

  const bool     = (k: string) => formData.get(k) === 'true';
  const nullable = (k: string): boolean | null => {
    const v = formData.get(k);
    if (v === 'na') return null;
    return v === 'true';
  };

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
      hasImpactPerCostMetric:  bool('l4_cost_effectiveness'),
    },
    layer5: {
      hasShariahAdvisor: bool('l5_advisor'),
      hasShariahPolicy: bool('l5_policy'),
      hasZakatEligibilityGov: nullable('l5_zakat_gov'),
      hasWaqfAssetGovernance: nullable('l5_waqf_gov'),
    },
  };

  const result = computeCtcfScore(input);

  if (!result.gatePassed) {
    return { error: 'Layer 1 governance gate not passed. All 6 items are required.' };
  }

  const svc = createServiceClient();

  const { data: evalRow, error: evalErr } = await svc
    .from('certification_evaluations')
    .insert({
      organization_id:               orgId,
      certification_application_id:  appId,
      criteria_version:              'ctcf_v1',
      total_score:                   result.totalScore,
      score_breakdown:               result.breakdown,
      computed_at:                   new Date().toISOString(),
      computed_by_user_id:           me.id,
      notes:                         notes || null,
    })
    .select('id').single();

  if (evalErr || !evalRow) return { error: 'Failed to save evaluation' };

  // Update application status
  await svc
    .from('certification_applications')
    .update({ status: 'under_review', reviewer_assigned_user_id: me.id })
    .eq('id', appId);

  await writeAuditLog({
    actorUserId:    me.id,
    actorRole:      me.platform_role,
    organizationId: orgId,
    action:         'CTCF_EVALUATED',
    entityTable:    'certification_evaluations',
    entityId:       evalRow.id,
    metadata:       { total_score: result.totalScore, grade: result.grade },
  });

  revalidatePath(`/review/certification/${appId}`);
  return { success: true, score: result.totalScore, grade: result.grade };
}

// =============================================================
// CERTIFICATION DECISION
// =============================================================
export async function certificationDecision(
  _prev: { error?: string; success?: boolean } | null,
  formData: FormData
): Promise<{ error?: string; success?: boolean; message?: string }> {
  const me = await requireReviewer();
  if (!me) return { error: 'Reviewer role required' };

  const appId    = formData.get('appId')    as string;
  const orgId    = formData.get('orgId')    as string;
  const evalId   = formData.get('evalId')   as string;
  const decision = formData.get('decision') as 'certified' | 'not_certified';
  const reason   = (formData.get('reason') as string) || null;

  if (!['certified', 'not_certified'].includes(decision)) {
    return { error: 'Invalid decision' };
  }

  const svc = createServiceClient();
  const now = new Date().toISOString();

  const validFrom = decision === 'certified'
    ? new Date().toISOString().split('T')[0]
    : null;
  const validTo = decision === 'certified'
    ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    : null;

  const { data: histRow, error: histErr } = await svc
    .from('certification_history')
    .insert({
      organization_id:              orgId,
      certification_application_id: appId,
      evaluation_id:                evalId || null,
      new_status:                   decision,
      valid_from:                   validFrom,
      valid_to:                     validTo,
      decided_by_user_id:           me.id,
      decision_reason:              reason,
      decided_at:                   now,
    })
    .select('id').single();

  if (histErr || !histRow) return { error: 'Failed to record decision' };

  await svc
    .from('certification_applications')
    .update({ status: decision === 'certified' ? 'approved' : 'rejected', reviewer_comment: reason })
    .eq('id', appId);

  await svc.from('trust_events').insert({
    organization_id: orgId,
    event_type:      TRUST_EVENT_TYPES.CERTIFICATION_UPDATED,
    event_ref_table: 'certification_history',
    event_ref_id:    histRow.id,
    payload:         { decision, reason, valid_from: validFrom, valid_to: validTo },
    actor_user_id:   me.id,
    source:          'reviewer',
    idempotency_key: `cert_decision_${appId}_${now}`,
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

  await triggerAmanahRecalc({
    organizationId: orgId,
    triggerEvent:   'certification_updated',
    actorUserId:    me.id,
  });

  revalidatePath('/review/certification');
  return { success: true, message: `${decision === 'certified' ? 'Certification granted' : 'Not certified'}.` };
}
