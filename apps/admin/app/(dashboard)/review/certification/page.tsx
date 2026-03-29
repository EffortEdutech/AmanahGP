// apps/admin/app/(dashboard)/review/certification/page.tsx
// AmanahHub Console — Reviewer: Certification application queue

import { redirect }          from 'next/navigation';
import { createClient }      from '@/lib/supabase/server';
import { isReviewerOrAbove } from '@agp/config';
import { StatusBadge }       from '@/components/ui/status-badge';

export const metadata = { title: 'Certification Queue | AmanahHub Console' };

export default async function CertificationQueuePage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: me } = await supabase
    .from('users').select('platform_role')
    .eq('auth_provider_user_id', user.id).single();

  if (!me || !isReviewerOrAbove(me.platform_role)) redirect('/dashboard');

  const { data: apps } = await supabase
    .from('certification_applications')
    .select(`
      id, status, submitted_at, reviewer_comment,
      organizations ( id, name, org_type, state )
    `)
    .in('status', ['submitted', 'under_review'])
    .order('submitted_at', { ascending: true });

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Certification queue</h1>
        <p className="mt-1 text-sm text-gray-500">
          {apps?.length
            ? `${apps.length} application${apps.length !== 1 ? 's' : ''} awaiting evaluation`
            : 'No pending applications'}
        </p>
      </div>

      {apps?.length ? (
        <div className="space-y-3">
          {apps.map((app) => {
            const org = Array.isArray(app.organizations) ? app.organizations[0] : app.organizations;
            return (
              <a key={app.id} href={`/review/certification/${app.id}`}
                className="block px-5 py-4 rounded-lg border border-gray-200 bg-white
                           hover:border-emerald-200 hover:bg-emerald-50/20 transition-colors group">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 group-hover:text-emerald-800">
                      {org?.name}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {org?.org_type?.replace('_', ' ')} · {org?.state}
                    </p>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <StatusBadge status={app.status} />
                    <p className="text-xs text-gray-400 mt-1">
                      {app.submitted_at
                        ? new Date(app.submitted_at).toLocaleDateString('en-MY')
                        : '—'}
                    </p>
                  </div>
                </div>
              </a>
            );
          })}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-gray-300 px-6 py-12 text-center">
          <p className="text-sm text-gray-400">Queue is empty.</p>
        </div>
      )}
    </div>
  );
}
