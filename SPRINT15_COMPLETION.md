# Amanah Governance Platform — Sprint 15 Completion Report

**Sprint:** S15 — Fund Accounting Schema + UI  
**Date:** April 2026  
**Status:** Delivered

---

## What was built

### Database migration — `0020_fund_accounting.sql`

**New helper functions (permanent RLS UUID fix):**
- `get_platform_user_id()` — resolves `auth.uid()` → `public.users.id` (custom seed UUID). Fixes the root cause of all org_members RLS failures.
- `is_fund_org_member(org_id)` — membership check using the resolved UUID.
- `is_fund_org_manager(org_id)` — manager-level check for write operations.

**New tables:**

| Table | Purpose |
|-------|---------|
| `funds` | Islamic fund registry per org — Zakat, Waqf, Sadaqah, General, Project, Endowment |
| `accounts` | Chart of accounts per org — Asset, Liability, Equity, Income, Expense |
| `journal_entries` | Double-entry bookkeeping header — date, description, period, lock state |
| `journal_lines` | Immutable debit/credit lines tagged by account + fund + optional project |
| `fund_period_closes` | Financial year close records — links to `financial_snapshots` for CTCF Layer 2 |

**New view:**
- `fund_balances_view` — live fund balances computed from `journal_lines`. No stored balance needed. Always accurate.

**RLS:** All tables use `is_fund_org_member()` and `is_fund_org_manager()` — the UUID bridge functions. No service-client workaround needed for new tables.

**Immutability:** `journal_lines` has no UPDATE or DELETE policy. Append-only by design.

### Seed data — `seed_fund_accounting.sql`

Funds and chart of accounts for all 5 seed orgs:
- Org 1 (Persatuan Kebajikan Sejahtera): SDQ + GEN funds, 10 accounts, 2 sample journal entries
- Org 2 (Yayasan Al-Falah): SDQ + GEN + PRJ funds, 9 accounts, 1 sample entry
- Org 3 (Wakaf Ar-Rahman): WQF + SDQ + GEN funds, 9 accounts, 1 waqf rental entry
- Org 4 (Masjid Sultan Ahmad Shah): ZKT + SDQ + GEN funds, 9 accounts
- Org 5 (Rumah Kasih): SDQ + GEN funds, 5 accounts

### apps/org — Accounting module

**`app/(protected)/accounting/page.tsx`** — Full accounting dashboard:
- Fund balance cards (per fund, colour-coded by fund type)
- Period summary (total income / expenses / net)
- Quick transaction entry form
- Recent transactions list (last 20 for selected year)
- Year switcher
- CTCF Layer 2 awareness note

**`components/accounting/quick-entry-form.tsx`** — Client form:
- Income received mode (Dr Bank / Cr Income)
- Expense paid mode (Dr Expense / Cr Bank)
- Fund selector (coloured by type)
- Account selector (filtered by income/expense type)
- Balanced 2-line journal entry created automatically

**`lib/accounting-actions.ts`** — Server actions:
- `createJournalEntry()` — full double-entry with balance validation
- `createQuickIncome()` — simplified income wrapper
- `createQuickExpense()` — simplified expense wrapper

---

## How to apply

### Step 1 — Run the migration

Go to **Supabase Dashboard → SQL Editor** for project `uscgtpvdgcgrfzvccnwq`.

Paste and run `0020_fund_accounting.sql`. This creates all 5 tables, 3 helper functions, the view, and all RLS policies.

### Step 2 — Run the seed data

Paste and run `seed_fund_accounting.sql`. This populates funds, accounts, and sample journal entries for all 5 orgs.

### Step 3 — Copy new files into repo

```
apps/org/app/(protected)/accounting/page.tsx   ← replace existing stub
apps/org/components/accounting/quick-entry-form.tsx  ← new file
apps/org/lib/accounting-actions.ts             ← new file
```

### Step 4 — Restart dev server

```powershell
# Ctrl+C then:
pnpm -C apps/org dev -- -p 3302
```

### Step 5 — Verify

1. Visit `http://localhost:3302/accounting`
2. Fund balance cards should appear (green for SDQ, purple for ZKT if org4)
3. Sample transactions should appear in the list
4. Record a test income entry → confirm it appears in the list

---

## CTCF Layer 2 connection

The `fund_period_closes` table has a `financial_snapshot_id` column that references `financial_snapshots`. When an org closes a financial year period in amanahOS, the linked financial snapshot gets populated with verified fund data — which the CTCF scoring engine reads for:

- Annual financial statement: ✅ (journal entries exist for the period)
- Fund segregation (zakat/waqf): ✅ (funds tagged correctly)
- Programme vs admin breakdown: Sprint 16 (expense account categorisation)

---

## Commit message

```
feat(sprint15): Islamic fund accounting schema + UI

- Migration 0020_fund_accounting.sql: funds, accounts, journal_entries,
  journal_lines, fund_period_closes tables + RLS + indexes
- get_platform_user_id() helper: permanent fix for auth UUID / seed UUID mismatch
- is_fund_org_member() + is_fund_org_manager(): RLS bridge functions
- fund_balances_view: live fund balances from journal_lines
- seed_fund_accounting.sql: funds + CoA + sample entries for all 5 orgs
- apps/org accounting page: fund balance cards, transaction list, year switcher
- QuickEntryForm: income/expense with fund selection, balanced journal entry
- accounting-actions.ts: createJournalEntry, createQuickIncome, createQuickExpense
```

---

## Sprint 16 picks up from here

- Expense categorisation (programme vs admin) for CTCF Layer 2 breakdown
- Financial period close workflow
- Auto-generate financial statements (Statement of Financial Position,
  Statement of Activities, Fund Balance Report)
- Link period close → financial_snapshots

*Bismillah — Sprint 15 complete. Alhamdulillah.*
