// apps/admin/app/(dashboard)/review/reports/page.tsx
// AmanahHub Console — Reviewer: reports queue

import { redirect }          from 'next/navigation';
import { createClient }      from '@/lib/supabase/server';
import { StatusBadge }       from '@/components/ui/status-badge';
import { isReviewerOrAbove } from '@agp/config';

export const metadata = { title: 'Reports Queue | AmanahHub Console' };

export default async function ReportsQueuePage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: me } = await supabase
    .from('users').select('platform_role')
    .eq('auth_provider_user_id', user.id).single();

  if (!me || !isReviewerOrAbove(me.platform_role)) redirect('/dashboard');

  const { data: reports } = await supabase
    .from('project_reports')
    .select(`
      id, title, submission_status, verification_status, submitted_at,
      organizations ( id, name ),
      projects ( id, title )
    `)
    .eq('submission_status', 'submitted')
    .eq('verification_status', 'pending')
    .order('submitted_at', { ascending: true });

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Reports queue</h1>
        <p className="mt-1 text-sm text-gray-500">
          {reports?.length
            ? `${reports.length} report${reports.length !== 1 ? 's' : ''} awaiting verification`
            : 'No reports pending verification'}
        </p>
      </div>

      {reports?.length ? (
        <div className="space-y-3">
          {reports.map((r) => {
            const org     = Array.isArray(r.organizations) ? r.organizations[0] : r.organizations;
            const project = Array.isArray(r.projects)      ? r.projects[0]      : r.projects;
            return (
              <a key={r.id} href={`/review/reports/${r.id}`}
                className="block px-5 py-4 rounded-lg border border-gray-200 bg-white
                           hover:border-emerald-200 hover:bg-emerald-50/20 transition-colors group">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 group-hover:text-emerald-800 truncate">
                      {r.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {org?.name} · {project?.title}
                    </p>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <StatusBadge status={r.verification_status} />
                    <p className="text-xs text-gray-400 mt-1">
                      {r.submitted_at
                        ? new Date(r.submitted_at).toLocaleDateString('en-MY')
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
