// camera.js
// Follow camera with facing look-ahead (shows more of where you are heading), a small
// upward bias, smoothing, clamping to room bounds, and decaying screen shake. Wrap
// world-space drawing in begin()/end(). During hitstop main skips update(), so the
// camera naturally freezes too.

import { clamp } from './physics.js';

const REDUCED_MOTION = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

export class Camera {
  constructor(width, height) {
    this.w = width; this.h = height;
    this.x = 0; this.y = 0;
    this.shakeMag = 0; this.shakeX = 0; this.shakeY = 0;
  }

  addShake(mag) { if (REDUCED_MOTION) mag *= 0.25; this.shakeMag = Math.min(this.shakeMag + mag, 30); }

  follow(target, room, dt) {
    const look = (target.facing || 1) * 90;
    const cx = target.x + target.w / 2 - this.w / 2 + look;
    const cy = target.y + target.h / 2 - this.h / 2 - 30;
    this.x += (cx - this.x) * Math.min(1, dt * 5);
    this.y += (cy - this.y) * Math.min(1, dt * 4);
    this.x = clamp(this.x, 0, Math.max(0, room.width - this.w));
    this.y = clamp(this.y, 0, Math.max(0, room.height - this.h));

    if (this.shakeMag > 0.1) {
      this.shakeX = (Math.random() * 2 - 1) * this.shakeMag;
      this.shakeY = (Math.random() * 2 - 1) * this.shakeMag;
      this.shakeMag *= Math.pow(0.0015, dt);
    } else {
      this.shakeMag = this.shakeX = this.shakeY = 0;
    }
  }

  // Hard placement for room transitions: no lerp from the previous room, no leftover shake.
  snap(target, room) {
    const look = (target.facing || 1) * 90;
    this.x = clamp(target.x + target.w / 2 - this.w / 2 + look, 0, Math.max(0, room.width - this.w));
    this.y = clamp(target.y + target.h / 2 - this.h / 2 - 30, 0, Math.max(0, room.height - this.h));
    this.shakeMag = this.shakeX = this.shakeY = 0;
  }

  begin(ctx) {
    ctx.save();
    ctx.translate(Math.round(-this.x + this.shakeX), Math.round(-this.y + this.shakeY));
  }
  end(ctx) { ctx.restore(); }
}
