// apps/org/app/(protected)/dashboard/page.tsx
// amanahOS — Dashboard
// Shows the first org the user belongs to.
// For multi-org users, they can switch via the sidebar.

import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export const metadata = { title: 'Dashboard — amanahOS' };

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Load user's first org membership
  const { data: membership } = await supabase
    .from('org_members')
    .select(`
      organization_id,
      org_role,
      organizations (
        id, name, slug, onboarding_status, listing_status, org_type, state
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })
    .limit(1)
    .single();

  if (!membership) {
    return (
      <div className="p-8 text-center text-gray-500">
        <p>No organisation found for your account.</p>
        <p className="text-sm mt-1">Contact your platform administrator.</p>
      </div>
    );
  }

  const org = membership.organizations as {
    id: string; name: string; slug: string;
    onboarding_status: string; listing_status: string;
    org_type: string; state: string;
  } | null;
  if (!org) redirect('/login');

  const orgId = org.id;

  // Load latest Amanah Index score
  const { data: latestAmanah } = await supabase
    .from('amanah_index_history')
    .select('total_score, computed_at')
    .eq('organization_id', orgId)
    .order('computed_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  // Load latest certification
  const { data: latestCert } = await supabase
    .from('certification_history')
    .select('new_status, valid_from, valid_to, decided_at')
    .eq('organization_id', orgId)
    .order('decided_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  // Count active projects
  const { count: projectCount } = await supabase
    .from('projects')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', orgId)
    .eq('status', 'active');

  // Count pending reports
  const { count: pendingReports } = await supabase
    .from('project_reports')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', orgId)
    .eq('submission_status', 'submitted')
    .eq('verification_status', 'pending');

  const onboardingComplete = org.onboarding_status === 'approved';
  const certStatus = latestCert?.new_status ?? null;
  const amanahScore = latestAmanah?.total_score ?? null;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-gray-900">{org.name}</h1>
        <p className="text-sm text-gray-500 mt-0.5 capitalize">
          {org.org_type?.replace(/_/g, ' ')} · {org.state}
        </p>
      </div>

      {/* Onboarding notice */}
      {!onboardingComplete && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 flex items-start gap-3">
          <span className="text-amber-500 mt-0.5">⚠</span>
          <div>
            <p className="text-sm font-medium text-amber-800">
              Organisation setup in progress
            </p>
            <p className="text-sm text-amber-700 mt-0.5">
              Your organisation is pending review.
              Status: <span className="font-medium capitalize">{org.onboarding_status}</span>
            </p>
          </div>
        </div>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <KpiCard
          label="Amanah score"
          value={amanahScore !== null ? `${amanahScore.toFixed(1)}` : '—'}
          sub="out of 100"
          href={`/orgs/${orgId}/trust`}
          accent={amanahScore !== null ? (amanahScore >= 70 ? 'green' : amanahScore >= 50 ? 'amber' : 'red') : 'gray'}
        />
        <KpiCard
          label="Certification"
          value={certStatus ? certStatus.replace(/_/g, ' ') : 'None'}
          sub={latestCert ? `Since ${latestCert.valid_from ?? '—'}` : 'Apply when ready'}
          href={`/orgs/${orgId}/certification`}
          accent={certStatus === 'certified' ? 'green' : 'gray'}
        />
        <KpiCard
          label="Active projects"
          value={String(projectCount ?? 0)}
          sub="in progress"
          href={`/orgs/${orgId}/projects`}
          accent="blue"
        />
        <KpiCard
          label="Reports pending"
          value={String(pendingReports ?? 0)}
          sub="awaiting review"
          href={`/orgs/${orgId}/reports`}
          accent={pendingReports ? 'amber' : 'gray'}
        />
      </div>

      {/* Module grid */}
      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Workspace modules</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <ModuleCard
            href={`/orgs/${orgId}/profile`}
            icon="◎"
            label="Profile"
            description="Organisation details, classification, contact info"
          />
          <ModuleCard
            href={`/orgs/${orgId}/projects`}
            icon="▦"
            label="Projects"
            description="Create and manage your charitable projects"
          />
          <ModuleCard
            href={`/orgs/${orgId}/reports`}
            icon="✎"
            label="Reports"
            description="Submit progress reports and upload evidence"
          />
          <ModuleCard
            href={`/orgs/${orgId}/accounting`}
            icon="$"
            label="Accounting"
            description="Fund accounting, transactions, financial statements"
            badge="Phase 2"
          />
          <ModuleCard
            href={`/orgs/${orgId}/compliance`}
            icon="☑"
            label="Compliance"
            description="ROS, MAIN, and donor transparency reports"
            badge="Phase 2"
          />
          <ModuleCard
            href={`/orgs/${orgId}/governance`}
            icon="⊞"
            label="Policy kit"
            description="Governance templates, Zakat SOP, PDPA policy"
            badge="Phase 2"
          />
          <ModuleCard
            href={`/orgs/${orgId}/trust`}
            icon="▲"
            label="Trust score"
            description="Amanah Index breakdown and improvement tips"
          />
          <ModuleCard
            href={`/orgs/${orgId}/certification`}
            icon="★"
            label="Certification"
            description="CTCF certification status and application"
          />
          <ModuleCard
            href={`/orgs/${orgId}/members`}
            icon="♟"
            label="Members"
            description="Team members and role management"
          />
        </div>
      </div>

      {/* Footer note */}
      <p className="text-[11px] text-gray-400 text-center pt-2">
        amanahOS · Amanah Governance Platform · Trusted Giving. Transparent Governance.
      </p>
    </div>
  );
}

/* ── Local components ─────────────────────────────────────────────────────── */

function KpiCard({
  label, value, sub, href, accent,
}: {
  label: string; value: string; sub: string; href: string;
  accent: 'green' | 'amber' | 'red' | 'blue' | 'gray';
}) {
  const accentMap = {
    green: 'border-emerald-200 bg-emerald-50',
    amber: 'border-amber-200 bg-amber-50',
    red:   'border-red-200 bg-red-50',
    blue:  'border-blue-200 bg-blue-50',
    gray:  'border-gray-200 bg-white',
  };
  const valueMap = {
    green: 'text-emerald-700',
    amber: 'text-amber-700',
    red:   'text-red-700',
    blue:  'text-blue-700',
    gray:  'text-gray-700',
  };
  return (
    <Link href={href}
      className={`rounded-lg border p-3 block hover:shadow-sm transition-shadow ${accentMap[accent]}`}>
      <p className="text-[10px] text-gray-500 uppercase tracking-wide font-medium">{label}</p>
      <p className={`text-2xl font-bold mt-1 capitalize ${valueMap[accent]}`}>{value}</p>
      <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>
    </Link>
  );
}

function ModuleCard({
  href, icon, label, description, badge,
}: {
  href: string; icon: string; label: string; description: string; badge?: string;
}) {
  return (
    <Link href={href}
      className="rounded-lg border border-gray-200 bg-white p-4 hover:border-emerald-300 hover:shadow-sm
                 transition-all flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-lg text-gray-600">{icon}</span>
        {badge && (
          <span className="text-[8px] font-medium px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
            {badge}
          </span>
        )}
      </div>
      <div>
        <p className="text-[12px] font-semibold text-gray-800">{label}</p>
        <p className="text-[10px] text-gray-400 mt-0.5 leading-relaxed">{description}</p>
      </div>
    </Link>
  );
}
