// gadgets.js
// Batarang projectiles + the grappling-hook target search. The batarang damages enemies
// and the boss, and knocks down incoming enemy projectiles (deflect by destroying).
// Cooldowns live on the player.

import { aabb } from './physics.js';

export class Gadgets {
  constructor() { this.batarangs = []; }

  throwBatarang(player) {
    const dir = player.facing;
    this.batarangs.push({
      x: player.x + player.w / 2 + dir * 20,
      y: player.y + player.h * 0.35,
      w: 16, h: 10, vx: dir * 640, life: 1.1,
    });
  }

  update(dt, enemies, fx, enemyProjectiles, audio, boss) {
    for (let i = this.batarangs.length - 1; i >= 0; i--) {
      const b = this.batarangs[i];
      b.x += b.vx * dt; b.life -= dt;
      let hit = false;
      const box = { x: b.x - 8, y: b.y - 5, w: b.w, h: b.h };

      for (const e of enemies) {
        if (e.dead) continue;
        if (aabb(box, e)) { e.takeDamage(1, Math.sign(b.vx)); fx.sparks(b.x, b.y, '#3fb7ff', 8); audio.batarangHit(); hit = true; break; }
      }
      if (!hit && boss && !boss.dead && aabb(box, boss)) { boss.takeDamage(1); fx.sparks(b.x, b.y, '#3fb7ff', 8); audio.batarangHit(); hit = true; }
      if (!hit) {
        for (let j = enemyProjectiles.length - 1; j >= 0; j--) {
          const pr = enemyProjectiles[j];
          if (pr.deflected) continue;
          if (Math.abs(pr.x - b.x) < 18 && Math.abs(pr.y - b.y) < 16) { enemyProjectiles.splice(j, 1); fx.sparks(b.x, b.y, '#3fb7ff', 6); audio.batarangHit(); hit = true; break; }
        }
      }
      if (hit || b.life <= 0) this.batarangs.splice(i, 1);
    }
  }
}

export function findGrappleTarget(player, room, enemies, range = 380) {
  const px = player.x + player.w / 2, py = player.y + player.h / 2;
  let best = null, bestD = range;
  for (const a of room.anchors) {
    const dx = a.x - px;
    if (Math.sign(dx) !== player.facing && Math.abs(dx) > 40) continue;
    const d = Math.hypot(dx, a.y - py);
    if (d < bestD) { bestD = d; best = { kind: 'anchor', x: a.x, y: a.y }; }
  }
  if (best) return best;
  for (const e of enemies) {
    if (e.dead) continue;
    const dx = e.x - px;
    if (Math.sign(dx) !== player.facing) continue;
    const d = Math.hypot(dx, e.y - py);
    if (d < bestD) { bestD = d; best = { kind: 'enemy', enemy: e, x: e.x + e.w / 2, y: e.y + e.h / 2 }; }
  }
  return best;
}
