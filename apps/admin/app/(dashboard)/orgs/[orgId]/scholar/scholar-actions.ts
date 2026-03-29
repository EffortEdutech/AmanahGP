'use server';
// apps/admin/app/(dashboard)/orgs/[orgId]/scholar/scholar-actions.ts

import { revalidatePath }                    from 'next/cache';
import { createClient, createServiceClient } from '@/lib/supabase/server';

export async function addScholarNote(
  _prev: { error?: string; success?: boolean } | null,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const orgId      = formData.get('orgId')       as string;
  const noteBody   = formData.get('noteBody')    as string;
  const publishable = formData.get('isPublishable') === 'true';

  if (!noteBody?.trim()) return { error: 'Note cannot be empty' };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const { data: me } = await supabase
    .from('users').select('id, platform_role')
    .eq('auth_provider_user_id', user.id).single();

  if (!me || !['scholar', 'reviewer', 'super_admin'].includes(me.platform_role)) {
    return { error: 'Scholar role required' };
  }

  const svc = createServiceClient();
  const { error } = await svc.from('scholar_notes').insert({
    organization_id: orgId,
    author_user_id:  me.id,
    note_body:       noteBody.trim(),
    is_publishable:  publishable,
    published_at:    publishable ? new Date().toISOString() : null,
  });

  if (error) return { error: 'Failed to save note' };

  revalidatePath(`/orgs/${orgId}/scholar`);
  return { success: true };
}
