import { chromium } from "file:///C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs";
import { mkdirSync, writeFileSync } from "node:fs";

const outDir = "docs/pitch/2026-05-usm/live_probe";
mkdirSync(outDir, { recursive: true });

const email = "superadmin@agp.test";
const password = "test123";

async function snapshotPage(page, name) {
  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(2000);
  const text = await page.locator("body").innerText().catch(() => "");
  await page.screenshot({ path: `${outDir}/${name}.png`, fullPage: true }).catch(() => {});
  writeFileSync(`${outDir}/${name}.txt`, text, "utf8");
  return text;
}

async function login(page, url, name) {
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
  await snapshotPage(page, `${name}_login`);
  const emailInput = page.locator('input[type="email"], input[name="email"]').first();
  const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
  await emailInput.fill(email);
  await passwordInput.fill(password);
  await page.locator('button[type="submit"], button:has-text("Sign in"), button:has-text("Login")').first().click();
  await page.waitForLoadState("domcontentloaded").catch(() => {});
  await page.waitForTimeout(4000);
  return snapshotPage(page, `${name}_after_login`);
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 1100 } });
const page = await context.newPage();

const results = {};

await page.goto("https://amanah-hub.vercel.app/charities", { waitUntil: "domcontentloaded", timeout: 60000 });
results.charities = await snapshotPage(page, "amanahhub_charities");

results.os = await login(page, "https://amanah-os.vercel.app/", "amanahos");

results.console = await login(page, "https://amanah-hub-console.vercel.app/", "console");

writeFileSync(`${outDir}/summary.json`, JSON.stringify({
  capturedAt: new Date().toISOString(),
  urls: {
    charities: "https://amanah-hub.vercel.app/charities",
    os: "https://amanah-os.vercel.app/",
    console: "https://amanah-hub-console.vercel.app/",
  },
  textLengths: Object.fromEntries(Object.entries(results).map(([key, value]) => [key, value.length])),
}, null, 2));

await browser.close();

