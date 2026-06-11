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

test('room graph is consistent', async ({ page }) => {
  await page.goto('/', { waitUntil: 'load' });
  const errors = await page.evaluate(() => import('/js/world.js').then((m) => m.validateRoomGraph()));
  expect(errors).toEqual([]);
});

test('exit transition swaps rooms and persists state', async ({ page }) => {
  const errors = trackErrors(page);

  await page.goto('/', { waitUntil: 'load' });
  await page.locator('#btn-start').click();

  // Clear both courtyard waves through the test seam until the gate opens.
  await page.waitForFunction(() => {
    const g = window.__bat.game;
    for (const e of g.enemies) { e.hp = 0; e.dead = true; }
    return g.phase === 'EXPLORE';
  });

  // Mark state, then step into the east exit.
  await page.evaluate(() => {
    const g = window.__bat.game;
    g.player.health = 3;
    window.__scoreBefore = g.score;
    g.player.x = g.room.width - 50;
    g.player.y = g.room.groundY - 70;
  });
  // Doorway commit: arming a transition must grant i-frames so a chaser cannot kill
  // the player mid-fade (that death used to freeze the fade into a fake hang).
  await page.waitForFunction(() => window.__bat.game.transition || window.__bat.game.room.id === 'skybridge');
  const committed = await page.evaluate(() => {
    const g = window.__bat.game;
    return g.room.id === 'skybridge' || g.player.invulnTimer > 0;
  });
  expect(committed).toBe(true);

  await page.waitForFunction(() => window.__bat.game.room.id === 'skybridge');

  const after = await page.evaluate(() => {
    const g = window.__bat.game;
    return {
      health: g.player.health,
      scoreDelta: g.score - window.__scoreBefore,
      parallaxMatchesRoom: g.parallax.roomW === g.room.width,
      courtyardVisited: !!(g.roomStates.courtyard && g.roomStates.courtyard.visited),
      banner: document.getElementById('room-banner').textContent,
    };
  });
  expect(after.health).toBe(3);                 // health persists across rooms
  expect(after.scoreDelta).toBe(0);             // score persists across rooms
  expect(after.parallaxMatchesRoom).toBe(true); // parallax rebuilt for the new width
  expect(after.courtyardVisited).toBe(true);
  expect(after.banner).toMatch(/skybridge/i);

  // Walk back west: cleared courtyard enemies must stay dead.
  await page.evaluate(() => {
    const g = window.__bat.game;
    g.player.x = 4; g.player.y = g.room.groundY - 70;
  });
  await page.waitForFunction(() => window.__bat.game.room.id === 'courtyard' && !window.__bat.game.transition);
  const back = await page.evaluate(() => window.__bat.game.enemies.length);
  expect(back).toBe(0);

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
