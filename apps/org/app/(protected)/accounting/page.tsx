// apps/org/app/(protected)/accounting/page.tsx
// amanahOS — Fund Accounting module
//
// Phase 2 Sprint 15: schema (fund_types, fund_accounts, fund_transactions, fund_balances)
// Phase 2 Sprint 16: transaction UI, fund balance dashboard, auto financial statements
//
// This is the core differentiator of amanahOS vs AmanahHub Console.
// Islamic fund accounting: Zakat, Sadaqah, Waqf, General, Project fund segregation.

import { ComingSoonModule } from '@/components/ui/coming-soon-module';

export const metadata = { title: 'Accounting — amanahOS' };

export default function AccountingPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">

      <div>
        <h1 className="text-xl font-semibold text-gray-900">Fund accounting</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Islamic fund segregation · Financial statements · Donor reconciliation
        </p>
      </div>

      {/* What's coming — module overview */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <UpcomingFeature
          icon="$"
          label="Fund accounts"
          description="Chart of accounts for Zakat, Sadaqah, Waqf, General, and Project funds. Each RM tracked by fund type."
        />
        <UpcomingFeature
          icon="⇄"
          label="Transactions"
          description="Record income and expenses against specific funds. Double-entry ledger with full audit trail."
        />
        <UpcomingFeature
          icon="≡"
          label="Financial statements"
          description="Auto-generated Statement of Financial Position, Statement of Activities, and Fund Balance Report."
        />
        <UpcomingFeature
          icon="◎"
          label="Zakat utilisation"
          description="Track and report Zakat fund usage against eligible asnaf beneficiary categories."
        />
        <UpcomingFeature
          icon="▲"
          label="CTCF Layer 2 feed"
          description="Fund accounting data feeds directly into your CTCF financial transparency score."
        />
        <UpcomingFeature
          icon="⬇"
          label="One-click export"
          description="Export financial statements for ROS annual return, MAIN reporting, and donor transparency packs."
        />
      </div>

      <ComingSoonModule
        label="Fund accounting"
        sprintTarget="Sprint 15–16"
        description="This module is under active development. The database schema (fund_types, fund_accounts, fund_transactions, fund_balances) will land in Sprint 15. The full UI in Sprint 16."
      />
    </div>
  );
}

function UpcomingFeature({ icon, label, description }: {
  icon: string; label: string; description: string;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 flex gap-3">
      <div className="w-8 h-8 rounded-md bg-emerald-50 flex items-center justify-center flex-shrink-0 text-emerald-600 text-sm">
        {icon}
      </div>
      <div>
        <p className="text-[12px] font-semibold text-gray-800">{label}</p>
        <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}
