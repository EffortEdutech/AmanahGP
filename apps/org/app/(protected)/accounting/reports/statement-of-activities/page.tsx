// apps/org/app/(protected)/accounting/reports/statement-of-activities/page.tsx
// amanahOS — Statement of Activities (Income Statement for NGOs)
// Formula from amanah_gp_OS.md:
//   Income  = SUM(accounts 4000–4999)
//   Expenses = grouped: Programme (5100–5199), Mosque Ops (5200–5299), Admin (5300–5499)
//   Surplus = Income - Expenses

import { redirect }            from 'next/navigation';
import { createClient }        from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';

export const metadata = { title: 'Statement of Activities — amanahOS' };

export default async function StatementOfActivitiesPage({
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
  const org          = membership.organizations as { name: string } | null;
  const currentYear  = new Date().getFullYear();
  const selectedYear = parseInt(params.year ?? String(currentYear));

  // Load Statement of Activities from view
  const { data: activities } = await service
    .from('statement_of_activities_view')
    .select('account_type, account_code, account_name, cost_category, fund_code, fund_name, fund_type, net_amount')
    .eq('organization_id', orgId)
    .eq('period_year', selectedYear)
    .order('account_code');

  // Aggregate income lines by account
  const incomeMap  = new Map<string, { code: string; name: string; amount: number }>();
  const expenseMap = new Map<string, { code: string; name: string; amount: number; category: string | null }>();

  for (const row of (activities ?? [])) {
    if (row.account_type === 'income') {
      const existing = incomeMap.get(row.account_code);
      incomeMap.set(row.account_code, {
        code: row.account_code, name: row.account_name,
        amount: (existing?.amount ?? 0) + Number(row.net_amount),
      });
    }
    if (row.account_type === 'expense') {
      const existing = expenseMap.get(row.account_code);
      expenseMap.set(row.account_code, {
        code: row.account_code, name: row.account_name,
        amount: (existing?.amount ?? 0) + Number(row.net_amount),
        category: row.cost_category,
      });
    }
  }

  const incomeRows  = [...incomeMap.values()].sort((a, b) => a.code.localeCompare(b.code));
  const expenseRows = [...expenseMap.values()].sort((a, b) => a.code.localeCompare(b.code));

  // Group expenses by category band (from amanah_gp_OS.md design)
  const programmeExp = expenseRows.filter((r) => r.code >= '5100' && r.code < '5200');
  const mosqueOpsExp = expenseRows.filter((r) => r.code >= '5200' && r.code < '5300');
  const adminExp     = expenseRows.filter((r) => r.code >= '5300');

  const totalIncome     = incomeRows.reduce((s, r) => s + r.amount, 0);
  const totalProgramme  = programmeExp.reduce((s, r) => s + r.amount, 0);
  const totalMosqueOps  = mosqueOpsExp.reduce((s, r) => s + r.amount, 0);
  const totalAdmin      = adminExp.reduce((s, r) => s + r.amount, 0);
  const totalExpenses   = totalProgramme + totalMosqueOps + totalAdmin;
  const surplus         = totalIncome - totalExpenses;

  // Programme ratio
  const programmeRatio = totalExpenses > 0
    ? Math.round(((totalProgramme + totalMosqueOps) / totalExpenses) * 100) : 0;

  const fmt = (n: number) =>
    `RM ${Math.abs(n).toLocaleString('en-MY', { minimumFractionDigits: 2 })}`;

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Statement of Activities</h1>
          <p className="text-sm text-gray-500 mt-0.5">{org?.name} · Year ended 31 December {selectedYear}</p>
        </div>
        <div className="flex gap-1">
          {[currentYear - 1, currentYear].map((y) => (
            <a key={y} href={`/accounting/reports/statement-of-activities?year=${y}`}
              className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${
                y === selectedYear
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}>{y}</a>
          ))}
        </div>
      </div>

      {/* Programme transparency ratio badge */}
      {totalExpenses > 0 && (
        <div className={`rounded-lg border p-3 flex items-center justify-between ${
          programmeRatio >= 70 ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'
        }`}>
          <div>
            <p className={`text-[11px] font-semibold ${programmeRatio >= 70 ? 'text-emerald-800' : 'text-amber-800'}`}>
              Programme expense ratio: {programmeRatio}%
            </p>
            <p className={`text-[10px] ${programmeRatio >= 70 ? 'text-emerald-700' : 'text-amber-700'}`}>
              {programmeRatio >= 70
                ? '✓ Strong — CTCF Layer 2 programAdminBreakdown criterion: Full'
                : programmeRatio >= 50
                ? 'Moderate — consider reducing admin costs'
                : '⚠ Below threshold — auditors may question overhead ratio'}
            </p>
          </div>
          <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-full border border-blue-200">
            CTCF L2
          </span>
        </div>
      )}

      {/* Statement */}
      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">

        {/* INCOME */}
        <div className="px-4 py-2.5 bg-emerald-800">
          <p className="text-[11px] font-bold text-white uppercase tracking-wider">Income</p>
        </div>
        {incomeRows.length > 0 ? incomeRows.map((r) => (
          <div key={r.code} className="flex items-center gap-3 px-4 py-2.5 border-b border-gray-50">
            <span className="text-[10px] text-gray-400 font-mono w-10">{r.code}</span>
            <span className="text-[12px] text-gray-700 flex-1 pl-2">{r.name}</span>
            <span className="text-[12px] font-medium text-emerald-700">{fmt(r.amount)}</span>
          </div>
        )) : (
          <div className="px-4 py-3 text-[12px] text-gray-400">No income for {selectedYear}</div>
        )}
        <div className="flex items-center justify-between px-4 py-3 bg-emerald-50 border-t border-emerald-200">
          <span className="text-[12px] font-bold text-emerald-800 pl-12">Total income</span>
          <span className="text-[14px] font-bold text-emerald-700">{fmt(totalIncome)}</span>
        </div>

        {/* EXPENSES — Programme */}
        <div className="px-4 py-2.5 bg-blue-700">
          <p className="text-[11px] font-bold text-white uppercase tracking-wider">
            Programme expenses (5100–5199)
          </p>
        </div>
        {programmeExp.length > 0 ? programmeExp.map((r) => (
          <div key={r.code} className="flex items-center gap-3 px-4 py-2.5 border-b border-gray-50">
            <span className="text-[10px] text-gray-400 font-mono w-10">{r.code}</span>
            <span className="text-[12px] text-gray-700 flex-1 pl-2">{r.name}</span>
            <span className="text-[12px] font-medium text-blue-700">{fmt(r.amount)}</span>
          </div>
        )) : (
          <div className="px-4 py-3 text-[12px] text-gray-400">No programme expenses</div>
        )}
        {totalProgramme > 0 && (
          <div className="flex items-center justify-between px-4 py-2.5 bg-blue-50 border-t border-blue-200">
            <span className="text-[11px] font-semibold text-blue-800 pl-12">Subtotal — Programme</span>
            <span className="text-[12px] font-semibold text-blue-700">{fmt(totalProgramme)}</span>
          </div>
        )}

        {/* EXPENSES — Mosque Operations */}
        {mosqueOpsExp.length > 0 && (
          <>
            <div className="px-4 py-2.5 bg-teal-700">
              <p className="text-[11px] font-bold text-white uppercase tracking-wider">
                Mosque / facility operations (5200–5299)
              </p>
            </div>
            {mosqueOpsExp.map((r) => (
              <div key={r.code} className="flex items-center gap-3 px-4 py-2.5 border-b border-gray-50">
                <span className="text-[10px] text-gray-400 font-mono w-10">{r.code}</span>
                <span className="text-[12px] text-gray-700 flex-1 pl-2">{r.name}</span>
                <span className="text-[12px] font-medium text-teal-700">{fmt(r.amount)}</span>
              </div>
            ))}
            <div className="flex items-center justify-between px-4 py-2.5 bg-teal-50 border-t border-teal-200">
              <span className="text-[11px] font-semibold text-teal-800 pl-12">Subtotal — Operations</span>
              <span className="text-[12px] font-semibold text-teal-700">{fmt(totalMosqueOps)}</span>
            </div>
          </>
        )}

        {/* EXPENSES — Admin & Governance */}
        {adminExp.length > 0 && (
          <>
            <div className="px-4 py-2.5 bg-gray-600">
              <p className="text-[11px] font-bold text-white uppercase tracking-wider">
                Staff & governance (5300–5499)
              </p>
            </div>
            {adminExp.map((r) => (
              <div key={r.code} className="flex items-center gap-3 px-4 py-2.5 border-b border-gray-50">
                <span className="text-[10px] text-gray-400 font-mono w-10">{r.code}</span>
                <span className="text-[12px] text-gray-700 flex-1 pl-2">{r.name}</span>
                <span className="text-[12px] font-medium text-gray-700">{fmt(r.amount)}</span>
              </div>
            ))}
            <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-t border-gray-300">
              <span className="text-[11px] font-semibold text-gray-700 pl-12">Subtotal — Admin</span>
              <span className="text-[12px] font-semibold text-gray-700">{fmt(totalAdmin)}</span>
            </div>
          </>
        )}

        {/* Total expenses */}
        <div className="flex items-center justify-between px-4 py-3 bg-red-50 border-t border-red-200">
          <span className="text-[12px] font-bold text-red-800 pl-12">Total expenses</span>
          <span className="text-[14px] font-bold text-red-700">{fmt(totalExpenses)}</span>
        </div>

        {/* Surplus / Deficit */}
        <div className={`flex items-center justify-between px-4 py-4 border-t-2 ${
          surplus >= 0 ? 'bg-emerald-50 border-emerald-400' : 'bg-red-50 border-red-400'
        }`}>
          <span className="text-[13px] font-bold text-gray-800">
            {surplus >= 0 ? 'Surplus for the year' : 'Deficit for the year'}
          </span>
          <span className={`text-[16px] font-bold ${surplus >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
            {surplus >= 0 ? '+' : '−'}{fmt(surplus)}
          </span>
        </div>
      </div>

      {(activities ?? []).length === 0 && (
        <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-center">
          <p className="text-sm text-gray-500">No transactions for {selectedYear}.</p>
          <a href="/accounting/transactions/new" className="text-[12px] text-emerald-600 hover:underline mt-1 block">
            Record your first transaction →
          </a>
        </div>
      )}
    </div>
  );
}
