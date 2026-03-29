// apps/admin/app/(dashboard)/review/certification/[appId]/page.tsx
// AmanahHub Console — Reviewer: CTCF evaluation form + decision

import { redirect }          from 'next/navigation';
import { createClient }      from '@/lib/supabase/server';
import { isReviewerOrAbove } from '@agp/config';
import { CtcfEvaluationForm } from '@/components/review/ctcf-evaluation-form';
import { submitCtcfEvaluation } from '../certification-actions';

interface Props { params: Promise<{ appId: string }> }

export const metadata = { title: 'CTCF Evaluation | AmanahHub Console' };

export default async function CtcfEvaluationPage({ params }: Props) {
  const { appId }  = await params;
  const supabase   = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: me } = await supabase
    .from('users').select('id, platform_role')
    .eq('auth_provider_user_id', user.id).single();

  if (!me || !isReviewerOrAbove(me.platform_role)) redirect('/dashboard');

  const { data: app } = await supabase
    .from('certification_applications')
    .select(`
      id, status, submitted_at, reviewer_comment,
      organizations (
        id, name, org_type, oversight_authority, fund_types,
        onboarding_status, listing_status
      )
    `)
    .eq('id', appId)
    .single();

  if (!app) redirect('/review/certification');

  const org = Array.isArray(app.organizations) ? app.organizations[0] : app.organizations;

  // Latest evaluation if exists
  const { data: latestEval } = await supabase
    .from('certification_evaluations')
    .select('id, total_score, score_breakdown, criteria_version, computed_at')
    .eq('certification_application_id', appId)
    .order('computed_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  // Org data to help reviewer fill form
  const { data: financials } = await supabase
    .from('financial_snapshots')
    .select('period_year, verification_status, inputs')
    .eq('organization_id', org?.id ?? '')
    .order('period_year', { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: verifiedReports } = await supabase
    .from('project_reports')
    .select('id, title, report_body, verified_at')
    .eq('organization_id', org?.id ?? '')
    .eq('verification_status', 'verified')
    .order('verified_at', { ascending: false })
    .limit(5);

  const fundTypes = (org?.fund_types ?? []) as string[];
  const hasZakat  = fundTypes.includes('zakat');
  const hasWaqf   = fundTypes.includes('waqf');

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <a href="/review/certification"
          className="text-sm text-gray-500 hover:text-gray-700 mb-1 block">
          ← Certification queue
        </a>
        <h1 className="text-2xl font-semibold text-gray-900">
          CTCF Evaluation
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">{org?.name}</p>
      </div>

      {/* Org context */}
      <div className="rounded-lg border border-gray-200 bg-white divide-y divide-gray-100 mb-6">
        <div className="px-5 py-3 bg-gray-50">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Organization context
          </h2>
        </div>
        <ContextRow label="Type"          value={org?.org_type?.replace('_', ' ') ?? '—'} />
        <ContextRow label="Authority"     value={org?.oversight_authority ?? '—'} />
        <ContextRow label="Fund types"    value={fundTypes.join(', ').toUpperCase() || '—'} />
        <ContextRow label="Status"        value={`${org?.onboarding_status} / ${org?.listing_status}`} />
        <ContextRow label="Verified reports" value={String(verifiedReports?.length ?? 0)} />
        <ContextRow label="Latest financial"
          value={financials
            ? `${financials.period_year} — ${financials.verification_status}`
            : 'None submitted'} />
      </div>

      {/* Previous evaluation */}
      {latestEval && (
        <div className="rounded-md bg-blue-50 border border-blue-200 px-4 py-3 mb-6">
          <p className="text-sm font-semibold text-blue-900 mb-1">
            Previous evaluation — {latestEval.criteria_version}
          </p>
          <p className="text-sm text-blue-700">
            Score: <strong>{Number(latestEval.total_score).toFixed(1)}/100</strong>{' '}
            computed {new Date(latestEval.computed_at).toLocaleDateString('en-MY')}
          </p>
          <p className="text-xs text-blue-500 mt-0.5">
            A new evaluation will be appended — previous score is preserved.
          </p>
        </div>
      )}

      {/* Evaluation form */}
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
    <div className="px-5 py-2.5 flex gap-4">
      <dt className="w-40 flex-shrink-0 text-sm text-gray-500">{label}</dt>
      <dd className="text-sm text-gray-900">{value}</dd>
    </div>
  );
}
