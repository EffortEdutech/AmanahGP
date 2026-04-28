// apps/org/app/(protected)/certification/page.tsx
// amanahOS — Certification Application (Sprint 23)
//
// The org-facing certification journey:
//   1. Readiness check — auto-evaluates prerequisites
//   2. Apply — creates certification_application record
//   3. Status tracking — draft → submitted → under_review → approved/rejected
//   4. History — all past certifications
//
// Reviewer evaluation happens in AmanahHub Console (existing workflow).

import { redirect }            from 'next/navigation';
import Link                    from 'next/link';
import { createClient }        from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { CertificationApplyForm } from '@/components/org/certification-apply-form';
import { getAmanahTier } from '@/lib/amanah-tiers';
import { getOrgAccessOrRedirect } from '@/lib/access/org-access';
function relationOne<T>(value: unknown): T | null {
  if (Array.isArray(value)) {
    return (value[0] as T | undefined) ?? null;
  }
  return (value as T | null) ?? null;
}


export const metadata = { title: 'Certification — amanahOS' };

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  draft:        { label: 'Draft',       color: 'text-gray-600',    bg: 'bg-gray-100' },
  submitted:    { label: 'Submitted',   color: 'text-amber-700',   bg: 'bg-amber-100' },
  under_review: { label: 'Under review',color: 'text-blue-700',    bg: 'bg-blue-100' },
  approved:     { label: 'Approved ✓',  color: 'text-emerald-700', bg: 'bg-emerald-100' },
  rejected:     { label: 'Not approved',color: 'text-red-700',     bg: 'bg-red-100' },
};

const GRADE_CONFIG: Record<string, { label: string; color: string; bg: string; ring: string }> = {
  certified:     { label: 'Certified',     color: 'text-emerald-700', bg: 'bg-emerald-50',  ring: 'ring-emerald-400' },
  not_certified: { label: 'Not certified', color: 'text-red-700',     bg: 'bg-red-50',      ring: 'ring-red-300' },
  suspended:     { label: 'Suspended',     color: 'text-amber-700',   bg: 'bg-amber-50',    ring: 'ring-amber-400' },
};

export default async function CertificationPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;
  const supabase = await createClient();
  const service  = createServiceClient();

  const { authUser: user, platformUser, membership, isManager: accessIsManager, isSuperAdmin } = await getOrgAccessOrRedirect(orgId);
  const org       = relationOne<{
    id: string; name: string; registration_no: string | null;
    address_text: string | null; contact_email: string | null;
    fund_types: string[]; onboarding_status: string;
  }>(membership.organizations);
  const isManager = accessIsManager;

  // ── Load all data in parallel ──────────────────────────────
  const [
    latestScoreResult,
    bankCountResult,
    closesResult,
    snapshotResult,
    coiPolicyResult,
    projectCountResult,
    reportCountResult,
    memberCountResult,
    currentAppResult,
    historyResult,
  ] = await Promise.all([
    service.from('amanah_index_history')
      .select('score_value, computed_at')
      .eq('organization_id', orgId)
      .order('computed_at', { ascending: false }).limit(1).maybeSingle(),

    service.from('bank_accounts')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', orgId).eq('is_active', true),

    service.from('fund_period_closes')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', orgId),

    service.from('financial_snapshots')
      .select('id, submission_status, verification_status')
      .eq('organization_id', orgId)
      .eq('submission_status', 'submitted')
      .limit(1).maybeSingle(),

    service.from('trust_events')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .eq('event_type', 'gov_policy_uploaded'),

    service.from('projects')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', orgId),

    service.from('project_reports')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .eq('submission_status', 'submitted'),

    service.from('org_members')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', orgId).eq('status', 'active'),

    // Active application (not rejected/approved)
    service.from('certification_applications')
      .select('id, status, submitted_at, reviewer_comment, created_at')
      .eq('organization_id', orgId)
      .not('status', 'in', '(rejected)')
      .order('created_at', { ascending: false })
      .limit(1).maybeSingle(),

    service.from('certification_history')
      .select('id, new_status, valid_from, valid_to, decision_reason, decided_at')
      .eq('organization_id', orgId)
      .order('decided_at', { ascending: false })
      .limit(5),
  ]);

  const score          = Number(latestScoreResult.data?.score_value ?? 0);
  const bankCount      = bankCountResult.count      ?? 0;
  const closesCount    = closesResult.count          ?? 0;
  const hasSnapshot    = !!snapshotResult.data;
  const hasCOI         = (coiPolicyResult.count ?? 0) > 0;
  const projectCount   = projectCountResult.count    ?? 0;
  const reportCount    = reportCountResult.count     ?? 0;
  const memberCount    = memberCountResult.count     ?? 0;
  const currentApp     = currentAppResult.data;
  const history        = historyResult.data ?? [];

  // Latest certification status
  const latestCert = history[0] ?? null;
  const isCertified = latestCert?.new_status === 'certified';

  // ── Readiness checks ──────────────────────────────────────
  const checks = [
    {
      id: 'profile',
      label: 'Organisation profile complete',
      detail: 'Registration number, address, and contact are required for Layer 1 gate.',
      ok: !!(org?.registration_no && org?.address_text && org?.contact_email),
      href: '/profile',
    },
    {
      id: 'onboarding',
      label: 'Onboarding approved by platform',
      detail: 'Your organisation must be approved before applying for certification.',
      ok: org?.onboarding_status === 'approved',
      href: '/dashboard',
    },
    {
      id: 'bank',
      label: 'Bank account linked',
      detail: 'At least one bank account demonstrates separate organisational finances (Layer 1 gate).',
      ok: bankCount > 0,
      href: '/accounting/bank-accounts',
    },
    {
      id: 'team',
      label: 'At least 2 team members',
      detail: 'Segregation of duties (Layer 1 governance gate) requires ≥ 2 people.',
      ok: memberCount >= 2,
      href: '/members',
    },
    {
      id: 'coi',
      label: 'Conflict of interest policy uploaded',
      detail: 'Required CTCF Layer 1 gate — without this, certification is blocked.',
      ok: hasCOI,
      href: '/policy-kit',
    },
    {
      id: 'close',
      label: 'At least one financial period closed',
      detail: 'Monthly close produces the financial snapshot reviewers evaluate for Layer 2.',
      ok: closesCount > 0,
      href: '/accounting/close',
    },
    {
      id: 'snapshot',
      label: 'Financial snapshot submitted',
      detail: 'Layer 2 — Financial Transparency requires a submitted financial snapshot.',
      ok: hasSnapshot,
      href: '/accounting/close',
    },
    {
      id: 'project',
      label: 'At least one project created',
      detail: 'Layer 3 — Project Transparency requires at least one project.',
      ok: projectCount > 0,
      href: '/projects',
    },
    {
      id: 'report',
      label: 'At least one report submitted',
      detail: 'Layer 3 — completion reports demonstrate accountability.',
      ok: reportCount > 0,
      href: '/reports',
    },
  ];

  const passedCount = checks.filter((c) => c.ok).length;
  const allPassed   = passedCount === checks.length;
  const readinessPct = Math.round((passedCount / checks.length) * 100);

  // Grade label for current score
  const scoreGrade = getAmanahTier(score).shortLabel;

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-gray-900">
          CTCF Certification
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Charity Transparency Certification Framework · {org?.name}
        </p>
      </div>

      {/* Current certification status */}
      {isCertified && (
        <div className="rounded-xl border-2 border-emerald-300 bg-emerald-50 p-6 text-center space-y-2">
          <p className="text-4xl">🏆</p>
          <p className="text-lg font-bold text-emerald-800">Certified Organisation</p>
          <p className="text-[12px] text-emerald-700">
            Valid from {latestCert.valid_from}
            {latestCert.valid_to ? ` to ${latestCert.valid_to}` : ''}
          </p>
          <p className="text-[11px] text-emerald-600">
            Amanah Trust Score: <strong>{score.toFixed(1)} — {scoreGrade}</strong>
          </p>
        </div>
      )}

      {/* Current application */}
      {currentApp && !isCertified && (
        <div className={`rounded-lg border p-4 flex items-start gap-3 ${
          STATUS_CONFIG[currentApp.status]?.bg ?? 'bg-gray-100'
        } border-current`}>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className={`text-[12px] font-semibold ${STATUS_CONFIG[currentApp.status]?.color}`}>
                Application {STATUS_CONFIG[currentApp.status]?.label}
              </p>
            </div>
            {currentApp.submitted_at && (
              <p className="text-[10px] text-gray-500 mt-0.5">
                Submitted {new Date(currentApp.submitted_at).toLocaleDateString('en-MY')}
              </p>
            )}
            {currentApp.reviewer_comment && (
              <p className="text-[11px] text-gray-600 mt-1 bg-white/60 rounded-md p-2">
                Reviewer: {currentApp.reviewer_comment}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Readiness panel */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-[13px] font-semibold text-gray-800">Certification readiness</p>
          <p className={`text-[13px] font-bold ${allPassed ? 'text-emerald-700' : 'text-gray-600'}`}>
            {passedCount}/{checks.length} — {readinessPct}%
          </p>
        </div>

        {/* Progress bar */}
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-emerald-500 rounded-full transition-all duration-500"
            style={{ width: `${readinessPct}%` }} />
        </div>

        {/* Check items */}
        <div className="space-y-2.5">
          {checks.map((check) => (
            <div key={check.id}
              className={`flex items-start gap-3 p-3 rounded-lg ${
                check.ok ? 'bg-emerald-50/50' : 'bg-red-50/40'
              }`}>
              <span className={`flex-shrink-0 mt-0.5 ${check.ok ? 'text-emerald-500' : 'text-red-400'}`}>
                {check.ok ? '✓' : '✗'}
              </span>
              <div className="flex-1 min-w-0">
                <p className={`text-[12px] font-medium ${check.ok ? 'text-emerald-800' : 'text-gray-800'}`}>
                  {check.label}
                </p>
                <p className="text-[10px] text-gray-500 mt-0.5">{check.detail}</p>
              </div>
              {!check.ok && (
                <Link href={check.href}
                  className="text-[10px] font-medium text-blue-600 hover:underline flex-shrink-0 mt-0.5">
                  Fix →
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Trust score panel */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 flex items-center justify-between">
        <div>
          <p className="text-[11px] text-gray-500">Current Amanah Trust Score</p>
          <p className="text-2xl font-bold text-gray-900 mt-0.5">
            {score > 0 ? `${score.toFixed(1)}` : '—'}
            {score > 0 && (
              <span className={`text-[12px] font-medium ml-2 ${
                score >= 70 ? 'text-amber-600' : score >= 55 ? 'text-gray-500' : 'text-blue-600'
              }`}>
                {scoreGrade}
              </span>
            )}
          </p>
        </div>
        <div className="text-right text-[11px] text-gray-500 space-y-1">
          <p>≥55 → Silver certification</p>
          <p>≥70 → Gold certification</p>
          <p>≥85 → Platinum certification</p>
        </div>
      </div>

      {/* Apply form */}
      {isManager && !currentApp && (
        <CertificationApplyForm
          orgId={orgId}
          userId={platformUser.id}
          allPassed={allPassed}
          failedChecks={checks.filter((c) => !c.ok).map((c) => c.label)}
        />
      )}

      {/* Already applied */}
      {currentApp && currentApp.status === 'submitted' && (
        <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 text-center">
          <p className="text-[12px] font-semibold text-blue-800">
            Application submitted — awaiting reviewer assignment
          </p>
          <p className="text-[11px] text-blue-700 mt-1">
            A platform reviewer will be assigned shortly. You will be notified when evaluation begins.
            The reviewer will assess your CTCF layers using your submitted documents and accounting data.
          </p>
        </div>
      )}

      {currentApp && currentApp.status === 'under_review' && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 text-center">
          <p className="text-[12px] font-semibold text-amber-800">
            Under review — evaluation in progress
          </p>
          <p className="text-[11px] text-amber-700 mt-1">
            Your CTCF evaluation is being conducted by an assigned reviewer.
            Ensure your documents and accounting data are complete and up to date.
          </p>
        </div>
      )}

      {/* Certification history */}
      {history.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-700">Certification history</h2>
          <div className="rounded-lg border border-gray-200 bg-white divide-y divide-gray-100">
            {history.map((h) => {
              const gc = GRADE_CONFIG[h.new_status] ?? GRADE_CONFIG.not_certified;
              return (
                <div key={h.id} className="flex items-center justify-between px-4 py-3.5">
                  <div className="flex items-center gap-3">
                    <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                      h.new_status === 'certified' ? 'bg-emerald-500' :
                      h.new_status === 'suspended' ? 'bg-amber-500' : 'bg-red-400'
                    }`} />
                    <div>
                      <p className={`text-[12px] font-semibold ${gc.color}`}>
                        {gc.label}
                      </p>
                      {h.decision_reason && (
                        <p className="text-[10px] text-gray-400 mt-0.5">{h.decision_reason}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] text-gray-600">
                      {h.valid_from && `Valid from ${h.valid_from}`}
                    </p>
                    <p className="text-[10px] text-gray-400">
                      {new Date(h.decided_at).toLocaleDateString('en-MY')}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* What reviewers look at */}
      <div className="rounded-lg bg-gray-50 border border-gray-200 p-5 space-y-3">
        <p className="text-[12px] font-semibold text-gray-700">What reviewers evaluate (CTCF v2)</p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {[
            { layer: 'Layer 1 — Gate', desc: 'Registration, governing docs, board, CoI policy, bank account', required: true },
            { layer: 'Layer 2 — Financial', desc: 'Annual statements, audit evidence, programme/admin breakdown (20 pts)', required: false },
            { layer: 'Layer 3 — Projects', desc: 'Budget vs actuals, beneficiary metrics, completion timeliness (25 pts)', required: false },
            { layer: 'Layer 4 — Impact', desc: 'KPIs, sustainability plan, continuity tracking (20 pts)', required: false },
            { layer: 'Layer 5 — Shariah', desc: 'Shariah advisor, compliance policy, Zakat/Waqf governance (15 pts)', required: false },
          ].map((item) => (
            <div key={item.layer} className="rounded-md bg-white border border-gray-200 p-3">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-[11px] font-semibold text-gray-700">{item.layer}</p>
                {item.required && (
                  <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-red-100 text-red-700">
                    Gate
                  </span>
                )}
              </div>
              <p className="text-[10px] text-gray-500 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-gray-400">
          Certification threshold: ≥55/100 (Silver). Layer 2 minimum: ≥10/20.
        </p>
      </div>
    </div>
  );
}

