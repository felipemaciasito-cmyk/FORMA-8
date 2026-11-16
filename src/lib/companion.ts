// Le compagnon du protocole (demande du propriétaire, 16/11/2026) : le membre du caisson reste visible en bas de
// l'écran pendant tout un protocole, animé, et intervient aux moments utiles : ouverture, passages clés, certaines
// réponses (pas toutes), fin du protocole. Ce module décide QUAND il parle ; Companion.tsx l'affiche.
//
// Règles des réactions (« pas tout le temps : analyse les moments les plus appropriés ») :
// - première bonne réponse du protocole : il la salue ;
// - bonne réponse après au moins une erreur : il salue la persévérance ;
// - deuxième erreur sur une même vérification : il donne une piste (une seule fois par vérification) ;
// - trois bonnes réponses du premier coup d'affilée : il salue la série ;
// - sinon il se tait. Entre deux réactions, au moins 25 s (sauf la piste, toujours utile) ; jamais par-dessus une
//   réplique prévue encore affichée (ouverture, passage clé, fin).
import LINES from "../content/compagnon.json";

export interface CompanionLines {
  reactions: { premier: string[]; perseverance: string[]; indice: string[]; serie: string[] };
  protocoles: Record<string, { debut?: string; blocs?: Record<string, string>; fin?: string }>;
  /** Hors protocole : sur la carte, au début et à la fin de la panne, près de la livraison. */
  carte?: string; panne?: string; panneFin?: string; livraison?: string;
}
export type ReactionKind = keyof CompanionLines["reactions"];
export interface CompanionLine { id: number; md: string; kind: "debut" | "bloc" | "fin" | ReactionKind }

const DATA = LINES as unknown as Record<string, CompanionLines | string>;
export function companionLines(roomId: string): CompanionLines | null {
  const d = DATA[roomId];
  return d && typeof d === "object" ? d : null;
}

let line: CompanionLine | null = null;
const subs = new Set<(l: CompanionLine | null) => void>();
let nextId = 1;
function emit(l: CompanionLine | null) {
  line = l; subs.forEach((f) => f(l));
  // Petit indicateur pour les tests de bout en bout : les répliques dites pendant la séance.
  if (l && typeof window !== "undefined") { const w = window as unknown as { __forma8Compagnon?: string[] }; (w.__forma8Compagnon ??= []).push(`${l.kind}:${l.md}`); }
}
export function onCompanion(f: (l: CompanionLine | null) => void) { subs.add(f); return () => { subs.delete(f); }; }
export function currentCompanion() { return line; }
export function hideCompanion() { emit(null); }

// ---------- Session d'un protocole ----------
interface Session { room: string; step: string; lines: CompanionLines; misses: Map<string, number>; hinted: Set<string>; solved: number; streak: number; lastReaction: number }
let session: Session | null = null;
const REACTION_GAP = 25_000;

export function startCompanion(room: string, step: string) {
  const lines = companionLines(room);
  session = lines ? { room, step, lines, misses: new Map(), hinted: new Set(), solved: 0, streak: 0, lastReaction: 0 } : null;
  emit(null);
}
export function stopCompanion() { session = null; emit(null); }

function say(md: string | undefined, kind: CompanionLine["kind"]) {
  if (!md) return false;
  emit({ id: nextId++, md, kind });
  return true;
}

/** Réplique prévue : ouverture du protocole, passage clé (bloc n°), fin. */
export function companionScript(kind: "debut" | "fin" | "bloc", index?: number) {
  if (!session) return;
  const p = session.lines.protocoles[session.step]; if (!p) return;
  const md = kind === "bloc" ? p.blocs?.[String(index)] : p[kind];
  say(md, kind);
}

function pick(kind: ReactionKind) {
  const list = session!.lines.reactions[kind] ?? [];
  if (!list.length) return undefined;
  // Tirage qui évite de répéter la même phrase deux fois de suite.
  const prev = line?.md;
  const pool = list.length > 1 ? list.filter((x) => x !== prev) : list;
  return pool[Math.floor(Math.random() * pool.length)];
}
function react(kind: ReactionKind, force = false) {
  if (!session) return;
  const now = Date.now();
  if (!force && now - session.lastReaction < REACTION_GAP) return;
  // Une réplique prévue encore affichée n'est pas coupée (sauf par une piste ou un premier succès).
  if (!force && line && (line.kind === "debut" || line.kind === "bloc" || line.kind === "fin")) return;
  if (say(pick(kind), kind)) session.lastReaction = now;
}

/** Une vérification ratée (une tentative fausse). */
export function companionMiss(exKey: string) {
  if (!session) return;
  session.streak = 0;
  const n = (session.misses.get(exKey) ?? 0) + 1;
  session.misses.set(exKey, n);
  if (n === 2 && !session.hinted.has(exKey)) { session.hinted.add(exKey); react("indice", true); }
}

/** Une vérification réussie. */
export function companionSolved(exKey: string) {
  if (!session) return;
  const missed = (session.misses.get(exKey) ?? 0) > 0;
  session.solved++;
  session.streak = missed ? 0 : session.streak + 1;
  if (missed) react("perseverance", session.hinted.has(exKey)); // après une piste, la réussite est toujours saluée
  else if (session.solved === 1) react("premier", true);
  else if (session.streak === 3) react("serie");
}
