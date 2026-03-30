'use server';
// apps/admin/app/(dashboard)/orgs/[orgId]/financials/actions.ts
// AmanahHub Console — Financial snapshot server actions

import { revalidatePath }                    from 'next/cache';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { writeAuditLog }                     from '@/lib/audit';
import { financialSnapshotSchema }           from '@agp/validation';
import { AUDIT_ACTIONS }                     from '@agp/config';

async function currentUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from('users').select('id').eq('auth_provider_user_id', user.id).single();
  return data;
}

async function requireOrgRole(orgId: string, min: 'org_manager' | 'org_admin') {
  const supabase = await createClient();
  const { data } = await supabase.rpc('org_role_at_least', { org_id: orgId, min_role: min });
  return !!data;
}

// =============================================================
// UPSERT FINANCIAL SNAPSHOT
// =============================================================
export async function upsertFinancialSnapshot(
  _prev: { error?: string } | null,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const orgId = formData.get('orgId') as string;

  const me = await currentUser();
  if (!me) return { error: 'Not authenticated' };

  const ok = await requireOrgRole(orgId, 'org_manager');
  if (!ok) return { error: 'Permission denied' };

  const raw = {
    periodYear:        formData.get('periodYear') as string,
    totalIncome:       formData.get('totalIncome') as string,
    totalExpenditure:  formData.get('totalExpenditure') as string,
    programExpenditure: formData.get('programExpenditure') as string,
    adminExpenditure:  formData.get('adminExpenditure') as string,
    auditCompleted:    formData.get('auditCompleted') as string,
    auditorName:       formData.get('auditorName') as string,
    waqfAssetsValue:   formData.get('waqfAssetsValue') as string,
    notes:             formData.get('notes') as string,
  };

  const parsed = financialSnapshotSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? 'Validation error' };

  const inputs = {
    total_income:        parsed.data.totalIncome,
    total_expenditure:   parsed.data.totalExpenditure,
    program_expenditure: parsed.data.programExpenditure,
    admin_expenditure:   parsed.data.adminExpenditure,
    audit_completed:     parsed.data.auditCompleted,
    auditor_name:        parsed.data.auditorName || null,
    waqf_assets_value:   parsed.data.waqfAssetsValue,
    notes:               parsed.data.notes || null,
  };

  const svc = createServiceClient();

  // Upsert — one snapshot per org per year
  const { error } = await svc
    .from('financial_snapshots')
    .upsert(
      {
        organization_id:   orgId,
        period_year:       parsed.data.periodYear,
        currency:          'MYR',
        inputs,
        submission_status: 'draft',
        verification_status: 'pending',
        updated_at:        new Date().toISOString(),
      },
      { onConflict: 'organization_id,period_year', ignoreDuplicates: false }
    );

  if (error) return { error: 'Failed to save financial snapshot' };

  revalidatePath(`/orgs/${orgId}/financials`);
  return { success: true };
}

// =============================================================
// SUBMIT FINANCIAL SNAPSHOT
// =============================================================
export async function submitFinancialSnapshot(
  _prev: { error?: string } | null,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const orgId      = formData.get('orgId') as string;
  const periodYear = formData.get('periodYear') as string;

  const me = await currentUser();
  if (!me) return { error: 'Not authenticated' };

  const ok = await requireOrgRole(orgId, 'org_manager');
  if (!ok) return { error: 'Permission denied' };

  const svc = createServiceClient();

  const { error } = await svc
    .from('financial_snapshots')
    .update({
      submission_status: 'submitted',
      submitted_at:      new Date().toISOString(),
      updated_at:        new Date().toISOString(),
    })
    .eq('organization_id', orgId)
    .eq('period_year', parseInt(periodYear, 10))
    .eq('submission_status', 'draft');

  if (error) return { error: 'Failed to submit financial snapshot' };

  await writeAuditLog({
    actorUserId: me.id, actorRole: 'org_manager', organizationId: orgId,
    action: 'FINANCIAL_SUBMITTED', entityTable: 'financial_snapshots', entityId: null,
    metadata: { period_year: periodYear },
  });

  revalidatePath(`/orgs/${orgId}/financials`);
  return { success: true };
}
