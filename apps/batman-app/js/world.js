// world.js
// Room model + the first playable arena. A room is plain data, so it is cheap to
// rebuild on restart and so more rooms drop into ROOMS for Increment 2 (transitions).
// A room: { width, height, playerStart, platforms[], anchors[], spawns[], exits[] }.

export function makeArena() {
  const width = 2600, height = 540;
  const groundY = height - 60;
  return {
    id: 'arena',
    width, height, groundY,
    playerStart: { x: 120, y: groundY - 70 },
    platforms: [
      { x: 0, y: groundY, w: width, h: 60 },          // ground
      { x: 360, y: groundY - 130, w: 220, h: 24 },
      { x: 720, y: groundY - 240, w: 200, h: 24 },
      { x: 1040, y: groundY - 150, w: 240, h: 24 },
      { x: 1420, y: groundY - 280, w: 180, h: 24 },
      { x: 1700, y: groundY - 160, w: 220, h: 24 },
      { x: 2080, y: groundY - 250, w: 260, h: 24 },
      { x: 980, y: groundY - 360, w: 28, h: 230 },     // tall walls for wall-slide
      { x: 1640, y: groundY - 420, w: 28, h: 300 },
    ],
    anchors: [
      { x: 840, y: groundY - 360 },
      { x: 1520, y: groundY - 400 },
      { x: 2180, y: groundY - 380 },
    ],
    spawns: [
      { x: 700, y: groundY, type: 'thug' },
      { x: 1150, y: groundY, type: 'brute' },
      { x: 1780, y: groundY, type: 'thug' },
      { x: 2260, y: groundY, type: 'thug' },
    ],
    exits: [], // Increment 2: doors to neighbouring rooms
  };
}

export const ROOMS = { arena: makeArena };
