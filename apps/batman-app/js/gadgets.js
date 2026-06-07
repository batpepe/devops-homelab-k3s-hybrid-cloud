// gadgets.js
// Batarang projectiles and the grappling-hook target search. Cooldowns live on the
// player; this module owns the projectile lifecycle and picks a grapple target
// (prefer an anchor in front, else the nearest enemy in front).

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

  update(dt, enemies, fx) {
    for (let i = this.batarangs.length - 1; i >= 0; i--) {
      const b = this.batarangs[i];
      b.x += b.vx * dt;
      b.life -= dt;
      let hit = false;
      for (const e of enemies) {
        if (e.dead) continue;
        if (aabb({ x: b.x - 8, y: b.y - 5, w: b.w, h: b.h }, e)) {
          e.takeDamage(1);
          fx.sparks(b.x, b.y, '#3fb7ff', 8);
          hit = true;
          break;
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
