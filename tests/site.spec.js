// @ts-check
const { test, expect } = require('@playwright/test');

const PAGES = [
  { path: '/index.html', nav: 'Home' },
  { path: '/projects.html', nav: 'Projects' },
  { path: '/contact.html', nav: 'Contact' }
];

// Fail on any script error from our own pages; ignore third-party font requests.
function trackErrors(page) {
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)/.test(m.text())) errors.push(m.text()); });
  return errors;
}

for (const { path, nav } of PAGES) {
  test.describe(path, () => {
    test('loads cleanly with shared styles', async ({ page }) => {
      const errors = trackErrors(page);
      await page.goto(path);
      await expect(page.locator('link[href="assets/site.css"]')).toHaveCount(1);
      const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
      expect(bg).toBe('rgb(21, 23, 28)');
      expect(errors).toEqual([]);
    });

    test('marks the current page in the main nav', async ({ page }) => {
      await page.goto(path);
      const current = page.getByRole('navigation', { name: 'Main' }).locator('a[aria-current="page"]');
      await expect(current).toHaveText(nav);
    });

    test('has no em or en dashes in visible text or title', async ({ page }) => {
      await page.goto(path);
      const text = await page.evaluate(() => document.title + ' ' + document.body.innerText);
      expect(text).not.toMatch(/[–—]/);
    });

    test('does not scroll horizontally', async ({ page }) => {
      await page.goto(path);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow).toBeLessThanOrEqual(0);
    });

    test('skip link moves focus target into view', async ({ page }, info) => {
      test.skip(info.project.name === 'mobile', 'keyboard only');
      await page.goto(path);
      await page.keyboard.press('Tab');
      await expect(page.locator('.skip')).toBeFocused();
      await expect(page.locator('.skip')).toBeInViewport();
    });
  });
}

test.describe('home', () => {
  test('hero shows the name, ink canvas and both CTAs above the fold', async ({ page }, info) => {
    await page.goto('/index.html');
    await expect(page.getByRole('heading', { level: 1, name: 'Nitin Wagh' })).toBeAttached();
    const canvas = page.locator('#ink');
    await expect.poll(() => canvas.evaluate(c => /** @type {HTMLCanvasElement} */ (c).width)).toBeGreaterThan(0);
    test.skip(info.project.name === 'mobile', 'mobile stacks the portrait above the about column');
    await expect(page.getByRole('link', { name: 'View my work' }).first()).toBeInViewport({ ratio: 1 });
    await expect(page.locator('.hero').getByRole('link', { name: 'Let’s talk' })).toBeInViewport({ ratio: 1 });
  });

  test('cursor reveal on desktop, tap toggle on touch', async ({ page }, info) => {
    await page.goto('/index.html');
    const real = page.locator('#real');
    if (info.project.name === 'mobile') {
      const tap = page.locator('#tap');
      await expect(tap).toBeVisible();
      await expect(tap).toHaveAttribute('aria-pressed', 'false');
      await tap.click();
      await expect(tap).toHaveAttribute('aria-pressed', 'true');
      await expect(tap).toHaveText('Show my real side');
      await expect(real).toHaveCSS('opacity', '0');
      await tap.click();
      await expect(tap).toHaveText('See my anime side');
    } else {
      await expect(page.locator('#tap')).toBeHidden();
      await expect(page.locator('.hero-hint')).toBeVisible();
      const box = await page.locator('#portrait').boundingBox();
      await page.mouse.move(box.x + box.width * 0.3, box.y + box.height * 0.6);
      await page.mouse.move(box.x + box.width * 0.32, box.y + box.height * 0.62, { steps: 4 });
      await expect.poll(() => real.evaluate(el => parseFloat(el.style.getPropertyValue('--r')))).toBeGreaterThan(40);
    }
  });

  test('category tiles link to each project category', async ({ page }) => {
    await page.goto('/index.html');
    const hrefs = await page.locator('.work .cat').evaluateAll(els => els.map(e => e.getAttribute('href')));
    expect(hrefs).toEqual(['projects.html#short-form', 'projects.html#long-form', 'projects.html#saas', 'projects.html#cinematic']);
  });

  test('marquees duplicate their items for screen readers only once', async ({ page }) => {
    await page.goto('/index.html');
    await expect(page.locator('.reel:not([aria-hidden])')).toHaveCount(6);
    await expect(page.locator('.reel[aria-hidden="true"][tabindex="-1"]')).toHaveCount(6);
    await expect(page.locator('.logo:not([aria-hidden])')).toHaveCount(10);
  });

  test('no dead "#" links and one label per CTA intent', async ({ page }) => {
    await page.goto('/index.html');
    await expect(page.locator('a[href="#"]')).toHaveCount(0);
    for (const label of ['See all projects', 'View all projects', 'Get in touch', 'View My Work']) {
      await expect(page.getByRole('link', { name: label, exact: true })).toHaveCount(0);
    }
  });

  test('marquee stops under reduced motion', async ({ browser }) => {
    const ctx = await browser.newContext({ reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    await page.goto('http://127.0.0.1:4173/index.html');
    await expect(page.locator('.marquee-track').first()).toHaveCSS('animation-name', 'none');
    await ctx.close();
  });
});

test.describe('projects', () => {
  test('category → gallery → player → close', async ({ page }) => {
    const errors = trackErrors(page);
    await page.goto('/projects.html');
    await expect(page.locator('.cat')).toHaveCount(4);
    await page.getByRole('link', { name: 'SaaS Demos' }).click();
    await expect(page).toHaveURL(/#saas$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('SaaS Demos');
    await expect(page.locator('.clip')).toHaveCount(6);
    await expect(page.locator('.clips-land')).toBeVisible();

    await page.getByRole('link', { name: 'Play [Project title 2]' }).click();
    await expect(page).toHaveURL(/#saas\/1$/);
    const dialog = page.getByRole('dialog', { name: '[Project title 2]' });
    await expect(dialog).toBeVisible();
    await expect(page.locator('#playBtn')).toBeFocused();
    expect(await page.evaluate(() => document.body.style.overflow)).toBe('hidden');
    await expect(dialog.locator('dt')).toHaveText(['Brief', 'My contribution', 'Tools']);

    await page.locator('#playBtn').click();
    await expect(dialog).toContainText('[Video file or link plays here]');

    await page.keyboard.press('Escape');
    await expect(page).toHaveURL(/#saas$/);
    await expect(dialog).toHaveCount(0);
    expect(await page.evaluate(() => document.body.style.overflow)).toBe('');
    expect(errors).toEqual([]);
  });

  test('backdrop click and Close button both dismiss the player', async ({ page }) => {
    await page.goto('/projects.html#cinematic/0');
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.locator('.player-backdrop').click({ position: { x: 5, y: 5 } });
    await expect(page).toHaveURL(/#cinematic$/);
    await page.goto('/projects.html#cinematic/2');
    await page.getByRole('link', { name: 'Close player' }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });

  test('vertical category uses the portrait grid and back link returns to the index', async ({ page }) => {
    await page.goto('/projects.html#short-form');
    await expect(page.locator('.clips-portrait .clip')).toHaveCount(6);
    await expect(page.locator('.others a')).toHaveCount(3);
    await page.getByRole('link', { name: 'Back to projects' }).click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Projects');
  });
});

test.describe('contact', () => {
  test('email and LinkedIn actions are present', async ({ page }) => {
    await page.goto('/contact.html');
    await expect(page.getByRole('link', { name: 'Email me' }).first()).toHaveAttribute('href', 'mailto:[Your Email Address]');
    await expect(page.getByRole('link', { name: 'Connect on LinkedIn' })).toBeVisible();
  });
});
