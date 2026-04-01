# AmanahHub — Vercel Deployment Guide

**Two Vercel projects, one monorepo**
- **Project 1:** AmanahHub (donor-facing) → `amanahhub.my`
- **Project 2:** AmanahHub Console (org/reviewer) → `console.amanahhub.my`

---

## Before you start — get your Supabase keys

Go to **Supabase Dashboard → Project `uscgtpvdgcgrfzvccnwq` → Settings → API**

Copy these two values:
- **Project URL** → `https://uscgtpvdgcgrfzvccnwq.supabase.co`
- **anon public key** → long JWT starting with `eyJ...`
- **service_role key** → long JWT (keep this secret, never expose publicly)

---

## Step 1 — Add Vercel configuration files to your repo

Copy the two `vercel.json` files from this zip:

```
apps/user/vercel.json    ← AmanahHub config
apps/admin/vercel.json   ← AmanahHub Console config
```

Commit and push to GitHub:

```powershell
git add apps/user/vercel.json apps/admin/vercel.json
git commit -m "chore: add vercel.json for both apps"
git push origin main
```

---

## Step 2 — Update Supabase Auth redirect URLs

Go to **Supabase Dashboard → Authentication → URL Configuration**

Add these to **Redirect URLs**:

```
https://amanahhub.my/**
https://console.amanahhub.my/**
https://amanahhub-user.vercel.app/**
https://amanahhub-console.vercel.app/**
```

Also update **Site URL** to: `https://amanahhub.my`

Click **Save**.

---

## Step 3 — Deploy AmanahHub (apps/user)

1. Go to [vercel.com](https://vercel.com) → **Add New Project**
2. **Import** your GitHub repo: `EffortEdutech/AmanahGP`
3. Set **Project Name**: `amanahhub-user` (or your preferred name)
4. **Framework Preset**: Next.js (auto-detected)
5. **Root Directory**: `apps/user`
6. **Build & Output Settings** — Vercel reads from `apps/user/vercel.json` automatically

### Set Environment Variables

Click **Environment Variables** and add these one by one:

| Variable | Value | Environments |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://uscgtpvdgcgrfzvccnwq.supabase.co` | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` (your anon key) | Production, Preview, Development |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` (your service role key) | Production, Preview, Development |
| `NEXT_PUBLIC_APP_NAME` | `AmanahHub` | Production, Preview, Development |
| `NEXT_PUBLIC_PLATFORM_NAME` | `Amanah Governance Platform` | Production, Preview, Development |
| `NEXT_PUBLIC_APP_URL` | `https://amanahhub.my` | Production |
| `NEXT_PUBLIC_APP_URL` | `https://amanahhub-user.vercel.app` | Preview |
| `NEXT_PUBLIC_CONSOLE_URL` | `https://console.amanahhub.my` | Production |
| `NEXT_PUBLIC_CONSOLE_URL` | `https://amanahhub-console.vercel.app` | Preview |

7. Click **Deploy**

---

## Step 4 — Deploy AmanahHub Console (apps/admin)

1. Go to [vercel.com](https://vercel.com) → **Add New Project**
2. **Import** the same repo: `EffortEdutech/AmanahGP`
3. Set **Project Name**: `amanahhub-console`
4. **Framework Preset**: Next.js
5. **Root Directory**: `apps/admin`

### Set Environment Variables

| Variable | Value | Environments |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://uscgtpvdgcgrfzvccnwq.supabase.co` | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` (your anon key) | Production, Preview, Development |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` (your service role key) | Production, Preview, Development |
| `NEXT_PUBLIC_APP_NAME` | `AmanahHub Console` | Production, Preview, Development |
| `NEXT_PUBLIC_PLATFORM_NAME` | `Amanah Governance Platform` | Production, Preview, Development |
| `NEXT_PUBLIC_APP_URL` | `https://console.amanahhub.my` | Production |
| `NEXT_PUBLIC_APP_URL` | `https://amanahhub-console.vercel.app` | Preview |
| `NEXT_PUBLIC_HUB_URL` | `https://amanahhub.my` | Production |
| `NEXT_PUBLIC_HUB_URL` | `https://amanahhub-user.vercel.app` | Preview |

6. Click **Deploy**

---

## Step 5 — Add custom domains (if you have them)

### For AmanahHub (apps/user project):
1. Vercel dashboard → `amanahhub-user` project → **Settings → Domains**
2. Add: `amanahhub.my`
3. Vercel will give you DNS records to add — go to your domain registrar and add them

### For AmanahHub Console (apps/admin project):
1. Vercel dashboard → `amanahhub-console` project → **Settings → Domains**
2. Add: `console.amanahhub.my`
3. Add the DNS records at your domain registrar

> **If you don't have a domain yet**, Vercel gives you free subdomains:
> - `amanahhub-user.vercel.app` (works immediately after deploy)
> - `amanahhub-console.vercel.app`
> You can use these for the pilot without purchasing a domain.

---

## Step 6 — Verify deployments

After both deploys succeed:

**AmanahHub checklist:**
- [ ] Homepage loads at your Vercel URL
- [ ] Directory page shows the 3 listed organizations
- [ ] Org profile page loads (test with Wakaf Masjid Ar-Rahman)
- [ ] How It Works, About, Support pages load
- [ ] Sign in works at `/login`

**AmanahHub Console checklist:**
- [ ] Login page loads
- [ ] Sign in as `superadmin@agp.test` works
- [ ] Dashboard shows all 5 organizations
- [ ] Sidebar shows Platform Admin + Platform/Review sections
- [ ] Navigate to an org → documents panel visible

---

## Step 7 — Fix CORS / auth callback (important)

In your `apps/user/next.config.ts` and `apps/admin/next.config.ts`, ensure the auth callback redirect is dynamic. Open each file and check it doesn't have `localhost` hardcoded.

Supabase handles redirects via the `redirectTo` URL parameter — as long as your production URL is in the Supabase allowlist (Step 2), it will work.

---

## Automatic deploys going forward

After setup, every `git push` to `main` automatically triggers a new production deploy on both projects. Pull request previews are also created automatically.

```
git add .
git commit -m "fix: some bug"
git push origin main
→ Vercel auto-deploys both AmanahHub and Console
```

---

## Troubleshooting

### Build fails: "Cannot find module '@agp/config'"
The monorepo workspace packages aren't resolving. In each `vercel.json`, the `installCommand` uses `pnpm install --frozen-lockfile` from the repo root. Make sure you set **Root Directory** in Vercel to `apps/user` (or `apps/admin`) — NOT the repo root.

### Build fails: "pnpm: command not found"
Vercel needs a `packageManager` field. Add to repo root `package.json`:
```json
{
  "packageManager": "pnpm@9.0.0"
}
```
Match the exact pnpm version you use locally (`pnpm --version`).

### Login redirects to localhost after Supabase email confirmation
You haven't added the production URL to Supabase redirect allowlist. Go back to Step 2.

### `SUPABASE_SERVICE_ROLE_KEY` not working in production
Confirm it is NOT prefixed with `NEXT_PUBLIC_`. The service role key must stay server-side only.

### Org documents not loading in production
The `documents` Supabase storage bucket exists in your hosted project. Verify at:
**Supabase Dashboard → Storage → documents bucket**
If missing, create it: private bucket, 10MB limit, accept PDF + images.

---

## Summary — what you will have after this

| App | URL | Purpose |
|---|---|---|
| AmanahHub | `amanahhub.my` | Public donor-facing platform |
| AmanahHub Console | `console.amanahhub.my` | Org admin + reviewer workspace |
| Supabase | `uscgtpvdgcgrfzvccnwq.supabase.co` | Shared backend for both apps |

Both apps share the same Supabase project. Donors use AmanahHub. Organizations and reviewers use the Console. The Supabase backend serves both.

**Alhamdulillah — In shaa Allah the deployment will go smoothly.**
