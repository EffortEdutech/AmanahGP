// apps/org/app/(protected)/accounting/reports/page.tsx
// amanahOS — Financial Reports Hub
// Links to all 6 Islamic nonprofit financial reports.

import { redirect }            from 'next/navigation';
import { createClient }        from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
function relationOne<T>(value: unknown): T | null {
  if (Array.isArray(value)) {
    return (value[0] as T | undefined) ?? null;
  }
  return (value as T | null) ?? null;
}


export const metadata = { title: 'Reports — amanahOS' };

const REPORTS = [
  {
    href:     '/accounting/reports/statement-of-financial-position',
    icon:     '⊞',
    label:    'Statement of Financial Position',
    sub:      'Balance sheet — Assets = Liabilities + Fund Balances',
    badge:    null,
    ctcf:     'CTCF L2',
    color:    'border-blue-200 bg-blue-50/30',
    iconBg:   'bg-blue-50 text-blue-600',
  },
  {
    href:     '/accounting/reports/statement-of-activities',
    icon:     '≡',
    label:    'Statement of Activities',
    sub:      'Income & expenditure — programme vs admin ratio',
    badge:    null,
    ctcf:     'CTCF L2',
    color:    'border-emerald-200 bg-emerald-50/30',
    iconBg:   'bg-emerald-50 text-emerald-600',
  },
  {
    href:     '/accounting/reports/fund-changes',
    icon:     '◎',
    label:    'Statement of Changes in Funds',
    sub:      'How each fund moved — opening → income → expenses → closing',
    badge:    null,
    ctcf:     'Audit',
    color:    'border-purple-200 bg-purple-50/30',
    iconBg:   'bg-purple-50 text-purple-600',
  },
  {
    href:     '/accounting/reports/zakat-utilisation',
    icon:     '★',
    label:    'Zakat Utilisation Report',
    sub:      'Zakat received, distributed, balance — MAIN/JAKIM ready',
    badge:    'Signature',
    ctcf:     'CTCF L5',
    color:    'border-amber-200 bg-amber-50/30',
    iconBg:   'bg-amber-50 text-amber-600',
  },
  {
    href:     '/accounting/reports/cash-flow',
    icon:     '⇄',
    label:    'Statement of Cash Flow',
    sub:      'Cash movements — bank accounts 1101–1140',
    badge:    null,
    ctcf:     null,
    color:    'border-gray-200 bg-white',
    iconBg:   'bg-gray-50 text-gray-600',
  },
  {
    href:     '/accounting/reports/project-fund',
    icon:     '▦',
    label:    'Project Fund Report',
    sub:      'Income, expenses, and balance per project',
    badge:    null,
    ctcf:     'CTCF L3',
    color:    'border-teal-200 bg-teal-50/30',
    iconBg:   'bg-teal-50 text-teal-600',
  },
];

export default async function ReportsPage() {
  const supabase = await createClient();
  const service  = createServiceClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: platformUser } = await supabase
    .from('users').select('id').eq('auth_provider_user_id', user.id).single();
  if (!platformUser) redirect('/no-access?reason=no_user_record');

  const { data: membership } = await service
    .from('org_members').select('organization_id, organizations(name)')
    .eq('user_id', platformUser.id).eq('status', 'active')
    .order('created_at', { ascending: true }).limit(1).single();
  if (!membership) redirect('/no-access?reason=no_org_membership');

  const org = relationOne<{ name: string }>(membership.organizations);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Financial reports</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {org?.name} · Auto-generated from your journal entries
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {REPORTS.map((report) => (
          <a key={report.href} href={report.href}
            className={`rounded-lg border p-4 hover:shadow-sm transition-all flex gap-3 ${report.color}`}>
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 text-sm ${report.iconBg}`}>
              {report.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <p className="text-[12px] font-semibold text-gray-800 leading-tight">{report.label}</p>
                <div className="flex gap-1 flex-shrink-0">
                  {report.badge && (
                    <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">
                      {report.badge}
                    </span>
                  )}
                  {report.ctcf && (
                    <span className="text-[8px] font-medium px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700">
                      {report.ctcf}
                    </span>
                  )}
                </div>
              </div>
              <p className="text-[10px] text-gray-500 mt-0.5 leading-relaxed">{report.sub}</p>
            </div>
          </a>
        ))}
      </div>

      <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-4">
        <p className="text-[11px] font-semibold text-emerald-800">All reports are auto-generated</p>
        <p className="text-[11px] text-emerald-700 mt-1 leading-relaxed">
          Reports compute in real-time from your journal entries. No manual entry required.
          The Zakat Utilisation Report is accepted by MAIN/JAKIM for compliance submissions.
          CTCF-tagged reports feed directly into your certification scoring.
        </p>
      </div>
    </div>
  );
}

