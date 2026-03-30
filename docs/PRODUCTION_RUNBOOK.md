# Amanah Governance Platform — Production Go-Live Runbook

**Document ID:** 00-PROJ-GOLIVE-RUNBOOK  
**Version:** v1.0  
**Date:** 27 Mar 2026  
**Owner:** Darya Malak  
**Status:** Ready for pilot

---

## Prerequisites

- AmanahGP repo at `https://github.com/EffortEdutech/AmanahGP`
- Supabase cloud project: `uscgtpvdgcgrfzvccnwq` (dev/staging)
- Separate Supabase project for production (create before go-live)
- ToyyibPay sandbox keys tested and working
- At least 1 pilot org confirmed and ready to onboard

---

## T-7 to T-3 — Pre-Go-Live

### ✅ Scope and QA
- [ ] All 5 sprints merged to `main`
- [ ] `node scripts/demo-check.mjs` passes all 15 checks on staging
- [ ] E2E smoke tests pass: `pnpm -C e2e test`
- [ ] Unit tests pass: `pnpm -C packages/scoring test`
- [ ] No P0 issues open (RBAC leaks, data privacy, webhook failures)

### ✅ Pilot cohort
- [ ] 3–5 pilot orgs confirmed and briefed
- [ ] Each pilot org has:
  - Designated org admin with email address
  - Governing documents ready for CTCF Layer 1
  - At least 1 project and 1 report ready
  - Financial snapshot data for last financial year

### ✅ Content
- [ ] Terms of Use (draft) published at `/terms`
- [ ] Privacy Policy (draft) published at `/privacy`
- [ ] Non-custodial disclaimer visible on donate pages ✅ (built-in)

---

## T-3 to T-1 — Technical Prep

### ✅ Production Supabase setup
```bash
# 1. Create new Supabase project at supabase.com (name: AmanahGP-prod)
# 2. Run all migrations in order via SQL editor:
#    0001_core_schema.sql
#    0002_rls_policies.sql
#    0003_auth_trigger.sql
#    0004_org_invitations.sql
#    0005_scholar_notes.sql
# 3. DO NOT run seed.sql in production
# 4. Enable backups (Point-in-time recovery)
```

### ✅ Auth configuration (Supabase dashboard)
```
Authentication → URL Configuration:
  Site URL:      https://amanahhub.my
  Redirect URLs:
    https://amanahhub.my/**
    https://console.amanahhub.my/**
```

### ✅ Storage
```
Storage → Buckets → evidence:
  - Public: false
  - File size limit: 20MB
  - Allowed MIME types: image/jpeg, image/png, image/webp, application/pdf, video/mp4
```

### ✅ Edge Functions
```bash
npx supabase link --project-ref <prod-ref>
npx supabase functions deploy recalculate-amanah
npx supabase functions deploy send-invite-email
npx supabase functions deploy webhook-payments
```

### ✅ Environment variables (Vercel / hosting)

**AmanahHub (apps/user):**
```
NEXT_PUBLIC_SUPABASE_URL=https://<prod-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<prod-anon-key>
NEXT_PUBLIC_APP_URL=https://amanahhub.my
NEXT_PUBLIC_APP_NAME=AmanahHub
NEXT_PUBLIC_PLATFORM_NAME=Amanah Governance Platform
SUPABASE_SERVICE_ROLE_KEY=<prod-service-role-key>
TOYYIBPAY_USER_SECRET_KEY=<live-key>
TOYYIBPAY_CATEGORY_CODE=<live-category>
TOYYIBPAY_WEBHOOK_SECRET=<live-secret>
NEXT_PUBLIC_TOYYIBPAY_BASE_URL=https://toyyibpay.com
```

**AmanahHub Console (apps/admin):**
```
NEXT_PUBLIC_SUPABASE_URL=https://<prod-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<prod-anon-key>
NEXT_PUBLIC_APP_URL=https://console.amanahhub.my
NEXT_PUBLIC_APP_NAME=AmanahHub Console
NEXT_PUBLIC_PLATFORM_NAME=Amanah Governance Platform
SUPABASE_SERVICE_ROLE_KEY=<prod-service-role-key>
```

**Edge Functions (set via Supabase dashboard → Settings → Edge Functions):**
```
AMANAHHUB_URL=https://amanahhub.my
```

### ✅ ToyyibPay production setup
- [ ] Switch from sandbox (`dev.toyyibpay.com`) to live (`toyyibpay.com`)
- [ ] Verify webhook URL: `https://<prod-ref>.supabase.co/functions/v1/webhook-payments/toyyibpay`
- [ ] Configure webhook in ToyyibPay dashboard to point to above URL
- [ ] Test a RM 1 donation end-to-end in production before go-live

### ✅ Monitoring
- [ ] Health endpoints responding:
  - `https://amanahhub.my/api/health` → 200
  - `https://console.amanahhub.my/api/health` → 200
- [ ] Set up uptime monitor (Better Uptime / UptimeRobot / Checkly) on both `/api/health`
- [ ] Alert on webhook failures (Supabase → Edge Function → Logs → set alert)

---

## Go-Live Day

### ✅ Code freeze
```bash
git tag v1.0.0-pilot
git push origin v1.0.0-pilot
```

### ✅ Deploy
```bash
# Deploy both apps to hosting (Vercel recommended)
vercel --prod   # from apps/user
vercel --prod   # from apps/admin
```

### ✅ Production smoke tests (must-pass before announcing)

Run manually after deploy:

| Test | Expected | Pass? |
|---|---|---|
| `GET /api/health` (user) | `{"ok":true}` | |
| `GET /api/health` (admin) | `{"ok":true}` | |
| Open `/charities` | Page loads, no error | |
| Sign up new account | Email received, can sign in | |
| Sign in as super_admin | Dashboard loads | |
| Register org → 3-step onboarding | Submits successfully | |
| Reviewer approves org | Status → approved, listed | |
| Public directory shows org | Visible in `/charities` | |
| Donation page loads | Amount presets visible | |
| `/api/health` DB check | latency < 2000ms | |

### ✅ Rollback gate
If any P0 smoke test fails:
1. Do NOT announce launch
2. Revert to previous deploy: `vercel rollback`
3. Fix issue on staging first
4. Re-run smoke tests before re-deploying

---

## First 72 Hours

### Hour 0–24
- [ ] Monitor Supabase logs: `https://supabase.com/dashboard/project/<ref>/logs`
- [ ] Monitor Edge Function logs for webhook failures
- [ ] Check `/api/health` every 15 minutes manually (until uptime monitor is confirmed)
- [ ] Onboard first pilot org — walk through with them live

### Hour 24–72
- [ ] Verify all pilot org data is correct (no test/seed data in prod)
- [ ] Spot-check public pages: confirm only approved+listed orgs visible
- [ ] Confirm at least 1 donation webhook confirmed end-to-end
- [ ] Confirm Amanah score updated after reviewer verifies first real report

### First week
- [ ] Share AmanahHub URL with pilot donors
- [ ] Schedule first review session with pilot orgs
- [ ] Review audit logs for any unexpected actions

---

## Rollback Procedure

```bash
# 1. Revert hosting deploy
vercel rollback

# 2. If DB migration broke:
#    Supabase → SQL editor → run rollback SQL manually
#    (Migrations are forward-only — design carefully before applying)

# 3. Notify pilot orgs of brief downtime
```

---

## Support Contacts

| Role | Contact |
|---|---|
| Product Owner | Darya Malak |
| Platform ops | [on-call owner TBD] |
| Supabase support | https://supabase.com/support |
| ToyyibPay support | https://toyyibpay.com |

---

## Post-Pilot — Phase 2 Triggers

Consider Phase 2 when:
- 10+ active organizations onboarded
- Webhook confirmation rate stable at ≥99%
- No P0 bugs in 2 weeks of operation
- Donor feedback indicates need for features out of Phase 1 scope
