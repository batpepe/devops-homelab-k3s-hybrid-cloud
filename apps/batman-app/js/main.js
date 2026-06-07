// main.js
// Entry point: builds the game, runs a fixed-timestep loop, drives the top-level
// state machine (MENU / PLAYING / GAMEOVER), and resolves combat between the player,
// enemies, and gadgets. Simulation updates at a fixed 60Hz; rendering runs every
// animation frame, so physics is identical regardless of display refresh rate.

import { Input } from './input.js';
import { Camera } from './camera.js';
import { makeArena } from './world.js';
import { Player } from './player.js';
import { Enemy } from './enemy.js';
import { Gadgets } from './gadgets.js';
import { Effects } from './render/fx.js';
import { Parallax } from './render/parallax.js';
import { renderWorld } from './render/render.js';
import { Hud } from './hud.js';
import { aabb } from './physics.js';

const canvas = document.getElementById('game');
canvas.width = 960; canvas.height = 540;
const ctx = canvas.getContext('2d');

const input = new Input(canvas);
const hud = new Hud();

let game = newGame();
let mode = 'MENU';

function newGame() {
  const room = makeArena();
  return {
    room,
    player: new Player(room.playerStart),
    enemies: room.spawns.map((s) => new Enemy(s)),
    gadgets: new Gadgets(),
    fx: new Effects(),
    camera: new Camera(canvas.width, canvas.height),
    parallax: new Parallax(canvas.width, canvas.height, room.width),
    input,
    time: 0,
  };
}

function start() { game = newGame(); mode = 'PLAYING'; hud.hideMenus(); }
function gameOver(won) { mode = 'GAMEOVER'; hud.showOver(won ? 'GOTHAM SECURED' : 'YOU FELL'); }

hud.bind(start, start);
hud.showStart();

const DT = 1 / 60;
let acc = 0, last = performance.now();

function frame(now) {
  let elapsed = (now - last) / 1000;
  last = now;
  if (elapsed > 0.25) elapsed = 0.25; // avoid a spiral of death after tab-out
  acc += elapsed;

  // Space / Attack also starts or restarts from a menu
  if (mode !== 'PLAYING' && (input.justPressed('jump') || input.justPressed('attack'))) start();

  while (acc >= DT) {
    if (mode === 'PLAYING') update(DT);
    acc -= DT;
  }

  renderWorld(ctx, game, DT);
  hud.update(game.player);
  input.lateUpdate();
  requestAnimationFrame(frame);
}

function update(dt) {
  const g = game;
  g.time += dt;
  g.player.update(dt, input, g.room, g.enemies, g.gadgets, g.fx, g.camera, g.time);
  if (g.player.justThrewBatarang) g.camera.addShake(2);

  for (const e of g.enemies) e.update(dt, g.player, g.room.platforms);
  g.gadgets.update(dt, g.enemies, g.fx);

  resolveCombat(g);

  g.fx.update(dt);
  g.camera.follow(g.player, g.room, dt);

  if (g.player.dead) gameOver(false);
  else if (g.enemies.every((e) => e.dead)) gameOver(true);
}

function resolveCombat(g) {
  const p = g.player;

  // Batman's blade -> enemies (once per swing via hitSet)
  const ph = p.attackHitbox();
  if (ph) {
    for (const e of g.enemies) {
      if (e.dead || p.hitSet.has(e)) continue;
      if (aabb(ph, e)) {
        e.takeDamage(1); p.hitSet.add(e); p.addCombo();
        g.fx.sparks(e.x + e.w / 2, e.y + e.h * 0.4, '#ffffff', 8);
        g.camera.addShake(4);
      }
    }
  }

  // Enemy strikes -> Batman (parry beats it, dash i-frames ignore it)
  for (const e of g.enemies) {
    if (e.dead) continue;
    const eh = e.attackHitbox();
    if (eh && aabb(eh, p)) {
      if (p.isParryActive()) {
        e.stun();
        g.fx.sparks(p.x + (p.facing > 0 ? p.w : 0), p.y + p.h * 0.4, '#ffd23f', 18);
        g.camera.addShake(8);
        p.invulnTimer = Math.max(p.invulnTimer, 0.2);
      } else if (!p.isInvulnerable()) {
        p.takeDamage(e.cfg.dmg);
        g.camera.addShake(6);
        e.attackActive = false;
      }
    }
  }
}

requestAnimationFrame(frame);
