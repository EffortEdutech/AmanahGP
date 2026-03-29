# Amanah Governance Platform — Sprint 0 Completion Report

**Document ID:** 00-PROJ-SPRINT0-COMPLETION-P1  
**Version:** v1.0  
**Date:** 27 Mar 2026  
**Owner:** Darya Malak  
**Status:** Delivered

---

## Sprint 0 Goal
> Eliminate setup chaos so every developer can run the system locally with seed demo data.

---

## P0 Exit Criteria — Status

| Criteria | Status | Deliverable |
|---|---|---|
| Backend stack chosen (ADR-001) and naming conventions locked | ✅ Done | `docs/ADR-001-backend-framework.md` |
| Repo + docker-compose + .env.example + README run steps | ✅ Done | `pnpm-workspace.yaml`, `.env.example`, `apps/*/env.example`, `supabase/config.toml` |
| Migrations + seed script run from scratch | ✅ Done | `supabase/migrations/0001_core_schema.sql`, `0002_rls_policies.sql`, `supabase/seed.sql` |
| Auth + RBAC skeleton works | ✅ Done | `supabase/migrations/0002_rls_policies.sql`, `apps/*/lib/supabase/` |
| API route skeleton exists for public/org/admin/donations/webhooks | ✅ Done | See Route Skeletons below |
| Audit logging baseline in place | ✅ Done | `apps/*/lib/audit.ts`, `audit_logs` table + RLS |
| Demo script is runnable end-to-end on staging/local | ✅ Done | `scripts/demo-check.mjs` |

---

## Deliverables Produced

### Architecture + Decisions
- `docs/ADR-001-backend-framework.md` — Supabase-first, locked
- `docs/ADR-003-payment-gateway.md` — ToyyibPay primary, Billplz adapter
- `docs/ADR-004-donor-identity.md` — Guest donation allowed
- `docs/DECISION_LOG.md` — All 15 locked decisions in one place
- `docs/IMPLEMENTATION_ORDER.md` — Locked Phase A–F build sequence
- `docs/BRANDING_GUIDE.md` — AmanahHub / AmanahHub Console naming rules

### Database
- `supabase/migrations/0001_core_schema.sql`
  - All 15 Phase 1 tables
  - All foreign keys and constraints
  - All recommended indexes
  - `updated_at` trigger for all tables
  - 4 RBAC helper functions: `current_user_platform_role()`, `current_user_id()`, `is_org_member()`, `org_role_at_least()`
- `supabase/migrations/0002_rls_policies.sql`
  - RLS enabled + forced on all 15 tables
  - Default deny policy model
  - Public reads: narrow and intentional
  - Tenant-scoped reads/writes via `org_members`
  - Reviewer/super_admin access rules
  - Append-only tables: no UPDATE/DELETE via anon/user roles
- `supabase/seed.sql`
  - 5 users (super_admin, reviewer, scholar, org_admin, donor)
  - 3 organizations (draft, submitted, approved+listed)
  - 1 project, 1 verified report, 1 public evidence file
  - 1 verified financial snapshot
  - Full certification chain (application → evaluation → history)
  - 2 trust events
  - 1 Amanah Index history entry (score: 74.50)
  - 2 donations (1 initiated, 1 confirmed)
  - 1 processed webhook event
  - 3 audit log entries

### Supabase Config
- `supabase/config.toml` — ports, redirect URLs, storage buckets, auth settings

### App Scaffolding
- `apps/user/lib/supabase/client.ts` — browser client (AmanahHub)
- `apps/user/lib/supabase/server.ts` — server + service role client (AmanahHub)
- `apps/admin/lib/supabase/client.ts` — browser client (AmanahHub Console)
- `apps/admin/lib/supabase/server.ts` — server + service role client (AmanahHub Console)
- `apps/user/lib/audit.ts` — audit log write helper
- `apps/admin/lib/audit.ts` — audit log write helper

### Route Skeletons
| Route | File | Status |
|---|---|---|
| `GET /api/public/charities` | `apps/user/app/api/public/charities/route.ts` | ✅ Skeleton |
| `POST /app/actions/donations` | `apps/user/app/actions/donations.ts` | ✅ Skeleton (ToyyibPay integrated) |
| `GET /api/admin/review-queue/onboarding` | `apps/admin/app/api/admin/review-queue/onboarding/route.ts` | ✅ Skeleton |
| `POST /functions/v1/webhook-payments/:gateway` | `supabase/functions/webhook-payments/index.ts` | ✅ Full implementation |

### Shared Packages
- `packages/config/src/roles.ts` — All roles, statuses, event types, audit actions
- `packages/config/src/index.ts` — Brand constants, pagination defaults, score config

### Environment
- `.env.example` — root
- `apps/user/.env.example` — AmanahHub
- `apps/admin/.env.example` — AmanahHub Console

### Scripts
- `scripts/demo-check.mjs` — End-to-end Sprint 0 validation (15 checks)

---

## Local Development — Quick Start

```powershell
# 1. Start Docker Desktop

# 2. Start Supabase
npx supabase start
npx supabase status  # copy ANON KEY + SERVICE ROLE KEY to .env.local files

# 3. Run migrations + seed
npx supabase db reset

# 4. Validate baseline
node scripts/demo-check.mjs

# 5. Start apps
pnpm -C apps/user dev -- -p 3200   # AmanahHub
pnpm -C apps/admin dev -- -p 3201  # AmanahHub Console
```

---

## Seed Users (local dev)

| Email | Role | Password |
|---|---|---|
| `superadmin@agp.test` | super_admin | `Test1234!` |
| `reviewer@agp.test` | reviewer | `Test1234!` |
| `scholar@agp.test` | scholar | `Test1234!` |
| `orgadmin@agp.test` | donor + org_admin | `Test1234!` |
| `donor@agp.test` | donor | `Test1234!` |

> Create these in Supabase Studio → Authentication → Users, then run seed.sql.
> The `auth_provider_user_id` in `public.users` must match the UUID Supabase Auth assigns.
> Use `scripts/seed-auth-users.ts` (Sprint 1 deliverable) to automate this.

---

## Demo Path (End-to-End)

1. **Public directory** → `http://localhost:3200/api/public/charities` → returns "Masjid Al-Amanah Waqf Trust"
2. **Amanah score** visible (74.50) with Gold Amanah certification
3. **Reviewer login** → `http://localhost:3201` → review queue shows 1 submitted org
4. **Org admin login** → manages projects and reports for approved org
5. **Donation** → initiate → redirects to ToyyibPay sandbox → webhook confirms
6. **Audit logs** → visible in AmanahHub Console for super_admin

---

## Locked Naming Conventions

| Layer | Convention |
|---|---|
| Tables | `snake_case` plural |
| PKs | `id uuid` |
| FKs | `<table>_id` |
| Timestamps | `created_at`, `updated_at`, `deleted_at` |
| Enums | stored as `text` with `CHECK` constraints |
| Tenant boundary | `organization_id` everywhere |
| Score versions | `amanah_v1`, `ctcf_v1` |
| Gateways | `toyyibpay`, `billplz` |

---

## What Was NOT Built in Sprint 0 (Intentionally)

- No UI pages (Sprint 1+)
- No full auth signup/login flow (Sprint 1)
- No org onboarding form (Sprint 1)
- No CTCF scoring logic (Sprint 5)
- No Amanah recalculation function (Sprint 5)
- No Billplz adapter (reserved)
- No Redis/queue (deferred — ADR-006)

---

## Sprint 1 Picks Up From Here

- Connect auth to both apps (sign up, sign in, session)
- Auto-create `public.users` record on auth signup
- Org creation + onboarding form (AmanahHub Console)
- Malaysia classification fields form
- Membership invite flow
- Seed auth users script

---

## Final Statement

Sprint 0 is complete. The baseline is stable enough to begin Sprint 1.

Bismillah — proceed.  
Alhamdulillah.
