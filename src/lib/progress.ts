import { ROOMS, stepKey } from "../content";
import type { Room } from "../content/types";
import type { Progress } from "./store";

// Calculs dérivés de la progression : caissons débloqués, réveillés, énergie de chaque caisson.
// Un caisson sans protocole est « en préparation » : il n'est jamais considéré comme réveillé.

export function roomReady(r: Room) {
  return r.steps.length > 0;
}

export function roomStepsDone(p: Progress, r: Room) {
  return r.steps.filter((s) => p.steps[stepKey(r.id, s.id)]).length;
}

/** Caisson réveillé : tous ses protocoles terminés et sa panne résolue. */
export function roomComplete(p: Progress, r: Room) {
  if (!roomReady(r)) return false;
  const stepsOk = roomStepsDone(p, r) === r.steps.length;
  const incidentOk = !r.incident || !!p.incidents[r.id];
  return stepsOk && incidentOk;
}

export function roomUnlocked(p: Progress, r: Room) {
  return r.requires.every((id) => {
    const req = ROOMS.find((x) => x.id === id);
    return req ? roomComplete(p, req) : true;
  });
}

/** Pourcentage de réveil d'un caisson (protocoles + panne). */
export function roomPower(p: Progress, r: Room) {
  const total = r.steps.length + (r.incident ? 1 : 0);
  if (!total) return 0;
  const done = roomStepsDone(p, r) + (r.incident && p.incidents[r.id] ? 1 : 0);
  return Math.round((done / total) * 100);
}

export function stepUnlocked(p: Progress, r: Room, index: number) {
  if (index === 0) return true;
  return !!p.steps[stepKey(r.id, r.steps[index - 1].id)];
}

export function currentRoom(p: Progress) {
  return ROOMS.find((r) => roomUnlocked(p, r) && !roomComplete(p, r)) ?? ROOMS[ROOMS.length - 1];
}

export function roomsDoneCount(p: Progress) {
  return ROOMS.filter((r) => roomComplete(p, r)).length;
}

/** Pourcentage de l'équipe réveillée (moyenne des caissons). */
export function totalPower(p: Progress) {
  if (!ROOMS.length) return 0;
  return Math.round(ROOMS.reduce((a, r) => a + roomPower(p, r), 0) / ROOMS.length);
}
