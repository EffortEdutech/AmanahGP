'use server';
// apps/admin/app/(dashboard)/review/document-actions.ts
// AmanahHub Console — Reviewer: approve org documents for public visibility
// When approved, the document becomes visible to donors on AmanahHub.

import { revalidatePath }                    from 'next/cache';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { writeAuditLog }                     from '@/lib/audit';
import { isReviewerOrAbove }                 from '@agp/config';

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
// APPROVE DOCUMENT FOR PUBLIC VISIBILITY
// Marks is_approved_public = true so donors can view the PDF.
// =============================================================
export async function approveDocumentPublic(
  _prev: { error?: string; success?: boolean } | null,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const me = await requireReviewer();
  if (!me) return { error: 'Reviewer role required' };

  const docId  = formData.get('docId')  as string;
  const orgId  = formData.get('orgId')  as string;
  const action = formData.get('action') as 'approve' | 'revoke';

  if (!docId || !orgId) return { error: 'Missing required fields' };

  const svc = createServiceClient();

  const updateData = action === 'approve'
    ? { is_approved_public: true, visibility: 'public', approved_by_user_id: me.id, approved_at: new Date().toISOString() }
    : { is_approved_public: false, visibility: 'private', approved_by_user_id: null, approved_at: null };

  const { error } = await svc
    .from('org_documents')
    .update(updateData)
    .eq('id', docId)
    .eq('organization_id', orgId);

  if (error) return { error: 'Failed to update document visibility' };

  await writeAuditLog({
    actorUserId:    me.id,
    actorRole:      me.platform_role,
    organizationId: orgId,
    action:         action === 'approve' ? 'DOCUMENT_APPROVED_PUBLIC' : 'DOCUMENT_REVOKED_PUBLIC',
    entityTable:    'org_documents',
    entityId:       docId,
    metadata:       { action },
  });

  revalidatePath(`/review/onboarding/${orgId}`);
  revalidatePath(`/orgs/${orgId}`);
  return { success: true };
}
