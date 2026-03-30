// apps/admin/app/(dashboard)/review/onboarding/page.tsx
// AmanahHub Console — Reviewer: onboarding queue

import { redirect }     from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { StatusBadge }  from '@/components/ui/status-badge';
import { isReviewerOrAbove } from '@agp/config';

export const metadata = { title: 'Onboarding Queue | AmanahHub Console' };

export default async function OnboardingQueuePage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: me } = await supabase
    .from('users').select('platform_role')
    .eq('auth_provider_user_id', user.id).single();

  if (!me || !isReviewerOrAbove(me.platform_role)) redirect('/dashboard');

  const { data: orgs } = await supabase
    .from('organizations')
    .select(`
      id, name, org_type, state, oversight_authority, fund_types,
      onboarding_status, onboarding_submitted_at, summary
    `)
    .eq('onboarding_status', 'submitted')
    .order('onboarding_submitted_at', { ascending: true });

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Onboarding queue</h1>
        <p className="mt-1 text-sm text-gray-500">
          {orgs?.length
            ? `${orgs.length} organization${orgs.length !== 1 ? 's' : ''} awaiting review`
            : 'No pending organizations'}
        </p>
      </div>

      {orgs?.length ? (
        <div className="space-y-3">
          {orgs.map((org) => (
            <a key={org.id} href={`/review/onboarding/${org.id}`}
              className="block px-5 py-4 rounded-lg border border-gray-200 bg-white
                         hover:border-emerald-200 hover:bg-emerald-50/20 transition-colors group">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 group-hover:text-emerald-800">
                    {org.name}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {org.org_type?.replace('_', ' ')} ·{' '}
                    {org.state} ·{' '}
                    {org.oversight_authority}
                  </p>
                  {org.fund_types?.length > 0 && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      Funds: {(org.fund_types as string[]).join(', ')}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-1 line-clamp-1">{org.summary}</p>
                </div>
                <div className="flex-shrink-0 text-right">
                  <StatusBadge status={org.onboarding_status} />
                  <p className="text-xs text-gray-400 mt-1">
                    {org.onboarding_submitted_at
                      ? new Date(org.onboarding_submitted_at).toLocaleDateString('en-MY')
                      : '—'}
                  </p>
                </div>
              </div>
            </a>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-gray-300 px-6 py-12 text-center">
          <p className="text-sm text-gray-400">Queue is empty. No pending submissions.</p>
        </div>
      )}
    </div>
  );
}
