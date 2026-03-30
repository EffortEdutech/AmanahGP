// e2e/tests/helpers.ts
// Amanah Governance Platform — E2E test helpers

import { Page, expect } from '@playwright/test';

// ── URLs ──────────────────────────────────────────────────────
export const USER_URL  = process.env.USER_APP_URL  ?? 'http://localhost:3300';
export const ADMIN_URL = process.env.ADMIN_APP_URL ?? 'http://localhost:3301';

// ── Seed data (matches seed.sql) ──────────────────────────────
export const SEED = {
  reviewer:  { email: 'reviewer@agp.test',  password: 'Test1234!' },
  orgAdmin:  { email: 'orgadmin@agp.test',  password: 'Test1234!' },
  donor:     { email: 'donor@agp.test',     password: 'Test1234!' },
  superAdmin:{ email: 'superadmin@agp.test',password: 'Test1234!' },

  approvedOrg: {
    id:   'b0000001-0000-0000-0000-000000000003',
    name: 'Masjid Al-Amanah Waqf Trust',
  },
  project: {
    id:    'c0000001-0000-0000-0000-000000000001',
    title: 'Waqf Library Penang — Phase 1',
  },
  confirmedDonation: {
    id: 'd1000001-0000-0000-0000-000000000002',
  },
};

// ── Sign in to admin app ──────────────────────────────────────
export async function signInAdmin(page: Page, email: string, password: string) {
  await page.goto(`${ADMIN_URL}/login`);
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL(`${ADMIN_URL}/dashboard`);
}

// ── Sign in to user app ───────────────────────────────────────
export async function signInUser(page: Page, email: string, password: string) {
  await page.goto(`${USER_URL}/login`);
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL(`${USER_URL}/`);
}

// ── Assert no console errors ──────────────────────────────────
export function collectConsoleErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  return errors;
}

// ── Assert page has no visible error UI ──────────────────────
export async function assertNoErrorUI(page: Page) {
  await expect(page.locator('text=Internal Server Error')).not.toBeVisible();
  await expect(page.locator('text=Something went wrong')).not.toBeVisible();
  await expect(page.locator('[data-testid="error"]')).not.toBeVisible();
}
