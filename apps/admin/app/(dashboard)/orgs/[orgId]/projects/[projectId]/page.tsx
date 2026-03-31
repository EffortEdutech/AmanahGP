// apps/admin/app/(dashboard)/orgs/[orgId]/projects/[projectId]/page.tsx
// AmanahHub Console — Project detail (Sprint 8 UI uplift)
// Fixed: archiveProject from '../actions' + ArchiveButton client component (no onClick in Server Component)

import { redirect }        from 'next/navigation';
import Link                from 'next/link';
import { createClient }    from '@/lib/supabase/server';
import { StatusBadge }     from '@/components/ui/badge';
import { ArchiveButton }   from '@/components/project/archive-button';
import { archiveProject }  from '../actions';

interface Props { params: Promise<{ orgId: string; projectId: string }> }

export async function generateMetadata({ params }: Props) {
  const { projectId } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from('projects').select('title').eq('id', projectId).single();
  return { title: `${data?.title ?? 'Project'} | AmanahHub Console` };
}

function fmtDate(d: string | null | undefined) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-MY', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}
function fmtMYR(n: number | null | undefined) {
  if (!n) return '—';
  return `MYR ${Number(n).toLocaleString('en-MY', { minimumFractionDigits: 2 })}`;
}

export default async function ProjectDetailPage({ params }: Props) {
  const { orgId, projectId } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: project } = await supabase
    .from('projects')
    .select(`
      id, title, objective, description, location_text,
      start_date, end_date, budget_amount, currency,
      beneficiary_summary, status, is_public, created_at
    `)
    .eq('id', projectId)
    .eq('organization_id', orgId)
    .single();

  if (!project) redirect(`/orgs/${orgId}/projects`);

  const { data: canEdit } = await supabase
    .rpc('org_role_at_least', { org_id: orgId, min_role: 'org_manager' });

  const { data: reports } = await supabase
    .from('project_reports')
    .select('id, title, submission_status, verification_status, submitted_at, created_at')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });

  return (
    <div className="max-w-3xl">

      {/* Breadcrumb */}
      <Link href={`/orgs/${orgId}/projects`}
        className="text-[11px] text-gray-400 hover:text-emerald-700 mb-4 block">
        ← Projects
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4 flex-wrap">
        <div>
          <h1 className="text-[18px] font-semibold text-gray-900">{project.title}</h1>
          <p className="text-[12px] text-gray-500 mt-1 max-w-xl">{project.objective}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <StatusBadge status={project.status} />
          {project.is_public && <StatusBadge status="listed" />}
        </div>
      </div>

      {/* Project details card */}
      <div className="card p-4 mb-4">
        <p className="sec-label">Project details</p>
        <div className="grid grid-cols-2 gap-x-6 gap-y-2">
          <Row label="Start date"   value={fmtDate(project.start_date)} />
          <Row label="End date"     value={fmtDate(project.end_date)} />
          <Row label="Budget"       value={fmtMYR(project.budget_amount)} />
          <Row label="Location"     value={project.location_text ?? '—'} />
          {project.beneficiary_summary && (
            <div className="col-span-2">
              <Row label="Beneficiaries" value={project.beneficiary_summary} />
            </div>
          )}
          {project.description && (
            <div className="col-span-2">
              <Row label="Description" value={project.description} />
            </div>
          )}
        </div>
      </div>

      {/* Reports */}
      <div className="card p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <p className="sec-label mb-0">Reports ({reports?.length ?? 0})</p>
          {canEdit && project.status !== 'archived' && (
            <Link
              href={`/orgs/${orgId}/projects/${projectId}/reports/new`}
              className="btn-primary text-xs px-3 py-1.5"
            >
              + New report
            </Link>
          )}
        </div>

        {reports?.length ? (
          <div className="space-y-2">
            {reports.map((r) => (
              <Link
                key={r.id}
                href={`/orgs/${orgId}/projects/${projectId}/reports/${r.id}`}
                className="list-item"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-medium text-gray-900 truncate">{r.title}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    {r.submission_status === 'submitted' && r.submitted_at
                      ? `Submitted ${fmtDate(r.submitted_at)}`
                      : `Draft — ${fmtDate(r.created_at)}`}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <StatusBadge status={r.submission_status} />
                  <StatusBadge status={r.verification_status} />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 border border-dashed border-gray-200 rounded-lg">
            <p className="text-[12px] text-gray-400 mb-3">No reports submitted yet.</p>
            {canEdit && project.status !== 'archived' && (
              <Link
                href={`/orgs/${orgId}/projects/${projectId}/reports/new`}
                className="btn-primary text-xs px-4 py-2"
              >
                Submit first report
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Archive zone — ArchiveButton is a client component that handles confirm() */}
      {canEdit && project.status === 'active' && (
        <div className="pt-4 border-t border-gray-100">
          <ArchiveButton
            orgId={orgId}
            projectId={projectId}
            action={archiveProject}
          />
        </div>
      )}

    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3 text-[12px]">
      <span className="text-gray-400 w-28 flex-shrink-0">{label}</span>
      <span className="text-gray-800">{value}</span>
    </div>
  );
}
