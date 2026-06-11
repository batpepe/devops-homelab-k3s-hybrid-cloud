// render/sprites.js
// Procedural visuals. Batman is drawn as a small jointed skeleton (head, torso, two
// arms, two legs) plus a velocity-reactive cape, so states actually animate; enemies
// and the boss are distinct silhouettes that flash on their attack windup (the parry
// cue). Also: ground contact shadows, radial glows, pickups, hazards, projectiles,
// and boss shockwaves. All drawing is in world space (camera transform already applied).

const BLUE = '#3fb7ff';
const GOLD = '#ffd23f';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
function limb(ctx, x1, y1, x2, y2, w, color) {
  ctx.strokeStyle = color; ctx.lineWidth = w; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
}
const _glowCache = new Map(); // radial gradients are positional, so cache them at the
function glow(ctx, x, y, r, color, a = 1) { // origin (keyed by radius+colour) and translate
  const key = r + '|' + color;
  let g = _glowCache.get(key);
  if (!g) {
    g = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
    g.addColorStop(0, color); g.addColorStop(1, 'rgba(0,0,0,0)');
    _glowCache.set(key, g);
  }
  ctx.save(); ctx.globalAlpha = a; ctx.translate(x, y); ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

// Contact shadow: projected onto the nearest standable surface below the entity and
// shrunk/faded with the drop, so it stays on the ground during jumps instead of
// riding along glued to the feet.
export function drawShadow(ctx, e, solids) {
  const cx = e.x + e.w / 2, feet = e.y + e.h;
  let gy = Infinity;
  for (const s of solids || []) {
    if (cx >= s.x && cx <= s.x + s.w && s.y >= feet - 4 && s.y < gy) gy = s.y;
  }
  if (gy === Infinity) gy = feet; // over a pit edge: fall back to the old behavior
  const k = Math.max(0.25, 1 - Math.max(0, gy - feet) / 320);
  ctx.save(); ctx.globalAlpha = 0.32 * k; ctx.fillStyle = '#000';
  ctx.beginPath(); ctx.ellipse(cx, gy - 2, e.w * 0.55 * k, 7 * k, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

export function drawPlatforms(ctx, room) {
  for (const p of room.platforms) {
    const g = ctx.createLinearGradient(0, p.y, 0, p.y + p.h);
    g.addColorStop(0, '#141824'); g.addColorStop(1, '#090b12');
    ctx.fillStyle = g; ctx.fillRect(p.x, p.y, p.w, p.h);
    ctx.fillStyle = 'rgba(63,183,255,0.5)'; ctx.fillRect(p.x, p.y, p.w, 2);
  }
}

export function drawHazards(ctx, room, time) {
  for (const hz of room.hazards || []) {
    if (hz.type === 'spikes') {
      ctx.fillStyle = '#6a7079';
      for (let x = hz.x; x < hz.x + hz.w; x += 14) {
        ctx.beginPath(); ctx.moveTo(x, hz.y + hz.h); ctx.lineTo(x + 7, hz.y); ctx.lineTo(x + 14, hz.y + hz.h); ctx.closePath(); ctx.fill();
      }
    } else if (hz.type === 'electric') {
      ctx.fillStyle = 'rgba(40,80,140,0.3)'; ctx.fillRect(hz.x, hz.y, hz.w, hz.h);
      ctx.strokeStyle = 'rgba(120,200,255,' + (0.5 + 0.5 * Math.sin(time * 20)).toFixed(2) + ')';
      ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(hz.x, hz.y + 4);
      for (let x = hz.x; x < hz.x + hz.w; x += 12) ctx.lineTo(x, hz.y + 4 + Math.random() * 6);
      ctx.stroke();
    }
  }
}

export function drawGate(ctx, room) {
  const g = room.gate; if (!g || g.open) return;
  ctx.fillStyle = '#1b1f2b'; ctx.fillRect(g.x, g.y, g.w, g.h);
  ctx.strokeStyle = GOLD; ctx.globalAlpha = 0.55; ctx.lineWidth = 3;
  for (let y = g.y + 8; y < g.y + g.h; y += 18) { ctx.beginPath(); ctx.moveTo(g.x, y); ctx.lineTo(g.x + g.w, y); ctx.stroke(); }
  ctx.globalAlpha = 1;
}

export function drawAnchors(ctx, room, time) {
  for (const a of room.anchors) {
    const pulse = 0.5 + 0.5 * Math.sin(time * 4 + a.x);
    glow(ctx, a.x, a.y, 26, 'rgba(229,169,16,0.25)', 0.8);
    ctx.strokeStyle = GOLD; ctx.lineWidth = 3; ctx.globalAlpha = 0.5 + pulse * 0.5;
    ctx.beginPath(); ctx.arc(a.x, a.y, 12, 0, Math.PI * 2); ctx.stroke(); ctx.globalAlpha = 1;
  }
}

export function drawExits(ctx, room, time) {
  for (const ex of room.exits || []) {
    const pulse = 0.4 + 0.25 * Math.sin(time * 3 + ex.x);
    const g = ctx.createLinearGradient(0, ex.y, 0, ex.y + ex.h);
    g.addColorStop(0, 'rgba(63,183,255,0)');
    g.addColorStop(1, 'rgba(63,183,255,0.30)');
    ctx.save(); ctx.globalAlpha = pulse;
    ctx.fillStyle = g; ctx.fillRect(ex.x, ex.y, ex.w, ex.h);
    ctx.restore();
    glow(ctx, ex.x + ex.w / 2, ex.y + ex.h - 8, 30, 'rgba(63,183,255,0.35)', pulse);
  }
}

export function drawPickup(ctx, pk, time) {
  const yy = pk.y + Math.sin(time * 4) * 3;
  glow(ctx, pk.x + pk.w / 2, yy + pk.h / 2, 22, 'rgba(63,183,255,0.4)', 0.9);
  ctx.fillStyle = GOLD; ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(pk.x + pk.w / 2, yy); ctx.lineTo(pk.x + pk.w, yy + pk.h / 2);
  ctx.lineTo(pk.x + pk.w / 2, yy + pk.h); ctx.lineTo(pk.x, yy + pk.h / 2);
  ctx.closePath(); ctx.fill(); ctx.stroke();
}

export function drawProjectile(ctx, pr) {
  const c = pr.deflected ? BLUE : '#ff5a4a';
  glow(ctx, pr.x, pr.y, 16, pr.deflected ? 'rgba(63,183,255,0.5)' : 'rgba(255,90,74,0.5)', 0.9);
  ctx.fillStyle = c; ctx.beginPath(); ctx.arc(pr.x, pr.y, 6, 0, Math.PI * 2); ctx.fill();
}

export function drawShockwaves(ctx, list) {
  for (const s of list) {
    ctx.globalAlpha = Math.max(0, s.life / s.max);
    ctx.strokeStyle = '#ffcf5a'; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.arc(s.x, s.y, s.r, Math.PI, 0); ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

export function drawTrail(ctx, player) {
  for (const g of player.trail) {
    ctx.globalAlpha = (g.life / 0.3) * 0.4; ctx.fillStyle = BLUE;
    ctx.fillRect(g.x, g.y, player.w, player.h);
  }
  ctx.globalAlpha = 1;
}

export function drawBatman(ctx, p, time) {
  const cx = p.x + p.w / 2, top = p.y, hw = p.w / 2, h = p.h;
  glow(ctx, cx, top + h * 0.5, 70, 'rgba(63,183,255,0.18)', 0.85);
  ctx.save(); ctx.translate(cx, top); ctx.scale(p.facing, 1);
  if (p.invulnTimer > 0 && Math.floor(time * 30) % 2 === 0) ctx.globalAlpha = 0.45;

  const moving = Math.abs(p.vx) > 20 && p.onGround;
  const t = time * 12;
  const swing = moving ? Math.sin(t) * 0.5 : 0;
  const hipY = h * 0.62, shoulderY = h * 0.34, headY = h * 0.18;

  // Legs (back leg darker for depth)
  limb(ctx, 0, hipY, hw * 0.2 - swing * hw * 0.5, hipY + h * 0.2, 9, '#101218');
  limb(ctx, hw * 0.2 - swing * hw * 0.5, hipY + h * 0.2, hw * 0.2 - swing * hw * 0.6, h, 8, '#101218');
  limb(ctx, 0, hipY, -hw * 0.1 + swing * hw * 0.5, hipY + h * 0.2, 10, '#15171f');
  limb(ctx, -hw * 0.1 + swing * hw * 0.5, hipY + h * 0.2, -hw * 0.05 + swing * hw * 0.7, h, 9, '#15171f');

  drawCape(ctx, p, hw, h, time);

  // Torso
  ctx.fillStyle = '#1a1d27'; roundRect(ctx, -hw * 0.42, shoulderY, hw * 0.84, hipY - shoulderY + 6, 6); ctx.fill();
  ctx.strokeStyle = 'rgba(96,128,178,0.5)'; ctx.lineWidth = 1.5; ctx.stroke(); // edge so he reads on busy bg
  // Emblem
  ctx.fillStyle = GOLD; ctx.globalAlpha = 0.9;
  ctx.beginPath(); ctx.ellipse(0, shoulderY + (hipY - shoulderY) * 0.4, hw * 0.2, hw * 0.12, 0, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 1;

  drawArms(ctx, p, hw, h, shoulderY, swing);

  // Head + cowl ears
  ctx.fillStyle = '#15171f';
  ctx.beginPath(); ctx.arc(0, headY, hw * 0.46, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = 'rgba(96,128,178,0.5)'; ctx.lineWidth = 1.3; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-hw * 0.4, headY - hw * 0.1); ctx.lineTo(-hw * 0.28, headY - hw * 0.95); ctx.lineTo(-hw * 0.12, headY - hw * 0.05); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(hw * 0.4, headY - hw * 0.1); ctx.lineTo(hw * 0.28, headY - hw * 0.95); ctx.lineTo(hw * 0.12, headY - hw * 0.05); ctx.closePath(); ctx.fill();
  // Lenses + rim light
  ctx.fillStyle = '#dff1ff'; ctx.fillRect(hw * 0.05, headY - 2, hw * 0.22, 3);
  ctx.strokeStyle = 'rgba(63,183,255,0.5)'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(hw * 0.25, shoulderY); ctx.lineTo(hw * 0.25, hipY); ctx.stroke();

  // Attack slash
  if (p.state === 'ATTACK' && p.attackHit) {
    const pr = 1 - p.attackTimer / p.attackDur;
    const a0 = -Math.PI * 0.6 + pr * Math.PI * 1.1;
    ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.arc(hw * 0.3, h * 0.45, hw * 1.7, a0, a0 + 0.7); ctx.stroke();
  }
  if (p.state === 'PARRY') {
    ctx.strokeStyle = p.isParryActive() ? GOLD : 'rgba(255,210,63,0.4)'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(hw * 0.45, h * 0.5, hw * 0.85, -Math.PI / 2, Math.PI / 2); ctx.stroke();
  }
  ctx.restore();
}

function drawCape(ctx, p, hw, h, time) {
  const sway = Math.max(-1, Math.min(1, -p.vx / 360)) * 26 + Math.sin(time * 5) * 5;
  const air = !p.onGround ? 14 : 0;
  ctx.fillStyle = '#0a0c16';
  ctx.beginPath();
  ctx.moveTo(-hw * 0.1, h * 0.30);
  ctx.quadraticCurveTo(-hw * 1.1 - air + sway, h * 0.45, -hw * 0.5 + sway * 0.5, h * 1.02);
  ctx.quadraticCurveTo(-hw * 0.1 + sway * 0.3, h * 0.8, hw * 0.35, h * 0.95);
  ctx.quadraticCurveTo(hw * 0.25, h * 0.5, hw * 0.2, h * 0.30);
  ctx.closePath(); ctx.fill();
}

function drawArms(ctx, p, hw, h, shoulderY, swing) {
  const sx = hw * 0.2, sy = shoulderY + 4;
  let ex, ey;
  if (p.state === 'ATTACK') { const pr = 1 - p.attackTimer / p.attackDur; ex = hw * (0.6 + pr * 0.8); ey = h * 0.4 - Math.sin(pr * Math.PI) * h * 0.1; }
  else if (p.state === 'PARRY') { ex = hw * 0.7; ey = h * 0.36; }
  else { ex = hw * 0.25 - swing * hw * 0.4; ey = h * 0.55; }
  limb(ctx, sx, sy, ex, ey, 8, '#15171f');
}

export function drawEnemy(ctx, e, time) {
  ctx.save(); ctx.translate(e.x + e.w / 2, e.y); ctx.scale(e.facing, 1);
  const hw = e.w / 2, h = e.h;
  let body = e.type === 'brute' ? '#3a2030' : e.type === 'blade' ? '#202a33' : e.type === 'thrower' ? '#2a2a1a' : '#2a2233';
  if (e.state === 'WINDUP') { const fl = 0.5 + 0.5 * Math.sin(time * 30); body = 'rgba(255,' + Math.floor(60 + fl * 150) + ',80,1)'; }
  else if (e.hurtTimer > 0) body = '#ffffff';

  const sw = Math.sin(e.walk * 6) * hw * 0.4;
  limb(ctx, 0, h * 0.6, sw, h, 7, '#0e0e14');
  limb(ctx, 0, h * 0.6, -sw, h, 7, '#0e0e14');
  ctx.fillStyle = body; roundRect(ctx, -hw * 0.8, h * 0.2, e.w * 0.8, h * 0.45, 5); ctx.fill();
  ctx.strokeStyle = 'rgba(200,210,230,0.30)'; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.beginPath(); ctx.arc(0, h * 0.16, hw * 0.55, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#ff5a5a'; ctx.fillRect(hw * 0.1, h * 0.1, hw * 0.3, 3);
  if (e.type === 'blade') limb(ctx, hw * 0.2, h * 0.4, hw * 1.15, h * 0.3, 3, '#9fe0ff');
  if (e.type === 'thrower' && e.state === 'WINDUP') { ctx.fillStyle = '#ffcf5a'; ctx.beginPath(); ctx.arc(hw * 0.8, h * 0.35, 6, 0, Math.PI * 2); ctx.fill(); }
  if (e.state === 'WINDUP' && e.cfg.reach > 0) { // melee strike telegraph: red arc that intensifies as the hit lands
    const tw = e.timer / (e.cfg.windup || 0.5);
    ctx.strokeStyle = 'rgba(255,70,60,' + (0.35 + 0.45 * (1 - tw)).toFixed(2) + ')'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(hw * 0.2, h * 0.42, e.cfg.reach * 0.9, -0.7, 0.7); ctx.stroke();
  }
  if (e.state === 'STUNNED') { ctx.fillStyle = GOLD; ctx.font = 'bold 14px sans-serif'; for (let i = 0; i < 3; i++) { const a = time * 6 + i * 2.1; ctx.fillText('*', Math.cos(a) * 14 - 4, -8); } }
  ctx.restore();
}

export function drawBoss(ctx, b, time) {
  glow(ctx, b.x + b.w / 2, b.y + b.h * 0.5, 110, b.phase === 2 ? 'rgba(255,60,60,0.12)' : 'rgba(160,60,90,0.10)', 0.8);
  ctx.save(); ctx.translate(b.x + b.w / 2, b.y); ctx.scale(b.facing, 1);
  const hw = b.w / 2, h = b.h;
  let body = b.phase === 2 ? '#5a1828' : '#33202c';
  if (b.state.indexOf('TELE') >= 0 || b.state === 'ROAR') { const fl = 0.5 + 0.5 * Math.sin(time * 24); body = 'rgba(255,' + Math.floor(70 + fl * 120) + ',70,1)'; }
  else if (b.hurtTimer > 0) body = '#ffffff';

  limb(ctx, -hw * 0.3, h * 0.55, -hw * 0.4, h, 16, '#1a0e14');
  limb(ctx, hw * 0.3, h * 0.55, hw * 0.4, h, 16, '#1a0e14');
  ctx.fillStyle = body; roundRect(ctx, -hw * 0.7, h * 0.18, b.w * 0.7, h * 0.5, 10); ctx.fill();
  ctx.strokeStyle = body; ctx.lineWidth = 20; ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-hw * 0.5, h * 0.3); ctx.lineTo(-hw * 0.8, h * 0.6);
  ctx.moveTo(hw * 0.5, h * 0.3); ctx.lineTo(hw * 0.85, b.attackActive ? h * 0.32 : h * 0.6);
  ctx.stroke();
  ctx.fillStyle = body; ctx.beginPath(); ctx.arc(0, h * 0.12, hw * 0.4, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#ff3030'; ctx.fillRect(-hw * 0.2, h * 0.08, hw * 0.4, 4);
  // Attack telegraphs (danger cues): combo swing, charge lane, ground-pound zone
  if (b.state === 'COMBO_TELE') { ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(hw * 0.2, h * 0.4, hw * 1.6, -0.7, 0.7); ctx.stroke(); }
  if (b.state === 'CHARGE_TELE') { ctx.strokeStyle = 'rgba(255,60,50,0.7)'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(hw * 0.6, h * 0.5); ctx.lineTo(hw * 3.4, h * 0.5); ctx.stroke(); }
  if (b.state === 'POUND_TELE') { ctx.strokeStyle = 'rgba(255,80,60,' + (0.4 + 0.4 * Math.sin(time * 30)).toFixed(2) + ')'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(0, h, hw * 1.6, Math.PI, 0); ctx.stroke(); }
  if (b.state === 'STUNNED') { ctx.fillStyle = GOLD; ctx.font = 'bold 20px sans-serif'; for (let i = 0; i < 4; i++) { const a = time * 5 + i * 1.57; ctx.fillText('*', Math.cos(a) * 22 - 6, -10); } }
  ctx.restore();
}

export function drawBatarang(ctx, b, time) {
  ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(time * 30);
  ctx.fillStyle = '#0b0e18'; ctx.strokeStyle = BLUE; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(-8, 0); ctx.lineTo(0, -5); ctx.lineTo(8, 0); ctx.lineTo(0, 5); ctx.closePath();
  ctx.fill(); ctx.stroke(); ctx.restore();
}

export function drawGrapple(ctx, p) {
  if (!p.grappleTarget) return;
  ctx.strokeStyle = GOLD; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(p.x + p.w / 2, p.y + p.h * 0.3); ctx.lineTo(p.grappleTarget.x, p.grappleTarget.y); ctx.stroke();
}
