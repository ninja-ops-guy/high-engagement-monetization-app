"use client";

let ctx: AudioContext | null = null;
let muted = false;

function ac(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

export function setMuted(v: boolean) {
  muted = v;
}
export function isMuted() {
  return muted;
}

function blip(
  freq: number,
  dur: number,
  type: OscillatorType = "triangle",
  gain = 0.06,
  delay = 0,
) {
  if (muted) return;
  const a = ac();
  if (!a) return;
  const t0 = a.currentTime + delay;
  const osc = a.createOscillator();
  const g = a.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(a.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

export const sfx = {
  tick() {
    blip(880 + Math.random() * 320, 0.045, "square", 0.028);
  },
  open() {
    blip(160, 0.18, "sawtooth", 0.05);
    blip(240, 0.22, "triangle", 0.04, 0.05);
  },
  reveal(rarity: string) {
    const table: Record<string, number[]> = {
      common: [330],
      rare: [392, 523],
      epic: [440, 587, 740],
      legendary: [523, 659, 784, 1046],
      mythic: [523, 659, 784, 1046, 1318, 1568],
    };
    const notes = table[rarity] ?? [330];
    notes.forEach((n, i) => blip(n, 0.3, "triangle", 0.07, i * 0.085));
  },
  coin() {
    blip(1200, 0.06, "square", 0.04);
    blip(1600, 0.08, "square", 0.03, 0.06);
  },
  error() {
    blip(150, 0.16, "sawtooth", 0.05);
    blip(110, 0.2, "sawtooth", 0.04, 0.1);
  },
  fanfare() {
    [523, 659, 784, 1046, 1318].forEach((n, i) =>
      blip(n, 0.45, "triangle", 0.08, i * 0.1),
    );
  },
};
