'use server';
// apps/admin/app/(dashboard)/review/certification-actions.ts
// AmanahHub Console — CTCF evaluation and certification decision actions
//
// Updated for ctcf_v2:
//   - Reads Full / Partial / No / N/A responses from FormData
//   - Reads sizeBand from FormData
//   - Builds CtcfInput with v2 interfaces
//   - Writes criteria_version: 'ctcf_v2'

import { revalidatePath }                    from 'next/cache';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { writeAuditLog }                     from '@/lib/audit';
import { isReviewerOrAbove, AUDIT_ACTIONS, TRUST_EVENT_TYPES } from '@agp/config';
import { computeCtcfScore }                  from '@agp/scoring';
import type { CtcfInput, CtcfResponse, OrgSizeBand } from '@agp/scoring';
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
// SUBMIT CTCF EVALUATION (v2)
// =============================================================
export async function submitCtcfEvaluation(
  _prev: { error?: string; success?: boolean; score?: number } | null,
  formData: FormData,
): Promise<{ error?: string; success?: boolean; score?: number; grade?: string }> {
  const me = await requireReviewer();
  if (!me) return { error: 'Reviewer role required' };

  const appId = formData.get('appId') as string;
  const orgId = formData.get('orgId') as string;
  const notes = formData.get('notes') as string | null;

  // ── FormData helpers ────────────────────────────────────────
  /**
   * Read a CtcfResponse from the form.
   * Valid form values: 'full' | 'partial' | 'no' | 'na'
   * Layer 1 gate fields use 'true' | 'false' — handled separately.
   */
  const resp = (key: string): CtcfResponse => {
    const v = formData.get(key) as string | null;
    if (v === 'full' || v === 'partial' || v === 'no' || v === 'na') return v;
    return 'no'; // safe fallback — treated as not met
  };

  const bool = (key: string): boolean =>
    formData.get(key) === 'true';

  const sizeBand = (formData.get('sizeBand') as OrgSizeBand | null) ?? 'small';
  const validSizeBands: OrgSizeBand[] = ['micro', 'small', 'medium', 'large'];
  if (!validSizeBands.includes(sizeBand)) {
    return { error: 'Invalid size band value' };
  }

  // ── Build ctcf_v2 input ─────────────────────────────────────
  const input: CtcfInput = {
    sizeBand,
    layer1: {
      legalRegistration:     bool('l1_legal'),
      governingDocument:     bool('l1_governing'),
      namedBoard:            bool('l1_board'),
      conflictOfInterest:    bool('l1_coi'),
      bankAccountSeparation: bool('l1_bank'),
      contactAndAddress:     bool('l1_contact'),
    },
    layer2: {
      annualFinancialStatement: resp('l2_financial_statement'),
      auditEvidence:            resp('l2_audit'),
      programAdminBreakdown:    resp('l2_breakdown'),
      zakatSegregation:         resp('l2_zakat'),
    },
    layer3: {
      budgetVsActual:       resp('l3_budget'),
      geoVerifiedReporting: resp('l3_geo'),
      beforeAfterDocs:      resp('l3_before_after'),
      beneficiaryMetrics:   resp('l3_beneficiary'),
      completionTimeliness: resp('l3_timeliness'),
    },
    layer4: {
      kpiQualityAndToC:    resp('l4_kpi_toc'),
      sustainabilityPlan:  resp('l4_sustainability'),
      continuityTracking:  resp('l4_continuity'),
      impactPerCostMetric: resp('l4_impact_cost'),
    },
    layer5: {
      shariahAdvisor:      resp('l5_advisor'),
      shariahPolicy:       resp('l5_policy'),
      zakatEligibilityGov: resp('l5_zakat_gov'),
      waqfAssetGovernance: resp('l5_waqf_gov'),
    },
  };

  // ── Compute score ───────────────────────────────────────────
  const result = computeCtcfScore(input);

  const svc = createServiceClient();

  // ── Append evaluation (never overwrite) ────────────────────
  const { data: evalRow, error: evalError } = await svc
    .from('certification_evaluations')
    .insert({
      organization_id:              orgId,
      certification_application_id: appId,
      criteria_version:             'ctcf_v2',          // v2 discriminator
      total_score:                  result.total_score, // normalised 0–100
      score_breakdown:              result.breakdown,   // full JSONB with raw_total + layers
      computed_by_user_id:          me.id,
      notes:                        notes || null,
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
    metadata: {
      criteria_version: 'ctcf_v2',
      size_band:        input.sizeBand,
      total_score:      result.total_score,
      raw_total:        result.raw_total,
      grade:            result.grade,
      is_certifiable:   result.is_certifiable,
      l2_passes_floor:  result.layer2_passes_minimum,
    },
  });

  revalidatePath(`/review/certification/${appId}`);
  return { success: true, score: result.total_score, grade: result.grade };
}

// =============================================================
// CERTIFICATION DECISION
// Records decision in certification_history + appends trust_event
// No changes from v1 — this layer is version-agnostic.
// =============================================================
export async function certificationDecision(
  _prev: { error?: string; success?: boolean } | null,
  formData: FormData,
): Promise<{ error?: string; success?: boolean }> {
  const me = await requireReviewer();
  if (!me) return { error: 'Reviewer role required' };

  const appId    = formData.get('appId')    as string;
  const orgId    = formData.get('orgId')    as string;
  const decision = formData.get('decision') as string;
  const reason   = formData.get('reason')   as string;
  const evalId   = formData.get('evalId')   as string | null;

  if (!appId || !orgId || !decision) {
    return { error: 'Missing required fields' };
  }
  if (!['certified', 'not_certified', 'suspended'].includes(decision)) {
    return { error: 'Invalid decision value' };
  }

  const svc = createServiceClient();

  // Append to certification_history (immutable)
  const { error: histError } = await svc
    .from('certification_history')
    .insert({
      organization_id:              orgId,
      certification_application_id: appId,
      certification_evaluation_id:  evalId ?? null,
      decision,
      reason:                       reason || null,
      decided_by_user_id:           me.id,
    });

  if (histError) return { error: 'Failed to record decision' };

  // Update application status
  const newStatus = decision === 'certified' ? 'approved'
    : decision === 'suspended'               ? 'suspended'
    : 'rejected';

  await svc
    .from('certification_applications')
    .update({ status: newStatus, reviewed_at: new Date().toISOString() })
    .eq('id', appId);

  // Append trust event
  await svc.from('trust_events').insert({
    organization_id: orgId,
    event_type:      TRUST_EVENT_TYPES.CERTIFICATION_UPDATED,
    metadata: {
      decision,
      application_id: appId,
      evaluation_id:  evalId ?? null,
    },
  });

  await writeAuditLog({
    actorUserId:    me.id,
    actorRole:      me.platform_role,
    organizationId: orgId,
    action:         decision === 'certified'
      ? AUDIT_ACTIONS.CERTIFICATION_APPROVED
      : AUDIT_ACTIONS.CERTIFICATION_REJECTED,
    entityTable:    'certification_applications',
    entityId:       appId,
    metadata:       { decision, reason: reason || null },
  });

  // Trigger Amanah recalculation
  await triggerAmanahRecalc(orgId, 'certification_updated');

  revalidatePath(`/review/certification`);
  revalidatePath(`/review/certification/${appId}`);
  return { success: true };
}
