// Smoke test: boot the built image and assert the game actually runs - proves the ES
// modules loaded, newGame() executed, and the HUD drew. This catches runtime/import
// breakage the Trivy scan cannot see. CI runs it after the image build + scan and
// before the manifest bump, so a broken build can never be promoted. Never shipped in
// the image (excluded by ../.dockerignore).
import { test, expect } from '@playwright/test';

test('game boots, menu dismisses, HUD renders, no console errors', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console.error: ' + m.text()); });

  await page.goto('/', { waitUntil: 'load' });

  // Start menu present before play; #btn-start is the campaign entry point.
  await expect(page.locator('#menu-start')).toBeVisible();
  await page.locator('#btn-start').click();

  // newGame() ran: the start menu is dismissed and the segmented health HUD drew.
  await expect(page.locator('#menu-start')).toHaveClass(/hidden/);
  await expect(page.locator('#hud-health .seg').first()).toBeVisible();

  // Run a few frames so any per-frame runtime error surfaces.
  await page.waitForTimeout(800);

  expect(errors, errors.join('\n')).toEqual([]);
});
