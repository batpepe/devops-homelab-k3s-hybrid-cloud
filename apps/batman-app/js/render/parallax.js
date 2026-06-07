// render/parallax.js
// Procedural rainy Gotham backdrop drawn in screen space. Each building layer scrolls
// by a fraction of camera.x (parallax depth). Buildings are generated once with a tiny
// seeded RNG so the skyline is stable frame to frame.

export class Parallax {
  constructor(viewW, viewH, roomW) {
    this.vw = viewW; this.vh = viewH;
    this.layers = [
      this._buildings(roomW, 0.20, viewH * 0.42, viewH * 0.72, '#0b0f1e', 80, 1),
      this._buildings(roomW, 0.45, viewH * 0.52, viewH * 0.82, '#11182f', 58, 7),
      this._buildings(roomW, 0.72, viewH * 0.62, viewH * 0.92, '#19223f', 44, 13),
    ];
    this.rain = [];
    for (let i = 0; i < 170; i++) {
      this.rain.push({ x: Math.random() * viewW, y: Math.random() * viewH, len: 8 + Math.random() * 10, sp: 720 + Math.random() * 420 });
    }
  }

  _rng(seed) { let s = seed; return () => (s = (s * 9301 + 49297) % 233280) / 233280; }

  _buildings(roomW, factor, minTop, maxTop, color, step, seed) {
    const rnd = this._rng(seed);
    const items = [];
    const span = roomW + this.vw;
    for (let x = -120; x < span; x += step * (0.7 + rnd() * 0.8)) {
      const w = step * (0.8 + rnd() * 0.9);
      const top = minTop + rnd() * (maxTop - minTop);
      items.push({ x, w, top });
    }
    return { factor, color, items };
  }

  draw(ctx, camera) {
    const g = ctx.createLinearGradient(0, 0, 0, this.vh);
    g.addColorStop(0, '#05060d');
    g.addColorStop(0.6, '#0a0e1c');
    g.addColorStop(1, '#0f152a');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, this.vw, this.vh);

    // Moon glow
    const mg = ctx.createRadialGradient(this.vw * 0.78, this.vh * 0.24, 8, this.vw * 0.78, this.vh * 0.24, 190);
    mg.addColorStop(0, 'rgba(180,200,255,0.30)');
    mg.addColorStop(1, 'rgba(180,200,255,0)');
    ctx.fillStyle = mg;
    ctx.fillRect(this.vw * 0.78 - 190, this.vh * 0.24 - 190, 380, 380);

    for (const layer of this.layers) {
      const off = camera.x * layer.factor;
      for (const b of layer.items) {
        const sx = b.x - off;
        if (sx + b.w < 0 || sx > this.vw) continue;
        ctx.fillStyle = layer.color;
        ctx.fillRect(sx, b.top, b.w, this.vh - b.top);
        ctx.fillStyle = 'rgba(229,169,16,0.10)'; // dim lit windows
        for (let wy = b.top + 14; wy < this.vh - 18; wy += 24) {
          if (Math.floor(b.x + wy) % 3 === 0) ctx.fillRect(sx + 7, wy, 6, 9);
        }
      }
    }
  }

  drawRain(ctx, dt) {
    ctx.strokeStyle = 'rgba(150,180,220,0.22)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (const d of this.rain) {
      d.y += d.sp * dt;
      d.x -= d.sp * 0.2 * dt;
      if (d.y > this.vh) { d.y = -10; d.x = Math.random() * this.vw; }
      if (d.x < 0) d.x += this.vw;
      ctx.moveTo(d.x, d.y);
      ctx.lineTo(d.x - 2, d.y + d.len);
    }
    ctx.stroke();
  }
}
