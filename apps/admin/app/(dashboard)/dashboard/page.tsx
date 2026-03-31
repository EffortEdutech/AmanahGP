// apps/admin/app/(dashboard)/dashboard/page.tsx
// AmanahHub Console — Dashboard (Sprint 8 UI uplift)
// Matches UAT s-a-dashboard: stat blocks + org list item + quick actions + activity timeline

import { redirect }     from 'next/navigation';
import Link             from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { StatusBadge }  from '@/components/ui/badge';
import { scoreTier, tierLabel } from '@/components/ui/score-ring';

export const metadata = { title: 'Dashboard | AmanahHub Console' };

const ORG_TYPE_SHORT: Record<string, string> = {
  ngo: 'NGO', mosque_surau: 'Mosque/Surau', waqf_institution: 'Waqf Institution',
  zakat_body: 'Zakat Body', foundation: 'Foundation', cooperative: 'Cooperative', other: 'Other',
};

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: me } = await supabase
    .from('users')
    .select('id, display_name, platform_role')
    .eq('auth_provider_user_id', user.id)
    .single();

  if (!me) redirect('/login');

  const isReviewer = ['reviewer', 'scholar', 'super_admin'].includes(me.platform_role);

  // Orgs this user belongs to
  const { data: memberships } = await supabase
    .from('org_members')
    .select(`
      org_role,
      organizations (
        id, name, org_type, state, onboarding_status, listing_status
      )
    `)
    .eq('user_id', me.id)
    .eq('status', 'active')
    .limit(1);

  const firstMembership = memberships?.[0];
  const org = firstMembership
    ? (Array.isArray(firstMembership.organizations)
        ? firstMembership.organizations[0]
        : firstMembership.organizations)
    : null;

  let verifiedReports = 0;
  let awaitingReview  = 0;
  let latestScore: number | null = null;

  if (org) {
    const { count: vr } = await supabase
      .from('project_reports')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', org.id)
      .eq('verification_status', 'verified');
    verifiedReports = vr ?? 0;

    const { count: ar } = await supabase
      .from('project_reports')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', org.id)
      .eq('submission_status', 'submitted')
      .eq('verification_status', 'pending');
    awaitingReview = ar ?? 0;

    const { data: scoreRow } = await supabase
      .from('amanah_index_history')
      .select('score_value')
      .eq('organization_id', org.id)
      .order('computed_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    latestScore = scoreRow ? Number(scoreRow.score_value) : null;
  }

  // Recent audit events
  const { data: auditLogs } = org
    ? await supabase
        .from('audit_logs')
        .select('id, action, entity_table, occurred_at, actor_role, metadata')
        .eq('organization_id', org.id)
        .order('occurred_at', { ascending: false })
        .limit(6)
    : { data: [] };

  // Reviewer queue counts
  let onboardingCount = 0;
  let reportsCount    = 0;
  let certCount       = 0;

  if (isReviewer) {
    const { count: oc } = await supabase
      .from('organizations')
      .select('*', { count: 'exact', head: true })
      .eq('onboarding_status', 'submitted');
    onboardingCount = oc ?? 0;

    const { count: rc } = await supabase
      .from('project_reports')
      .select('*', { count: 'exact', head: true })
      .eq('submission_status', 'submitted')
      .eq('verification_status', 'pending');
    reportsCount = rc ?? 0;

    const { count: cc } = await supabase
      .from('certification_applications')
      .select('*', { count: 'exact', head: true })
      .in('status', ['submitted', 'under_review']);
    certCount = cc ?? 0;
  }

  const greeting = `Assalamualaikum, ${me.display_name?.split(' ')[0] ?? 'there'}`;

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <h1 className="text-[18px] font-semibold text-gray-900 mb-0.5">{greeting}</h1>
      <p className="text-[11px] text-gray-500 mb-4">
        AmanahHub Console{org ? ` — ${org.name}` : ''}
      </p>

      {/* Stat blocks */}
      {org ? (
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="stat-blk">
            <div className={`stat-val ${latestScore ? (scoreTier(latestScore) === 'platinum' ? 'text-violet-700' : scoreTier(latestScore) === 'gold' ? 'text-amber-600' : 'text-emerald-700') : 'text-gray-400'}`}>
              {latestScore !== null ? latestScore.toFixed(1) : '—'}
            </div>
            <div className="stat-lbl">
              {latestScore !== null ? `${tierLabel(scoreTier(latestScore))} Amanah` : 'Amanah score'}
            </div>
          </div>
          <div className="stat-blk">
            <div className="stat-val text-gray-900">{verifiedReports}</div>
            <div className="stat-lbl">Verified reports</div>
          </div>
          <div className="stat-blk">
            <div className={`stat-val ${awaitingReview > 0 ? 'text-amber-600' : 'text-gray-400'}`}>
              {awaitingReview}
            </div>
            <div className="stat-lbl">Awaiting review</div>
          </div>
        </div>
      ) : isReviewer ? (
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="stat-blk">
            <div className={`stat-val ${onboardingCount > 0 ? 'text-amber-600' : 'text-gray-400'}`}>{onboardingCount}</div>
            <div className="stat-lbl">Onboarding</div>
          </div>
          <div className="stat-blk">
            <div className={`stat-val ${reportsCount > 0 ? 'text-amber-600' : 'text-gray-400'}`}>{reportsCount}</div>
            <div className="stat-lbl">Reports pending</div>
          </div>
          <div className="stat-blk">
            <div className={`stat-val ${certCount > 0 ? 'text-violet-700' : 'text-gray-400'}`}>{certCount}</div>
            <div className="stat-lbl">Certification</div>
          </div>
        </div>
      ) : null}

      {/* 2-col body */}
      <div className="grid grid-cols-2 gap-4 mb-5">

        {/* Left: org context or no-org prompt */}
        <div>
          <p className="sec-label">Organization</p>
          {org ? (
            <Link href={`/orgs/${org.id}`} className="list-item">
              <div className="avatar avatar-green select-none">
                {org.name.slice(0,2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-medium text-gray-900 truncate">{org.name}</p>
                <p className="text-[10px] text-gray-400 truncate">
                  {firstMembership?.org_role} · {org.state ?? ''}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <StatusBadge status={org.onboarding_status} />
                {org.listing_status === 'listed' && (
                  <StatusBadge status="listed" />
                )}
              </div>
            </Link>
          ) : (
            <div className="card p-4 text-center">
              <p className="text-[12px] text-gray-500 mb-3">
                No organization yet. Register one to begin.
              </p>
              <Link href="/onboarding/new" className="btn-primary text-xs px-4 py-2">
                Register organization
              </Link>
            </div>
          )}
        </div>

        {/* Right: quick actions or reviewer tools */}
        <div>
          <p className="sec-label">Quick actions</p>
          <div className="space-y-1.5">
            {org ? (
              <>
                <Link href={`/orgs/${org.id}/projects`}    className="btn-secondary w-full justify-start text-xs py-2">+ New project</Link>
                <Link href={`/orgs/${org.id}/financials`}  className="btn-secondary w-full justify-start text-xs py-2">+ Submit financial snapshot</Link>
                <Link href={`/orgs/${org.id}/certification`} className="btn-secondary w-full justify-start text-xs py-2">Certification status</Link>
              </>
            ) : isReviewer ? (
              <>
                <Link href="/review/onboarding"   className="btn-secondary w-full justify-start text-xs py-2">Onboarding queue ({onboardingCount})</Link>
                <Link href="/review/reports"      className="btn-secondary w-full justify-start text-xs py-2">Reports queue ({reportsCount})</Link>
                <Link href="/review/certification" className="btn-secondary w-full justify-start text-xs py-2">Certification queue ({certCount})</Link>
              </>
            ) : (
              <Link href="/onboarding/new" className="btn-secondary w-full justify-start text-xs py-2">Register your organization</Link>
            )}
          </div>
        </div>
      </div>

      {/* Activity timeline */}
      {(auditLogs?.length ?? 0) > 0 && (
        <div className="card p-4">
          <p className="sec-label">Recent activity</p>
          <div className="tl">
            {auditLogs!.map((log) => (
              <div key={log.id} className="tli">
                <p className="text-[12px] font-medium text-gray-800">
                  {formatAction(log.action)}
                </p>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  {new Date(log.occurred_at).toLocaleString('en-MY', {
                    day: 'numeric', month: 'short', year: 'numeric',
                    hour: '2-digit', minute: '2-digit',
                  })}
                  {log.actor_role ? ` · ${log.actor_role}` : ''}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reviewer section */}
      {isReviewer && (
        <div className="mt-4 a-card">
          <p className="text-[11px] font-medium text-amber-900 mb-3">Reviewer tools</p>
          <div className="flex flex-wrap gap-3">
            <Link href="/review/onboarding"   className="text-[12px] font-medium text-amber-800 hover:text-amber-900 underline">Onboarding queue</Link>
            <Link href="/review/reports"      className="text-[12px] font-medium text-amber-800 hover:text-amber-900 underline">Report queue</Link>
            <Link href="/review/certification" className="text-[12px] font-medium text-amber-800 hover:text-amber-900 underline">Certification queue</Link>
          </div>
        </div>
      )}
    </div>
  );
}

function formatAction(action: string) {
  return action
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
