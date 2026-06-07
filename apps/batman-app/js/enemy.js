// enemy.js
// Melee enemies with a visible attack windup (the parry tell). Two tunings: a quick
// "thug" and a slower, tougher "brute". AI: patrol around a home point until the player
// is near, close in, telegraph (WINDUP), then strike (ATTACK). A successful player
// parry calls stun(); the player's blade calls takeDamage().

import { moveAndCollide } from './physics.js';

const TYPES = {
  thug: { w: 40, h: 64, hp: 3, speed: 95, aggro: 330, windup: 0.55, reach: 56, dmg: 1, cd: 1.2 },
  brute: { w: 56, h: 80, hp: 6, speed: 62, aggro: 360, windup: 0.85, reach: 70, dmg: 2, cd: 1.7 },
};

export class Enemy {
  constructor(spawn) {
    const t = TYPES[spawn.type] || TYPES.thug;
    this.type = spawn.type; this.cfg = t;
    this.w = t.w; this.h = t.h;
    this.x = spawn.x; this.y = spawn.y - t.h;
    this.homeX = spawn.x;
    this.vx = 0; this.vy = 0;
    this.hp = t.hp; this.facing = -1;
    this.state = 'PATROL'; this.patrolDir = -1;
    this.timer = 0; this.cdTimer = 0; this.hurtTimer = 0; this.stunTimer = 0;
    this.attackActive = false; this.dead = false;
    this.onGround = false; this.onWallLeft = false; this.onWallRight = false;
  }

  stun() { this.state = 'STUNNED'; this.stunTimer = 2.2; this.attackActive = false; this.vx = 0; }

  takeDamage(n) {
    this.hp -= n; this.hurtTimer = 0.12;
    if (this.hp <= 0) this.dead = true;
  }

  attackHitbox() {
    if (!this.attackActive) return null;
    const r = this.cfg.reach;
    return { x: this.facing > 0 ? this.x + this.w : this.x - r, y: this.y + this.h * 0.3, w: r, h: this.h * 0.5 };
  }

  update(dt, player, solids) {
    if (this.dead) return;
    this.vy += 1500 * dt;
    if (this.hurtTimer > 0) this.hurtTimer -= dt;
    if (this.cdTimer > 0) this.cdTimer -= dt;

    const px = player.x + player.w / 2;
    const cx = this.x + this.w / 2;
    const dist = Math.abs(px - cx);

    if (this.state === 'STUNNED') {
      this.vx = 0; this.stunTimer -= dt;
      if (this.stunTimer <= 0) this.state = 'PATROL';
    } else if (this.state === 'WINDUP') {
      this.vx = 0; this.timer -= dt;
      this.facing = px < cx ? -1 : 1;
      if (this.timer <= 0) { this.state = 'ATTACK'; this.timer = 0.18; this.attackActive = true; }
    } else if (this.state === 'ATTACK') {
      this.timer -= dt;
      if (this.timer <= 0) { this.state = 'CHASE'; this.attackActive = false; this.cdTimer = this.cfg.cd; }
    } else if (dist < this.cfg.aggro && !player.dead) {
      this.facing = px < cx ? -1 : 1;
      if (dist <= this.cfg.reach && this.cdTimer <= 0) {
        this.state = 'WINDUP'; this.timer = this.cfg.windup; this.vx = 0;
      } else {
        this.state = 'CHASE'; this.vx = this.facing * this.cfg.speed;
      }
    } else {
      this.state = 'PATROL';
      if (Math.abs(this.x - this.homeX) > 120) this.patrolDir = this.x > this.homeX ? -1 : 1;
      if (this.onWallLeft) this.patrolDir = 1;
      if (this.onWallRight) this.patrolDir = -1;
      this.vx = this.patrolDir * this.cfg.speed * 0.5;
      this.facing = this.patrolDir;
    }

    moveAndCollide(this, solids, dt);
  }
}
