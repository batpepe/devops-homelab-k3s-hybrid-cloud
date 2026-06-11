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
  for (const e of enemies) if (!e.dead) S.drawShadow(ctx, e, room.solids);
  if (boss && !boss.dead) S.drawShadow(ctx, boss, room.solids);
  S.drawShadow(ctx, player, room.solids);

  S.drawPlatforms(ctx, room);
  S.drawHazards(ctx, room, time);
  S.drawGate(ctx, room);
  S.drawExits(ctx, room, time);
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

  // Room-transition fade: black ramps in to the swap at the midpoint, then back out.
  if (game.transition) {
    const tr = game.transition, half = tr.dur / 2;
    const a = tr.t < half ? tr.t / half : Math.max(0, 1 - (tr.t - half) / half);
    ctx.globalAlpha = Math.min(1, a);
    ctx.fillStyle = '#05060d';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.globalAlpha = 1;
  }

  if (input.usingTouch) drawTouchControls(ctx, input);
}

function drawTouchControls(ctx, input) {
  ctx.save();
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const j = input.joystick;
  // Joystick: faint base disc + ring (dim at rest, brighter when active), then the knob.
  ctx.globalAlpha = j.active ? 0.20 : 0.12; ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.arc(j.baseX, j.baseY, j.radius, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = j.active ? 0.45 : 0.25; ctx.strokeStyle = '#cfe0ff'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(j.baseX, j.baseY, j.radius, 0, Math.PI * 2); ctx.stroke();
  ctx.globalAlpha = j.active ? 0.6 : 0.35; ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.arc(j.knobX, j.knobY, 34, 0, Math.PI * 2); ctx.fill();
  // Action buttons: disc + ring, lit blue while held for clear press feedback.
  ctx.font = 'bold 14px sans-serif';
  for (const b of input.buttons) {
    const on = input.held[b.action];
    ctx.globalAlpha = on ? 0.6 : 0.22; ctx.fillStyle = on ? '#cfe0ff' : '#ffffff';
    ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = on ? 0.95 : 0.5; ctx.strokeStyle = '#cfe0ff'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.stroke();
    ctx.globalAlpha = 1; ctx.fillStyle = '#0b0e18'; ctx.fillText(b.label, b.x, b.y);
  }
  ctx.restore();
}
