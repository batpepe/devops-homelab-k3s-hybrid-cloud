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

export const ROOMS = { arena: makeArena };
