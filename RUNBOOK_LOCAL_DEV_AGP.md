# Amanah Governance Platform — Local Development Runbook (Windows)

> Renamed from `RUNBOOK_LOCAL_DEV_SADAQAH.md` — Phase 2 update adds `apps/org` (amanahOS).

This is the **quick reference** for starting, stopping, and restarting the local dev environment on Windows.

---

## Current local URLs

### Apps
| App | URL | Purpose |
|-----|-----|---------|
| AmanahHub | `http://localhost:3300` | Public + donor facing |
| AmanahHub Console | `http://localhost:3301` | Reviewer / admin / org management |
| amanahOS *(Phase 2)* | `http://localhost:3302` | Org governance workspace |

### Local Supabase stack
| Service | URL |
|---------|-----|
| Supabase API | `http://127.0.0.1:54421` |
| Supabase Studio | `http://127.0.0.1:54423` |
| Mailpit (local email) | `http://127.0.0.1:54424` |

---

## Project folder

```powershell
cd "C:\PATH\TO\AmanahGP"
```

---

## Fast startup after laptop restart

### Step 1 — Start Docker Desktop
Open **Docker Desktop** and wait until it shows **Running**.

```powershell
docker info
```

---

### Step 2 — Start Supabase locally

```powershell
npx supabase start
npx supabase status
```

---

### Step 3 — Create .env.local files (first time only)

**AmanahHub** (`apps/user/.env.local`):
```
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54421
NEXT_PUBLIC_SUPABASE_ANON_KEY=<from supabase status>
SUPABASE_SERVICE_ROLE_KEY=<from supabase status>
NEXT_PUBLIC_APP_NAME=AmanahHub
NEXT_PUBLIC_PLATFORM_NAME=Amanah Governance Platform
NEXT_PUBLIC_APP_URL=http://localhost:3300
NEXT_PUBLIC_CONSOLE_URL=http://localhost:3301
NEXT_PUBLIC_ORG_URL=http://localhost:3302
```

**AmanahHub Console** (`apps/admin/.env.local`):
```
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54421
NEXT_PUBLIC_SUPABASE_ANON_KEY=<from supabase status>
SUPABASE_SERVICE_ROLE_KEY=<from supabase status>
NEXT_PUBLIC_APP_NAME=AmanahHub Console
NEXT_PUBLIC_PLATFORM_NAME=Amanah Governance Platform
NEXT_PUBLIC_APP_URL=http://localhost:3301
NEXT_PUBLIC_HUB_URL=http://localhost:3300
NEXT_PUBLIC_ORG_URL=http://localhost:3302
```

**amanahOS** (`apps/org/.env.local`) — Phase 2:
```
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54421
NEXT_PUBLIC_SUPABASE_ANON_KEY=<from supabase status>
SUPABASE_SERVICE_ROLE_KEY=<from supabase status>
NEXT_PUBLIC_APP_NAME=amanahOS
NEXT_PUBLIC_APP_FULL_NAME=amanahOS — Governance Workspace
NEXT_PUBLIC_PLATFORM_NAME=Amanah Governance Platform
NEXT_PUBLIC_APP_URL=http://localhost:3302
NEXT_PUBLIC_HUB_URL=http://localhost:3300
NEXT_PUBLIC_CONSOLE_URL=http://localhost:3301
```

---

### Step 4 — Install dependencies (after adding apps/org)

Run once from repo root after adding `apps/org`:

```powershell
pnpm install
```

---

### Step 5 — Start the apps

Open separate PowerShell windows for each app.

**AmanahHub (public + donor):**
```powershell
pnpm -C apps/user dev -- -p 3300
```

**AmanahHub Console (reviewer + admin):**
```powershell
pnpm -C apps/admin dev -- -p 3301
```

**amanahOS (org governance workspace):** ← Phase 2 new
```powershell
pnpm -C apps/org dev -- -p 3302
```

---

## Daily startup order (full 3-app stack)

```
1. Docker Desktop
2. npx supabase start
3. pnpm -C apps/user dev -- -p 3300
4. pnpm -C apps/admin dev -- -p 3301
5. pnpm -C apps/org dev -- -p 3302   ← Phase 2
```

---

## Supabase operations

### Reset database (wipes all data, re-runs migrations + seed)
```powershell
npx supabase db reset
```

### Apply new migration only
```powershell
npx supabase db push
```

### Stop Supabase
```powershell
npx supabase stop
```

### Check Supabase status and copy keys
```powershell
npx supabase status
```

---

## Seed users (from supabase/seed.sql)

| Email | Password | Role |
|-------|----------|------|
| `superadmin@agp.test` | `password123` | super_admin |
| `reviewer@agp.test` | `password123` | reviewer |
| `scholar@agp.test` | `password123` | scholar |
| `orgadmin@agp.test` | `password123` | org_admin (Yayasan Ihsan) |
| `donor@agp.test` | `password123` | donor |

**Which app to use for each role:**

| Role | App |
|------|-----|
| super_admin | AmanahHub Console (port 3301) |
| reviewer | AmanahHub Console (port 3301) |
| scholar | AmanahHub Console (port 3301) |
| org_admin | amanahOS (port 3302) ← Phase 2 |
| org_manager | amanahOS (port 3302) ← Phase 2 |
| donor | AmanahHub (port 3300) |

> **Note (Phase 1 transition):** Until Sprint 18 completes the org-management migration, org_admin users can still use AmanahHub Console at port 3301 for projects, reports, and financials. amanahOS is the progressive destination.

---

## Running tests

```powershell
# Scoring engine unit tests
pnpm -C packages/scoring test

# E2E tests (Playwright, Chromium only)
pnpm -C e2e test

# Type check all apps
pnpm -C apps/user type-check
pnpm -C apps/admin type-check
pnpm -C apps/org type-check
```

---

## Common issues

### `pnpm install` fails after adding apps/org
Ensure `pnpm-workspace.yaml` contains `"apps/*"`. Run `pnpm install` from repo root.

### apps/org port 3302 already in use
```powershell
# Find what's using port 3302
netstat -ano | findstr :3302
# Kill by PID
taskkill /PID <PID> /F
```

### `@agp/config` not found in apps/org
Confirm `tsconfig.json` paths are correct and run `pnpm install` from repo root.

### Supabase Studio not opening
Check Docker Desktop is running. Try:
```powershell
npx supabase stop
npx supabase start
```

---

*Last updated: Phase 2 start — Sprint 13*  
*Bismillah — follow this order and you'll be back online fast.*
