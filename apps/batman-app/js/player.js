// player.js
// Batman: a state machine over a small physics body. Owns the full move set (run,
// double jump, wall slide, dash with i-frames), a 3-hit melee combo, a timed parry,
// and gadget triggers. Coyote time + a jump buffer keep control forgiving. Audio is
// triggered here at the moment each action fires (jump/dash/batarang/land).

import { moveAndCollide } from './physics.js';
import { findGrappleTarget } from './gadgets.js';

const RUN = 240, JUMP = 470, GRAV = 1500, MAX_FALL = 900;
const WALL_SLIDE = 120, WALL_JUMP_X = 300;
const DASH_SPEED = 620, DASH_TIME = 0.18, DASH_CD = 0.55;
const ATTACK_DUR = 0.26, COMBO_WINDOW = 0.45;
const PARRY_ACTIVE = 0.20, PARRY_TOTAL = 0.42, PARRY_CD = 0.25;
const BATARANG_CD = 0.7, GRAPPLE_CD = 0.6, HURT_INVULN = 0.8;
const MAX_HEALTH = 5, COYOTE = 0.1, JUMP_BUF = 0.12;
const ATTACK_BUF = 0.16, PARRY_BUF = 0.16; // forgiveness: presses landed mid-swing or mid-hitstop still fire

export class Player {
  constructor(start) { this.w = 44; this.h = 70; this.reset(start); }

  reset(start) {
    this.x = start.x; this.y = start.y;
    this.vx = 0; this.vy = 0; this.facing = 1;
    this.state = 'IDLE';
    this.onGround = false; this.onWallLeft = false; this.onWallRight = false;
    this.health = MAX_HEALTH; this.maxHealth = MAX_HEALTH;
    this.jumps = 0; this.coyote = 0; this.jumpBuf = 0;
    this.dashTimer = 0; this.dashCd = 0; this.invulnTimer = 0;
    this.attackTimer = 0; this.attackDur = ATTACK_DUR; this.attackHit = false;
    this.comboStep = 0; this.comboTimer = 0; this.hitSet = new Set();
    this.attackBuf = 0; this.parryBuf = 0;
    this.parryTimer = 0; this.parryCd = 0;
    this.batarangCd = 0; this.grappleCd = 0; this.grappleTimer = 0; this.grappleTarget = null;
    this.combo = 0; this.comboDecay = 0;
    this.dead = false; this.trail = [];
    this.justThrewBatarang = false;
    this._wasGround = false;
  }

  get dashCdFrac() { return Math.max(0, this.dashCd / DASH_CD); }
  get batarangCdFrac() { return Math.max(0, this.batarangCd / BATARANG_CD); }
  isParryActive() { return this.state === 'PARRY' && this.parryTimer > PARRY_TOTAL - PARRY_ACTIVE; }
  isInvulnerable() { return this.invulnTimer > 0; }

  attackHitbox() {
    if (this.state !== 'ATTACK' || !this.attackHit) return null;
    const reach = 52 + this.comboStep * 6;
    return { x: this.facing > 0 ? this.x + this.w : this.x - reach, y: this.y + this.h * 0.2, w: reach, h: this.h * 0.6 };
  }

  takeDamage(n) {
    if (this.invulnTimer > 0 || this.dead) return;
    this.health -= n; this.invulnTimer = HURT_INVULN;
    this.combo = 0; this.comboDecay = 0;
    this.vx = -this.facing * 200; this.vy = -180;
    this.state = 'HURT';
    if (this.health <= 0) { this.health = 0; this.dead = true; this.state = 'DEAD'; }
  }

  addCombo() { this.combo++; this.comboDecay = 1.5; }

  update(dt, input, room, enemies, gadgets, fx, camera, time, audio) {
    this.justThrewBatarang = false;

    if (this.dead) {
      this.vy = Math.min(this.vy + GRAV * dt, MAX_FALL);
      moveAndCollide(this, room.solids, dt);
      return;
    }

    for (const k of ['dashCd', 'invulnTimer', 'parryCd', 'batarangCd', 'grappleCd', 'coyote', 'jumpBuf', 'attackBuf', 'parryBuf']) if (this[k] > 0) this[k] -= dt;
    if (this.comboDecay > 0) { this.comboDecay -= dt; if (this.comboDecay <= 0) this.combo = 0; }

    const locked = this.state === 'DASH' || this.state === 'ATTACK' || this.state === 'PARRY' || this.grappleTimer > 0;

    const mx = input.moveX;
    if (!locked) { if (mx !== 0) { this.vx = mx * RUN; this.facing = mx; } else this.vx *= 0.8; }
    else if (this.onGround && this.state !== 'DASH') this.vx *= 0.85;

    if (this.grappleTimer <= 0 && this.state !== 'DASH') this.vy = Math.min(this.vy + GRAV * dt, MAX_FALL);

    if (input.justPressed('jump')) this.jumpBuf = JUMP_BUF;
    const onWall = (this.onWallLeft || this.onWallRight) && !this.onGround;
    if (this.jumpBuf > 0) {
      if (this.onGround || this.coyote > 0) { this.vy = -JUMP; this.jumps = 1; this.jumpBuf = 0; this.coyote = 0; if (audio) audio.jump(); }
      else if (onWall) { const away = this.onWallLeft ? 1 : -1; this.vx = away * WALL_JUMP_X; this.vy = -JUMP; this.facing = away; this.jumps = 1; this.jumpBuf = 0; if (audio) audio.jump(); }
      else if (this.jumps < 2) { this.vy = -JUMP * 0.92; this.jumps++; this.jumpBuf = 0; fx.burst(this.x + this.w / 2, this.y + this.h, '#3fb7ff', 6); if (audio) audio.jump(); }
    }

    if (input.justPressed('dash') && this.dashCd <= 0 && this.state !== 'DASH') {
      const dir = mx !== 0 ? mx : this.facing;
      this.state = 'DASH'; this.dashTimer = DASH_TIME; this.dashCd = DASH_CD;
      this.invulnTimer = DASH_TIME + 0.04; this.facing = dir; this.vx = dir * DASH_SPEED; this.vy = 0;
      if (audio) audio.dash();
    }
    if (this.state === 'DASH') { this.dashTimer -= dt; this.trail.push({ x: this.x, y: this.y, life: 0.3 }); if (this.dashTimer <= 0) this.state = 'FALL'; }

    if (input.justPressed('parry')) this.parryBuf = PARRY_BUF;
    if (this.parryBuf > 0 && this.parryCd <= 0 && !locked) {
      this.parryBuf = 0;
      this.state = 'PARRY'; this.parryTimer = PARRY_TOTAL; this.parryCd = PARRY_TOTAL + PARRY_CD; this.vx = 0;
    }
    if (this.state === 'PARRY' && (this.parryTimer -= dt) <= 0) this.state = 'IDLE';

    const canAttack = ['IDLE', 'RUN', 'JUMP', 'FALL'].includes(this.state) || (this.state === 'ATTACK' && this.attackTimer < ATTACK_DUR * 0.5);
    if (input.justPressed('attack')) this.attackBuf = ATTACK_BUF;
    if (this.attackBuf > 0 && canAttack) {
      this.attackBuf = 0;
      this.comboStep = this.comboTimer > 0 ? Math.min(3, this.comboStep + 1) : 1;
      this.state = 'ATTACK'; this.attackTimer = ATTACK_DUR; this.comboTimer = COMBO_WINDOW;
      this.attackHit = true; this.hitSet.clear();
      if (this.onGround) this.vx += this.facing * 60;
    }
    if (this.state === 'ATTACK') {
      this.attackTimer -= dt;
      if (this.attackTimer < ATTACK_DUR * 0.4) this.attackHit = false;
      if (this.attackTimer <= 0) this.state = this.onGround ? 'IDLE' : 'FALL';
    }
    if (this.comboTimer > 0 && (this.comboTimer -= dt) <= 0) this.comboStep = 0;

    if (input.justPressed('batarang') && this.batarangCd <= 0) { gadgets.throwBatarang(this); this.batarangCd = BATARANG_CD; this.justThrewBatarang = true; if (audio) audio.batarang(); }
    if (input.justPressed('grapple') && this.grappleCd <= 0 && this.grappleTimer <= 0) {
      const target = findGrappleTarget(this, room, enemies);
      if (target) {
        this.grappleCd = GRAPPLE_CD;
        if (target.kind === 'anchor') { this.grappleTarget = target; this.grappleTimer = 0.32; }
        else { const e = target.enemy; e.vx = this.x > e.x ? 520 : -520; fx.sparks(e.x + e.w / 2, e.y + e.h / 2, '#ffd23f', 8); }
      }
    }
    if (this.grappleTimer > 0 && this.grappleTarget) {
      this.grappleTimer -= dt;
      this.vx = (this.grappleTarget.x - (this.x + this.w / 2)) * 6;
      this.vy = (this.grappleTarget.y - (this.y + this.h / 2)) * 6;
      if (this.grappleTimer <= 0) { this.grappleTarget = null; this.jumps = 1; }
    }

    if (!this.onGround && this.vy > 0 && ((this.onWallLeft && input.held.left) || (this.onWallRight && input.held.right))) {
      this.vy = Math.min(this.vy, WALL_SLIDE);
      if (!locked) this.state = 'WALL_SLIDE';
    }

    for (let i = this.trail.length - 1; i >= 0; i--) if ((this.trail[i].life -= dt) <= 0) this.trail.splice(i, 1);

    const preVy = this.vy;
    moveAndCollide(this, room.solids, dt);
    if (this.x < 0) this.x = 0;
    if (this.x + this.w > room.width) this.x = room.width - this.w;

    // Landing feedback
    if (!this._wasGround && this.onGround && preVy > 320) {
      if (audio) audio.land();
      fx.dust(this.x + this.w / 2, this.y + this.h); camera.addShake(2);
    }
    this._wasGround = this.onGround;

    if (this.onGround) { this.jumps = 0; this.coyote = COYOTE; }

    if (!locked && this.state !== 'WALL_SLIDE' && this.state !== 'HURT') {
      if (!this.onGround) this.state = this.vy < 0 ? 'JUMP' : 'FALL';
      else this.state = Math.abs(this.vx) > 20 ? 'RUN' : 'IDLE';
    }
    if (this.state === 'HURT' && this.onGround && this.invulnTimer < HURT_INVULN - 0.2) this.state = 'IDLE';
  }
}
