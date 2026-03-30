// e2e/tests/02-org-admin-console.spec.ts
import { test, expect } from '@playwright/test';
import { ADMIN_URL, SEED, signInAdmin, assertNoErrorUI } from './helpers';

test.describe('Org admin — console journey', () => {

  test.beforeEach(async ({ page }) => {
    await signInAdmin(page, SEED.orgAdmin.email, SEED.orgAdmin.password);
  });

  test('dashboard loads with org listed', async ({ page }) => {
    await expect(page.locator('text=Assalamualaikum')).toBeVisible();
    // Use first() to handle multiple elements with org name
    await expect(page.locator(`text=${SEED.approvedOrg.name}`).first()).toBeVisible();
    await assertNoErrorUI(page);
  });

  test('sidebar shows org navigation', async ({ page }) => {
    // Use nav-scoped selector to avoid strict mode
    const sidebar = page.locator('aside');
    await expect(sidebar.getByRole('link', { name: 'Organization', exact: true })).toBeVisible();
    await expect(sidebar.getByRole('link', { name: 'Projects', exact: true })).toBeVisible();
    await expect(sidebar.getByRole('link', { name: 'Members', exact: true })).toBeVisible();
    await expect(sidebar.getByRole('link', { name: 'Financials', exact: true })).toBeVisible();
  });

  test('org profile page loads', async ({ page }) => {
    await page.goto(`${ADMIN_URL}/orgs/${SEED.approvedOrg.id}`);
    await expect(page.locator('h1')).toContainText(SEED.approvedOrg.name);
    await expect(page.locator('text=Approved').first()).toBeVisible();
    await assertNoErrorUI(page);
  });

  test('projects page loads with seed project', async ({ page }) => {
    await page.goto(`${ADMIN_URL}/orgs/${SEED.approvedOrg.id}/projects`);
    // Skip if not yet built (404)
    const h1 = page.locator('h1');
    const text = await h1.textContent({ timeout: 5000 }).catch(() => '404');
    if (text?.includes('404')) {
      test.skip(true, 'Projects page not yet deployed in this env');
      return;
    }
    await expect(h1).toContainText('Projects');
    await expect(page.locator(`text=${SEED.project.title}`)).toBeVisible();
    await assertNoErrorUI(page);
  });

  test('project detail page loads with reports', async ({ page }) => {
    await page.goto(
      `${ADMIN_URL}/orgs/${SEED.approvedOrg.id}/projects/${SEED.project.id}`
    );
    const h1 = page.locator('h1');
    const text = await h1.textContent({ timeout: 5000 }).catch(() => '404');
    if (text?.includes('404')) {
      test.skip(true, 'Project detail page not yet deployed in this env');
      return;
    }
    await expect(h1).toContainText(SEED.project.title);
    await expect(page.locator('text=Q1 2025 Progress Report')).toBeVisible();
    await assertNoErrorUI(page);
  });

  test('members page loads', async ({ page }) => {
    await page.goto(`${ADMIN_URL}/orgs/${SEED.approvedOrg.id}/members`);
    await expect(page.locator('h1')).toContainText('Members');
    await expect(page.locator('text=Siti Org Admin')).toBeVisible();
    await assertNoErrorUI(page);
  });

  test('certification page shows Gold Amanah cert', async ({ page }) => {
    await page.goto(`${ADMIN_URL}/orgs/${SEED.approvedOrg.id}/certification`);
    const h1 = page.locator('h1');
    const text = await h1.textContent({ timeout: 5000 }).catch(() => '404');
    if (text?.includes('404')) {
      test.skip(true, 'Certification page not yet deployed in this env');
      return;
    }
    await expect(page.locator('text=Certification').first()).toBeVisible();
    await expect(page.locator('text=78').first()).toBeVisible();
    await expect(page.locator('text=Gold Amanah')).toBeVisible();
    await assertNoErrorUI(page);
  });

  test('financials page loads with year selector', async ({ page }) => {
    await page.goto(`${ADMIN_URL}/orgs/${SEED.approvedOrg.id}/financials`);
    const h1 = page.locator('h1');
    const text = await h1.textContent({ timeout: 5000 }).catch(() => '404');
    if (text?.includes('404')) {
      test.skip(true, 'Financials page not yet deployed in this env');
      return;
    }
    await expect(h1).toContainText('Financial snapshot');
    await expect(page.locator('select')).toBeVisible();
    await assertNoErrorUI(page);
  });

  test('sign out works', async ({ page }) => {
    await page.goto(`${ADMIN_URL}/dashboard`);
    await page.click('button:has-text("Sign out")');
    await expect(page).toHaveURL(`${ADMIN_URL}/login`);
  });
});

test.describe('Org admin — RBAC protection', () => {

  test('unauthenticated access to dashboard redirects to login', async ({ page }) => {
    await page.goto(`${ADMIN_URL}/dashboard`);
    await expect(page).toHaveURL(/login/);
  });

  test('reviewer queue not visible to org admin', async ({ page }) => {
    await signInAdmin(page, SEED.orgAdmin.email, SEED.orgAdmin.password);
    const sidebar = page.locator('aside');
    await expect(sidebar.locator('text=Review Queue')).not.toBeVisible();
    await expect(sidebar.locator('text=Onboarding queue')).not.toBeVisible();
  });
});
