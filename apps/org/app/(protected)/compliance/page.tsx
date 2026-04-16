// apps/org/app/(protected)/compliance/page.tsx
// amanahOS — Compliance Reports (Sprint 29 update — adds export buttons + audit package)
//
// Builds on Sprint 25's compliance page.
// Adds: Export buttons per pack + Audit Package download.

import { redirect }              from 'next/navigation';
import Link                      from 'next/link';
import { createClient }          from '@/lib/supabase/server';
import { createServiceClient }   from '@/lib/supabase/service';
import { AuditPackageButton }    from '@/components/compliance/audit-package-button';
function relationOne<T>(value: unknown): T | null {
  if (Array.isArray(value)) {
    return (value[0] as T | undefined) ?? null;
  }
  return (value as T | null) ?? null;
}


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

  const orgId    = membership.organization_id;
  const orgRaw = membership.organizations;
  const org = (Array.isArray(orgRaw) ? orgRaw[0] : orgRaw) as {
    id: string; name: string; org_type: string | null | undefined;
    oversight_authority: string | null; fund_types: string[];
    registration_no: string | null; contact_email: string | null; state: string | null;
  } | null;
  const fundTypes = org?.fund_types ?? [];
  const hasZakat  = fundTypes.includes('zakat');
  const hasWaqf   = fundTypes.includes('waqf');
  const isROS     = org?.oversight_authority?.toUpperCase().includes('ROS') ?? false;
  const isMAIN    = org?.oversight_authority?.toUpperCase().includes('MAIN') ||
                    org?.oversight_authority?.toUpperCase().includes('JAKIM') ||
                    hasZakat || hasWaqf;

  const [
    membersResult, snapshotResult, closesResult, reportsResult,
    projectsResult, policyResult, certResult, bankResult,
  ] = await Promise.all([
    service.from('org_members').select('id', { count: 'exact', head: true })
      .eq('organization_id', orgId).eq('status', 'active'),
    service.from('financial_snapshots')
      .select('id, period_year, submission_status, inputs')
      .eq('organization_id', orgId).eq('submission_status', 'submitted')
      .limit(1).maybeSingle(),
    service.from('fund_period_closes')
      .select('id, period_year, period_month, total_income, total_expense')
      .eq('organization_id', orgId)
      .order('period_year', { ascending: false })
      .order('period_month', { ascending: false }).limit(12),
    service.from('project_reports')
      .select('id, title, verification_status, submission_status')
      .eq('organization_id', orgId).eq('submission_status', 'submitted').limit(20),
    service.from('projects')
      .select('id, title, status').eq('organization_id', orgId)
      .eq('status', 'active').limit(10),
    service.from('trust_events').select('*', { count: 'exact', head: true })
      .eq('organization_id', orgId).eq('event_type', 'gov_policy_uploaded'),
    service.from('certification_history')
      .select('new_status, valid_from, decided_at')
      .eq('organization_id', orgId).order('decided_at', { ascending: false }).limit(1).maybeSingle(),
    service.from('bank_accounts').select('id', { count: 'exact', head: true })
      .eq('organization_id', orgId).eq('is_active', true),
  ]);

  const memberCount     = membersResult.count      ?? 0;
  const hasSnapshot     = !!snapshotResult.data;
  const closesCount     = (closesResult.data ?? []).length;
  const verifiedReports = (reportsResult.data ?? []).filter((r) => r.verification_status === 'verified').length;
  const projectCount    = (projectsResult.data ?? []).length;
  const hasPolicies     = (policyResult.count ?? 0) > 0;
  const isCertified     = certResult.data?.new_status === 'certified';
  const bankCount       = bankResult.count ?? 0;
  const hasProfile      = !!(org?.name && org?.registration_no && org?.contact_email);
  const hasCommittee    = memberCount >= 2;

  const latestClose      = (closesResult.data ?? [])[0];
  const snapshotInputs   = relationOne<Record<string, unknown>>(snapshotResult.data?.inputs);
  const totalIncome      = (closesResult.data ?? []).reduce((s, c) => s + Number(c.total_income),  0);
  const totalExpense     = (closesResult.data ?? []).reduce((s, c) => s + Number(c.total_expense), 0);

  const fmt = (n: number) =>
    `RM ${Math.abs(n).toLocaleString('en-MY', { minimumFractionDigits: 2 })}`;

  // Readiness items per pack
  const rosItems = [
    { label: 'Organisation profile complete', ok: hasProfile,    href: '/profile' },
    { label: 'Committee list (â‰¥2 members)',    ok: hasCommittee,  href: '/members' },
    { label: 'Financial period closed',        ok: closesCount > 0, href: '/accounting/close' },
    { label: 'Annual financial statement',     ok: hasSnapshot,   href: '/accounting/reports/statement-of-activities' },
    { label: 'Activity report (project)',       ok: projectCount > 0 && verifiedReports > 0, href: '/reports' },
    { label: 'Governance policies on file',    ok: hasPolicies,   href: '/policy-kit' },
  ];
  const mainItems = [
    { label: 'Zakat or Waqf fund configured', ok: hasZakat || hasWaqf, href: '/accounting/funds' },
    { label: 'Bank account linked',            ok: bankCount > 0, href: '/accounting/bank-accounts' },
    { label: 'Period closed with fund data',   ok: closesCount > 0, href: '/accounting/close' },
    { label: 'Zakat utilisation report',       ok: closesCount > 0 && hasZakat, href: '/accounting/reports/zakat-utilisation' },
    { label: 'Beneficiary reports submitted',  ok: verifiedReports > 0, href: '/reports' },
  ];
  const donorItems = [
    { label: 'Amanah Trust Score computed',    ok: closesCount > 0, href: '/trust' },
    { label: 'Financial data available',        ok: hasSnapshot || closesCount > 0, href: '/accounting/reports' },
    { label: 'Impact reports verified',         ok: verifiedReports > 0, href: '/reports' },
    { label: 'Governance policies uploaded',    ok: hasPolicies,   href: '/policy-kit' },
    { label: 'CTCF certification',             ok: isCertified,   href: '/certification' },
  ];

  const rosPct   = Math.round(rosItems.filter((i)  => i.ok).length / rosItems.length  * 100);
  const mainPct  = Math.round(mainItems.filter((i) => i.ok).length / mainItems.length  * 100);
  const donorPct = Math.round(donorItems.filter((i)=> i.ok).length / donorItems.length * 100);

  const overallReady = (rosPct + donorPct) / 2 >= 80;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">

      <div>
        <h1 className="text-xl font-semibold text-gray-900">Compliance reports</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {org?.name} · Auto-assembled from your accounting and governance data
        </p>
      </div>

      {/* Audit Package CTA */}
      <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-6 space-y-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xl">📦</span>
          </div>
          <div className="flex-1">
            <h2 className="text-[15px] font-bold text-gray-900">Audit-Ready Package</h2>
            <p className="text-[12px] text-gray-600 mt-1 leading-relaxed">
              One-click download containing your complete audit PDF (printable, signable),
              financial summary JSON, trust events log, and organisation profile.
              Ready for your auditor, regulator, or grant body.
            </p>
          </div>
        </div>
        <AuditPackageButton />
      </div>

      {/* Auto-assembled note */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <p className="text-[12px] font-semibold text-blue-800">
          All data is assembled automatically
        </p>
        <p className="text-[11px] text-blue-700 mt-1 leading-relaxed">
          These packs pull from your fund accounting records, team members, uploaded policies,
          and submitted reports. Complete the items below and your regulatory reporting data
          is ready to export. No manual data entry.
        </p>
      </div>

      {/* ROS Pack */}
      <ReportPack
        title="ROS Annual Return"
        subtitle="For NGOs registered under Registrar of Societies (ROS)"
        icon="🏛"
        pct={rosPct}
        applicable={true}
        exportType="ros"
        items={rosItems}
        reportLinks={[
          { label: 'Committee list (Members)',         href: '/members' },
          { label: 'Statement of Activities',          href: '/accounting/reports/statement-of-activities' },
          { label: 'Statement of Financial Position',  href: '/accounting/reports/statement-of-financial-position' },
          { label: 'Activity summary (Reports)',       href: '/reports' },
        ]}
        financialSummary={closesCount > 0 ? {
          income:  fmt(totalIncome),
          expense: fmt(totalExpense),
          net:     fmt(totalIncome - totalExpense),
        } : null}
      />

      {/* MAIN/JAKIM Pack */}
      <ReportPack
        title="MAIN / JAKIM Reporting Pack"
        subtitle="For Zakat bodies, Waqf institutions, and mosque organisations"
        icon="🌙"
        pct={mainPct}
        applicable={isMAIN || hasZakat || hasWaqf}
        exportType="main"
        notApplicableNote="This pack applies to organisations handling Zakat or Waqf funds. Update your fund types in Profile if applicable."
        items={mainItems}
        reportLinks={[
          { label: 'Zakat Utilisation Report',       href: '/accounting/reports/zakat-utilisation' },
          { label: 'Statement of Changes in Funds',  href: '/accounting/reports/fund-changes' },
          { label: 'Fund balance report',            href: '/accounting/funds' },
          { label: 'Beneficiary reports',            href: '/reports' },
        ]}
        financialSummary={null}
      />

      {/* Donor Transparency Pack */}
      <ReportPack
        title="Donor Transparency Report"
        subtitle="Annual transparency report for donors and grant applications"
        icon="◎"
        pct={donorPct}
        applicable={true}
        exportType="donor"
        items={donorItems}
        reportLinks={[
          { label: 'Amanah Trust Score',             href: '/trust' },
          { label: 'Statement of Activities',         href: '/accounting/reports/statement-of-activities' },
          { label: 'Project fund utilisation',        href: '/accounting/reports/project-fund' },
          { label: 'Governance policies',             href: '/policy-kit' },
          { label: 'Certification status',            href: '/certification' },
        ]}
        financialSummary={snapshotInputs ? {
          income:  fmt(Number((snapshotInputs as Record<string, number>).total_income  ?? 0)),
          expense: fmt(Number((snapshotInputs as Record<string, number>).total_expense ?? 0)),
          net:     fmt(Number((snapshotInputs as Record<string, number>).net_movement  ?? 0)),
        } : null}
      />
    </div>
  );
}

/* â”€â”€ Pack component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function ReportPack({ title, subtitle, icon, pct, applicable, notApplicableNote,
  exportType, items, reportLinks, financialSummary }: {
  title: string; subtitle: string; icon: string; pct: number;
  applicable: boolean; notApplicableNote?: string; exportType: string;
  items: Array<{ label: string; ok: boolean; href: string }>;
  reportLinks: Array<{ label: string; href: string }>;
  financialSummary: { income: string; expense: string; net: string } | null;
}) {
  const passedCount = items.filter((i) => i.ok).length;
  return (
    <div className={`rounded-xl border overflow-hidden ${!applicable ? 'border-gray-200 opacity-60' : 'border-gray-200'}`}>
      <div className="bg-white px-5 py-4 border-b border-gray-100">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{icon}</span>
            <div>
              <h2 className="text-[14px] font-semibold text-gray-900">{title}</h2>
              <p className="text-[11px] text-gray-500 mt-0.5">{subtitle}</p>
            </div>
          </div>
          <div className="text-right flex-shrink-0 space-y-2">
            <div>
              <p className={`text-lg font-bold ${pct >= 80 ? 'text-emerald-700' : pct >= 50 ? 'text-amber-700' : 'text-gray-600'}`}>
                {pct}%
              </p>
              <p className="text-[10px] text-gray-400">{passedCount}/{items.length} ready</p>
            </div>
            {applicable && pct >= 60 && (
              <Link href={`/compliance/export/${exportType}`} target="_blank"
                className="inline-flex items-center gap-1 px-3 py-1 text-[10px] font-medium
                           border border-emerald-300 text-emerald-700 bg-emerald-50 rounded-lg
                           hover:bg-emerald-100 transition-colors">
                â†— Export PDF
              </Link>
            )}
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
          <div className="bg-white px-5 py-4 border-r border-gray-100 space-y-2">
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-3">Readiness</p>
            {items.map((item) => (
              <div key={item.label} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className={`text-sm flex-shrink-0 ${item.ok ? 'text-emerald-500' : 'text-gray-300'}`}>
                    {item.ok ? '✓' : 'â—‹'}
                  </span>
                  <p className={`text-[12px] ${item.ok ? 'text-gray-700' : 'text-gray-500'}`}>{item.label}</p>
                </div>
                {!item.ok && (
                  <Link href={item.href} className="text-[10px] font-medium text-blue-600 hover:underline flex-shrink-0">
                    Fix →
                  </Link>
                )}
              </div>
            ))}
          </div>

          <div className="bg-gray-50 px-5 py-4 space-y-4">
            {financialSummary && (
              <div className="rounded-lg border border-gray-200 bg-white p-3 space-y-2">
                <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Financial summary</p>
                {[
                  { label: 'Income',   value: financialSummary.income,  color: 'text-emerald-700' },
                  { label: 'Expenses', value: financialSummary.expense, color: 'text-red-600' },
                  { label: 'Net',      value: financialSummary.net,     color: 'text-gray-800' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="flex justify-between">
                    <p className="text-[11px] text-gray-500">{label}</p>
                    <p className={`text-[11px] font-semibold ${color}`}>{value}</p>
                  </div>
                ))}
              </div>
            )}
            <div className="space-y-1.5">
              <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Report sources</p>
              {reportLinks.map((rl) => (
                <Link key={rl.href} href={rl.href}
                  className="flex items-center gap-1.5 text-[11px] text-blue-600 hover:underline">
                  <span className="text-[9px]">→</span>{rl.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

