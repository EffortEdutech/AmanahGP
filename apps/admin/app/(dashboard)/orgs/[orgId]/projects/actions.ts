'use server';
// apps/admin/app/(dashboard)/orgs/[orgId]/projects/actions.ts
// AmanahHub Console — Project server actions

import { revalidatePath }                   from 'next/cache';
import { redirect }                         from 'next/navigation';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { writeAuditLog }                    from '@/lib/audit';
import { createProjectSchema }              from '@agp/validation';

// ── Guard ─────────────────────────────────────────────────────
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
    .from('users').select('id, platform_role')
    .eq('auth_provider_user_id', user.id).single();
  return data;
}

// =============================================================
// CREATE PROJECT
// =============================================================
export async function createProject(
  _prev: { error?: string } | null,
  formData: FormData
): Promise<{ error?: string; projectId?: string }> {
  const orgId = formData.get('orgId') as string;
  if (!orgId) return { error: 'Organization ID missing' };

  const me = await currentUser();
  if (!me) return { error: 'Not authenticated' };

  const ok = await requireOrgRole(orgId, 'org_manager');
  if (!ok) return { error: 'Permission denied' };

  const raw = {
    title:              formData.get('title') as string,
    objective:          formData.get('objective') as string,
    description:        formData.get('description') as string,
    locationText:       formData.get('locationText') as string,
    startDate:          formData.get('startDate') as string,
    endDate:            formData.get('endDate') as string,
    budgetAmount:       formData.get('budgetAmount') as string,
    beneficiarySummary: formData.get('beneficiarySummary') as string,
  };

  const parsed = createProjectSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? 'Validation error' };

  const svc = createServiceClient();
  const { data: proj, error } = await svc
    .from('projects')
    .insert({
      organization_id:     orgId,
      title:               parsed.data.title,
      objective:           parsed.data.objective,
      description:         parsed.data.description || null,
      location_text:       parsed.data.locationText || null,
      start_date:          parsed.data.startDate || null,
      end_date:            parsed.data.endDate || null,
      budget_amount:       parsed.data.budgetAmount,
      beneficiary_summary: parsed.data.beneficiarySummary || null,
      status:              'active',
      is_public:           false,
    })
    .select('id').single();

  if (error || !proj) return { error: 'Failed to create project' };

  await writeAuditLog({
    actorUserId: me.id, actorRole: 'org_manager', organizationId: orgId,
    action: 'PROJECT_CREATED', entityTable: 'projects', entityId: proj.id,
    metadata: { title: parsed.data.title },
  });

  return { projectId: proj.id };
}

// =============================================================
// UPDATE PROJECT
// =============================================================
export async function updateProject(
  _prev: { error?: string } | null,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const orgId     = formData.get('orgId') as string;
  const projectId = formData.get('projectId') as string;
  if (!orgId || !projectId) return { error: 'Missing IDs' };

  const me = await currentUser();
  if (!me) return { error: 'Not authenticated' };

  const ok = await requireOrgRole(orgId, 'org_manager');
  if (!ok) return { error: 'Permission denied' };

  const raw = {
    title:              formData.get('title') as string,
    objective:          formData.get('objective') as string,
    description:        formData.get('description') as string,
    locationText:       formData.get('locationText') as string,
    startDate:          formData.get('startDate') as string,
    endDate:            formData.get('endDate') as string,
    budgetAmount:       formData.get('budgetAmount') as string,
    beneficiarySummary: formData.get('beneficiarySummary') as string,
  };

  const parsed = createProjectSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? 'Validation error' };

  const svc = createServiceClient();
  const { error } = await svc.from('projects').update({
    title:               parsed.data.title,
    objective:           parsed.data.objective,
    description:         parsed.data.description || null,
    location_text:       parsed.data.locationText || null,
    start_date:          parsed.data.startDate || null,
    end_date:            parsed.data.endDate || null,
    budget_amount:       parsed.data.budgetAmount,
    beneficiary_summary: parsed.data.beneficiarySummary || null,
    updated_at:          new Date().toISOString(),
  }).eq('id', projectId).eq('organization_id', orgId);

  if (error) return { error: 'Failed to update project' };

  revalidatePath(`/orgs/${orgId}/projects/${projectId}`);
  return { success: true };
}

// =============================================================
// ARCHIVE PROJECT
// =============================================================
export async function archiveProject(formData: FormData): Promise<void> {
  const orgId     = formData.get('orgId') as string;
  const projectId = formData.get('projectId') as string;

  const me = await currentUser();
  if (!me) return;

  const ok = await requireOrgRole(orgId, 'org_manager');
  if (!ok) return;

  const svc = createServiceClient();
  await svc.from('projects')
    .update({ status: 'archived', updated_at: new Date().toISOString() })
    .eq('id', projectId).eq('organization_id', orgId);

  await writeAuditLog({
    actorUserId: me.id, actorRole: 'org_manager', organizationId: orgId,
    action: 'PROJECT_ARCHIVED', entityTable: 'projects', entityId: projectId,
    metadata: {},
  });

  redirect(`/orgs/${orgId}/projects`);
}
