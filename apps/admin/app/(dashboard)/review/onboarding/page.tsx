// apps/admin/app/(dashboard)/review/onboarding/page.tsx
// AmanahHub Console — All reviewer queues (Sprint 12b)
// Added: Documents pending reviewer approval — visible for ALL orgs regardless of status

import { redirect }            from 'next/navigation';
import Link                    from 'next/link';
import { createClient,
         createServiceClient } from '@/lib/supabase/server';
import { isReviewerOrAbove }   from '@agp/config';
import { StatusBadge }         from '@/components/ui/badge';

export const metadata = { title: 'Review Queues | AmanahHub Console' };

export default async function ReviewQueuesPage() {
  const supabase = await createClient();
  const svc      = createServiceClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: me } = await supabase
    .from('users').select('platform_role')
    .eq('auth_provider_user_id', user.id).single();
  if (!me || !isReviewerOrAbove(me.platform_role)) redirect('/dashboard');

  // ── Onboarding queue ─────────────────────────────────────────
  const { data: pendingOrgs } = await svc
    .from('organizations')
    .select('id, name, org_type, state, onboarding_submitted_at, onboarding_status')
    .eq('onboarding_status', 'submitted')
    .order('onboarding_submitted_at');

  // ── Reports queue ─────────────────────────────────────────────
  const { data: pendingReports } = await svc
    .from('project_reports')
    .select(`
      id, title, submitted_at,
      organizations ( id, name ),
      projects ( id, title )
    `)
    .eq('submission_status', 'submitted')
    .eq('verification_status', 'pending')
    .order('submitted_at');

  // ── Certification queue ───────────────────────────────────────
  const { data: pendingCerts } = await svc
    .from('certification_applications')
    .select(`
      id, submitted_at, status,
      organizations ( id, name )
    `)
    .in('status', ['submitted', 'under_review'])
    .order('submitted_at');

  // ── Documents pending approval ────────────────────────────────
  // ALL private (unapproved) documents across ALL orgs
  const { data: pendingDocs } = await svc
    .from('org_documents')
    .select(`
      id, document_category, document_type, label, file_name,
      created_at, period_year,
      organizations ( id, name, onboarding_status )
    `)
    .eq('is_approved_public', false)
    .order('created_at', { ascending: false })
    .limit(50);

  const ORG_TYPE_SHORT: Record<string, string> = {
    ngo: 'NGO', mosque_surau: 'Mosque/Surau',
    waqf_institution: 'Waqf', foundation: 'Foundation',
    zakat_body: 'Zakat Body', other: 'Other',
  };

  const DOC_CATEGORY_LABELS: Record<string, string> = {
    governance: 'Governance (Layer 1)',
    financial:  'Financial (Layer 2)',
    shariah:    'Shariah (Layer 5)',
  };

  const DOC_TYPE_LABELS: Record<string, string> = {
    registration_cert:           'Registration cert',
    governing_doc:               'Governing document',
    board_resolution:            'Board resolution',
    coi_policy:                  'CoI policy',
    bank_account_proof:          'Bank account proof',
    annual_report:               'Annual report',
    financial_statement:         'Financial statement',
    audit_report:                'Audit report',
    bank_reconciliation:         'Bank reconciliation',
    management_accounts:         'Program breakdown',
    shariah_policy:              'Shariah policy',
    shariah_advisor_credentials: 'Shariah advisor credentials',
    zakat_authorization:         'Zakat authorization',
    waqf_deed:                   'Waqf deed',
    fatwa_doc:                   'Fatwa/ruling',
  };

  return (
    <div className="max-w-4xl">
      <div className="mb-5">
        <h1 className="text-[18px] font-semibold text-gray-900">Review queues</h1>
        <p className="text-[11px] text-gray-500 mt-0.5">
          {me.platform_role} · {me.platform_role.replace('_', ' ')}
        </p>
      </div>

      {/* Summary stat row */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        <StatBlock n={pendingOrgs?.length ?? 0}  label="Onboarding" />
        <StatBlock n={pendingReports?.length ?? 0} label="Reports pending" warn />
        <StatBlock n={pendingCerts?.length ?? 0}   label="Certification" />
        <StatBlock n={pendingDocs?.length ?? 0}    label="Docs to approve" warn={!!pendingDocs?.length} />
      </div>

      {/* ── Onboarding queue ────────────────────────────────── */}
      <QueueSection title="Onboarding queue" count={pendingOrgs?.length ?? 0}>
        {pendingOrgs?.length ? (
          pendingOrgs.map((org) => (
            <Link key={org.id} href={`/review/onboarding/${org.id}`}
              className="list-item">
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-medium text-gray-900">{org.name}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  {org.org_type ? ORG_TYPE_SHORT[org.org_type] ?? org.org_type : ''}
                  {org.state ? ` · ${org.state}` : ''}
                  {org.onboarding_submitted_at
                    ? ` · Submitted ${new Date(org.onboarding_submitted_at).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })}`
                    : ''}
                </p>
              </div>
              <StatusBadge status={org.onboarding_status} />
            </Link>
          ))
        ) : (
          <Empty label="No pending onboarding submissions." />
        )}
      </QueueSection>

      {/* ── Documents pending approval ───────────────────────── */}
      <QueueSection
        title="Documents pending approval"
        count={pendingDocs?.length ?? 0}
        highlight
      >
        {pendingDocs?.length ? (
          <div>
            <p className="text-[11px] text-gray-500 mb-3 px-1">
              These documents were uploaded by organizations and are waiting for reviewer
              approval before becoming visible to donors on AmanahHub.
              Click an organization name to review and approve its documents.
            </p>
            {pendingDocs.map((doc) => {
              const org = Array.isArray(doc.organizations) ? doc.organizations[0] : doc.organizations;
              return (
                <div key={doc.id}
                  className="flex items-center gap-3 border border-gray-200 rounded-lg
                             px-3 py-2.5 bg-white mb-2">
                  <span className="text-sm flex-shrink-0">📄</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-medium text-gray-800">
                      {DOC_TYPE_LABELS[doc.document_type] ?? doc.label}
                      {doc.period_year ? ` (${doc.period_year})` : ''}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Link href={`/orgs/${org?.id}`}
                        className="text-[10px] text-emerald-700 hover:underline font-medium">
                        {org?.name ?? '—'}
                      </Link>
                      <span className="text-[9px] text-gray-400">·</span>
                      <span className="text-[9px] text-gray-500">
                        {DOC_CATEGORY_LABELS[doc.document_category] ?? doc.document_category}
                      </span>
                      <span className="text-[9px] text-gray-400">·</span>
                      <span className="text-[9px] text-gray-400">
                        {new Date(doc.created_at).toLocaleDateString('en-MY', {
                          day: 'numeric', month: 'short', year: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>
                  <Link href={`/orgs/${org?.id}`}
                    className="flex-shrink-0 text-[10px] font-medium text-amber-700
                               hover:text-amber-900 border border-amber-200 bg-amber-50
                               px-2.5 py-1 rounded-md hover:bg-amber-100 transition-colors">
                    Review →
                  </Link>
                </div>
              );
            })}
          </div>
        ) : (
          <Empty label="No documents awaiting approval." />
        )}
      </QueueSection>

      {/* ── Reports queue ─────────────────────────────────────── */}
      <QueueSection title="Reports queue" count={pendingReports?.length ?? 0}>
        {pendingReports?.length ? (
          pendingReports.map((r) => {
            const org  = Array.isArray(r.organizations) ? r.organizations[0] : r.organizations;
            const proj = Array.isArray(r.projects)      ? r.projects[0]      : r.projects;
            return (
              <Link key={r.id} href={`/review/reports/${r.id}`}
                className="list-item">
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-medium text-gray-900 truncate">{r.title}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    {org?.name ?? '—'}
                    {r.submitted_at
                      ? ` · Submitted ${new Date(r.submitted_at).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })}`
                      : ''}
                  </p>
                </div>
                <StatusBadge status="pending" />
              </Link>
            );
          })
        ) : (
          <Empty label="No pending reports." />
        )}
      </QueueSection>

      {/* ── Certification queue ───────────────────────────────── */}
      <QueueSection title="Certification queue" count={pendingCerts?.length ?? 0}>
        {pendingCerts?.length ? (
          pendingCerts.map((cert) => {
            const org = Array.isArray(cert.organizations) ? cert.organizations[0] : cert.organizations;
            return (
              <Link key={cert.id} href={`/review/certification/${cert.id}`}
                className="list-item">
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-medium text-gray-900">{org?.name ?? '—'}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    Application submitted{cert.submitted_at
                      ? ` ${new Date(cert.submitted_at).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })}`
                      : ''}
                  </p>
                </div>
                <StatusBadge status={cert.status} />
              </Link>
            );
          })
        ) : (
          <Empty label="No pending certification applications." />
        )}
      </QueueSection>
    </div>
  );
}

function QueueSection({
  title, count, children, highlight,
}: {
  title: string; count: number; children: React.ReactNode; highlight?: boolean;
}) {
  return (
    <div className="mb-5">
      <div className="flex items-center gap-2 mb-2">
        <p className="sec-label mb-0">{title}</p>
        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
          highlight && count > 0
            ? 'bg-amber-100 text-amber-800'
            : 'bg-gray-100 text-gray-500'
        }`}>
          {count}
        </span>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function StatBlock({ n, label, warn }: { n: number; label: string; warn?: boolean }) {
  return (
    <div className="stat-blk">
      <div className={`stat-val ${warn && n > 0 ? 'text-amber-600' : 'text-gray-700'}`}>{n}</div>
      <div className="stat-lbl">{label}</div>
    </div>
  );
}

function Empty({ label }: { label: string }) {
  return <p className="text-[11px] text-gray-400 py-2 px-1">{label}</p>;
}
