import { useSyncExternalStore } from "react";
import { get, set } from "idb-keyval";
import { mergeProgress, withTotals } from "./merge";

// ---------------------------------------------------------------
// État persistant de FORMA-8 (stocké sur l'appareil, IndexedDB),
// conçu pour être fusionné entre appareils (voir lib/merge.ts).
// Toutes les clés commencent par « forma8: » : FORMA-8 n'écrit JAMAIS sous « forma7: ».
// ---------------------------------------------------------------

/** `at` : horodatage ISO de la dernière modification (pour la synchronisation). */
export interface NotionState { box: number; due: string; seenAt: string; room: string; at?: string }
export interface SavedSkill {
  id: string;
  name: string;
  description: string;
  title: string;
  when: string;
  steps: string[];
  output: string;
  examples: { input: string; output: string }[];
  avoid: string[];
  updatedAt: string; // ISO
  finalized?: boolean;
}
export interface Counters { energy: number; answers: number; correct: number; reviews: number }
/** Résultat d'un contrôle de livraison : vérifié sur GitHub, ou déclaré à la main. */
export interface CheckState { state: "verified" | "manual"; at: string }
/** Le produit fil rouge du joueur : son idée et son dépôt GitHub. */
export interface ProductInfo { name: string; pitch: string; owner: string; repo: string; at?: string }

export interface Progress {
  version: 1;
  /** Change à chaque réinitialisation ou import : l'époque la plus récente l'emporte partout. */
  epoch: string;
  name: string;
  nameAt?: string;
  bootedOnce: boolean;
  /** Total calculé à partir de `counters`. */
  energy: number;
  /** Un compteur par appareil, pour additionner sans rien perdre. */
  counters: Record<string, Counters>;
  steps: Record<string, string>; // "c01/p2" -> date (protocole de réveil terminé)
  /** Position dans un protocole en cours : nombre de blocs déjà affichés ("c01/p2" -> 5). */
  lessons: Record<string, number>;
  exercises: Record<string, number>; // clé d'exercice -> nombre d'essais avant réussite
  /** Pannes résolues (une par caisson). */
  incidents: Record<string, { at: string; fusesLeft: number }>;
  notions: Record<string, NotionState>;
  days: string[];
  badges: Record<string, string>;
  feynman: Record<string, number>;
  skills: SavedSkill[];
  deletedSkills: Record<string, string>;
  /** Totaux calculés à partir de `counters`. */
  stats: { answers: number; correct: number; reviews: number };
  orientationSeen: string[];
  checks: Record<string, boolean>;
  checksAt: Record<string, string>;
  /** Produit fil rouge (choisi au caisson 00). */
  product: ProductInfo;
  /** Contrôles de livraison ("c01:depot" -> état). */
  deliveryChecks: Record<string, CheckState>;
  /** Livraisons validées (caisson -> date). */
  deliveries: Record<string, string>;
  /** Meilleure note de chaque consigne rédigée (atelier des consignes). */
  consignes: Record<string, number>;
  /** Meilleure note de chaque rapport de bug (pannes à diagnostiquer). */
  reports: Record<string, number>;
}

export interface Settings {
  sound: boolean;
  /** Fond sonore de la réserve (coupé tant que le joueur ne l'a pas choisi) et son volume, de 0 à 1. */
  ambience: boolean;
  ambienceVolume: number;
  reduceMotion: "auto" | "on" | "off";
  ghOwner: string;
  ghRepo: string;
  ghToken: string;
  apiKey: string;
  model: string;
  deviceId: string;
  syncEnabled: boolean;
}

export const DEFAULT_PROGRESS: Progress = {
  version: 1,
  epoch: "0",
  name: "",
  bootedOnce: false,
  energy: 0,
  counters: {},
  steps: {},
  lessons: {},
  exercises: {},
  incidents: {},
  notions: {},
  days: [],
  badges: {},
  feynman: {},
  skills: [],
  deletedSkills: {},
  stats: { answers: 0, correct: 0, reviews: 0 },
  orientationSeen: [],
  checks: {},
  checksAt: {},
  product: { name: "", pitch: "", owner: "felipemaciasito-cmyk", repo: "" },
  deliveryChecks: {},
  deliveries: {},
  consignes: {},
  reports: {},
};

export const DEFAULT_SETTINGS: Settings = {
  sound: true,
  ambience: false,
  ambienceVolume: 0.6,
  reduceMotion: "auto",
  ghOwner: "felipemaciasito-cmyk",
  ghRepo: "FORMA-7-data",
  ghToken: "",
  apiKey: "",
  model: "claude-opus-5-5",
  deviceId: "",
  syncEnabled: false,
};

interface State { progress: Progress; settings: Settings; ready: boolean }

let state: State = { progress: DEFAULT_PROGRESS, settings: DEFAULT_SETTINGS, ready: false };
const listeners = new Set<() => void>();
const KEY_P = "forma8:progress";
const KEY_S = "forma8:settings";

function emit() { listeners.forEach((l) => l()); }

let saveTimer: number | undefined;
let pending = false;
function saveNow() {
  window.clearTimeout(saveTimer);
  if (!pending) return;
  pending = false;
  set(KEY_P, state.progress).catch(() => {});
  set(KEY_S, state.settings).catch(() => {});
}
function scheduleSave() {
  pending = true;
  window.clearTimeout(saveTimer);
  saveTimer = window.setTimeout(saveNow, 250);
}
// Quand l'appli passe en arrière-plan, se ferme ou se recharge : écriture immédiate, plus une
// copie de secours SYNCHRONE (localStorage). L'écriture en base locale (IndexedDB) est
// asynchrone et peut être interrompue par la fermeture ; la copie de secours, elle, est
// garantie, puis fusionnée sans perte au démarrage suivant (voir initStore).
const BACKUP = "forma8:progress-secours";
function flush() {
  if (!state.ready) return;
  try { localStorage.setItem(BACKUP, JSON.stringify(state.progress)); } catch { /* stockage indisponible */ }
  pending = true;
  saveNow();
}
if (typeof window !== "undefined") {
  window.addEventListener("pagehide", flush);
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") flush(); });
}
function readBackup(): Partial<Progress> | undefined {
  try { const raw = localStorage.getItem(BACKUP); return raw ? (JSON.parse(raw) as Partial<Progress>) : undefined; } catch { return undefined; }
}

const nowIso = () => new Date().toISOString();
const newId = () => (crypto.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`);

/** Complète une progression (ancienne sauvegarde, autre appareil…) avec les champs manquants. */
export function normalizeProgress(raw: Partial<Progress> | undefined, deviceId: string): Progress {
  const p: Progress = {
    ...DEFAULT_PROGRESS,
    ...(raw ?? {}),
    stats: { ...DEFAULT_PROGRESS.stats, ...(raw?.stats ?? {}) },
    counters: { ...(raw?.counters ?? {}) },
    lessons: { ...(raw?.lessons ?? {}) },
    deletedSkills: { ...(raw?.deletedSkills ?? {}) },
    checks: { ...(raw?.checks ?? {}) },
    checksAt: { ...(raw?.checksAt ?? {}) },
    skills: [...(raw?.skills ?? [])],
    product: { ...DEFAULT_PROGRESS.product, ...(raw?.product ?? {}) },
    deliveryChecks: { ...(raw?.deliveryChecks ?? {}) },
    deliveries: { ...(raw?.deliveries ?? {}) },
    consignes: { ...(raw?.consignes ?? {}) },
    reports: { ...(raw?.reports ?? {}) },
  } as Progress;
  if (!Object.keys(p.counters).length && (p.energy || p.stats.answers || p.stats.reviews)) {
    // Ancienne progression : tout est attribué à cet appareil.
    p.counters[deviceId] = { energy: p.energy || 0, answers: p.stats.answers, correct: p.stats.correct, reviews: p.stats.reviews };
  }
  return withTotals(p);
}

export async function initStore() {
  try {
    const [p, s] = await Promise.all([get<Progress>(KEY_P), get<Settings>(KEY_S)]);
    const settings = { ...DEFAULT_SETTINGS, ...(s ?? {}) };
    if (!settings.deviceId) settings.deviceId = newId();
    let progress = normalizeProgress(p, settings.deviceId);
    const backup = readBackup();
    if (backup) {
      // Fusion sans perte avec la copie de secours écrite à la dernière fermeture.
      progress = mergeProgress(progress, normalizeProgress(backup, settings.deviceId));
      try { localStorage.removeItem(BACKUP); } catch { /* stockage indisponible */ }
    }
    state = { progress, settings, ready: true };
    scheduleSave();
  } catch {
    state = { ...state, settings: { ...state.settings, deviceId: state.settings.deviceId || newId() }, ready: true };
  }
  // Demande au navigateur de ne pas effacer les données (pas toujours accordé, surtout sur iOS).
  try { await navigator.storage?.persist?.(); } catch { /* ignoré */ }
  emit();
}

export function getState() { return state; }

/** Horodate ce qui a changé (prénom, notions, cases cochées) pour la fusion entre appareils. */
function stamp(before: Progress, after: Progress) {
  const t = nowIso();
  if (after.name !== before.name) after.nameAt = t;
  for (const [id, n] of Object.entries(after.notions)) {
    const o = before.notions[id];
    if (!o || o.box !== n.box || o.due !== n.due || o.seenAt !== n.seenAt) n.at = t;
  }
  for (const [k, v] of Object.entries(after.checks)) if (before.checks[k] !== v) after.checksAt[k] = t;
  const pa = after.product, pb = before.product;
  if (pa.name !== pb.name || pa.pitch !== pb.pitch || pa.owner !== pb.owner || pa.repo !== pb.repo) pa.at = t;
}

export function updateProgress(fn: (p: Progress) => Progress | void) {
  const before = state.progress;
  const draft = structuredClone(before);
  const res = fn(draft) ?? draft;
  stamp(before, res);
  state = { ...state, progress: withTotals(res) };
  scheduleSave();
  emit();
}

/** Incrémente un compteur de CET appareil (énergie, réponses, révisions). */
export function bump(p: Progress, field: keyof Counters, n = 1) {
  const id = state.settings.deviceId || "local";
  const c = p.counters[id] ?? { energy: 0, answers: 0, correct: 0, reviews: 0 };
  c[field] = (c[field] || 0) + n;
  p.counters[id] = c;
  const w = withTotals(p);
  p.energy = w.energy;
  p.stats = w.stats;
}

export function updateSettings(patch: Partial<Settings>) {
  state = { ...state, settings: { ...state.settings, ...patch } };
  scheduleSave();
  emit();
}

/** Remplace la progression (import d'une sauvegarde, réinitialisation) : nouvelle époque, appliquée partout. */
export function replaceProgress(p: Partial<Progress>) {
  const next = normalizeProgress(p, state.settings.deviceId);
  next.epoch = nowIso();
  state = { ...state, progress: next };
  scheduleSave();
  emit();
}

/** Applique une progression fusionnée venant de la synchronisation (sans nouvelle époque ni horodatage). */
export function applySyncedProgress(p: Progress) {
  state = { ...state, progress: withTotals(p) };
  scheduleSave();
  emit();
}

export function subscribeStore(l: () => void) { listeners.add(l); return () => { listeners.delete(l); }; }

export function useStore<T>(selector: (s: State) => T): T {
  return useSyncExternalStore(subscribeStore, () => selector(state), () => selector(state));
}
export const useProgress = () => useStore((s) => s.progress);
export const useSettings = () => useStore((s) => s.settings);

// ---------- Dates ----------
export function today(d = new Date()) {
  const y = d.getFullYear(); const m = String(d.getMonth() + 1).padStart(2, "0"); const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
export function addDays(iso: string, n: number) {
  const d = new Date(iso + "T12:00:00");
  d.setDate(d.getDate() + n);
  return today(d);
}
export { nowIso };
