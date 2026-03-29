// apps/user/app/charities/[orgId]/projects/[projectId]/page.tsx
// AmanahHub — Public project detail page

import { notFound }     from 'next/navigation';
import Link             from 'next/link';
import { createClient } from '@/lib/supabase/server';

interface Props { params: Promise<{ orgId: string; projectId: string }> }

export default async function PublicProjectPage({ params }: Props) {
  const { orgId, projectId } = await params;
  const supabase = await createClient();

  const { data: project } = await supabase
    .from('projects')
    .select(`
      id, title, objective, description, location_text,
      start_date, end_date, budget_amount, beneficiary_summary, status
    `)
    .eq('id', projectId)
    .eq('organization_id', orgId)
    .eq('is_public', true)
    .single();

  if (!project) notFound();

  const { data: org } = await supabase
    .from('organizations')
    .select('id, name')
    .eq('id', orgId)
    .eq('listing_status', 'listed')
    .single();

  if (!org) notFound();

  // Verified reports only
  const { data: reports } = await supabase
    .from('project_reports')
    .select('id, title, report_body, report_date, verified_at')
    .eq('project_id', projectId)
    .eq('verification_status', 'verified')
    .order('report_date', { ascending: false });

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm mb-6">
        <Link href="/charities" className="text-emerald-700 hover:text-emerald-800">Charities</Link>
        <span className="text-gray-300">/</span>
        <Link href={`/charities/${orgId}`}
          className="text-emerald-700 hover:text-emerald-800 truncate max-w-[160px]">
          {org.name}
        </Link>
        <span className="text-gray-300">/</span>
        <span className="text-gray-500 truncate">{project.title}</span>
      </div>

      {/* Project header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h1 className="text-xl font-bold text-gray-900 mb-2">{project.title}</h1>
        <p className="text-sm text-gray-600 leading-relaxed mb-4">{project.objective}</p>

        <div className="flex flex-wrap gap-4 text-sm text-gray-500">
          {project.location_text && (
            <span>📍 {project.location_text}</span>
          )}
          {project.start_date && (
            <span>📅 {project.start_date} → {project.end_date ?? 'ongoing'}</span>
          )}
          {project.budget_amount && (
            <span>💰 MYR {Number(project.budget_amount).toLocaleString('en-MY')}</span>
          )}
        </div>

        {project.beneficiary_summary && (
          <div className="mt-4 p-3 bg-emerald-50 rounded-lg">
            <p className="text-xs font-medium text-emerald-800 mb-0.5">Who benefits</p>
            <p className="text-sm text-emerald-700">{project.beneficiary_summary}</p>
          </div>
        )}
      </div>

      {/* Verified reports */}
      <h2 className="text-base font-semibold text-gray-800 mb-3">
        Verified progress reports ({reports?.length ?? 0})
      </h2>

      {reports?.length ? (
        <div className="space-y-4">
          {reports.map((r) => {
            const body = r.report_body as Record<string, any>;
            return (
              <div key={r.id}
                className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <h3 className="text-sm font-semibold text-gray-900">{r.title}</h3>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-xs text-emerald-600 font-medium">Verified</span>
                  </div>
                </div>

                {r.report_date && (
                  <p className="text-xs text-gray-400 mb-3">
                    Report date: {new Date(r.report_date).toLocaleDateString('en-MY')}
                  </p>
                )}

                {body.narrative && (
                  <p className="text-sm text-gray-600 leading-relaxed mb-3">
                    {body.narrative}
                  </p>
                )}

                <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                  {body.beneficiaries_reached != null && (
                    <span>👥 {Number(body.beneficiaries_reached).toLocaleString()} beneficiaries</span>
                  )}
                  {body.spend_to_date != null && (
                    <span>💸 MYR {Number(body.spend_to_date).toLocaleString('en-MY')} spent</span>
                  )}
                </div>

                {body.milestones_completed?.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-medium text-gray-500 mb-1">Milestones completed</p>
                    <ul className="text-xs text-gray-600 space-y-0.5 list-disc list-inside">
                      {(body.milestones_completed as string[]).map((m, i) => (
                        <li key={i}>{m}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {r.verified_at && (
                  <p className="text-xs text-gray-400 mt-3">
                    ✓ Verified {new Date(r.verified_at).toLocaleDateString('en-MY')}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 p-8 text-center">
          <p className="text-sm text-gray-400">No verified reports yet.</p>
        </div>
      )}

      {/* Donate CTA */}
      <div className="mt-8 bg-emerald-700 rounded-xl p-6 text-center">
        <p className="text-white font-semibold mb-1">Support {org.name}</p>
        <p className="text-emerald-200 text-sm mb-4">Direct to charity. Transparent. Verified.</p>
        <Link href={`/donate/${orgId}?project=${projectId}`}
          className="inline-flex items-center px-6 py-2.5 rounded-lg bg-white
                     text-emerald-700 text-sm font-semibold hover:bg-emerald-50 transition-colors">
          Donate to this project
        </Link>
      </div>
    </div>
  );
}
