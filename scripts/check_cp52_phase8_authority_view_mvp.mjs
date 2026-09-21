import fs from 'node:fs';

const requiredRoutes = [
  'apps/agp-console/app/(console)/authority/page.tsx',
  'apps/agp-console/app/(console)/authority/organisations/page.tsx',
  'apps/agp-console/app/(console)/authority/submissions/page.tsx',
  'apps/agp-console/app/(console)/authority/obligations/page.tsx',
  'apps/agp-console/app/(console)/authority/exceptions/page.tsx',
  'apps/agp-console/app/(console)/authority/cases/page.tsx',
  'apps/agp-console/app/(console)/authority/evidence/page.tsx',
  'apps/agp-console/app/(console)/authority/actions/page.tsx',
  'apps/agp-console/app/(console)/authority/reports/page.tsx',
  'apps/agp-console/app/(console)/authority/policy/page.tsx',
  'apps/agp-console/app/(console)/authority/activity/page.tsx',
];

const requiredSnippets = [
  'Authority View',
  '/authority/submissions',
  '/authority/obligations',
  '/authority/exceptions',
  '/authority/evidence',
  'MAIN/JAIN oversight without super-admin access',
];

for (const file of requiredRoutes) {
  if (!fs.existsSync(file)) {
    console.error(`[phase8-authority-view] missing route: ${file}`);
    process.exitCode = 1;
  }
}

const nav = fs.readFileSync('apps/agp-console/lib/console/navigation.ts', 'utf8');
for (const snippet of requiredSnippets) {
  if (!nav.includes(snippet)) {
    console.error(`[phase8-authority-view] navigation missing snippet: ${snippet}`);
    process.exitCode = 1;
  }
}

const dashboard = fs.readFileSync('apps/agp-console/app/(console)/authority/page.tsx', 'utf8');
for (const snippet of ['getRegulatorySubmissionSummary', 'getAuthorityObligationSummary', 'getAuthorityExceptionSummary', 'getAuthorityEvidenceSummary']) {
  if (!dashboard.includes(snippet)) {
    console.error(`[phase8-authority-view] dashboard missing summary: ${snippet}`);
    process.exitCode = 1;
  }
}

const evidence = fs.readFileSync('apps/agp-console/app/(console)/authority/evidence/page.tsx', 'utf8');
if (!evidence.includes('Raw private files remain governed by source RLS')) {
  console.error('[phase8-authority-view] evidence page must state the private-file boundary.');
  process.exitCode = 1;
}

const checklist = fs.readFileSync('docs/AGP_MAIN_JAIN_CODEBASE_POLISH_CHECKLIST.md', 'utf8');
if (!checklist.includes('Phase 8 - Authority View MVP') || !checklist.includes('Authority View navigation')) {
  console.error('[phase8-authority-view] checklist missing Phase 8 progress.');
  process.exitCode = 1;
}

if (!process.exitCode) {
  console.log('[phase8-authority-view] Authority View MVP route contract OK');
}
