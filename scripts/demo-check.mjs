#!/usr/bin/env node
// scripts/demo-check.mjs
// Amanah Governance Platform — Sprint 0 Demo Validation Script
//
// Usage: node scripts/demo-check.mjs

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'http://127.0.0.1:54421';
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ANON_KEY     = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SERVICE_KEY || !ANON_KEY) {
  console.error('❌ Missing env vars. Copy .env.example to .env.local and fill in Supabase keys.');
  process.exit(1);
}

const service = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
const anon    = createClient(SUPABASE_URL, ANON_KEY,   { auth: { persistSession: false } });

let passed = 0;
let failed = 0;

async function check(label, fn) {
  try {
    await fn();
    console.log(`  ✅ ${label}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ ${label}`);
    console.error(`     ${err.message}`);
    failed++;
  }
}

console.log('\n🔍 Amanah Governance Platform — Sprint 0 Demo Check\n');

console.log('1. Supabase connectivity');
await check('Health endpoint reachable', async () => {
  const res = await fetch(`${SUPABASE_URL}/health`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
});

console.log('\n2. Core tables');
const TABLES = [
  'users', 'organizations', 'org_members', 'projects',
  'project_reports', 'evidence_files', 'financial_snapshots',
  'certification_applications', 'certification_evaluations',
  'certification_history', 'trust_events', 'amanah_index_history',
  'donation_transactions', 'payment_webhook_events', 'audit_logs'
];
for (const table of TABLES) {
  await check(`Table: ${table}`, async () => {
    const { error } = await service.from(table).select('id').limit(1);
    if (error) throw new Error(error.message);
  });
}

console.log('\n3. Seed data');
await check('Super admin user exists', async () => {
  const { data, error } = await service.from('users').select('id').eq('email', 'superadmin@agp.test').single();
  if (error || !data) throw new Error('Super admin not found');
});
await check('Approved+listed organization exists', async () => {
  const { data, error } = await service.from('organizations').select('id').eq('listing_status', 'listed').limit(1);
  if (error || !data?.length) throw new Error('No listed org found');
});
await check('Verified project report exists', async () => {
  const { data, error } = await service.from('project_reports').select('id').eq('verification_status', 'verified').limit(1);
  if (error || !data?.length) throw new Error('No verified report found');
});
await check('Amanah Index history entry exists', async () => {
  const { data, error } = await service.from('amanah_index_history').select('id').limit(1);
  if (error || !data?.length) throw new Error('No amanah history found');
});
await check('Confirmed donation transaction exists', async () => {
  const { data, error } = await service.from('donation_transactions').select('id').eq('status', 'confirmed').limit(1);
  if (error || !data?.length) throw new Error('No confirmed donation found');
});
await check('Processed webhook event exists', async () => {
  const { data, error } = await service.from('payment_webhook_events').select('id').eq('processed', true).limit(1);
  if (error || !data?.length) throw new Error('No processed webhook event found');
});
await check('Audit logs exist', async () => {
  const { data, error } = await service.from('audit_logs').select('id').limit(1);
  if (error || !data?.length) throw new Error('No audit logs found');
});

console.log('\n4. RBAC helper functions');
await check('current_user_platform_role() exists', async () => {
  const { error } = await service.rpc('current_user_platform_role');
  if (error && !error.message.includes('null')) throw new Error(error.message);
});
await check('is_org_member() exists', async () => {
  const { error } = await service.rpc('is_org_member', { org_id: 'b0000001-0000-0000-0000-000000000003' });
  if (error && !error.message.includes('null')) throw new Error(error.message);
});

console.log('\n5. Public RLS (anon client)');
await check('Anon can read listed organizations', async () => {
  const { data, error } = await anon.from('organizations').select('id, listing_status').eq('listing_status', 'listed');
  if (error) throw new Error(error.message);
  if (!data?.length) throw new Error('No listed orgs visible to anon');
  const nonListed = data.filter(o => o.listing_status !== 'listed');
  if (nonListed.length) throw new Error('Private orgs leaked to anon!');
});
await check('Anon CANNOT read private organizations', async () => {
  const { data, error } = await anon.from('organizations').select('id').eq('listing_status', 'private');
  if (error) throw new Error(error.message);
  if (data?.length) throw new Error(`RLS LEAK: ${data.length} private org(s) visible to anon`);
});
await check('Anon CANNOT read audit logs', async () => {
  const { data } = await anon.from('audit_logs').select('id');
  if (data?.length) throw new Error('RLS LEAK: audit logs visible to anon');
});
await check('Anon CANNOT read webhook events', async () => {
  const { data } = await anon.from('payment_webhook_events').select('id');
  if (data?.length) throw new Error('RLS LEAK: webhook events visible to anon');
});

console.log(`\n${'─'.repeat(50)}`);
console.log(`Sprint 0 Demo Check: ${passed} passed, ${failed} failed`);

if (failed === 0) {
  console.log('\n✅ All checks passed. Baseline is valid.\n');
  console.log('  AmanahHub:         http://localhost:3300');
  console.log('  AmanahHub Console: http://localhost:3301');
  console.log('  Supabase Studio:   http://127.0.0.1:54423');
  console.log('  Mailpit:           http://127.0.0.1:54424\n');
} else {
  console.log(`\n❌ ${failed} check(s) failed.\n`);
  process.exit(1);
}
