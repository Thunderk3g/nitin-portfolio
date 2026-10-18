// @ts-check
const { test, expect: baseExpect } = require('@playwright/test');

// Every admin step round-trips to the Supabase region (~2.5 s per hop from here), so allow time.
const expect = baseExpect.configure({ timeout: 20_000 });

const EMAIL = process.env.ADMIN_EMAIL;
const PASSWORD = process.env.ADMIN_PASSWORD;

// These run against the live Supabase project and restore everything they change.
// Serial and desktop-only (see playwright.config.js) so they never race each other.
test.describe.configure({ mode: 'serial', timeout: 120_000 });
test.use({ actionTimeout: 20_000, navigationTimeout: 30_000 });

test('unauthenticated /admin redirects to the login page', async ({ page }) => {
  await page.goto('/admin');
  await expect(page).toHaveURL(/\/admin\/login\?redirect=%2Fadmin$/);
  await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
});

test('wrong password is rejected', async ({ page }) => {
  await page.goto('/admin/login');
  await page.locator('#email').fill('nobody@example.com');
  await page.locator('#password').fill('not-the-password');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByText('Invalid email or password.')).toBeVisible();
});

test.describe('signed in', () => {
  test.skip(!EMAIL || !PASSWORD, 'ADMIN_EMAIL / ADMIN_PASSWORD not set');

  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/login');
    await page.locator('#email').fill(/** @type {string} */ (EMAIL));
    await page.locator('#password').fill(/** @type {string} */ (PASSWORD));
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  });

  test('editing a content section updates the live site', async ({ page }) => {
    await page.goto('/admin/content/cta');
    const headline = page.locator('#f-title');
    const original = await headline.inputValue();
    const changed = 'E2E headline check, please ignore';
    try {
      await headline.fill(changed);
      await page.getByRole('button', { name: 'Save changes' }).click();
      await expect(page.getByText('Saved. The live site is updated.')).toBeVisible();
      await page.goto('/');
      await expect(page.locator('#cta-title')).toHaveText(changed);
    } finally {
      await page.goto('/admin/content/cta');
      await page.locator('#f-title').fill(original);
      await page.getByRole('button', { name: 'Save changes' }).click();
      await expect(page.getByText('Saved. The live site is updated.')).toBeVisible();
    }
    await page.goto('/');
    await expect(page.locator('#cta-title')).toHaveText(original);
  });

  test('a published project replaces the placeholders, then is deleted', async ({ page }) => {
    const title = `E2E project ${Date.now()}`;
    await page.goto('/admin/projects/new?category=long-form');
    await page.locator('#p-title').fill(title);
    await page.locator('#p-role').fill('Editor');
    await page.locator('#p-status').selectOption('published');
    await page.getByRole('button', { name: 'Create project' }).click();
    await expect(page.getByRole('heading', { name: 'Edit project' })).toBeVisible();
    const editUrl = page.url();
    try {
      await page.goto('/projects#long-form');
      await expect(page.locator('.clip')).toHaveCount(1);
      await expect(page.locator('.clip-title')).toHaveText(title);
    } finally {
      await page.goto(editUrl);
      page.once('dialog', d => d.accept());
      await page.getByRole('button', { name: 'Delete project' }).click();
      await expect(page).toHaveURL(/\/admin\/projects$/);
    }
    await page.goto('/projects#long-form');
    await expect(page.locator('.clip')).toHaveCount(6);
  });

  test('uploading media adds it to the library, then it is deleted', async ({ page }) => {
    const name = `e2e-${Date.now()}.png`;
    // 1x1 transparent PNG
    const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');
    await page.goto('/admin/media');
    await page.getByLabel('Upload media files').setInputFiles({ name, mimeType: 'image/png', buffer: png });
    await expect(page.locator('.adm-uploads li', { hasText: name })).toContainText('Done');
    const tile = page.locator('.media-tile', { hasText: name });
    await expect(tile).toBeVisible();
    const src = await tile.locator('img').getAttribute('src');
    expect(src).toMatch(/\/storage\/v1\/object\/public\/media\//);
    const res = await page.request.get(/** @type {string} */ (src));
    expect(res.status()).toBe(200);

    page.once('dialog', d => d.accept());
    await tile.getByRole('button', { name: 'Delete' }).click();
    await expect(tile).toHaveCount(0);
  });
});
