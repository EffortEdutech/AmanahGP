# ADR-004 — Donor Identity Policy

**Status:** Decided  
**Date:** 27 Mar 2026  
**Owner:** Darya Malak

---

## Decision
**Guest donation is allowed in Phase 1. Login is optional for donors.**

## Rationale
- Friction at payment step reduces conversion
- Email capture (optional) at checkout is sufficient for receipt delivery
- Forcing donor account creation is out of scope for pilot

## Implementation Rules
- `donation_transactions.donor_user_id` is nullable
- `donation_transactions.donor_email` is nullable (captured at checkout if provided)
- Receipt accessible via `donation_transaction_id` in URL (no auth required for own receipt)
- If a logged-in donor donates, `donor_user_id` is populated

## Privacy (PDPA-aligned)
- `donor_email` is PII — never expose in public APIs
- Webhook payloads must not leak donor PII to frontend
- Receipts are accessible via opaque transaction ID only
