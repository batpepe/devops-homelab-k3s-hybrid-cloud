// render/parallax.js
// Hybrid art backdrop: the sky, building layers, and a near foreground are PAINTED ONCE
// to offscreen canvases (procedurally baked textures), then blitted each frame at a
// fraction of camera.x for parallax depth. This gives a textured, atmospheric look with
// zero committed image files. Plus an animated fog band, occasional lightning (which
// signals main.js to play thunder), and rain.

export class Parallax {
  constructor(vw, vh, roomW) {
    this.vw = vw; this.vh = vh; this.roomW = roomW;
    this.sky = this._bakeSky();
    this.layers = [
      this._bakeBuildings(0.20, vh * 0.40, vh * 0.70, '#0b0f1e', 84, 1),
      this._bakeBuildings(0.42, vh * 0.50, vh * 0.80, '#11182f', 60, 7),
      this._bakeBuildings(0.68, vh * 0.60, vh * 0.92, '#19223f', 46, 13),
    ];
    this.fg = this._bakeForeground();
    this.rain = [];
    for (let i = 0; i < 180; i++) this.rain.push({ x: Math.random() * vw, y: Math.random() * vh, len: 8 + Math.random() * 10, sp: 720 + Math.random() * 420 });
    this.flash = 0; this.nextBolt = 3 + Math.random() * 4; this.fog = 0;
  }

  _rng(seed) { let s = seed; return () => (s = (s * 9301 + 49297) % 233280) / 233280; }

  _bakeSky() {
    const c = document.createElement('canvas'); c.width = this.vw; c.height = this.vh;
    const x = c.getContext('2d');
    const g = x.createLinearGradient(0, 0, 0, this.vh);
    g.addColorStop(0, '#05060d'); g.addColorStop(0.55, '#0a0e1c'); g.addColorStop(1, '#0f152a');
    x.fillStyle = g; x.fillRect(0, 0, this.vw, this.vh);
    const mg = x.createRadialGradient(this.vw * 0.78, this.vh * 0.22, 8, this.vw * 0.78, this.vh * 0.22, 200);
    mg.addColorStop(0, 'rgba(190,205,255,0.35)'); mg.addColorStop(1, 'rgba(190,205,255,0)');
    x.fillStyle = mg; x.fillRect(0, 0, this.vw, this.vh);
    x.fillStyle = 'rgba(222,232,255,0.95)';
    x.beginPath(); x.arc(this.vw * 0.78, this.vh * 0.22, 26, 0, Math.PI * 2); x.fill();
    return c;
  }

  _bakeBuildings(factor, minTop, maxTop, color, step, seed) {
    const W = this.roomW + this.vw;
    const c = document.createElement('canvas'); c.width = W; c.height = this.vh;
    const x = c.getContext('2d'); const rnd = this._rng(seed);
    for (let bx = -120; bx < W; bx += step * (0.7 + rnd() * 0.8)) {
      const w = step * (0.8 + rnd() * 0.9);
      const top = minTop + rnd() * (maxTop - minTop);
      x.fillStyle = color; x.fillRect(bx, top, w, this.vh - top);
      for (let wy = top + 14; wy < this.vh - 16; wy += 22) {
        for (let wx = bx + 6; wx < bx + w - 6; wx += 14) {
          if (rnd() < 0.32) { x.fillStyle = 'rgba(229,169,16,' + (0.10 + rnd() * 0.18).toFixed(3) + ')'; x.fillRect(wx, wy, 6, 9); }
        }
      }
    }
    return { canvas: c, factor };
  }

  _bakeForeground() {
    const W = this.roomW + this.vw;
    const c = document.createElement('canvas'); c.width = W; c.height = this.vh;
    const x = c.getContext('2d'); const rnd = this._rng(99);
    x.fillStyle = '#04050a';
    for (let bx = 0; bx < W; bx += 8) x.fillRect(bx, this.vh - 16, 4, 16); // railing
    for (let gx = 160; gx < W; gx += 480 + rnd() * 420) {                  // gargoyle perches
      x.fillRect(gx, this.vh - 78, 58, 78);
      x.beginPath(); x.moveTo(gx, this.vh - 78); x.lineTo(gx + 29, this.vh - 108); x.lineTo(gx + 58, this.vh - 78); x.closePath(); x.fill();
    }
    return { canvas: c, factor: 1.15 };
  }

  update(dt) {
    this.fog += dt * 12;
    let thunder = false;
    this.nextBolt -= dt;
    if (this.nextBolt <= 0) { this.flash = 0.85; this.nextBolt = 5 + Math.random() * 7; thunder = true; }
    if (this.flash > 0) this.flash -= dt * 1.8;
    return thunder;
  }

  draw(ctx, camera) {
    ctx.drawImage(this.sky, 0, 0);
    if (this.flash > 0) { ctx.globalAlpha = Math.min(0.7, this.flash); ctx.fillStyle = '#9fb4e0'; ctx.fillRect(0, 0, this.vw, this.vh); ctx.globalAlpha = 1; }
    for (const L of this.layers) ctx.drawImage(L.canvas, -camera.x * L.factor, 0);
    const fy = this.vh * 0.62;
    ctx.globalAlpha = 0.10;
    const fg = ctx.createLinearGradient(0, fy, 0, fy + 120);
    fg.addColorStop(0, 'rgba(120,140,180,0)'); fg.addColorStop(0.5, 'rgba(120,140,180,1)'); fg.addColorStop(1, 'rgba(120,140,180,0)');
    ctx.fillStyle = fg; ctx.fillRect(0, fy + Math.sin(this.fog * 0.05) * 6, this.vw, 120);
    ctx.globalAlpha = 1;
  }

  drawForeground(ctx, camera) {
    ctx.globalAlpha = 0.92;
    ctx.drawImage(this.fg.canvas, -camera.x * this.fg.factor, 0);
    ctx.globalAlpha = 1;
  }

  drawRain(ctx, dt) {
    ctx.strokeStyle = 'rgba(150,180,220,0.22)'; ctx.lineWidth = 1; ctx.beginPath();
    for (const d of this.rain) {
      d.y += d.sp * dt; d.x -= d.sp * 0.2 * dt;
      if (d.y > this.vh) { d.y = -10; d.x = Math.random() * this.vw; }
      if (d.x < 0) d.x += this.vw;
      ctx.moveTo(d.x, d.y); ctx.lineTo(d.x - 2, d.y + d.len);
    }
    ctx.stroke();
  }
}
