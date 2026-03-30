// apps/admin/app/api/orgs/[orgId]/reports/[reportId]/evidence/upload-url/route.ts
// AmanahHub Console — Generate pre-signed upload URL for evidence files
// POST /api/orgs/[orgId]/reports/[reportId]/evidence/upload-url

import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

const ALLOWED_TYPES = [
  'image/jpeg', 'image/png', 'image/webp',
  'application/pdf', 'video/mp4',
];

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

interface Props { params: Promise<{ orgId: string; reportId: string }> }

export async function POST(request: NextRequest, { params }: Props) {
  const { orgId, reportId } = await params;

  // ── Auth ───────────────────────────────────────────────────
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { data: hasRole } = await supabase
    .rpc('org_role_at_least', { org_id: orgId, min_role: 'org_manager' });

  if (!hasRole) {
    return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
  }

  // ── Validate report belongs to org ────────────────────────
  const { data: report } = await supabase
    .from('project_reports')
    .select('id, verification_status')
    .eq('id', reportId).eq('organization_id', orgId).single();

  if (!report) {
    return NextResponse.json({ ok: false, error: 'Report not found' }, { status: 404 });
  }

  if (report.verification_status === 'verified') {
    return NextResponse.json(
      { ok: false, error: 'Cannot add evidence to a verified report' },
      { status: 400 }
    );
  }

  // ── Parse request ─────────────────────────────────────────
  const body = await request.json() as {
    fileName: string; mimeType: string; fileSizeBytes: number;
  };

  if (!ALLOWED_TYPES.includes(body.mimeType)) {
    return NextResponse.json(
      { ok: false, error: `File type not allowed: ${body.mimeType}` },
      { status: 400 }
    );
  }

  if (body.fileSizeBytes > MAX_FILE_SIZE) {
    return NextResponse.json(
      { ok: false, error: 'File size exceeds 20MB limit' },
      { status: 400 }
    );
  }

  // ── Build storage path (org-scoped) ───────────────────────
  const ext      = body.fileName.split('.').pop() ?? 'bin';
  const fileId   = crypto.randomUUID();
  const path     = `org/${orgId}/reports/${reportId}/${fileId}.${ext}`;

  // ── Generate pre-signed upload URL ────────────────────────
  const svc = createServiceClient();
  const { data: signedData, error: urlError } = await svc.storage
    .from('evidence')
    .createSignedUploadUrl(path);

  if (urlError || !signedData) {
    console.error('[upload-url] Storage error:', urlError?.message);
    return NextResponse.json(
      { ok: false, error: 'Failed to generate upload URL' },
      { status: 500 }
    );
  }

  // ── Create evidence_files record (pending confirmation) ───
  const { data: evidenceRecord, error: dbError } = await svc
    .from('evidence_files')
    .insert({
      organization_id:  orgId,
      project_report_id: reportId,
      file_name:        body.fileName,
      mime_type:        body.mimeType,
      storage_bucket:   'evidence',
      storage_path:     path,
      file_size_bytes:  body.fileSizeBytes,
      visibility:       'private',
      is_approved_public: false,
    })
    .select('id').single();

  if (dbError || !evidenceRecord) {
    return NextResponse.json(
      { ok: false, error: 'Failed to create evidence record' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok:          true,
    evidenceId:  evidenceRecord.id,
    uploadUrl:   signedData.signedUrl,
    storagePath: path,
  });
}
