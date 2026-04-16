// apps/org/app/(protected)/reports/page.tsx
// amanahOS — Reports (Sprint 25 — full create/submit, no Console link)

import { redirect }            from 'next/navigation';
import Link                    from 'next/link';
import { createClient }        from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
function relationOne<T>(value: unknown): T | null {
  if (Array.isArray(value)) {
    return (value[0] as T | undefined) ?? null;
  }
  return (value as T | null) ?? null;
}


export const metadata = { title: 'Reports — amanahOS' };

const SUBMIT_COLOR: Record<string, { label: string; color: string; bg: string }> = {
  draft:     { label: 'Draft',     color: 'text-gray-600',    bg: 'bg-gray-100' },
  submitted: { label: 'Submitted', color: 'text-amber-700',   bg: 'bg-amber-100' },
};
const VERIFY_COLOR: Record<string, { label: string; color: string }> = {
  pending:           { label: 'Pending review',   color: 'text-amber-600' },
  verified:          { label: 'Verified ✓',        color: 'text-emerald-700' },
  changes_requested: { label: 'Changes requested', color: 'text-orange-700' },
  rejected:          { label: 'Rejected',          color: 'text-red-600' },
};

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const supabase = await createClient();
  const service  = createServiceClient();
  const params   = await searchParams;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: platformUser } = await supabase
    .from('users').select('id')
    .eq('auth_provider_user_id', user.id).single();
  if (!platformUser) redirect('/no-access?reason=no_user_record');

  const { data: membership } = await service
    .from('org_members')
    .select('organization_id, org_role, organizations(name)')
    .eq('user_id', platformUser.id).eq('status', 'active')
    .order('created_at', { ascending: true }).limit(1).single();
  if (!membership) redirect('/no-access?reason=no_org_membership');

  const orgId     = membership.organization_id;
  const orgRaw = membership.organizations;
  const org = (Array.isArray(orgRaw) ? orgRaw[0] : orgRaw) as { name: string } | null | undefined;
  const isManager = ['org_admin', 'org_manager'].includes(membership.org_role);

  let query = service
    .from('project_reports')
    .select('id, title, submission_status, verification_status, submitted_at, report_date, created_at, reviewer_comment, projects(id, title)')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false });

  if (params.filter === 'pending') query = query.eq('verification_status', 'pending').eq('submission_status', 'submitted');
  if (params.filter === 'verified') query = query.eq('verification_status', 'verified');
  if (params.filter === 'draft') query = query.eq('submission_status', 'draft');

  const { data: reports } = await query;

  const { data: allReports } = await service
    .from('project_reports').select('submission_status, verification_status').eq('organization_id', orgId);

  const draftCount    = (allReports ?? []).filter((r) => r.submission_status === 'draft').length;
  const pendingCount  = (allReports ?? []).filter((r) => r.submission_status === 'submitted' && r.verification_status === 'pending').length;
  const verifiedCount = (allReports ?? []).filter((r) => r.verification_status === 'verified').length;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-5">

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Progress reports</h1>
          <p className="text-sm text-gray-500 mt-0.5">{org?.name}</p>
        </div>
        {isManager && (
          <Link href="/reports/new"
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm
                       font-medium rounded-lg transition-colors flex items-center gap-1.5">
            <span className="text-base leading-none">+</span> Submit report
          </Link>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {[
          { key: '',         label: 'All',     count: (allReports ?? []).length },
          { key: 'draft',    label: 'Draft',   count: draftCount },
          { key: 'pending',  label: 'Pending review', count: pendingCount },
          { key: 'verified', label: 'Verified', count: verifiedCount },
        ].map((tab) => (
          <Link key={tab.key}
            href={tab.key ? `/reports?filter=${tab.key}` : '/reports'}
            className={`
              flex items-center gap-1.5 px-4 py-2.5 text-[12px] font-medium
              border-b-2 transition-colors -mb-px
              ${(params.filter ?? '') === tab.key
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
              }
            `}>
            {tab.label}
            {tab.count > 0 && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">
                {tab.count}
              </span>
            )}
          </Link>
        ))}
      </div>

      <div className="rounded-lg bg-blue-50 border border-blue-200 px-4 py-2.5 flex items-center gap-2">
        <span className="text-blue-500 text-sm flex-shrink-0">ℹ</span>
        <p className="text-[11px] text-blue-700">
          Submit reports here. A platform reviewer will verify them — verified reports
          count toward your <strong>CTCF Layer 3</strong> certification score.
          Reviews are independent — you cannot approve your own reports.
        </p>
      </div>

      {reports && reports.length > 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white divide-y divide-gray-100">
          {reports.map((report) => {
            const project = relationOne<{ id: string; title: string }>(report.projects);
            const sc  = SUBMIT_CONFIG[report.submission_status] ?? SUBMIT_CONFIG.draft;
            const vc  = VERIFY_COLOR[report.verification_status] ?? VERIFY_COLOR.pending;
            return (
              <Link key={report.id} href={`/reports/${report.id}`}
                className="flex items-start justify-between p-4 hover:bg-gray-50 transition-colors">
                <div className="flex-1 min-w-0 space-y-1">
                  <p className="text-[13px] font-semibold text-gray-800">{report.title}</p>
                  {project && (
                    <p className="text-[11px] text-gray-400">{project.title}</p>
                  )}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full ${sc.bg} ${sc.color}`}>
                      {sc.label}
                    </span>
                    <span className={`text-[10px] font-medium ${vc.color}`}>
                      {vc.label}
                    </span>
                    {report.report_date && (
                      <span className="text-[10px] text-gray-400">{report.report_date}</span>
                    )}
                  </div>
                  {report.reviewer_comment && report.verification_status === 'changes_requested' && (
                    <p className="text-[11px] text-orange-700 bg-orange-50 rounded px-2 py-1 mt-1">
                      Reviewer: {report.reviewer_comment}
                    </p>
                  )}
                </div>
                <p className="text-[10px] text-gray-400 flex-shrink-0 ml-3">
                  {new Date(report.created_at).toLocaleDateString('en-MY')}
                </p>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-10 text-center">
          <p className="text-2xl mb-2">âœŽ</p>
          <p className="text-sm font-medium text-gray-600">No reports yet</p>
          <p className="text-[12px] text-gray-400 mt-1 max-w-xs mx-auto">
            Progress reports document your programme activities and beneficiary impact.
            Each verified report strengthens your CTCF certification score.
          </p>
          {isManager && (
            <Link href="/reports/new"
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2
                         bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium
                         rounded-lg transition-colors">
              + Submit first report
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

const SUBMIT_CONFIG = SUBMIT_COLOR;

