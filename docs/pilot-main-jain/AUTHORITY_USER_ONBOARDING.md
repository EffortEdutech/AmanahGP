# Authority User Onboarding

Purpose: onboard MAIN/JAIN officers into AGP Console Authority View with scoped access, not super-admin access.

## Roles

- `authority_viewer`: read dashboards, organisations, submissions, obligations, exceptions, evidence metadata, reports, and activity within assigned jurisdiction.
- `authority_reviewer`: reviewer workflow permissions for submissions, evidence metadata, cases, and corrective action tracking.
- `authority_manager`: reviewer permissions plus exception/case management and selected policy workflow actions.
- `authority_admin`: authority administration for membership and jurisdiction assignments.

Platform roles may help configure the pilot, but authority workflow actions must be attributable to the officer's authority role.

## Onboarding Steps

1. Create or confirm the user in `users`.
2. Create an `authority_members` row for the correct authority.
3. Assign the member to one or more jurisdictions through `authority_jurisdiction_assignments`.
4. Confirm member and assignment status are `active`.
5. Ask the officer to sign in to AGP Console.
6. Verify `/authority` appears in navigation.
7. Verify the officer can see only assigned pilot organisations.
8. Verify the officer cannot browse unrelated organisation-private records.

## Access Review

Before pilot start and at least weekly during pilot:

- review active authority members;
- review assigned jurisdictions;
- remove stale assignments;
- confirm no officer is using platform-owner access for ordinary authority review;
- capture access review notes in the pilot evidence pack.

## Negative Checks

- A State A officer must not see State B pilot organisations.
- Removed authority members must lose access immediately.
- Viewer role must not perform reviewer or manager actions.
- Organisation members must not access Authority View datasets.
