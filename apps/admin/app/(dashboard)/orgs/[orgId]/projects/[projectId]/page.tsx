// apps/admin/app/(dashboard)/orgs/[orgId]/projects/[projectId]/page.tsx
// AmanahHub Console — Project detail: info + reports list

import { redirect }     from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { StatusBadge }  from '@/components/ui/status-badge';
import { archiveProject } from './actions';

interface Props { params: Promise<{ orgId: string; projectId: string }> }

export default async function ProjectDetailPage({ params }: Props) {
  const { orgId, projectId } = await params;
  const supabase = await createClient();

  const { data: project } = await supabase
    .from('projects')
    .select(`
      id, title, objective, description, location_text,
      start_date, end_date, budget_amount, beneficiary_summary,
      status, is_public, created_at
    `)
    .eq('id', projectId).eq('organization_id', orgId).single();

  if (!project) redirect(`/orgs/${orgId}/projects`);

  const { data: reports } = await supabase
    .from('project_reports')
    .select('id, title, submission_status, verification_status, submitted_at, created_at')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });

  const { data: canEdit } = await supabase.rpc('org_role_at_least', {
    org_id: orgId, min_role: 'org_manager',
  });

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <a href={`/orgs/${orgId}/projects`}
             className="text-sm text-gray-500 hover:text-gray-700 mb-1 block">
            ← Projects
          </a>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-gray-900">{project.title}</h1>
            <StatusBadge status={project.status} />
            {project.is_public && <StatusBadge status="listed" />}
          </div>
        </div>
        {canEdit && project.status !== 'archived' && (
          <div className="flex gap-2">
            <a href={`/orgs/${orgId}/projects/${projectId}/edit`}
              className="px-3 py-1.5 rounded-md text-sm border border-gray-300
                         text-gray-700 bg-white hover:bg-gray-50 transition-colors">
              Edit
            </a>
          </div>
        )}
      </div>

      {/* Details */}
      <div className="rounded-lg border border-gray-200 bg-white divide-y divide-gray-100 mb-6">
        <Row label="Objective"   value={project.objective} />
        {project.description    && <Row label="Description"  value={project.description} />}
        {project.location_text  && <Row label="Location"     value={project.location_text} />}
        {project.start_date     && (
          <Row label="Timeline"
               value={`${project.start_date} → ${project.end_date ?? 'ongoing'}`} />
        )}
        {project.budget_amount  && (
          <Row label="Budget"
               value={`MYR ${Number(project.budget_amount).toLocaleString('en-MY', { minimumFractionDigits: 2 })}`} />
        )}
        {project.beneficiary_summary && (
          <Row label="Beneficiaries" value={project.beneficiary_summary} />
        )}
      </div>

      {/* Reports */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold text-gray-800">Progress reports</h2>
        {canEdit && project.status !== 'archived' && (
          <a href={`/orgs/${orgId}/projects/${projectId}/reports/new`}
            className="inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium
                       text-white bg-emerald-700 hover:bg-emerald-800 transition-colors">
            + New report
          </a>
        )}
      </div>

      {reports?.length ? (
        <div className="space-y-2">
          {reports.map((r) => (
            <a key={r.id}
               href={`/orgs/${orgId}/projects/${projectId}/reports/${r.id}`}
               className="flex items-center justify-between px-5 py-4 rounded-lg border
                          border-gray-200 bg-white hover:border-emerald-200 transition-colors group">
              <div>
                <p className="text-sm font-medium text-gray-900 group-hover:text-emerald-800">
                  {r.title}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {r.submitted_at
                    ? `Submitted ${new Date(r.submitted_at).toLocaleDateString('en-MY')}`
                    : `Draft — ${new Date(r.created_at).toLocaleDateString('en-MY')}`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={r.verification_status} />
              </div>
            </a>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-gray-300 px-6 py-10 text-center">
          <p className="text-sm text-gray-500">No reports submitted yet.</p>
          {canEdit && project.status !== 'archived' && (
            <a href={`/orgs/${orgId}/projects/${projectId}/reports/new`}
               className="mt-3 inline-flex items-center px-4 py-2 rounded-md text-sm font-medium
                          text-white bg-emerald-700 hover:bg-emerald-800">
              Submit first report
            </a>
          )}
        </div>
      )}

      {/* Archive */}
      {canEdit && project.status === 'active' && (
        <div className="mt-8 pt-6 border-t border-gray-200">
          <form action={archiveProject}>
            <input type="hidden" name="orgId" value={orgId} />
            <input type="hidden" name="projectId" value={projectId} />
            <button type="submit"
              className="text-sm text-red-600 hover:text-red-700 font-medium"
              onClick={(e) => {
                if (!confirm('Archive this project? It will no longer accept new reports.')) {
                  e.preventDefault();
                }
              }}>
              Archive project
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-5 py-3 flex gap-4">
      <dt className="w-36 flex-shrink-0 text-sm text-gray-500">{label}</dt>
      <dd className="text-sm text-gray-900 whitespace-pre-wrap">{value}</dd>
    </div>
  );
}
