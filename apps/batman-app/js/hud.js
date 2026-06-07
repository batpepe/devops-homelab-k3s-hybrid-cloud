// hud.js
// DOM overlay HUD + menus. Reads the player each frame and updates element state:
// segmented armor (top-left), gadget cooldown dials (top-right), combo meter
// (center-right). Menu buttons fire the callbacks passed to bind().

export class Hud {
  constructor() {
    this.health = document.getElementById('hud-health');
    this.batarang = document.getElementById('cd-batarang');
    this.dash = document.getElementById('cd-dash');
    this.combo = document.getElementById('hud-combo');
    this.comboNum = this.combo.querySelector('span');
    this.comboFill = document.getElementById('combo-fill');
    this.menuStart = document.getElementById('menu-start');
    this.menuOver = document.getElementById('menu-over');
    this.overText = document.getElementById('over-text');
    this._segs = -1;
  }

  bind(onStart, onRestart) {
    document.getElementById('btn-start').addEventListener('click', onStart);
    document.getElementById('btn-restart').addEventListener('click', onRestart);
  }

  showStart() { this.menuStart.classList.remove('hidden'); this.menuOver.classList.add('hidden'); }
  showOver(text) { this.overText.textContent = text; this.menuOver.classList.remove('hidden'); }
  hideMenus() { this.menuStart.classList.add('hidden'); this.menuOver.classList.add('hidden'); }

  update(p) {
    if (this._segs !== p.maxHealth) {
      this.health.innerHTML = '';
      for (let i = 0; i < p.maxHealth; i++) {
        const s = document.createElement('div'); s.className = 'seg'; this.health.appendChild(s);
      }
      this._segs = p.maxHealth;
    }
    const segs = this.health.children;
    for (let i = 0; i < segs.length; i++) segs[i].classList.toggle('empty', i >= p.health);

    this.batarang.style.setProperty('--cd', String(p.batarangCdFrac));
    this.dash.style.setProperty('--cd', String(p.dashCdFrac));

    if (p.combo > 1) {
      this.combo.classList.remove('hidden');
      this.comboNum.textContent = p.combo + 'x';
      this.comboFill.style.width = Math.min(100, p.combo * 12) + '%';
    } else {
      this.combo.classList.add('hidden');
    }
  }
}
