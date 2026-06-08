// boss.js
// "The Enforcer": a multi-phase mini-boss. Moves: a telegraphed parryable COMBO (parry
// it to stun + open a big damage window), a dashing CHARGE (dash/dodge it), and a jump
// POUND that drops a ground shockwave (jump to avoid). At <= 50% HP it ROARs, summons
// two adds, and speeds up. The sink gives access to audio, fx, the shockwave list, the
// camera (for shake), and addEnemy() for summons.

import { moveAndCollide } from './physics.js';
import { Enemy } from './enemy.js';

export class Boss {
  constructor(x, groundY) {
    this.w = 92; this.h = 120;
    this.x = x; this.y = groundY - this.h;
    this.vx = 0; this.vy = 0;
    this.maxHp = 44; this.hp = this.maxHp;
    this.facing = -1;
    this.state = 'INTRO'; this.timer = 1.2;
    this.cd = 0; this.hurtTimer = 0; this.stunTimer = 0;
    this.phase = 1; this.dead = false;
    this.attackActive = false; this.comboCount = 0;
    this.onGround = false; this.onWallLeft = false; this.onWallRight = false;
  }

  get hpFrac() { return Math.max(0, this.hp / this.maxHp); }
  stun() { this.state = 'STUNNED'; this.stunTimer = 2.4; this.attackActive = false; this.vx = 0; }
  takeDamage(n) { this.hp -= n; this.hurtTimer = 0.1; if (this.hp <= 0) { this.hp = 0; this.dead = true; } }

  attackHitbox() {
    if (!this.attackActive) return null;
    const r = 92;
    return { x: this.facing > 0 ? this.x + this.w * 0.4 : this.x + this.w * 0.6 - r, y: this.y + this.h * 0.2, w: r, h: this.h * 0.6 };
  }
  isComboAttack() { return this.state === 'COMBO'; }

  update(dt, player, solids, sink) {
    if (this.dead) return;
    this.vy = Math.min(this.vy + 1500 * dt, 1300);
    if (this.hurtTimer > 0) this.hurtTimer -= dt;
    if (this.cd > 0) this.cd -= dt;

    const px = player.x + player.w / 2, cx = this.x + this.w / 2, dist = Math.abs(px - cx);

    if (this.phase === 1 && this.hp <= this.maxHp * 0.5) {
      this.phase = 2; this.state = 'ROAR'; this.timer = 1.0; this.cd = 0.5; this.attackActive = false;
      sink.audio.bossRoar(); sink.camera.addShake(10);
    }

    switch (this.state) {
      case 'INTRO': this.vx = 0; this.timer -= dt; if (this.timer <= 0) this.state = 'CHASE'; break;
      case 'ROAR': this.vx = 0; this.timer -= dt; if (this.timer <= 0) this.state = 'SUMMON'; break;
      case 'SUMMON':
        sink.addEnemy(new Enemy({ x: this.x - 120, y: solids[0].y, type: 'thrower' }));
        sink.addEnemy(new Enemy({ x: this.x + this.w + 120, y: solids[0].y, type: 'blade' }));
        this.state = 'CHASE'; this.cd = 1.0; break;
      case 'STUNNED': this.vx = 0; this.stunTimer -= dt; if (this.stunTimer <= 0) this.state = 'CHASE'; break;
      case 'CHASE': {
        this.facing = px < cx ? -1 : 1;
        if (this.cd <= 0 && dist < 540) {
          const r = Math.random();
          if (dist > 250 && r < 0.55) { this.state = 'CHARGE_TELE'; this.timer = 0.6; }
          else if (r < 0.4) { this.state = 'POUND_TELE'; this.timer = 0.7; }
          else { this.state = 'COMBO_TELE'; this.timer = this.phase === 2 ? 0.45 : 0.6; }
          this.vx = 0;
        } else if (dist > 120) this.vx = this.facing * (this.phase === 2 ? 150 : 110);
        else this.vx = 0;
        break;
      }
      case 'COMBO_TELE': this.vx = 0; this.timer -= dt; this.facing = px < cx ? -1 : 1;
        if (this.timer <= 0) { this.state = 'COMBO'; this.timer = 0.16; this.attackActive = true; this.comboCount = 1; } break;
      case 'COMBO': this.timer -= dt; this.vx = this.facing * 50;
        if (this.timer <= 0) {
          this.attackActive = false;
          if (this.comboCount < (this.phase === 2 ? 3 : 2)) { this.comboCount++; this.state = 'COMBO_GAP'; this.timer = 0.18; }
          else { this.state = 'CHASE'; this.cd = this.phase === 2 ? 0.8 : 1.2; }
        } break;
      case 'COMBO_GAP': this.vx = 0; this.timer -= dt;
        if (this.timer <= 0) { this.state = 'COMBO'; this.timer = 0.16; this.attackActive = true; } break;
      case 'CHARGE_TELE': this.vx = 0; this.timer -= dt; this.facing = px < cx ? -1 : 1;
        if (this.timer <= 0) { this.state = 'CHARGE'; this.timer = 0.6; this.vx = this.facing * 640; this.attackActive = true; } break;
      case 'CHARGE': this.timer -= dt;
        if (this.onWallLeft || this.onWallRight) this.timer = 0;
        if (this.timer <= 0) { this.attackActive = false; this.vx = 0; this.state = 'CHASE'; this.cd = 1.0; } break;
      case 'POUND_TELE': this.vx = 0; this.timer -= dt; this.facing = px < cx ? -1 : 1;
        if (this.timer <= 0) { this.state = 'POUND_UP'; this.vy = -760; this.timer = 0.55; } break;
      case 'POUND_UP': this.timer -= dt; this.vx = (px - cx) * 1.1;
        if (this.timer <= 0 || this.vy > 0) { this.state = 'POUND_DOWN'; this.vy = 1500; } break;
      case 'POUND_DOWN': this.vx = 0;
        if (this.onGround) {
          sink.shockwaves.push({ x: cx, y: solids[0].y, r: 20, maxR: 380, life: 0.5, max: 0.5, hit: false });
          sink.audio.boom(); sink.camera.addShake(14);
          this.state = 'CHASE'; this.cd = 1.2;
        } break;
    }

    moveAndCollide(this, solids, dt);
  }
}
