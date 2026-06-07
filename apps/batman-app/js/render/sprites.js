// render/sprites.js
// Procedural, code-drawn visuals (no image assets). Batman is a dark caped silhouette
// with a cowl, a velocity-reactive cape, and a blue rim light; enemies are blockier
// shapes that flash during their attack windup (the parry tell). All drawing happens
// in world space (the camera transform is already applied by the renderer).

const BLUE = '#3fb7ff';
const GOLD = '#ffd23f';

export function drawPlatforms(ctx, room) {
  for (const p of room.platforms) {
    ctx.fillStyle = '#0b0e18';
    ctx.fillRect(p.x, p.y, p.w, p.h);
    ctx.fillStyle = 'rgba(63,183,255,0.5)'; // neon top edge
    ctx.fillRect(p.x, p.y, p.w, 2);
  }
}

export function drawAnchors(ctx, room, time) {
  for (const a of room.anchors) {
    const pulse = 0.5 + 0.5 * Math.sin(time * 4 + a.x);
    ctx.strokeStyle = GOLD;
    ctx.lineWidth = 3;
    ctx.globalAlpha = 0.5 + pulse * 0.5;
    ctx.beginPath(); ctx.arc(a.x, a.y, 12, 0, Math.PI * 2); ctx.stroke();
    ctx.globalAlpha = 0.2;
    ctx.beginPath(); ctx.arc(a.x, a.y, 20, 0, Math.PI * 2); ctx.stroke();
    ctx.globalAlpha = 1;
  }
}

export function drawTrail(ctx, player) {
  for (const g of player.trail) {
    ctx.globalAlpha = (g.life / 0.3) * 0.4;
    ctx.fillStyle = BLUE;
    ctx.fillRect(g.x, g.y, player.w, player.h);
  }
  ctx.globalAlpha = 1;
}

export function drawBatman(ctx, p, time) {
  ctx.save();
  ctx.translate(p.x + p.w / 2, p.y);
  ctx.scale(p.facing, 1);
  if (p.invulnTimer > 0 && Math.floor(time * 30) % 2 === 0) ctx.globalAlpha = 0.4;

  const hw = p.w / 2, h = p.h;

  // Cape: a flowing polygon behind the body, swayed by horizontal speed + idle wobble.
  const sway = Math.max(-1, Math.min(1, -p.vx / 360)) * 22 + Math.sin(time * 6) * 4;
  ctx.fillStyle = '#0a0c16';
  ctx.beginPath();
  ctx.moveTo(-hw * 0.2, 8);
  ctx.quadraticCurveTo(-hw - 14 + sway, h * 0.5, -hw * 0.2 + sway * 0.4, h - 2);
  ctx.lineTo(hw * 0.5, h - 2);
  ctx.quadraticCurveTo(hw * 0.2, h * 0.4, hw * 0.2, 6);
  ctx.closePath();
  ctx.fill();

  // Body + legs (legs stride while running)
  ctx.fillStyle = '#15171f';
  ctx.fillRect(-hw * 0.5, h * 0.32, hw, h * 0.55);
  const stride = p.state === 'RUN' ? Math.sin(time * 16) * 6 : 0;
  ctx.fillRect(-hw * 0.45, h * 0.78, hw * 0.4, h * 0.22 + stride);
  ctx.fillRect(hw * 0.05, h * 0.78, hw * 0.4, h * 0.22 - stride);

  // Head + cowl ears
  ctx.beginPath(); ctx.arc(0, h * 0.22, hw * 0.5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-hw * 0.45, h * 0.12); ctx.lineTo(-hw * 0.3, -h * 0.05); ctx.lineTo(-hw * 0.12, h * 0.1);
  ctx.closePath(); ctx.fill();
  ctx.beginPath();
  ctx.moveTo(hw * 0.45, h * 0.12); ctx.lineTo(hw * 0.3, -h * 0.05); ctx.lineTo(hw * 0.12, h * 0.1);
  ctx.closePath(); ctx.fill();

  // Eyes + blue rim light on the leading edge
  ctx.fillStyle = '#dff1ff';
  ctx.fillRect(hw * 0.05, h * 0.2, hw * 0.18, 3);
  ctx.strokeStyle = 'rgba(63,183,255,0.5)';
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(hw * 0.2, h * 0.32); ctx.lineTo(hw * 0.2, h * 0.85); ctx.stroke();

  // State flourishes
  if (p.state === 'ATTACK' && p.attackHit) {
    const t = 1 - p.attackTimer / p.attackDur;
    const a0 = -Math.PI / 2 + t * Math.PI;
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(hw * 0.4, h * 0.5, hw * 1.5, a0, a0 + 0.8); ctx.stroke();
  }
  if (p.state === 'PARRY') {
    ctx.strokeStyle = p.isParryActive() ? GOLD : 'rgba(255,210,63,0.4)';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(hw * 0.4, h * 0.5, hw * 0.85, -Math.PI / 2, Math.PI / 2); ctx.stroke();
  }
  ctx.restore();
}

export function drawEnemy(ctx, e, time) {
  ctx.save();
  ctx.translate(e.x + e.w / 2, e.y);
  const hw = e.w / 2, h = e.h;

  let body = e.type === 'brute' ? '#3a2030' : '#2a2233';
  if (e.state === 'WINDUP') {
    const f = 0.5 + 0.5 * Math.sin(time * 30); // bright pulsing = parry cue
    body = `rgba(255,${Math.floor(60 + f * 130)},80,1)`;
  } else if (e.hurtTimer > 0) {
    body = '#ffffff';
  }
  ctx.fillStyle = body;
  ctx.fillRect(-hw, h * 0.2, e.w, h * 0.8);
  ctx.beginPath(); ctx.arc(0, h * 0.16, hw * 0.6, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#ff5a5a';
  ctx.fillRect(e.facing > 0 ? hw * 0.1 : -hw * 0.4, h * 0.12, hw * 0.3, 3);

  if (e.state === 'STUNNED') {
    ctx.fillStyle = GOLD;
    ctx.font = 'bold 14px sans-serif';
    for (let i = 0; i < 3; i++) {
      const a = time * 6 + i * (Math.PI * 2 / 3);
      ctx.fillText('*', Math.cos(a) * 14 - 4, -8);
    }
  }
  ctx.restore();
}

export function drawBatarang(ctx, b, time) {
  ctx.save();
  ctx.translate(b.x, b.y);
  ctx.rotate(time * 30);
  ctx.fillStyle = '#0b0e18';
  ctx.strokeStyle = BLUE;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-8, 0); ctx.lineTo(0, -5); ctx.lineTo(8, 0); ctx.lineTo(0, 5);
  ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.restore();
}

export function drawGrapple(ctx, p) {
  if (!p.grappleTarget) return;
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(p.x + p.w / 2, p.y + p.h * 0.3);
  ctx.lineTo(p.grappleTarget.x, p.grappleTarget.y);
  ctx.stroke();
}
