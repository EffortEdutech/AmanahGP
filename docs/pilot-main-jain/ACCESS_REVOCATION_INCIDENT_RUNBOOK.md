# Access Revocation And Incident Runbook

Purpose: remove unsafe access quickly and preserve evidence when Authority View access behaves incorrectly.

## Immediate Revocation

Use this when an officer leaves, changes role, loses mandate, or is suspected of unauthorised access.

1. Set the relevant `authority_members.status` to inactive/removed.
2. Set related `authority_jurisdiction_assignments.status` to inactive/revoked.
3. Confirm the officer cannot access `/authority` data.
4. Review recent activity/audit entries.
5. Record the revocation reason and timestamp.
6. Notify the pilot owner and authority admin.

## Incident Triage

Classify as P0 when any of these occurs:

- authority user sees cross-jurisdiction organisations;
- authority user sees raw private files or private ledger/payment/bank records;
- removed member still has access;
- browser code exposes service-role credentials;
- export contains rows outside assigned scope.

Classify as P1 when:

- role action is too broad but data scope remains correct;
- KPI/report totals are wrong but no private data leaked;
- activity/audit trail is incomplete.

## Containment

- Revoke affected authority assignments.
- Disable affected export or review workflow if needed.
- Preserve logs, screenshots, affected user ids, organisation ids, and timestamps.
- Do not patch production policy by granting broader access.
- Verify RLS negative tests before re-enabling access.

## Recovery Checks

- Removed member denial passes.
- Cross-jurisdiction denial passes.
- Public/anon denial passes.
- Evidence boundary negative check passes.
- Authority export scope matches UI scope.
- Incident note is included in the pilot freeze pack.
