// Voix de l'équipe : chaque membre lit ses propres répliques (lot du 16/11/2026, choix du propriétaire).
//
// Les voix sont des fichiers mp3 enregistrés une fois avec ElevenLabs (public/voix), jamais générés dans l'appli :
// ni clé de plus sur l'appareil, ni coût à l'écoute. L'appli y ajoute la touche robotique propre à chaque
// personnage (src/content/voix.json, champ « filtre »).
//
// Comme pour les effets sonores (src/lib/sound.ts), rien n'est calculé en temps réel : la version robotique d'une
// réplique est fabriquée une fois, hors temps réel (OfflineAudioContext), puis simplement rejouée. Sur Safari, le
// traitement en direct faisait planter la page (lot « son et lumière », 15/11/2026).
import VOIX from "../content/voix.json";
import REC from "../content/voix-enregistrements.json";
import { voiceKey } from "./voice-key";
import { audioOutput, duckAmbience } from "./sound";
import { getState } from "./store";

export interface Filtre {
  hp?: number; lp?: number; sature?: number; crepite?: number; souffle?: number;
  anneau?: { f: number; mix: number };
  peigne?: { ms: number; retour: number; mix: number };
  tourne?: { ms: number; prof: number; vitesse: number; mix: number };
  choeur?: { voix: number; ms: number; prof: number; mix: number };
  salle?: { s: number; mix: number };
  grain?: { pas: number; bits: number };
}
interface Recording { fichier: string; voix: string; envoye: string; texte: string; date: string }
type Personnage = { nom: string; voix: string | null; filtre: Filtre };

const PERSONNAGES = VOIX.personnages as unknown as Record<string, Personnage>;
const RECORDINGS = (REC as unknown as { repliques: Record<string, Recording> }).repliques;
export type Speaker = string;

/** Le personnage qui parle dans un caisson (« c00 » est ORA). */
export const speakerOf = (roomId: string): Speaker => (roomId === "c00" ? "ora" : roomId);

/** Vrai si cette réplique a une voix enregistrée. */
export function hasVoice(speaker: Speaker, md: string) {
  return !!RECORDINGS[voiceKey(speaker, md)];
}

// ---------- État partagé avec l'interface (qui parle, et à quel niveau sonore) ----------
export interface VoiceState { key: string; speaking: boolean; level: number }
let state: VoiceState = { key: "", speaking: false, level: 0 };
const listeners = new Set<(s: VoiceState) => void>();
function emit(next: VoiceState) { state = next; listeners.forEach((f) => f(state)); }
export function getVoiceState() { return state; }
export function onVoice(f: (s: VoiceState) => void) { listeners.add(f); return () => { listeners.delete(f); }; }

// ---------- Fabrication de la version robotique ----------
const SR = 24000; // suffisant pour une voix, et deux fois moins de mémoire qu'en 48 kHz
const FRAME = 0.04; // une valeur de niveau toutes les 40 ms, pour animer le personnage
interface Ready { buffer: AudioBuffer; levels: Float32Array }
const cache = new Map<string, Ready>(); // quelques répliques au plus (voir remember)
const pending = new Map<string, Promise<Ready | null>>();

function remember(key: string, r: Ready) {
  cache.delete(key); cache.set(key, r);
  while (cache.size > 6) cache.delete(cache.keys().next().value as string);
}

function decode(rt: AudioContext, data: ArrayBuffer): Promise<AudioBuffer> {
  // Forme à rappels : acceptée par toutes les versions de Safari.
  return new Promise((resolve, reject) => { rt.decodeAudioData(data, resolve, reject); });
}

function impulse(oc: BaseAudioContext, sec: number) {
  const len = Math.max(1, Math.floor(sec * SR)), ir = oc.createBuffer(1, len, SR), d = ir.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.8);
  return ir;
}

type OfflineCtor = new (channels: number, length: number, rate: number) => OfflineAudioContext;

/** Applique le filtre d'un personnage, hors temps réel. */
async function robotize(src: AudioBuffer, f: Filtre): Promise<Ready> {
  const C = (window.OfflineAudioContext || (window as unknown as { webkitOfflineAudioContext?: OfflineCtor }).webkitOfflineAudioContext) as OfflineCtor | undefined;
  if (!C) throw new Error("OfflineAudioContext indisponible");
  const tail = (f.salle?.s ?? 0) + 0.1;
  const oc = new C(1, Math.ceil((src.duration + tail) * SR), SR);
  const s = oc.createBufferSource(); s.buffer = src;
  let head: AudioNode = s;
  const chain = (n: AudioNode) => { head.connect(n); head = n; };
  if (f.hp) { const b = oc.createBiquadFilter(); b.type = "highpass"; b.frequency.value = f.hp; b.Q.value = 0.7; chain(b); }
  if (f.lp) { const b = oc.createBiquadFilter(); b.type = "lowpass"; b.frequency.value = f.lp; b.Q.value = 0.7; chain(b); }
  if (f.sature) {
    const k = 2 + f.sature * 30, n = 1024, c = new Float32Array(n);
    for (let i = 0; i < n; i++) { const x = (i * 2) / n - 1; c[i] = ((1 + k) * x) / (1 + k * Math.abs(x)); }
    const w = oc.createWaveShaper(); w.curve = c; chain(w);
    const g = oc.createGain(); g.gain.value = 1 / (1 + f.sature); chain(g);
  }
  const sum = oc.createGain(); sum.connect(oc.destination);
  let wet = 0;
  const send = (mix: number, build: (input: AudioNode) => AudioNode) => {
    const g = oc.createGain(); g.gain.value = mix; build(head).connect(g); g.connect(sum); wet += mix;
  };
  if (f.anneau) send(f.anneau.mix, (input) => {
    // Modulation en anneau : la voix multipliée par une onde lente, le timbre classique d'un robot.
    const ring = oc.createGain(); ring.gain.value = 0; const o = oc.createOscillator(); o.frequency.value = f.anneau!.f;
    o.connect(ring.gain); o.start(); input.connect(ring); return ring;
  });
  if (f.peigne) send(f.peigne.mix, (input) => {
    // Filtre en peigne : un écho très court qui se répète, timbre métallique.
    const d = oc.createDelay(0.05); d.delayTime.value = f.peigne!.ms / 1000; const fb = oc.createGain(); fb.gain.value = f.peigne!.retour;
    input.connect(d); d.connect(fb); fb.connect(d); return d;
  });
  if (f.tourne) send(f.tourne.mix, (input) => {
    // Écho court dont la longueur ondule : la voix « tourne ».
    const d = oc.createDelay(0.05); d.delayTime.value = f.tourne!.ms / 1000;
    const lfo = oc.createOscillator(); lfo.frequency.value = f.tourne!.vitesse; const depth = oc.createGain(); depth.gain.value = f.tourne!.prof / 1000;
    lfo.connect(depth); depth.connect(d.delayTime); lfo.start(); input.connect(d); return d;
  });
  if (f.choeur) send(f.choeur.mix, (input) => {
    // Plusieurs copies légèrement décalées : les drones répètent avec la meneuse.
    const m = oc.createGain(); m.gain.value = 1 / f.choeur!.voix;
    for (let v = 0; v < f.choeur!.voix; v++) {
      const d = oc.createDelay(0.1); d.delayTime.value = (f.choeur!.ms * (v + 1)) / 1000;
      const lfo = oc.createOscillator(); lfo.frequency.value = 0.3 + v * 0.17; const depth = oc.createGain(); depth.gain.value = f.choeur!.prof / 1000;
      lfo.connect(depth); depth.connect(d.delayTime); lfo.start(); input.connect(d); d.connect(m);
    }
    return m;
  });
  if (f.salle) send(f.salle.mix, (input) => { const r = oc.createConvolver(); r.buffer = impulse(oc, f.salle!.s); input.connect(r); return r; });
  const dry = oc.createGain(); dry.gain.value = Math.max(0.35, 1 - wet * 0.6); head.connect(dry); dry.connect(sum);
  s.start();
  const out = await new Promise<AudioBuffer>((resolve, reject) => {
    oc.oncomplete = (e) => resolve(e.renderedBuffer);
    try { const p = oc.startRendering() as Promise<AudioBuffer> | undefined; if (p && typeof p.then === "function") p.then(resolve, reject); } catch (e) { reject(e); }
  });
  // Retouches échantillon par échantillon : grain numérique, crépitement, souffle ; puis volume réglé.
  const d = out.getChannelData(0);
  if (f.grain) {
    const q = Math.pow(2, f.grain.bits - 1); let held = 0;
    for (let i = 0; i < d.length; i++) { if (i % f.grain.pas === 0) held = Math.round(d[i] * q) / q; d[i] = d[i] * 0.55 + held * 0.45; }
  }
  if (f.crepite) for (let i = 0; i < d.length; i++) if (Math.random() < f.crepite * 0.02) d[i] += (Math.random() * 2 - 1) * 0.25;
  if (f.souffle) for (let i = 0; i < d.length; i++) d[i] += (Math.random() * 2 - 1) * f.souffle;
  let peak = 0; for (let i = 0; i < d.length; i++) peak = Math.max(peak, Math.abs(d[i]));
  if (peak > 0) { const k = 0.9 / peak; for (let i = 0; i < d.length; i++) d[i] *= k; }
  const step = Math.floor(FRAME * SR), levels = new Float32Array(Math.ceil(d.length / step));
  let top = 0;
  for (let j = 0; j < levels.length; j++) {
    let acc = 0; const end = Math.min(d.length, (j + 1) * step);
    for (let i = j * step; i < end; i++) acc += d[i] * d[i];
    levels[j] = Math.sqrt(acc / Math.max(1, end - j * step)); top = Math.max(top, levels[j]);
  }
  if (top > 0) for (let j = 0; j < levels.length; j++) levels[j] = Math.min(1, levels[j] / top);
  return { buffer: out, levels };
}

function voiceUrl(file: string) { return `${import.meta.env.BASE_URL}voix/${file}`; }

/** Charge et prépare une réplique (une seule fois). */
function prepare(speaker: Speaker, key: string): Promise<Ready | null> {
  const hit = cache.get(key); if (hit) { remember(key, hit); return Promise.resolve(hit); }
  const busy = pending.get(key); if (busy) return busy;
  const rec = RECORDINGS[key], who = PERSONNAGES[speaker], io = audioOutput();
  if (!rec || !who || !io) return Promise.resolve(null);
  const job = (async () => {
    try {
      const res = await fetch(voiceUrl(rec.fichier));
      if (!res.ok) return null;
      const raw = await decode(io.rt, await res.arrayBuffer());
      const ready = await robotize(raw, who.filtre);
      remember(key, ready);
      return ready;
    } catch { return null; } // une voix n'est jamais bloquante
    finally { pending.delete(key); }
  })();
  pending.set(key, job);
  return job;
}

// ---------- Lecture : une seule voix à la fois ----------
let current: { src: AudioBufferSourceNode; key: string; raf: number } | null = null;
let loading = ""; // réplique en cours de préparation : elle compte déjà comme « en train de parler »
let queue: { speaker: Speaker; md: string }[] = [];
let bus: GainNode | null = null;

function stopCurrent() {
  if (!current) return;
  const c = current; current = null;
  cancelAnimationFrame(c.raf);
  try { c.src.onended = null; c.src.stop(); } catch { /* déjà arrêtée */ }
  duckAmbience(false);
  emit({ key: c.key, speaking: false, level: 0 });
}

/** Arrête la voix en cours et vide la file (changement d'écran, réglage coupé). */
export function stopVoice() { queue = []; loading = ""; stopCurrent(); }

function next() {
  const n = queue.shift();
  if (n) void play(n.speaker, n.md);
}

async function play(speaker: Speaker, md: string): Promise<number | null> {
  const key = voiceKey(speaker, md), io = audioOutput();
  if (!io) return null;
  loading = key;
  const ready = await prepare(speaker, key);
  if (loading !== key) return null; // une autre réplique a été demandée entre-temps
  loading = "";
  if (!ready) { next(); return null; }
  stopCurrent();
  if (!bus || bus.context !== io.rt) { bus = io.rt.createGain(); bus.connect(io.out); }
  bus.gain.value = Math.max(0, Math.min(1, getState().settings.voiceVolume ?? 1)) * 1.15;
  if (io.rt.state === "suspended") io.rt.resume().catch(() => {});
  const src = io.rt.createBufferSource(); src.buffer = ready.buffer; src.connect(bus);
  const t0 = io.rt.currentTime;
  const tick = () => {
    if (!current || current.src !== src) return;
    const i = Math.floor((io.rt.currentTime - t0) / FRAME);
    emit({ key, speaking: true, level: ready.levels[Math.min(ready.levels.length - 1, Math.max(0, i))] ?? 0 });
    current.raf = requestAnimationFrame(tick);
  };
  current = { src, key, raf: requestAnimationFrame(tick) };
  src.onended = () => { if (current?.src === src) { stopCurrent(); next(); } };
  duckAmbience(true);
  src.start();
  return ready.buffer.duration;
}

/**
 * Fait parler un personnage. `auto` : lecture à l'apparition d'une bulle (attend son tour si quelqu'un parle déjà) ;
 * sinon le joueur a touché « Réécouter » : la voix en cours s'arrête et celle-ci part tout de suite.
 * Renvoie la durée de la réplique (en secondes) quand elle démarre, ou null si elle ne peut pas être jouée.
 */
export function speak(speaker: Speaker, md: string, auto = false): Promise<number | null> {
  if (!getState().settings.voices || !hasVoice(speaker, md) || !audioOutput()) return Promise.resolve(null);
  if (auto && (current || loading)) {
    const key = voiceKey(speaker, md);
    if (current?.key !== key && loading !== key && !queue.some((q) => voiceKey(q.speaker, q.md) === key)) queue = [...queue.slice(-1), { speaker, md }];
    return Promise.resolve(null);
  }
  queue = [];
  return play(speaker, md);
}

/** Volume des voix, appliqué tout de suite. */
export function syncVoiceVolume() {
  if (!bus) return;
  bus.gain.value = Math.max(0, Math.min(1, getState().settings.voiceVolume ?? 1)) * 1.15;
  if (!getState().settings.voices) stopVoice();
}

// Petit indicateur pour les tests de bout en bout : la dernière réplique lancée.
if (typeof window !== "undefined") onVoice((s) => { if (s.speaking) (window as unknown as { __forma8Voice?: string }).__forma8Voice = s.key; });
