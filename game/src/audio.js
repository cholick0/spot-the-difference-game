// Spot the Difference — all sound, made with the Web Audio API.
// One job only: short synthesized blips, no audio files, no network.
// The context is created lazily on the first player gesture, so browsers
// that block autoplay never complain, and M toggles mute.

let audioContext = null;
let muted = false;

export function isMuted() {
  return muted;
}

export function toggleMute() {
  muted = !muted;
  return muted;
}

function context() {
  if (!audioContext) {
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) return null;
    audioContext = new Ctor();
  }
  if (audioContext.state === 'suspended') void audioContext.resume();
  return audioContext;
}

// One oscillator note: frequency, when it starts, how long, what shape.
function note(freq, startOffset, duration, type, volume) {
  const ctx = context();
  if (!ctx || muted) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  const t = ctx.currentTime + startOffset;
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(volume, t + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  osc.connect(gain).connect(ctx.destination);
  osc.start(t);
  osc.stop(t + duration + 0.05);
}

// A bright two-note chime when a difference is found.
export function playFound() {
  note(660, 0, 0.16, 'sine', 0.22);
  note(990, 0.09, 0.24, 'sine', 0.22);
}

// A low dull buzz for a wrong click.
export function playWrong() {
  note(140, 0, 0.22, 'sawtooth', 0.10);
  note(110, 0.05, 0.22, 'sawtooth', 0.08);
}

// A soft single ping for a hint.
export function playHint() {
  note(520, 0, 0.18, 'triangle', 0.16);
}

// A rising arpeggio for clearing a round, longer for winning the game.
export function playWin(big) {
  const steps = big ? [523, 659, 784, 1047, 1319] : [523, 659, 784, 1047];
  steps.forEach((freq, i) => note(freq, i * 0.11, 0.28, 'sine', 0.2));
}

// A quiet tick when the clock drops under ten seconds.
export function playTick() {
  note(880, 0, 0.06, 'square', 0.05);
}

// A tiny click for buttons and the title screen.
export function playClick() {
  note(440, 0, 0.07, 'triangle', 0.12);
}
