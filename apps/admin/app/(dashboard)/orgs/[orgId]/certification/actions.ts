'use server';
// apps/admin/app/(dashboard)/orgs/[orgId]/certification/actions.ts
// AmanahHub Console — Certification application server actions

import { revalidatePath }                    from 'next/cache';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { writeAuditLog }                     from '@/lib/audit';
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
// CREATE + SUBMIT CERTIFICATION APPLICATION
// =============================================================
export async function applyForCertification(
  _prev: { error?: string } | null,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const orgId = formData.get('orgId') as string;

  const me = await currentUser();
  if (!me) return { error: 'Not authenticated' };

  const ok = await requireOrgRole(orgId, 'org_admin');
  if (!ok) return { error: 'Only org admins can apply for certification' };

  const svc = createServiceClient();

  // Check no active application already exists
  const { data: existing } = await svc
    .from('certification_applications')
    .select('id, status')
    .eq('organization_id', orgId)
    .in('status', ['draft', 'submitted', 'under_review'])
    .maybeSingle();

  if (existing) {
    return { error: `An active application already exists (status: ${existing.status})` };
  }

  // Create and immediately submit
  const { data: app, error } = await svc
    .from('certification_applications')
    .insert({
      organization_id:      orgId,
      status:               'submitted',
      submitted_at:         new Date().toISOString(),
      submitted_by_user_id: me.id,
    })
    .select('id').single();

  if (error || !app) return { error: 'Failed to create application' };

  await writeAuditLog({
    actorUserId: me.id, actorRole: 'org_admin', organizationId: orgId,
    action: AUDIT_ACTIONS.CERTIFICATION_SUBMITTED,
    entityTable: 'certification_applications', entityId: app.id,
    metadata: {},
  });

  revalidatePath(`/orgs/${orgId}/certification`);
  return { success: true };
}
