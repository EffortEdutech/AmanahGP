// apps/admin/app/(dashboard)/orgs/[orgId]/projects/[projectId]/reports/[reportId]/page.tsx
// AmanahHub Console — Report detail: content + evidence + submit

import { redirect }     from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { StatusBadge }  from '@/components/ui/status-badge';
import { SubmitReportButton } from '@/components/report/submit-report-button';
import { EvidenceSection }    from '@/components/report/evidence-section';
import { submitReport }       from '../actions';

interface Props { params: Promise<{ orgId: string; projectId: string; reportId: string }> }

export default async function ReportDetailPage({ params }: Props) {
  const { orgId, projectId, reportId } = await params;
  const supabase = await createClient();

  const { data: report } = await supabase
    .from('project_reports')
    .select(`
      id, title, report_body, report_date,
      submission_status, verification_status,
      submitted_at, verified_at, reviewer_comment, created_at
    `)
    .eq('id', reportId).eq('organization_id', orgId).single();

  if (!report) redirect(`/orgs/${orgId}/projects/${projectId}`);

  const { data: evidence } = await supabase
    .from('evidence_files')
    .select('id, file_name, mime_type, visibility, is_approved_public, created_at')
    .eq('project_report_id', reportId)
    .order('created_at', { ascending: false });

  const { data: canEdit } = await supabase.rpc('org_role_at_least', {
    org_id: orgId, min_role: 'org_manager',
  });

  const body      = report.report_body as Record<string, any>;
  const isDraft   = report.submission_status === 'draft';
  const canSubmit = canEdit && isDraft;

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="mb-6">
        <a href={`/orgs/${orgId}/projects/${projectId}`}
           className="text-sm text-gray-500 hover:text-gray-700 mb-1 block">
          ← Project
        </a>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">{report.title}</h1>
            <p className="text-xs text-gray-400 mt-1">
              {report.report_date ?? `Created ${new Date(report.created_at).toLocaleDateString('en-MY')}`}
            </p>
          </div>
          <StatusBadge status={report.verification_status} size="md" />
        </div>
      </div>

      {/* Reviewer comment (if changes requested) */}
      {report.verification_status === 'changes_requested' && report.reviewer_comment && (
        <div className="mb-6 rounded-md bg-orange-50 border border-orange-200 px-4 py-3">
          <p className="text-sm font-semibold text-orange-900 mb-1">Changes requested by reviewer</p>
          <p className="text-sm text-orange-800 whitespace-pre-wrap">{report.reviewer_comment}</p>
        </div>
      )}

      {/* Report body */}
      <div className="rounded-lg border border-gray-200 bg-white divide-y divide-gray-100 mb-6">
        <SectionHeader>Report content</SectionHeader>

        {body.narrative && (
          <Row label="Narrative">
            <p className="text-sm text-gray-900 whitespace-pre-wrap">{body.narrative}</p>
          </Row>
        )}
        {body.beneficiaries_reached != null && (
          <Row label="Beneficiaries reached">
            <p className="text-sm text-gray-900">{body.beneficiaries_reached.toLocaleString()}</p>
          </Row>
        )}
        {body.spend_to_date != null && (
          <Row label="Spend to date">
            <p className="text-sm text-gray-900">
              MYR {Number(body.spend_to_date).toLocaleString('en-MY', { minimumFractionDigits: 2 })}
            </p>
          </Row>
        )}
        {body.milestones_completed?.length > 0 && (
          <Row label="Milestones completed">
            <ul className="text-sm text-gray-900 space-y-0.5 list-disc list-inside">
              {(body.milestones_completed as string[]).map((m, i) => (
                <li key={i}>{m}</li>
              ))}
            </ul>
          </Row>
        )}
        {body.next_steps?.length > 0 && (
          <Row label="Next steps">
            <ul className="text-sm text-gray-900 space-y-0.5 list-disc list-inside">
              {(body.next_steps as string[]).map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </Row>
        )}
      </div>

      {/* Evidence */}
      <EvidenceSection
        orgId={orgId}
        reportId={reportId}
        evidence={evidence ?? []}
        canUpload={!!canEdit && report.verification_status !== 'verified'}
      />

      {/* Submit */}
      {canSubmit && (
        <div className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 px-5 py-5">
          <h3 className="text-sm font-semibold text-emerald-900 mb-1">Ready to submit?</h3>
          <p className="text-sm text-emerald-700 mb-4">
            Once submitted, a reviewer will verify this report. You cannot edit it while it is under review.
          </p>
          <SubmitReportButton
            orgId={orgId} projectId={projectId} reportId={reportId}
            action={submitReport}
          />
        </div>
      )}

      {report.verified_at && (
        <div className="mt-6 rounded-md bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-800">
          ✅ Verified on {new Date(report.verified_at).toLocaleDateString('en-MY')}
        </div>
      )}
    </div>
  );
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-5 py-4">
      <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">{children}</h2>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="px-5 py-4 flex gap-4">
      <dt className="w-44 flex-shrink-0 text-sm text-gray-500 pt-0.5">{label}</dt>
      <dd className="flex-1">{children}</dd>
    </div>
  );
}
