// apps/admin/app/api/orgs/[orgId]/documents/[docId]/route.ts
// AmanahHub Console — Delete an org document (record + storage file)

import { NextRequest, NextResponse }        from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string; docId: string }> }
) {
  const { orgId, docId } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

  // Must be org_manager or above
  const { data: canDelete } = await supabase
    .rpc('org_role_at_least', { org_id: orgId, min_role: 'org_manager' });
  if (!canDelete) {
    return NextResponse.json({ ok: false, error: 'Permission denied' }, { status: 403 });
  }

  const svc = createServiceClient();

  // Fetch the record first to get storage path
  const { data: doc } = await svc
    .from('org_documents')
    .select('id, storage_path, storage_bucket, is_approved_public, organization_id')
    .eq('id', docId)
    .eq('organization_id', orgId)
    .single();

  if (!doc) {
    return NextResponse.json({ ok: false, error: 'Document not found' }, { status: 404 });
  }

  // Block deletion of reviewer-approved public documents
  if (doc.is_approved_public) {
    return NextResponse.json({
      ok: false,
      error: 'Cannot delete a document that has been approved for public display. Ask a reviewer to revoke approval first.',
    }, { status: 403 });
  }

  // Delete from storage
  const { error: storageError } = await svc.storage
    .from(doc.storage_bucket)
    .remove([doc.storage_path]);

  if (storageError) {
    console.error('[doc delete] Storage error:', storageError.message);
    // Continue to delete DB record even if storage removal fails
    // (orphan file is less harmful than orphan DB record)
  }

  // Delete DB record
  const { error: dbError } = await svc
    .from('org_documents')
    .delete()
    .eq('id', docId)
    .eq('organization_id', orgId);

  if (dbError) {
    return NextResponse.json({ ok: false, error: 'Failed to delete document record' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
