// apps/user/app/api/public/orgs/[orgId]/documents/[docId]/view/route.ts
// AmanahHub — Public signed URL for approved org documents (donor-facing)
// Only returns URLs for documents where is_approved_public = true.

import { NextRequest, NextResponse } from 'next/server';
import { createClient }              from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string; docId: string }> }
) {
  const { orgId, docId } = await params;
  const supabase = await createClient();

  // Only fetch approved public docs — anon-safe query
  const { data: doc, error } = await supabase
    .from('org_documents')
    .select('storage_path, storage_bucket, is_approved_public, organization_id')
    .eq('id', docId)
    .eq('organization_id', orgId)
    .eq('is_approved_public', true)
    .single();

  if (error || !doc) {
    return NextResponse.json({ ok: false, error: 'Document not found or not public' }, { status: 404 });
  }

  // Use service client to generate signed URL
  const { createServiceClient } = await import('@/lib/supabase/server');
  const svc = createServiceClient();

  const { data: signedUrl, error: urlError } = await svc.storage
    .from(doc.storage_bucket)
    .createSignedUrl(doc.storage_path, 3600); // 1 hour

  if (urlError || !signedUrl) {
    return NextResponse.json({ ok: false, error: 'Could not generate view URL' }, { status: 500 });
  }

  // Redirect directly to signed URL so browser can render PDF inline
  return NextResponse.redirect(signedUrl.signedUrl);
}
