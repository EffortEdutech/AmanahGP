# Amanah Governance Platform

> **Trusted Giving. Transparent Governance.**

[![Phase](https://img.shields.io/badge/Phase-1-blue)](#phase-1-summary)
[![Architecture](https://img.shields.io/badge/Architecture-Supabase--first-success)](#architecture)
[![Apps](https://img.shields.io/badge/Apps-2-informational)](#apps)
[![Package Manager](https://img.shields.io/badge/Package%20Manager-pnpm-orange)](#repo-structure)
[![Status](https://img.shields.io/badge/Status-Sprint%200%20Complete-brightgreen)](#status)

Amanah Governance Platform is a Malaysia-first digital platform for Islamic charity governance, transparency, and donor confidence. Phase 1 is built as a **Supabase-first monorepo** with two Next.js apps:

- **AmanahHub** (`apps/user`) — public and donor-facing app
- **AmanahHub Console** (`apps/admin`) — organization, reviewer, scholar, and platform operations app

---

## Quick Start

```bash
# 1. Start Docker Desktop

# 2. Start Supabase
npx supabase start
npx supabase status   # copy keys to .env.local files

# 3. Create .env.local files (see apps/user/.env.example, apps/admin/.env.example)

# 4. Run migrations + seed
npx supabase db reset

# 5. Validate Sprint 0 baseline
node scripts/demo-check.mjs

# 6. Start apps
pnpm -C apps/user dev -- -p 3200    # AmanahHub       → http://localhost:3200
pnpm -C apps/admin dev -- -p 3201   # AmanahHub Console → http://localhost:3201
```

---

## Local URLs

| Service | URL |
|---|---|
| AmanahHub | http://localhost:3200 |
| AmanahHub Console | http://localhost:3201 |
| Supabase API | http://127.0.0.1:54421 |
| Supabase Studio | http://127.0.0.1:54423 |
| Mailpit | http://127.0.0.1:54424 |

---

## Repo Structure

```
amanah-governance-platform/
├─ apps/
│  ├─ user/               # AmanahHub (public + donor app)
│  └─ admin/              # AmanahHub Console (org/reviewer/admin app)
├─ supabase/
│  ├─ migrations/
│  │  ├─ 0001_core_schema.sql     # All 15 Phase 1 tables + RBAC helpers
│  │  └─ 0002_rls_policies.sql    # RLS policies (default deny)
│  ├─ seed.sql                    # Demo seed data
│  ├─ config.toml                 # Local Supabase config
│  └─ functions/
│     └─ webhook-payments/        # ToyyibPay webhook handler
├─ packages/
│  ├─ config/                     # Shared roles, constants, brand
│  └─ validation/                 # Shared Zod schemas (Sprint 1+)
├─ docs/
│  ├─ ADR-001-backend-framework.md
│  ├─ ADR-003-payment-gateway.md
│  ├─ ADR-004-donor-identity.md
│  ├─ DECISION_LOG.md
│  ├─ IMPLEMENTATION_ORDER.md
│  ├─ BRANDING_GUIDE.md
│  └─ SPRINT0_COMPLETION.md
├─ scripts/
│  └─ demo-check.mjs              # Sprint 0 validation (15 checks)
├─ .env.example
├─ package.json
├─ pnpm-workspace.yaml
└─ README.md
```

---

## Architecture

**Supabase-first. No separate always-on backend in Phase 1.**

- `apps/user` + `apps/admin` → Next.js 15 + Tailwind
- `supabase` → Auth, Postgres, Storage, RLS, Migrations
- `supabase/functions` → Privileged server-side tasks only (webhooks, reconciliation)
- Server Actions → App-layer business logic

See `docs/ADR-001-backend-framework.md`.

---

## Core Principles

1. **Non-custodial** — platform never holds funds; donations go direct-to-charity
2. **Default-deny RLS** — all tenant tables protected; public reads are narrow and explicit
3. **Append-only histories** — `trust_events`, `amanah_index_history`, `certification_history`, `audit_logs` are never overwritten
4. **Tenant boundary** — `organization_id` everywhere
5. **Malaysia-first** — `org_type`, `oversight_authority`, `fund_types` from day 1

---

## Database

**15 tables.** All with RLS enabled and `organization_id` tenant boundary.

| Domain | Tables |
|---|---|
| Identity | `users`, `organizations`, `org_members` |
| Projects | `projects`, `project_reports`, `evidence_files` |
| Finance + Cert | `financial_snapshots`, `certification_applications`, `certification_evaluations`, `certification_history` |
| Trust | `trust_events`, `amanah_index_history` |
| Donations | `donation_transactions`, `payment_webhook_events` |
| Audit | `audit_logs` |

---

## Seed Users (local dev only)

| Email | Platform Role | Org Role |
|---|---|---|
| superadmin@agp.test | super_admin | — |
| reviewer@agp.test | reviewer | — |
| scholar@agp.test | scholar | — |
| orgadmin@agp.test | donor | org_admin |
| donor@agp.test | donor | — |

Default dev password: `Test1234!`

---

## Payment Gateway

- **Phase 1 primary:** ToyyibPay
- **Future adapter:** Billplz
- Donation engine uses a provider adapter interface — gateways are pluggable

See `docs/ADR-003-payment-gateway.md`.

---

## Security Rules

- RLS default deny on all 15 tables
- `SUPABASE_SERVICE_ROLE_KEY` is server-side only — never in `NEXT_PUBLIC_` vars
- Evidence files are private by default — `is_approved_public=true` required
- Webhook processing uses service role — never anon key
- Audit logs are written server-side only — no client insert policy

---

## Naming Conventions

| Layer | Convention |
|---|---|
| Tables | `snake_case` plural |
| PKs | `id uuid` |
| FKs | `<table>_id` |
| Timestamps | `created_at`, `updated_at` |
| Enums | `text` + `CHECK` constraint |
| Tenant key | `organization_id` |
| Score versions | `amanah_v1`, `ctcf_v1` |

---

## Status

Sprint 0 is complete. The local baseline is stable enough for Sprint 1.

Sprint 1 picks up: auth flows, org creation, onboarding form, Malaysia classification, membership invites.

**Bismillah — Alhamdulillah.**
