#!/usr/bin/env node
// scripts/seed-auth-users.mjs
// Amanah Governance Platform — Create Supabase Auth users for local dev
//
// Usage: node scripts/seed-auth-users.mjs
//
// Run AFTER: npx supabase db reset
// Run BEFORE: testing any auth-protected flows locally

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL     = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'http://127.0.0.1:54421';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_ROLE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY is required. Copy from `npx supabase status`.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const SEED_USERS = [
  { email: 'superadmin@agp.test',  password: 'Test1234!', displayName: 'Super Admin',    platformRole: 'super_admin', placeholder: 'seed-super-admin' },
  { email: 'reviewer@agp.test',    password: 'Test1234!', displayName: 'Nur Reviewer',   platformRole: 'reviewer',    placeholder: 'seed-reviewer' },
  { email: 'scholar@agp.test',     password: 'Test1234!', displayName: 'Ustaz Scholar',  platformRole: 'scholar',     placeholder: 'seed-scholar' },
  { email: 'orgadmin@agp.test',    password: 'Test1234!', displayName: 'Siti Org Admin', platformRole: 'donor',       placeholder: 'seed-org-admin' },
  { email: 'donor@agp.test',       password: 'Test1234!', displayName: 'Ahmad Donor',    platformRole: 'donor',       placeholder: 'seed-donor' },
];

console.log('\n🔐 Amanah Governance Platform — Seed Auth Users\n');

let created = 0;
let skipped = 0;
let errors  = 0;

for (const u of SEED_USERS) {
  process.stdout.write(`  Creating ${u.email}… `);

  const { data: existing } = await supabase.auth.admin.listUsers();
  const alreadyExists = existing?.users?.find(au => au.email === u.email);

  if (alreadyExists) {
    await supabase
      .from('users')
      .update({ auth_provider_user_id: alreadyExists.id, platform_role: u.platformRole })
      .eq('email', u.email);
    console.log(`skipped (exists, UID synced: ${alreadyExists.id.slice(0, 8)}…)`);
    skipped++;
    continue;
  }

  const { data: created_user, error } = await supabase.auth.admin.createUser({
    email:         u.email,
    password:      u.password,
    email_confirm: true,
    user_metadata: { display_name: u.displayName, platform_role: u.platformRole },
  });

  if (error) {
    console.log(`❌ ERROR: ${error.message}`);
    errors++;
    continue;
  }

  const authUid = created_user.user.id;

  await supabase
    .from('users')
    .update({ auth_provider_user_id: authUid, platform_role: u.platformRole })
    .eq('email', u.email);

  console.log(`✅ created (${authUid.slice(0, 8)}…)`);
  created++;
}

console.log(`\n${'─'.repeat(50)}`);
console.log(`Done: ${created} created, ${skipped} already existed, ${errors} errors\n`);

if (errors > 0) {
  process.exit(1);
}

console.log('Local seed users ready. Sign in at:');
console.log('  AmanahHub:         http://localhost:3300/login');
console.log('  AmanahHub Console: http://localhost:3301/login');
console.log('\nAll passwords: Test1234!\n');
