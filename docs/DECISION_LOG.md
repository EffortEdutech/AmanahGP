# Amanah Governance Platform — Decision Log

**Version:** v1.0  
**Date:** 27 Mar 2026  
**Owner:** Darya Malak  
**Status:** Active

This is the single canonical record of locked decisions. Each entry has a status and a pointer to its full ADR.

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
