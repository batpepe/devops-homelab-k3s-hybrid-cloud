// world.js
// Room model + the first hand-built level. A room is plain data so it is cheap to
// rebuild on restart. This level has a courtyard (enemy waves behind a gate) and, past
// the gate, a traversal stretch with hazards leading to the boss arena. main.js drives
// the objective flow off `waves`, `gate`, `bossTrigger`, and `bossSpawn`.

export function makeArena() {
  const width = 3600, height = 600, groundY = height - 60; // 540
  return {
    id: 'arena', width, height, groundY,
    playerStart: { x: 100, y: groundY - 70 },
    platforms: [
      { x: 0, y: groundY, w: width, h: 60 },     // ground
      // courtyard
      { x: 300, y: 430, w: 200, h: 20 },
      { x: 560, y: 330, w: 180, h: 20 },
      { x: 820, y: 420, w: 200, h: 20 },
      { x: 1100, y: 300, w: 180, h: 20 },
      { x: 1330, y: 470, w: 160, h: 20 },
      { x: 980, y: 300, w: 26, h: 240 },          // wall (wall-slide)
      // past the gate
      { x: 1850, y: 460, w: 180, h: 20 },
      { x: 2100, y: 380, w: 180, h: 20 },
      { x: 2350, y: 460, w: 200, h: 20 },
      { x: 2600, y: 360, w: 180, h: 20 },
      { x: 3520, y: 300, w: 26, h: 240 },         // boss arena far wall
    ],
    anchors: [
      { x: 640, y: 250 },
      { x: 1500, y: 280 },
      { x: 2000, y: 270 },
      { x: 2520, y: 290 },
    ],
    hazards: [
      { x: 700, y: groundY - 12, w: 120, h: 12, type: 'electric' },
      { x: 2150, y: groundY - 22, w: 170, h: 22, type: 'spikes' },
    ],
    gate: { x: 1740, y: 240, w: 24, h: groundY - 240, open: false },
    waves: [
      [{ x: 600, y: groundY, type: 'thug' }, { x: 900, y: groundY, type: 'thug' }, { x: 1250, y: groundY, type: 'blade' }],
      [{ x: 700, y: groundY, type: 'thrower' }, { x: 1100, y: groundY, type: 'brute' }, { x: 1430, y: groundY, type: 'thug' }],
    ],
    bossSpawn: { x: 3200, y: groundY },
    bossTrigger: 2780,
    exits: [],
  };
}

// --- Campaign room graph (increment 5) ---
// Each factory returns the same plain-data shape as makeArena plus: `name` (HUD banner),
// `entries` (spawn points keyed by id), `exits` (zones linking to other rooms), `spawns`
// (ambient enemies, first visit only) and `pickupSpawns` (persistent loot, static).
// makeArena stays untouched: survival runs on it and its exits stay [].

export function makeCourtyard() {
  const width = 1600, height = 600, groundY = height - 60;
  return {
    id: 'courtyard', name: 'THE COURTYARD', width, height, groundY,
    platforms: [
      { x: 0, y: groundY, w: width, h: 60 },
      { x: 260, y: 430, w: 180, h: 20 },
      { x: 520, y: 330, w: 170, h: 20 },
      { x: 820, y: 420, w: 190, h: 20 },
      { x: 1120, y: 330, w: 170, h: 20 },
      { x: 980, y: 300, w: 26, h: 240 },          // wall (wall-slide)
    ],
    anchors: [{ x: 640, y: 250 }, { x: 1180, y: 260 }],
    hazards: [{ x: 700, y: groundY - 12, w: 110, h: 12, type: 'electric' }],
    gate: { x: 1460, y: 240, w: 24, h: groundY - 240, open: false },
    waves: [
      [{ x: 600, y: groundY, type: 'thug' }, { x: 880, y: groundY, type: 'thug' }, { x: 1150, y: groundY, type: 'blade' }],
      [{ x: 700, y: groundY, type: 'thrower' }, { x: 1000, y: groundY, type: 'brute' }, { x: 1300, y: groundY, type: 'thug' }],
    ],
    spawns: [],
    entries: {
      start: { x: 100, y: groundY - 70, facing: 1 },
      east: { x: 1500, y: groundY - 70, facing: -1 },
    },
    exits: [{ x: 1564, y: 380, w: 36, h: 160, to: 'skybridge', entry: 'west' }],
  };
}

export function makeSkybridge() {
  const width = 2200, height = 600, groundY = height - 60;
  return {
    id: 'skybridge', name: 'THE SKYBRIDGE', width, height, groundY,
    platforms: [
      { x: 0, y: groundY, w: width, h: 60 },
      // Ceiling slab: blocks jumping over the spike corridor; the anchor chain runs under it.
      { x: 380, y: 380, w: 1440, h: 20 },
    ],
    // Chain spacing 300 < grapple range 380; grapple end refunds one air jump (player.js)
    // which bridges the 0.6s grapple cooldown to the next beacon.
    anchors: [
      { x: 540, y: 440 }, { x: 840, y: 440 }, { x: 1140, y: 440 },
      { x: 1440, y: 440 }, { x: 1740, y: 440 },
    ],
    // Three spike strips with two safe islands under beacons 2 and 4: falling costs one
    // hit at most before a re-grapple from the ground, so the gate cannot softlock.
    hazards: [
      { x: 400, y: groundY - 22, w: 380, h: 22, type: 'spikes' },
      { x: 900, y: groundY - 22, w: 480, h: 22, type: 'spikes' },
      { x: 1500, y: groundY - 22, w: 300, h: 22, type: 'spikes' },
    ],
    spawns: [],
    entries: {
      west: { x: 90, y: groundY - 70, facing: 1 },
      east: { x: 2074, y: groundY - 70, facing: -1 },
    },
    exits: [
      { x: 0, y: 380, w: 36, h: 160, to: 'courtyard', entry: 'east' },
      { x: 2164, y: 380, w: 36, h: 160, to: 'undercroft', entry: 'west' },
    ],
  };
}

export function makeUndercroft() {
  const width = 1800, height = 600, groundY = height - 60;
  return {
    id: 'undercroft', name: 'THE UNDERCROFT', width, height, groundY,
    platforms: [
      { x: 0, y: groundY, w: width, h: 60 },
      { x: 300, y: 440, w: 200, h: 20 },
      { x: 620, y: 360, w: 180, h: 20 },
      { x: 920, y: 450, w: 200, h: 20 },
      { x: 1240, y: 360, w: 180, h: 20 },
      // Loot alcove: floor at 180 is above double-jump reach from the 360 platform
      // (~135px of lift), so the only way up is the anchor at (1560, 120).
      { x: 1480, y: 180, w: 180, h: 20 },
    ],
    anchors: [{ x: 700, y: 250 }, { x: 1560, y: 120 }],
    hazards: [
      { x: 700, y: groundY - 22, w: 140, h: 22, type: 'spikes' },
      { x: 1150, y: groundY - 12, w: 120, h: 12, type: 'electric' },
    ],
    spawns: [
      { x: 500, y: groundY, type: 'brute' },
      { x: 800, y: groundY, type: 'blade' },
      { x: 950, y: groundY, type: 'thug' },
      { x: 1100, y: groundY, type: 'blade' },
      { x: 1500, y: groundY, type: 'thrower' },
    ],
    pickupSpawns: [{ x: 1530, y: 150 }, { x: 1590, y: 150 }],
    entries: {
      west: { x: 90, y: groundY - 70, facing: 1 },
      east: { x: 1674, y: groundY - 70, facing: -1 },
    },
    exits: [
      { x: 0, y: 380, w: 36, h: 160, to: 'skybridge', entry: 'east' },
      { x: 1764, y: 380, w: 36, h: 160, to: 'enforcerHall', entry: 'west' },
    ],
  };
}

export function makeEnforcerHall() {
  const width = 1400, height = 600, groundY = height - 60;
  return {
    id: 'enforcerHall', name: "THE ENFORCER'S HALL", width, height, groundY,
    platforms: [
      { x: 0, y: groundY, w: width, h: 60 },
      { x: 220, y: 420, w: 160, h: 20 },
      { x: 1020, y: 420, w: 160, h: 20 },
      { x: 1374, y: 300, w: 26, h: 240 },         // east wall (stops boss charges)
    ],
    anchors: [{ x: 350, y: 240 }, { x: 1050, y: 240 }],
    hazards: [],
    spawns: [],
    // Open on entry; progress() slams it shut when the boss wakes (locks the duel).
    gate: { x: 60, y: 240, w: 24, h: groundY - 240, open: true },
    bossSpawn: { x: 1000, y: groundY },
    bossTrigger: 520,
    entries: { west: { x: 100, y: groundY - 70, facing: 1 } },
    exits: [{ x: 0, y: 380, w: 36, h: 160, to: 'undercroft', entry: 'east' }],
  };
}

export const ROOMS = {
  arena: makeArena,
  courtyard: makeCourtyard,
  skybridge: makeSkybridge,
  undercroft: makeUndercroft,
  enforcerHall: makeEnforcerHall,
};

export const CAMPAIGN_START = 'courtyard';

// Pure consistency check for the graph; main.js runs it at boot and logs errors to the
// console, which the smoke tests treat as failures. Also imported directly by tests.
export function validateRoomGraph(ids = Object.keys(ROOMS)) {
  const errors = [];
  const rooms = {};
  for (const id of ids) rooms[id] = ROOMS[id]();
  const box = (e) => ({ x: e.x, y: e.y, w: 44, h: 70 });
  const hits = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  for (const id of ids) {
    const r = rooms[id];
    for (const k of ['anchors', 'hazards', 'exits']) {
      if (!Array.isArray(r[k])) errors.push(`${id}: ${k} must be an array`);
    }
    if (r.bossTrigger != null && !r.bossSpawn) errors.push(`${id}: bossTrigger without bossSpawn`);
    for (const ex of r.exits || []) {
      if (ex.x < 0 || ex.y < 0 || ex.x + ex.w > r.width || ex.y + ex.h > r.height) {
        errors.push(`${id}: exit to ${ex.to} lies outside room bounds`);
      }
      const target = rooms[ex.to] || (ROOMS[ex.to] && (rooms[ex.to] = ROOMS[ex.to]()));
      if (!target) { errors.push(`${id}: exit targets unknown room ${ex.to}`); continue; }
      if (!target.entries || !target.entries[ex.entry]) {
        errors.push(`${id}: exit targets missing entry ${ex.to}.${ex.entry}`);
      }
    }
    for (const [eid, en] of Object.entries(r.entries || {})) {
      for (const ex of r.exits || []) {
        if (hits(box(en), ex)) errors.push(`${id}: entry ${eid} overlaps an exit zone (transition ping-pong)`);
      }
    }
  }
  return errors;
}

// Procedural survival wave: a pure function of the wave index. Count and type mix harden
// with `i`; enemies spawn offscreen on either side of the player, clamped to the arena.
// Same {x, y, type} shape Enemy consumes (enemy.js). All numbers are tunable.
export function makeEndlessWave(i, room, playerX) {
  const count = Math.min(8, 3 + Math.floor(i * 0.7));
  // weighted type table, hardening with i
  let pool;
  if (i < 3) pool = ['thug', 'thug', 'blade'];
  else if (i < 6) pool = ['thug', 'blade', 'blade', 'thrower', 'brute'];
  else pool = ['blade', 'thrower', 'brute', 'brute', 'thug'];

  const spawns = [];
  for (let k = 0; k < count; k++) {
    const side = k % 2 === 0 ? -1 : 1; // alternate sides of the player
    const dist = 600 + Math.random() * 300;
    const x = Math.max(40, Math.min(room.width - 60, playerX + side * dist));
    const type = pool[Math.floor(Math.random() * pool.length)];
    spawns.push({ x, y: room.groundY, type });
  }
  return spawns;
}
