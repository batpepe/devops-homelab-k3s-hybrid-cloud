// render/render.js
// Per-frame draw orchestration and layer order: parallax (screen space) -> world
// (camera space: platforms, anchors, entities, fx) -> rain + touch controls (screen
// space). The HUD and menus are DOM elements updated separately in hud.js.

import { drawPlatforms, drawAnchors, drawTrail, drawBatman, drawEnemy, drawBatarang, drawGrapple } from './sprites.js';

export function renderWorld(ctx, game, dt) {
  const { camera, room, player, enemies, gadgets, fx, parallax, input, time } = game;
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  parallax.draw(ctx, camera);

  camera.begin(ctx);
  drawPlatforms(ctx, room);
  drawAnchors(ctx, room, time);
  drawGrapple(ctx, player);
  drawTrail(ctx, player);
  for (const e of enemies) if (!e.dead) drawEnemy(ctx, e, time);
  for (const b of gadgets.batarangs) drawBatarang(ctx, b, time);
  drawBatman(ctx, player, time);
  fx.draw(ctx);
  camera.end(ctx);

  parallax.drawRain(ctx, dt);

  if (input.usingTouch) drawTouchControls(ctx, input);
}

function drawTouchControls(ctx, input) {
  ctx.save();
  const j = input.joystick;
  ctx.globalAlpha = 0.22; ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.arc(j.baseX, j.baseY, j.radius, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 0.5;
  ctx.beginPath();
  ctx.arc(j.active ? j.knobX : j.baseX, j.active ? j.knobY : j.baseY, 32, 0, Math.PI * 2);
  ctx.fill();

  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = 'bold 13px sans-serif';
  for (const b of input.buttons) {
    ctx.globalAlpha = input.held[b.action] ? 0.55 : 0.2;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 0.9; ctx.fillStyle = '#0b0e18';
    ctx.fillText(b.label, b.x, b.y);
  }
  ctx.restore();
}
