// apps/user/app/charities/[orgId]/page.tsx
// AmanahHub — Public Organisation Profile (Sprint 24 — Trust Badge update)
//
// What changed from Phase 1:
//   • Trust badge (Gold/Silver/Platinum) replaces simple score ring
//   • Trust snapshot panel (5 governance signals)
//   • Pillar breakdown (5 bars with public-friendly labels)
//   • Trust timeline (live governance events)
//   • Mini trust panel on donation CTA section
//
// Data source: amanah_index_history (v2 preferred)
// Public API: /api/trust/[orgId] (used for revalidation; server components read DB directly)

import { notFound }  from 'next/navigation';
import Link          from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { TrustBadge, TrustBadgeInline } from '@/components/ui/trust-badge';
import { TrustSnapshotPanel, TrustPillarPanel, MiniTrustPanel } from '@/components/ui/trust-panel';
import { TrustTimeline } from '@/components/ui/trust-timeline';
import { getTrustGrade } from '@/lib/trust-grade';

export const revalidate = 300; // ISR: revalidate every 5 minutes

const ORG_TYPE_LABELS: Record<string, string> = {
  ngo:              'NGO / Welfare',
  mosque_surau:     'Mosque / Surau',
  waqf_institution: 'Waqf Institution',
  zakat_body:       'Zakat Body',
  foundation:       'Foundation',
  cooperative:      'Cooperative',
  other:            'Other',
};

const FUND_BADGE: Record<string, string> = {
  zakat:   'bg-purple-100 text-purple-700',
  waqf:    'bg-teal-100 text-teal-700',
  sadaqah: 'bg-emerald-100 text-emerald-700',
  general: 'bg-gray-100 text-gray-600',
};

const PUBLIC_EVENT_LABELS: Record<string, string> = {
  fi_period_closed:          'Financial accounts closed on time',
  fi_bank_reconciled:        'Bank accounts reconciled',
  fi_bank_account_linked:    'Bank account linked',
  gov_policy_uploaded:       'Governance policy submitted',
  gov_payment_dual_approved: 'Dual approval workflow active',
  certification_updated:     'Certification application updated',
  trn_financial_published:   'Financial report published',
  trn_report_submitted:      'Transparency report submitted',
  imp_report_verified:       'Impact report verified',
};

const PUBLIC_EVENT_PILLARS: Record<string, string> = {
  fi_period_closed:          'Financial Integrity',
  fi_bank_reconciled:        'Financial Integrity',
  fi_bank_account_linked:    'Financial Integrity',
  gov_policy_uploaded:       'Governance',
  gov_payment_dual_approved: 'Governance',
  certification_updated:     'Compliance',
  trn_financial_published:   'Transparency',
  trn_report_submitted:      'Transparency',
  imp_report_verified:       'Impact',
};

export async function generateMetadata({ params }: { params: Promise<{ orgId: string }> }) {
  const { orgId } = await params;
  const supabase  = await createClient();
  const { data }  = await supabase
    .from('organizations').select('name, summary').eq('id', orgId).single();
  if (!data) return { title: 'Organisation — AmanahHub' };
  return {
    title:       `${data.name} — AmanahHub`,
    description: data.summary ?? `${data.name} on AmanahHub — trusted, verified Islamic charity.`,
  };
}

export default async function OrgPublicProfilePage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;
  const supabase  = await createClient();

  // Only listed orgs
  const { data: org } = await supabase
    .from('organizations')
    .select('id, name, legal_name, registration_no, website_url, contact_email, state, org_type, oversight_authority, fund_types, summary, onboarding_status, listing_status')
    .eq('id', orgId)
    .eq('listing_status', 'listed')
    .single();

  if (!org) notFound();

  const fundTypes = (org.fund_types ?? []) as string[];

  // ── Load trust data in parallel ─────────────────────────────
  const [
    scoreResult,
    certResult,
    bankResult,
    closesResult,
    policyResult,
    reportResult,
    eventResult,
    projectResult,
    docResult,
  ] = await Promise.all([
    supabase.from('amanah_index_history')
      .select('score_value, score_version, breakdown, public_summary, computed_at')
      .eq('organization_id', orgId)
      .order('computed_at', { ascending: false })
      .limit(1).maybeSingle(),

    supabase.from('certification_history')
      .select('new_status, valid_from, valid_to, decided_at')
      .eq('organization_id', orgId)
      .order('decided_at', { ascending: false })
      .limit(1).maybeSingle(),

    supabase.from('bank_accounts')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', orgId).eq('is_active', true),

    supabase.from('fund_period_closes')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', orgId),

    supabase.from('trust_events')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', orgId).eq('event_type', 'gov_policy_uploaded'),

    supabase.from('project_reports')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', orgId).eq('submission_status', 'submitted'),

    supabase.from('trust_events')
      .select('id, event_type, pillar, score_delta, occurred_at')
      .eq('organization_id', orgId)
      .in('event_type', Object.keys(PUBLIC_EVENT_LABELS))
      .order('occurred_at', { ascending: false })
      .limit(10),

    supabase.from('projects')
      .select('id, title, objective, status, budget_amount, is_public')
      .eq('organization_id', orgId)
      .eq('is_public', true)
      .eq('status', 'active')
      .limit(6),

    supabase.from('org_documents')
      .select('id, document_type, label, storage_path')
      .eq('organization_id', orgId)
      .eq('is_approved_public', true)
      .eq('visibility', 'public')
      .limit(8),
  ]);

  const score          = Number(scoreResult.data?.score_value ?? 0);
  const breakdown      = (scoreResult.data?.breakdown ?? {}) as Record<string, {
    raw?: number; capped?: number; pct?: number; max?: number;
  }>;
  const cert           = certResult.data;
  const isCertified    = cert?.new_status === 'certified';
  const trustGrade     = getTrustGrade(score);

  // Pillar breakdown for public display
  const PILLARS = [
    { key: 'financial_integrity', publicLabel: 'Financial Care' },
    { key: 'governance',          publicLabel: 'Leadership & Controls' },
    { key: 'compliance',          publicLabel: 'Legal & Audit' },
    { key: 'transparency',        publicLabel: 'Openness' },
    { key: 'impact',              publicLabel: 'Community Impact' },
  ];

  const pillarBreakdown = PILLARS.map((p) => ({
    key:         p.key,
    publicLabel: p.publicLabel,
    pct:         Math.round((breakdown[p.key]?.pct ?? 0) * 100) / 100,
  }));

  // Snapshot signals
  const snapshotSignals = [
    { label: 'Separate bank account',       detail: 'Funds kept separate from personal accounts',         ok: (bankResult.count ?? 0) > 0 },
    { label: 'Monthly accounts maintained', detail: 'Financial records closed and reviewed each month',    ok: (closesResult.count ?? 0) > 0 },
    { label: 'Governance policies on file', detail: 'Written policies governing financial controls',       ok: (policyResult.count ?? 0) > 0 },
    { label: 'Progress reports submitted',  detail: 'Regular reporting on activities and beneficiary impact', ok: (reportResult.count ?? 0) > 0 },
    { label: 'Certified by Amanah',         detail: 'CTCF certification evaluation completed by reviewer', ok: isCertified },
  ];

  // Public trust events
  const recentEvents = (eventResult.data ?? []).map((e) => ({
    id:         e.id,
    label:      PUBLIC_EVENT_LABELS[e.event_type] ?? e.event_type,
    pillar:     PUBLIC_EVENT_PILLARS[e.event_type] ?? e.pillar,
    positive:   (e.score_delta ?? 0) >= 0,
    occurredAt: e.occurred_at,
  }));

  const projects = projectResult.data ?? [];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">

        {/* ── SECTION A — Trust Header ── */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
          <div className="flex items-start gap-5 flex-wrap">
            {/* Org avatar placeholder */}
            <div className="w-16 h-16 rounded-xl bg-emerald-100 flex items-center justify-center
                            text-2xl font-bold text-emerald-600 flex-shrink-0">
              {org.name[0].toUpperCase()}
            </div>

            {/* Org info */}
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-gray-900 leading-tight">{org.name}</h1>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                {org.org_type && (
                  <span className="text-[11px] text-gray-500 capitalize">
                    {ORG_TYPE_LABELS[org.org_type] ?? org.org_type}
                  </span>
                )}
                {org.state && (
                  <>
                    <span className="text-gray-300">·</span>
                    <span className="text-[11px] text-gray-500">{org.state}</span>
                  </>
                )}
                {org.oversight_authority && (
                  <>
                    <span className="text-gray-300">·</span>
                    <span className="text-[11px] text-gray-500">Reg: {org.oversight_authority}</span>
                  </>
                )}
              </div>
              {/* Fund type badges */}
              <div className="flex gap-1.5 mt-2 flex-wrap">
                {fundTypes.map((ft) => (
                  <span key={ft}
                    className={`text-[9px] font-semibold px-2 py-0.5 rounded-full capitalize ${
                      FUND_BADGE[ft] ?? FUND_BADGE.general
                    }`}>
                    {ft}
                  </span>
                ))}
              </div>
            </div>

            {/* Trust badge */}
            <div className="flex-shrink-0">
              <TrustBadge
                score={score}
                grade={trustGrade.grade}
                gradeLabel={trustGrade.label}
                gradeSublabel={trustGrade.gradeSublabel}
                lastUpdated={scoreResult.data?.computed_at}
                certified={isCertified}
                size="md"
              />
            </div>
          </div>

          {/* Mission summary */}
          {org.summary && (
            <p className="text-[14px] text-gray-600 leading-relaxed border-t border-gray-100 pt-4">
              {org.summary}
            </p>
          )}

          {/* Auto-generated trust summary */}
          {scoreResult.data?.public_summary && (
            <div className="rounded-lg bg-emerald-50 border border-emerald-100 px-4 py-3">
              <p className="text-[12px] text-emerald-800 leading-relaxed">
                {scoreResult.data.public_summary}
              </p>
            </div>
          )}

          {/* Donate CTA */}
          <div className="flex gap-3">
            <Link href={`/donate/${orgId}`}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm
                         font-semibold rounded-xl transition-colors">
              Donate →
            </Link>
            {org.website_url && (
              <a href={org.website_url} target="_blank" rel="noopener noreferrer"
                className="px-4 py-2.5 border border-gray-300 text-gray-600 text-sm
                           font-medium rounded-xl hover:bg-gray-50 transition-colors">
                Visit website ↗
              </a>
            )}
          </div>
        </div>

        {/* ── SECTION B + C — Trust Snapshot + Pillars ── */}
        {score > 0 && (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <TrustSnapshotPanel signals={snapshotSignals} orgName={org.name} />
            <TrustPillarPanel pillars={pillarBreakdown} />
          </div>
        )}

        {/* ── SECTION D — Active Projects ── */}
        {projects.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-[14px] font-semibold text-gray-800">Active programmes</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {projects.map((project) => (
                <Link key={project.id}
                  href={`/charities/${orgId}/projects/${project.id}`}
                  className="rounded-xl border border-gray-200 bg-white p-4 hover:border-emerald-300
                             hover:shadow-sm transition-all space-y-2">
                  <p className="text-[13px] font-semibold text-gray-800 line-clamp-2">
                    {project.title}
                  </p>
                  <p className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed">
                    {project.objective}
                  </p>
                  {project.budget_amount && (
                    <p className="text-[11px] text-emerald-700 font-medium">
                      Budget: RM {Number(project.budget_amount).toLocaleString('en-MY')}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ── SECTION E — Trust Timeline ── */}
        <TrustTimeline events={recentEvents} />

        {/* ── SECTION F — Donate CTA with mini trust panel ── */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 space-y-4">
          <h2 className="text-[16px] font-bold text-gray-900">
            Support {org.name}
          </h2>
          <p className="text-[13px] text-gray-600 leading-relaxed">
            Your donation goes directly to the organisation — we never hold funds.
            Non-custodial. Transparent. Verified.
          </p>

          {score > 0 && (
            <MiniTrustPanel
              signals={snapshotSignals}
              gradeLabel={trustGrade.label}
              score={score}
            />
          )}

          <Link href={`/donate/${orgId}`}
            className="block w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white
                       text-center text-sm font-bold rounded-xl transition-colors">
            Donate to {org.name} →
          </Link>

          <p className="text-[10px] text-gray-400 text-center">
            Powered by Amanah Governance Platform · Trusted Giving. Transparent Governance.
          </p>
        </div>

      </div>
    </div>
  );
}
