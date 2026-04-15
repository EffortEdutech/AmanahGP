// apps/org/app/(protected)/dashboard/page.tsx
// amanahOS — Dashboard (Sprint 21 — with Onboarding Widget)

import { redirect }              from 'next/navigation';
import Link                      from 'next/link';
import { createClient }          from '@/lib/supabase/server';
import { createServiceClient }   from '@/lib/supabase/service';
import { OnboardingWidget }      from '@/components/dashboard/onboarding-widget';
import { getOnboardingState }    from '@/lib/onboarding-state';

export const metadata = { title: 'Dashboard — amanahOS' };

export default async function DashboardPage() {
  const supabase = await createClient();
  const service  = createServiceClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: platformUser } = await supabase
    .from('users')
    .select('id, display_name, email, platform_role')
    .eq('auth_provider_user_id', user.id)
    .single();
  if (!platformUser) redirect('/no-access?reason=no_user_record');

  const { data: membership } = await service
    .from('org_members')
    .select(`
      organization_id, org_role,
      organizations(id, name, onboarding_status, listing_status, org_type, state)
    `)
    .eq('user_id', platformUser.id)
    .order('created_at', { ascending: true })
    .limit(1).single();

  if (!membership) {
    return (
      <div className="p-8 text-center text-gray-500 space-y-2">
        <p className="font-medium text-gray-700">No organisation found.</p>
        <p className="text-sm">Contact your platform administrator.</p>
      </div>
    );
  }

  const org = membership.organizations as {
    id: string; name: string;
    onboarding_status: string; listing_status: string;
    org_type: string; state: string;
  } | null;

  if (!org) redirect('/no-access?reason=no_org_membership');
  const orgId = org.id;

  // Load onboarding state + dashboard data in parallel
  const [
    onboardingState,
    latestScoreResult,
    latestCertResult,
    projectCountResult,
    pendingReportsResult,
    pendingPaymentsResult,
  ] = await Promise.all([
    getOnboardingState(service, orgId),

    // Trust score v2 first, fallback to v1
    service.from('amanah_index_history')
      .select('score_value, score_version, computed_at')
      .eq('organization_id', orgId)
      .order('computed_at', { ascending: false })
      .limit(1).maybeSingle(),

    service.from('certification_history')
      .select('new_status, valid_from, decided_at')
      .eq('organization_id', orgId)
      .order('decided_at', { ascending: false })
      .limit(1).maybeSingle(),

    service.from('projects')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', orgId).eq('status', 'active'),

    service.from('project_reports')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .eq('submission_status', 'submitted')
      .eq('verification_status', 'pending'),

    service.from('payment_requests')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .in('status', ['pending_review', 'pending_approval']),
  ]);

  const amanahScore  = Number(latestScoreResult.data?.score_value ?? 0);
  const scoreVersion = latestScoreResult.data?.score_version ?? null;
  const certStatus   = latestCertResult.data?.new_status ?? null;
  const projectCount = projectCountResult.count ?? 0;
  const pendingReports = pendingReportsResult.count ?? 0;
  const pendingPayments = pendingPaymentsResult.count ?? 0;

  const gradeLabel =
    amanahScore >= 85 ? 'Platinum' :
    amanahScore >= 70 ? 'Gold' :
    amanahScore >= 55 ? 'Silver' :
    amanahScore >= 40 ? 'Bronze' :
    scoreVersion ? 'Foundation' : '—';

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">{org.name}</h1>
          <p className="text-sm text-gray-500 mt-0.5 capitalize">
            {org.org_type?.replace(/_/g, ' ')} · {org.state}
          </p>
        </div>
        {!onboardingState.isComplete && (
          <Link href="/onboarding"
            className="text-[11px] font-medium px-3 py-1.5 rounded-lg
                       bg-blue-50 text-blue-700 border border-blue-200
                       hover:bg-blue-100 transition-colors">
            {onboardingState.completedCount}/{onboardingState.totalSteps} setup steps
          </Link>
        )}
      </div>

      {/* ── Onboarding widget — shown until complete ── */}
      <OnboardingWidget state={onboardingState} />

      {/* ── KPI cards ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiCard
          label="Amanah score" href="/trust"
          value={amanahScore > 0 ? `${amanahScore.toFixed(1)}` : '—'}
          sub={amanahScore > 0 ? gradeLabel : 'Complete setup to start'}
          accent={amanahScore >= 70 ? 'green' : amanahScore >= 40 ? 'amber' : 'gray'} />
        <KpiCard
          label="Certification" href="/certification"
          value={certStatus ? certStatus.replace(/_/g, ' ') : 'None'}
          sub={latestCertResult.data ? `Since ${latestCertResult.data.valid_from ?? '—'}` : 'Apply when ready'}
          accent={certStatus === 'certified' ? 'green' : 'gray'} />
        <KpiCard
          label="Active projects" href="/projects"
          value={String(projectCount)}
          sub="in progress" accent="blue" />
        <KpiCard
          label="Pending approvals" href="/accounting/payment-requests"
          value={String(pendingPayments)}
          sub="payment requests"
          accent={pendingPayments > 0 ? 'amber' : 'gray'} />
      </div>

      {/* ── Quick actions when onboarding done ── */}
      {onboardingState.isComplete && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { href: '/accounting/transactions/new',    label: 'Record transaction',  icon: '⇄' },
            { href: '/accounting/payment-requests/new',label: 'Payment request',      icon: '✉' },
            { href: '/accounting/close',               label: 'Month close',          icon: '⊠' },
            { href: '/accounting/reports',             label: 'Financial reports',    icon: '📊' },
          ].map((a) => (
            <Link key={a.href} href={a.href}
              className="rounded-lg border border-gray-200 bg-white p-3 hover:border-emerald-300
                         hover:shadow-sm transition-all flex items-center gap-2">
              <span className="text-gray-500">{a.icon}</span>
              <span className="text-[12px] font-medium text-gray-700">{a.label}</span>
            </Link>
          ))}
        </div>
      )}

      {/* ── Module grid ── */}
      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Workspace</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <ModuleCard href="/accounting"           icon="$"  label="Accounting"     description="Fund accounting, transactions, financial statements" />
          <ModuleCard href="/trust"                icon="▲"  label="Trust score"    description="Amanah Index breakdown and improvement tips" />
          <ModuleCard href="/accounting/payment-requests" icon="✉" label="Payment requests" description="Approval workflow — segregation of duties" />
          <ModuleCard href="/projects"             icon="▦"  label="Projects"       description="Create and manage charitable projects" />
          <ModuleCard href="/compliance"           icon="☑"  label="Compliance"     description="ROS, MAIN, and regulatory reports" />
          <ModuleCard href="/policy-kit"           icon="⊞"  label="Policy kit"     description="Governance templates and Zakat SOP" />
          <ModuleCard href="/onboarding"           icon="◉"  label="Amanah Ready"   description={`Setup progress — ${onboardingState.pct}% complete`} />
          <ModuleCard href="/certification"        icon="★"  label="Certification"  description="CTCF certification application" />
          <ModuleCard href="/members"              icon="♟"  label="Team"           description="Members, roles, and invitations" />
        </div>
      </div>

      <p className="text-[11px] text-gray-400 text-center pt-2">
        amanahOS · Amanah Governance Platform · Trusted Giving. Transparent Governance.
      </p>
    </div>
  );
}

function KpiCard({ label, value, sub, href, accent }: {
  label: string; value: string; sub: string; href: string;
  accent: 'green' | 'amber' | 'red' | 'blue' | 'gray';
}) {
  const fill  = { green:'border-emerald-200 bg-emerald-50', amber:'border-amber-200 bg-amber-50', red:'border-red-200 bg-red-50', blue:'border-blue-200 bg-blue-50', gray:'border-gray-200 bg-white' }[accent];
  const color = { green:'text-emerald-700', amber:'text-amber-700', red:'text-red-700', blue:'text-blue-700', gray:'text-gray-700' }[accent];
  return (
    <Link href={href} className={`rounded-lg border p-3 block hover:shadow-sm transition-shadow ${fill}`}>
      <p className="text-[10px] text-gray-500 uppercase tracking-wide font-medium">{label}</p>
      <p className={`text-2xl font-bold mt-1 capitalize ${color}`}>{value}</p>
      <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>
    </Link>
  );
}

function ModuleCard({ href, icon, label, description }: {
  href: string; icon: string; label: string; description: string;
}) {
  return (
    <Link href={href}
      className="rounded-lg border border-gray-200 bg-white p-4
                 hover:border-emerald-300 hover:shadow-sm transition-all flex flex-col gap-2">
      <span className="text-lg text-gray-600">{icon}</span>
      <div>
        <p className="text-[12px] font-semibold text-gray-800">{label}</p>
        <p className="text-[10px] text-gray-400 mt-0.5 leading-relaxed">{description}</p>
      </div>
    </Link>
  );
}
