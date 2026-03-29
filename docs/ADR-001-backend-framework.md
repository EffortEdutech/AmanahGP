# ADR-001 — Backend Framework

**Status:** Decided  
**Date:** 27 Mar 2026  
**Owner:** Darya Malak

---

## Decision
**Supabase-first. No separate always-on NestJS or FastAPI backend in Phase 1.**

Backend boundary is implemented via:
- Supabase Auth (JWT, session management)
- Supabase Postgres + RLS (data access control)
- Supabase Storage (evidence files, signed URLs)
- Next.js Server Actions + Route Handlers (app-layer logic)
- Supabase Edge Functions (privileged tasks: webhook processing, reconciliation)

## Rationale
- Fastest path to pilot-ready with the smallest operational surface
- RLS enforces tenant boundary at the DB layer — not just the app layer
- Server Actions replace a REST controller layer for most CRUD
- Edge Functions handle the only cases needing a true server runtime (webhooks)
- Avoids maintaining a separate API server, container, and deployment pipeline in Phase 1

## What this is NOT
- This is not a permanent architecture decision beyond Phase 1
- If load or complexity demands it, a dedicated API service can be extracted in Phase 2

## Consequences
- All privileged logic (webhook processing, audit writes, score recalculation) lives in Edge Functions or Server Actions using `service_role`
- `SUPABASE_SERVICE_ROLE_KEY` must never appear in any `NEXT_PUBLIC_` env variable
- RLS is the primary security boundary — not optional

## Revisit Trigger
If Phase 2 requires real-time features, complex background jobs, or a public API with rate limiting, open ADR-007.
