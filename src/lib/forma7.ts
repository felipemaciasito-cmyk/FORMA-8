import { useEffect, useSyncExternalStore } from "react";
import { get, set } from "idb-keyval";
import type { IconId } from "../components/glyphs";
import { ghHeaders, repoUrl } from "./github";
import { getState } from "./store";

// ---------------------------------------------------------------
// Clin d'oeil à FORMA-7, en LECTURE SEULE.
// FORMA-8 ne modifie jamais rien de FORMA-7 : ni ses clés locales
// (« forma7:… »), ni le fichier progress/progress.json de FORMA-7-data.
// Deux sources possibles :
//  1. le stockage local de FORMA-7 (même site), quand les deux applis sont
//     ouvertes dans Safari ; sur iOS, une appli ajoutée à l'écran d'accueil a
//     son propre stockage, isolé : cette source est alors vide ;
//  2. le fichier progress/progress.json de FORMA-7-data, si la
//     synchronisation de FORMA-7 est activée.
// ---------------------------------------------------------------

/** Grades et badges de FORMA-7, recopiés pour l'affichage (source : FORMA-7, src/lib/game.ts). */
const F7_LEVELS = [
  { at: 0, title: "Recrue" },
  { at: 150, title: "Stagiaire" },
  { at: 400, title: "Pilote de baie" },
  { at: 800, title: "Spécialiste systèmes" },
  { at: 1300, title: "Responsable de salle" },
  { at: 1900, title: "Architecte" },
  { at: 2600, title: "Architecte en chef" },
  { at: 3400, title: "Humain augmenté" },
];
const F7_BADGES: Record<string, { icon: IconId; title: string }> = {
  boot: { icon: "lever", title: "Premier démarrage" },
  room1: { icon: "bulb", title: "Première salle" },
  half: { icon: "battery-half", title: "Mi-parcours" },
  all: { icon: "rack", title: "Datacenter en ligne" },
  nofuse: { icon: "extinguisher", title: "Zéro fusible grillé" },
  up3: { icon: "flame", title: "Uptime 3 jours" },
  up7: { icon: "blaze", title: "Uptime 7 jours" },
  maint: { icon: "toolbox", title: "Maintenance assidue" },
  base20: { icon: "books", title: "Base bien remplie" },
  feyn: { icon: "mic", title: "Pédagogue" },
  skill: { icon: "forge", title: "Forgeron de Skills" },
  signal: { icon: "dish", title: "Signal capté" },
};

export interface Heritage {
  source: "local" | "github";
  name: string;
  energy: number;
  grade: string;
  notions: number;
  badges: { id: string; icon: IconId; title: string }[];
  readAt: string;
}

interface F7Progress {
  name?: string;
  energy?: number;
  counters?: Record<string, { energy?: number }>;
  notions?: Record<string, unknown>;
  badges?: Record<string, string>;
}

const CACHE = "forma8:heritage";

function gradeOf(energy: number) {
  let t = F7_LEVELS[0].title;
  for (const l of F7_LEVELS) if (energy >= l.at) t = l.title;
  return t;
}

export function heritageFrom(raw: F7Progress, source: Heritage["source"]): Heritage | null {
  if (!raw || typeof raw !== "object") return null;
  const energy = raw.counters && Object.keys(raw.counters).length
    ? Object.values(raw.counters).reduce((a, c) => a + (c?.energy || 0), 0)
    : raw.energy || 0;
  const badges = Object.keys(raw.badges ?? {}).filter((id) => F7_BADGES[id]).map((id) => ({ id, ...F7_BADGES[id] }));
  const notions = Object.keys(raw.notions ?? {}).length;
  if (!raw.name && !energy && !badges.length && !notions) return null;
  return { source, name: raw.name ?? "", energy, grade: gradeOf(energy), notions, badges, readAt: new Date().toISOString() };
}

let hs: { heritage: Heritage | null; status: "idle" | "loading" | "done" } = { heritage: null, status: "idle" };
const ls = new Set<() => void>();
function setHs(patch: Partial<typeof hs>) { hs = { ...hs, ...patch }; ls.forEach((l) => l()); }
export function useHeritage() { return useSyncExternalStore((l) => { ls.add(l); return () => ls.delete(l); }, () => hs, () => hs); }

/** Lecture locale (même site) : get() uniquement, aucune écriture sous « forma7: ». */
async function readLocal(): Promise<Heritage | null> {
  try { return heritageFrom((await get<F7Progress>("forma7:progress")) ?? {}, "local"); } catch { return null; }
}

/** Lecture distante de progress/progress.json (GET uniquement). */
async function readGithub(): Promise<Heritage | null> {
  const { ghOwner, ghRepo, ghToken } = getState().settings;
  if (!ghToken) return null;
  try {
    const res = await fetch(repoUrl(ghOwner, ghRepo, "contents/progress/progress.json"), { headers: ghHeaders("application/vnd.github.raw+json"), cache: "no-store" });
    if (!res.ok) return null;
    return heritageFrom(JSON.parse(await res.text()) as F7Progress, "github");
  } catch { return null; }
}

export async function refreshHeritage() {
  setHs({ status: "loading" });
  const found = (await readLocal()) ?? (await readGithub());
  if (found) { setHs({ heritage: found, status: "done" }); set(CACHE, found).catch(() => {}); }
  else setHs({ status: "done" });
  return found;
}

/** Charge le dernier héritage connu, puis tente une lecture fraîche. */
export function useHeritageLoader(ready: boolean) {
  useEffect(() => {
    if (!ready) return;
    get<Heritage>(CACHE).then((c) => { if (c && !hs.heritage) setHs({ heritage: c }); }).catch(() => {}).finally(() => { refreshHeritage(); });
  }, [ready]);
}
