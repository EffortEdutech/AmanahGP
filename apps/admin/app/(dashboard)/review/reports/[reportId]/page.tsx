// apps/admin/app/(dashboard)/review/reports/[reportId]/page.tsx
// AmanahHub Console — Reviewer: report detail + evidence approval + decision

import { redirect }           from 'next/navigation';
import { createClient }       from '@/lib/supabase/server';
import { isReviewerOrAbove }  from '@agp/config';
import { StatusBadge }        from '@/components/ui/status-badge';
import { ReviewDecisionForm } from '@/components/review/review-decision-form';
import { ApproveEvidenceButton } from '@/components/review/approve-evidence-button';
import {
  reportVerificationDecision,
  approveEvidencePublic,
} from '../../actions';

interface Props { params: Promise<{ reportId: string }> }

export default async function ReviewReportPage({ params }: Props) {
  const { reportId } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: me } = await supabase
    .from('users').select('platform_role')
    .eq('auth_provider_user_id', user.id).single();

  if (!me || !isReviewerOrAbove(me.platform_role)) redirect('/dashboard');

  const { data: report } = await supabase
    .from('project_reports')
    .select(`
      id, title, report_body, report_date,
      submission_status, verification_status,
      submitted_at, verified_at, reviewer_comment,
      organizations ( id, name ),
      projects ( id, title )
    `)
    .eq('id', reportId).single();

  if (!report) redirect('/review/reports');

  const { data: evidence } = await supabase
    .from('evidence_files')
    .select('id, file_name, mime_type, visibility, is_approved_public, captured_at, geo_lat, geo_lng')
    .eq('project_report_id', reportId)
    .order('created_at', { ascending: false });

  const org     = Array.isArray(report.organizations) ? report.organizations[0] : report.organizations;
  const project = Array.isArray(report.projects)      ? report.projects[0]      : report.projects;
  const body    = report.report_body as Record<string, any>;
  const isPending = report.verification_status === 'pending';

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <a href="/review/reports" className="text-sm text-gray-500 hover:text-gray-700 mb-1 block">
          ← Reports queue
        </a>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">{report.title}</h1>
            <p className="text-xs text-gray-400 mt-1">
              {org?.name} · {project?.title}
            </p>
          </div>
          <StatusBadge status={report.verification_status} size="md" />
        </div>
      </div>

      {/* Report content */}
      <div className="rounded-lg border border-gray-200 bg-white divide-y divide-gray-100 mb-5">
        <SectionHead>Report content</SectionHead>
        {body.narrative && <Row label="Narrative"><p className="text-sm text-gray-900 whitespace-pre-wrap">{body.narrative}</p></Row>}
        {body.beneficiaries_reached != null && (
          <Row label="Beneficiaries"><p className="text-sm text-gray-900">{body.beneficiaries_reached.toLocaleString()}</p></Row>
        )}
        {body.spend_to_date != null && (
          <Row label="Spend to date">
            <p className="text-sm text-gray-900">
              MYR {Number(body.spend_to_date).toLocaleString('en-MY', { minimumFractionDigits: 2 })}
            </p>
          </Row>
        )}
        {body.milestones_completed?.length > 0 && (
          <Row label="Milestones">
            <ul className="text-sm text-gray-900 list-disc list-inside space-y-0.5">
              {(body.milestones_completed as string[]).map((m, i) => <li key={i}>{m}</li>)}
            </ul>
          </Row>
        )}
        {body.next_steps?.length > 0 && (
          <Row label="Next steps">
            <ul className="text-sm text-gray-900 list-disc list-inside space-y-0.5">
              {(body.next_steps as string[]).map((s, i) => <li key={i}>{s}</li>)}
            </ul>
          </Row>
        )}
      </div>

      {/* Evidence with approval controls */}
      <div className="rounded-lg border border-gray-200 bg-white divide-y divide-gray-100 mb-5">
        <SectionHead>Evidence ({evidence?.length ?? 0} files)</SectionHead>
        {evidence?.length ? (
          evidence.map((ev) => (
            <div key={ev.id} className="px-5 py-3 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm text-gray-900 truncate">{ev.file_name}</p>
                <p className="text-xs text-gray-400">
                  {ev.visibility}
                  {ev.captured_at && ` · ${new Date(ev.captured_at).toLocaleDateString('en-MY')}`}
                  {ev.geo_lat && ` · ${ev.geo_lat.toFixed(4)}, ${ev.geo_lng?.toFixed(4)}`}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {ev.is_approved_public ? (
                  <span className="text-xs font-medium text-emerald-600">✓ Public approved</span>
                ) : (
                  <ApproveEvidenceButton evidenceId={ev.id} action={approveEvidencePublic} />
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="px-5 py-4 text-sm text-gray-400">No evidence files attached.</div>
        )}
      </div>

      {/* Decision */}
      {isPending && (
        <div className="rounded-lg border border-gray-200 bg-white px-5 py-5">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
            Verification decision
          </h2>
          <ReviewDecisionForm
            hiddenFields={{ reportId }}
            action={reportVerificationDecision}
            decisions={[
              { value: 'verified',           label: 'Verify report',     color: 'emerald' },
              { value: 'changes_requested',  label: 'Request changes',   color: 'amber' },
              { value: 'rejected',           label: 'Reject report',     color: 'red' },
            ]}
            commentLabel="Reviewer comment (visible to org admin)"
            successRedirect="/review/reports"
          />
        </div>
      )}

      {!isPending && (
        <div className="rounded-md bg-gray-50 border border-gray-200 px-4 py-3 text-sm text-gray-500">
          Decision recorded: <strong>{report.verification_status}</strong>
          {report.reviewer_comment && (
            <p className="mt-1 text-gray-400 italic">"{report.reviewer_comment}"</p>
          )}
        </div>
      )}
    </div>
  );
}

function SectionHead({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-5 py-3 bg-gray-50">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{children}</h3>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="px-5 py-4 flex gap-4">
      <dt className="w-36 flex-shrink-0 text-sm text-gray-500 pt-0.5">{label}</dt>
      <dd className="flex-1">{children}</dd>
    </div>
  );
}
