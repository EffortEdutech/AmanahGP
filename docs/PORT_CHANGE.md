# Amanah Governance Platform — Port Change Patch

**Date:** 27 Mar 2026  
**Change:** Local dev ports updated from `3200/3201` → `3300/3301`

---

## Files in this patch (replace originals)

| File | Change |
|---|---|
| `supabase/config.toml` | `site_url` and `additional_redirect_urls` → `3300/3301` |
| `apps/user/.env.example` | `NEXT_PUBLIC_APP_URL` → `http://localhost:3300` |
| `apps/admin/.env.example` | `NEXT_PUBLIC_APP_URL` → `http://localhost:3301` |
| `scripts/seed-auth-users.mjs` | Console output URLs → `3300/3301` |
| `scripts/demo-check.mjs` | Console output URLs → `3300/3301` |

---

## After replacing files

```bash
# Restart Supabase so new redirect URLs take effect
npx supabase stop
npx supabase start

# Reset DB (re-runs all migrations + seed)
npx supabase db reset

# Seed auth users
SUPABASE_SERVICE_ROLE_KEY=<key> node scripts/seed-auth-users.mjs

# Start apps on new ports
pnpm -C apps/user dev -- -p 3300
pnpm -C apps/admin dev -- -p 3301
```

---

## Your .env.local files

Create (or update) these two files:

**`apps/user/.env.local`**
```
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54421
NEXT_PUBLIC_SUPABASE_ANON_KEY=<from supabase status>
NEXT_PUBLIC_APP_NAME=AmanahHub
NEXT_PUBLIC_PLATFORM_NAME=Amanah Governance Platform
NEXT_PUBLIC_APP_URL=http://localhost:3300
SUPABASE_SERVICE_ROLE_KEY=<from supabase status>
TOYYIBPAY_USER_SECRET_KEY=<sandbox key>
TOYYIBPAY_CATEGORY_CODE=<sandbox code>
TOYYIBPAY_WEBHOOK_SECRET=<sandbox secret>
NEXT_PUBLIC_TOYYIBPAY_BASE_URL=https://dev.toyyibpay.com
```

**`apps/admin/.env.local`**
```
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54421
NEXT_PUBLIC_SUPABASE_ANON_KEY=<from supabase status>
NEXT_PUBLIC_APP_NAME=AmanahHub Console
NEXT_PUBLIC_PLATFORM_NAME=Amanah Governance Platform
NEXT_PUBLIC_APP_URL=http://localhost:3301
SUPABASE_SERVICE_ROLE_KEY=<from supabase status>
```

---

## Local URLs (updated)

| Service | URL |
|---|---|
| AmanahHub | http://localhost:3300 |
| AmanahHub Console | http://localhost:3301 |
| Supabase API | http://127.0.0.1:54421 |
| Supabase Studio | http://127.0.0.1:54423 |
| Mailpit | http://127.0.0.1:54424 |

---

## Remaining occurrences of 3200/3201 in the codebase

These appear only in docs/completion reports (historical records — safe to leave as-is, or do a find-replace):

```bash
# Find remaining references (informational)
grep -r "3200\|3201" . \
  --include="*.ts" --include="*.tsx" --include="*.md" \
  --exclude-dir=node_modules \
  -l
```

The only functional files that carried port references were the 5 files in this patch. All server actions use `process.env.NEXT_PUBLIC_APP_URL` — so updating `.env.local` is all that's needed for runtime behaviour.
