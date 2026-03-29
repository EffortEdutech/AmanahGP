# Amanah Governance Platform — Sprint 4 Completion Report

**Sprint:** S4 — UX Gaps + Donor Account + Invite Flow + Evidence Gallery  
**Date:** 27 Mar 2026  
**Status:** Delivered

---

## Sprint Goal
> Close the known gaps from Sprints 1–3. Donor account page with giving history. Password reset for both apps. Org profile edit. Evidence public gallery on project pages. Invitation accept flow. Admin sidebar fully wired.

---

## Deliverables

### Password Reset (both apps)

| File | Purpose |
|---|---|
| `apps/user/app/(auth)/reset-password/page.tsx` | Password reset page — shown after clicking email link |
| `apps/user/app/(auth)/forgot-password/page.tsx` | Forgot password page |
| `apps/user/app/(auth)/actions.ts` | Updated — adds `resetPassword` action |
| `apps/admin/app/(auth)/reset-password/page.tsx` | Console password reset page |
| `apps/admin/app/(auth)/actions.ts` | Updated — adds `resetPassword` action |

**Flow:**
```
Forgot password? link → /forgot-password → enter email
→ Supabase sends email → user clicks link → /callback?type=recovery
→ redirected to /reset-password → set new password → sign in
```

---

### Donor Account Page

| File | Purpose |
|---|---|
| `apps/user/app/account/page.tsx` | Donor account — profile, total giving, donation history with receipt links |

**Features:**
- Total confirmed giving (MYR sum)
- Full donation history list: org name, project, amount, status, date
- Each donation links to its receipt page
- Protected — redirects to `/login?next=/account` if not signed in

---

### Invitation Accept Flow

| File | Purpose |
|---|---|
| `apps/user/app/invite/page.tsx` | Invitation landing page — shows org name, role, expiry |
| `apps/user/components/account/accept-invite-button.tsx` | Client button — calls accept API |
| `apps/user/app/api/invite/accept/route.ts` | POST API — validates token, creates org_member, marks invite accepted, audit logs |

**Flow:**
```
Org admin sends invite → token stored in org_invitations
→ Share link: http://localhost:3300/invite?token=<token>
→ Invitee visits link → prompted to sign in if not already
→ Sees invite details (org, role, expiry) → clicks Accept
→ Added to org_members → redirected to /dashboard?invited=true
```

---

### Org Profile Edit

| File | Purpose |
|---|---|
| `apps/admin/app/(dashboard)/orgs/[orgId]/edit/page.tsx` | Edit page — pre-fills all profile fields |
| `apps/admin/components/org/edit-org-form.tsx` | Pre-filled form with all org fields and Malaysia states |

Wired to existing `updateOrgProfile` server action from Sprint 1.
Redirects back to org page on save. RBAC: org_manager+.

---

### Evidence Public Gallery

| File | Purpose |
|---|---|
| `apps/user/components/charity/evidence-gallery.tsx` | Server component — fetches approved public evidence, generates signed URLs (1hr TTL), renders image grid + document list |
| `apps/user/app/charities/[orgId]/projects/[projectId]/page.tsx` | Updated — now includes EvidenceGallery per verified report |

**Security rules honoured:**
- Only `is_approved_public=true` AND `visibility='public'` evidence is shown
- Signed URLs expire after 1 hour — no permanent public exposure
- Reviewer approval required before any evidence is publicly accessible

---

### Admin Sidebar — Fully Wired

| File | Purpose |
|---|---|
| `apps/admin/components/layout/sidebar.tsx` | Updated — all nav items now link to real pages. Dynamic org context. Disabled state for items when no org exists. |

**All sidebar links now wired:**
- Dashboard → `/dashboard`
- Organization → `/orgs/[orgId]`
- Projects → `/orgs/[orgId]/projects`
- Members → `/orgs/[orgId]/members`
- Financials → `/orgs/[orgId]/financials`
- Certification → `/orgs/[orgId]/certification`
- Onboarding queue → `/review/onboarding` (reviewer only)
- Reports queue → `/review/reports` (reviewer only)

---

## User Journeys Delivered

### Donor — Account + History
```
Sign in → click "My account" in navbar
→ See profile, total giving, full donation history
→ Click any donation → receipt page
```

### Member — Invite Accept
```
Receive invite link → /invite?token=abc123
→ Sign in (if not already) → see org name + role
→ Click Accept → added to org → redirected to dashboard
→ Org appears in sidebar immediately
```

### Org Admin — Edit Profile
```
Org page → "Edit profile" button
→ Pre-filled form → make changes → Save
→ Redirected back to org page with updates
```

### Donor — Evidence on Project Page
```
Project page → verified report
→ Approved photos show in 3-column image grid
→ PDFs/videos listed below
→ Each signed URL valid for 1 hour
```

---

## Gaps Remaining (Sprint 5)

| Item | When |
|---|---|
| CTCF scoring formula (ctcf_v1 engine) | Sprint 5 |
| Amanah Index recalculation function | Sprint 5 |
| Scholar notes workflow | Sprint 5 |
| Invitation email delivery (Edge Function) | Sprint 5 |
| Reviewer certification evaluation page | Sprint 5 |

**Bismillah — proceed to Sprint 5.**
**Alhamdulillah.**
