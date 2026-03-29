# Amanah Governance Platform — Sprint 3 Completion Report

**Sprint:** S7 — Public Transparency Dashboard + Donation Flow  
**Date:** 27 Mar 2026  
**Status:** Delivered

---

## Sprint Goal
> AmanahHub public app end-to-end: donors can discover charities, read verified reports, view trust scores, and donate directly to charity via ToyyibPay. No login required for browsing or donating.

---

## Epics Delivered

| Epic | Status |
|---|---|
| EPIC-09 Public Transparency Dashboard | ✅ Complete |
| EPIC-08 Donations + Fees + Webhooks (checkout + receipt) | ✅ Complete |

---

## Deliverables

### AmanahHub (`apps/user`)

| File | Purpose |
|---|---|
| `app/layout.tsx` | Root layout with sticky navbar + footer |
| `app/page.tsx` | Root redirect → `/charities` |
| `app/charities/page.tsx` | Public charity directory — search by name, type, state |
| `app/charities/[orgId]/page.tsx` | Charity profile — summary, fund types, projects, Amanah score, cert status, donate CTA |
| `app/charities/[orgId]/projects/[projectId]/page.tsx` | Project detail — verified reports with narrative, milestones, spend, beneficiary counts |
| `app/donate/[orgId]/page.tsx` | Donation checkout page — org context, non-custodial notice |
| `app/donate/receipt/[donationId]/page.tsx` | Receipt page — status (confirmed/pending/failed), all transaction details |
| `components/layout/navbar.tsx` | Public sticky navbar — auth-aware (sign in/sign up or account/sign out) |
| `components/charity/charity-card.tsx` | Directory listing card — score badge, cert badge, org type, state |
| `components/charity/directory-search.tsx` | Search + org type + state filters (client-side, pushes URL params) |
| `components/charity/amanah-score-panel.tsx` | Sidebar score panel — grade, breakdown bars, history sparkline |
| `components/charity/cert-panel.tsx` | Sidebar cert panel — status, validity window, evaluation score |
| `components/donation/donate-form.tsx` | Checkout form — amount presets (RM10–500), custom amount, optional email, 2% fee display, redirects to ToyyibPay |

---

## User Journey Delivered

### Donor — Full Discovery to Donation
```
Visit http://localhost:3300
→ Redirected to /charities
→ Browse listed orgs — see Amanah score + certified badge
→ Filter by type (Waqf Institution) or state (Pulau Pinang)
→ Click "Masjid Al-Amanah Waqf Trust"
→ View profile: summary, fund types, projects, score 74.5, Gold Amanah cert
→ Click project → "Waqf Library Penang — Phase 1"
→ See verified Q1 2025 report: narrative, 180 beneficiaries, RM 45,000 spent
→ Click "Donate to this project"
→ Select RM 100 → email (optional) → "Donate RM 100 →"
→ Redirected to ToyyibPay sandbox checkout
→ Complete payment → redirected to /donate/receipt/[id]
→ Receipt shows: confirmed, org, amount, reference
```

---

## Key Design Decisions

- **Guest donation** — no login required anywhere in this flow (ADR-004)
- **Non-custodial notice** — shown prominently on donate page and receipt
- **Only verified data shown publicly** — reports require `verification_status='verified'`, orgs require `listing_status='listed'`, evidence requires `is_approved_public=true`
- **2% platform fee** — shown transparently at checkout, stored as `platform_fee_amount`
- **Receipt by URL** — `donationId` in URL is the receipt "token" for anonymous donors

---

## Test with Seed Data

```
http://localhost:3300/charities
→ Should show "Masjid Al-Amanah Waqf Trust" (the only listed seed org)

http://localhost:3300/charities/b0000001-0000-0000-0000-000000000003
→ Score: 74.5, Gold Amanah, 1 project visible

http://localhost:3300/charities/b0000001-0000-0000-0000-000000000003/projects/c0000001-0000-0000-0000-000000000001
→ Q1 2025 verified report visible

http://localhost:3300/donate/b0000001-0000-0000-0000-000000000003
→ Donation form (requires ToyyibPay sandbox keys to complete)

http://localhost:3300/donate/receipt/d1000001-0000-0000-0000-000000000002
→ Shows confirmed seed donation (RM 50)
```

---

## Known Gaps (Sprint 4 picks up)

| Item | When |
|---|---|
| Donor account page (`/account`) | Sprint 4 |
| Donation history for logged-in donors | Sprint 4 |
| Evidence public gallery on project page | Sprint 4 |
| Email receipt delivery | Sprint 8 |
| ToyyibPay sandbox end-to-end test | Requires sandbox keys |

---

## Sprint 4 Picks Up From Here

- Donor account page (my donations history)
- Org profile edit (Sprint 1 gap)
- Password reset UI
- Evidence public gallery
- Admin console sidebar links wired to new pages

**Bismillah — proceed to Sprint 4.**
**Alhamdulillah.**
