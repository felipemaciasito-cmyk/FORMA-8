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
import { FRAME, mixReady, robotize, type Filtre, type Ready } from "./robot";

interface Recording { fichier: string; voix: string; envoye: string; texte: string; date: string; duo?: { fichier: string; voix: string } }
type Personnage = {
  nom: string; voix: string | null; filtre: Filtre; dose?: number;
  /** Effets superposés : noms de variantes, chacune appliquée à la voix, puis mélangées. */
  effets?: string[]; variantes?: Record<string, { filtre: Filtre }>;
};
/** Les filtres d'un personnage : un seul, ou plusieurs variantes superposées. */
function filtresOf(who: Personnage): Filtre[] {
  const list = (who.effets ?? []).map((n) => who.variantes?.[n]?.filtre).filter((f): f is Filtre => !!f);
  return list.length ? list : [who.filtre];
}

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

function voiceUrl(file: string) { return `${import.meta.env.BASE_URL}voix/${file}`; }

/** Charge et prépare une réplique (une seule fois). */
function prepare(speaker: Speaker, key: string): Promise<Ready | null> {
  const hit = cache.get(key); if (hit) { remember(key, hit); return Promise.resolve(hit); }
  const busy = pending.get(key); if (busy) return busy;
  const rec = RECORDINGS[key], who = PERSONNAGES[speaker], io = audioOutput();
  if (!rec || !who || !io) return Promise.resolve(null);
  const job = (async () => {
    try {
      // Une ou deux voix (« duo » : deux voix disent la même réplique), un ou plusieurs effets superposés.
      const files = [rec.fichier, ...(rec.duo ? [rec.duo.fichier] : [])];
      const raws = await Promise.all(files.map(async (f) => {
        const res = await fetch(voiceUrl(f));
        if (!res.ok) throw new Error(`voix introuvable : ${f}`);
        return decode(io.rt, await res.arrayBuffer());
      }));
      const parts: Ready[] = [];
      for (const raw of raws) for (const f of filtresOf(who)) parts.push(await robotize(raw, f, who.dose ?? 1));
      const ready = mixReady(parts);
      remember(key, ready);
      return ready;
    } catch { return null; } // une voix n'est jamais bloquante
    finally { pending.delete(key); }
  })();
  pending.set(key, job);
  return job;
}

// ---------- Lecture : une seule voix à la fois ----------
let current: { src: AudioBufferSourceNode; key: string; raf: number; auto: boolean; speaker: Speaker; md: string } | null = null;
let loading = ""; // réplique en cours de préparation : elle compte déjà comme « en train de parler »
let loadingAuto: { speaker: Speaker; md: string } | null = null;
// Lecture automatique : une seule fois par séance pour chaque réplique (revenir sur un écran ne la relance pas ;
// le bouton « Réécouter » reste là).
const autoDone = new Set<string>();
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
export function stopVoice() { queue = []; loading = ""; loadingAuto = null; stopCurrent(); }

/** Arrête seulement la voix en cours (fin d'une cérémonie) : la file d'attente reste. */
export function stopSpeaking() { if (current && !current.auto) stopCurrent(); }

function next() {
  if (hold) return; // une cérémonie couvre l'écran : la file attend qu'elle se ferme
  const n = queue.shift();
  if (n) void play(n.speaker, n.md, true);
}

async function play(speaker: Speaker, md: string, auto = false): Promise<number | null> {
  const key = voiceKey(speaker, md), io = audioOutput();
  if (!io) return null;
  if (auto) autoDone.add(key);
  loading = key; loadingAuto = auto ? { speaker, md } : null;
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
  current = { src, key, raf: requestAnimationFrame(tick), auto, speaker, md };
  if (hold) heardDuringHold.add(key);
  src.onended = () => { if (current?.src === src) { stopCurrent(); next(); } };
  duckAmbience(true);
  src.start();
  return ready.buffer.duration;
}

// ---------- Cérémonies plein écran : personne d'autre ne parle derrière ----------
// Remarque du propriétaire (16/11/2026) : pendant une cérémonie de grade, le personnage de la page suivante, encore
// caché dessous, lisait déjà sa réplique. Règle : un personnage ne parle pas tant qu'il n'est pas visible. Pendant
// une cérémonie, les lectures automatiques attendent donc dans la file ; elles partent à sa fermeture (sauf la
// réplique que la cérémonie vient de faire entendre, comme celle du réveil).
let hold = 0;
const heardDuringHold = new Set<string>();
export function holdVoices(on: boolean) {
  if (on) {
    if (hold++ === 0) {
      heardDuringHold.clear();
      // Une réplique automatique déjà lancée derrière la cérémonie s'arrête et reprendra à sa fermeture.
      if (current?.auto) { const c = current; autoDone.delete(c.key); queue = [{ speaker: c.speaker, md: c.md }]; stopCurrent(); }
      if (loading && loadingAuto) { autoDone.delete(loading); queue = [...queue, loadingAuto]; }
      loading = ""; loadingAuto = null;
    }
    return;
  }
  hold = Math.max(0, hold - 1);
  if (hold) return;
  queue = queue.filter((q) => !heardDuringHold.has(voiceKey(q.speaker, q.md)));
  if (!current) next();
}

/**
 * Fait parler un personnage. `auto` : lecture à l'apparition d'une bulle (attend son tour si quelqu'un parle déjà) ;
 * sinon le joueur a touché « Réécouter » : la voix en cours s'arrête et celle-ci part tout de suite.
 * Renvoie la durée de la réplique (en secondes) quand elle démarre, ou null si elle ne peut pas être jouée.
 */
export function speak(speaker: Speaker, md: string, auto = false): Promise<number | null> {
  if (!getState().settings.voices || !hasVoice(speaker, md) || !audioOutput()) return Promise.resolve(null);
  if (auto && autoDone.has(voiceKey(speaker, md))) return Promise.resolve(null);
  if (auto && (current || loading || hold)) {
    const key = voiceKey(speaker, md);
    if (current?.key !== key && loading !== key && !queue.some((q) => voiceKey(q.speaker, q.md) === key)) queue = [...queue.slice(-1), { speaker, md }];
    return Promise.resolve(null);
  }
  queue = [];
  return play(speaker, md, auto);
}

/** Volume des voix, appliqué tout de suite. */
export function syncVoiceVolume() {
  if (!bus) return;
  bus.gain.value = Math.max(0, Math.min(1, getState().settings.voiceVolume ?? 1)) * 1.15;
  if (!getState().settings.voices) stopVoice();
}

// Petit indicateur pour les tests de bout en bout : la dernière réplique lancée.
if (typeof window !== "undefined") onVoice((s) => { if (s.speaking) (window as unknown as { __forma8Voice?: string }).__forma8Voice = s.key; });
