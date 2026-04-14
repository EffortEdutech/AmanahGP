# Amanah Index™ — Trust Score Specification (Phase 1)

**Document ID:** 02-TRUST-AMANAH-P1  
**Version:** v1.0  
**Date:** 27 Feb 2026  
**Owner:** Darya Malak  
**Status:** Draft

---

## 1) Purpose
Amanah Index™ is a **0–100 trust score** for ongoing transparency/accountability based on verified events and reviewer decisions.  
It is **not** a measure of religious sincerity nor a guarantee of outcomes.

---

## 2) Formula (Amanah v1)
Amanah Index™ =
- 0.30 × Governance Score
- 0.25 × Financial Transparency Score
- 0.20 × Project Transparency Score
- 0.15 × Impact Efficiency Score
- 0.10 × Feedback Score

All components normalized 0–100.

---

## 3) Event Triggers (Trust Events)
Recalculate when:
- `report_verified`
- `financial_submitted` / `financial_verified`
- `certification_updated`
- `donation_confirmed` (via webhook)
- `complaint_logged` / `complaint_resolved`
- `report_overdue_flagged` / `report_overdue_cleared`
- `manual_recalc` (admin tool)

---

## 4) Recalculation Rules
- Append-only score history (never overwrite)
- Idempotent trust events (dedupe via idempotency_key)
- Optional debounce window (30–60s per org)

---

## 5) Public Explainability
Each history entry should have:
- date/time
- public-safe reason summary (“Verified report approved”)
- optional component deltas

---

## 6) Versioning
- Phase 1: `amanah_v1`
- Changes require ADR and new version label (e.g., `amanah_v2`)
