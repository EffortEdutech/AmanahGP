# Sprint 19 — Trust Event Engine
## Apply Guide

Bismillah. This sprint wires every accounting action into a live Amanah Trust Score.

---

## What this sprint delivers

| Component | What it does |
|---|---|
| `0023_trust_event_engine.sql` | Expands trust_events schema, creates emit/recalculate/decay functions, adds 5 DB triggers |
| `apps/org/app/(protected)/trust/page.tsx` | Full trust score dashboard — live score, 5 pillars, event timeline, gamification |
| `apps/org/lib/trust-event-actions.ts` | Server actions for manual event emission (policy upload, report publish, etc.) |
| `supabase/functions/apply-score-decay/index.ts` | Edge Function for monthly pillar decay |

---

## Step 1 — Run migration in Supabase SQL Editor

Open: https://supabase.com/dashboard/project/uscgtpvdgcgrfzvccnwq/sql/new

Paste and run the full contents of:
```
supabase/migrations/0023_trust_event_engine.sql
```

**What it does:**
- Drops the old restrictive `event_type` CHECK constraint
- Adds 50+ new event type values (fi_*, gov_*, com_*, trn_*, imp_*)
- Adds `pillar` and `score_delta` columns to `trust_events`
- Creates `emit_trust_event()` helper function
- Creates `recalculate_amanah_score_v2()` — the scoring engine
- Creates `get_latest_trust_score()` — convenience API function
- Creates `apply_score_decay()` — monthly decay function
- Creates 5 DB triggers:
  - `fund_period_closes` INSERT → `fi_period_closed` (+8) or `fi_period_closed_late` (-5)
  - `bank_reconciliations` UPDATE → `fi_bank_reconciled` (+6) or `fi_bank_discrepancy` (-8)
  - `bank_reconciliations` INSERT (if finalised) → same
  - `payment_requests` UPDATE to approved → `gov_payment_dual_approved` (+4) or `gov_payment_self_approved` (-15)
  - `bank_accounts` INSERT → `fi_bank_account_linked` (+5)

---

## Step 2 — Copy files into repo

```
apps/org/app/(protected)/trust/page.tsx          ← replace existing stub
apps/org/lib/trust-event-actions.ts              ← new file
supabase/functions/apply-score-decay/index.ts    ← new Edge Function
```

PowerShell copy commands (run from repo root):
```powershell
# Copy trust page
Copy-Item "path\to\sprint19\apps\org\app\(protected)\trust\page.tsx" `
          "apps\org\app\(protected)\trust\page.tsx" -Force

# Copy trust event actions
Copy-Item "path\to\sprint19\apps\org\lib\trust-event-actions.ts" `
          "apps\org\lib\trust-event-actions.ts" -Force

# Copy Edge Function (create folder if needed)
New-Item -ItemType Directory -Force -Path "supabase\functions\apply-score-decay"
Copy-Item "path\to\sprint19\supabase\functions\apply-score-decay\index.ts" `
          "supabase\functions\apply-score-decay\index.ts" -Force
```

---

## Step 3 — Test the engine

### 3a. Trigger a trust event by closing a financial period

Go to: `/accounting/close`

Select a month → complete the 4 phases → click "Close period"

**What happens automatically:**
1. `fund_period_closes` row inserted
2. DB trigger fires `trg_emit_on_period_close()`
3. `emit_trust_event()` inserts row in `trust_events` (type: `fi_period_closed`, delta: +8)
4. `recalculate_amanah_score_v2()` runs immediately
5. New row in `amanah_index_history` (score_version: `amanah_v2_events`)
6. Go to `/trust` → score updated, event visible in timeline

### 3b. Trigger via bank reconciliation

Go to: `/accounting/bank-accounts` → click "Reconcile" on any account → enter statement balance → click "🟢 Mark reconciled"

**What happens:**
1. `bank_reconciliations` row updated to `status = reconciled`
2. DB trigger fires → `fi_bank_reconciled` event (+6)
3. Score recalculates

### 3c. Verify in Supabase

```sql
-- Check trust events
SELECT event_type, pillar, score_delta, occurred_at
FROM public.trust_events
WHERE organization_id = 'b0000001-0000-0000-0000-000000000001'
ORDER BY occurred_at DESC
LIMIT 10;

-- Check score history
SELECT score_version, score_value, computed_at
FROM public.amanah_index_history
WHERE organization_id = 'b0000001-0000-0000-0000-000000000001'
ORDER BY computed_at DESC
LIMIT 5;

-- Use the convenience function
SELECT * FROM public.get_latest_trust_score('b0000001-0000-0000-0000-000000000001');
```

---

## Step 4 — Deploy Edge Function (monthly decay)

```bash
# From repo root
supabase functions deploy apply-score-decay --project-ref uscgtpvdgcgrfzvccnwq
```

Then in Supabase Dashboard → Edge Functions → apply-score-decay → Schedules:
- Add schedule: `0 2 1 * *` (2am, 1st of every month)
- Or trigger manually by calling the function URL with a POST request

---

## Step 5 — Commit

```powershell
git add .
git commit -m "feat(sprint19): trust event engine — auto-emit from accounting actions, 5-pillar scoring, score decay"
git push origin phase2/amanahOS-scaffold
```

---

## How the scoring works

```
Every accounting action → DB trigger → trust_event row inserted → recalculate_amanah_score_v2() runs

Score = SUM(event score_deltas per pillar) → apply caps → normalise to 0–100

Pillar caps:
  Financial Integrity  : max 300 pts
  Governance           : max 200 pts
  Compliance           : max 200 pts
  Transparency         : max 150 pts
  Impact               : max 150 pts
  TOTAL                : 1000 pts → ÷10 = 0–100

Risk caps (auto-detected):
  No monthly close in 3 months  → Financial capped at 60%
  Self-approval detected         → Governance capped at 40%
  Audit overdue                  → Compliance capped at 50%
```

---

## What you see on /trust after applying

- **Amanah score** — live 0–100 with grade (Foundation → Bronze → Silver → Gold → Platinum)
- **5 pillar bars** — colour-coded progress bars with raw points, max points, % filled
- **Risk flags** — red banner if any cap is active, with direct link to fix it
- **"Improve your score"** — top 3 recommended actions with point values ("Close this month → +8 pts")
- **Trust event timeline** — every event with +/- badge, pillar tag, timestamp
- **Score history** — last 10 score calculations with ▲/▼ delta indicators

---

## Sprint 20 — what comes next

Payment Requests UI — the `payment_requests` tables exist, the triggers are wired, but the UI is missing.
When org_admin approves a payment → `gov_payment_dual_approved` event fires → +4 Governance score.
If the same user creates and approves → `gov_payment_self_approved` fires → -15 Governance.

This closes the governance scoring loop.
