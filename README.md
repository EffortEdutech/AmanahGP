# AmanahOS Sidebar Toggle Pack

This pack adds:

- mobile sidebar hidden by default
- mobile hamburger button to open sidebar
- mobile overlay and close button
- desktop hide/show sidebar button
- sidebar open state persisted in localStorage on desktop
- auto-close mobile drawer after navigation

## Files included

- `apps/org/components/layout/sidebar.tsx`
- `apps/org/components/layout/org-shell.tsx` (new)
- `apps/org/app/(protected)/layout.tsx`

## After copying the files

Run:

```powershell
pnpm -C apps/org build
```

Then push and redeploy to Vercel.
