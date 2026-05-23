/* Sound effects for the Demo Wizard — Web Audio API one-liners, safe to call in any env */

let _ctx: AudioContext | null = null;
function ctx(): AudioContext {
  if (!_ctx) _ctx = new AudioContext();
  return _ctx;
}

function osc(
  freq: number,
  type: OscillatorType,
  gainVal: number,
  start: number,
  stop: number,
  endGain = 0.001,
  rampEnd?: number,
) {
  const c = ctx();
  const o = c.createOscillator();
  const g = c.createGain();
  o.connect(g);
  g.connect(c.destination);
  o.type = type;
  o.frequency.value = freq;
  g.gain.setValueAtTime(gainVal, c.currentTime + start);
  g.gain.exponentialRampToValueAtTime(endGain, c.currentTime + (rampEnd ?? stop));
  o.start(c.currentTime + start);
  o.stop(c.currentTime + stop);
}

/** Played on score reveal / transform */
export function playRevealSound() {
  try {
    const c = ctx();
    const t = c.currentTime;
    // rising sweep
    const s = c.createOscillator();
    const g = c.createGain();
    s.connect(g); g.connect(c.destination);
    s.type = "sine";
    s.frequency.setValueAtTime(220, t);
    s.frequency.exponentialRampToValueAtTime(1320, t + 0.6);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.15, t + 0.3);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.8);
    s.start(t); s.stop(t + 0.8);
    // chime
    [523, 659, 784].forEach((f, i) => {
      osc(f, "sine", 0.08, 0.5 + i * 0.05, 1 + i * 0.05);
    });
  } catch { /* silent */ }
}

/** Short tap/discount toggle */
export function playToggleSound() {
  try {
    [880, 784, 660, 523, 440].forEach((f, i) => {
      osc(f, "sine", 0.1, i * 0.06, i * 0.06 + 0.12);
    });
  } catch { /* silent */ }
}

/** Celebration / close */
export function playCelebrationSound() {
  try {
    const c = ctx();
    const t = c.currentTime;
    osc(523.25, "sine", 0.15, 0, 0.3);
    osc(659.25, "sine", 0.15, 0.15, 0.5);
    osc(783.99, "sine", 0.12, 0.3, 0.7);
  } catch { /* silent */ }
}

/** Boost applied */
export function playBoostSound() {
  try {
    const c = ctx();
    const t = c.currentTime;
    const s = c.createOscillator();
    const g = c.createGain();
    s.connect(g); g.connect(c.destination);
    s.type = "sine";
    s.frequency.setValueAtTime(220, t);
    s.frequency.exponentialRampToValueAtTime(1760, t + 0.5);
    g.gain.setValueAtTime(0.12, t);
    g.gain.setValueAtTime(0.12, t + 0.3);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.7);
    s.start(t); s.stop(t + 0.7);
    [1320, 1568, 1760].forEach((f, i) => {
      osc(f, "triangle", 0.06, 0.3 + i * 0.08, 0.6 + i * 0.08);
    });
  } catch { /* silent */ }
}

/** Thunk / button tap */
export function playTapSound() {
  try {
    const c = ctx();
    const t = c.currentTime;
    const s = c.createOscillator();
    const g = c.createGain();
    s.connect(g); g.connect(c.destination);
    s.type = "sine";
    s.frequency.setValueAtTime(600, t);
    s.frequency.exponentialRampToValueAtTime(300, t + 0.06);
    g.gain.setValueAtTime(0.1, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
    s.start(t); s.stop(t + 0.08);
  } catch { /* silent */ }
}
