import { getState } from "./store";

// Sons synthétisés en direct (aucun fichier audio) : relais, carillons, alarme.
let ctx: AudioContext | null = null;

function ac() {
  if (!ctx) {
    const C = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!C) return null;
    ctx = new C();
  }
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  return ctx;
}

function tone(freq: number, dur: number, type: OscillatorType, gain: number, delay = 0, slideTo?: number) {
  const a = ac(); if (!a) return;
  const t0 = a.currentTime + delay;
  const o = a.createOscillator(); const g = a.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t0);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g).connect(a.destination);
  o.start(t0); o.stop(t0 + dur + 0.05);
}

function noise(dur: number, gain: number, freq = 2400, delay = 0) {
  const a = ac(); if (!a) return;
  const t0 = a.currentTime + delay;
  const len = Math.floor(a.sampleRate * dur);
  const buf = a.createBuffer(1, len, a.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = a.createBufferSource(); src.buffer = buf;
  const f = a.createBiquadFilter(); f.type = "bandpass"; f.frequency.value = freq; f.Q.value = 1.2;
  const g = a.createGain(); g.gain.value = gain;
  src.connect(f).connect(g).connect(a.destination);
  src.start(t0);
}

export type Sfx = "tap" | "ok" | "ko" | "power" | "levelup" | "badge" | "alarm" | "type" | "relay" | "open";

export function sfx(name: Sfx) {
  if (!getState().settings.sound) return;
  try {
    switch (name) {
      case "tap": noise(0.03, 0.18, 3200); break;
      case "type": noise(0.015, 0.06, 4200); break;
      case "relay": noise(0.05, 0.35, 1400); tone(90, 0.08, "square", 0.05); break;
      case "open": tone(520, 0.08, "sine", 0.06); tone(780, 0.12, "sine", 0.05, 0.05); break;
      case "ok": tone(660, 0.12, "sine", 0.12); tone(990, 0.22, "sine", 0.1, 0.08); break;
      case "ko": tone(160, 0.22, "square", 0.05); tone(120, 0.25, "square", 0.04, 0.08); break;
      case "power":
        tone(60, 1.2, "sawtooth", 0.05, 0, 240); noise(0.4, 0.15, 800, 0.05);
        tone(440, 0.3, "sine", 0.08, 0.9); tone(880, 0.5, "sine", 0.06, 1.0); break;
      case "levelup": [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.25, "triangle", 0.09, i * 0.09)); break;
      case "badge": tone(880, 0.12, "sine", 0.08); tone(1320, 0.3, "sine", 0.07, 0.1); break;
      case "alarm": for (let i = 0; i < 3; i++) { tone(740, 0.18, "square", 0.04, i * 0.4); tone(520, 0.18, "square", 0.04, i * 0.4 + 0.2); } break;
    }
  } catch { /* le son n'est jamais bloquant */ }
}
