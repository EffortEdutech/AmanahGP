// apps/admin/app/api/orgs/[orgId]/reports/[reportId]/evidence/[evidenceId]/confirm/route.ts
// AmanahHub Console — Confirm evidence upload and update metadata

import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

interface Props {
  params: Promise<{ orgId: string; reportId: string; evidenceId: string }>;
}

export async function POST(request: NextRequest, { params }: Props) {
  const { orgId, reportId, evidenceId } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

  const { data: hasRole } = await supabase
    .rpc('org_role_at_least', { org_id: orgId, min_role: 'org_manager' });
  if (!hasRole) return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });

  const body = await request.json() as {
    capturedAt?: string;
    geoLat?: number;
    geoLng?: number;
    visibility?: 'private' | 'reviewer_only' | 'public';
  };

  const svc = createServiceClient();

  // Verify evidence belongs to this report + org
  const { data: ev } = await svc
    .from('evidence_files')
    .select('id, storage_path')
    .eq('id', evidenceId)
    .eq('project_report_id', reportId)
    .eq('organization_id', orgId)
    .single();

  if (!ev) return NextResponse.json({ ok: false, error: 'Evidence not found' }, { status: 404 });

  // Update metadata fields after upload is confirmed
  const { error } = await svc
    .from('evidence_files')
    .update({
      captured_at: body.capturedAt ?? null,
      geo_lat:     body.geoLat    ?? null,
      geo_lng:     body.geoLng    ?? null,
      visibility:  body.visibility ?? 'private',
      updated_at:  new Date().toISOString(),
    })
    .eq('id', evidenceId);

  if (error) {
    return NextResponse.json({ ok: false, error: 'Failed to confirm evidence' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, evidenceId });
}
