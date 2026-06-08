// render/render.js
// Per-frame draw orchestration and layer order: baked parallax (screen space) -> world
// (camera space: shadows, level, entities, fx) -> foreground silhouettes + rain +
// flash/vignette overlay (screen space) -> touch controls. HUD/menus are DOM.

import * as S from './sprites.js';

export function renderWorld(ctx, game, dt) {
  const { camera, room, player, enemies, gadgets, fx, parallax, input, time, boss, enemyProjectiles, pickups, shockwaves } = game;
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  parallax.draw(ctx, camera);

  camera.begin(ctx);
  for (const e of enemies) if (!e.dead) S.drawShadow(ctx, e);
  if (boss && !boss.dead) S.drawShadow(ctx, boss);
  S.drawShadow(ctx, player);

  S.drawPlatforms(ctx, room);
  S.drawHazards(ctx, room, time);
  S.drawGate(ctx, room);
  S.drawAnchors(ctx, room, time);
  for (const pk of pickups) S.drawPickup(ctx, pk, time);
  S.drawShockwaves(ctx, shockwaves);
  S.drawGrapple(ctx, player);
  S.drawTrail(ctx, player);
  for (const e of enemies) if (!e.dead) S.drawEnemy(ctx, e, time);
  if (boss && !boss.dead) S.drawBoss(ctx, boss, time);
  for (const pr of enemyProjectiles) S.drawProjectile(ctx, pr);
  for (const b of gadgets.batarangs) S.drawBatarang(ctx, b, time);
  S.drawBatman(ctx, player, time);
  fx.draw(ctx);
  camera.end(ctx);

  parallax.drawForeground(ctx, camera);
  parallax.drawRain(ctx, dt);
  fx.drawOverlay(ctx, ctx.canvas.width, ctx.canvas.height, player);

  if (input.usingTouch) drawTouchControls(ctx, input);
}

function drawTouchControls(ctx, input) {
  ctx.save();
  const j = input.joystick;
  ctx.globalAlpha = 0.22; ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.arc(j.baseX, j.baseY, j.radius, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 0.5;
  ctx.beginPath(); ctx.arc(j.active ? j.knobX : j.baseX, j.active ? j.knobY : j.baseY, 32, 0, Math.PI * 2); ctx.fill();
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = 'bold 13px sans-serif';
  for (const b of input.buttons) {
    ctx.globalAlpha = input.held[b.action] ? 0.55 : 0.2; ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 0.9; ctx.fillStyle = '#0b0e18'; ctx.fillText(b.label, b.x, b.y);
  }
  ctx.restore();
}
