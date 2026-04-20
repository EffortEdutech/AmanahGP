// apps/org/app/(protected)/reports/new/page.tsx
// amanahOS — Submit New Progress Report

import { redirect }            from 'next/navigation';
import { createClient }        from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { ReportForm }          from '@/components/reports/report-form';

export const metadata = { title: 'Submit report — amanahOS' };

export default async function NewReportPage({
  params,
  searchParams,
}: {
  params: Promise<{ orgId: string }>;
  
  searchParams: Promise<{ projectId?: string }>;
}) {
  const { orgId } = await params;
  const supabase = await createClient();
  const service  = createServiceClient();
  const sp       = await searchParams;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: platformUser } = await supabase
    .from('users').select('id')
    .eq('auth_provider_user_id', user.id).single();
  if (!platformUser) redirect('/no-access?reason=no_user_record');

  const { data: membership } = await service
    .from('org_members').select('organization_id, org_role')
    .eq('organization_id', orgId)
    .eq('user_id', platformUser.id).eq('status', 'active')
    .single();
  if (!membership) redirect('/no-access?reason=not_member_of_org');
  if (!['org_admin','org_manager'].includes(membership.org_role)) redirect('/reports');

  const { data: projects } = await service
    .from('projects').select('id, title')
    .eq('organization_id', orgId)
    .in('status', ['active', 'completed'])
    .order('title');

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <a href={`/org/${orgId}/reports`} className="text-[12px] text-gray-400 hover:text-gray-600">← Reports</a>
        <span className="text-gray-300">/</span>
        <h1 className="text-xl font-semibold text-gray-900">Submit progress report</h1>
      </div>
      <ReportForm
        basePath={`/org/${orgId}`}
        orgId={orgId}
        projects={(projects ?? []).map((p) => ({ id: p.id, title: p.title }))}
        defaultProjectId={sp.projectId}
      />
    </div>
  );
}
