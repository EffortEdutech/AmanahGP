// apps/org/app/(protected)/compliance/page.tsx
// amanahOS — Compliance Reports (Sprint 25 — real page, not a stub)
//
// Auto-assembles Malaysian regulatory reporting packs from existing data.
// Shows readiness status for each pack and links to the underlying reports.
// This IS needed — Core Service 2 from amanah_gp_OS.md.
//
// Three packs:
//   1. ROS Annual Return — for NGOs registered under ROS
//   2. MAIN/JAKIM Pack — for Zakat/Waqf bodies
//   3. Donor Transparency Pack — for all orgs, public-facing

import { redirect }            from 'next/navigation';
import Link                    from 'next/link';
import { createClient }        from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';

export const metadata = { title: 'Compliance — amanahOS' };

export default async function CompliancePage() {
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
    .select('organization_id, org_role, organizations(id, name, org_type, oversight_authority, fund_types, registration_no, contact_email, state)')
    .eq('user_id', platformUser.id).eq('status', 'active')
    .order('created_at', { ascending: true }).limit(1).single();
  if (!membership) redirect('/no-access?reason=no_org_membership');

  const orgId  = membership.organization_id;
  const org    = membership.organizations as {
    id: string; name: string; org_type: string | null;
    oversight_authority: string | null; fund_types: string[];
    registration_no: string | null; contact_email: string | null; state: string | null;
  } | null;
  const fundTypes = org?.fund_types ?? [];
  const hasZakat = fundTypes.includes('zakat');
  const hasWaqf  = fundTypes.includes('waqf');
  const isROS    = org?.oversight_authority?.toUpperCase().includes('ROS') ?? false;
  const isMAIN   = org?.oversight_authority?.toUpperCase().includes('MAIN') ||
                   org?.oversight_authority?.toUpperCase().includes('JAKIM') ||
                   hasZakat || hasWaqf;

  // Load data readiness signals
  const [
    membersResult, snapshotResult, closesResult, reportsResult,
    projectsResult, policyResult, certResult, bankResult,
  ] = await Promise.all([
    service.from('org_members').select('id', { count: 'exact', head: true })
      .eq('organization_id', orgId).eq('status', 'active'),
    service.from('financial_snapshots')
      .select('id, period_year, submission_status, inputs')
      .eq('organization_id', orgId).eq('submission_status', 'submitted')
      .order('period_year', { ascending: false }).limit(1).maybeSingle(),
    service.from('fund_period_closes')
      .select('id, period_year, period_month, total_income, total_expense')
      .eq('organization_id', orgId)
      .order('period_year', { ascending: false })
      .order('period_month', { ascending: false }).limit(12),
    service.from('project_reports')
      .select('id, title, verification_status, submission_status')
      .eq('organization_id', orgId)
      .eq('submission_status', 'submitted').limit(20),
    service.from('projects')
      .select('id, title, status', ).eq('organization_id', orgId)
      .eq('status', 'active').limit(10),
    service.from('trust_events').select('*', { count: 'exact', head: true })
      .eq('organization_id', orgId).eq('event_type', 'gov_policy_uploaded'),
    service.from('certification_history')
      .select('new_status, valid_from, decided_at')
      .eq('organization_id', orgId).order('decided_at', { ascending: false }).limit(1).maybeSingle(),
    service.from('bank_accounts').select('id', { count: 'exact', head: true })
      .eq('organization_id', orgId).eq('is_active', true),
  ]);

  const memberCount    = membersResult.count  ?? 0;
  const hasSnapshot    = !!snapshotResult.data;
  const closesCount    = (closesResult.data ?? []).length;
  const verifiedReports = (reportsResult.data ?? []).filter((r) => r.verification_status === 'verified').length;
  const projectCount   = (projectsResult.data ?? []).length;
  const hasPolicies    = (policyResult.count ?? 0) > 0;
  const isCertified    = certResult.data?.new_status === 'certified';
  const bankCount      = bankResult.count ?? 0;
  const hasProfile     = !!(org?.name && org?.registration_no && org?.contact_email);
  const hasCommittee   = memberCount >= 2;

  const latestClose    = (closesResult.data ?? [])[0];
  const snapshotYear   = snapshotResult.data?.period_year;
  const snapshotInputs = snapshotResult.data?.inputs as Record<string, unknown> | null;

  const fmt = (n: number) =>
    `RM ${n.toLocaleString('en-MY', { minimumFractionDigits: 2 })}`;

  // ── Pack 1: ROS Annual Return ────────────────────────────
  const rosItems = [
    { label: 'Organisation profile complete', ok: hasProfile, href: '/profile' },
    { label: 'Committee list (≥2 members)',    ok: hasCommittee, href: '/members' },
    { label: 'Financial period closed',        ok: closesCount > 0, href: '/accounting/close' },
    { label: 'Annual financial statement',     ok: hasSnapshot, href: '/accounting/reports/statement-of-activities' },
    { label: 'Activity report (project)',       ok: projectCount > 0 && verifiedReports > 0, href: '/reports' },
    { label: 'Governance policies on file',    ok: hasPolicies, href: '/policy-kit' },
  ];
  const rosPct = Math.round(rosItems.filter((i) => i.ok).length / rosItems.length * 100);

  // ── Pack 2: MAIN/JAKIM (Zakat/Waqf) ─────────────────────
  const mainItems = [
    { label: 'Zakat or Waqf fund configured', ok: hasZakat || hasWaqf, href: '/accounting/funds' },
    { label: 'Bank account linked',           ok: bankCount > 0, href: '/accounting/bank-accounts' },
    { label: 'Period closed with fund data',  ok: closesCount > 0, href: '/accounting/close' },
    { label: 'Zakat utilisation report',      ok: closesCount > 0 && hasZakat, href: '/accounting/reports/zakat-utilisation' },
    { label: 'Beneficiary reports submitted', ok: verifiedReports > 0, href: '/reports' },
  ];
  const mainPct = Math.round(mainItems.filter((i) => i.ok).length / mainItems.length * 100);

  // ── Pack 3: Donor Transparency ───────────────────────────
  const donorItems = [
    { label: 'Amanah Trust Score computed',   ok: isCertified || closesCount > 0, href: '/trust' },
    { label: 'Financial data available',       ok: hasSnapshot || closesCount > 0, href: '/accounting/reports' },
    { label: 'Impact reports verified',        ok: verifiedReports > 0, href: '/reports' },
    { label: 'Governance policies uploaded',   ok: hasPolicies, href: '/policy-kit' },
    { label: 'CTCF certification',            ok: isCertified, href: '/certification' },
  ];
  const donorPct = Math.round(donorItems.filter((i) => i.ok).length / donorItems.length * 100);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">

      <div>
        <h1 className="text-xl font-semibold text-gray-900">Compliance reports</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {org?.name} · Auto-assembled from your accounting and governance data
        </p>
      </div>

      {/* What this page is */}
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
        <p className="text-[12px] font-semibold text-emerald-800">
          Your compliance data is assembled automatically
        </p>
        <p className="text-[11px] text-emerald-700 mt-1 leading-relaxed">
          These packs pull from your fund accounting records, team members, uploaded policies,
          and submitted reports. No manual data entry. Complete the items below and your
          regulatory reporting data is ready to export.
        </p>
      </div>

      {/* ── PACK 1: ROS Annual Return ── */}
      <ReportPack
        title="ROS Annual Return"
        subtitle="For NGOs registered under Registrar of Societies (ROS)"
        icon="🏛"
        pct={rosPct}
        applicable={isROS || true} // Always show — all orgs benefit
        items={rosItems}
        reportLinks={[
          { label: 'Committee list (Members page)', href: '/members' },
          { label: 'Statement of Activities',       href: '/accounting/reports/statement-of-activities' },
          { label: 'Statement of Financial Position', href: '/accounting/reports/statement-of-financial-position' },
          { label: 'Activity summary (Reports)',    href: '/reports' },
        ]}
        financialSummary={latestClose ? {
          year:        String(latestClose.period_year),
          income:      fmt(Number(latestClose.total_income)),
          expense:     fmt(Number(latestClose.total_expense)),
          net:         fmt(Number(latestClose.total_income) - Number(latestClose.total_expense)),
        } : null}
      />

      {/* ── PACK 2: MAIN/JAKIM ── */}
      <ReportPack
        title="MAIN / JAKIM Reporting Pack"
        subtitle="For Zakat bodies, Waqf institutions, and mosque organisations"
        icon="🌙"
        pct={mainPct}
        applicable={isMAIN || hasZakat || hasWaqf}
        notApplicableNote="This pack applies to organisations handling Zakat or Waqf funds. Update your fund types in Profile if applicable."
        items={mainItems}
        reportLinks={[
          { label: 'Zakat Utilisation Report',     href: '/accounting/reports/zakat-utilisation' },
          { label: 'Statement of Changes in Funds', href: '/accounting/reports/fund-changes' },
          { label: 'Fund balance report',           href: '/accounting/funds' },
          { label: 'Beneficiary reports',          href: '/reports' },
        ]}
        financialSummary={null}
      />

      {/* ── PACK 3: Donor Transparency ── */}
      <ReportPack
        title="Donor Transparency Pack"
        subtitle="Publish financial summaries and impact data for donors and grant applications"
        icon="◎"
        pct={donorPct}
        applicable={true}
        items={donorItems}
        reportLinks={[
          { label: 'Amanah Trust Score',            href: '/trust' },
          { label: 'Statement of Activities',       href: '/accounting/reports/statement-of-activities' },
          { label: 'Project fund utilisation',      href: '/accounting/reports/project-fund' },
          { label: 'Governance policies',           href: '/policy-kit' },
          { label: 'Certification status',          href: '/certification' },
        ]}
        financialSummary={snapshotInputs ? {
          year:    String(snapshotYear),
          income:  fmt(Number((snapshotInputs as Record<string, number>).total_income ?? 0)),
          expense: fmt(Number((snapshotInputs as Record<string, number>).total_expense ?? 0)),
          net:     fmt(Number((snapshotInputs as Record<string, number>).net_movement ?? 0)),
        } : null}
      />

      {/* Future note */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
        <p className="text-[11px] font-semibold text-gray-600">Coming next</p>
        <p className="text-[11px] text-gray-500 mt-1">
          One-click PDF export for each pack is being built.
          All data is already assembled above — export to PDF will package it
          into a regulator-ready document automatically.
        </p>
      </div>
    </div>
  );
}

/* ── Pack Component ─────────────────────────────────────────── */
function ReportPack({
  title, subtitle, icon, pct, applicable, notApplicableNote,
  items, reportLinks, financialSummary,
}: {
  title: string; subtitle: string; icon: string; pct: number;
  applicable: boolean; notApplicableNote?: string;
  items: Array<{ label: string; ok: boolean; href: string }>;
  reportLinks: Array<{ label: string; href: string }>;
  financialSummary: { year: string | undefined; income: string; expense: string; net: string } | null;
}) {
  const passedCount = items.filter((i) => i.ok).length;

  return (
    <div className={`rounded-xl border overflow-hidden ${
      !applicable ? 'border-gray-200 opacity-60' : 'border-gray-200'
    }`}>
      {/* Header */}
      <div className="bg-white px-5 py-4 border-b border-gray-100">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{icon}</span>
            <div>
              <h2 className="text-[14px] font-semibold text-gray-900">{title}</h2>
              <p className="text-[11px] text-gray-500 mt-0.5">{subtitle}</p>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <p className={`text-lg font-bold ${
              pct >= 80 ? 'text-emerald-700' : pct >= 50 ? 'text-amber-700' : 'text-gray-600'
            }`}>{pct}%</p>
            <p className="text-[10px] text-gray-400">{passedCount}/{items.length} ready</p>
          </div>
        </div>
        <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-500 ${
            pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-400' : 'bg-gray-300'
          }`} style={{ width: `${pct}%` }} />
        </div>
      </div>

      {!applicable && notApplicableNote ? (
        <div className="bg-gray-50 px-5 py-4">
          <p className="text-[11px] text-gray-500">{notApplicableNote}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-0 lg:grid-cols-2">
          {/* Left: readiness checklist */}
          <div className="bg-white px-5 py-4 border-r border-gray-100 space-y-2">
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Readiness checklist
            </p>
            {items.map((item) => (
              <div key={item.label} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className={`text-sm flex-shrink-0 ${item.ok ? 'text-emerald-500' : 'text-gray-300'}`}>
                    {item.ok ? '✓' : '○'}
                  </span>
                  <p className={`text-[12px] ${item.ok ? 'text-gray-700' : 'text-gray-500'}`}>
                    {item.label}
                  </p>
                </div>
                {!item.ok && (
                  <Link href={item.href}
                    className="text-[10px] font-medium text-blue-600 hover:underline flex-shrink-0">
                    Fix →
                  </Link>
                )}
              </div>
            ))}
          </div>

          {/* Right: report links + financial summary */}
          <div className="bg-gray-50 px-5 py-4 space-y-4">
            {financialSummary && (
              <div className="rounded-lg border border-gray-200 bg-white p-3 space-y-2">
                <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">
                  Financial summary {financialSummary.year}
                </p>
                {[
                  { label: 'Total income',   value: financialSummary.income,  color: 'text-emerald-700' },
                  { label: 'Total expenses', value: financialSummary.expense, color: 'text-red-600' },
                  { label: 'Net movement',   value: financialSummary.net,     color: 'text-gray-800' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="flex justify-between">
                    <p className="text-[11px] text-gray-500">{label}</p>
                    <p className={`text-[11px] font-semibold ${color}`}>{value}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-1.5">
              <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">
                Report sources
              </p>
              {reportLinks.map((rl) => (
                <Link key={rl.href} href={rl.href}
                  className="flex items-center gap-1.5 text-[11px] text-blue-600 hover:underline">
                  <span className="text-[9px]">→</span>
                  {rl.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
