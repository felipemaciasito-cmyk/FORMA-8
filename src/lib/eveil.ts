// Réveil des personnages (lot « compagnon et règles de parole », 17/11/2026, choix du propriétaire).
//
// Chaque membre dort dans son caisson et se réveille peu à peu, protocole après protocole. Forma Trisse (caisson 00)
// dort aussi au début du jeu. Ce module dit où en est chacun, et fournit ses phrases courtes (retour sur une page,
// réaction quand on le touche), tirées de src/content/interactions.json.
import INTER from "../content/interactions.json";
import { room } from "../content/index";
import { roomComplete, roomStepsDone } from "./progress";
import { getState } from "./store";

export type Etat = "sommeil" | "eveil";
type Pools = Record<string, Partial<Record<Etat, string[]>>>;
export interface Interactions {
  boot: { accueil: string; ambiance: { texte: string; choix: string[] }; levier: string };
  carte: { premiere: string; surchauffe: Record<Etat, { question: string; choix: string[]; oui: string; non: string }> };
  scenes: Record<string, { qui: string; texte?: string; reveil?: boolean }[]>;
  retours: Pools;
  toucher: Pools;
  defis: Record<string, { questions: { question: string; choix: string[]; bonne: number; piste: string }[]; bravo: string[]; fait: string }>;
  question: Record<string, { cle: string }>;
  annexes: Record<string, Partial<Record<Etat, string>>>;
}
export const INTERACTIONS = INTER as unknown as Interactions;

/** Le caisson d'un personnage (« ora » est Forma Trisse, caisson 00). */
export const roomOfSpeaker = (speaker: string) => (speaker === "ora" ? "c00" : speaker);

/** Vrai quand le personnage est réveillé : son caisson est terminé. */
export function eveille(speaker: string) {
  const r = room(roomOfSpeaker(speaker));
  return !!r && roomComplete(getState().progress, r);
}
export const etatDe = (speaker: string): Etat => (eveille(speaker) ? "eveil" : "sommeil");

/** Niveau de réveil, de 0 (profondément endormi) à 1 (réveillé), d'après les protocoles terminés. */
export function veille(speaker: string) {
  const r = room(roomOfSpeaker(speaker));
  if (!r) return 1;
  const p = getState().progress;
  if (roomComplete(p, r)) return 1;
  if (!r.steps.length) return 0;
  return roomStepsDone(p, r) / (r.steps.length + 1);
}

/** Grésillement commun à tous les endormis (choix du propriétaire : 35 %), qui baisse à mesure qu'ils se réveillent. */
export const GRESILLEMENT = 0.35;
export function gresillementDe(speaker: string) {
  const v = veille(speaker);
  return v >= 1 ? 0 : Math.round(GRESILLEMENT * (1 - v) * 20) / 20;
}

// Tirage d'une phrase : jamais deux fois de suite la même, et on fait le tour avant de répéter.
const used = new Map<string, string[]>();
function tirer(pool: string[] | undefined, id: string) {
  if (!pool?.length) return undefined;
  let left = (used.get(id) ?? []).length ? used.get(id)! : [];
  if (!left.length) { left = [...pool]; for (let i = left.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [left[i], left[j]] = [left[j], left[i]]; } }
  const pick = left.shift()!;
  used.set(id, left);
  return pick;
}

/** Phrase très courte quand on revient sur une page (différente à chaque fois). */
export function phraseRetour(speaker: string) {
  const etat = etatDe(speaker);
  return tirer(INTERACTIONS.retours[speaker]?.[etat], `retour:${speaker}:${etat}`);
}

/** Réaction quand on touche le personnage. */
export function reactionToucher(speaker: string) {
  const etat = etatDe(speaker);
  const pools = INTERACTIONS.toucher[speaker];
  return tirer(pools?.[etat] ?? pools?.sommeil, `toucher:${speaker}:${etat}`);
}

/** Bulle d'une autre page (Atelier, Équipe, Maintenance…), selon que Forma Trisse dort encore ou non. */
export function annexe(nom: string) {
  const a = INTERACTIONS.annexes[nom];
  if (!a) return undefined;
  return a[etatDe("ora")] ?? a.eveil ?? a.sommeil;
}

/** Accord d'un mot selon le membre : féminin, masculin, ou pluriel (Dupond et Dupont). */
export function accord(r: { genre?: "f" | "m" | "mp" } | undefined, m: string, f: string, mp?: string) {
  return r?.genre === "f" ? f : r?.genre === "mp" ? mp ?? m : m;
}
