// Smoke test: boot the built image and assert the game actually runs - proves the ES
// modules loaded, newGame() executed, and the HUD drew. This catches runtime/import
// breakage the Trivy scan cannot see. CI runs it after the image build + scan and
// before the manifest bump, so a broken build can never be promoted. Never shipped in
// the image (excluded by ../.dockerignore).
import { test, expect } from '@playwright/test';

function trackErrors(page) {
  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console.error: ' + m.text()); });
  return errors;
}

test('campaign boots, menu dismisses, HUD renders, no console errors', async ({ page }) => {
  const errors = trackErrors(page);

  await page.goto('/', { waitUntil: 'load' });

  // Start menu present before play; #btn-start is the campaign entry point.
  await expect(page.locator('#menu-start')).toBeVisible();
  await page.locator('#btn-start').click();

  // newGame() ran in the right mode: menu gone, health HUD drew, campaign objective up.
  await expect(page.locator('#menu-start')).toHaveClass(/hidden/);
  await expect(page.locator('#hud-health .seg').first()).toBeVisible();
  await expect(page.locator('#objective')).toHaveText(/courtyard/i);

  // Run a few frames so any per-frame runtime error surfaces.
  await page.waitForTimeout(800);

  expect(errors, errors.join('\n')).toEqual([]);
});

test('survival starts via its own button: endless objective and score readout', async ({ page }) => {
  const errors = trackErrors(page);

  await page.goto('/', { waitUntil: 'load' });
  await page.locator('#btn-endless').click();

  await expect(page.locator('#menu-start')).toHaveClass(/hidden/);
  await expect(page.locator('#objective')).toHaveText(/survive/i);
  await expect(page.locator('#hud-score')).toBeVisible();

  await page.waitForTimeout(800);

  expect(errors, errors.join('\n')).toEqual([]);
});

test('pause opens, resumes, and exits to the main menu', async ({ page }) => {
  const errors = trackErrors(page);

  await page.goto('/', { waitUntil: 'load' });
  await page.locator('#btn-start').click();

  await page.keyboard.press('p');
  await expect(page.locator('#menu-pause')).toBeVisible();
  await page.locator('#btn-resume').click();
  await expect(page.locator('#menu-pause')).toHaveClass(/hidden/);

  await page.keyboard.press('Escape');
  await expect(page.locator('#menu-pause')).toBeVisible();
  await page.locator('#btn-pause-menu').click();
  await expect(page.locator('#menu-start')).toBeVisible();

  expect(errors, errors.join('\n')).toEqual([]);
});
