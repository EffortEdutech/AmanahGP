'use server';
// apps/admin/app/(dashboard)/orgs/[orgId]/projects/[projectId]/reports/actions.ts
// AmanahHub Console — Report server actions (create, update, submit)

import { revalidatePath }                    from 'next/cache';
import { redirect }                          from 'next/navigation';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { writeAuditLog }                     from '@/lib/audit';
import { createReportSchema }                from '@agp/validation';
import { AUDIT_ACTIONS }                     from '@agp/config';

async function requireOrgRole(orgId: string, min: 'org_manager' | 'org_admin') {
  const supabase = await createClient();
  const { data } = await supabase.rpc('org_role_at_least', { org_id: orgId, min_role: min });
  return !!data;
}

async function currentUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from('users').select('id').eq('auth_provider_user_id', user.id).single();
  return data;
}

// =============================================================
// CREATE REPORT (draft)
// =============================================================
export async function createReport(
  _prev: { error?: string } | null,
  formData: FormData
): Promise<{ error?: string; reportId?: string }> {
  const orgId     = formData.get('orgId') as string;
  const projectId = formData.get('projectId') as string;

  const me = await currentUser();
  if (!me) return { error: 'Not authenticated' };

  const ok = await requireOrgRole(orgId, 'org_manager');
  if (!ok) return { error: 'Permission denied' };

  const raw = {
    title:                formData.get('title') as string,
    reportDate:           formData.get('reportDate') as string,
    narrative:            formData.get('narrative') as string,
    beneficiariesReached: formData.get('beneficiariesReached') as string,
    spendToDate:          formData.get('spendToDate') as string,
    milestonesCompleted:  formData.get('milestonesCompleted') as string,
    nextSteps:            formData.get('nextSteps') as string,
  };

  const parsed = createReportSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? 'Validation error' };

  const svc = createServiceClient();

  const reportBody = {
    narrative:             parsed.data.narrative,
    beneficiaries_reached: parsed.data.beneficiariesReached,
    spend_to_date:         parsed.data.spendToDate,
    milestones_completed:  parsed.data.milestonesCompleted
      ? parsed.data.milestonesCompleted.split('\n').map((s) => s.trim()).filter(Boolean)
      : [],
    next_steps:            parsed.data.nextSteps
      ? parsed.data.nextSteps.split('\n').map((s) => s.trim()).filter(Boolean)
      : [],
  };

  const { data: report, error } = await svc
    .from('project_reports')
    .insert({
      organization_id:     orgId,
      project_id:          projectId,
      title:               parsed.data.title,
      report_body:         reportBody,
      report_date:         parsed.data.reportDate || null,
      submission_status:   'draft',
      verification_status: 'pending',
    })
    .select('id').single();

  if (error || !report) return { error: 'Failed to create report' };

  await writeAuditLog({
    actorUserId: me.id, actorRole: 'org_manager', organizationId: orgId,
    action: 'REPORT_CREATED', entityTable: 'project_reports', entityId: report.id,
    metadata: { title: parsed.data.title, project_id: projectId },
  });

  return { reportId: report.id };
}

// =============================================================
// SUBMIT REPORT
// =============================================================
export async function submitReport(
  _prev: { error?: string } | null,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const orgId     = formData.get('orgId') as string;
  const projectId = formData.get('projectId') as string;
  const reportId  = formData.get('reportId') as string;

  const me = await currentUser();
  if (!me) return { error: 'Not authenticated' };

  const ok = await requireOrgRole(orgId, 'org_manager');
  if (!ok) return { error: 'Permission denied' };

  const svc = createServiceClient();

  // Verify report belongs to org and is in draft/changes_requested
  const { data: report } = await svc
    .from('project_reports')
    .select('id, submission_status, verification_status, title')
    .eq('id', reportId).eq('organization_id', orgId).single();

  if (!report) return { error: 'Report not found' };
  if (report.submission_status === 'submitted' && report.verification_status === 'pending') {
    return { error: 'Report is already submitted and pending review' };
  }

  const { error } = await svc
    .from('project_reports')
    .update({
      submission_status:   'submitted',
      verification_status: 'pending',
      submitted_at:        new Date().toISOString(),
      updated_at:          new Date().toISOString(),
    })
    .eq('id', reportId);

  if (error) return { error: 'Failed to submit report' };

  await writeAuditLog({
    actorUserId: me.id, actorRole: 'org_manager', organizationId: orgId,
    action: AUDIT_ACTIONS.REPORT_SUBMITTED, entityTable: 'project_reports', entityId: reportId,
    metadata: { title: report.title, project_id: projectId },
  });

  revalidatePath(`/orgs/${orgId}/projects/${projectId}/reports/${reportId}`);
  return { success: true };
}
