// apps/admin/app/(dashboard)/orgs/[orgId]/projects/page.tsx
// AmanahHub Console — Projects list (Sprint 8 UI uplift)
// Matches UAT s-a-projects: list-item rows with report count + status badge

import { redirect } from 'next/navigation';
import Link         from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { StatusBadge, Badge } from '@/components/ui/badge';

interface Props { params: Promise<{ orgId: string }> }

export const metadata = { title: 'Projects | AmanahHub Console' };

function fmtDate(d: string | null | undefined) {
  if (!d) return null;
  return new Date(d).toLocaleDateString('en-MY', { month: 'short', year: 'numeric' });
}

function fmtMYR(n: number | null | undefined) {
  if (!n) return null;
  return `MYR ${Number(n).toLocaleString('en-MY')}`;
}

export default async function ProjectsPage({ params }: Props) {
  const { orgId } = await params;
  const supabase  = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: org } = await supabase
    .from('organizations')
    .select('id, name, onboarding_status')
    .eq('id', orgId).single();

  if (!org) redirect('/dashboard');

  const { data: canEdit } = await supabase
    .rpc('org_role_at_least', { org_id: orgId, min_role: 'org_manager' });

  const { data: projects } = await supabase
    .from('projects')
    .select(`
      id, title, location_text, start_date, end_date, budget_amount,
      status, is_public, created_at
    `)
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false });

  // Report count per project
  const projectIds = (projects ?? []).map((p) => p.id);
  const { data: reportCounts } = projectIds.length
    ? await supabase
        .from('project_reports')
        .select('project_id, verification_status')
        .in('project_id', projectIds)
    : { data: [] };

  function countReports(projectId: string) {
    return (reportCounts ?? []).filter((r) => r.project_id === projectId).length;
  }
  function hasVerified(projectId: string) {
    return (reportCounts ?? []).some(
      (r) => r.project_id === projectId && r.verification_status === 'verified',
    );
  }

  const active   = (projects ?? []).filter((p) => p.status === 'active');
  const archived = (projects ?? []).filter((p) => p.status !== 'active');

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-[18px] font-semibold text-gray-900">Projects</h1>
        {canEdit && org.onboarding_status === 'approved' && (
          <Link href={`/orgs/${orgId}/projects/new`} className="btn-primary text-xs px-4 py-2">
            + New project
          </Link>
        )}
      </div>

      {/* Active */}
      {active.length > 0 && (
        <div className="space-y-2 mb-5">
          {active.map((p) => {
            const n       = countReports(p.id);
            const hasBadge = hasVerified(p.id);
            const rVariant = hasBadge ? 'green' : n > 0 ? 'amber' : 'gray';

            return (
              <Link
                key={p.id}
                href={`/orgs/${orgId}/projects/${p.id}`}
                className="list-item"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-medium text-gray-900 truncate">{p.title}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    {[
                      p.start_date && p.end_date
                        ? `${fmtDate(p.start_date)} – ${fmtDate(p.end_date)}`
                        : fmtDate(p.start_date),
                      fmtMYR(p.budget_amount),
                      p.location_text,
                    ].filter(Boolean).join(' · ')}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {n > 0 && (
                    <Badge variant={rVariant}>{n} report{n !== 1 ? 's' : ''}</Badge>
                  )}
                  <StatusBadge status={p.status} />
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Archived */}
      {archived.length > 0 && (
        <>
          <p className="sec-label mt-4 mb-2">Archived</p>
          <div className="space-y-2 opacity-60">
            {archived.map((p) => (
              <Link
                key={p.id}
                href={`/orgs/${orgId}/projects/${p.id}`}
                className="list-item"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-medium text-gray-900 truncate">{p.title}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    {p.end_date ? `Completed ${fmtDate(p.end_date)}` : p.status}
                    {fmtMYR(p.budget_amount) ? ` · ${fmtMYR(p.budget_amount)}` : ''}
                  </p>
                </div>
                <StatusBadge status={p.status} />
              </Link>
            ))}
          </div>
        </>
      )}

      {/* Empty */}
      {(projects ?? []).length === 0 && (
        <div className="card p-8 text-center">
          <p className="text-[12px] text-gray-400 mb-3">No projects yet.</p>
          {canEdit && org.onboarding_status === 'approved' && (
            <Link href={`/orgs/${orgId}/projects/new`} className="btn-primary text-xs px-4 py-2">
              Create first project
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
