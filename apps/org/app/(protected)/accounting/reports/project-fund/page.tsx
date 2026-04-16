// apps/org/app/(protected)/accounting/reports/project-fund/page.tsx
// amanahOS — Project Fund Report
// Income, expenses, and balance per project.

import { redirect }            from 'next/navigation';
import { createClient }        from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { MonthYearPicker }     from '@/components/ui/month-year-picker';
function relationOne<T>(value: unknown): T | null {
  if (Array.isArray(value)) {
    return (value[0] as T | undefined) ?? null;
  }
  return (value as T | null) ?? null;
}


export const metadata = { title: 'Project fund report — amanahOS' };

export default async function ProjectFundPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const supabase = await createClient();
  const service  = createServiceClient();
  const params   = await searchParams;

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

  const orgId        = membership.organization_id;
  const org          = relationOne<{ name: string }>(membership.organizations);
  const currentYear  = new Date().getFullYear();
  const selectedYear = parseInt(params.year ?? String(currentYear));

  // Load all projects for this org
  const { data: projects } = await service
    .from('projects')
    .select('id, title, status, start_date, end_date')
    .eq('organization_id', orgId)
    .order('title');

  if (!projects || projects.length === 0) {
    return (
      <div className="p-6 max-w-3xl mx-auto space-y-4">
        <h1 className="text-xl font-semibold text-gray-900">Project Fund Report</h1>
        <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-center">
          <p className="text-sm text-gray-500">No projects found.</p>
          <a href="/projects" className="text-[12px] text-emerald-600 hover:underline mt-1 block">
            Create your first project →
          </a>
        </div>
      </div>
    );
  }

  // Load all journal lines with project_id and account type
  const { data: allLines } = await service
    .from('journal_lines')
    .select('project_id, debit_amount, credit_amount, fund_id, account_id, journal_entries(period_year), accounts(account_type), funds(fund_code, fund_name, fund_type)')
    .eq('organization_id', orgId)
    .not('project_id', 'is', null);

  // Build project summary
  const projectSummary = projects.map((project) => {
    const projectLines = (allLines ?? []).filter((l) => {
      const je = relationOne<{ period_year: number }>(l.journal_entries);
      return l.project_id === project.id && je?.period_year === selectedYear;
    });

    const income   = projectLines
      .filter((l) => {
        const acc = relationOne<{ account_type: string }>(l.accounts);
        return acc?.account_type === 'income';
      })
      .reduce((s, l) => s + Number(l.credit_amount) - Number(l.debit_amount), 0);

    const expenses = projectLines
      .filter((l) => {
        const acc = relationOne<{ account_type: string }>(l.accounts);
        return acc?.account_type === 'expense';
      })
      .reduce((s, l) => s + Number(l.debit_amount) - Number(l.credit_amount), 0);

    const balance  = income - expenses;

    // Funds used
    const fundsUsed = [...new Set(projectLines.map((l) => {
      const f = relationOne<{ fund_code: string; fund_name: string; fund_type: string }>(l.funds);
      return f ? `${f.fund_code} — ${f.fund_name}` : null;
    }).filter(Boolean))];

    return { project, income, expenses, balance, fundsUsed };
  });

  const totalIncome   = projectSummary.reduce((s, r) => s + r.income,   0);
  const totalExpenses = projectSummary.reduce((s, r) => s + r.expenses, 0);

  const fmt = (n: number) =>
    `RM ${Math.abs(n).toLocaleString('en-MY', { minimumFractionDigits: 2 })}`;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Project Fund Report</h1>
          <p className="text-sm text-gray-500 mt-0.5">{org?.name} Â· {selectedYear}</p>
        </div>
        <MonthYearPicker
            selectedYear={selectedYear}
            basePath="/accounting/reports/project-fund"
          />
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border border-gray-200 bg-white p-3">
          <p className="text-[10px] text-gray-400 uppercase tracking-wide">Projects</p>
          <p className="text-xl font-bold text-gray-800">{projects.length}</p>
        </div>
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
          <p className="text-[10px] text-emerald-600 uppercase tracking-wide">Total income</p>
          <p className="text-xl font-bold text-emerald-700">{fmt(totalIncome)}</p>
        </div>
        <div className="rounded-lg border border-red-200 bg-red-50 p-3">
          <p className="text-[10px] text-red-500 uppercase tracking-wide">Total expenses</p>
          <p className="text-xl font-bold text-red-600">{fmt(totalExpenses)}</p>
        </div>
      </div>

      {/* Project table */}
      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
        <div className="grid grid-cols-6 gap-2 px-4 py-2.5 bg-gray-50 border-b border-gray-200 text-[10px] font-semibold text-gray-500 uppercase tracking-wide">
          <div className="col-span-2">Project</div>
          <div>Fund(s)</div>
          <div className="text-right">Income</div>
          <div className="text-right">Expenses</div>
          <div className="text-right">Balance</div>
        </div>

        {projectSummary.map(({ project, income, expenses, balance, fundsUsed }) => (
          <div key={project.id} className="grid grid-cols-6 gap-2 px-4 py-3.5 border-b border-gray-100 last:border-0 items-center">
            <div className="col-span-2">
              <p className="text-[12px] font-medium text-gray-800">{project.title}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full ${
                  project.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
                }`}>
                  {project.status}
                </span>
              </div>
            </div>
            <div>
              <p className="text-[10px] text-gray-500 leading-relaxed">
                {fundsUsed.length > 0 ? fundsUsed.join(', ') : '—'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[12px] text-emerald-700 font-mono">
                {income > 0 ? fmt(income) : '—'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[12px] text-red-600 font-mono">
                {expenses > 0 ? fmt(expenses) : '—'}
              </p>
            </div>
            <div className="text-right">
              <p className={`text-[13px] font-bold font-mono ${
                balance >= 0 ? 'text-gray-800' : 'text-red-700'
              }`}>
                {fmt(balance)}
              </p>
            </div>
          </div>
        ))}

        {/* Totals */}
        <div className="grid grid-cols-6 gap-2 px-4 py-3.5 bg-gray-50 border-t-2 border-gray-300 items-center">
          <div className="col-span-3">
            <p className="text-[11px] font-bold text-gray-800">TOTAL</p>
          </div>
          <div className="text-right">
            <p className="text-[12px] font-bold text-emerald-700">{fmt(totalIncome)}</p>
          </div>
          <div className="text-right">
            <p className="text-[12px] font-bold text-red-700">{fmt(totalExpenses)}</p>
          </div>
          <div className="text-right">
            <p className="text-[13px] font-bold text-gray-900">{fmt(totalIncome - totalExpenses)}</p>
          </div>
        </div>
      </div>

      <div className="rounded-lg bg-teal-50 border border-teal-200 p-4">
        <p className="text-[11px] font-semibold text-teal-800">CTCF Layer 3 connection</p>
        <p className="text-[11px] text-teal-700 mt-1">
          Project-level fund tracking feeds CTCF Layer 3 (Project Transparency & Traceability).
          Each project with income, expenses, and balance provides evidence for
          budgetVsActual and beneficiaryMetrics criteria.
        </p>
      </div>
    </div>
  );
}

