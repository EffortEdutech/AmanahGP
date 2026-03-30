'use server';
// apps/admin/app/(dashboard)/review/actions.ts
// AmanahHub Console — Reviewer decision server actions
//
// Covers:
//   - Org onboarding: approve / reject / request_changes
//   - Report verification: verified / rejected / changes_requested
//   - Evidence: approve public
//
// Every decision writes an audit log.
// Report verification triggers a trust_event → amanah recalc.

import { revalidatePath }                    from 'next/cache';
import { redirect }                          from 'next/navigation';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { writeAuditLog }                     from '@/lib/audit';
import { AUDIT_ACTIONS, TRUST_EVENT_TYPES, isReviewerOrAbove } from '@agp/config';

// ── Guard: reviewer or super_admin only ───────────────────────
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

// ── Trust event append (service role) ────────────────────────
async function appendTrustEvent(params: {
  organizationId: string;
  eventType:      string;
  refTable:       string;
  refId:          string;
  payload:        Record<string, unknown>;
  actorUserId:    string | null;
  idempotencyKey: string;
}) {
  const svc = createServiceClient();
  await svc.from('trust_events').insert({
    organization_id: params.organizationId,
    event_type:      params.eventType,
    event_ref_table: params.refTable,
    event_ref_id:    params.refId,
    payload:         params.payload,
    actor_user_id:   params.actorUserId,
    source:          'reviewer',
    idempotency_key: params.idempotencyKey,
  });
}

// =============================================================
// ORG ONBOARDING DECISION
// approve | reject | changes_requested
// =============================================================
export async function orgOnboardingDecision(
  _prev: { error?: string } | null,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const me = await requireReviewer();
  if (!me) return { error: 'Reviewer role required' };

  const orgId    = formData.get('orgId') as string;
  const decision = formData.get('decision') as string;
  const comment  = (formData.get('comment') as string) || null;

  if (!['approved', 'rejected', 'changes_requested'].includes(decision)) {
    return { error: 'Invalid decision' };
  }

  const svc = createServiceClient();

  const updateData: Record<string, unknown> = {
    onboarding_status: decision,
    updated_at: new Date().toISOString(),
  };

  if (decision === 'approved') {
    updateData.approved_at          = new Date().toISOString();
    updateData.approved_by_user_id  = me.id;
    updateData.listing_status       = 'listed';
  }

  const { error } = await svc
    .from('organizations')
    .update(updateData)
    .eq('id', orgId);

  if (error) return { error: 'Failed to update onboarding status' };

  const auditAction =
    decision === 'approved'          ? AUDIT_ACTIONS.ORG_APPROVED :
    decision === 'rejected'          ? AUDIT_ACTIONS.ORG_REJECTED :
    'ORG_CHANGES_REQUESTED';

  await writeAuditLog({
    actorUserId: me.id, actorRole: me.platform_role, organizationId: orgId,
    action: auditAction, entityTable: 'organizations', entityId: orgId,
    metadata: { decision, comment },
  });

  revalidatePath('/review/onboarding');
  revalidatePath(`/review/onboarding/${orgId}`);
  return { success: true };
}

// =============================================================
// REPORT VERIFICATION DECISION
// verified | rejected | changes_requested
// =============================================================
export async function reportVerificationDecision(
  _prev: { error?: string } | null,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const me = await requireReviewer();
  if (!me) return { error: 'Reviewer role required' };

  const reportId = formData.get('reportId') as string;
  const decision = formData.get('decision') as string;
  const comment  = (formData.get('comment') as string) || null;

  if (!['verified', 'rejected', 'changes_requested'].includes(decision)) {
    return { error: 'Invalid decision' };
  }

  const svc = createServiceClient();

  // Fetch report to get org id
  const { data: report } = await svc
    .from('project_reports')
    .select('id, organization_id, project_id, title')
    .eq('id', reportId).single();

  if (!report) return { error: 'Report not found' };

  const updateData: Record<string, unknown> = {
    verification_status: decision,
    reviewer_comment:    comment,
    updated_at:          new Date().toISOString(),
  };

  if (decision === 'verified') {
    updateData.verified_at          = new Date().toISOString();
    updateData.verified_by_user_id  = me.id;
    // Make project public when first report is verified
    await svc.from('projects')
      .update({ is_public: true, updated_at: new Date().toISOString() })
      .eq('id', report.project_id);
  }

  const { error } = await svc
    .from('project_reports')
    .update(updateData)
    .eq('id', reportId);

  if (error) return { error: 'Failed to update report status' };

  // Audit log
  const auditAction =
    decision === 'verified'          ? AUDIT_ACTIONS.REPORT_VERIFIED :
    decision === 'rejected'          ? AUDIT_ACTIONS.REPORT_REJECTED :
    'REPORT_CHANGES_REQUESTED';

  await writeAuditLog({
    actorUserId: me.id, actorRole: me.platform_role,
    organizationId: report.organization_id,
    action: auditAction, entityTable: 'project_reports', entityId: reportId,
    metadata: { decision, comment, title: report.title },
  });

  // Trust event (only on verified)
  if (decision === 'verified') {
    await appendTrustEvent({
      organizationId: report.organization_id,
      eventType:      TRUST_EVENT_TYPES.REPORT_VERIFIED,
      refTable:       'project_reports',
      refId:          reportId,
      payload:        { report_title: report.title, project_id: report.project_id },
      actorUserId:    me.id,
      idempotencyKey: `${TRUST_EVENT_TYPES.REPORT_VERIFIED}_${reportId}`,
    });
  }

  revalidatePath('/review/reports');
  revalidatePath(`/review/reports/${reportId}`);
  return { success: true };
}

// =============================================================
// APPROVE EVIDENCE FOR PUBLIC DISPLAY
// =============================================================
export async function approveEvidencePublic(
  _prev: { error?: string } | null,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const me = await requireReviewer();
  if (!me) return { error: 'Reviewer role required' };

  const evidenceId = formData.get('evidenceId') as string;

  const svc = createServiceClient();

  const { data: ev } = await svc
    .from('evidence_files')
    .select('id, organization_id, project_report_id, file_name')
    .eq('id', evidenceId).single();

  if (!ev) return { error: 'Evidence not found' };

  const { error } = await svc
    .from('evidence_files')
    .update({
      is_approved_public:  true,
      visibility:          'public',
      approved_by_user_id: me.id,
      approved_at:         new Date().toISOString(),
      updated_at:          new Date().toISOString(),
    })
    .eq('id', evidenceId);

  if (error) return { error: 'Failed to approve evidence' };

  await writeAuditLog({
    actorUserId: me.id, actorRole: me.platform_role,
    organizationId: ev.organization_id,
    action: AUDIT_ACTIONS.EVIDENCE_APPROVED_PUBLIC,
    entityTable: 'evidence_files', entityId: evidenceId,
    metadata: { file_name: ev.file_name, report_id: ev.project_report_id },
  });

  revalidatePath(`/review/reports/${ev.project_report_id}`);
  return { success: true };
}
