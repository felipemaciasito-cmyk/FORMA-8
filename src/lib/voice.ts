// Voix de l'équipe : chaque membre lit ses propres répliques (lot du 16/11/2026, choix du propriétaire), et toutes les
// bulles suivent une seule file de parole (lot du 17/11/2026).
//
// Les voix sont des fichiers mp3 enregistrés une fois avec ElevenLabs (public/voix), jamais générés dans l'appli :
// ni clé de plus sur l'appareil, ni coût à l'écoute. L'appli y ajoute la touche robotique propre à chaque
// personnage (src/content/voix.json, champ « filtre ») et, pour un dormeur, un grésillement qui baisse à mesure qu'il
// se réveille. Les textes écrits sur le moment par Claude sont « dits » en babillage robotique.
//
// Règles de parole (choix du propriétaire) : une seule bulle à la fois, dans l'ordre ; le texte s'écrit au rythme
// de la voix ; quand le son est coupé, la file avance quand même, au rythme de lecture.
//
// Comme pour les effets sonores (src/lib/sound.ts), rien n'est calculé en temps réel : la version robotique d'une
// réplique est fabriquée une fois, hors temps réel (OfflineAudioContext), puis simplement rejouée. Sur Safari, le
// traitement en direct faisait planter la page (lot « son et lumière », 15/11/2026).
import VOIX from "../content/voix.json";
import REC from "../content/voix-enregistrements.json";
import { voiceKey } from "./voice-key";
import { audioOutput, duckAmbience, duckSfx } from "./sound";
import { getState } from "./store";
import { gresillementDe } from "./eveil";
import { babil, FRAME, gresille, mixReady, robotize, type Babil, type Filtre, type Ready } from "./robot";

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

/** Le personnage qui parle dans un caisson (« c00 » est Forma Trisse, identifiant de voix « ora »). */
export const speakerOf = (roomId: string): Speaker => (roomId === "c00" ? "ora" : roomId);

/** Nom affiché d'un personnage. */
export const nomDe = (speaker: Speaker) => PERSONNAGES[speaker]?.nom ?? speaker;

/** Vrai si cette réplique a une voix enregistrée. */
export function hasVoice(speaker: Speaker, md: string) {
  return !!RECORDINGS[voiceKey(speaker, md)];
}

/** Clé d'une ligne de la file : celle de l'enregistrement, ou une clé de babillage. */
export const lineKey = (speaker: Speaker, md: string, babble?: Babil) => (babble ? `babil:${voiceKey(speaker, md)}` : voiceKey(speaker, md));

// ---------- Répliques déjà entendues (sur cet appareil) ----------
// Au retour sur une page, une réplique déjà entendue laisse la place à une phrase très courte (choix du propriétaire).
const HEARD_KEY = "forma8:entendu";
let heard: Set<string> | null = null;
function heardSet() {
  if (heard) return heard;
  try { heard = new Set(JSON.parse(localStorage.getItem(HEARD_KEY) ?? "[]") as string[]); } catch { heard = new Set(); }
  return heard;
}
export function entendu(key: string) { return heardSet().has(key); }
function marquerEntendu(key: string) {
  const s = heardSet(); if (s.has(key)) return;
  s.add(key);
  try { localStorage.setItem(HEARD_KEY, JSON.stringify([...s].slice(-1500))); } catch { /* stockage indisponible */ }
}

// ---------- État partagé avec l'interface (qui parle, depuis quand, combien de temps, qui attend) ----------
export interface VoiceState {
  key: string; speaking: boolean; level: number;
  /** Début (performance.now, ms) et durée (s) de la réplique en cours : le texte s'écrit à ce rythme. */
  start: number; duration: number;
  /** Lignes en attente, dans l'ordre. */
  queued: string[];
}
let state: VoiceState = { key: "", speaking: false, level: 0, start: 0, duration: 0, queued: [] };
const listeners = new Set<(s: VoiceState) => void>();
function emit(patch: Partial<VoiceState>) { state = { ...state, ...patch, queued: queue.map((q) => q.key) }; listeners.forEach((f) => f(state)); }
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

/** Charge et prépare une réplique (une seule fois), ou fabrique son babillage. */
function prepare(line: Line): Promise<Ready | null> {
  const k = line.babble ? 0 : gresillementDe(line.speaker);
  const id = `${line.key}|${k}`;
  const hit = cache.get(id); if (hit) { remember(id, hit); return Promise.resolve(hit); }
  const busy = pending.get(id); if (busy) return busy;
  const io = audioOutput();
  if (!io) return Promise.resolve(null);
  const job = (async () => {
    try {
      let ready: Ready;
      if (line.babble) ready = await babil(line.md, line.babble);
      else {
        const rec = RECORDINGS[line.key], who = PERSONNAGES[line.speaker];
        if (!rec || !who) return null;
        // Une ou deux voix (« duo » : deux voix disent la même réplique), un ou plusieurs effets superposés.
        const files = [rec.fichier, ...(rec.duo ? [rec.duo.fichier] : [])];
        const raws = await Promise.all(files.map(async (f) => {
          const res = await fetch(voiceUrl(f));
          if (!res.ok) throw new Error(`voix introuvable : ${f}`);
          return decode(io.rt, await res.arrayBuffer());
        }));
        const parts: Ready[] = [];
        for (const raw of raws) for (const f of filtresOf(who)) parts.push(await robotize(raw, f, who.dose ?? 1));
        ready = gresille(mixReady(parts), k);
      }
      remember(id, ready);
      return ready;
    } catch { return null; } // une voix n'est jamais bloquante
    finally { pending.delete(id); }
  })();
  pending.set(id, job);
  return job;
}

// ---------- Lecture : une seule ligne à la fois, dans l'ordre ----------
interface Line { speaker: Speaker; md: string; key: string; auto: boolean; babble?: Babil }
let current: { line: Line; stop: () => void } | null = null;
let loading: Line | null = null; // ligne en cours de préparation : elle compte déjà comme « en train de parler »
// Lecture automatique : une seule fois par séance pour chaque réplique (le toucher sur le personnage la relance).
const autoDone = new Set<string>();
let queue: Line[] = [];
let bus: GainNode | null = null;

function stopCurrent() {
  if (!current) return;
  const c = current; current = null;
  c.stop();
  duckAmbience(false); duckSfx(false);
  emit({ key: c.line.key, speaking: false, level: 0 });
}

/** Arrête la voix en cours et vide la file (changement d'écran, réglage coupé). */
export function stopVoice() { queue = []; loading = null; stopCurrent(); emit({}); }

/** Arrête seulement la voix en cours (fin d'une cérémonie) : la file d'attente reste. */
export function stopSpeaking() { if (current && !current.line.auto) stopCurrent(); }

/**
 * Sa bulle a disparu (page quittée, étape suivante) : la ligne quitte la file, et se tait si elle parlait. Un
 * personnage ne parle pas quand on ne le voit plus, et la bulle suivante n'attend pas derrière une voix sans bulle.
 */
export function forget(key: string) {
  if (loading?.key === key) { loading = null; window.setTimeout(next, 150); }
  if (current?.line.key === key) { stopCurrent(); window.setTimeout(next, 150); }
  if (!queue.some((q) => q.key === key)) return;
  queue = queue.filter((q) => q.key !== key); emit({});
}

function next() {
  if (hold || current || loading) return; // une cérémonie couvre l'écran : la file attend qu'elle se ferme
  const n = queue.shift();
  if (n) void play(n); else emit({});
}

/** Rythme de lecture quand rien ne s'entend : environ 55 ms par caractère, 1,6 s au moins. */
const readingTime = (md: string) => Math.max(1.6, md.replace(/[*_[\]|]/g, "").length * 0.055);

const soundOn = () => !!getState().settings.voices && !!audioOutput();

async function play(line: Line): Promise<number | null> {
  if (line.auto) autoDone.add(line.key);
  loading = line;
  const canSound = soundOn() && (!!line.babble || !!RECORDINGS[line.key]);
  const ready = canSound ? await prepare(line) : null;
  if (loading !== line) return null; // une autre réplique a été demandée entre-temps
  loading = null;
  stopCurrent();
  marquerEntendu(line.key);
  const start = performance.now();
  if (!ready) {
    // Lecture muette : la bulle s'écrit au rythme de lecture, et la file avance quand même.
    const duration = readingTime(line.md);
    let raf = 0;
    const tick = () => {
      if (current?.line !== line) return;
      const t = (performance.now() - start) / 1000;
      emit({ key: line.key, speaking: true, level: 0.18 + 0.12 * Math.abs(Math.sin(t * 9)), start, duration });
      if (t >= duration) { stopCurrent(); window.setTimeout(next, 150); return; }
      raf = requestAnimationFrame(tick);
    };
    current = { line, stop: () => cancelAnimationFrame(raf) };
    emit({ key: line.key, speaking: true, level: 0.2, start, duration });
    raf = requestAnimationFrame(tick);
    return duration;
  }
  const io = audioOutput()!;
  if (!bus || bus.context !== io.rt) { bus = io.rt.createGain(); bus.connect(io.out); }
  bus.gain.value = Math.max(0, Math.min(1, getState().settings.voiceVolume ?? 1)) * 1.15;
  if (io.rt.state === "suspended") io.rt.resume().catch(() => {});
  const src = io.rt.createBufferSource(); src.buffer = ready.buffer; src.connect(bus);
  const t0 = io.rt.currentTime, duration = ready.buffer.duration;
  let raf = 0;
  const tick = () => {
    if (current?.line !== line) return;
    const i = Math.floor((io.rt.currentTime - t0) / FRAME);
    emit({ key: line.key, speaking: true, level: ready.levels[Math.min(ready.levels.length - 1, Math.max(0, i))] ?? 0, start, duration });
    raf = requestAnimationFrame(tick);
  };
  current = { line, stop: () => { cancelAnimationFrame(raf); try { src.onended = null; src.stop(); } catch { /* déjà arrêtée */ } } };
  if (hold) heardDuringHold.add(line.key);
  src.onended = () => { if (current?.line === line) { stopCurrent(); window.setTimeout(next, 150); } };
  duckAmbience(true); duckSfx(true);
  emit({ key: line.key, speaking: true, level: 0, start, duration });
  src.start();
  raf = requestAnimationFrame(tick);
  return duration;
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
      if (current?.line.auto) { const c = current; autoDone.delete(c.line.key); queue = [c.line, ...queue]; stopCurrent(); }
      if (loading?.auto) { autoDone.delete(loading.key); queue = [loading, ...queue]; }
      loading = null;
    }
    return;
  }
  hold = Math.max(0, hold - 1);
  if (hold) return;
  queue = queue.filter((q) => !heardDuringHold.has(q.key));
  next();
}

/** Durée maximale de la file : au-delà, les plus anciennes lignes automatiques laissent leur place. */
const MAX_QUEUE = 8;

/**
 * Fait parler un personnage. `auto` : lecture à l'apparition d'une bulle ; elle attend son tour si quelqu'un parle
 * déjà (une seule bulle à la fois, dans l'ordre). Sinon le joueur a touché le personnage : la voix en cours s'arrête
 * et celle-ci part tout de suite. `babble` : texte écrit sur le moment, dit en babillage robotique.
 * Renvoie la durée de la réplique (en secondes) quand elle démarre tout de suite, ou null.
 */
export function speak(speaker: Speaker, md: string, opts: boolean | { auto?: boolean; babble?: Babil } = false): Promise<number | null> {
  const o = typeof opts === "boolean" ? { auto: opts } : opts;
  if (!md) return Promise.resolve(null);
  const line: Line = { speaker, md, key: lineKey(speaker, md, o.babble), auto: !!o.auto, babble: o.babble };
  if (line.auto && autoDone.has(line.key)) return Promise.resolve(null);
  if (line.auto && (current || loading || hold)) {
    if (current?.line.key !== line.key && loading?.key !== line.key && !queue.some((q) => q.key === line.key)) {
      queue = [...queue, line].slice(-MAX_QUEUE); emit({});
    }
    return Promise.resolve(null);
  }
  if (!line.auto) { queue = queue.filter((q) => q.key !== line.key); loading = null; }
  return play(line);
}

/** Vrai si cette ligne attend son tour, ou parle en ce moment. */
export function enCours(key: string) {
  return current?.line.key === key || loading?.key === key || queue.some((q) => q.key === key);
}

/** Volume des voix, appliqué tout de suite. */
export function syncVoiceVolume() {
  if (!bus) return;
  bus.gain.value = Math.max(0, Math.min(1, getState().settings.voiceVolume ?? 1)) * 1.15;
}

// Petit indicateur pour les tests de bout en bout : la dernière réplique lancée.
if (typeof window !== "undefined") onVoice((s) => { if (s.speaking) (window as unknown as { __forma8Voice?: string }).__forma8Voice = s.key; });
