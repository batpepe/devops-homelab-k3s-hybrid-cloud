// input.js
// Unified cross-platform input. Keyboard, mouse, and multi-touch all feed one set of
// game "actions". Movement is read as held state (input.held / input.moveX); one-shot
// actions (jump/attack/parry/dash/gadgets) are edge-triggered via justPressed(), which
// main.js clears at frame end with lateUpdate(). Touch tracks each finger by id, so
// move + attack at the same time works (true multi-touch).

const KEY_MAP = {
  ArrowLeft: 'left', KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right',
  ArrowUp: 'up', KeyW: 'up',
  ArrowDown: 'down', KeyS: 'down',
  Space: 'jump',
  KeyJ: 'attack',
  KeyK: 'parry',
  ShiftLeft: 'dash', ShiftRight: 'dash',
  KeyQ: 'batarang',
  KeyE: 'grapple',
};
const ACTIONS = ['left', 'right', 'up', 'down', 'jump', 'attack', 'parry', 'dash', 'batarang', 'grapple'];
const NO_SCROLL = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space'];

export class Input {
  constructor(canvas) {
    this.canvas = canvas;
    this.held = {};
    this.pressed = new Set();
    ACTIONS.forEach(a => (this.held[a] = false));

    this.usingTouch = false;
    this.touches = new Map(); // touchId -> { control, action? }
    this.joystick = { active: false, baseX: 0, baseY: 0, knobX: 0, knobY: 0, radius: 75, dead: 18 };

    this._layout();
    this._bindKeyboard();
    this._bindMouse();
    this._bindTouch();
  }

  _press(a) { if (!this.held[a]) this.pressed.add(a); this.held[a] = true; }
  _release(a) { this.held[a] = false; }

  justPressed(a) { return this.pressed.has(a); }
  get moveX() { return (this.held.right ? 1 : 0) - (this.held.left ? 1 : 0); }
  lateUpdate() { this.pressed.clear(); }

  _layout() {
    const W = this.canvas.width, H = this.canvas.height;
    // Joystick floats to the first touch in the left half; this is its resting/hint spot.
    this.joystick.restX = 130; this.joystick.restY = H - 120;
    this.joystick.baseX = this.joystick.restX; this.joystick.baseY = this.joystick.restY;
    this.joystick.knobX = this.joystick.baseX; this.joystick.knobY = this.joystick.baseY;
    // Spaced so fat fingers don't trigger neighbours (no overlapping hit circles).
    this.buttons = [
      { action: 'jump', label: 'JUMP', x: W - 85, y: H - 85, r: 48 },
      { action: 'attack', label: 'ATK', x: W - 185, y: H - 110, r: 44 },
      { action: 'dash', label: 'DSH', x: W - 280, y: H - 95, r: 40 },
      { action: 'parry', label: 'PRY', x: W - 120, y: H - 200, r: 40 },
      { action: 'batarang', label: 'BTR', x: W - 235, y: H - 205, r: 36 },
      { action: 'grapple', label: 'GRP', x: W - 330, y: H - 185, r: 36 },
    ];
  }

  _bindKeyboard() {
    window.addEventListener('keydown', (e) => {
      const a = KEY_MAP[e.code];
      if (!a) return;
      if (NO_SCROLL.includes(e.code)) e.preventDefault();
      if (e.repeat) return;
      this._press(a);
    });
    window.addEventListener('keyup', (e) => {
      const a = KEY_MAP[e.code];
      if (a) this._release(a);
    });
  }

  _bindMouse() {
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    this.canvas.addEventListener('mousedown', (e) => {
      if (e.button === 0) this._press('attack');
      else if (e.button === 2) this._press('parry');
    });
    window.addEventListener('mouseup', (e) => {
      if (e.button === 0) this._release('attack');
      else if (e.button === 2) this._release('parry');
    });
  }

  _bindTouch() {
    const o = { passive: false };
    this.canvas.addEventListener('touchstart', (e) => this._touchStart(e), o);
    this.canvas.addEventListener('touchmove', (e) => this._touchMove(e), o);
    this.canvas.addEventListener('touchend', (e) => this._touchEnd(e), o);
    this.canvas.addEventListener('touchcancel', (e) => this._touchEnd(e), o);
  }

  _toCanvas(t) {
    const r = this.canvas.getBoundingClientRect();
    return {
      x: (t.clientX - r.left) * (this.canvas.width / r.width),
      y: (t.clientY - r.top) * (this.canvas.height / r.height),
    };
  }

  _hitButton(p) {
    for (const b of this.buttons) {
      const dx = p.x - b.x, dy = p.y - b.y;
      if (dx * dx + dy * dy <= b.r * b.r) return b;
    }
    return null;
  }

  _touchStart(e) {
    e.preventDefault();
    this.usingTouch = true;
    for (const t of e.changedTouches) {
      const p = this._toCanvas(t);
      const btn = this._hitButton(p);
      if (btn) {
        this.touches.set(t.identifier, { control: 'button', action: btn.action });
        this._press(btn.action);
      } else if (p.x < this.canvas.width * 0.5) {
        this.touches.set(t.identifier, { control: 'joystick' });
        this.joystick.active = true;
        this.joystick.baseX = p.x; this.joystick.baseY = p.y; // float the stick to the thumb
        this._updateJoystick(p);
      }
    }
  }

  _touchMove(e) {
    e.preventDefault();
    for (const t of e.changedTouches) {
      const rec = this.touches.get(t.identifier);
      if (rec && rec.control === 'joystick') this._updateJoystick(this._toCanvas(t));
    }
  }

  _touchEnd(e) {
    e.preventDefault();
    for (const t of e.changedTouches) {
      const rec = this.touches.get(t.identifier);
      if (!rec) continue;
      if (rec.control === 'button') this._release(rec.action);
      else {
        this.joystick.active = false;
        this.joystick.baseX = this.joystick.restX; this.joystick.baseY = this.joystick.restY;
        this.joystick.knobX = this.joystick.baseX;
        this.joystick.knobY = this.joystick.baseY;
        this._release('left'); this._release('right'); this._release('up'); this._release('down');
      }
      this.touches.delete(t.identifier);
    }
  }

  _updateJoystick(p) {
    let dx = p.x - this.joystick.baseX, dy = p.y - this.joystick.baseY;
    const dist = Math.hypot(dx, dy), max = this.joystick.radius;
    if (dist > max) { dx = (dx / dist) * max; dy = (dy / dist) * max; }
    this.joystick.knobX = this.joystick.baseX + dx;
    this.joystick.knobY = this.joystick.baseY + dy;
    const d = this.joystick.dead;
    this.held.left = dx < -d;
    this.held.right = dx > d;
    this.held.up = dy < -d;
    this.held.down = dy > d;
  }
}
