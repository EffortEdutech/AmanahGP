// apps/org/app/(protected)/projects/new/page.tsx
// amanahOS — Create New Project

import { redirect }            from 'next/navigation';
import { createClient }        from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { ProjectForm }         from '@/components/projects/project-form';

import { getOrgAccessOrRedirect } from '@/lib/access/org-access';
export const metadata = { title: 'New project — amanahOS' };

export default async function NewProjectPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;
  const supabase = await createClient();
  const service  = createServiceClient();

  const { authUser: user, platformUser, membership, isManager: accessIsManager, isSuperAdmin } = await getOrgAccessOrRedirect(orgId);

  if (!['org_admin', 'org_manager', 'super_admin'].includes(membership.org_role)) {
    redirect('/projects');
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <a href={`/org/${orgId}/projects`} className="text-[12px] text-gray-400 hover:text-gray-600">← Projects</a>
        <span className="text-gray-300">/</span>
        <h1 className="text-xl font-semibold text-gray-900">New project</h1>
      </div>
      <ProjectForm orgId={orgId} basePath={`/org/${orgId}`} mode="create" />
    </div>
  );
}
