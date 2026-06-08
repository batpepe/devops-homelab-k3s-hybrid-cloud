// enemy.js
// Melee + ranged enemies with a visible attack windup (the parry tell). Types: thug
// (baseline), brute (slow heavy), blade (fast, short tell), thrower (ranged, keeps
// distance and lobs a deflectable projectile). Attacks are gated by `attackAllowed`,
// which main.js grants to only 1-2 enemies at a time (turn-taking AI), and a hit causes
// a brief stagger + knockback. A successful player parry calls stun().

import { moveAndCollide } from './physics.js';

const TYPES = {
  thug:    { w: 40, h: 64, hp: 3, speed: 95,  aggro: 330, windup: 0.55, reach: 56, dmg: 1, cd: 1.2, ranged: false },
  brute:   { w: 56, h: 80, hp: 6, speed: 60,  aggro: 360, windup: 0.95, reach: 70, dmg: 2, cd: 1.7, ranged: false },
  blade:   { w: 36, h: 60, hp: 2, speed: 150, aggro: 360, windup: 0.32, reach: 52, dmg: 1, cd: 0.9, ranged: false },
  thrower: { w: 42, h: 66, hp: 2, speed: 70,  aggro: 560, windup: 0.5,  reach: 0,  dmg: 1, cd: 1.8, ranged: true, range: 360, keep: 230 },
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
    this.timer = 0; this.cdTimer = Math.random() * 0.6;
    this.hurtTimer = 0; this.stunTimer = 0; this.staggerTimer = 0;
    this.attackActive = false; this.dead = false;
    this.onGround = false; this.onWallLeft = false; this.onWallRight = false;
    this.attackAllowed = false;
    this.walk = 0;
  }

  stun() { this.state = 'STUNNED'; this.stunTimer = 2.2; this.attackActive = false; this.vx = 0; }

  takeDamage(n, kbDir = 0) {
    this.hp -= n; this.hurtTimer = 0.12; this.staggerTimer = 0.22;
    if (kbDir) this.vx = kbDir * 260;
    this.attackActive = false;
    if (this.hp <= 0) this.dead = true;
  }

  attackHitbox() {
    if (!this.attackActive) return null;
    const r = this.cfg.reach;
    return { x: this.facing > 0 ? this.x + this.w : this.x - r, y: this.y + this.h * 0.3, w: r, h: this.h * 0.5 };
  }

  isTelegraphing() { return this.state === 'WINDUP'; }

  update(dt, player, solids, sink) {
    if (this.dead) return;
    this.vy = Math.min(this.vy + 1500 * dt, 1000);
    if (this.hurtTimer > 0) this.hurtTimer -= dt;
    if (this.cdTimer > 0) this.cdTimer -= dt;

    // Stagger: knocked back, briefly cannot act
    if (this.staggerTimer > 0) {
      this.staggerTimer -= dt; this.vx *= 0.85;
      moveAndCollide(this, solids, dt); this.walk += Math.abs(this.vx) * dt * 0.02;
      return;
    }

    const px = player.x + player.w / 2, cx = this.x + this.w / 2, dist = Math.abs(px - cx);

    if (this.state === 'STUNNED') {
      this.vx = 0; this.stunTimer -= dt; if (this.stunTimer <= 0) this.state = 'PATROL';
    } else if (this.state === 'WINDUP') {
      this.vx = 0; this.timer -= dt; this.facing = px < cx ? -1 : 1;
      if (this.timer <= 0) {
        if (this.cfg.ranged) {
          const dir = this.facing;
          sink.enemyProjectiles.push({ x: cx + dir * 20, y: this.y + this.h * 0.4, vx: dir * 380, vy: -120, life: 2.4, deflected: false });
          sink.audio.batarang();
          this.state = 'CHASE'; this.cdTimer = this.cfg.cd;
        } else {
          this.state = 'ATTACK'; this.timer = 0.18; this.attackActive = true;
        }
      }
    } else if (this.state === 'ATTACK') {
      this.timer -= dt;
      if (this.timer <= 0) { this.state = 'CHASE'; this.attackActive = false; this.cdTimer = this.cfg.cd; }
    } else if (dist < this.cfg.aggro && !player.dead) {
      this.state = 'CHASE';
      this.facing = px < cx ? -1 : 1;
      if (this.cfg.ranged) {
        if (dist < this.cfg.keep) this.vx = -this.facing * this.cfg.speed;      // back off
        else if (dist > this.cfg.range) this.vx = this.facing * this.cfg.speed; // approach
        else this.vx = 0;
        if (dist <= this.cfg.range && this.cdTimer <= 0 && this.attackAllowed) { this.state = 'WINDUP'; this.timer = this.cfg.windup; }
      } else {
        if (dist <= this.cfg.reach && this.cdTimer <= 0 && this.attackAllowed) { this.state = 'WINDUP'; this.timer = this.cfg.windup; this.vx = 0; }
        else if (dist <= this.cfg.reach + 40 && !this.attackAllowed) this.vx = -this.facing * this.cfg.speed * 0.4; // keep spacing without a token
        else this.vx = this.facing * this.cfg.speed;
      }
    } else {
      this.state = 'PATROL';
      if (Math.abs(this.x - this.homeX) > 120) this.patrolDir = this.x > this.homeX ? -1 : 1;
      if (this.onWallLeft) this.patrolDir = 1;
      if (this.onWallRight) this.patrolDir = -1;
      this.vx = this.patrolDir * this.cfg.speed * 0.5; this.facing = this.patrolDir;
    }

    moveAndCollide(this, solids, dt);
    this.walk += Math.abs(this.vx) * dt * 0.02;
  }
}
