// apps/org/app/api/policy-kit/route.ts
// Sprint 22 — Policy Kit API
//
// POST: create signed upload URL for policy document
//       → creates org_documents record (category: governance)
//       → returns signed URL for direct browser upload to Supabase Storage
//       → after upload confirmed, emits gov_policy_uploaded trust event
//
// Architecture follows ADR-005: all storage access via signed URLs.
// No direct bucket access. Storage path: org/{orgId}/governance/{uuid}-{filename}

import { createClient }        from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const service  = createServiceClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

  const { data: platformUser } = await supabase
    .from('users').select('id')
    .eq('auth_provider_user_id', user.id).single();
  if (!platformUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const body = await request.json();
  const { action, orgId, documentType, label, fileName, mimeType, fileSizeBytes } = body;

  // Verify membership
  const { data: membership } = await service
    .from('org_members').select('org_role')
    .eq('organization_id', orgId)
    .eq('user_id', platformUser.id)
    .eq('status', 'active').single();

  if (!membership || !['org_admin', 'org_manager'].includes(membership.org_role)) {
    return NextResponse.json({ error: 'Manager role required' }, { status: 403 });
  }

  // ── GET UPLOAD URL ───────────────────────────────────────────
  if (action === 'get_upload_url') {
    const ext      = fileName.split('.').pop()?.toLowerCase() ?? 'pdf';
    const fileId   = crypto.randomUUID();
    const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_').substring(0, 80);
    const path     = `org/${orgId}/governance/${fileId}-${safeName}`;

    // Create signed upload URL (expires in 5 minutes)
    const { data: signedData, error: urlError } = await service.storage
      .from('documents')
      .createSignedUploadUrl(path);

    if (urlError || !signedData) {
      console.error('[policy-kit] Storage error:', urlError?.message);
      return NextResponse.json({ error: 'Failed to generate upload URL' }, { status: 500 });
    }

    // Create org_documents record
    const { data: docRecord, error: dbError } = await service
      .from('org_documents')
      .insert({
        organization_id:     orgId,
        uploaded_by_user_id: platformUser.id,
        document_category:   'governance',
        document_type:       documentType,
        label,
        file_name:           fileName,
        mime_type:           mimeType ?? 'application/pdf',
        storage_bucket:      'documents',
        storage_path:        path,
        file_size_bytes:     fileSizeBytes ?? null,
        visibility:          'private',
        is_approved_public:  false,
      })
      .select('id').single();

    if (dbError || !docRecord) {
      console.error('[policy-kit] DB error:', dbError?.message);
      return NextResponse.json({ error: 'Failed to create document record' }, { status: 500 });
    }

    return NextResponse.json({
      success:    true,
      documentId: docRecord.id,
      uploadUrl:  signedData.signedUrl,
      storagePath: path,
    });
  }

  // ── CONFIRM UPLOAD + EMIT TRUST EVENT ────────────────────────
  if (action === 'confirm_upload') {
    const { documentId, documentType: docType, policyTitle } = body;

    // Verify document belongs to this org
    const { data: doc } = await service
      .from('org_documents').select('id, organization_id')
      .eq('id', documentId).eq('organization_id', orgId).single();

    if (!doc) return NextResponse.json({ error: 'Document not found' }, { status: 404 });

    // Emit trust event — idempotency key per policy type (one event per policy type per org)
    const { error: eventError } = await service.rpc('emit_trust_event', {
      p_org_id:          orgId,
      p_event_type:      'gov_policy_uploaded',
      p_pillar:          'governance',
      p_score_delta:     15,
      p_source:          'user',
      p_payload:         {
        document_type:  docType,
        policy_title:   policyTitle,
        document_id:    documentId,
      },
      p_actor_user_id:   platformUser.id,
      p_idempotency_key: `gov_pol_${orgId}_${docType}`,
      p_ref_table:       'org_documents',
      p_ref_id:          documentId,
    });

    if (eventError) {
      // Log but don't fail — the document is uploaded, event may be duplicate (idempotent)
      console.warn('[policy-kit] Trust event emit warn:', eventError.message);
    }

    return NextResponse.json({ success: true, eventEmitted: !eventError });
  }

  // ── DELETE POLICY ─────────────────────────────────────────────
  if (action === 'delete') {
    const { documentId, storagePath } = body;

    // Delete storage object
    await service.storage.from('documents').remove([storagePath]);

    // Delete DB record
    const { error } = await service
      .from('org_documents').delete()
      .eq('id', documentId).eq('organization_id', orgId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
}
