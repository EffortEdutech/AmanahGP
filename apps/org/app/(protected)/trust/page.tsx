// apps/org/app/(protected)/trust/page.tsx
// amanahOS — Trust Score Dashboard (Sprint 19 — Trust Event Engine)
// Live Amanah Index v2, 5 pillar breakdown, event timeline, gamification.

import { redirect }            from 'next/navigation';
import { createClient }        from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
function relationOne<T>(value: unknown): T | null {
  if (Array.isArray(value)) {
    return (value[0] as T | undefined) ?? null;
  }
  return (value as T | null) ?? null;
}


export const metadata = { title: 'Trust score — amanahOS' };

// â”€â”€ Pillar config â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const PILLARS = [
  {
    key:   'financial_integrity',
    label: 'Financial Integrity',
    emoji: '🟢',
    max:   300,
    color: 'emerald',
    tip:   'Close months on time, reconcile bank accounts, maintain fund segregation.',
  },
  {
    key:   'governance',
    label: 'Governance & Controls',
    emoji: '🟡',
    max:   200,
    color: 'amber',
    tip:   'Use dual approvals for payments, upload policies, document board meetings.',
  },
  {
    key:   'compliance',
    label: 'Compliance & Regulation',
    emoji: '🔵',
    max:   200,
    color: 'blue',
    tip:   'Submit annual audit, file regulatory returns, complete Shariah review.',
  },
  {
    key:   'transparency',
    label: 'Transparency & Disclosure',
    emoji: '🟣',
    max:   150,
    color: 'purple',
    tip:   'Publish financial statements, release annual reports, maintain public profile.',
  },
  {
    key:   'impact',
    label: 'Community & Impact',
    emoji: '🟠',
    max:   150,
    color: 'orange',
    tip:   'Complete programmes, verify beneficiaries, upload impact reports.',
  },
] as const;

// â”€â”€ What-next recommendations (gamification) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const NEXT_ACTIONS = [
  { condition: (fi: number)  => fi <  60,
    action: 'Close this month\'s accounts',        points: '+8 pts',  pillar: 'financial_integrity', href: '/accounting/close' },
  { condition: (fi: number)  => fi <  80,
    action: 'Reconcile your bank accounts',        points: '+6 pts',  pillar: 'financial_integrity', href: '/accounting/bank-accounts' },
  { condition: (gov: number) => gov < 40,
    action: 'Set up payment approval workflow',    points: '+4 pts',  pillar: 'governance',          href: '/accounting/payment-requests' },
  { condition: (gov: number) => gov < 60,
    action: 'Upload a financial control policy',   points: '+15 pts', pillar: 'governance',          href: '/policy-kit' },
  { condition: (trn: number) => trn < 30,
    action: 'Publish your financial statements',   points: '+12 pts', pillar: 'transparency',        href: '/accounting/reports' },
  { condition: (com: number) => com < 40,
    action: 'Submit annual compliance report',     points: '+25 pts', pillar: 'compliance',          href: '/compliance' },
  { condition: (imp: number) => imp < 30,
    action: 'Upload a programme impact report',    points: '+10 pts', pillar: 'impact',              href: '/reports' },
];

// â”€â”€ Event display config â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const EVENT_DISPLAY: Record<string, { label: string; positive: boolean }> = {
  fi_period_closed:            { label: 'Financial period closed on time',        positive: true },
  fi_period_closed_late:       { label: 'Financial period closed late',           positive: false },
  fi_bank_reconciled:          { label: 'Bank account reconciled',                positive: true },
  fi_bank_discrepancy:         { label: 'Bank reconciliation discrepancy',        positive: false },
  fi_bank_unreconciled_30d:    { label: 'Bank account unreconciled >30 days',     positive: false },
  fi_fund_segregated:          { label: 'Islamic fund segregation verified',       positive: true },
  fi_fund_restriction_violated:{ label: 'Restricted fund violation detected',     positive: false },
  fi_bank_account_linked:      { label: 'Bank account configured',                positive: true },
  fi_expense_with_receipt:     { label: 'Expense recorded with documentation',    positive: true },
  fi_expense_no_receipt:       { label: 'Expense recorded without receipt',       positive: false },
  gov_payment_dual_approved:   { label: 'Payment approved — dual approval',       positive: true },
  gov_payment_self_approved:   { label: 'Payment self-approved — governance risk',positive: false },
  gov_approval_rejected:       { label: 'Payment approval rejected',              positive: false },
  gov_policy_uploaded:         { label: 'Governance policy uploaded',             positive: true },
  gov_board_meeting_recorded:  { label: 'Board meeting minutes recorded',         positive: true },
  gov_conflict_declared:       { label: 'Conflict of interest declared',          positive: true },
  gov_role_segregation_verified:{ label: 'Role segregation verified',             positive: true },
  com_audit_submitted:         { label: 'Annual audit submitted',                 positive: true },
  com_audit_unqualified:       { label: 'Unqualified audit opinion received',     positive: true },
  com_audit_qualified:         { label: 'Qualified audit opinion received',       positive: false },
  com_audit_overdue:           { label: 'Annual audit overdue',                   positive: false },
  com_regulatory_filed:        { label: 'Regulatory annual return filed',         positive: true },
  com_regulatory_overdue:      { label: 'Regulatory filing overdue',              positive: false },
  com_shariah_review_completed:{ label: 'Shariah compliance review completed',    positive: true },
  com_shariah_noncompliance:   { label: 'Shariah non-compliance detected',        positive: false },
  trn_financial_published:     { label: 'Financial statements published',         positive: true },
  trn_annual_report_published: { label: 'Annual report published',               positive: true },
  trn_donor_report_published:  { label: 'Donor transparency report published',   positive: true },
  trn_disclosure_overdue:      { label: 'Public disclosure overdue',             positive: false },
  imp_program_completed:       { label: 'Programme completed',                   positive: true },
  imp_program_delayed:         { label: 'Programme delayed',                     positive: false },
  imp_beneficiary_verified:    { label: 'Beneficiary verified',                  positive: true },
  imp_impact_report_verified:  { label: 'Impact report verified',                positive: true },
  score_decay_applied:         { label: 'Score decay — inactive pillar',         positive: false },
  report_verified:             { label: 'Report verified by reviewer',           positive: true },
  financial_verified:          { label: 'Financial snapshot verified',           positive: true },
  certification_updated:       { label: 'Certification status updated',          positive: true },
  donation_confirmed:          { label: 'Donation confirmed',                    positive: true },
  complaint_logged:            { label: 'Complaint received',                    positive: false },
  complaint_resolved:          { label: 'Complaint resolved',                    positive: true },
};

// â”€â”€ Grade config â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function getGrade(score: number) {
  if (score >= 85) return { label: 'Platinum',   color: 'text-slate-800',   bg: 'bg-slate-100  border-slate-300',  ring: 'ring-slate-400'  };
  if (score >= 70) return { label: 'Gold',        color: 'text-amber-700',  bg: 'bg-amber-50   border-amber-300',  ring: 'ring-amber-400'  };
  if (score >= 55) return { label: 'Silver',      color: 'text-gray-600',   bg: 'bg-gray-100   border-gray-300',   ring: 'ring-gray-400'   };
  if (score >= 40) return { label: 'Bronze',      color: 'text-orange-700', bg: 'bg-orange-50  border-orange-300', ring: 'ring-orange-400' };
  return                  { label: 'Foundation',  color: 'text-blue-700',   bg: 'bg-blue-50    border-blue-200',   ring: 'ring-blue-300'   };
}

export default async function TrustPage() {
  const supabase = await createClient();
  const service  = createServiceClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: platformUser } = await supabase
    .from('users').select('id')
    .eq('auth_provider_user_id', user.id).single();
  if (!platformUser) redirect('/no-access?reason=no_user_record');

  const { data: membership } = await service
    .from('org_members')
    .select('organization_id, org_role, organizations(id, name, fund_types)')
    .eq('user_id', platformUser.id).eq('status', 'active')
    .order('created_at', { ascending: true }).limit(1).single();
  if (!membership) redirect('/no-access?reason=no_org_membership');

  const orgId = membership.organization_id;
  const org   = relationOne<{ id: string; name: string; fund_types: string[] }>(membership.organizations);

  // â”€â”€ Load latest v2 score â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const { data: latestScore } = await service
    .from('amanah_index_history')
    .select('score_value, score_version, computed_at, breakdown, public_summary')
    .eq('organization_id', orgId)
    .eq('score_version', 'amanah_v2_events')
    .order('computed_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  // Fallback to v1 if no v2 exists
  const { data: v1Score } = !latestScore ? await service
    .from('amanah_index_history')
    .select('score_value, score_version, computed_at, breakdown, public_summary')
    .eq('organization_id', orgId)
    .order('computed_at', { ascending: false })
    .limit(1)
    .maybeSingle() : { data: null };

  const score     = latestScore ?? v1Score;
  const scoreVal  = Number(score?.score_value ?? 0);
  const breakdown = (score?.breakdown ?? {}) as Record<string, { raw?: number; capped?: number; pct?: number; max?: number; risk_cap_applied?: boolean }>;
  const grade     = getGrade(scoreVal);
  const isV2      = score?.score_version === 'amanah_v2_events';

  // â”€â”€ Load score history (last 10 entries) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const { data: history } = await service
    .from('amanah_index_history')
    .select('id, score_value, computed_at, score_version, public_summary')
    .eq('organization_id', orgId)
    .order('computed_at', { ascending: false })
    .limit(10);

  // â”€â”€ Load recent trust events (last 20) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const { data: events } = await service
    .from('trust_events')
    .select('id, event_type, pillar, score_delta, occurred_at, source, payload')
    .eq('organization_id', orgId)
    .order('occurred_at', { ascending: false })
    .limit(20);

  // â”€â”€ Compute pillar pcts for what-next â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const getPillarPct = (key: string): number => {
    const p = breakdown[key];
    return p?.pct ?? 0;
  };

  const fiPct  = getPillarPct('financial_integrity');
  const govPct = getPillarPct('governance');
  const comPct = getPillarPct('compliance');
  const trnPct = getPillarPct('transparency');
  const impPct = getPillarPct('impact');

  const recommendations = NEXT_ACTIONS.filter((a) => {
    if (a.pillar === 'financial_integrity') return a.condition(fiPct);
    if (a.pillar === 'governance')          return a.condition(govPct);
    if (a.pillar === 'compliance')          return a.condition(comPct);
    if (a.pillar === 'transparency')        return a.condition(trnPct);
    if (a.pillar === 'impact')              return a.condition(impPct);
    return false;
  }).slice(0, 3);

  // â”€â”€ Risk flags â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const riskFlags = (breakdown.risk_flags ?? {}) as {
    no_close_3mo?: boolean; segregation_vio?: boolean; audit_overdue?: boolean;
  };

  const hasRisk = riskFlags.no_close_3mo || riskFlags.segregation_vio || riskFlags.audit_overdue;

  const fmt = (n: number) => Math.round(n).toLocaleString();

  const PILLAR_COLOR: Record<string, string> = {
    emerald: 'bg-emerald-500',
    amber:   'bg-amber-500',
    blue:    'bg-blue-500',
    purple:  'bg-purple-500',
    orange:  'bg-orange-500',
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Amanah Trust Score</h1>
        <p className="text-sm text-gray-500 mt-0.5">{org?.name}</p>
      </div>

      {/* Score hero */}
      <div className={`rounded-xl border-2 p-6 flex items-center justify-between ${grade.bg}`}>
        <div>
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[11px] font-bold mb-3 ${grade.bg} ${grade.ring} ring-1`}>
            <span className={grade.color}>{grade.label} Amanah</span>
          </div>
          <p className="text-6xl font-black text-gray-900">{scoreVal.toFixed(1)}</p>
          <p className="text-[11px] text-gray-500 mt-1">out of 100</p>
          {score?.public_summary && (
            <p className="text-[12px] text-gray-600 mt-2 max-w-xs">{score.public_summary}</p>
          )}
          {score?.computed_at && (
            <p className="text-[10px] text-gray-400 mt-2">
              Updated {new Date(score.computed_at).toLocaleDateString('en-MY', {
                day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
              })}
            </p>
          )}
        </div>

        {/* Score arc visual */}
        <div className="flex-shrink-0">
          <div className="relative w-28 h-28">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              <circle cx="50" cy="50" r="42" fill="none" stroke="#e5e7eb" strokeWidth="10" />
              <circle cx="50" cy="50" r="42" fill="none"
                stroke={scoreVal >= 85 ? '#64748b' : scoreVal >= 70 ? '#f59e0b' : scoreVal >= 55 ? '#9ca3af' : scoreVal >= 40 ? '#f97316' : '#3b82f6'}
                strokeWidth="10"
                strokeDasharray={`${(scoreVal / 100) * 263.9} 263.9`}
                strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-2xl font-black text-gray-800">{Math.round(scoreVal)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Risk flags */}
      {hasRisk && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 space-y-2">
          <p className="text-[12px] font-semibold text-red-800">⚠ Active risk flags — score caps in effect</p>
          {riskFlags.no_close_3mo && (
            <p className="text-[11px] text-red-700">
              • No monthly close in 3 months — Financial Integrity capped at 60%.
              <a href="/accounting/close" className="underline ml-1">Close now →</a>
            </p>
          )}
          {riskFlags.segregation_vio && (
            <p className="text-[11px] text-red-700">
              • Payment self-approval detected — Governance capped at 40%.
              Review approval workflows.
            </p>
          )}
          {riskFlags.audit_overdue && (
            <p className="text-[11px] text-red-700">
              • Annual audit overdue — Compliance capped at 50%.
              <a href="/compliance" className="underline ml-1">Review compliance →</a>
            </p>
          )}
        </div>
      )}

      {/* No v2 score yet */}
      {!isV2 && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <p className="text-[11px] font-semibold text-blue-800">Trust Event Engine is active</p>
          <p className="text-[11px] text-blue-700 mt-1">
            Your score will update automatically as you perform accounting actions —
            close a month, reconcile a bank account, or approve a payment.
            Each action emits a trust event and recalculates your score in real time.
          </p>
        </div>
      )}

      {/* 5 Pillar breakdown */}
      {isV2 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-700">Trust pillar breakdown</h2>
          <div className="rounded-lg border border-gray-200 bg-white divide-y divide-gray-100">
            {PILLARS.map((pillar) => {
              const data       = breakdown[pillar.key];
              const rawPts     = data?.capped  ?? 0;
              const pct        = data?.pct     ?? 0;
              const riskCapped = data?.risk_cap_applied ?? false;
              return (
                <div key={pillar.key} className="px-4 py-3.5">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span>{pillar.emoji}</span>
                      <p className="text-[12px] font-semibold text-gray-800">{pillar.label}</p>
                      {riskCapped && (
                        <span className="text-[8px] font-medium px-1.5 py-0.5 rounded-full bg-red-100 text-red-700">
                          CAPPED
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-gray-700">
                        {fmt(rawPts)} / {pillar.max} pts
                      </span>
                      <span className="text-[10px] text-gray-400">
                        ({pct.toFixed(0)}%)
                      </span>
                    </div>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${PILLAR_COLOR[pillar.color]}`}
                      style={{ width: `${Math.min(pct, 100)}%` }} />
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1.5">{pillar.tip}</p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* What to do next — gamification */}
      {recommendations.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-700">Improve your score</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {recommendations.map((rec) => {
              const pillar = PILLARS.find((p) => p.key === rec.pillar);
              return (
                <a key={rec.action} href={rec.href}
                  className="rounded-lg border border-gray-200 bg-white p-4 hover:border-emerald-300
                             hover:shadow-sm transition-all space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50
                                     px-2 py-0.5 rounded-full border border-emerald-200">
                      {rec.points}
                    </span>
                    <span className="text-sm">{pillar?.emoji}</span>
                  </div>
                  <p className="text-[12px] font-semibold text-gray-800 leading-snug">{rec.action}</p>
                  <p className="text-[10px] text-gray-400 capitalize">{pillar?.label}</p>
                </a>
              );
            })}
          </div>
        </section>
      )}

      {/* Trust event timeline */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-700">Trust event timeline</h2>
        {events && events.length > 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white divide-y divide-gray-100">
            {events.map((event) => {
              const display  = EVENT_DISPLAY[event.event_type] ?? { label: event.event_type, positive: true };
              const delta    = Number(event.score_delta ?? 0);
              const pillar   = PILLARS.find((p) => p.key === event.pillar);
              return (
                <div key={event.id} className="flex items-center gap-3 px-4 py-3">
                  {/* Indicator dot */}
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    display.positive ? 'bg-emerald-500' : 'bg-red-500'
                  }`} />

                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-medium text-gray-800">{display.label}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      {pillar && (
                        <span className="text-[9px] text-gray-400">
                          {pillar.emoji} {pillar.label}
                        </span>
                      )}
                      <span className="text-[9px] text-gray-300">·</span>
                      <span className="text-[9px] text-gray-400">
                        {new Date(event.occurred_at).toLocaleDateString('en-MY', {
                          day: 'numeric', month: 'short', year: 'numeric',
                          hour: '2-digit', minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Score delta badge */}
                  {delta !== 0 && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                      delta > 0
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                      {delta > 0 ? '+' : ''}{delta} pts
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-center">
            <p className="text-sm text-gray-500">No trust events yet.</p>
            <p className="text-[11px] text-gray-400 mt-1">
              Close a financial month or reconcile a bank account to generate your first trust event.
            </p>
            <a href="/accounting/close" className="text-[11px] text-emerald-600 hover:underline mt-1 block">
              Close a financial period →
            </a>
          </div>
        )}
      </section>

      {/* Score history */}
      {history && history.length > 1 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-700">Score history</h2>
          <div className="rounded-lg border border-gray-200 bg-white divide-y divide-gray-100">
            {history.map((h, i) => (
              <div key={h.id} className="flex items-center justify-between px-4 py-2.5">
                <div>
                  <p className="text-[11px] text-gray-500">
                    {new Date(h.computed_at).toLocaleDateString('en-MY', {
                      day: 'numeric', month: 'short', year: 'numeric',
                      hour: '2-digit', minute: '2-digit'
                    })}
                  </p>
                  {h.public_summary && (
                    <p className="text-[10px] text-gray-400">{h.public_summary}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {i > 0 && history[i - 1] && (
                    <span className={`text-[9px] font-medium ${
                      Number(h.score_value) > Number(history[i - 1].score_value)
                        ? 'text-emerald-600' : 'text-red-500'
                    }`}>
                      {Number(h.score_value) > Number(history[i - 1].score_value) ? 'â–²' : 'â–¼'}
                      {Math.abs(Number(h.score_value) - Number(history[i - 1].score_value)).toFixed(1)}
                    </span>
                  )}
                  <span className={`text-[13px] font-bold ${
                    Number(h.score_value) >= 70 ? 'text-amber-600' :
                    Number(h.score_value) >= 55 ? 'text-gray-600' : 'text-blue-600'
                  }`}>
                    {Number(h.score_value).toFixed(1)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Engine explainer */}
      <div className="rounded-lg bg-gray-50 border border-gray-200 p-4">
        <p className="text-[11px] font-semibold text-gray-700">How your score is calculated</p>
        <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
          The Amanah Trust Engine scores your organisation across 5 pillars — Financial Integrity (300 pts),
          Governance (200 pts), Compliance (200 pts), Transparency (150 pts), and Community Impact (150 pts)
          — for a total of 1,000 points normalised to 100. Every accounting action you perform automatically
          emits a trust event and updates your score in real time.
        </p>
        <p className="text-[11px] text-gray-500 mt-1">
          Scores decay by 2–4 points per inactive pillar per month to encourage continuous discipline.
          Risk flags (no month close, self-approval) cap pillar scores until resolved.
        </p>
      </div>
    </div>
  );
}

