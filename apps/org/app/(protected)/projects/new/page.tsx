// apps/org/app/(protected)/projects/new/page.tsx
// amanahOS — Create New Project

import { redirect }            from 'next/navigation';
import { createClient }        from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { ProjectForm }         from '@/components/projects/project-form';

export const metadata = { title: 'New project — amanahOS' };

export default async function NewProjectPage() {
  const supabase = await createClient();
  const service  = createServiceClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: platformUser } = await supabase
    .from('users').select('id')
    .eq('auth_provider_user_id', user.id).single();
  if (!platformUser) redirect('/no-access?reason=no_user_record');

  const { data: membership } = await service
    .from('org_members').select('organization_id, org_role')
    .eq('user_id', platformUser.id).eq('status', 'active')
    .order('created_at', { ascending: true }).limit(1).single();
  if (!membership) redirect('/no-access?reason=no_org_membership');

  if (!['org_admin', 'org_manager'].includes(membership.org_role)) {
    redirect('/projects');
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <a href="/projects" className="text-[12px] text-gray-400 hover:text-gray-600">← Projects</a>
        <span className="text-gray-300">/</span>
        <h1 className="text-xl font-semibold text-gray-900">New project</h1>
      </div>
      <ProjectForm basePath="" orgId={membership.organization_id} mode="create" />
    </div>
  );
}

