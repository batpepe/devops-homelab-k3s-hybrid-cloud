// audio.js
// WebAudio synth engine. All sound is generated in code (oscillators + filtered noise)
// so there are no audio files, no IP concerns, and nothing changes in the Docker/Trivy
// surface. AudioContext must be created/resumed from a user gesture (browser autoplay
// policy), so main.js calls ensure() on the Start click and first input.

export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.muted = false;
    this._music = null;
    this.vol = 0.5;
  }

  ensure() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    // master -> compressor -> out; SFX and music ride separate sub-buses off master so
    // music sits under the hits and a big fight cannot clip into harshness.
    this.master = this.ctx.createGain();
    this.master.gain.value = this.muted ? 0 : this.vol;
    const comp = this.ctx.createDynamicsCompressor();
    this.master.connect(comp); comp.connect(this.ctx.destination);
    this.sfxBus = this.ctx.createGain(); this.sfxBus.gain.value = 0.9; this.sfxBus.connect(this.master);
    this.musicBus = this.ctx.createGain(); this.musicBus.gain.value = 0.5; this.musicBus.connect(this.master);
  }

  get t() { return this.ctx ? this.ctx.currentTime : 0; }

  _env(node, gain, attack, dur, bus) {
    const g = this.ctx.createGain();
    const t = this.t;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(gain, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + attack + dur);
    node.connect(g); g.connect(bus || this.sfxBus);
    return g;
  }

  _tone(freq, dur, type = 'sine', gain = 0.3, glideTo = null, bus = null) {
    if (!this.ctx || this.muted) return;
    const o = this.ctx.createOscillator();
    o.type = type;
    const t = this.t;
    o.frequency.setValueAtTime(freq, t);
    if (glideTo) o.frequency.exponentialRampToValueAtTime(glideTo, t + dur);
    this._env(o, gain, 0.005, dur, bus);
    o.start(t); o.stop(t + dur + 0.05);
  }

  _noise(dur, gain = 0.3, filterType = 'lowpass', f0 = 2000, f1 = null, bus = null) {
    if (!this.ctx || this.muted) return;
    const len = Math.max(1, Math.floor(this.ctx.sampleRate * dur));
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const s = this.ctx.createBufferSource(); s.buffer = buf;
    const filt = this.ctx.createBiquadFilter(); filt.type = filterType;
    const t = this.t;
    filt.frequency.setValueAtTime(f0, t);
    if (f1) filt.frequency.exponentialRampToValueAtTime(f1, t + dur);
    s.connect(filt);
    this._env(filt, gain, 0.002, dur, bus);
    s.start(t); s.stop(t + dur + 0.05);
  }

  // --- SFX ---
  hit() { this._noise(0.12, 0.4, 'lowpass', 1400, 200); this._tone(180, 0.1, 'square', 0.14, 90); }
  parry() { this._tone(1300, 0.25, 'triangle', 0.28, 1900); this._tone(1750, 0.3, 'sine', 0.18); this._noise(0.08, 0.18, 'highpass', 3200); }
  dash() { this._noise(0.2, 0.24, 'bandpass', 1600, 400); }
  jump() { this._tone(320, 0.14, 'square', 0.16, 640); }
  land() { this._noise(0.1, 0.24, 'lowpass', 520, 120); }
  batarang() { this._tone(950, 0.12, 'sawtooth', 0.11, 1500); }
  batarangHit() { this._tone(2000, 0.08, 'square', 0.14, 800); }
  enemyHurt() { this._tone(230, 0.1, 'sawtooth', 0.16, 120); }
  playerHurt() { this._tone(160, 0.25, 'sawtooth', 0.24, 70); this._noise(0.15, 0.2, 'lowpass', 900, 200); }
  pickup() { this._tone(720, 0.1, 'sine', 0.2, 1100); this._tone(1100, 0.12, 'sine', 0.16, 1500); }
  ui() { this._tone(520, 0.06, 'square', 0.12); }
  gate() { this._noise(0.6, 0.3, 'lowpass', 320, 80); this._tone(80, 0.6, 'sine', 0.2); }
  thunder() { this._noise(0.85, 0.4, 'lowpass', 420, 60); }
  bossRoar() { this._tone(95, 0.7, 'sawtooth', 0.3, 50); this._noise(0.5, 0.24, 'lowpass', 640, 100); }
  boom() { this._noise(0.4, 0.45, 'lowpass', 320, 50); this._tone(60, 0.4, 'sine', 0.3); }

  // --- Music: a slow, low loop (bass + pad) ---
  startMusic() {
    if (!this.ctx || this._music) return;
    const scale = [110, 130.81, 146.83, 164.81, 196, 164.81];
    let i = 0;
    const step = () => {
      if (!this.muted) {
        const f = scale[i % scale.length];
        this._tone(f, 1.7, 'triangle', 0.14, null, this.musicBus);
        this._tone(f / 2, 1.7, 'sine', 0.14, null, this.musicBus);
      }
      i++;
    };
    step();
    this._music = setInterval(step, 1500);
  }
  stopMusic() { if (this._music) { clearInterval(this._music); this._music = null; } }

  setMuted(m) { this.muted = m; if (this.master) this.master.gain.value = m ? 0 : this.vol; }
  toggleMute() { this.setMuted(!this.muted); return this.muted; }
}
