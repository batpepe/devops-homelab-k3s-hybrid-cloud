// main.js
// Entry point: builds the game, runs a fixed-timestep loop with HITSTOP (impact freeze),
// drives the MENU/PLAYING/GAMEOVER + wave/objective state machines, and resolves combat
// (with juice + audio) between player, enemies, boss, projectiles, shockwaves, hazards,
// and pickups. The attack-token manager lets only 1-2 enemies attack at once.

import { Input } from './input.js';
import { Camera } from './camera.js';
import { makeArena, makeEndlessWave } from './world.js';
import { Player } from './player.js';
import { Enemy } from './enemy.js';
import { Boss } from './boss.js';
import { Gadgets } from './gadgets.js';
import { Effects } from './render/fx.js';
import { Parallax } from './render/parallax.js';
import { renderWorld } from './render/render.js';
import { Hud } from './hud.js';
import { AudioEngine } from './audio.js';
import { aabb } from './physics.js';

const canvas = document.getElementById('game');
canvas.width = 960; canvas.height = 540;
const ctx = canvas.getContext('2d');

const input = new Input(canvas);
const hud = new Hud();
const audio = new AudioEngine();

let runMode = 'campaign';
let game = newGame(runMode);
let mode = 'MENU';

const BOSS_EVERY = 5;

function newGame(kind) {
  const endless = kind === 'endless';
  const room = makeArena();
  if (endless) room.gate.open = true;
  room.solids = room.platforms.slice();
  const g = {
    room,
    player: new Player(room.playerStart),
    enemies: [],
    gadgets: new Gadgets(),
    fx: new Effects(),
    camera: new Camera(canvas.width, canvas.height),
    parallax: new Parallax(canvas.width, canvas.height, room.width),
    input, audio, time: 0,
    boss: null, enemyProjectiles: [], pickups: [], shockwaves: [],
    hitstop: 0, waveIndex: 0, score: 0, bossScored: false,
    phase: endless ? 'ENDLESS' : 'WAVES',
    endlessWave: 0,
    objective: endless ? 'Wave 1 - survive' : 'Clear the courtyard',
  };
  if (endless) spawnEndless(g);
  else spawnWave(g, 0);
  return g;
}

function spawnWave(g, i) { for (const s of g.room.waves[i]) g.enemies.push(new Enemy(s)); }
function spawnEndless(g) { for (const s of makeEndlessWave(g.endlessWave, g.room, g.player.x)) g.enemies.push(new Enemy(s)); }

function start(kind) { runMode = kind || 'campaign'; audio.ensure(); audio.startMusic(); hud.setMuteLabel(audio.muted); game = newGame(runMode); mode = 'PLAYING'; hud.hideMenus(); }
function gameOver(won) {
  mode = 'GAMEOVER';
  const g = game;
  const text = won ? 'GOTHAM SECURED' : 'YOU FELL';
  const endless = runMode === 'endless';
  const key = endless ? 'batman.best.endless' : 'batman.best.campaign';
  const prev = readBest(key);
  const stats = { mode: runMode, score: g.score, wave: endless ? g.endlessWave : null };
  const beaten = g.score > (prev.score || 0);
  if (beaten) writeBest(key, { score: g.score, wave: stats.wave });
  stats.best = beaten ? g.score : (prev.score || 0);
  stats.bestWave = endless ? (beaten ? g.endlessWave : (prev.wave || 0)) : null;
  stats.newBest = beaten;
  hud.showOver(text, stats);
}

function readBest(key) { try { return JSON.parse(localStorage.getItem(key)) || {}; } catch (e) { return {}; } }
function writeBest(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) { /* private mode */ } }

hud.bind(() => start('campaign'), () => start(runMode), () => { audio.ensure(); hud.setMuteLabel(audio.toggleMute()); }, () => start('endless'));
hud.showStart();
hud.setMuteLabel(audio.muted);
window.addEventListener('keydown', (e) => { if (e.code === 'KeyM') { audio.ensure(); hud.setMuteLabel(audio.toggleMute()); } });

const DT = 1 / 60;
let acc = 0, last = performance.now();

function frame(now) {
  let elapsed = (now - last) / 1000; last = now;
  if (elapsed > 0.25) elapsed = 0.25;
  acc += elapsed;

  if (mode !== 'PLAYING' && (input.justPressed('jump') || input.justPressed('attack'))) start(runMode);

  while (acc >= DT) {
    if (mode === 'PLAYING') { if (game.hitstop > 0) game.hitstop -= DT; else update(DT); }
    acc -= DT;
  }

  renderWorld(ctx, game, DT);
  hud.update(game.player, { bossHpFrac: game.boss && !game.boss.dead ? game.boss.hpFrac : null, objective: game.objective, score: mode === 'PLAYING' ? game.score : null });
  input.lateUpdate();
  requestAnimationFrame(frame);
}

function update(dt) {
  const g = game; g.time += dt;
  if (g.parallax.update(dt)) g.audio.thunder();
  g.room.solids = g.room.gate.open ? g.room.platforms : g.room.platforms.concat(g.room.gate);

  manageTokens(g);
  g.player.update(dt, input, g.room, g.enemies, g.gadgets, g.fx, g.camera, g.time, g.audio);
  if (g.player.justThrewBatarang) g.camera.addShake(2);

  const sink = { enemyProjectiles: g.enemyProjectiles, audio: g.audio, fx: g.fx, camera: g.camera, shockwaves: g.shockwaves, addEnemy: (e) => g.enemies.push(e) };
  for (const e of g.enemies) e.update(dt, g.player, g.room.solids, sink);
  if (g.boss && !g.boss.dead) g.boss.update(dt, g.player, g.room.solids, sink);

  g.gadgets.update(dt, g.enemies, g.fx, g.enemyProjectiles, g.audio, g.boss);
  updateProjectiles(g, dt);
  updateShockwaves(g, dt);
  updatePickups(g, dt);
  resolveCombat(g);
  checkHazards(g);

  if (g.enemies.length > 40) g.enemies = g.enemies.filter((e) => !e.dead);

  g.fx.update(dt);
  g.camera.follow(g.player, g.room, dt);
  progress(g);

  if (g.player.dead) gameOver(false);
}

function manageTokens(g) {
  const live = g.enemies.filter((e) => !e.dead);
  const attacking = live.filter((e) => e.state === 'WINDUP' || e.state === 'ATTACK').length;
  let budget = Math.max(0, 2 - attacking);
  for (const e of live) e.attackAllowed = false;
  const idle = live
    .filter((e) => e.state !== 'WINDUP' && e.state !== 'ATTACK' && e.state !== 'STUNNED' && e.staggerTimer <= 0)
    .sort((a, b) => Math.abs(a.x - g.player.x) - Math.abs(b.x - g.player.x));
  for (const e of idle) { if (budget <= 0) break; e.attackAllowed = true; budget--; }
}

function updateProjectiles(g, dt) {
  const p = g.player;
  for (let i = g.enemyProjectiles.length - 1; i >= 0; i--) {
    const pr = g.enemyProjectiles[i];
    pr.vy += 600 * dt; pr.x += pr.vx * dt; pr.y += pr.vy * dt; pr.life -= dt;
    let rm = false;
    if (pr.deflected) {
      for (const e of g.enemies) { if (e.dead) continue; if (Math.abs(e.x + e.w / 2 - pr.x) < e.w * 0.6 && Math.abs(e.y + e.h / 2 - pr.y) < e.h * 0.6) { e.takeDamage(1, Math.sign(pr.vx)); g.score += 20; g.fx.sparks(pr.x, pr.y, '#3fb7ff', 8); g.audio.enemyHurt(); rm = true; break; } }
      if (!rm && g.boss && !g.boss.dead) { const b = g.boss; if (Math.abs(b.x + b.w / 2 - pr.x) < b.w * 0.6 && Math.abs(b.y + b.h / 2 - pr.y) < b.h * 0.6) { b.takeDamage(1); g.score += 15; g.fx.sparks(pr.x, pr.y, '#3fb7ff', 8); rm = true; } }
    } else if (!p.isInvulnerable() && !p.isParryActive() && Math.abs(p.x + p.w / 2 - pr.x) < p.w * 0.6 && Math.abs(p.y + p.h / 2 - pr.y) < p.h * 0.6) {
      p.takeDamage(1); g.audio.playerHurt(); g.camera.addShake(5); g.fx.setFlash(0.2, '255,60,60'); rm = true;
    }
    if (rm || pr.life <= 0 || pr.x < -60 || pr.x > g.room.width + 60) g.enemyProjectiles.splice(i, 1);
  }
}

function updateShockwaves(g, dt) {
  const p = g.player;
  for (let i = g.shockwaves.length - 1; i >= 0; i--) {
    const s = g.shockwaves[i];
    s.life -= dt; s.r += (s.maxR - s.r) * Math.min(1, dt * 6);
    if (!s.hit && p.onGround && !p.isInvulnerable() && Math.abs(p.x + p.w / 2 - s.x) < s.r) {
      p.takeDamage(1); g.audio.playerHurt(); g.camera.addShake(6); g.fx.setFlash(0.2, '255,60,60'); s.hit = true;
    }
    if (s.life <= 0) g.shockwaves.splice(i, 1);
  }
}

function updatePickups(g, dt) {
  const p = g.player;
  for (let i = g.pickups.length - 1; i >= 0; i--) {
    const pk = g.pickups[i];
    pk.vy += 1200 * dt; pk.y += pk.vy * dt;
    if (pk.y + pk.h >= g.room.groundY) { pk.y = g.room.groundY - pk.h; pk.vy = 0; }
    pk.life -= dt;
    if (aabb(p, pk)) { if (p.health < p.maxHealth) p.health++; g.audio.pickup(); g.fx.burst(pk.x + pk.w / 2, pk.y, '#3fb7ff', 10); g.pickups.splice(i, 1); continue; }
    if (pk.life <= 0) g.pickups.splice(i, 1);
  }
}

function dropPickup(g, e) { g.pickups.push({ x: e.x + e.w / 2 - 9, y: e.y, w: 18, h: 18, vy: -150, life: 9 }); }

function checkHazards(g) {
  const p = g.player;
  if (p.isInvulnerable()) return;
  for (const hz of g.room.hazards) {
    if (aabb(p, hz)) { p.takeDamage(1); g.audio.playerHurt(); g.fx.setFlash(0.25, '255,60,60'); g.camera.addShake(5); break; }
  }
}

function resolveCombat(g) {
  const p = g.player;
  const ph = p.attackHitbox();
  if (ph) {
    for (const e of g.enemies) {
      if (e.dead || p.hitSet.has(e)) continue;
      if (aabb(ph, e)) {
        const mult = Math.min(5, 1 + Math.floor(p.combo / 5));
        const dir = Math.sign((e.x + e.w / 2) - (p.x + p.w / 2)) || p.facing;
        e.takeDamage(1, dir); p.hitSet.add(e); p.addCombo();
        g.score += 10 * mult;
        g.fx.impact(e.x + e.w / 2, e.y + e.h * 0.4); g.audio.hit(); g.audio.enemyHurt();
        g.camera.addShake(4); g.hitstop = Math.max(g.hitstop, 0.045);
        if (e.dead) { g.score += 50 * mult; g.camera.addShake(7); g.hitstop = Math.max(g.hitstop, 0.07); g.fx.burst(e.x + e.w / 2, e.y + e.h * 0.4, '#ff5a4a', 14); if (Math.random() < 0.4) dropPickup(g, e); }
      }
    }
    if (g.boss && !g.boss.dead && !p.hitSet.has(g.boss) && aabb(ph, g.boss)) {
      const mult = Math.min(5, 1 + Math.floor(p.combo / 5));
      g.boss.takeDamage(1); p.hitSet.add(g.boss); p.addCombo();
      g.score += 15 * mult;
      g.fx.impact(g.boss.x + g.boss.w / 2, g.boss.y + g.boss.h * 0.4); g.audio.hit();
      g.camera.addShake(6); g.hitstop = Math.max(g.hitstop, 0.06);
    }
  }

  if (p.isParryActive()) {
    for (const pr of g.enemyProjectiles) {
      if (pr.deflected) continue;
      if (Math.sign(pr.x - (p.x + p.w / 2)) === p.facing && Math.abs(pr.x - (p.x + p.w / 2)) < 70 && Math.abs(pr.y - (p.y + p.h / 2)) < 60) {
        pr.deflected = true; pr.vx = p.facing * Math.max(520, Math.abs(pr.vx)); pr.vy = -120;
        g.audio.parry(); g.fx.sparks(pr.x, pr.y, '#ffd23f', 14); g.hitstop = Math.max(g.hitstop, 0.06);
      }
    }
  }

  for (const e of g.enemies) {
    if (e.dead) continue;
    const eh = e.attackHitbox();
    if (eh && aabb(eh, p)) {
      if (p.isParryActive()) {
        e.stun(); g.score += 30; g.fx.sparks(p.x + (p.facing > 0 ? p.w : 0), p.y + p.h * 0.4, '#ffd23f', 18); g.fx.setFlash(0.3);
        g.audio.parry(); g.camera.addShake(8); g.hitstop = Math.max(g.hitstop, 0.09); p.invulnTimer = Math.max(p.invulnTimer, 0.2);
      } else if (!p.isInvulnerable()) {
        p.takeDamage(e.cfg.dmg); g.audio.playerHurt(); g.fx.setFlash(0.25, '255,60,60');
        g.camera.addShake(6); g.hitstop = Math.max(g.hitstop, 0.05); e.attackActive = false;
      }
    }
  }

  if (g.boss && !g.boss.dead) {
    const bh = g.boss.attackHitbox();
    if (bh && aabb(bh, p)) {
      if (p.isParryActive() && g.boss.isComboAttack()) {
        g.boss.stun(); g.boss.takeDamage(4); g.score += 30; g.fx.sparks(p.x + (p.facing > 0 ? p.w : 0), p.y + p.h * 0.4, '#ffd23f', 24); g.fx.setFlash(0.35);
        g.audio.parry(); g.camera.addShake(12); g.hitstop = Math.max(g.hitstop, 0.12); p.invulnTimer = Math.max(p.invulnTimer, 0.25);
      } else if (!p.isInvulnerable()) {
        p.takeDamage(2); g.audio.playerHurt(); g.fx.setFlash(0.3, '255,60,60');
        g.camera.addShake(9); g.hitstop = Math.max(g.hitstop, 0.06); if (g.boss.isComboAttack()) g.boss.attackActive = false;
      }
    }
  }
}

function progress(g) {
  if (g.phase === 'WAVES') {
    if (g.enemies.every((e) => e.dead)) {
      g.pickups.push({ x: g.player.x + g.player.w / 2 - 9, y: g.player.y - 40, w: 18, h: 18, vy: -150, life: 12 });
      g.waveIndex++;
      if (g.waveIndex < g.room.waves.length) { spawnWave(g, g.waveIndex); g.objective = 'Clear the courtyard'; }
      else { g.room.gate.open = true; g.audio.gate(); g.phase = 'TOBOSS'; g.objective = 'Breach the gate, hunt the Enforcer'; }
    }
  } else if (g.phase === 'TOBOSS') {
    if (g.player.x > g.room.bossTrigger) {
      g.boss = new Boss(g.room.bossSpawn.x, g.room.groundY);
      g.phase = 'BOSS'; g.objective = 'Defeat the Enforcer';
      g.audio.bossRoar(); g.camera.addShake(8);
    }
  } else if (g.phase === 'BOSS') {
    if (g.boss && g.boss.dead) { if (!g.bossScored) { g.score += 500; g.bossScored = true; } g.phase = 'WON'; gameOver(true); }
  } else if (g.phase === 'ENDLESS') {
    if (g.enemies.every((e) => e.dead) && (!g.boss || g.boss.dead)) {
      if (g.boss && g.boss.dead && !g.bossScored) { g.score += 500; g.bossScored = true; }
      g.score += 100 + g.endlessWave * 25;
      g.pickups.push({ x: g.player.x + g.player.w / 2 - 9, y: g.player.y - 40, w: 18, h: 18, vy: -150, life: 12 });
      g.boss = null;
      g.endlessWave++;
      const n = g.endlessWave + 1;
      if (n % BOSS_EVERY === 0) {
        const bx = Math.max(40, Math.min(g.room.width - 92, g.player.x + (g.player.x < g.room.width / 2 ? 700 : -700)));
        g.boss = new Boss(bx, g.room.groundY);
        g.bossScored = false;
        g.objective = 'Wave ' + n + ' - THE ENFORCER';
        g.audio.bossRoar(); g.camera.addShake(8);
      } else {
        spawnEndless(g);
        g.objective = 'Wave ' + n + ' - survive';
      }
    }
  }
}

requestAnimationFrame(frame);
