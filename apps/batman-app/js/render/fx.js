// render/fx.js
// Particle + impact effects: sparks, jump/land dust, expanding shockwave rings, a brief
// full-screen flash, and a low-health red vignette. Screen shake lives on the Camera;
// combat code calls camera.addShake() at the impact site. draw() runs in world space;
// drawOverlay() runs in screen space (flash + vignette) after the camera transform ends.

const REDUCED_MOTION = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

export class Effects {
  constructor() {
    this.particles = [];
    this.rings = [];
    this.floaters = [];
    this.flash = 0;
    this.flashColor = '255,255,255';
  }

  sparks(x, y, color = '#ffd23f', count = 14) {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2, sp = 120 + Math.random() * 280;
      this.particles.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0.4, max: 0.4, size: 2 + Math.random() * 2, color });
    }
  }

  burst(x, y, color = '#3fb7ff', count = 10) {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2, sp = 50 + Math.random() * 150;
      this.particles.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 40, life: 0.5, max: 0.5, size: 2 + Math.random() * 3, color });
    }
  }

  dust(x, y) {
    for (let i = 0; i < 8; i++) {
      const a = -Math.PI / 2 + (Math.random() - 0.5) * 1.8, sp = 40 + Math.random() * 90;
      this.particles.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.4, life: 0.45, max: 0.45, size: 3 + Math.random() * 3, color: 'rgba(150,152,162,1)' });
    }
  }

  ring(x, y, color = '#ffffff', maxR = 70) { this.rings.push({ x, y, r: 6, maxR, life: 0.35, max: 0.35, color }); }

  impact(x, y, color = '#ffffff') { this.sparks(x, y, color, 14); this.ring(x, y, color, 84); this.setFlash(0.12, '255,255,255'); }

  setFlash(a, color = '255,255,255') { this.flash = Math.max(this.flash, REDUCED_MOTION ? a * 0.4 : a); this.flashColor = color; }

  score(x, y, amount) {
    if (this.floaters.length > 40) this.floaters.shift();
    this.floaters.push({ x, y, vy: -46, life: 0.8, max: 0.8, text: '+' + amount });
  }

  update(dt) {
    if (this.particles.length > 280) this.particles.splice(0, this.particles.length - 280);
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) { this.particles.splice(i, 1); continue; }
      p.vy += 520 * dt; p.x += p.vx * dt; p.y += p.vy * dt;
    }
    for (let i = this.rings.length - 1; i >= 0; i--) {
      const r = this.rings[i];
      r.life -= dt;
      if (r.life <= 0) { this.rings.splice(i, 1); continue; }
      r.r += (r.maxR - r.r) * Math.min(1, dt * 8);
    }
    for (let i = this.floaters.length - 1; i >= 0; i--) {
      const f = this.floaters[i];
      f.life -= dt;
      if (f.life <= 0) { this.floaters.splice(i, 1); continue; }
      f.y += f.vy * dt; f.vy *= Math.pow(0.25, dt);
    }
    if (this.flash > 0) this.flash -= dt * 2.2;
  }

  draw(ctx) {
    for (const p of this.particles) {
      ctx.globalAlpha = Math.max(0, p.life / p.max);
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
    for (const r of this.rings) {
      ctx.globalAlpha = Math.max(0, r.life / r.max);
      ctx.strokeStyle = r.color; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2); ctx.stroke();
    }
    if (this.floaters.length) {
      ctx.font = 'bold 15px sans-serif'; ctx.textAlign = 'center';
      for (const f of this.floaters) {
        ctx.globalAlpha = Math.max(0, f.life / f.max);
        ctx.fillStyle = '#e5a910';
        ctx.fillText(f.text, f.x, f.y);
      }
      ctx.textAlign = 'left';
    }
    ctx.globalAlpha = 1;
  }

  drawOverlay(ctx, w, h, player) {
    if (this.flash > 0) {
      ctx.globalAlpha = Math.min(0.6, this.flash);
      ctx.fillStyle = 'rgb(' + this.flashColor + ')';
      ctx.fillRect(0, 0, w, h);
      ctx.globalAlpha = 1;
    }
    if (player && player.health <= 1 && !player.dead) {
      const pulse = 0.20 + 0.14 * Math.sin(performance.now() / 200);
      const g = ctx.createRadialGradient(w / 2, h / 2, h * 0.34, w / 2, h / 2, h * 0.82);
      g.addColorStop(0, 'rgba(255,0,0,0)');
      g.addColorStop(1, 'rgba(255,0,0,' + pulse.toFixed(3) + ')');
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    }
  }
}
