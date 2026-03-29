# Amanah Governance Platform — Sprint 1 Completion Report

**Document ID:** 00-PROJ-SPRINT1-COMPLETION-P1  
**Sprint:** S1–S2 (Foundation + RBAC + Org Onboarding)  
**Version:** v1.0  
**Date:** 27 Mar 2026  
**Owner:** Darya Malak  
**Status:** Delivered

---

## Sprint Goal
> Wire auth end-to-end in both apps. Enable org creation, Malaysia classification, onboarding submission, and member invites. Every protected action must enforce RBAC and write audit logs.

---

## Epics Delivered

| Epic | Status |
|---|---|
| EPIC-01 Platform Foundation | ✅ Complete |
| EPIC-02 Auth & RBAC | ✅ Complete |
| EPIC-03 Org Onboarding + Malaysia Classification | ✅ Complete |

---

## Deliverables

### Database Migrations

| File | Purpose |
|---|---|
| `0003_auth_trigger.sql` | Auto-creates `public.users` on Supabase Auth signup via trigger. Also: `current_user_profile` view, `my_organizations()` RPC function. |
| `0004_org_invitations.sql` | `org_invitations` table with RLS — stores pending invitations with expiry tokens. |

---

### Shared Packages

| File | Purpose |
|---|---|
| `packages/validation/src/auth.ts` | Zod: sign in, sign up, forgot/reset password |
| `packages/validation/src/org.ts` | Zod: org create, classify, invite. Includes all Malaysia classification options as typed constants. |

---

### AmanahHub Console (`apps/admin`)

#### Auth
| File | Purpose |
|---|---|
| `middleware.ts` | Protects `/dashboard/**`, `/orgs/**`, `/onboarding/**`. Redirects unauthenticated users to `/login`. Redirects authenticated users away from auth pages. |
| `app/(auth)/actions.ts` | signIn, signUp, signOut, forgotPassword server actions |
| `app/(auth)/callback/route.ts` | Supabase Auth callback handler (code exchange, recovery redirect) |
| `app/(auth)/login/page.tsx` | Sign in page |
| `app/(auth)/signup/page.tsx` | Sign up page |
| `components/auth/auth-card.tsx` | Auth page wrapper component |
| `components/auth/auth-form.tsx` | Client form with `useActionState`, loading, error/success states |

#### Dashboard + Layout
| File | Purpose |
|---|---|
| `app/(dashboard)/layout.tsx` | Protected layout — reads session + profile + org memberships server-side. Renders sidebar. |
| `app/(dashboard)/dashboard/page.tsx` | Dashboard home — lists user's orgs, reviewer quick links |
| `components/layout/sidebar.tsx` | Full sidebar with nav items, org selector, role-aware reviewer section, sign out |

#### Org Onboarding (3-step flow)
| File | Purpose |
|---|---|
| `app/(dashboard)/orgs/actions.ts` | All org server actions: createOrganization, classifyOrganization, updateOrgProfile, submitOnboarding, inviteMember, acceptInvitation |
| `app/(dashboard)/onboarding/new/page.tsx` | Step 1 — basic profile |
| `app/(dashboard)/orgs/[orgId]/classify/page.tsx` | Step 2 — Malaysia classification |
| `app/(dashboard)/orgs/[orgId]/submit/page.tsx` | Step 3 — review & submit |
| `app/(dashboard)/orgs/[orgId]/page.tsx` | Org profile page (view + status banner + quick actions) |
| `app/(dashboard)/orgs/[orgId]/members/page.tsx` | Members list + pending invitations + invite form |

#### Components
| File | Purpose |
|---|---|
| `components/org/onboarding-form.tsx` | Step 1 form — all profile fields, Malaysia states dropdown |
| `components/org/classify-form.tsx` | Step 2 form — org type, oversight authority, fund types (checkboxes) |
| `components/org/submit-onboarding-form.tsx` | Step 3 submit button client component |
| `components/org/onboarding-status-banner.tsx` | Contextual guidance banner (draft/submitted/changes_requested/rejected) |
| `components/org/invite-form.tsx` | Member invite form with email + role selector |
| `components/ui/status-badge.tsx` | Reusable status badge (all onboarding/listing/cert/donation statuses) |

---

### AmanahHub (`apps/user`)

| File | Purpose |
|---|---|
| `middleware.ts` | Soft auth — only `/account/**` requires login. Public browsing and guest donation remain open (ADR-004). |
| `app/(auth)/actions.ts` | signIn, signUp, signOut, forgotPassword |
| `app/(auth)/callback/route.ts` | Auth callback handler |
| `app/(auth)/login/page.tsx` | Donor sign in page — with note that browsing is available without login |
| `components/auth/user-auth-form.tsx` | Shared auth form component |

---

### Scripts
| File | Purpose |
|---|---|
| `scripts/seed-auth-users.mjs` | Creates 5 Supabase Auth users for local dev. Syncs `auth_provider_user_id` to `public.users`. Safe to re-run (skips existing). |

---

## User Journeys Delivered

### Org Admin — Full Onboarding Flow
```
Sign up → Email confirm → Sign in
→ Dashboard (no org) → Register organization
→ Step 1: Basic profile (name, state, summary, contacts)
→ Step 2: Malaysia classification (org type, oversight authority, fund types)
→ Step 3: Review summary → Submit for approval
→ Org page shows "Under review" status banner
→ Reviewer approves (Sprint 2 reviewer actions) → status becomes "Approved"
```

### Org Admin — Member Invite Flow
```
Org page → Manage members
→ Enter email + role → Send invitation
→ Token stored in org_invitations (email delivery Sprint 2)
→ Invitee signs up / signs in → accepts via token link
→ Appears as active member
```

### Donor — Public Browsing (No Auth Required)
```
Visit AmanahHub → Browse charities (no login needed)
→ Donate (guest allowed per ADR-004)
→ Optional: Create account to track giving history
```

---

## RBAC Enforcement Verified

| Action | Required Role | Enforced By |
|---|---|---|
| Create organization | Any authenticated user | Middleware + server action |
| Update org profile | org_manager+ | `requireOrgRole()` in server action |
| Submit onboarding | org_admin | `requireOrgRole()` in server action |
| Classify org | org_admin | `requireOrgRole()` in server action |
| Invite member | org_admin | `requireOrgRole()` in server action |
| Accept invitation | Any authenticated user (email must match) | Token lookup server-side |
| View reviewer tools | reviewer / super_admin | Dashboard conditional render + API middleware |

---

## Audit Log Coverage

| Action | Logged |
|---|---|
| `ORG_CREATED` | ✅ |
| `ORG_CLASSIFIED` | ✅ |
| `ORG_SUBMITTED` | ✅ |
| `MEMBER_INVITED` | ✅ |
| `MEMBER_JOINED` | ✅ |

---

## Local Dev Startup (Updated)

```bash
# 1. Docker Desktop running

# 2. Start Supabase
npx supabase start
npx supabase status   # Copy ANON_KEY + SERVICE_ROLE_KEY

# 3. Reset DB (runs all migrations 0001–0004 + seed.sql)
npx supabase db reset

# 4. Create auth users
SUPABASE_SERVICE_ROLE_KEY=<key> node scripts/seed-auth-users.mjs

# 5. Validate
node scripts/demo-check.mjs

# 6. Start apps
pnpm -C apps/user dev -- -p 3200
pnpm -C apps/admin dev -- -p 3201
```

---

## Demo Path (Sprint 1)

1. **Sign up** at `http://localhost:3201/signup` → confirm email in Mailpit (`http://127.0.0.1:54424`)
2. **Sign in** → redirected to `/dashboard`
3. **Register org** → complete 3-step onboarding → submit
4. **View org page** → see "Under review" banner
5. **Invite member** → token logged to console
6. **Sign in as reviewer** (`reviewer@agp.test`) → see reviewer quick links in dashboard
7. **Donor** → sign in at `http://localhost:3200/login` → can browse without login

---

## Known Gaps (Sprint 2 picks up)

| Item | When |
|---|---|
| Reviewer decision actions (approve/reject/request-changes) | Sprint 2 |
| Invitation email delivery (Supabase Edge Function + email) | Sprint 2 |
| Org profile edit form wired to `updateOrgProfile` | Sprint 2 |
| Password reset UI | Sprint 2 |
| `demo-check.mjs` — add auth flow assertions | Sprint 2 |

---

## Seed Users (local dev)

| Email | Role | Password |
|---|---|---|
| superadmin@agp.test | super_admin | Test1234! |
| reviewer@agp.test | reviewer | Test1234! |
| scholar@agp.test | scholar | Test1234! |
| orgadmin@agp.test | org_admin (approved org) | Test1234! |
| donor@agp.test | donor | Test1234! |

---

## Sprint 2 Picks Up From Here

- Projects CRUD (create, edit, archive)
- Reports (draft, submit)
- Evidence upload (pre-signed URL, confirm, visibility)
- Reviewer workflow: approve org / verify report / approve evidence
- Email delivery for invitations

**Bismillah — proceed to Sprint 2.**  
**Alhamdulillah.**
