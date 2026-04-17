# AGP Console Build Guide — Step by Step

Source basis:
- Amanah Console v2.md
- RUNBOOK_LOCAL_DEV_SADAQAH.md
- RLS_POLICY_PLAN.md

## Goal
Build `apps/console` as the replacement for deprecated `apps/admin`, while keeping:
- `apps/user` = Amanah Hub
- `apps/org` = Amanah OS
- `apps/console` = AGP Console

---

## 0. Locked decisions

1. Do **not** refactor `apps/admin` into the new Console.
2. Treat `apps/admin` as a **legacy mine** for reusable UI and utility code only.
3. Build `apps/console` as a **greenfield app**.
4. Keep the current platform direction:
   - Next.js App Router
   - TypeScript
   - Tailwind
   - shared packages
   - Supabase-first database and auth in the current repo reality
5. Console owns only **platform-level data**, never org accounting data.

---

## 1. Build order

### Phase A — Freeze and prepare
- Freeze `apps/admin`
- Create `apps/console`
- Reserve a temporary local port for Console, e.g. `3303`
- Add `.env.local` for Console using the same local Supabase stack

### Phase B — Shared foundation
- Extract `design-system`
- Extract `auth`
- Extract `permissions`
- Extract `audit`
- Extract `notifications`
- Add Console shell, sidebar, dashboard route

### Phase C — Platform database
- Create Console platform tables
- Add helper SQL functions
- Add RLS policies
- Add seed data for plans, apps, roles

### Phase D — MVP features
- Dashboard
- Organisations
- Members
- App provisioning
- Billing placeholder
- Audit log
- Platform settings

### Phase E — Cutover
- Replace internal references from admin to console
- Move `apps/admin` to read-only legacy status
- Switch local/dev deployment target to `apps/console`

---

## 2. Step-by-step implementation

## Step 1 — Freeze old admin safely

### Action
- Stop building new features in `apps/admin`
- Add a banner comment in README/docs that `apps/admin` is deprecated
- Optional later rename to `apps/_legacy_admin`

### What to salvage only
- layout components
- sidebar
- tables
- forms
- modal patterns
- loading states
- utility helpers
- theme/tailwind tokens

### What to rebuild from scratch
- routing
- role engine
- organisation lifecycle
- provisioning
- billing
- audit logic

---

## Step 2 — Create the new app folder

### Target
```text
apps/
  user/
  org/
  console/
```

### Minimum folder structure
```text
apps/console/
  app/
    (auth)/
      login/
      onboarding/
    (console)/
      dashboard/
      organisations/
        new/
        [orgId]/
          overview/
          members/
          apps/
          billing/
          settings/
      plans/
      audit-log/
      settings/
  components/
  features/
  lib/
  public/
  .env.local
  package.json
  tsconfig.json
  next.config.ts
```

### Temporary local run command
```powershell
pnpm -C apps/console dev -- -p 3202
```

---

## Step 3 — Connect Console to the same local Supabase

Use the same local stack already documented in the runbook.

### `apps/console/.env.local`
```text
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54421
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_LOCAL_ANON_KEY
```

### Also update redirect URLs later
Add `http://localhost:3202/**` into `supabase/config.toml` during local build.

---

## Step 4 — Create the Console shell first

Build the app before building features.

### Pages to create first
- `/login`
- `/dashboard`
- `/organisations`
- `/plans`
- `/audit-log`
- `/settings`

### Shell requirements
- left sidebar
- top header
- user menu
- current platform role badge
- current org context indicator if needed
- empty-state friendly pages

### Done when
- you can log in
- protected routes redirect correctly
- sidebar navigation works
- dashboard page loads without feature data yet

---

## Step 5 — Extract shared packages before feature work

### Recommended packages
```text
packages/
  design-system/
  auth/
  permissions/
  audit/
  notifications/
  org-core/
  billing/
  database/
  api-client/
```

### Priority order
1. `design-system`
2. `auth`
3. `permissions`
4. `audit`
5. `notifications`

### `packages/design-system`
Move from old admin:
- Button
- Input
- Table
- Card
- Dialog/Modal
- Sidebar primitives
- Page wrapper
- badge and status chips

### `packages/auth`
Create shared helpers like:
- `getCurrentUser()`
- `requireAuth()`
- `requirePlatformRole()`
- `createServerSupabaseClient()`

### `packages/permissions`
Start with explicit checks:
- `isPlatformOwner`
- `isPlatformAdmin`
- `isSupportAgent`
- `isPlatformAuditor`
- `canManageOrganisations`
- `canManagePlans`
- `canViewAuditLog`

---

## Step 6 — Lock the Console data boundary

Console owns only platform-level tables.

### Core Console tables
```text
platform_roles
organisations
memberships
organisation_invitations
app_catalog
app_installations
plans
subscriptions
invoices
audit_logs
compliance_flags
notification_queue
```

### Important rule
Do **not** put org accounting transactions, org reports, or internal operational records into Console tables.

---

## Step 7 — Add the SQL migrations for Console

Your repo is already Supabase-first, so use SQL migrations instead of introducing Prisma now.

### Suggested migration sequence
```text
supabase/migrations/
  0003_console_platform_core.sql
  0004_console_platform_rls.sql
  0005_console_platform_seed.sql
```

### 0003 — Core tables
Create:
- organisations
- memberships
- organisation_invitations
- app_catalog
- app_installations
- plans
- subscriptions
- invoices
- audit_logs
- platform_user_roles

### Recommended enums
```sql
create type org_status as enum ('draft', 'active', 'suspended', 'archived');
create type membership_status as enum ('invited', 'active', 'suspended', 'removed');
create type subscription_status as enum ('trial', 'active', 'past_due', 'suspended', 'cancelled');
create type installation_status as enum ('enabled', 'disabled', 'suspended');
create type platform_role as enum ('platform_owner', 'platform_admin', 'support_agent', 'platform_auditor');
```

### Minimum column ideas

#### organisations
- id uuid pk
- legal_name text
- registration_number text
- jurisdiction text
- organisation_type text
- status org_status
- owner_user_id uuid nullable
- created_at timestamptz
- updated_at timestamptz

#### memberships
- id uuid pk
- organisation_id uuid
- user_id uuid
- org_role text
- status membership_status
- invited_by uuid nullable
- joined_at timestamptz nullable
- created_at timestamptz

#### app_catalog
- id uuid pk
- app_key text unique  -- `hub`, `os`, `public_portal`, etc.
- app_name text
- description text
- is_active boolean

#### app_installations
- id uuid pk
- organisation_id uuid
- app_id uuid
- status installation_status
- enabled_at timestamptz

#### plans
- id uuid pk
- code text unique
- name text
- billing_cycle text
- price_monthly numeric
- price_yearly numeric
- seat_limit integer nullable
- is_active boolean

#### subscriptions
- id uuid pk
- organisation_id uuid
- plan_id uuid
- status subscription_status
- seats integer
- starts_at timestamptz
- ends_at timestamptz nullable

#### audit_logs
- id uuid pk
- actor_user_id uuid nullable
- organisation_id uuid nullable
- source_app text
- action text
- resource_type text
- resource_id uuid nullable
- metadata jsonb default '{}'::jsonb
- created_at timestamptz

---

## Step 8 — Add helper SQL functions for RLS and auditing

### Recommended helper functions
- `is_platform_role(role platform_role)`
- `is_org_member(org_id uuid)`
- `org_role_at_least(org_id uuid, min_role text)`
- `log_audit_event(...)`

### Why
This keeps policies readable and consistent.

---

## Step 9 — Apply RLS for platform security

### Policy idea by table

#### organisations
- platform owner/admin: full access
- support agent: read only
- platform auditor: read limited
- org members: read own org metadata only

#### memberships
- platform owner/admin: full access
- org owner/admin: read and manage memberships for their org
- support agent: read only

#### plans
- platform owner: manage
- platform admin: read or limited manage depending on your policy
- everyone else: no direct write

#### subscriptions
- platform owner/admin: full access
- org owner/admin: read their own org subscription summary

#### audit_logs
- platform owner/auditor: read
- platform admin: read
- support agent: maybe limited read
- nobody except trusted server actions inserts directly

---

## Step 10 — Seed the minimum platform records

### Seed these first
- platform roles
- app catalog:
  - `hub`
  - `os`
  - `public_portal` (optional future)
- plans:
  - `trial`
  - `basic`
  - `growth`
  - `enterprise`

### Also seed one platform owner user mapping
So Console is usable immediately after migration.

---

## Step 11 — Build MVP feature 1: Dashboard

### Purpose
A pure platform overview page.

### Widgets
- total organisations
- active organisations
- suspended organisations
- trial subscriptions
- active subscriptions
- recent audit events
- pending invites

### Rule
Dashboard shows platform metadata only, not org financial internals.

---

## Step 12 — Build MVP feature 2: Organisation Management

### Pages
- `/organisations`
- `/organisations/new`
- `/organisations/[orgId]/overview`

### Core actions
- create organisation
- edit legal profile
- assign owner
- change status: draft / active / suspended / archived
- view installed apps
- view subscription summary

### Service actions to implement
```text
features/organisations/services/
  createOrganisation.ts
  updateOrganisation.ts
  getOrganisation.ts
  listOrganisations.ts
  changeOrganisationStatus.ts
  assignOrganisationOwner.ts
```

### Every service must
- validate with Zod
- check auth/permissions
- write audit log

---

## Step 13 — Build MVP feature 3: Memberships & invites

### Pages
- `/organisations/[orgId]/members`

### Capabilities
- list members
- invite member by email
- assign org role
- suspend membership
- remove membership
- resend invite

### Flow
1. create invitation record
2. send email via notification layer
3. accept invite
4. create membership
5. write audit log

---

## Step 14 — Build MVP feature 4: App provisioning

### Page
- `/organisations/[orgId]/apps`

### Capabilities
- view catalog
- enable Amanah OS for an org
- disable/suspend an installation
- show installation status

### Initial rule
For Phase 1, app provisioning can be metadata + feature flags.
Do not over-engineer deployment automation yet.

---

## Step 15 — Build MVP feature 5: Billing & plans

### Pages
- `/plans`
- `/organisations/[orgId]/billing`

### Phase 1 scope
- view plans
- assign plan to organisation
- set seats
- show subscription status
- store invoices/payments as records if already needed

### Keep simple initially
Real payment automation can come later.
First lock the subscription model and admin flows.

---

## Step 16 — Build MVP feature 6: Global audit log

### Page
- `/audit-log`

### Must record
- organisation created
- owner assigned
- membership invited
- role changed
- app enabled/disabled
- plan changed
- subscription status changed
- organisation suspended/archived

### Audit event shape
```ts
{
  actorUserId,
  organisationId,
  sourceApp: 'console',
  action,
  resourceType,
  resourceId,
  metadata,
  createdAt,
}
```

---

## Step 17 — Build platform settings

### Page
- `/settings`

### Keep minimal first
- platform branding metadata
- notification config placeholders
- support contact
- environment indicators

---

## Step 18 — Add route guards and role guards

### Route protection examples
- `/plans` → platform owner only
- `/audit-log` → platform owner/admin/auditor
- `/organisations/*` → platform owner/admin/support

### UI rule
Hide actions the role cannot execute.
Do not rely on UI-only hiding; backend/server action checks remain mandatory.

---

## Step 19 — Add observability and test cases

### Test cases to run manually first
- login as platform owner
- create organisation
- assign org owner
- invite member
- enable app installation
- change subscription
- suspend organisation
- verify audit log recorded every step
- verify org app still cannot read Console-only records beyond allowed metadata

### Important negative tests
- org admin cannot act like platform admin
- support agent cannot mutate plans
- platform auditor cannot edit organisation
- console cannot query org financial tables directly in feature code

---

## Step 20 — Cutover and deprecate admin fully

### When Console MVP is stable
- switch developer startup docs from `apps/admin` to `apps/console`
- change Vercel target for old admin deployment if needed
- move `apps/admin` to legacy/read-only
- keep old code only as reference until fully safe to archive

---

## 3. Recommended first sprint sequence

### Sprint 0
- create `apps/console`
- boot app on `3202`
- auth guard
- sidebar shell
- dashboard shell
- extract `design-system`

### Sprint 1
- console core migrations
- organisations list/new/details
- audit logging backbone

### Sprint 2
- memberships
- invites
- app provisioning

### Sprint 3
- plans
- subscriptions
- billing summary
- hardening and cleanup

---

## 4. Recommended immediate next action

Start with this exact order:
1. create `apps/console`
2. run it on `3202`
3. create Console shell routes
4. extract `packages/design-system`
5. create `0003_console_platform_core.sql`
6. build organisations feature first

That is the cleanest path with the least risk.
