// apps/org/app/api/org/profile/route.ts
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
  if (!platformUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const body = await request.json();
  const { orgId, name, legal_name, registration_no, org_type, state,
          oversight_authority, fund_types, summary, contact_email,
          contact_phone, website_url, address_text } = body;

  const { data: membership } = await service
    .from('org_members').select('org_role')
    .eq('organization_id', orgId).eq('user_id', platformUser.id)
    .eq('status', 'active').single();

  if (!membership || !['org_admin', 'org_manager'].includes(membership.org_role)) {
    return NextResponse.json({ error: 'Manager role required' }, { status: 403 });
  }

  const { error } = await service
    .from('organizations')
    .update({
      name, legal_name: legal_name || null,
      registration_no: registration_no || null,
      org_type: org_type || null,
      state: state || null,
      oversight_authority: oversight_authority || null,
      fund_types: fund_types ?? [],
      summary: summary || null,
      contact_email: contact_email || null,
      contact_phone: contact_phone || null,
      website_url: website_url || null,
      address_text: address_text || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', orgId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
