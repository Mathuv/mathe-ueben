// Sound definitions and playback.
import { S } from "./state.js";

// ---------- sounds ----------
// The browser makes the tones (Web Audio API), so the page needs no sound files.
// Each note is [frequency in Hz, start in s, length in s, wave form, volume (optional, 0.25 if missing)].

const SOUNDS = {
  right: [[523.25, 0, 0.15, "sine"], [659.25, 0.1, 0.15, "sine"], [783.99, 0.2, 0.35, "sine"]],
  wrong: [[329.63, 0, 0.18, "triangle"], [261.63, 0.16, 0.32, "triangle"]],
  hint: [[880, 0, 0.12, "sine"], [1174.66, 0.09, 0.3, "sine"]],
  // Time is up: two soft, equal "ding" notes.
  timeup: [[523.25, 0, 0.15, "triangle", 0.15], [523.25, 0.22, 0.25, "triangle", 0.15]],
  // All 3 tries used: "wah-wah-wah-waaah", four notes that step down, the last one long.
  fail: [[293.66, 0, 0.28, "triangle", 0.2], [277.18, 0.3, 0.28, "triangle", 0.2], [261.63, 0.6, 0.28, "triangle", 0.2], [246.94, 0.9, 0.9, "triangle", 0.2]],
  // Fanfare: "ta-ta-ta-TAA", a rising run, a long final chord with a low C, then sparkles above it.
  star: [
    [392, 0, 0.1, "triangle"], [392, 0.12, 0.1, "triangle"], [392, 0.24, 0.1, "triangle"], [523.25, 0.36, 0.32, "triangle"],
    [392, 0.72, 0.1, "triangle"], [523.25, 0.84, 0.1, "triangle"], [659.25, 0.96, 0.1, "triangle"],
    [523.25, 1.1, 1.3, "triangle", 0.16], [659.25, 1.1, 1.3, "triangle", 0.16], [783.99, 1.1, 1.3, "triangle", 0.16], [261.63, 1.1, 1.3, "sine", 0.2],
    [1046.5, 1.35, 0.3, "sine", 0.07], [1318.51, 1.47, 0.3, "sine", 0.07], [1567.98, 1.59, 0.3, "sine", 0.07], [2093, 1.71, 0.6, "sine", 0.07],
  ],
};
let audioCtx = null;

function tone(freq, start, length, wave, volume = 0.25) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  const t0 = audioCtx.currentTime + start;
  osc.type = wave;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(volume, t0 + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + length);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start(t0);
  osc.stop(t0 + length + 0.05);
}

export function play(name) {
  if (!S.sound) return;
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === "suspended") audioCtx.resume();
  for (const note of SOUNDS[name]) tone(note[0], note[1], note[2], note[3], note[4]);
}
