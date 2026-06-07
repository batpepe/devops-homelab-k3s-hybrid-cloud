// camera.js
// Follow camera with smoothing, clamped to room bounds, plus decaying screen shake.
// Wrap world-space drawing in begin()/end(); parallax and HUD draw outside it.

import { clamp } from './physics.js';

export class Camera {
  constructor(width, height) {
    this.w = width; this.h = height;
    this.x = 0; this.y = 0;
    this.shakeMag = 0; this.shakeX = 0; this.shakeY = 0;
  }

  addShake(mag) { this.shakeMag = Math.min(this.shakeMag + mag, 26); }

  follow(target, room, dt) {
    const cx = target.x + target.w / 2 - this.w / 2;
    const cy = target.y + target.h / 2 - this.h / 2;
    this.x += (cx - this.x) * Math.min(1, dt * 8);
    this.y += (cy - this.y) * Math.min(1, dt * 6);
    this.x = clamp(this.x, 0, Math.max(0, room.width - this.w));
    this.y = clamp(this.y, 0, Math.max(0, room.height - this.h));

    if (this.shakeMag > 0.1) {
      this.shakeX = (Math.random() * 2 - 1) * this.shakeMag;
      this.shakeY = (Math.random() * 2 - 1) * this.shakeMag;
      this.shakeMag *= Math.pow(0.0015, dt); // quick exponential decay
    } else {
      this.shakeMag = this.shakeX = this.shakeY = 0;
    }
  }

  begin(ctx) {
    ctx.save();
    ctx.translate(Math.round(-this.x + this.shakeX), Math.round(-this.y + this.shakeY));
  }
  end(ctx) { ctx.restore(); }
}
