// physics.js
// Minimal AABB platformer collision. Entities expose x,y,w,h,vx,vy plus the contact
// flags onGround, onWallLeft, onWallRight. Velocities are px/sec; dt is seconds.
// Resolution is axis-separated (move X, resolve, then move Y, resolve), which is
// cheap and robust for boxes and avoids tunnelling at normal speeds.

export function aabb(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }

export function moveAndCollide(e, solids, dt) {
  e.onGround = false;
  e.onWallLeft = false;
  e.onWallRight = false;

  // Horizontal sweep
  e.x += e.vx * dt;
  for (const s of solids) {
    if (s.oneway) continue;
    if (!aabb(e, s)) continue;
    if (e.vx > 0) { e.x = s.x - e.w; e.onWallRight = true; e.vx = 0; }
    else if (e.vx < 0) { e.x = s.x + s.w; e.onWallLeft = true; e.vx = 0; }
  }

  // Vertical sweep
  const prevBottom = e.y + e.h;
  e.y += e.vy * dt;
  for (const s of solids) {
    if (!aabb(e, s)) continue;
    if (s.oneway) {
      // One-way platforms only catch a falling body that was above them last step.
      if (e.vy > 0 && prevBottom <= s.y + 1) { e.y = s.y - e.h; e.vy = 0; e.onGround = true; }
      continue;
    }
    if (e.vy > 0) { e.y = s.y - e.h; e.vy = 0; e.onGround = true; }
    else if (e.vy < 0) { e.y = s.y + s.h; e.vy = 0; }
  }
}
