// apps/org/app/(protected)/reports/[id]/page.tsx
// amanahOS — Report Detail (Sprint 27)
//
// Shows full report content from report_body JSONB.
// Evidence upload section (private by default, ADR-005).
// Submit / Resubmit action for drafts and changes_requested.
// Reviewer comment shown prominently when changes are requested.

import { redirect, notFound }  from 'next/navigation';
import Link                    from 'next/link';
import { createClient }        from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { EvidenceUploader }    from '@/components/reports/evidence-uploader';
import { ReportActions }       from '@/components/reports/report-actions';
function relationOne<T>(value: unknown): T | null {
  if (Array.isArray(value)) {
    return (value[0] as T | undefined) ?? null;
  }
  return (value as T | null) ?? null;
}


export const metadata = { title: 'Report — amanahOS' };

const VERIFY_CONFIG: Record<string, {
  label: string; color: string; bg: string; border: string;
}> = {
  pending:           { label: 'Pending review',    color: 'text-amber-700',  bg: 'bg-amber-50',  border: 'border-amber-200' },
  verified:          { label: 'Verified ✓',         color: 'text-emerald-700',bg: 'bg-emerald-50',border: 'border-emerald-200' },
  changes_requested: { label: 'Changes requested',  color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200' },
  rejected:          { label: 'Rejected',           color: 'text-red-700',    bg: 'bg-red-50',    border: 'border-red-200' },
};

const SUBMIT_CONFIG: Record<string, { label: string; color: string }> = {
  draft:     { label: 'Draft',     color: 'text-gray-600' },
  submitted: { label: 'Submitted', color: 'text-amber-700' },
};

export default async function ReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const supabase = await createClient();
  const service  = createServiceClient();
  const { id }   = await params;

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

  const orgId     = membership.organization_id;
  const isManager = ['org_admin', 'org_manager'].includes(membership.org_role);

  // Load report (must belong to this org)
  const { data: report } = await service
    .from('project_reports')
    .select('*, projects(id, title)')
    .eq('id', id).eq('organization_id', orgId).single();
  if (!report) notFound();

  // Load evidence files
  const { data: evidenceFiles } = await service
    .from('evidence_files')
    .select('id, file_name, mime_type, visibility, is_approved_public, file_size_bytes, created_at')
    .eq('project_report_id', id)
    .order('created_at', { ascending: true });

  const vc      = VERIFY_CONFIG[report.verification_status] ?? VERIFY_CONFIG.pending;
  const sc      = SUBMIT_CONFIG[report.submission_status]   ?? SUBMIT_CONFIG.draft;
  const project = relationOne<{ id: string; title: string }>(report.projects);

  // Parse report body
  const body = (report.report_body ?? {}) as {
    narrative?:             string;
    beneficiaries_reached?: number | null;
    spend_to_date?:         number | null;
    milestones_completed?:  string | null;
    next_steps?:            string | null;
  };

  const canSubmit   = isManager && (report.submission_status === 'draft' || report.verification_status === 'changes_requested');
  const canUpload   = isManager && report.submission_status !== 'submitted' ||
                      (isManager && report.verification_status === 'changes_requested');

  const fmt = (n: number) =>
    `RM ${n.toLocaleString('en-MY', { minimumFractionDigits: 2 })}`;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <Link href="/reports" className="text-[12px] text-gray-400 hover:text-gray-600">
              ← Reports
            </Link>
            {project && (
              <>
                <span className="text-gray-300">/</span>
                <Link href={`/projects/${project.id}`}
                  className="text-[12px] text-gray-400 hover:text-gray-600">
                  {project.title}
                </Link>
              </>
            )}
          </div>
          <h1 className="text-xl font-semibold text-gray-900">{report.title}</h1>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className={`text-[10px] font-medium ${sc.color}`}>
              {sc.label}
            </span>
            <span className="text-gray-300">·</span>
            <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${vc.bg} ${vc.color} ${vc.border}`}>
              {vc.label}
            </span>
            {report.report_date && (
              <>
                <span className="text-gray-300">·</span>
                <span className="text-[11px] text-gray-500">{report.report_date}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Reviewer comment — changes requested */}
      {report.verification_status === 'changes_requested' && report.reviewer_comment && (
        <div className="rounded-xl border-2 border-orange-300 bg-orange-50 p-5">
          <div className="flex items-start gap-3">
            <span className="text-orange-500 text-lg flex-shrink-0">⚠</span>
            <div>
              <p className="text-[12px] font-bold text-orange-800">
                Reviewer requested changes — please address before resubmitting
              </p>
              <p className="text-[13px] text-orange-700 mt-2 leading-relaxed">
                {report.reviewer_comment}
              </p>
              <p className="text-[10px] text-orange-600 mt-2">
                Update the relevant sections, upload additional evidence if needed, then resubmit.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Verified success */}
      {report.verification_status === 'verified' && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 flex items-center gap-3">
          <span className="text-2xl">✓</span>
          <div>
            <p className="text-[12px] font-semibold text-emerald-800">
              Report verified — CTCF Layer 3 credit recorded
            </p>
            <p className="text-[11px] text-emerald-600 mt-0.5">
              Verified {report.verified_at
                ? new Date(report.verified_at).toLocaleDateString('en-MY', { day: 'numeric', month: 'long', year: 'numeric' })
                : ''}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

        {/* â”€â”€ Left: Report content â”€â”€ */}
        <div className="lg:col-span-2 space-y-5">

          {/* Narrative */}
          {body.narrative && (
            <div className="rounded-lg border border-gray-200 bg-white p-5">
              <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Narrative
              </p>
              <p className="text-[13px] text-gray-700 leading-relaxed whitespace-pre-wrap">
                {body.narrative}
              </p>
            </div>
          )}

          {/* Key metrics */}
          {(body.beneficiaries_reached != null || body.spend_to_date != null) && (
            <div className="grid grid-cols-2 gap-3">
              {body.beneficiaries_reached != null && (
                <div className="rounded-lg border border-gray-200 bg-white px-4 py-4">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide">Beneficiaries reached</p>
                  <p className="text-3xl font-black text-emerald-700 mt-1">
                    {body.beneficiaries_reached.toLocaleString()}
                  </p>
                </div>
              )}
              {body.spend_to_date != null && (
                <div className="rounded-lg border border-gray-200 bg-white px-4 py-4">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide">Cumulative spend</p>
                  <p className="text-2xl font-black text-gray-800 mt-1">
                    {fmt(body.spend_to_date)}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Milestones + Next steps */}
          {(body.milestones_completed || body.next_steps) && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {body.milestones_completed && (
                <div className="rounded-lg border border-gray-200 bg-white p-4">
                  <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Milestones completed
                  </p>
                  <p className="text-[12px] text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {body.milestones_completed}
                  </p>
                </div>
              )}
              {body.next_steps && (
                <div className="rounded-lg border border-gray-200 bg-white p-4">
                  <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Next steps
                  </p>
                  <p className="text-[12px] text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {body.next_steps}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Evidence section */}
          <EvidenceUploader
            orgId={orgId}
            reportId={id}
            existingFiles={(evidenceFiles ?? []).map((f) => ({
              id:               f.id,
              file_name:        f.file_name,
              mime_type:        f.mime_type,
              visibility:       f.visibility,
              is_approved_public: f.is_approved_public,
              file_size_bytes:  f.file_size_bytes,
              created_at:       f.created_at,
            }))}
            canUpload={canUpload}
          />
        </div>

        {/* â”€â”€ Right: Actions + meta â”€â”€ */}
        <div className="space-y-4">

          {/* Submit / Resubmit */}
          {canSubmit && (
            <ReportActions reportId={id} orgId={orgId} />
          )}

          {/* Meta card */}
          <div className="rounded-lg border border-gray-200 bg-white divide-y divide-gray-100">
            <div className="px-4 py-3 bg-gray-50 rounded-t-lg">
              <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Details</p>
            </div>
            {[
              { label: 'Project',   value: project?.title ?? '—' },
              { label: 'Status',    value: `${sc.label} · ${vc.label}` },
              { label: 'Created',   value: new Date(report.created_at).toLocaleDateString('en-MY') },
              { label: 'Submitted', value: report.submitted_at ? new Date(report.submitted_at).toLocaleDateString('en-MY') : '—' },
              { label: 'Evidence',  value: `${(evidenceFiles ?? []).length} file(s)` },
            ].map(({ label, value }) => (
              <div key={label} className="grid grid-cols-2 gap-2 px-4 py-2.5">
                <p className="text-[10px] text-gray-400 font-medium">{label}</p>
                <p className="text-[11px] text-gray-700">{value}</p>
              </div>
            ))}
          </div>

          {/* CTCF note */}
          <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
            <p className="text-[11px] font-semibold text-blue-800">CTCF Layer 3</p>
            <div className="text-[10px] text-blue-700 mt-1 space-y-1">
              <p>• Upload evidence (photos, PDFs) alongside this report</p>
              <p>• Reviewer verifies both report and evidence together</p>
              <p>• Verified reports with beneficiary data earn Layer 3 credit</p>
              <p>• Evidence is private by default — public only after reviewer approval</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

