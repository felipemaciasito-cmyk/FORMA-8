import glossaryJson from "./glossary.json";
import type { Notion, Room } from "./types";

// Contenu de FORMA-8 : le glossaire des notions et les 11 caissons (un fichier JSON par caisson).
const caissonModules = import.meta.glob<{ default: Room }>("./caissons/*.json", { eager: true });

export const ROOMS: Room[] = Object.values(caissonModules).map((m) => m.default).sort((a, b) => a.index - b.index);
export const BASE_NOTIONS = glossaryJson as unknown as Notion[];

const base = new Map(BASE_NOTIONS.map((n) => [n.id, n]));

export function notion(id: string): Notion | undefined { return base.get(id); }
export function allNotions(): Notion[] { return BASE_NOTIONS; }
/** Caisson où une notion est introduite. (`missionId` existe pour compatibilité avec la couche visuelle de FORMA-7 : toujours absent ici.) */
export function notionOrigin(id: string): { room?: Room; missionId?: string } {
  for (const r of ROOMS) for (const s of r.steps) if (s.introduces.includes(id)) return { room: r };
  return {};
}

export function room(id: string) { return ROOMS.find((r) => r.id === id); }
export const stepKey = (roomId: string, stepId: string) => `${roomId}/${stepId}`;
