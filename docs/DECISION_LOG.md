# Amanah Governance Platform — Decision Log

**Version:** v1.2  
**Date:** 27 Mar 2026  
**Owner:** Darya Malak  
**Status:** Active

---

## Locked Decisions (Do Not Reopen)

| # | Decision | Status | ADR |
|---|---|---|---|
| 1 | Backend: Supabase-first, no separate always-on API server in Phase 1 | **Locked** | ADR-001 |
| 2 | Two apps: `apps/user` (AmanahHub) and `apps/admin` (AmanahHub Console) | **Locked** | — |
| 3 | Payment gateway: ToyyibPay primary, Billplz future adapter | **Locked** | ADR-003 |
| 4 | Donor identity: guest donation allowed, login optional | **Locked** | ADR-004 |
| 5 | Tenant boundary key: `organization_id` everywhere | **Locked** | — |
| 6 | RLS: default deny, enforced on all tenant tables | **Locked** | — |
| 7 | Trust/score history: append-only, never overwrite | **Locked** | — |
| 8 | Webhook idempotency: `payment_webhook_events (gateway, event_id)` unique | **Locked** | — |
| 9 | Evidence: private by default, `is_approved_public=true` required for public | **Locked** | — |
| 10 | Package manager: pnpm | **Locked** | — |
| 11 | Frontend: Next.js + Tailwind (both apps) | **Locked** | — |
| 12 | Score versions: `amanah_v1`, `ctcf_v1` for Phase 1 | **Locked** | — |
| 13 | Malaysia-first: `org_type`, `oversight_authority`, `fund_types` from day 1 | **Locked** | — |
| 14 | Non-custodial: platform never holds funds | **Locked** | — |
| 15 | Branding: Amanah Governance Platform / AmanahHub / AmanahHub Console | **Locked** | — |
| 16 | Repo, Supabase project, Supabase org, and GitHub org | **Locked** | — |
| 17 | Local dev ports: 3300 (user) / 3301 (admin) | **Locked** | — |

---

## Decision #16 — Repo, Supabase, and GitHub

**Decided:** 27 Mar 2026  
**Status:** Confirmed and live

| Layer | Name / URL |
|---|---|
| GitHub organisation | `EffortEdutech` |
| Git repository name | `AmanahGP` |
| GitHub repo URL | `https://github.com/EffortEdutech/AmanahGP` |
| Supabase project name | `AmanahGP` |
| Supabase project ref | `uscgtpvdgcgrfzvccnwq` |
| Supabase org | `AmanahGP Org` |
| Supabase dashboard | `https://supabase.com/dashboard/project/uscgtpvdgcgrfzvccnwq` |
| Monorepo root folder | `amanah-governance-platform/` (local) |
| Default branch | `main` |

### What does NOT change
- App names: **AmanahHub** and **AmanahHub Console**
- Platform brand: **Amanah Governance Platform**
- Internal folder paths: `apps/user`, `apps/admin`, `supabase/`
- All env variable names, table names, RLS policies, function names

---

## Decision #17 — Local Dev Ports

**Decided:** 27 Mar 2026

| App | Port |
|---|---|
| AmanahHub (`apps/user`) | `3300` |
| AmanahHub Console (`apps/admin`) | `3301` |

Reason: port 3200 was occupied on the development machine.

Start commands:
```powershell
pnpm -C apps/user dev -- -p 3300
pnpm -C apps/admin dev -- -p 3301
```

---

## Open Decisions (Pending ADR)

| # | Question | Target |
|---|---|---|
| ADR-005 | Evidence storage public-access policy (signed URL TTL, CDN) | Sprint 4 |
| ADR-006 | Background jobs / queue (Redis + worker vs Supabase pg_cron) | Sprint 5 |

---

## Change Control Reminder

Any change to a **Locked** decision requires:
1. Written rationale
2. Impact on timeline / security / compliance
3. Product Owner (Darya Malak) approval
4. New or updated ADR entry
