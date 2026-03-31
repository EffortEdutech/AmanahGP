// apps/admin/app/(dashboard)/review/certification/[appId]/page.tsx
// AmanahHub Console — Reviewer: CTCF evaluation + document review
// Fixed: submitCtcfEvaluation from '../../certification-actions' (was '../certification-actions')

import { redirect }              from 'next/navigation';
import { createClient,
         createServiceClient }   from '@/lib/supabase/server';
import { isReviewerOrAbove }     from '@agp/config';
import { CtcfEvaluationForm }    from '@/components/review/ctcf-evaluation-form';
import { DocumentReviewPanel }   from '@/components/documents/document-review-panel';
// certification-actions.ts lives at review/certification-actions.ts
// from review/certification/[appId]/ we need to go up TWO levels: ../../
import { submitCtcfEvaluation }  from '../../certification-actions';

interface Props { params: Promise<{ appId: string }> }

export const metadata = { title: 'CTCF Evaluation | AmanahHub Console' };

export default async function CtcfEvaluationPage({ params }: Props) {
  const { appId } = await params;
  const supabase  = await createClient();
  const svc       = createServiceClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: me } = await supabase
    .from('users').select('id, platform_role')
    .eq('auth_provider_user_id', user.id).single();
  if (!me || !isReviewerOrAbove(me.platform_role)) redirect('/dashboard');

  const { data: app } = await svc
    .from('certification_applications')
    .select(`
      id, status, submitted_at, reviewer_comment,
      organizations (
        id, name, org_type, oversight_authority, fund_types,
        onboarding_status, listing_status
      )
    `)
    .eq('id', appId).single();

  if (!app) redirect('/review/certification');

  const org = Array.isArray(app.organizations) ? app.organizations[0] : app.organizations;

  // Latest evaluation
  const { data: latestEval } = await svc
    .from('certification_evaluations')
    .select('id, total_score, score_breakdown, criteria_version, computed_at')
    .eq('certification_application_id', appId)
    .order('computed_at', { ascending: false })
    .limit(1).maybeSingle();

  // Org financial snapshot (for context)
  const { data: financials } = await svc
    .from('financial_snapshots')
    .select('period_year, verification_status, inputs')
    .eq('organization_id', org?.id ?? '')
    .order('period_year', { ascending: false })
    .limit(1).maybeSingle();

  // Verified reports (for context)
  const { data: verifiedReports } = await svc
    .from('project_reports')
    .select('id, title, verified_at')
    .eq('organization_id', org?.id ?? '')
    .eq('verification_status', 'verified')
    .order('verified_at', { ascending: false })
    .limit(5);

  // ALL org documents (governance + financial + shariah) for this org
  const { data: orgDocs } = await svc
    .from('org_documents')
    .select(`
      id, document_category, document_type, label, file_name,
      file_size_bytes, mime_type, is_approved_public, period_year, created_at
    `)
    .eq('organization_id', org?.id ?? '')
    .in('document_category', ['governance', 'financial', 'shariah'])
    .order('document_category')
    .order('created_at', { ascending: false });

  const fundTypes = (org?.fund_types ?? []) as string[];
  const hasZakat  = fundTypes.includes('zakat');
  const hasWaqf   = fundTypes.includes('waqf');

  return (
    <div className="max-w-3xl">
      <div className="mb-5">
        <a href="/review/certification"
          className="text-[11px] text-gray-400 hover:text-emerald-700 mb-3 block">
          ← Certification queue
        </a>
        <h1 className="text-[18px] font-semibold text-gray-900">CTCF Evaluation</h1>
        <p className="text-[11px] text-gray-400 mt-0.5">
          Application ID: {appId.substring(0, 8)}…
        </p>
      </div>

      {/* Org context */}
      <div className="card p-4 mb-4">
        <p className="sec-label">Organization context</p>
        <div className="grid grid-cols-2 gap-2 mt-2 text-[12px]">
          <ContextRow label="Name"          value={org?.name ?? '—'} />
          <ContextRow label="Type"          value={org?.org_type?.replace('_',' ') ?? '—'} />
          <ContextRow label="Oversight"     value={org?.oversight_authority ?? '—'} />
          <ContextRow label="Fund types"    value={fundTypes.join(', ').toUpperCase() || '—'} />
          <ContextRow label="Status"        value={app.status} />
          <ContextRow label="Submitted"
            value={app.submitted_at
              ? new Date(app.submitted_at).toLocaleDateString('en-MY', {
                  day: 'numeric', month: 'short', year: 'numeric',
                })
              : '—'} />
        </div>
      </div>

      {/* Financial context */}
      {financials && (
        <div className="card p-4 mb-4">
          <p className="sec-label">Financial snapshot ({financials.period_year})</p>
          <div className="grid grid-cols-2 gap-2 mt-2 text-[12px]">
            <ContextRow label="Status" value={financials.verification_status} />
            {financials.inputs?.audit_firm && (
              <ContextRow label="Auditor" value={financials.inputs.audit_firm} />
            )}
          </div>
        </div>
      )}

      {/* Verified reports */}
      {(verifiedReports ?? []).length > 0 && (
        <div className="card p-4 mb-4">
          <p className="sec-label">Verified reports ({verifiedReports!.length})</p>
          <div className="space-y-1 mt-2">
            {verifiedReports!.map((r) => (
              <div key={r.id} className="text-[11px] text-gray-600 flex justify-between">
                <span className="truncate">{r.title}</span>
                <span className="text-gray-400 ml-2 flex-shrink-0">
                  {r.verified_at
                    ? new Date(r.verified_at).toLocaleDateString('en-MY')
                    : ''}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Previous evaluation */}
      {latestEval && (
        <div className="card p-4 mb-4 bg-emerald-50 border-emerald-200">
          <p className="sec-label">Previous evaluation</p>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-[22px] font-bold text-emerald-800">
              {Number(latestEval.total_score).toFixed(1)}
            </span>
            <div className="text-[11px] text-emerald-700">
              <p>{latestEval.criteria_version}</p>
              <p className="text-gray-500">
                {new Date(latestEval.computed_at).toLocaleDateString('en-MY')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* DOCUMENT REVIEW PANEL — reviewer approves docs before CTCF scoring */}
      <DocumentReviewPanel
        orgId={org?.id ?? ''}
        documents={orgDocs ?? []}
      />

      <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 mb-4 text-[11px]
                      text-amber-800">
        <strong>Reviewer note:</strong> Review and approve all uploaded documents above
        before completing the CTCF evaluation. Approved documents will become publicly
        visible to donors on AmanahHub.
      </div>

      {/* CTCF evaluation form */}
      <CtcfEvaluationForm
        appId={appId}
        orgId={org?.id ?? ''}
        orgName={org?.name ?? ''}
        hasZakat={hasZakat}
        hasWaqf={hasWaqf}
        action={submitCtcfEvaluation}
      />
    </div>
  );
}

function ContextRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3">
      <span className="text-gray-400 w-24 flex-shrink-0">{label}</span>
      <span className="text-gray-800">{value}</span>
    </div>
  );
}
