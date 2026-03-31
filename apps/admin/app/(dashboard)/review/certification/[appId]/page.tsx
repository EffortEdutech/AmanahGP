// apps/admin/app/(dashboard)/review/certification/[appId]/page.tsx
// AmanahHub Console — CTCF evaluation (Sprint 8 UI uplift)
// Matches UAT s-r-ctcf: layer cards with check rows, score total card, cert decision form

import { redirect }          from 'next/navigation';
import Link                  from 'next/link';
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
    .eq('id', appId).single();

  if (!app) redirect('/review/certification');

  const org = Array.isArray(app.organizations) ? app.organizations[0] : app.organizations;
  const fundTypes = (org?.fund_types ?? []) as string[];

  const { data: latestEval } = await supabase
    .from('certification_evaluations')
    .select('id, total_score, score_breakdown, criteria_version, computed_at')
    .eq('certification_application_id', appId)
    .order('computed_at', { ascending: false })
    .limit(1).maybeSingle();

  const { data: financials } = await supabase
    .from('financial_snapshots')
    .select('period_year, verification_status, inputs')
    .eq('organization_id', org?.id ?? '')
    .order('period_year', { ascending: false })
    .limit(1).maybeSingle();

  const { data: verifiedReports } = await supabase
    .from('project_reports')
    .select('id, title, report_body, verified_at')
    .eq('organization_id', org?.id ?? '')
    .eq('verification_status', 'verified')
    .order('verified_at', { ascending: false })
    .limit(5);

  const hasWaqf   = fundTypes.includes('waqf');
  const hasZakat  = fundTypes.includes('zakat');
  const breakdown = latestEval?.score_breakdown as Record<string, any> | null;
  const totalScore = latestEval ? Number(latestEval.total_score) : null;

  // Score tier
  function gradeLabel(s: number) {
    if (s >= 85) return 'Platinum Amanah';
    if (s >= 70) return 'Gold Amanah';
    if (s >= 55) return 'Silver Amanah';
    return 'Below threshold';
  }

  return (
    <div className="max-w-5xl">
      {/* Breadcrumb */}
      <Link href="/review/onboarding"
        className="text-[11px] text-gray-400 hover:text-emerald-700 mb-4 block">
        ← Certification queue
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h1 className="text-[18px] font-semibold text-gray-900">CTCF Evaluation</h1>
          <p className="text-[11px] text-gray-500 mt-0.5">
            {org?.name} · {org?.org_type?.replace('_', ' ')} · {org?.oversight_authority ?? '—'}
            {hasWaqf ? ' · Waqf' : ''}{hasZakat ? ' · Zakat' : ''}
          </p>
        </div>
      </div>

      {/* Existing eval summary */}
      {latestEval && (
        <div className="g-card mb-4 flex items-center justify-between">
          <p className="text-[12px] font-medium text-emerald-800">
            Previous evaluation: {Math.round(Number(latestEval.total_score))} — {gradeLabel(Number(latestEval.total_score))}
          </p>
          <p className="text-[10px] text-emerald-600">
            {latestEval.criteria_version} · {new Date(latestEval.computed_at).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
        </div>
      )}

      {/* 2-col body */}
      <div className="grid grid-cols-2 gap-4">

        {/* Left: layer cards */}
        <div className="space-y-3">

          {/* Layer 1 — Governance gate */}
          <LayerCard
            title="Layer 1 — governance gate"
            subtitle="All items must pass"
            items={[
              { label: 'Legal identity / registration',    ok: !!org?.onboarding_status && org.onboarding_status === 'approved' },
              { label: 'Governing document',               ok: breakdown?.governance?.has_governing_doc ?? null },
              { label: 'Named board / trustees',           ok: breakdown?.governance?.has_board ?? null },
              { label: 'Conflict of interest policy',      ok: breakdown?.governance?.has_coi_policy ?? null },
              { label: 'Bank account separation',          ok: breakdown?.governance?.has_bank_separation ?? null },
              { label: 'Contact + physical address',       ok: !!org },
            ]}
            footer={breakdown?.layer1_passed ? 'Gate passed' : undefined}
          />

          {/* Layer 2 — Financial */}
          <LayerCard
            title="Layer 2 — financial (20 pts)"
            items={[
              { label: 'Annual financial statement',       ok: !!financials?.inputs?.total_income },
              { label: 'Audit evidence',                   ok: !!financials?.inputs?.is_audited },
              { label: 'Program vs admin breakdown',       ok: !!(financials?.inputs?.program_expenses && financials?.inputs?.admin_expenses) },
              { label: 'Zakat segregation',                ok: hasZakat ? (breakdown?.financial?.zakat_segregation ?? null) : null, na: !hasZakat },
            ]}
            score={breakdown?.financial ? `${breakdown.financial.score ?? 0}/20` : undefined}
          />

          {/* Layer 3 — Project */}
          <LayerCard
            title="Layer 3 — project reporting (25 pts)"
            items={[
              { label: 'Budget vs actual tracking',        ok: (verifiedReports?.length ?? 0) > 0 },
              { label: 'Geo-verified reporting',           ok: breakdown?.project?.geo_verified ?? null },
              { label: 'Before/after documentation',       ok: breakdown?.project?.before_after ?? null },
              { label: 'Beneficiary metrics',              ok: (verifiedReports ?? []).some((r) => (r.report_body as any)?.beneficiary_count) },
              { label: 'Completion report timeliness',     ok: breakdown?.project?.timely ?? null },
            ]}
            score={breakdown?.project ? `${breakdown.project.score ?? 0}/25` : undefined}
          />

        </div>

        {/* Right: layer 4 + 5 + score + decision */}
        <div className="space-y-3">

          {/* Layer 4 — Impact */}
          <LayerCard
            title="Layer 4 — impact (20 pts)"
            items={[
              { label: 'KPIs defined',                     ok: breakdown?.impact?.kpis_defined ?? null },
              { label: 'Sustainability plan',              ok: breakdown?.impact?.sustainability ?? null },
              { label: 'Continuity tracking',              ok: breakdown?.impact?.continuity ?? null },
              { label: 'Impact-per-cost metric',           ok: breakdown?.impact?.cost_effectiveness ?? null },
            ]}
            score={breakdown?.impact ? `${breakdown.impact.score ?? 0}/20` : undefined}
          />

          {/* Layer 5 — Shariah */}
          <LayerCard
            title="Layer 5 — Shariah governance (15 pts)"
            items={[
              { label: 'Named Shariah advisor (5 pts)',    ok: breakdown?.shariah?.has_advisor ?? null },
              { label: 'Written Shariah policy (3 pts)',   ok: breakdown?.shariah?.has_policy ?? null },
              { label: 'Zakat eligibility governance (3)', ok: hasZakat ? (breakdown?.shariah?.zakat_gov ?? null) : null, na: !hasZakat },
              { label: 'Waqf asset governance (4 pts)',    ok: hasWaqf ? (breakdown?.shariah?.waqf_gov ?? null) : null, na: !hasWaqf },
            ]}
            score={breakdown?.shariah ? `${breakdown.shariah.score ?? 0}/${hasWaqf || hasZakat ? 15 : 8} → normalized ${breakdown.shariah.normalized ?? 0}/15` : undefined}
          />

          {/* Total score card */}
          {totalScore !== null && (
            <div className="g-card">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-[11px] font-medium text-emerald-800">Total CTCF score</p>
                  <p className="text-[10px] text-emerald-600">
                    {totalScore >= 55 ? '✓ Certifiable' : '✗ Below 55 threshold'}
                    {totalScore >= 55 ? ` · ${gradeLabel(totalScore)}` : ''}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[32px] font-semibold text-emerald-700 leading-none">
                    {Math.round(totalScore)}
                  </span>
                  <p className="text-[11px] font-medium text-emerald-700 mt-0.5">
                    {gradeLabel(totalScore)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Evaluation + decision form */}
          <div className="card p-4">
            <p className="sec-label">Certification decision</p>
            <CtcfEvaluationForm
              appId={appId}
              orgId={org?.id ?? ''}
              reviewerId={me.id}
              currentScore={totalScore ?? undefined}
              action={submitCtcfEvaluation}
            />
          </div>

        </div>
      </div>
    </div>
  );
}

/* ── Layer card component ── */
function LayerCard({
  title, subtitle, items, score, footer,
}: {
  title:    string;
  subtitle?: string;
  items:    { label: string; ok: boolean | null; na?: boolean }[];
  score?:   string;
  footer?:  string;
}) {
  return (
    <div className="card p-4">
      <p className="sec-label">{title}</p>
      {subtitle && <p className="text-[10px] text-gray-400 mb-2">{subtitle}</p>}

      <div>
        {items.map((item, i) => (
          <div key={i} className="layer-row">
            <span className="text-[11px] text-gray-700">{item.label}</span>
            {item.na ? (
              <span className="chk chk-na flex items-center justify-center">N/A</span>
            ) : item.ok === true ? (
              <span className="chk chk-y flex items-center justify-center">✓</span>
            ) : item.ok === false ? (
              <span className="chk chk-n flex items-center justify-center">✗</span>
            ) : (
              <span className="chk chk-na flex items-center justify-center">?</span>
            )}
          </div>
        ))}
      </div>

      {(score || footer) && (
        <div className="mt-2 flex items-center gap-2">
          {footer && (
            <span className="badge badge-green">{footer}</span>
          )}
          {score && (
            <span className="text-[10px] text-gray-500">{score}</span>
          )}
        </div>
      )}
    </div>
  );
}
