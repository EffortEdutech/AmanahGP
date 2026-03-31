// apps/admin/app/api/orgs/[orgId]/documents/upload-url/route.ts
// AmanahHub Console — Generate pre-signed upload URL for org documents
// Creates org_documents record in pending state, returns signed URL for direct upload.

import { NextRequest, NextResponse }        from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

interface UploadBody {
  fileName:         string;
  mimeType:         string;
  fileSizeBytes:    number;
  documentCategory: string; // 'governance' | 'financial' | 'shariah'
  documentType:     string; // e.g. 'registration_cert', 'audit_report'
  label:            string; // human-readable
  description?:     string;
  periodYear?:      number; // for financial docs
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const { orgId } = await params;

  // Auth
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

  // RBAC: must be org_manager or above
  const { data: canUpload } = await supabase
    .rpc('org_role_at_least', { org_id: orgId, min_role: 'org_manager' });
  if (!canUpload) {
    return NextResponse.json({ ok: false, error: 'Permission denied' }, { status: 403 });
  }

  // Get user record
  const { data: me } = await supabase
    .from('users').select('id').eq('auth_provider_user_id', user.id).single();
  if (!me) return NextResponse.json({ ok: false, error: 'User not found' }, { status: 400 });

  let body: UploadBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid request body' }, { status: 400 });
  }

  // Validate required fields
  const required = ['fileName', 'mimeType', 'documentCategory', 'documentType', 'label'];
  for (const f of required) {
    if (!body[f as keyof UploadBody]) {
      return NextResponse.json({ ok: false, error: `Missing field: ${f}` }, { status: 400 });
    }
  }

  // Build storage path
  const ext      = body.fileName.split('.').pop()?.toLowerCase() ?? 'pdf';
  const fileId   = crypto.randomUUID();
  const yearPart = body.periodYear ? `/${body.periodYear}` : '';
  const path     = `org/${orgId}/${body.documentCategory}${yearPart}/${fileId}.${ext}`;

  const svc = createServiceClient();

  // Generate signed upload URL
  const { data: signedData, error: urlError } = await svc.storage
    .from('documents')
    .createSignedUploadUrl(path);

  if (urlError || !signedData) {
    console.error('[doc upload-url] Storage error:', urlError?.message);
    return NextResponse.json({ ok: false, error: 'Failed to generate upload URL' }, { status: 500 });
  }

  // Create org_documents record
  const { data: docRecord, error: dbError } = await svc
    .from('org_documents')
    .insert({
      organization_id:     orgId,
      uploaded_by_user_id: me.id,
      document_category:   body.documentCategory,
      document_type:       body.documentType,
      label:               body.label,
      description:         body.description ?? null,
      file_name:           body.fileName,
      mime_type:           body.mimeType,
      storage_bucket:      'documents',
      storage_path:        path,
      file_size_bytes:     body.fileSizeBytes ?? null,
      period_year:         body.periodYear ?? null,
      visibility:          'private',
      is_approved_public:  false,
    })
    .select('id').single();

  if (dbError || !docRecord) {
    console.error('[doc upload-url] DB error:', dbError?.message);
    return NextResponse.json({ ok: false, error: 'Failed to create document record' }, { status: 500 });
  }

  return NextResponse.json({
    ok:          true,
    documentId:  docRecord.id,
    uploadUrl:   signedData.signedUrl,
    storagePath: path,
  });
}
