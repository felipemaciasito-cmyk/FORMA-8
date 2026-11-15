import { getState } from "./store";

// Sons de FORMA-8, sur le thème de l'électricité : relais, contacteurs, arcs, transformateurs, avec une
// réverbération légère (l'écho d'une salle de machines). Aucun fichier audio : chaque son est fabriqué par le
// téléphone. Choisis par le propriétaire le 15/11/2026 sur la maquette « Labo son et lumière » :
// clavier « Feutré », levier en sectionneur, montée de grade « Accréditation », réveil « Défibrillateur ».
// Deux réglages indépendants : les effets (settings.sound) et le fond sonore (settings.ambience).
//
// Comment c'est joué (important pour l'iPhone) : fabriquer un son en direct demande des dizaines de petits
// éléments audio à chaque effet. Sous une rafale (bonnes réponses, badges, éclairs), le moteur de Safari finissait
// par planter (constaté le 15/11/2026 dans WebKit : la page tombait en moins d'une minute de jeu, jamais sans son).
// Désormais, chaque son est fabriqué UNE fois, hors temps réel (OfflineAudioContext), juste après le premier
// toucher ; ensuite, jouer un effet ne demande qu'un lecteur et un volume. Les sons courants ont plusieurs
// variantes, pour ne jamais sonner mécaniques. Avant d'être prêt, un son est simplement ignoré.

type Ctx = BaseAudioContext;
/** Le contexte audio réel (haut-parleur), créé au premier toucher. */
let rt: AudioContext | null = null;
let fxBus: GainNode | null = null;
let ambBus: GainNode | null = null;
// Contexte de fabrication en cours (hors temps réel pendant la préparation, réel pour le ronronnement du fond).
let ctx: Ctx | null = null;
let master: AudioNode | null = null;
let rev: ConvolverNode | null = null;
let noiseBuf: AudioBuffer | null = null;
let brownBuf: AudioBuffer | null = null;
let irBuf: AudioBuffer | null = null;
let curve: Float32Array<ArrayBuffer> | null = null;
let curPan = 0, curFar = 0; // placement d'un son du fond : gauche/droite, éloignement
let unlocked = false;
const SR = 32000; // suffisant pour ces sons, et moins de mémoire

/** Instant (en secondes après le début du son) où la batterie reçoit l'arc de fin de protocole. */
export const CHARGE_HIT = 0.74;
/** Instant où la décharge réveille le membre (réveil « Défibrillateur »). */
export const WAKE_HIT = 2.0;

function makeNoise(sec: number, brown: boolean) {
  const len = Math.floor(SR * sec), b = new AudioBuffer({ numberOfChannels: 1, length: len, sampleRate: SR }), d = b.getChannelData(0);
  let last = 0;
  for (let i = 0; i < len; i++) { const w = Math.random() * 2 - 1; if (brown) { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; } else d[i] = w; }
  return b;
}
function makeIR(sec: number, decay: number) {
  const len = Math.floor(SR * sec), b = new AudioBuffer({ numberOfChannels: 2, length: len, sampleRate: SR });
  for (let c = 0; c < 2; c++) { const d = b.getChannelData(c); let lp = 0; for (let i = 0; i < len; i++) { lp += (Math.random() * 2 - 1 - lp) * (0.55 - 0.4 * i / len); d[i] = lp * Math.pow(1 - i / len, decay); } }
  return b;
}
function makeCurve(k: number) { const n = 1024, c = new Float32Array(n); for (let i = 0; i < n; i++) { const x = i * 2 / n - 1; c[i] = (1 + k) * x / (1 + k * Math.abs(x)); } return c; }

// ---------------- briques ----------------
const A = () => ctx!;
const now = () => A().currentTime;
function out(space: number, dest: AudioNode = master!) {
  const a = A(), g = a.createGain(); let node: AudioNode = g;
  if (curFar) { g.gain.value = 1 - 0.5 * curFar; space = Math.max(space, 0.6 + 0.35 * curFar); }
  if (curPan && a.createStereoPanner) { const p = a.createStereoPanner(); p.pan.value = curPan; g.connect(p); node = p; }
  if (curFar) { const lp = a.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 5200 - 3600 * curFar; node.connect(lp); node = lp; }
  node.connect(dest);
  if (space > 0 && rev) { const s = a.createGain(); s.gain.value = space; node.connect(s); s.connect(rev); }
  return g;
}
function env(t: number, at: number, peak: number, hold: number, rel: number) {
  const g = A().createGain();
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(peak, t + at);
  g.gain.setValueAtTime(peak, t + at + hold); g.gain.exponentialRampToValueAtTime(0.0001, t + at + hold + rel);
  return g;
}
function filt(type: BiquadFilterType, f: number, q?: number) { const b = A().createBiquadFilter(); b.type = type; b.frequency.value = f; if (q) b.Q.value = q; return b; }
function osc(type: OscillatorType, f: number) { const o = A().createOscillator(); o.type = type; o.frequency.value = f; return o; }
function noise(t: number, dur: number, buf: AudioBuffer = noiseBuf!) {
  const s = A().createBufferSource(); s.buffer = buf; s.start(t, Math.random() * Math.max(0, buf.duration - dur - 0.05), dur + 0.04); return s;
}
function click(t: number, f: number, q: number, dur: number, gain: number, space = 0.08, lp = 0) {
  const s = noise(t, dur + 0.01), b = filt("bandpass", f, q), e = env(t, 0.0006, gain, dur * 0.3, dur);
  s.connect(b); if (lp) { const l = filt("lowpass", lp, 0.7); b.connect(l); l.connect(e); } else b.connect(e); e.connect(out(space));
}
function band(t: number, f: number, q: number, dur: number, gain: number, space = 0.08) { const s = noise(t, dur + 0.02), b = filt("bandpass", f, q), e = env(t, 0.001, gain, dur * 0.2, dur); s.connect(b); b.connect(e); e.connect(out(space)); }
function body(t: number, lp: number, dur: number, gain: number, space = 0.08) { const s = noise(t, dur + 0.02), b = filt("lowpass", lp, 0.8), e = env(t, 0.001, gain, dur * 0.2, dur); s.connect(b); b.connect(e); e.connect(out(space)); }
function thump(t: number, f0: number, f1: number, dur: number, gain: number, space = 0.1, type: OscillatorType = "sine") {
  const o = osc(type, f0); o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur);
  const e = env(t, 0.002, gain, 0, dur); o.connect(e); e.connect(out(space)); o.start(t); o.stop(t + dur + 0.05);
}
function ring(t: number, freqs: number[], dur: number, gain: number, space = 0.2) {
  freqs.forEach((f, i) => { const o = osc("sine", f), e = env(t, 0.001, gain / (i + 1), 0, dur * (1 - i * 0.12)); o.connect(e); e.connect(out(space)); o.start(t); o.stop(t + dur + 0.05); });
}
/** Crépitement électrique : impulsions aléatoires, chacune avec une petite résonance. */
function crackle(t: number, dur: number, density: number, gain: number, hp = 2000, space = 0.2) {
  const a = A(), len = Math.max(1, Math.floor(a.sampleRate * dur)), b = a.createBuffer(1, len, a.sampleRate), d = b.getChannelData(0), p = density / a.sampleRate;
  for (let i = 0; i < len; i++) if (Math.random() < p) {
    const amp = (Math.random() * 0.8 + 0.2) * (Math.random() < 0.5 ? -1 : 1), L = 4 + Math.floor(Math.random() * 40);
    for (let k = 0; k < L && i + k < len; k++) d[i + k] += amp * Math.pow(1 - k / L, 2) * (k % 2 ? -1 : 1);
  }
  const s = a.createBufferSource(); s.buffer = b; const h = filt("highpass", hp, 0.7), e = env(t, 0.001, gain, dur * 0.55, dur * 0.45);
  s.connect(h); h.connect(e); e.connect(out(space)); s.start(t);
}
function sweepNoise(t: number, type: BiquadFilterType, f0: number, f1: number, dur: number, gain: number, at: number, space: number, buf?: AudioBuffer) {
  const s = noise(t, dur + 0.05, buf), b = filt(type, f0, type === "bandpass" ? 2 : 0.7);
  b.frequency.setValueAtTime(f0, t); b.frequency.exponentialRampToValueAtTime(f1, t + dur);
  const e = env(t, at, gain, 0, Math.max(0.02, dur - at)); s.connect(b); b.connect(e); e.connect(out(space));
}
/** Bourdonnement électrique (100 Hz : deux fois la fréquence du réseau, 50 Hz), passé dans un filtre qui balaie. */
function buzz(t: number, dur: number, gain: number, f0: number, f1: number, q = 3, at = 0.05, space = 0.3, base = 100) {
  const a = A(), o = osc("sawtooth", base), o2 = osc("square", base * 1.5), m = a.createGain(); m.gain.value = 0.5; o.connect(m); o2.connect(m);
  const b = filt("bandpass", f0, q); b.frequency.setValueAtTime(f0, t); b.frequency.exponentialRampToValueAtTime(f1, t + dur);
  const hold = Math.max(0, dur * 0.55 - at), end = t + at + hold + dur * 0.45 + 0.05;
  const e = env(t, at, gain, hold, dur * 0.45); m.connect(b); b.connect(e); e.connect(out(space));
  o.start(t); o2.start(t); o.stop(end); o2.stop(end);
}
/** Deux notes jouées par un arc électrique (bobine Tesla musicale) : signature des petites victoires. */
function tesla(t: number, f: number, dur: number, gain: number, space = 0.45) {
  const a = A(), o = osc("square", f), o2 = osc("sawtooth", f * 2.004), mix = a.createGain(); mix.gain.value = 0.5; o.connect(mix); o2.connect(mix);
  const ws = a.createWaveShaper(); ws.curve = curve; mix.connect(ws);
  const n = noise(t, dur + 0.05), nb = filt("bandpass", 3600, 0.7), am = a.createGain(); am.gain.value = 0;
  const og = a.createGain(); og.gain.value = 0.8; o.connect(og); og.connect(am.gain); n.connect(nb); nb.connect(am);
  const hp = filt("highpass", 200, 0.7), lp = filt("lowpass", 7000, 0.7), e = env(t, 0.006, gain, dur * 0.7, dur * 0.3);
  const wg = a.createGain(); wg.gain.value = 0.35; ws.connect(wg); wg.connect(hp); am.connect(hp); hp.connect(lp); lp.connect(e); e.connect(out(space));
  o.start(t); o2.start(t); o.stop(t + dur + 0.1); o2.stop(t + dur + 0.1);
  crackle(t, dur, 1800, gain * 0.7, 3000, space);
}
/** Accord grave et propre (quinte), sans mélodie : la puissance qui s'installe. */
function powerChord(t: number, dur: number, gain: number, base = 55) {
  const a = A(), lp = filt("lowpass", 1400, 0.8); lp.frequency.setValueAtTime(2200, t); lp.frequency.exponentialRampToValueAtTime(500, t + dur);
  const e = a.createGain(); e.gain.setValueAtTime(0.0001, t); e.gain.exponentialRampToValueAtTime(gain, t + 0.04); e.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  lp.connect(e); e.connect(out(0.7));
  ([[base, "sawtooth", 0.5], [base * 1.003, "sawtooth", 0.5], [base * 1.5, "triangle", 0.6], [base * 2, "triangle", 0.5], [base * 3, "sine", 0.3]] as const)
    .forEach(([f, ty, g]) => { const o = osc(ty, f), og = a.createGain(); og.gain.value = g; o.connect(og); og.connect(lp); o.start(t); o.stop(t + dur + 0.05); });
}
function relay(t: number, g = 1) { click(t, 2800, 3, 0.004, 0.24 * g, 0.15); ring(t + 0.001, [3200, 4700], 0.05, 0.035 * g); thump(t, 300, 190, 0.03, 0.08 * g); click(t + 0.008, 3400, 4, 0.003, 0.09 * g, 0.15); }
function contactor(t: number, g = 1, space = 0.35) {
  thump(t, 95, 42, 0.14, 0.5 * g, space); body(t, 1500, 0.06, 0.45 * g, space); ring(t + 0.002, [1180, 1730, 2650], 0.2, 0.06 * g, space);
  click(t, 3600, 1, 0.004, 0.32 * g, space); click(t + 0.019, 2900, 2, 0.004, 0.14 * g, space);
}
function tube(t: number, g = 1) {
  [0, 0.08 + Math.random() * 0.04, 0.2 + Math.random() * 0.05].forEach((d, i) => {
    click(t + d, 2600 + i * 300, 4, 0.004, 0.13 * g, 0.2);
    const o = osc("sawtooth", 100), b = filt("bandpass", 1400, 1.5), e = env(t + d, 0.004, 0.05 * g, 0.03, 0.05); o.connect(b); b.connect(e); e.connect(out(0.2)); o.start(t + d); o.stop(t + d + 0.12);
  });
  const o = osc("sawtooth", 100), b = filt("bandpass", 1100, 1.2), e = env(t + 0.3, 0.01, 0.045 * g, 0.15, 0.6); o.connect(b); b.connect(e); e.connect(out(0.25)); o.start(t + 0.3); o.stop(t + 1.1);
}
function zap(t: number, g = 1) {
  click(t, 6000, 0.7, 0.003, 0.45 * g, 0.2); crackle(t, 0.14, 4200, 0.4 * g, 1700, 0.25);
  const o = osc("sawtooth", 2600); o.frequency.setValueAtTime(2600, t); o.frequency.exponentialRampToValueAtTime(500, t + 0.13);
  const b = filt("bandpass", 3000, 3), e = env(t, 0.002, 0.05 * g, 0.02, 0.11); o.connect(b); b.connect(e); e.connect(out(0.2)); o.start(t); o.stop(t + 0.2);
  crackle(t + 0.1, 0.28, 650, 0.08 * g, 4000, 0.3);
}
function impact(t: number, gain = 1, len = 2.6) {
  const a = A(), sub = osc("sine", 95); sub.frequency.setValueAtTime(95, t); sub.frequency.exponentialRampToValueAtTime(28, t + 1.1);
  const se = env(t, 0.004, 0.75 * gain, 0.05, 1.3); sub.connect(se); se.connect(out(0.3)); sub.start(t); sub.stop(t + 1.5);
  const k = osc("sine", 160); k.frequency.setValueAtTime(160, t); k.frequency.exponentialRampToValueAtTime(45, t + 0.12);
  const ws = a.createWaveShaper(); ws.curve = curve; const ke = env(t, 0.001, 0.5 * gain, 0.02, 0.2); k.connect(ws); ws.connect(ke); ke.connect(out(0.5)); k.start(t); k.stop(t + 0.3);
  click(t, 4200, 0.5, 0.006, 0.9 * gain, 0.7);
  curPan = -0.7; crackle(t, 0.5, 8000, 0.45 * gain, 900, 0.7); curPan = 0.7; crackle(t + 0.01, 0.5, 8000, 0.45 * gain, 900, 0.7); curPan = 0;
  const lp = filt("lowpass", 2600, 1.2); lp.frequency.setValueAtTime(2600, t); lp.frequency.exponentialRampToValueAtTime(260, t + len);
  const be = env(t, 0.012, 0.22 * gain, 0.15, len), bw = a.createWaveShaper(); bw.curve = curve; const pre = a.createGain(); pre.gain.value = 0.35;
  pre.connect(bw); bw.connect(lp); lp.connect(be); be.connect(out(0.75));
  [55, 55.4, 82.4, 110, 110.6].forEach((f) => { const o = osc("sawtooth", f); o.connect(pre); o.start(t); o.stop(t + len + 0.4); });
  ring(t + 0.005, [233, 367, 541, 802], 2.4, 0.05 * gain, 0.9);
  crackle(t + 0.4, 1.6, 180, 0.05 * gain, 2400, 0.8);
}

// ---------------- les sons de FORMA-8 ----------------
/** Rangées de lumières qui s'allument après le levier, du fond de la salle jusqu'au joueur (secondes après l'impact). */
export const LEVER_LIGHTS = [0.75, 1.15, 1.45, 1.66, 1.82, 1.94];
/** Instant de l'impact du levier, puis de la dernière rangée (la plus proche). */
export const LEVER_HIT = 0.3, LEVER_LAST = LEVER_HIT + 2.05;
/** L'orage après le levier : instants des trois éclairs (secondes après son début). */
export const STORM_STRIKES = [0, 0.25, 0.55];

const SOUNDS = {
  tap() { const t = now(); click(t, 2300, 1.4, 0.004, 0.16, 0.05); thump(t, 420, 260, 0.025, 0.05, 0.05); },
  open() { const t = now(); click(t, 3300, 1.6, 0.004, 0.24, 0.1); ring(t + 0.002, [2150], 0.035, 0.03); thump(t, 190, 120, 0.035, 0.08); click(t + 0.007, 2600, 3, 0.003, 0.08); },
  type() { key("char"); },
  relay() { relay(now()); },
  ok() { const t = now(); relay(t); zap(t + 0.03, 0.55); },
  ko() {
    const t = now(); crackle(t, 0.09, 9000, 0.42, 800, 0.2);
    const o = osc("square", 100); o.frequency.setValueAtTime(100, t); o.frequency.linearRampToValueAtTime(82, t + 0.24);
    const b = filt("lowpass", 1700, 1), e = env(t, 0.004, 0.11, 0.14, 0.1); o.connect(b); b.connect(e); e.connect(out(0.15)); o.start(t); o.stop(t + 0.32);
    contactor(t + 0.15, 0.6, 0.25); thump(t + 0.16, 220, 50, 0.5, 0.06, 0.2);
  },
  /** Mise sous tension ordinaire (panne réparée, sauvegarde restaurée…). */
  power() { const t = now(); contactor(t, 0.8, 0.4); zap(t + 0.02, 0.6); tube(t + 0.15, 0.7); },
  /** Une cellule de la batterie s'allume comme un néon (l'étincelle vient du son de la bonne réponse). */
  cell() { tube(now() + 0.02, 0.9); },
  /** Fin de protocole : la charge monte, l'arc claque dans la batterie, des relais confirment, l'arc chante deux notes. */
  charge() {
    const t = now(), t1 = t + CHARGE_HIT, a = A();
    const o = osc("sine", 220); o.frequency.setValueAtTime(220, t); o.frequency.exponentialRampToValueAtTime(2400, t1);
    const lfo = osc("sine", 14); lfo.frequency.setValueAtTime(14, t); lfo.frequency.linearRampToValueAtTime(40, t1); const lg = a.createGain(); lg.gain.value = 0.035; lfo.connect(lg);
    const e = env(t, CHARGE_HIT - 0.02, 0.07, 0, 0.03); lg.connect(e.gain); o.connect(e); e.connect(out(0.3)); o.start(t); o.stop(t1 + 0.1); lfo.start(t); lfo.stop(t1 + 0.1);
    sweepNoise(t, "highpass", 1500, 6000, CHARGE_HIT, 0.06, CHARGE_HIT - 0.05, 0.2);
    crackle(t + 0.25, CHARGE_HIT - 0.25, 1500, 0.09, 3000, 0.3);
    click(t1, 5000, 0.5, 0.004, 0.9, 0.5); crackle(t1, 0.3, 9000, 0.55, 1100, 0.5); thump(t1, 72, 34, 0.35, 0.5, 0.5);
    buzz(t1 + 0.02, 0.7, 0.13, 2600, 500, 2, 0.004, 0.4);
    [0.4, 0.5, 0.6].forEach((d, i) => relay(t1 + d, 0.6 + i * 0.2));
    tesla(t1 + 0.75, 880, 0.12, 0.05); tesla(t1 + 0.9, 1318.5, 0.28, 0.05);
  },
  /** La prise glisse et se verrouille, étincelle, le courant monte dans le câble. */
  plug() {
    const t = now();
    sweepNoise(t, "bandpass", 1800, 3200, 0.07, 0.12, 0.01, 0.1);
    contactor(t + 0.07, 0.8, 0.3); click(t + 0.09, 3800, 2, 0.004, 0.25, 0.2); zap(t + 0.08, 0.8);
    buzz(t + 0.12, 1.1, 0.11, 300, 1700, 3, 0.5, 0.35); tube(t + 0.85, 0.75);
  },
  /** Le courant essaie de passer, le disjoncteur saute (une panne coupe le circuit). */
  "circuit-fail"() {
    const t = now();
    buzz(t, 0.7, 0.12, 250, 1500, 3, 0.55, 0.35);
    crackle(t + 0.55, 0.12, 9000, 0.5, 900, 0.35); contactor(t + 0.62, 0.9, 0.4); thump(t + 0.63, 240, 45, 0.7, 0.1, 0.3);
    buzz(t + 1.2, 0.3, 0.06, 300, 600, 3, 0.2, 0.35); crackle(t + 1.45, 0.08, 7000, 0.3, 900, 0.3);
  },
  breaker() { const t = now(); click(t, 2600, 2, 0.006, 0.3, 0.2); contactor(t + 0.03, 1.1, 0.45); thump(t + 0.04, 70, 40, 0.4, 0.4, 0.4); },
  /** Le levier principal : la lame entre en force, gros impact, puis les rangées de lumières s'allument jusqu'au joueur. */
  lever() {
    const t = now(), a = A();
    sweepNoise(t, "bandpass", 900, 2800, 0.3, 0.16, 0.05, 0.3); click(t + 0.02, 3000, 3, 0.004, 0.12);
    const c = t + LEVER_HIT;
    crackle(c - 0.015, 0.12, 9000, 0.5, 1100, 0.5); contactor(c, 1.2, 0.7);
    impact(c + 0.01, 1, 2.2);
    const hg = a.createGain(); hg.gain.setValueAtTime(0, c + 0.05); hg.gain.linearRampToValueAtTime(0.18, c + 0.2); hg.gain.exponentialRampToValueAtTime(0.05, c + 1.1);
    hg.gain.exponentialRampToValueAtTime(0.16, c + 2.05); hg.gain.exponentialRampToValueAtTime(0.0001, c + 3.6);
    const hl = filt("lowpass", 1000, 0.8); hg.connect(hl); hl.connect(out(0.5));
    [[50, 0.5], [100, 1], [200, 0.6], [300, 0.45], [400, 0.3], [600, 0.12]].forEach(([f, g]) => { const o = osc("sine", f), og = a.createGain(); og.gain.value = g; o.connect(og); og.connect(hg); o.start(c + 0.05); o.stop(c + 3.7); });
    LEVER_LIGHTS.forEach((d, i) => { curFar = Math.max(0, 0.95 - i * 0.16); curPan = (i % 2 ? 0.5 : -0.5) * (0.4 + i * 0.1); contactor(c + d, 0.45 + i * 0.1, 0.6); tube(c + d + 0.04, 0.4 + i * 0.08); curFar = 0; curPan = 0; });
    contactor(c + 2.05, 1.3, 0.6); thump(c + 2.05, 70, 32, 0.8, 0.55, 0.6); crackle(c + 2.04, 0.2, 7000, 0.35, 1200, 0.6);
  },
  /** L'orage qui suit le levier : trois éclairs qui claquent, le tonnerre qui roule, l'électricité qui grésille. */
  storm() {
    const t = now(), a = A();
    STORM_STRIKES.forEach((d, i) => {
      curPan = [0, 0.6, -0.6][i] ?? 0;
      const g = [1, 0.8, 0.9][i] ?? 0.8;
      click(t + d, 5200, 0.5, 0.004, 0.95 * g, 0.7); crackle(t + d, 0.3, 9000, 0.6 * g, 1000, 0.7);
      thump(t + d, 95, 28, 0.7, 0.65 * g, 0.7); buzz(t + d + 0.01, 0.9, 0.08 * g, 2400, 350, 2.5, 0.005, 0.6);
      curPan = 0;
    });
    // le tonnerre roule : grave qui s'éloigne, avec des « vagues »
    [[0.15, 3.4, 0.6], [0.7, 2.8, 0.4]].forEach(([d, dur, gain]) => {
      const s = noise(t + d, dur + 0.1, brownBuf!), lp = filt("lowpass", 1800, 0.8); lp.frequency.setValueAtTime(1800, t + d); lp.frequency.exponentialRampToValueAtTime(110, t + d + dur);
      const e = a.createGain(); e.gain.setValueAtTime(0.0001, t + d); e.gain.exponentialRampToValueAtTime(gain, t + d + 0.08); e.gain.exponentialRampToValueAtTime(0.0001, t + d + dur);
      const am = a.createGain(); am.gain.value = 0.7; const lfo = osc("sine", 3 + Math.random() * 3), lg = a.createGain(); lg.gain.value = 0.3; lfo.connect(lg); lg.connect(am.gain);
      s.connect(lp); lp.connect(am); am.connect(e); e.connect(out(0.9)); lfo.start(t + d); lfo.stop(t + d + dur + 0.1);
    });
    const sub = osc("sine", 48); sub.frequency.setValueAtTime(48, t + 0.1); sub.frequency.exponentialRampToValueAtTime(28, t + 2.2);
    const se = env(t + 0.1, 0.05, 0.45, 0.3, 1.8); sub.connect(se); se.connect(out(0.3)); sub.start(t + 0.1); sub.stop(t + 2.4);
    crackle(t + 0.4, 2.2, 260, 0.06, 2600, 0.8);
  },
  /** Livraison vérifiée : quatre relais francs, un contacteur, puis deux notes électriques. */
  delivery() {
    const t = now();
    [0, 0.2, 0.4, 0.6].forEach((d, i) => { relay(t + d, 1.1); ring(t + d, [1600 + i * 400], 0.06, 0.05); buzz(t + d + 0.02, 0.12, 0.04, 900 + i * 300, 1200 + i * 300, 3, 0.01, 0.2); });
    contactor(t + 0.85, 1, 0.4); zap(t + 0.88, 0.9);
    tesla(t + 1.05, 659.25, 0.12, 0.08); tesla(t + 1.2, 987.77, 0.35, 0.08);
  },
  badge() { const t = now(); relay(t, 0.8); tesla(t + 0.08, 880, 0.1, 0.05); tesla(t + 0.2, 1318.5, 0.22, 0.05); },
  alarm() {
    const t = now();
    for (let i = 0; i < 3; i++) {
      const s = t + i * 0.7; relay(s, 0.5);
      [415, 440].forEach((f) => { const o = osc("sawtooth", f), b = filt("bandpass", 950, 1.3), e = env(s + 0.01, 0.02, 0.07, 0.4, 0.06); o.connect(b); b.connect(e); e.connect(out(0.35)); o.start(s); o.stop(s + 0.6); });
    }
  },
  /** Montée de grade « Accréditation » : un faisceau scanne, quatre verrous s'ouvrent, la puissance s'installe. */
  levelup() {
    const t = now(), a = A();
    const g = a.createGain(); let dest: AudioNode = master!;
    if (a.createStereoPanner && rev) { const p = a.createStereoPanner(); p.pan.setValueAtTime(-0.85, t); p.pan.linearRampToValueAtTime(0.85, t + 0.9); g.connect(p); p.connect(master!); const sd = a.createGain(); sd.gain.value = 0.35; p.connect(sd); sd.connect(rev); dest = g; }
    const n = noise(t, 1.0), b = filt("bandpass", 500, 5); b.frequency.setValueAtTime(500, t); b.frequency.exponentialRampToValueAtTime(5200, t + 0.9);
    const e = env(t, 0.08, 0.16, 0.62, 0.2); n.connect(b); b.connect(e); e.connect(dest === master ? out(0.35) : g);
    for (let i = 0; i < 9; i++) click(t + i * 0.1, 3400, 6, 0.003, 0.06, 0.2);
    LEVELUP_LOCKS.forEach((d, i) => { curPan = [-0.6, 0.6, -0.3, 0.3][i]; contactor(t + d, 0.75 + i * 0.1, 0.5); sweepNoise(t + d + 0.03, "highpass", 3200, 1500, 0.16, 0.07, 0.01, 0.4); curPan = 0; });
    const h = t + LEVELUP_HIT;
    thump(h, 75, 34, 0.7, 0.55, 0.6); click(h, 4200, 0.6, 0.005, 0.5, 0.6);
    powerChord(h, 2.6, 0.2, 55); crackle(h + 0.05, 1.8, 350, 0.05, 5000, 0.8);
  },
  /**
   * Réveil « Défibrillateur », version renforcée (retour du propriétaire, 15/11/2026 : « plus marquant, plus stimulant ») :
   * la charge siffle et monte, des relais s'emballent, le bip « chargé » retentit, un silence, puis une décharge
   * énorme (grave qui tombe, coup saturé, arc large), le cœur électrique du membre repart en battements lourds,
   * et ses systèmes démarrent à pleine puissance.
   */
  awaken() {
    const t = now(), h = WAKE_HIT, a = A();
    // 1. la charge : deux sifflements qui battent entre eux, un souffle qui monte, des relais qui accélèrent
    const g = a.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.09, t + 1.42); g.gain.linearRampToValueAtTime(0, t + 1.45);
    g.connect(out(0.3));
    [700, 706].forEach((f) => { const o = osc("sine", f); o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(f * 4.6, t + 1.42); o.connect(g); o.start(t); o.stop(t + 1.5); });
    sweepNoise(t, "highpass", 400, 7000, 1.42, 0.09, 1.35, 0.3);
    let d = 0.1, step = 0.22, i = 0;
    while (d < 1.4) { curPan = i % 2 ? 0.5 : -0.5; relay(t + d, 0.3 + 0.6 * d / 1.4); curPan = 0; d += step; step = Math.max(0.03, step * 0.8); i++; }
    // 2. le bip « chargé », puis un silence
    const bp = osc("square", 2350), bl = filt("lowpass", 4000), be = env(t + 1.48, 0.005, 0.05, 0.22, 0.02); bp.connect(bl); bl.connect(be); be.connect(out(0.2)); bp.start(t + 1.48); bp.stop(t + 1.8);
    // 3. la décharge
    impact(t + h, 1.35, 2.8);
    thump(t + h, 140, 34, 0.7, 0.9, 0.5); body(t + h, 500, 0.25, 0.7, 0.6); zap(t + h + 0.01, 1.1);
    sweepNoise(t + h + 0.25, "highpass", 1900, 800, 1.2, 0.18, 0.05, 0.6);
    // 4. le cœur électrique repart : battements lourds, saturés, avec un arc à chaque coup
    WAKE_BEATS.forEach((bd, k) => {
      const tb = t + h + bd, gb = [0.75, 0.6, 0.95, 0.8][k];
      thump(tb, 70, 38, 0.35, gb, 0.45);
      const kk = osc("sine", 130); kk.frequency.setValueAtTime(130, tb); kk.frequency.exponentialRampToValueAtTime(45, tb + 0.12);
      const ws = a.createWaveShaper(); ws.curve = curve; const ke = env(tb, 0.001, 0.35 * gb, 0.02, 0.18); kk.connect(ws); ws.connect(ke); ke.connect(out(0.4)); kk.start(tb); kk.stop(tb + 0.3);
      crackle(tb, 0.12, 6000, 0.25 * gb, 1100, 0.4);
      buzz(tb, 0.3, 0.07 * gb, 300, 120, 2, 0.01, 0.35);
    });
    // 5. ses systèmes démarrent : appel de puissance, contacteur, accord grave qui s'installe
    const s = t + h + WAKE_SYSTEMS;
    sweepNoise(s - 0.45, "lowpass", 300, 5000, 0.45, 0.14, 0.42, 0.4);
    contactor(s, 1.2, 0.6); thump(s, 80, 30, 0.9, 0.7, 0.6); crackle(s, 0.3, 8000, 0.4, 1100, 0.6);
    powerChord(s, 3, 0.24, 55);
    crackle(s + 0.3, 1.5, 300, 0.05, 4000, 0.8);
  },
} satisfies Record<string, () => void>;

/** Montée de grade : les quatre verrous, puis l'instant où la puissance s'installe (secondes). */
export const LEVELUP_LOCKS = [1.0, 1.2, 1.4, 1.6], LEVELUP_HIT = 1.95;
/** Réveil : battements du cœur électrique après la décharge, puis démarrage de ses systèmes (secondes après WAKE_HIT). */
export const WAKE_BEATS = [0.75, 0.98, 1.65, 1.88], WAKE_SYSTEMS = 2.4;

export type Sfx = keyof typeof SOUNDS;

/** Une touche du clavier « Feutré » : un petit clic étouffé et aigu, sans grave. */
function keySound(kind: "char" | "space" | "enter") {
  const t = now() + 0.002, v = 0.7 + Math.random() * 0.5, p = 0.9 + Math.random() * 0.2, big = kind !== "char";
  click(t, (big ? 2300 : 3000) * p, 1.1, 0.005, (big ? 0.15 : 0.11) * v, 0.05, 3800);
  band(t + 0.001, (big ? 760 : 1050) * p, 1.6, big ? 0.03 : 0.018, (big ? 0.2 : 0.13) * v, 0.05);
  click(t + 0.045 + Math.random() * 0.04, 2700 * p, 1.3, 0.003, 0.022 * v, 0.03, 3600);
}

// ---------------- fabrication hors temps réel ----------------
// Durée (s), stéréo ou non, nombre de variantes. L'ordre est celui de la préparation : les sons courts et
// fréquents d'abord (le clavier du BIOS joue quelques instants après le premier toucher).
interface Recipe { id: string; dur: number; stereo?: boolean; variants?: number; make: () => void }
const RECIPES: Recipe[] = [
  ...(["char", "space", "enter"] as const).map((k) => ({ id: `key-${k}`, dur: 0.25, variants: 4, make: () => keySound(k) })),
  { id: "tap", dur: 0.25, variants: 2, make: SOUNDS.tap },
  { id: "open", dur: 0.4, variants: 2, make: SOUNDS.open },
  { id: "relay", dur: 0.4, variants: 2, make: SOUNDS.relay },
  { id: "ok", dur: 0.9, variants: 3, make: SOUNDS.ok },
  { id: "ko", dur: 1.0, variants: 2, make: SOUNDS.ko },
  { id: "cell", dur: 1.2, variants: 2, make: SOUNDS.cell },
  { id: "lever", dur: 4.4, stereo: true, make: SOUNDS.lever },
  { id: "storm", dur: 4.4, stereo: true, make: SOUNDS.storm },
  { id: "power", dur: 1.3, make: SOUNDS.power },
  { id: "badge", dur: 1.0, make: SOUNDS.badge },
  { id: "charge", dur: 2.6, make: SOUNDS.charge },
  { id: "plug", dur: 2.3, make: SOUNDS.plug },
  { id: "circuit-fail", dur: 2.0, make: SOUNDS["circuit-fail"] },
  { id: "breaker", dur: 0.9, make: SOUNDS.breaker },
  { id: "delivery", dur: 2.2, make: SOUNDS.delivery },
  { id: "alarm", dur: 2.4, make: SOUNDS.alarm },
  { id: "levelup", dur: 4.8, stereo: true, make: SOUNDS.levelup },
  { id: "awaken", dur: 8.0, stereo: true, make: SOUNDS.awaken },
];
const ready = new Map<string, AudioBuffer[]>();
let preparing = false;

type OfflineCtor = new (channels: number, length: number, rate: number) => OfflineAudioContext;
function render(dur: number, stereo: boolean, make: () => void): Promise<AudioBuffer> {
  const C = (window.OfflineAudioContext || (window as unknown as { webkitOfflineAudioContext?: OfflineCtor }).webkitOfflineAudioContext) as OfflineCtor | undefined;
  if (!C) return Promise.reject(new Error("OfflineAudioContext indisponible"));
  const oc = new C(stereo ? 2 : 1, Math.ceil(dur * SR), SR);
  const m = oc.createGain(); m.connect(oc.destination);
  const r = oc.createConvolver(); r.buffer = irBuf; r.connect(oc.destination);
  const keep = { ctx, master, rev };
  ctx = oc; master = m; rev = r;
  try { make(); } finally { ctx = keep.ctx; master = keep.master; rev = keep.rev; }
  return new Promise((resolve, reject) => {
    oc.oncomplete = (e) => resolve(e.renderedBuffer);
    try { const p = oc.startRendering() as Promise<AudioBuffer> | undefined; if (p && typeof p.then === "function") p.then(resolve, reject); } catch (e) { reject(e); }
  });
}
const pause = () => new Promise<void>((r) => window.setTimeout(r, 0));
/** Fabrique tous les sons, un par un, sans bloquer l'appli. */
async function prepare() {
  if (preparing) return; preparing = true;
  noiseBuf = noiseBuf ?? makeNoise(2.5, false); brownBuf = brownBuf ?? makeNoise(4, true); irBuf = irBuf ?? makeIR(1.6, 2.6); curve = curve ?? makeCurve(30);
  for (const rc of RECIPES) {
    const out: AudioBuffer[] = [];
    for (let v = 0; v < (rc.variants ?? 1); v++) { try { out.push(await render(rc.dur, !!rc.stereo, rc.make)); } catch { /* ce son restera muet */ } await pause(); }
    if (out.length) ready.set(rc.id, out);
  }
  for (const [i, ev] of EVENTS.entries()) {
    const out: AudioBuffer[] = [];
    for (let v = 0; v < 2; v++) { try { out.push(await render(1.2, false, () => { curFar = 0.3 + Math.random() * 0.6; try { ev[1](1); } finally { curFar = 0; } })); } catch { /* muet */ } await pause(); }
    if (out.length) ready.set(`amb-${i}`, out);
  }
}
/** Joue un son préparé : un lecteur, un volume (et une position gauche/droite pour le fond). */
function playBuffer(id: string, bus: AudioNode | null, gain = 1, pan = 0) {
  const list = ready.get(id); if (!rt || !bus || !list?.length) return;
  if (rt.state === "suspended" && document.visibilityState === "visible") rt.resume().catch(() => {});
  const src = rt.createBufferSource(); src.buffer = list[Math.floor(Math.random() * list.length)];
  let node: AudioNode = src;
  if (gain !== 1) { const g = rt.createGain(); g.gain.value = gain; node.connect(g); node = g; }
  if (pan && rt.createStereoPanner) { const p = rt.createStereoPanner(); p.pan.value = pan; node.connect(p); node = p; }
  node.connect(bus); src.start();
}

// Garde-fou : un même son ne repart pas avant 180 ms, et jamais plus de 6 effets en une demi-seconde
// (par exemple plusieurs badges débloqués d'un coup) : au-delà, les suivants sont ignorés.
const lastPlayed: Partial<Record<Sfx, number>> = {};
let recent: number[] = [];
function allowed(name: Sfx) {
  const t = performance.now();
  if (t - (lastPlayed[name] ?? -1e9) < 180) return false;
  recent = recent.filter((x) => t - x < 500);
  if (recent.length >= 6) return false;
  lastPlayed[name] = t; recent.push(t);
  return true;
}

/** Joue un effet sonore (si les effets sont activés et le son débloqué). Le son n'est jamais bloquant. */
export function sfx(name: Sfx) {
  if (!getState().settings.sound || !unlocked || !allowed(name)) return;
  try { playBuffer(name, fxBus); } catch { /* le son n'est jamais bloquant */ }
}

/** Une touche du clavier « Feutré ». */
export function key(kind: "char" | "space" | "enter" = "char") {
  if (!getState().settings.sound || !unlocked) return;
  try { playBuffer(`key-${kind}`, fxBus); } catch { /* le son n'est jamais bloquant */ }
}

// ---------------- le fond sonore de la réserve ----------------
// Ronronnement des transformateurs, ventilation (en direct : peu d'éléments, qui durent), et des événements variés
// au loin (grésillements, petits courts-circuits, relais, néon qui hésite : préparés à l'avance, joués à gauche ou
// à droite au hasard). Plus l'énergie de l'équipe est haute, plus la salle s'anime.
interface Amb { g: GainNode; humG: GainNode; buzzG: GainNode; nodes: AudioScheduledSourceNode[]; timer: number }
let amb: Amb | null = null;
let ambLevel = 0.3, ambVolume = 0.6;
const EVENTS: [number, (gf: number) => void][] = [
  [3, (gf) => crackle(now(), 0.03 + Math.random() * 0.1, 400 + Math.random() * 1500, 0.025 * gf, 2600, 0.6)],
  [2, (gf) => relay(now(), 0.22 * gf)],
  [2, (gf) => { const t = now(); buzz(t, 0.35 + Math.random() * 0.5, 0.035 * gf, 1300, 1700, 3, 0.08, 0.6); crackle(t + 0.05, 0.3, 900, 0.018 * gf, 3000, 0.6); }],
  [1, (gf) => { const t = now(); crackle(t, 0.05, 9000, 0.06 * gf, 1000, 0.6); thump(t, 160, 60, 0.12, 0.05 * gf, 0.6); }],
  [1.5, (gf) => { const t = now(), n = 3 + Math.floor(Math.random() * 4); let d = 0; for (let i = 0; i < n; i++) { d += 0.04 + Math.random() * 0.06; buzz(t + d, 0.03, 0.03 * gf, 1200, 1200, 1.5, 0.004, 0.5); } }],
  [1, (gf) => { const t = now(), n = 3 + Math.floor(Math.random() * 4); for (let i = 0; i < n; i++) relay(t + i * (0.025 + Math.random() * 0.04), 0.12 * gf); }],
  [0.8, (gf) => contactor(now(), 0.22 * gf, 0.9)],
  [0.5, (gf) => { const t = now(), o = osc("sine", 3000); o.frequency.setValueAtTime(3000, t); o.frequency.linearRampToValueAtTime(3400, t + 1.2); const e = env(t, 0.4, 0.005 * gf, 0.3, 0.5); o.connect(e); e.connect(out(0.5)); o.start(t); o.stop(t + 1.3); }],
];
function ambEvent() {
  if (!amb) return;
  const tot = EVENTS.reduce((s, e) => s + e[0], 0); let r = Math.random() * tot, k = 0;
  for (const [i, e] of EVENTS.entries()) { r -= e[0]; if (r <= 0) { k = i; break; } }
  playBuffer(`amb-${k}`, amb.g, 0.4 + 0.6 * ambLevel, Math.random() * 1.6 - 0.8);
}
function ambStart() {
  const a = rt; if (!a || amb || !ambBus || !brownBuf) return;
  const t = a.currentTime, g = a.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(ambVolume, t + 2.5); g.connect(ambBus);
  const keep = ctx; ctx = a;
  try {
    const humG = a.createGain(); humG.gain.value = 0.006 + 0.014 * ambLevel;
    const lp = filt("lowpass", 800, 0.7); humG.connect(lp); lp.connect(g);
    const nodes: AudioScheduledSourceNode[] = [];
    [[50, 0.3], [100, 1], [200, 0.5], [300, 0.3], [400, 0.16], [500, 0.08]].forEach(([f, v]) => { const o = osc("sine", f * (1 + (Math.random() - 0.5) * 0.003)), og = a.createGain(); og.gain.value = v; o.connect(og); og.connect(humG); o.start(); nodes.push(o); });
    const lfo = osc("sine", 0.07), lg = a.createGain(); lg.gain.value = 0.003; lfo.connect(lg); lg.connect(humG.gain); lfo.start(); nodes.push(lfo);
    const bz = osc("sawtooth", 100), bb = filt("bandpass", 2400, 6), buzzG = a.createGain(); buzzG.gain.value = 0.0035 * ambLevel; bz.connect(bb); bb.connect(buzzG); buzzG.connect(g); bz.start(); nodes.push(bz);
    const air = a.createBufferSource(); air.buffer = brownBuf; air.loop = true; const al = filt("lowpass", 380, 0.5), ag = a.createGain(); ag.gain.value = 0.045;
    const alfo = osc("sine", 0.05), alg = a.createGain(); alg.gain.value = 120; alfo.connect(alg); alg.connect(al.frequency);
    air.connect(al); al.connect(ag); ag.connect(g); air.start(); alfo.start(); nodes.push(air, alfo);
    amb = { g, humG, buzzG, nodes, timer: 0 };
  } finally { ctx = keep; }
  const next = () => { if (!amb) return; amb.timer = window.setTimeout(() => { if (document.visibilityState === "visible") { try { ambEvent(); } catch { /* jamais bloquant */ } } next(); }, (1000 + 4500 * (1 - ambLevel)) * (0.5 + Math.random())); };
  next();
}
function ambStop() {
  if (!amb || !rt) return;
  const a = amb; amb = null; window.clearTimeout(a.timer);
  const t = rt.currentTime; a.g.gain.cancelScheduledValues(t); a.g.gain.setValueAtTime(a.g.gain.value, t); a.g.gain.linearRampToValueAtTime(0, t + 0.8);
  window.setTimeout(() => a.nodes.forEach((o) => { try { o.stop(); } catch { /* déjà arrêté */ } }), 1000);
}
/**
 * Met le fond sonore en accord avec les réglages. Il ne démarre qu'après un geste du joueur (Safari n'autorise le
 * son qu'après un toucher) : l'appli le rappelle à chaque toucher.
 */
export function syncAmbience() {
  const s = getState().settings;
  ambVolume = Math.max(0, Math.min(1, s.ambienceVolume ?? 0.6));
  if (!s.ambience) { ambStop(); return; }
  if (!unlocked) return;
  if (!amb) { try { ambStart(); } catch { /* jamais bloquant */ } }
  else if (rt) amb.g.gain.setTargetAtTime(ambVolume, rt.currentTime, 0.2);
}
/** Volume des effets sonores (réglage « sfxVolume », de 0 à 1), appliqué tout de suite si le son est prêt. */
export function syncSfxVolume() {
  if (!fxBus || !rt) return;
  const v = Math.max(0, Math.min(1, getState().settings.sfxVolume ?? 1));
  fxBus.gain.setTargetAtTime(0.85 * v, rt.currentTime, 0.05);
}
/** Énergie de la réserve (0 à 1) : plus elle est haute, plus la salle ronronne et s'anime. */
export function setAmbienceLevel(x: number) {
  ambLevel = Math.max(0, Math.min(1, x));
  if (!amb || !rt) return;
  const t = rt.currentTime; amb.humG.gain.setTargetAtTime(0.006 + 0.014 * ambLevel, t, 0.6); amb.buzzG.gain.setTargetAtTime(0.0035 * ambLevel, t, 0.6);
}
/**
 * Débloque le son : à appeler pendant un toucher du joueur. Safari sur iPhone n'autorise le son qu'à la fin d'un
 * vrai geste (relâcher le doigt, « click »), pas au simple appui : on joue alors un son vide pour ouvrir la voie,
 * puis on prépare tous les sons en arrière-plan.
 */
export function unlockAudio() {
  try {
    if (!rt) {
      const C = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!C) return;
      try { const s = (navigator as unknown as { audioSession?: { type: string } }).audioSession; if (s) s.type = "playback"; } catch { /* facultatif */ }
      rt = new C();
      const comp = rt.createDynamicsCompressor();
      comp.threshold.value = -16; comp.knee.value = 12; comp.ratio.value = 5; comp.attack.value = 0.002; comp.release.value = 0.25;
      comp.connect(rt.destination);
      fxBus = rt.createGain(); fxBus.gain.value = 0.85 * Math.max(0, Math.min(1, getState().settings.sfxVolume ?? 1)); fxBus.connect(comp);
      ambBus = rt.createGain(); ambBus.gain.value = 0.85; ambBus.connect(comp);
    }
    unlocked = true;
    if (rt.state !== "running") rt.resume().catch(() => {});
    const s = rt.createBufferSource(); s.buffer = rt.createBuffer(1, 1, 22050); s.connect(rt.destination); s.start(0);
    void prepare();
  } catch { /* le son n'est jamais bloquant */ }
}
/** Débloque le son au premier geste (Safari), et coupe tout quand l'appli passe en arrière-plan. */
export function installAudioUnlock() {
  const unlock = () => { if (getState().settings.sound || getState().settings.ambience) { unlockAudio(); syncAmbience(); } };
  // Gestes qui comptent pour Safari : relâcher le doigt, « click », une touche du clavier.
  for (const ev of ["pointerup", "touchend", "click", "keydown"]) window.addEventListener(ev, unlock, { capture: true });
  document.addEventListener("visibilitychange", () => {
    if (!rt) return;
    if (document.visibilityState === "hidden") rt.suspend().catch(() => {});
    else if (getState().settings.sound || getState().settings.ambience) rt.resume().catch(() => {});
  });
}
