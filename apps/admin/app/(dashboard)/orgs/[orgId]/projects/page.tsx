// apps/admin/app/(dashboard)/orgs/[orgId]/projects/page.tsx
// AmanahHub Console — Projects list for an organization

import { redirect }     from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { StatusBadge }  from '@/components/ui/status-badge';

interface Props { params: Promise<{ orgId: string }> }

export const metadata = { title: 'Projects | AmanahHub Console' };

export default async function ProjectsPage({ params }: Props) {
  const { orgId } = await params;
  const supabase  = await createClient();

  const { data: org } = await supabase
    .from('organizations')
    .select('id, name, onboarding_status')
    .eq('id', orgId).single();

  if (!org) redirect('/dashboard');

  const { data: projects } = await supabase
    .from('projects')
    .select('id, title, status, is_public, start_date, end_date, budget_amount, created_at')
    .eq('organization_id', orgId)
    .neq('status', 'archived')
    .order('created_at', { ascending: false });

  const canCreate = org.onboarding_status === 'approved';

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <a href={`/orgs/${orgId}`} className="text-sm text-gray-500 hover:text-gray-700 mb-1 block">
            ← {org.name}
          </a>
          <h1 className="text-2xl font-semibold text-gray-900">Projects</h1>
        </div>
        {canCreate && (
          <a href={`/orgs/${orgId}/projects/new`}
            className="inline-flex items-center px-4 py-2 rounded-md text-sm font-medium
                       text-white bg-emerald-700 hover:bg-emerald-800 transition-colors">
            + New project
          </a>
        )}
      </div>

      {!canCreate && (
        <div className="mb-6 rounded-md bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
          Your organization must be approved before you can create projects.
        </div>
      )}

      {projects?.length ? (
        <div className="space-y-3">
          {projects.map((p) => (
            <a key={p.id} href={`/orgs/${orgId}/projects/${p.id}`}
              className="flex items-center justify-between px-5 py-4 rounded-lg border
                         border-gray-200 bg-white hover:border-emerald-200 transition-colors group">
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 group-hover:text-emerald-800 truncate">
                  {p.title}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {p.start_date
                    ? `${p.start_date} → ${p.end_date ?? 'ongoing'}`
                    : 'No dates set'}
                  {p.budget_amount
                    ? ` · MYR ${Number(p.budget_amount).toLocaleString()}`
                    : ''}
                </p>
              </div>
              <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                {p.is_public && <StatusBadge status="listed" />}
                <StatusBadge status={p.status} />
              </div>
            </a>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-gray-300 px-6 py-12 text-center">
          <p className="text-sm text-gray-500 mb-3">No projects yet.</p>
          {canCreate && (
            <a href={`/orgs/${orgId}/projects/new`}
              className="inline-flex items-center px-4 py-2 rounded-md text-sm font-medium
                         text-white bg-emerald-700 hover:bg-emerald-800">
              Create your first project
            </a>
          )}
        </div>
      )}
    </div>
  );
}
