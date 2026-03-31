// apps/admin/app/(dashboard)/admin/organizations/page.tsx
// AmanahHub Console — Super Admin: all organizations overview
// Lists every org in the system with status, type, project count, and direct nav links.
// Accessible only to super_admin.

import { redirect }    from 'next/navigation';
import Link            from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { StatusBadge } from '@/components/ui/badge';

export const metadata = { title: 'All Organizations | AmanahHub Console' };

const ORG_TYPE_LABELS: Record<string, string> = {
  ngo:              'NGO',
  mosque_surau:     'Mosque / Surau',
  waqf_institution: 'Waqf Institution',
  zakat_body:       'Zakat Body',
  foundation:       'Foundation',
  cooperative:      'Cooperative',
  other:            'Other',
};

export default async function AllOrganizationsPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: me } = await supabase
    .from('users').select('platform_role')
    .eq('auth_provider_user_id', user.id).single();

  // Only super_admin may access this page
  if (!me || me.platform_role !== 'super_admin') redirect('/dashboard');

  // All organizations
  const { data: orgs } = await supabase
    .from('organizations')
    .select('id, name, org_type, state, onboarding_status, listing_status, created_at, approved_at')
    .order('onboarding_status', { ascending: true })
    .order('name');

  // Project counts per org
  const orgIds = (orgs ?? []).map((o) => o.id);
  const { data: projRows } = orgIds.length
    ? await supabase
        .from('projects')
        .select('organization_id, status')
        .in('organization_id', orgIds)
    : { data: [] };

  // Member counts
  const { data: memberRows } = orgIds.length
    ? await supabase
        .from('org_members')
        .select('organization_id')
        .in('organization_id', orgIds)
        .eq('status', 'active')
    : { data: [] };

  // Latest Amanah scores
  const { data: scoreRows } = orgIds.length
    ? await supabase
        .from('amanah_index_history')
        .select('organization_id, score_value, computed_at')
        .in('organization_id', orgIds)
        .order('computed_at', { ascending: false })
    : { data: [] };

  const scoreByOrg: Record<string, number> = {};
  for (const r of scoreRows ?? []) {
    if (!scoreByOrg[r.organization_id]) {
      scoreByOrg[r.organization_id] = Number(r.score_value);
    }
  }

  function projCount(orgId: string) {
    return (projRows ?? []).filter((p) => p.organization_id === orgId).length;
  }
  function activeProj(orgId: string) {
    return (projRows ?? []).filter((p) => p.organization_id === orgId && p.status === 'active').length;
  }
  function memberCount(orgId: string) {
    return (memberRows ?? []).filter((m) => m.organization_id === orgId).length;
  }

  // Group by status
  const listed    = (orgs ?? []).filter((o) => o.listing_status === 'listed');
  const submitted = (orgs ?? []).filter((o) => o.onboarding_status === 'submitted' && o.listing_status !== 'listed');
  const drafts    = (orgs ?? []).filter((o) => o.onboarding_status === 'draft');
  const other     = (orgs ?? []).filter((o) =>
    !['listed'].includes(o.listing_status) &&
    !['submitted', 'draft'].includes(o.onboarding_status)
  );

  return (
    <div className="max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-[18px] font-semibold text-gray-900">All organizations</h1>
          <p className="text-[11px] text-gray-500 mt-0.5">
            {orgs?.length ?? 0} total · {listed.length} listed · {submitted.length} pending review · {drafts.length} draft
          </p>
        </div>
        <Link href="/onboarding/new" className="btn-primary text-xs px-4 py-2">
          + Register org
        </Link>
      </div>

      {/* Summary stat row */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        <StatBlock label="Total orgs"    value={orgs?.length ?? 0} />
        <StatBlock label="Listed"        value={listed.length}    color="emerald" />
        <StatBlock label="Pending review" value={submitted.length} color="amber" />
        <StatBlock label="Draft"         value={drafts.length}    />
      </div>

      {/* Listed orgs */}
      {listed.length > 0 && (
        <OrgSection
          title="Listed organizations"
          orgs={listed}
          projCount={projCount}
          activeProj={activeProj}
          memberCount={memberCount}
          scoreByOrg={scoreByOrg}
        />
      )}

      {/* Pending review */}
      {submitted.length > 0 && (
        <OrgSection
          title="Pending review"
          orgs={submitted}
          projCount={projCount}
          activeProj={activeProj}
          memberCount={memberCount}
          scoreByOrg={scoreByOrg}
        />
      )}

      {/* Other approved non-listed */}
      {other.length > 0 && (
        <OrgSection
          title="Other"
          orgs={other}
          projCount={projCount}
          activeProj={activeProj}
          memberCount={memberCount}
          scoreByOrg={scoreByOrg}
        />
      )}

      {/* Drafts */}
      {drafts.length > 0 && (
        <OrgSection
          title="Drafts (incomplete onboarding)"
          orgs={drafts}
          projCount={projCount}
          activeProj={activeProj}
          memberCount={memberCount}
          scoreByOrg={scoreByOrg}
          dim
        />
      )}
    </div>
  );
}

function OrgSection({
  title, orgs, projCount, activeProj, memberCount, scoreByOrg, dim,
}: {
  title:       string;
  orgs:        any[];
  projCount:   (id: string) => number;
  activeProj:  (id: string) => number;
  memberCount: (id: string) => number;
  scoreByOrg:  Record<string, number>;
  dim?:        boolean;
}) {
  return (
    <div className={`mb-5 ${dim ? 'opacity-60' : ''}`}>
      <p className="sec-label">{title} ({orgs.length})</p>
      <div className="card overflow-hidden">
        <table className="w-full text-[12px] border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-4 py-2.5 text-[10px] text-gray-500 font-medium w-[240px]">Organization</th>
              <th className="text-left px-3 py-2.5 text-[10px] text-gray-500 font-medium">Type · State</th>
              <th className="text-center px-3 py-2.5 text-[10px] text-gray-500 font-medium">Score</th>
              <th className="text-center px-3 py-2.5 text-[10px] text-gray-500 font-medium">Projects</th>
              <th className="text-center px-3 py-2.5 text-[10px] text-gray-500 font-medium">Members</th>
              <th className="text-left px-3 py-2.5 text-[10px] text-gray-500 font-medium">Status</th>
              <th className="px-3 py-2.5"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {orgs.map((org) => {
              const pc    = projCount(org.id);
              const ap    = activeProj(org.id);
              const mc    = memberCount(org.id);
              const score = scoreByOrg[org.id];

              return (
                <tr key={org.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <Link href={`/orgs/${org.id}`}
                      className="font-medium text-gray-900 hover:text-emerald-700 transition-colors block truncate max-w-[220px]">
                      {org.name}
                    </Link>
                  </td>
                  <td className="px-3 py-3 text-gray-500">
                    {org.org_type ? ORG_TYPE_LABELS[org.org_type] ?? org.org_type : '—'}
                    {org.state ? ` · ${org.state}` : ''}
                  </td>
                  <td className="px-3 py-3 text-center">
                    {score !== undefined
                      ? <span className={`font-semibold ${
                          score >= 85 ? 'text-violet-700' :
                          score >= 70 ? 'text-amber-600'  :
                          score >= 55 ? 'text-gray-600'   : 'text-gray-400'
                        }`}>{score.toFixed(1)}</span>
                      : <span className="text-gray-300">—</span>
                    }
                  </td>
                  <td className="px-3 py-3 text-center">
                    <Link href={`/orgs/${org.id}/projects`}
                      className="text-emerald-700 hover:text-emerald-800 font-medium hover:underline">
                      {pc > 0 ? `${ap} active / ${pc}` : 'None'}
                    </Link>
                  </td>
                  <td className="px-3 py-3 text-center text-gray-600">
                    {mc}
                  </td>
                  <td className="px-3 py-3">
                    <StatusBadge status={org.onboarding_status} />
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      <Link href={`/orgs/${org.id}/projects`}
                        className="text-[10px] text-emerald-600 hover:text-emerald-800 whitespace-nowrap">
                        Projects →
                      </Link>
                      {org.onboarding_status === 'submitted' && (
                        <Link href={`/review/onboarding/${org.id}`}
                          className="text-[10px] text-amber-600 hover:text-amber-800 whitespace-nowrap">
                          Review →
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatBlock({ label, value, color }: {
  label: string; value: number; color?: 'emerald' | 'amber';
}) {
  return (
    <div className="stat-blk">
      <div className={`stat-val ${
        color === 'emerald' ? 'text-emerald-700' :
        color === 'amber'   ? 'text-amber-600'   : 'text-gray-700'
      }`}>{value}</div>
      <div className="stat-lbl">{label}</div>
    </div>
  );
}
