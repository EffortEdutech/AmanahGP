// apps/org/app/api/evidence/route.ts
// Sprint 27 — Evidence file upload API
//
// POST actions: get_upload_url | confirm | delete
//
// ADR-005 rules enforced:
// - All files private by default
// - Storage path: org/{orgId}/reports/{reportId}/{uuid}-{safeName}
// - Bucket: 'evidence'
// - Public visibility requires reviewer approval — orgs cannot self-approve

import { createClient }        from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const service  = createServiceClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

  const { data: platformUser } = await supabase
    .from('users').select('id').eq('auth_provider_user_id', user.id).single();
  if (!platformUser) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await request.json();
  const { action, orgId, reportId } = body;

  // Verify membership (org_admin or org_manager)
  const { data: membership } = await service
    .from('org_members').select('org_role')
    .eq('organization_id', orgId).eq('user_id', platformUser.id)
    .eq('status', 'active').single();
  if (!membership || !['org_admin','org_manager'].includes(membership.org_role))
    return NextResponse.json({ error: 'Manager role required' }, { status: 403 });

  // Verify report belongs to this org
  const { data: report } = await service
    .from('project_reports').select('id, submission_status, verification_status')
    .eq('id', reportId).eq('organization_id', orgId).single();
  if (!report) return NextResponse.json({ error: 'Report not found' }, { status: 404 });

  // ── GET UPLOAD URL ─────────────────────────────────────────
  if (action === 'get_upload_url') {
    const { fileName, mimeType, fileSizeBytes } = body;

    // Guard: cannot upload to submitted reports that are not changes_requested
    if (report.submission_status === 'submitted' &&
        report.verification_status !== 'changes_requested') {
      return NextResponse.json({
        error: 'Cannot upload evidence to a submitted report that is not under changes_requested.'
      }, { status: 400 });
    }

    const ext      = fileName.split('.').pop()?.toLowerCase() ?? 'bin';
    const fileId   = crypto.randomUUID();
    const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_').substring(0, 80);
    const path     = `org/${orgId}/reports/${reportId}/${fileId}-${safeName}`;

    // Generate signed upload URL (5 min expiry)
    const { data: signedData, error: urlError } = await service.storage
      .from('evidence')
      .createSignedUploadUrl(path);

    if (urlError || !signedData) {
      console.error('[evidence] Storage error:', urlError?.message);
      return NextResponse.json({ error: 'Failed to generate upload URL' }, { status: 500 });
    }

    // Create evidence_files record — private by default (ADR-005)
    const { data: evidenceRecord, error: dbError } = await service
      .from('evidence_files')
      .insert({
        organization_id:    orgId,
        project_report_id:  reportId,
        file_name:          fileName,
        mime_type:          mimeType ?? 'application/octet-stream',
        storage_bucket:     'evidence',
        storage_path:       path,
        file_size_bytes:    fileSizeBytes ?? null,
        visibility:         'private',
        is_approved_public: false,
      })
      .select('id').single();

    if (dbError || !evidenceRecord) {
      console.error('[evidence] DB error:', dbError?.message);
      return NextResponse.json({ error: 'Failed to create evidence record' }, { status: 500 });
    }

    return NextResponse.json({
      success:    true,
      evidenceId: evidenceRecord.id,
      uploadUrl:  signedData.signedUrl,
      storagePath: path,
    });
  }

  // ── CONFIRM UPLOAD ─────────────────────────────────────────
  if (action === 'confirm') {
    const { evidenceId } = body;
    const { error } = await service
      .from('evidence_files')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', evidenceId).eq('project_report_id', reportId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  // ── DELETE ─────────────────────────────────────────────────
  if (action === 'delete') {
    const { evidenceId } = body;

    // Verify the evidence belongs to this report + org
    const { data: ev } = await service
      .from('evidence_files')
      .select('id, storage_path, is_approved_public')
      .eq('id', evidenceId).eq('project_report_id', reportId).single();

    if (!ev) return NextResponse.json({ error: 'Evidence not found' }, { status: 404 });

    // Cannot delete approved-public evidence
    if (ev.is_approved_public)
      return NextResponse.json({ error: 'Cannot delete evidence approved for public visibility.' }, { status: 400 });

    // Remove from storage
    await service.storage.from('evidence').remove([ev.storage_path]);

    // Remove DB record
    const { error } = await service
      .from('evidence_files').delete().eq('id', evidenceId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
}
