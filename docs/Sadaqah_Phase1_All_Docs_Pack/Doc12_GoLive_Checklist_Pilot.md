# Sadaqah Jariah Platform — Go-Live Checklist (Pilot Launch)

**Document ID:** 06-QA-GOLIVE-P1  
**Version:** v1.0  
**Date:** 27 Feb 2026  
**Owner:** Darya Malak  
**Status:** Draft

---

## Pre-Go-Live (T-7 to T-3)
- Scope locked and QA P0 passed on staging
- Pilot cohort confirmed (3–5 orgs)
- Terms/Privacy/disclaimers published (draft OK)
- On-call owner and support channel ready

## Technical Prep (T-3 to T-1)
- Production env + SSL + DB + storage configured
- Secrets set (auth, gateway, webhook)
- Migrations tested; backups enabled
- Monitoring + webhook alerts enabled

## Go-Live Day
- Code freeze + release tag
- Deploy backend + frontend + migrations
- Production smoke tests (must-pass)
- Rollback decision gate if any P0 fails

## First 72 Hours
- Monitor webhooks, errors, queues
- Onboard and verify pilot org data
- Spot-check public pages for privacy safety
