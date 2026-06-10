// hud.js
// DOM overlay HUD + menus. Each frame it reflects player + game state: segmented armor,
// gadget cooldown dials, a combo meter that pops as it climbs, a boss health bar, and an
// objective banner. Menu + mute buttons fire the callbacks passed to bind().

export class Hud {
  constructor() {
    this.health = document.getElementById('hud-health');
    this.batarang = document.getElementById('cd-batarang');
    this.dash = document.getElementById('cd-dash');
    this.combo = document.getElementById('hud-combo');
    this.comboNum = this.combo.querySelector('span');
    this.comboFill = document.getElementById('combo-fill');
    this.score = document.getElementById('hud-score');
    this.menuStart = document.getElementById('menu-start');
    this.menuOver = document.getElementById('menu-over');
    this.menuPause = document.getElementById('menu-pause');
    this.overText = document.getElementById('over-text');
    this.overStats = document.getElementById('over-stats');
    this.bossUi = document.getElementById('boss-ui');
    this.bossFill = document.getElementById('boss-fill');
    this.objective = document.getElementById('objective');
    this.muteBtn = document.getElementById('btn-mute');
    this._segs = -1; this._lastCombo = 0; this._objText = '';
  }

  bind(onStart, onRestart, onMute, onEndless) {
    document.getElementById('btn-start').addEventListener('click', onStart);
    document.getElementById('btn-restart').addEventListener('click', onRestart);
    if (this.muteBtn) this.muteBtn.addEventListener('click', onMute);
    const endlessBtn = document.getElementById('btn-endless');
    if (endlessBtn && onEndless) endlessBtn.addEventListener('click', onEndless);
  }

  showStart() { this.menuStart.classList.remove('hidden'); this.menuOver.classList.add('hidden'); this.showPause(false); }
  showPause(on) { if (this.menuPause) this.menuPause.classList.toggle('hidden', !on); }
  showOver(text, stats) {
    this.overText.textContent = text;
    if (this.overStats) {
      if (stats) {
        const lines = [`SCORE ${stats.score}`];
        if (stats.mode === 'endless') lines.push(`WAVES CLEARED ${stats.wave}`);
        const best = stats.mode === 'endless'
          ? `BEST ${stats.best}${stats.bestWave != null ? ` (wave ${stats.bestWave})` : ''}`
          : `BEST ${stats.best}`;
        lines.push(best);
        if (stats.newBest) lines.push('NEW BEST');
        this.overStats.innerHTML = lines
          .map((l) => `<div class="${l === 'NEW BEST' ? 'over-newbest' : ''}">${l}</div>`)
          .join('');
      } else {
        this.overStats.innerHTML = '';
      }
    }
    this.menuOver.classList.remove('hidden');
  }
  hideMenus() { this.menuStart.classList.add('hidden'); this.menuOver.classList.add('hidden'); this.showPause(false); }
  setMuteLabel(muted) { if (this.muteBtn) this.muteBtn.textContent = muted ? 'SOUND: OFF' : 'SOUND: ON'; }

  setObjective(text) {
    if (text === this._objText) return;
    this._objText = text;
    if (!text) { this.objective.classList.add('hidden'); return; }
    this.objective.textContent = text;
    this.objective.classList.remove('hidden');
    this.objective.classList.remove('flash'); void this.objective.offsetWidth; this.objective.classList.add('flash');
  }

  update(player, info) {
    if (this._segs !== player.maxHealth) {
      this.health.innerHTML = '';
      for (let i = 0; i < player.maxHealth; i++) { const s = document.createElement('div'); s.className = 'seg'; this.health.appendChild(s); }
      this._segs = player.maxHealth;
    }
    const segs = this.health.children;
    for (let i = 0; i < segs.length; i++) segs[i].classList.toggle('empty', i >= player.health);

    this.batarang.style.setProperty('--cd', String(player.batarangCdFrac));
    this.dash.style.setProperty('--cd', String(player.dashCdFrac));

    if (player.combo > 1) {
      this.combo.classList.remove('hidden');
      this.comboNum.textContent = player.combo + 'x';
      this.comboFill.style.width = Math.min(100, player.combo * 12) + '%';
      this.comboNum.style.color = player.combo >= 8 ? '#ff5a4a' : player.combo >= 4 ? '#ffd23f' : '#cfe6ff';
      if (player.combo !== this._lastCombo) { this.comboNum.classList.remove('pop'); void this.comboNum.offsetWidth; this.comboNum.classList.add('pop'); }
    } else {
      this.combo.classList.add('hidden');
    }
    this._lastCombo = player.combo;

    if (this.score) {
      if (info && info.score != null) { this.score.classList.remove('hidden'); this.score.textContent = info.score; }
      else this.score.classList.add('hidden');
    }

    if (info && info.bossHpFrac != null) { this.bossUi.classList.remove('hidden'); this.bossFill.style.width = (info.bossHpFrac * 100) + '%'; }
    else this.bossUi.classList.add('hidden');

    this.setObjective(info ? info.objective : '');
  }
}
