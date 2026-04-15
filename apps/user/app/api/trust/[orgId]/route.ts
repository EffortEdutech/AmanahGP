// apps/user/app/api/trust/[orgId]/route.ts
// AmanahHub — Public Trust Score API (Sprint 24)
//
// FIX: getTrustGrade moved to apps/user/lib/trust-grade.ts
// Next.js route files only allow HTTP method exports (GET, POST, etc.)
// and a small set of config exports. Named utility exports cause build failure.

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getTrustGrade } from '@/lib/trust-grade';

function createPublicClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

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

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> },
) {
  const { orgId } = await params;
  const supabase   = createPublicClient();

  const { data: org } = await supabase
    .from('organizations')
    .select('id, name, listing_status, fund_types, org_type, state')
    .eq('id', orgId)
    .eq('listing_status', 'listed')
    .single();

  if (!org) {
    return NextResponse.json({ error: 'Organisation not found or not listed' }, { status: 404 });
  }

  const { data: scoreRows } = await supabase
    .from('amanah_index_history')
    .select('id, score_value, score_version, breakdown, public_summary, computed_at')
    .eq('organization_id', orgId)
    .order('computed_at', { ascending: false })
    .limit(1);

  const latestScore = scoreRows?.[0] ?? null;
  const score       = Number(latestScore?.score_value ?? 0);
  const breakdown   = (latestScore?.breakdown ?? {}) as Record<string, {
    raw?: number; capped?: number; pct?: number; max?: number;
  }>;

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
    raw:         breakdown[p.key]?.raw ?? 0,
    max:         breakdown[p.key]?.max ?? 100,
  }));

  const { data: certRows } = await supabase
    .from('certification_history')
    .select('new_status, valid_from, valid_to, decided_at')
    .eq('organization_id', orgId)
    .order('decided_at', { ascending: false })
    .limit(1);

  const cert = certRows?.[0] ?? null;

  const [bankResult, closesResult, policyResult, reportResult] = await Promise.all([
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

  const snapshotSignals = [
    { label: 'Separate bank account',       detail: 'Organisational funds kept separate',                    ok: (bankResult.count ?? 0) > 0 },
    { label: 'Monthly accounts maintained', detail: 'Financial records closed and reviewed each month',       ok: (closesResult.count ?? 0) > 0 },
    { label: 'Governance policies on file', detail: 'Written policies governing financial controls',          ok: (policyResult.count ?? 0) > 0 },
    { label: 'Progress reports submitted',  detail: 'Regular reporting on activities and beneficiary impact', ok: (reportResult.count ?? 0) > 0 },
    { label: 'Certified by Amanah',         detail: 'CTCF certification evaluation completed',               ok: cert?.new_status === 'certified' },
  ];

  const { data: eventRows } = await supabase
    .from('trust_events')
    .select('id, event_type, pillar, score_delta, occurred_at')
    .eq('organization_id', orgId)
    .in('event_type', Object.keys(PUBLIC_EVENT_LABELS))
    .order('occurred_at', { ascending: false })
    .limit(8);

  const recentEvents = (eventRows ?? []).map((e) => ({
    id:         e.id,
    label:      PUBLIC_EVENT_LABELS[e.event_type] ?? e.event_type,
    pillar:     PUBLIC_EVENT_PILLARS[e.event_type] ?? e.pillar,
    positive:   (e.score_delta ?? 0) >= 0,
    occurredAt: e.occurred_at,
  }));

  const trustGrade = getTrustGrade(score);

  return NextResponse.json({
    orgId:               org.id,
    orgName:             org.name,
    score:               Math.round(score * 10) / 10,
    grade:               trustGrade.grade,
    gradeLabel:          trustGrade.label,
    gradeSublabel:       trustGrade.sublabel,
    gradeColor:          trustGrade.color,
    pillarBreakdown,
    certificationStatus: cert?.new_status ?? null,
    certValidFrom:       cert?.valid_from ?? null,
    certValidTo:         cert?.valid_to ?? null,
    lastUpdated:         latestScore?.computed_at ?? null,
    publicSummary:       latestScore?.public_summary ?? null,
    snapshotSignals,
    recentEvents,
    fundTypes:           org.fund_types ?? [],
    scoreVersion:        latestScore?.score_version ?? null,
  }, {
    headers: {
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
    },
  });
}
