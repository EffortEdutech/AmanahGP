// apps/user/app/charities/[orgId]/projects/[projectId]/page.tsx
// AmanahHub — Public project detail (Sprint 7 UI uplift)
// Data fetching unchanged — visual layer replaced to match UAT s-project

import { notFound } from 'next/navigation';
import Link         from 'next/link';
import { createClient }        from '@/lib/supabase/server';
import { StatusBadge }         from '@/components/ui/badge';

interface Props {
  params: Promise<{ orgId: string; projectId: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { projectId } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from('projects').select('title').eq('id', projectId).single();
  return { title: data?.title ? `${data.title} | AmanahHub` : 'Project | AmanahHub' };
}

function fmtMYR(n: number | null | undefined) {
  if (!n) return null;
  return `MYR ${Number(n).toLocaleString('en-MY', { minimumFractionDigits: 2 })}`;
}

function fmtDate(d: string | null | undefined) {
  if (!d) return null;
  return new Date(d).toLocaleDateString('en-MY', { month: 'short', year: 'numeric' });
}

export default async function ProjectDetailPage({ params }: Props) {
  const { orgId, projectId } = await params;
  const supabase = await createClient();

  const { data: project } = await supabase
    .from('projects')
    .select(`
      id, title, objective, description, location_text,
      start_date, end_date, budget_amount, currency,
      beneficiary_summary, kpi_targets, status,
      organizations ( id, name )
    `)
    .eq('id', projectId)
    .eq('organization_id', orgId)
    .eq('is_public', true)
    .single();

  if (!project) notFound();

  const org = Array.isArray(project.organizations)
    ? project.organizations[0]
    : project.organizations;

  // Verified public reports
  const { data: reports } = await supabase
    .from('project_reports')
    .select(`
      id, title, report_body, report_date, verified_at,
      evidence_files ( id, file_name, mime_type, visibility, is_approved_public )
    `)
    .eq('project_id', projectId)
    .eq('verification_status', 'verified')
    .order('report_date', { ascending: false });

  return (
    <div className="max-w-4xl mx-auto px-4 py-5">

      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-[11px] text-gray-400 mb-4">
        <Link href="/charities" className="hover:text-emerald-700">Directory</Link>
        <span>·</span>
        <Link href={`/charities/${orgId}`} className="hover:text-emerald-700 truncate max-w-[160px]">
          {org?.name ?? 'Charity'}
        </Link>
        <span>·</span>
        <span className="text-gray-600 truncate max-w-[160px]">{project.title}</span>
      </div>

      {/* Project header card */}
      <div className="card p-4 mb-4">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="min-w-0">
            <h1 className="text-base font-semibold text-gray-900 leading-snug mb-1">
              {project.title}
            </h1>
            <p className="text-[11px] text-gray-500 mb-2">{project.objective}</p>
            <StatusBadge status={project.status} />
          </div>

          <Link href={`/donate/${orgId}?project=${projectId}`}
            className="btn-primary text-sm px-4 py-2 flex-shrink-0">
            Donate
          </Link>
        </div>

        {/* Meta row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-gray-100">
          {project.location_text && (
            <MetaStat label="Location" value={project.location_text} />
          )}
          {project.budget_amount && (
            <MetaStat label="Budget" value={fmtMYR(project.budget_amount) ?? '—'} />
          )}
          {project.start_date && (
            <MetaStat label="Started" value={fmtDate(project.start_date) ?? '—'} />
          )}
          {project.end_date && (
            <MetaStat label="Ends" value={fmtDate(project.end_date) ?? '—'} />
          )}
        </div>
      </div>

      {/* Description */}
      {project.description && (
        <div className="card p-4 mb-4">
          <p className="sec-label">Description</p>
          <p className="text-[12px] text-gray-700 leading-relaxed">{project.description}</p>
        </div>
      )}

      {/* Beneficiaries */}
      {project.beneficiary_summary && (
        <div className="card p-4 mb-4">
          <p className="sec-label">Beneficiaries</p>
          <p className="text-[12px] text-gray-700 leading-relaxed">{project.beneficiary_summary}</p>
        </div>
      )}

      {/* Verified reports */}
      <div className="card p-4">
        <p className="sec-label">
          Verified reports ({reports?.length ?? 0})
        </p>

        {reports?.length ? (
          <div className="relative pl-4">
            {/* Timeline line */}
            <div className="absolute left-[5px] top-2 bottom-4 w-px bg-gray-200" />

            <div className="space-y-4">
              {reports.map((r) => {
                const body     = r.report_body as Record<string, any>;
                const evidence = (r.evidence_files ?? []) as any[];
                const pubEvidence = evidence.filter((e) => e.is_approved_public);

                return (
                  <div key={r.id} className="relative">
                    {/* Timeline dot */}
                    <div className="absolute -left-4 top-1.5 w-2 h-2 rounded-full
                                    bg-emerald-500 ring-2 ring-white" />

                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                      {/* Report header */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <p className="text-[12px] font-medium text-gray-900">{r.title}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">
                            {r.report_date
                              ? new Date(r.report_date).toLocaleDateString('en-MY', {
                                  day: 'numeric', month: 'long', year: 'numeric',
                                })
                              : r.verified_at
                                ? `Verified ${new Date(r.verified_at).toLocaleDateString('en-MY', { month: 'short', year: 'numeric' })}`
                                : ''}
                          </p>
                        </div>
                        <span className="badge badge-green flex-shrink-0">
                          <svg className="w-2.5 h-2.5 mr-0.5" viewBox="0 0 10 10" fill="none">
                            <path d="M8.5 2.5L4 7.5 1.5 5" stroke="currentColor"
                                  strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          Verified
                        </span>
                      </div>

                      {/* Key stats from report body */}
                      <div className="flex flex-wrap gap-3">
                        {body?.beneficiary_count != null && (
                          <Stat label="Beneficiaries" value={body.beneficiary_count} />
                        )}
                        {body?.total_spend != null && (
                          <Stat label="Spend" value={`MYR ${Number(body.total_spend).toLocaleString('en-MY')}`} />
                        )}
                        {body?.completion_pct != null && (
                          <Stat label="Completion" value={`${body.completion_pct}%`} />
                        )}
                      </div>

                      {/* Narrative snippet */}
                      {body?.narrative && (
                        <p className="mt-2 text-[11px] text-gray-600 leading-relaxed line-clamp-3">
                          {body.narrative}
                        </p>
                      )}

                      {/* Evidence thumbnails */}
                      {pubEvidence.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {pubEvidence.slice(0, 4).map((ev: any) => (
                            <div key={ev.id}
                              className="w-14 h-14 rounded border border-gray-200
                                         bg-gray-100 flex items-center justify-center
                                         text-[9px] text-gray-400 text-center px-1 flex-shrink-0">
                              {ev.mime_type?.startsWith('image/') ? '📷' :
                               ev.mime_type === 'application/pdf' ? '📄' : '📎'}
                              <span className="block truncate w-full text-center mt-0.5">
                                {ev.file_name.split('.').pop()?.toUpperCase()}
                              </span>
                            </div>
                          ))}
                          {pubEvidence.length > 4 && (
                            <div className="w-14 h-14 rounded border border-gray-200
                                            bg-gray-50 flex items-center justify-center
                                            text-[9px] text-gray-400">
                              +{pubEvidence.length - 4}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <p className="text-[11px] text-gray-400 py-2">No verified reports published yet.</p>
        )}
      </div>

    </div>
  );
}

function MetaStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] text-gray-400">{label}</p>
      <p className="text-[12px] font-medium text-gray-800 mt-0.5">{value}</p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white border border-gray-200 rounded px-2.5 py-1.5">
      <p className="stat-val text-base">{value}</p>
      <p className="stat-lbl">{label}</p>
    </div>
  );
}
