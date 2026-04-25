// apps/org/app/(protected)/projects/page.tsx
// amanahOS — Projects (Sprint 25 — full CRUD, no Console link)
//
// Orgs create and manage their own projects here.
// Console is for reviewers/platform users only.

import { redirect }            from 'next/navigation';
import Link                    from 'next/link';
import { createClient }        from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';

export const metadata = { title: 'Projects — amanahOS' };

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  draft:     { label: 'Draft',     color: 'text-gray-600',   bg: 'bg-gray-100' },
  active:    { label: 'Active',    color: 'text-emerald-700',bg: 'bg-emerald-100' },
  completed: { label: 'Completed', color: 'text-blue-700',   bg: 'bg-blue-100' },
  archived:  { label: 'Archived',  color: 'text-gray-400',   bg: 'bg-gray-100' },
};

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const supabase = await createClient();
  const service  = createServiceClient();
  const params   = await searchParams;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: platformUser } = await supabase
    .from('users').select('id')
    .eq('auth_provider_user_id', user.id).single();
  if (!platformUser) redirect('/no-access?reason=no_user_record');

  const { data: membership } = await service
    .from('org_members')
    .select('organization_id, org_role, organizations(id, name)')
    .eq('user_id', platformUser.id).eq('status', 'active')
    .order('created_at', { ascending: true }).limit(1).single();
  if (!membership) redirect('/no-access?reason=no_org_membership');

  const orgId     = membership.organization_id;
  const orgRaw = membership.organizations;
  const org = (Array.isArray(orgRaw) ? orgRaw[0] : orgRaw) as { id: string; name: string } | null | undefined;
  const isManager = ['org_admin', 'org_manager'].includes(membership.org_role);

  const statusFilter = params.status;

  let query = service
    .from('projects')
    .select('id, title, objective, description, status, start_date, end_date, budget_amount, is_public, created_at')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false });

  if (statusFilter && statusFilter !== 'all') {
    query = query.eq('status', statusFilter);
  }

  const { data: projects } = await query;

  // Count per status
  const { data: allProjects } = await service
    .from('projects').select('status').eq('organization_id', orgId);
  const countMap = (allProjects ?? []).reduce((acc, p) => {
    acc[p.status] = (acc[p.status] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const fmt = (n: number) =>
    `RM ${n.toLocaleString('en-MY', { minimumFractionDigits: 2 })}`;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-5">

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Projects</h1>
          <p className="text-sm text-gray-500 mt-0.5">{org?.name}</p>
        </div>
        {isManager && (
          <Link href="/projects/new"
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm
                       font-medium rounded-lg transition-colors flex items-center gap-1.5">
            <span className="text-base leading-none">+</span> New project
          </Link>
        )}
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {[
          { key: 'all',       label: 'All',       count: Object.values(countMap).reduce((a, b) => a + b, 0) },
          { key: 'active',    label: 'Active',    count: countMap.active    ?? 0 },
          { key: 'draft',     label: 'Draft',     count: countMap.draft     ?? 0 },
          { key: 'completed', label: 'Completed', count: countMap.completed ?? 0 },
          { key: 'archived',  label: 'Archived',  count: countMap.archived  ?? 0 },
        ].map((tab) => (
          <Link key={tab.key}
            href={tab.key === 'all' ? '/projects' : `/projects?status=${tab.key}`}
            className={`
              flex items-center gap-1.5 px-4 py-2.5 text-[12px] font-medium
              border-b-2 transition-colors -mb-px
              ${(!statusFilter && tab.key === 'all') || statusFilter === tab.key
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
              }
            `}>
            {tab.label}
            {tab.count > 0 && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">
                {tab.count}
              </span>
            )}
          </Link>
        ))}
      </div>

      {/* CTCF note */}
      <div className="rounded-lg bg-blue-50 border border-blue-200 px-4 py-2.5 flex items-center gap-2">
        <span className="text-blue-500 text-sm flex-shrink-0">ℹ</span>
        <p className="text-[11px] text-blue-700">
          Projects submitted with reports and evidence are evaluated by reviewers for{' '}
          <strong>CTCF Layer 3 — Project Transparency</strong> (25 pts).
          After you submit, a reviewer approves via the platform — not your task.
        </p>
      </div>

      {/* Project list */}
      {projects && projects.length > 0 ? (
        <div className="space-y-3">
          {projects.map((project) => {
            const sc = STATUS_CONFIG[project.status] ?? STATUS_CONFIG.draft;
            return (
              <Link key={project.id}
                href={`/projects/${project.id}`}
                className="block rounded-xl border border-gray-200 bg-white p-5
                           hover:border-emerald-300 hover:shadow-sm transition-all">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-[14px] font-semibold text-gray-900">
                        {project.title}
                      </h3>
                      <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full capitalize ${sc.bg} ${sc.color}`}>
                        {sc.label}
                      </span>
                      {project.is_public && (
                        <span className="text-[9px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600">
                          Public
                        </span>
                      )}
                    </div>
                    <p className="text-[12px] text-gray-500 line-clamp-2 leading-relaxed">
                      {project.objective}
                    </p>
                    <div className="flex items-center gap-4 text-[10px] text-gray-400 flex-wrap">
                      {project.start_date && <span>Start: {project.start_date}</span>}
                      {project.end_date   && <span>End: {project.end_date}</span>}
                      <span>{new Date(project.created_at).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    </div>
                  </div>
                  {project.budget_amount && (
                    <div className="text-right flex-shrink-0">
                      <p className="text-[10px] text-gray-400">Budget</p>
                      <p className="text-[14px] font-bold text-gray-800">
                        {fmt(Number(project.budget_amount))}
                      </p>
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-10 text-center">
          <p className="text-2xl mb-2">▦</p>
          <p className="text-sm font-medium text-gray-600">No projects yet</p>
          <p className="text-[12px] text-gray-400 mt-1 max-w-xs mx-auto">
            Projects represent your charitable programmes. Each project can have progress reports and evidence attached.
          </p>
          {isManager && (
            <Link href="/projects/new"
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2
                         bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium
                         rounded-lg transition-colors">
              + Create first project
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

