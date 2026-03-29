// apps/admin/app/(dashboard)/dashboard/page.tsx
// AmanahHub Console — Dashboard home

import { createClient } from '@/lib/supabase/server';
import { StatusBadge }  from '@/components/ui/status-badge';
import { redirect }     from 'next/navigation';

export const metadata = { title: 'Dashboard | AmanahHub Console' };

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('current_user_profile')
    .select('display_name, platform_role')
    .single();

  const { data: orgs } = await supabase.rpc('my_organizations');

  const firstName = profile?.display_name?.split(' ')[0] ?? 'there';
  const isReviewer = ['reviewer', 'super_admin'].includes(profile?.platform_role ?? '');

  return (
    <div className="max-w-3xl">
      {/* Welcome */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">
          Assalamualaikum, {firstName}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Welcome to AmanahHub Console — Amanah Governance Platform.
        </p>
      </div>

      {/* Organizations */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-gray-800">Your organizations</h2>
          <a href="/onboarding/new"
             className="text-sm font-medium text-emerald-700 hover:text-emerald-800">
            + Register organization
          </a>
        </div>

        {orgs?.length ? (
          <div className="space-y-3">
            {orgs.map((org) => (
              <a
                key={org.organization_id}
                href={`/orgs/${org.organization_id}`}
                className="flex items-center justify-between px-5 py-4 rounded-lg border
                           border-gray-200 bg-white hover:border-emerald-200 hover:bg-emerald-50/30
                           transition-colors group"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900 group-hover:text-emerald-800">
                    {org.org_name}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Your role: {org.org_role.replace('org_', '')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={org.onboarding_status} />
                  {org.listing_status === 'listed' && (
                    <StatusBadge status="listed" />
                  )}
                </div>
              </a>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-gray-300 px-6 py-10 text-center">
            <p className="text-sm text-gray-500 mb-3">
              You have not registered any organizations yet.
            </p>
            <a
              href="/onboarding/new"
              className="inline-flex items-center px-4 py-2 rounded-md text-sm font-medium
                         text-white bg-emerald-700 hover:bg-emerald-800 transition-colors"
            >
              Register your organization
            </a>
          </div>
        )}
      </section>

      {/* Reviewer quick links */}
      {isReviewer && (
        <section className="rounded-lg border border-amber-200 bg-amber-50 px-5 py-4">
          <h2 className="text-sm font-semibold text-amber-900 mb-3">Reviewer tools</h2>
          <div className="flex flex-wrap gap-3">
            <a href="/review/onboarding"
               className="text-sm font-medium text-amber-800 hover:text-amber-900 underline">
              Onboarding queue
            </a>
            <a href="/review/reports"
               className="text-sm font-medium text-amber-800 hover:text-amber-900 underline">
              Report queue
            </a>
            <a href="/review/certification"
               className="text-sm font-medium text-amber-800 hover:text-amber-900 underline">
              Certification queue
            </a>
          </div>
        </section>
      )}
    </div>
  );
}
