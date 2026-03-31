// apps/admin/app/api/orgs/[orgId]/documents/route.ts
// AmanahHub Console — List org documents, optionally filtered by category and year

import { NextRequest, NextResponse }        from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const { orgId } = await params;
  const url       = new URL(request.url);
  const category  = url.searchParams.get('category');
  const year      = url.searchParams.get('year');

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

  // Must be org member or privileged
  const { data: profile } = await supabase
    .from('users').select('platform_role').eq('auth_provider_user_id', user.id).single();
  const isPrivileged = ['reviewer', 'scholar', 'super_admin'].includes(profile?.platform_role ?? '');

  if (!isPrivileged) {
    const { data: isMember } = await supabase.rpc('is_org_member', { org_id: orgId });
    if (!isMember) return NextResponse.json({ ok: false, error: 'Access denied' }, { status: 403 });
  }

  const svc = createServiceClient();

  let query = svc
    .from('org_documents')
    .select(`
      id, document_type, label, file_name, file_size_bytes, mime_type,
      is_approved_public, visibility, period_year, created_at
    `)
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false });

  if (category) query = query.eq('document_category', category);
  if (year)     query = query.eq('period_year', parseInt(year, 10));

  const { data, error } = await query;
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, data: data ?? [] });
}
