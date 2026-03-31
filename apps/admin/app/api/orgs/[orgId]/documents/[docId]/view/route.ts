// apps/admin/app/api/orgs/[orgId]/documents/[docId]/view/route.ts
// AmanahHub Console — Generate signed read URL for viewing an org document
// Works for org members (all docs) and public (approved only via AmanahHub)

import { NextRequest, NextResponse }        from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string; docId: string }> }
) {
  const { orgId, docId } = await params;
  const svc = createServiceClient();

  // Fetch the document record
  const { data: doc, error } = await svc
    .from('org_documents')
    .select('storage_path, storage_bucket, visibility, is_approved_public, organization_id')
    .eq('id', docId)
    .single();

  if (error || !doc) {
    return NextResponse.json({ ok: false, error: 'Document not found' }, { status: 404 });
  }

  if (doc.organization_id !== orgId) {
    return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });
  }

  // Check access: public doc OR authenticated org member
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!doc.is_approved_public) {
    // Private doc — must be authenticated org member or reviewer
    if (!user) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }
    const { data: isMember } = await supabase
      .rpc('is_org_member', { org_id: orgId });
    const { data: profile } = await supabase
      .from('users').select('platform_role')
      .eq('auth_provider_user_id', user.id).single();
    const isPrivileged = ['reviewer', 'scholar', 'super_admin'].includes(profile?.platform_role ?? '');

    if (!isMember && !isPrivileged) {
      return NextResponse.json({ ok: false, error: 'Access denied' }, { status: 403 });
    }
  }

  // Generate signed URL (60 minutes)
  const { data: signedUrl, error: urlError } = await svc.storage
    .from(doc.storage_bucket)
    .createSignedUrl(doc.storage_path, 3600);

  if (urlError || !signedUrl) {
    return NextResponse.json({ ok: false, error: 'Failed to generate view URL' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, url: signedUrl.signedUrl });
}
