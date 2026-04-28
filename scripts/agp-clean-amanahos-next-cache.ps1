# Run from repo root in PowerShell.
# Stop pnpm dev server first, then run this cleanup before build.

$ErrorActionPreference = "SilentlyContinue"

Remove-Item -Recurse -Force "apps/org/.next"
Remove-Item -Recurse -Force "apps/org/.turbo"
Remove-Item -Recurse -Force "node_modules/.cache"

$ErrorActionPreference = "Stop"

pnpm -C apps/org build
