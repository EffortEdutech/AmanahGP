$files = @(
  "apps/user/app/page.tsx",
  "apps/user/app/api/trust/[orgId]/route.ts",
  "apps/user/app/charities/page.tsx",
  "apps/user/app/charities/[orgId]/page.tsx"
)

foreach ($file in $files) {
  if (-not (Test-Path -LiteralPath $file)) {
    Write-Host "Missing:" $file
    continue
  }

  $content = Get-Content -LiteralPath $file -Raw

  # First repair accidental double replacement.
  $content = $content -replace "v_amanahhub_public_trust_profiles_live_score_live_score", "v_amanahhub_public_trust_profiles_live_score"

  # Only replace exact quoted source view references.
  $content = $content -replace "'v_amanahhub_public_trust_profiles'", "'v_amanahhub_public_trust_profiles_live_score'"
  $content = $content -replace '"v_amanahhub_public_trust_profiles"', '"v_amanahhub_public_trust_profiles_live_score"'

  Set-Content -LiteralPath $file -Value $content -Encoding UTF8
  Write-Host "Patched:" $file
}