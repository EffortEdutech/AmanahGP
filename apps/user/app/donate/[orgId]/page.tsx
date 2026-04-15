// apps/user/app/donate/[orgId]/page.tsx
// AmanahHub — Donation Page (Sprint 24 — mini trust panel added)
//
// The trust panel is shown prominently before the donate form.
// Answers the 3 donor fears before they reach for their wallet:
//   "Is this org legit?"       → Certified by Amanah
//   "Will money be used right?" → Financial controls signal
//   "Are they transparent?"     → Monthly reporting signal

import { notFound }     from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { DonateForm }   from '@/components/donation/donate-form';
import { MiniTrustPanel } from '@/components/ui/trust-panel';
import { TrustBadgeInline } from '@/components/ui/trust-badge';
import { getTrustGrade } from '@/lib/trust-grade';

export const metadata = { title: 'Donate — AmanahHub' };

const FUND_BADGE: Record<string, string> = {
  zakat:   'bg-purple-100 text-purple-700',
  waqf:    'bg-teal-100 text-teal-700',
  sadaqah: 'bg-emerald-100 text-emerald-700',
  general: 'bg-gray-100 text-gray-600',
};

export default async function DonatePage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;
  const supabase  = await createClient();

  // Only listed orgs
  const { data: org } = await supabase
    .from('organizations')
    .select('id, name, fund_types, listing_status, summary')
    .eq('id', orgId)
    .eq('listing_status', 'listed')
    .single();

  if (!org) notFound();

  const fundTypes = (org.fund_types ?? []) as string[];

  // Trust data for mini panel
  const [scoreResult, certResult, bankResult, closesResult, policyResult, reportResult] =
    await Promise.all([
      supabase.from('amanah_index_history')
        .select('score_value, computed_at')
        .eq('organization_id', orgId)
        .order('computed_at', { ascending: false })
        .limit(1).maybeSingle(),

      supabase.from('certification_history')
        .select('new_status').eq('organization_id', orgId)
        .order('decided_at', { ascending: false }).limit(1).maybeSingle(),

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
    ]);

  const score       = Number(scoreResult.data?.score_value ?? 0);
  const trustGrade  = getTrustGrade(score);
  const isCertified = certResult.data?.new_status === 'certified';

  const snapshotSignals = [
    { label: 'Separate bank account',       detail: 'Funds kept separate from personal accounts',         ok: (bankResult.count ?? 0) > 0 },
    { label: 'Monthly accounts maintained', detail: 'Financial records closed and reviewed each month',    ok: (closesResult.count ?? 0) > 0 },
    { label: 'Governance policies on file', detail: 'Written policies governing financial controls',       ok: (policyResult.count ?? 0) > 0 },
    { label: 'Progress reports submitted',  detail: 'Regular reporting on activities and beneficiary impact', ok: (reportResult.count ?? 0) > 0 },
    { label: 'Certified by Amanah',         detail: 'CTCF evaluation completed by an independent reviewer', ok: isCertified },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-lg mx-auto px-4 py-10 space-y-6">

        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-gray-900">Donate to {org.name}</h1>
          {org.summary && (
            <p className="text-[13px] text-gray-500 leading-relaxed">{org.summary}</p>
          )}
          <div className="flex justify-center gap-1.5 flex-wrap">
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

        {/* Trust badge inline */}
        {score > 0 && (
          <div className="flex justify-center">
            <TrustBadgeInline
              score={score}
              grade={trustGrade.grade}
              gradeLabel={trustGrade.label}
            />
          </div>
        )}

        {/* Mini trust panel — BEFORE the donate form */}
        {score > 0 && (
          <MiniTrustPanel
            signals={snapshotSignals}
            gradeLabel={trustGrade.label}
            score={score}
          />
        )}

        {/* Donate form — existing component from Phase 1 */}
        <DonateForm orgId={orgId} orgName={org.name} />

        {/* Non-custodial notice */}
        <div className="rounded-lg bg-gray-100 border border-gray-200 p-4 text-center">
          <p className="text-[11px] text-gray-500 leading-relaxed">
            🔒 Non-custodial: AmanahHub never holds your funds.
            Payment goes directly to <strong>{org.name}</strong>'s registered bank account.
            Your donation receipt will be issued immediately.
          </p>
        </div>

        {/* Back link */}
        <div className="text-center">
          <a href={`/charities/${orgId}`}
            className="text-[12px] text-gray-400 hover:text-gray-600 transition-colors">
            ← Back to {org.name}'s profile
          </a>
        </div>
      </div>
    </div>
  );
}
