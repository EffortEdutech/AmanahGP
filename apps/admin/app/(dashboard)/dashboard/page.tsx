// apps/admin/app/(dashboard)/dashboard/page.tsx
// AmanahHub Console — Multi-org dashboard (Sprint 9c)
// Fix: super_admin/reviewer uses service client to query ALL orgs directly.
// Org members query via org_members join (as before).

import { redirect }                          from 'next/navigation';
import Link                                  from 'next/link';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { StatusBadge }                       from '@/components/ui/badge';
import { ScoreRing, scoreTier, tierLabel }   from '@/components/ui/score-ring';

export const metadata = { title: 'Dashboard | AmanahHub Console' };

const ORG_TYPE_SHORT: Record<string, string> = {
  ngo: 'NGO', mosque_surau: 'Mosque/Surau', waqf_institution: 'Waqf Institution',
  zakat_body: 'Zakat Body', foundation: 'Foundation', cooperative: 'Cooperative', other: 'Other',
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const svc      = createServiceClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: me } = await supabase
    .from('current_user_profile')
    .select('id, display_name, platform_role')
    .single();
  if (!me) redirect('/login');

  const isSuperAdmin  = me.platform_role === 'super_admin';
  const isReviewer    = ['reviewer', 'scholar', 'super_admin'].includes(me.platform_role);
  const isPrivileged  = isSuperAdmin || ['reviewer', 'scholar'].includes(me.platform_role);

  // ── Fetch orgs ───────────────────────────────────────────────
  type OrgRow = {
    id: string; name: string; org_type: string | null;
    state: string | null; onboarding_status: string; listing_status: string;
    org_role?: string;
  };

  let orgs: OrgRow[] = [];

  if (isPrivileged) {
    // Service client: bypass RLS — guaranteed to return ALL orgs
    const { data } = await svc
      .from('organizations')
      .select('id, name, org_type, state, onboarding_status, listing_status')
      .order('name');
    orgs = (data ?? []).map((o) => ({ ...o, org_role: me.platform_role }));
  } else {
    // Org member: only their orgs via RPC
    const { data: memberships } = await supabase
      .from('org_members')
      .select(`org_role, organizations(id, name, org_type, state, onboarding_status, listing_status)`)
      .eq('user_id', me.id)
      .eq('status', 'active');

    orgs = (memberships ?? []).map((m) => {
      const o = Array.isArray(m.organizations) ? m.organizations[0] : m.organizations;
      return { ...(o as any), org_role: m.org_role };
    }).filter(Boolean);
  }

  const orgIds = orgs.map((o) => o.id);

  // ── Per-org stats via service client ─────────────────────────
  const [scoreRows, pendingRows, verifiedRows] = await Promise.all([
    orgIds.length
      ? svc.from('amanah_index_history')
           .select('organization_id, score_value, computed_at')
           .in('organization_id', orgIds)
           .order('computed_at', { ascending: false })
      : Promise.resolve({ data: [] }),

    orgIds.length
      ? svc.from('project_reports')
           .select('organization_id')
           .in('organization_id', orgIds)
           .eq('submission_status', 'submitted')
           .eq('verification_status', 'pending')
      : Promise.resolve({ data: [] }),

    orgIds.length
      ? svc.from('project_reports')
           .select('organization_id')
           .in('organization_id', orgIds)
           .eq('verification_status', 'verified')
      : Promise.resolve({ data: [] }),
  ]);

  // Latest score per org
  const scoreByOrg: Record<string, number> = {};
  for (const r of scoreRows.data ?? []) {
    if (!scoreByOrg[r.organization_id]) {
      scoreByOrg[r.organization_id] = Number(r.score_value);
    }
  }
  const pendingByOrg: Record<string, number> = {};
  for (const r of pendingRows.data ?? []) {
    pendingByOrg[r.organization_id] = (pendingByOrg[r.organization_id] ?? 0) + 1;
  }
  const verifiedByOrg: Record<string, number> = {};
  for (const r of verifiedRows.data ?? []) {
    verifiedByOrg[r.organization_id] = (verifiedByOrg[r.organization_id] ?? 0) + 1;
  }

  // ── Reviewer queue counts (service client) ───────────────────
  let onboardingCount = 0, reportsCount = 0, certCount = 0;
  if (isReviewer) {
    const [oc, rc, cc] = await Promise.all([
      svc.from('organizations').select('*', { count: 'exact', head: true }).eq('onboarding_status', 'submitted'),
      svc.from('project_reports').select('*', { count: 'exact', head: true }).eq('submission_status', 'submitted').eq('verification_status', 'pending'),
      svc.from('certification_applications').select('*', { count: 'exact', head: true }).in('status', ['submitted', 'under_review']),
    ]);
    onboardingCount = oc.count ?? 0;
    reportsCount    = rc.count ?? 0;
    certCount       = cc.count ?? 0;
  }

  // ── Recent activity (service client for super_admin) ─────────
  const { data: activity } = orgIds.length
    ? await (isPrivileged ? svc : supabase)
        .from('audit_logs')
        .select('id, action, organization_id, occurred_at, actor_role')
        .in('organization_id', orgIds)
        .order('occurred_at', { ascending: false })
        .limit(8)
    : { data: [] };

  const orgNameById = Object.fromEntries(orgs.map((o) => [o.id, o.name]));
  const greeting    = `Assalamualaikum, ${me.display_name?.split(' ')[0] ?? 'there'}`;

  return (
    <div className="max-w-5xl">

      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-[18px] font-semibold text-gray-900">{greeting}</h1>
          <p className="text-[11px] text-gray-500 mt-0.5">
            AmanahHub Console
            {isSuperAdmin && ` — Platform Admin · ${orgs.length} organizations`}
            {!isSuperAdmin && orgs.length > 0 && ` — managing ${orgs.length} organization${orgs.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isSuperAdmin && (
            <Link href="/admin/organizations" className="btn-secondary text-xs px-3 py-1.5">
              All orgs table
            </Link>
          )}
          <Link href="/onboarding/new" className="btn-primary text-xs px-4 py-2">
            + Register org
          </Link>
        </div>
      </div>

      {/* Reviewer stat blocks */}
      {isReviewer && (
        <div className="grid grid-cols-3 gap-3 mb-5">
          <StatLink value={onboardingCount} label="Onboarding pending" href="/review/onboarding" warn={onboardingCount > 0} />
          <StatLink value={reportsCount}    label="Reports pending"    href="/review/onboarding" warn={reportsCount > 0} />
          <StatLink value={certCount}       label="Certification pending" href="/review/certification" purple={certCount > 0} />
        </div>
      )}

      {/* All organizations */}
      {orgs.length > 0 ? (
        <div className="mb-5">
          <p className="sec-label">Your organizations</p>
          <div className="grid grid-cols-2 gap-3">
            {orgs.map((org) => {
              const score    = scoreByOrg[org.id];
              const pending  = pendingByOrg[org.id]  ?? 0;
              const verified = verifiedByOrg[org.id] ?? 0;

              return (
                <Link key={org.id} href={`/orgs/${org.id}`}
                  className="card p-4 block hover:border-emerald-200 hover:shadow-sm transition-all">
                  <div className="flex items-start gap-3">
                    {score !== undefined ? (
                      <ScoreRing score={score} size="sm" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-100 ring-1 ring-gray-200
                                      flex items-center justify-center text-[10px] text-gray-400
                                      flex-shrink-0">—</div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-gray-900 truncate">{org.name}</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">
                        {org.org_type ? ORG_TYPE_SHORT[org.org_type] ?? org.org_type : ''}
                        {org.state ? ` · ${org.state}` : ''}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        <StatusBadge status={org.onboarding_status} />
                        {org.listing_status === 'listed' && <StatusBadge status="listed" />}
                        {score !== undefined && (
                          <span className={`badge ${
                            scoreTier(score) === 'platinum' ? 'badge-purple' :
                            scoreTier(score) === 'gold'     ? 'badge-amber'  : 'badge-gray'
                          }`}>
                            {tierLabel(scoreTier(score))} Amanah
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {org.onboarding_status === 'approved' && (
                    <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-gray-100">
                      <MiniStat label="Score"    value={score !== undefined ? score.toFixed(1) : '—'} />
                      <MiniStat label="Verified" value={String(verified)} />
                      <MiniStat label="Pending"  value={String(pending)} warn={pending > 0} />
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="card p-8 text-center mb-5">
          <p className="text-[14px] font-medium text-gray-700 mb-2">No organizations yet.</p>
          <p className="text-[12px] text-gray-400 mb-4">
            Register your first organization to begin the transparency journey.
          </p>
          <Link href="/onboarding/new" className="btn-primary px-6 py-2.5">
            Register your organization
          </Link>
        </div>
      )}

      {/* Reviewer tools */}
      {isReviewer && (
        <div className="a-card mb-5">
          <p className="text-[11px] font-medium text-amber-900 mb-3">Reviewer tools</p>
          <div className="flex flex-wrap gap-4">
            <Link href="/review/onboarding"    className="text-[12px] text-amber-800 hover:text-amber-900 underline">Onboarding queue ({onboardingCount})</Link>
            <Link href="/review/onboarding"    className="text-[12px] text-amber-800 hover:text-amber-900 underline">Report queue ({reportsCount})</Link>
            <Link href="/review/certification" className="text-[12px] text-amber-800 hover:text-amber-900 underline">Certification queue ({certCount})</Link>
            <Link href="/review/scholar"       className="text-[12px] text-amber-800 hover:text-amber-900 underline">Scholar notes</Link>
            <Link href="/review/amanah"        className="text-[12px] text-amber-800 hover:text-amber-900 underline">Amanah score</Link>
          </div>
        </div>
      )}

      {/* Recent activity */}
      {(activity?.length ?? 0) > 0 && (
        <div className="card p-4">
          <p className="sec-label">Recent activity</p>
          <div className="tl">
            {activity!.map((log) => (
              <div key={log.id} className="tli">
                <p className="text-[12px] font-medium text-gray-800">
                  {formatAction(log.action)}
                </p>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  {new Date(log.occurred_at).toLocaleString('en-MY', {
                    day: 'numeric', month: 'short', year: 'numeric',
                    hour: '2-digit', minute: '2-digit',
                  })}
                  {log.organization_id && orgNameById[log.organization_id]
                    ? ` · ${orgNameById[log.organization_id]}`
                    : ''}
                  {log.actor_role ? ` · ${log.actor_role}` : ''}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}

function StatLink({ value, label, href, warn, purple }: {
  value: number; label: string; href: string; warn?: boolean; purple?: boolean;
}) {
  return (
    <Link href={href} className="stat-blk block hover:border-emerald-200 transition-colors">
      <div className={`stat-val ${purple ? 'text-violet-700' : warn ? 'text-amber-600' : 'text-gray-400'}`}>
        {value}
      </div>
      <div className="stat-lbl">{label}</div>
    </Link>
  );
}

function MiniStat({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="text-center">
      <p className={`text-[13px] font-semibold ${warn ? 'text-amber-600' : 'text-gray-800'}`}>{value}</p>
      <p className="text-[9px] text-gray-400 mt-0.5">{label}</p>
    </div>
  );
}

function formatAction(action: string) {
  const map: Record<string, string> = {
    ORG_APPROVED: 'Organization approved', ORG_REJECTED: 'Organization rejected',
    ORG_SUBMITTED: 'Onboarding submitted', PROJECT_CREATED: 'Project created',
    PROJECT_ARCHIVED: 'Project archived', REPORT_CREATED: 'Report draft created',
    REPORT_SUBMITTED: 'Report submitted', REPORT_VERIFIED: 'Report verified',
    REPORT_REJECTED: 'Report rejected', CERTIFICATION_APPROVED: 'Certification approved',
    CERTIFICATION_REJECTED: 'Certification rejected', MEMBER_INVITED: 'Member invited',
    MEMBER_JOINED: 'Member joined', MANUAL_RECALC: 'Amanah score recalculated',
    CTCF_EVALUATED: 'CTCF evaluation submitted',
  };
  return map[action] ?? action.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}
