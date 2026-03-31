// apps/admin/app/(dashboard)/review/onboarding/page.tsx
// AmanahHub Console — All review queues (Sprint 8 UI uplift)
// Matches UAT s-r-queues: 3 stat blocks + onboarding list + reports list + cert list

import { redirect }    from 'next/navigation';
import Link            from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { isReviewerOrAbove } from '@agp/config';
import { StatusBadge } from '@/components/ui/badge';

export const metadata = { title: 'Review Queues | AmanahHub Console' };

const ORG_TYPE_SHORT: Record<string, string> = {
  ngo: 'NGO', mosque_surau: 'Mosque/Surau', waqf_institution: 'Waqf Institution',
  zakat_body: 'Zakat Body', foundation: 'Foundation', cooperative: 'Cooperative',
};

function initials(name: string) {
  return name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
}

export default async function AllQueuesPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: me } = await supabase
    .from('users').select('display_name, platform_role')
    .eq('auth_provider_user_id', user.id).single();
  if (!me || !isReviewerOrAbove(me.platform_role)) redirect('/dashboard');

  // Onboarding queue
  const { data: onboardingOrgs } = await supabase
    .from('organizations')
    .select('id, name, org_type, state, onboarding_submitted_at')
    .eq('onboarding_status', 'submitted')
    .order('onboarding_submitted_at', { ascending: true });

  // Reports queue
  const { data: pendingReports } = await supabase
    .from('project_reports')
    .select(`
      id, title, submitted_at,
      organizations ( id, name )
    `)
    .eq('submission_status', 'submitted')
    .eq('verification_status', 'pending')
    .order('submitted_at', { ascending: true })
    .limit(10);

  // Certification queue
  const { data: certApps } = await supabase
    .from('certification_applications')
    .select(`
      id, status, submitted_at,
      organizations ( id, name, org_type, state )
    `)
    .in('status', ['submitted', 'under_review'])
    .order('submitted_at', { ascending: true });

  const onboardingCount = onboardingOrgs?.length ?? 0;
  const reportsCount    = pendingReports?.length ?? 0;
  const certCount       = certApps?.length ?? 0;

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <h1 className="text-[18px] font-semibold text-gray-900 mb-0.5">Review queues</h1>
      <p className="text-[11px] text-gray-500 mb-4">
        {me.display_name} · {me.platform_role}
      </p>

      {/* Stat blocks */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="stat-blk">
          <div className={`stat-val ${onboardingCount > 0 ? 'text-amber-600' : 'text-gray-400'}`}>
            {onboardingCount}
          </div>
          <div className="stat-lbl">Onboarding</div>
        </div>
        <div className="stat-blk">
          <div className={`stat-val ${reportsCount > 0 ? 'text-amber-600' : 'text-gray-400'}`}>
            {reportsCount}
          </div>
          <div className="stat-lbl">Reports pending</div>
        </div>
        <div className="stat-blk">
          <div className={`stat-val ${certCount > 0 ? 'text-violet-700' : 'text-gray-400'}`}>
            {certCount}
          </div>
          <div className="stat-lbl">Certification</div>
        </div>
      </div>

      {/* Onboarding queue */}
      <p className="sec-label">Onboarding queue</p>
      {onboardingOrgs?.length ? (
        <div className="space-y-2 mb-5">
          {onboardingOrgs.map((org) => (
            <Link
              key={org.id}
              href={`/review/onboarding/${org.id}`}
              className="list-item"
            >
              <div className="avatar avatar-amber select-none">{initials(org.name)}</div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-medium text-gray-900 truncate">{org.name}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  {org.org_type ? ORG_TYPE_SHORT[org.org_type] ?? org.org_type : ''}
                  {org.state ? ` · ${org.state}` : ''}
                  {org.onboarding_submitted_at
                    ? ` · Submitted ${new Date(org.onboarding_submitted_at).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })}`
                    : ''}
                </p>
              </div>
              <StatusBadge status="submitted" />
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-[11px] text-gray-400 mb-4">No pending onboarding submissions.</p>
      )}

      {/* Reports queue */}
      <p className="sec-label">Reports queue</p>
      {pendingReports?.length ? (
        <div className="space-y-2 mb-5">
          {pendingReports.map((r) => {
            const org = Array.isArray(r.organizations) ? r.organizations[0] : r.organizations;
            return (
              <Link
                key={r.id}
                href={`/review/reports/${r.id}`}
                className="list-item"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-medium text-gray-900 truncate">{r.title}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    {org?.name ?? ''}
                    {r.submitted_at
                      ? ` · Submitted ${new Date(r.submitted_at).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })}`
                      : ''}
                  </p>
                </div>
                <StatusBadge status="pending" />
              </Link>
            );
          })}
        </div>
      ) : (
        <p className="text-[11px] text-gray-400 mb-4">No reports awaiting review.</p>
      )}

      {/* Certification queue */}
      <p className="sec-label">Certification queue</p>
      {certApps?.length ? (
        <div className="space-y-2">
          {certApps.map((app) => {
            const org = Array.isArray(app.organizations) ? app.organizations[0] : app.organizations;
            return (
              <Link
                key={app.id}
                href={`/review/certification/${app.id}`}
                className="list-item"
              >
                <div className="avatar avatar-purple select-none">
                  {org ? initials(org.name) : '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-medium text-gray-900 truncate">{org?.name}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    {app.submitted_at
                      ? `Application submitted ${new Date(app.submitted_at).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })}`
                      : 'Application pending'}
                  </p>
                </div>
                <StatusBadge status={app.status} />
              </Link>
            );
          })}
        </div>
      ) : (
        <p className="text-[11px] text-gray-400">No certification applications pending.</p>
      )}
    </div>
  );
}
