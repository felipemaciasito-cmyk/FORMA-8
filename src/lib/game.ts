import { addDays, bump, getState, today, updateProgress, type Progress } from "./store";
import { sfx } from "./sound";
import type { IconId } from "../components/glyphs";

// ---------------- Événements visuels (toasts, célébrations) ----------------
export type FxEvent =
  | { type: "toast"; icon: IconId; text: string; tone?: "led" | "cyan" | "amber" | "red"; badge?: string }
  | { type: "burst"; x?: number; y?: number; color?: string }
  | { type: "badge"; id: string }
  // Propres à FORMA-8 : affichés par src/components/Rewards.tsx.
  | { type: "gain"; amount: number; x?: number; y?: number; quiet?: boolean }
  | { type: "levelup"; index: number; title: string; next?: { title: string; at: number } }
  | { type: "awaken"; roomId: string; replay?: boolean };
const fxListeners = new Set<(e: FxEvent) => void>();
export function onFx(l: (e: FxEvent) => void) { fxListeners.add(l); return () => { fxListeners.delete(l); }; }
export function fx(e: FxEvent) { fxListeners.forEach((l) => l(e)); }

// ---------------- Niveaux d'accréditation ----------------
export const LEVELS = [
  { at: 0, title: "Recrue" },
  { at: 150, title: "Apprenti" },
  { at: 400, title: "Opérateur" },
  { at: 800, title: "Pilote" },
  { at: 1300, title: "Chef d'atelier" },
  { at: 1900, title: "Chef d'équipe" },
  { at: 2600, title: "Commandant" },
  { at: 3400, title: "Chef d'orchestre" },
];
export function levelOf(energy: number) {
  let i = 0;
  for (let k = 0; k < LEVELS.length; k++) if (energy >= LEVELS[k].at) i = k;
  const cur = LEVELS[i];
  const next = LEVELS[i + 1];
  const pct = next ? Math.round(((energy - cur.at) / (next.at - cur.at)) * 100) : 100;
  return { index: i + 1, title: cur.title, next, pct };
}

// ---------------- Énergie ----------------
export const REWARD = {
  step: 40,
  exerciseFirst: 10,
  exerciseRetry: 4,
  incident: 120,
  mission: 60,
  review: 5,
  skill: 80,
  feynman: 20,
  delivery: 150,
  consigne: 15,
  report: 25,
};

export function addEnergy(amount: number, label?: string, opts: { quiet?: boolean } = {}) {
  const before = levelOf(getState().progress.energy).index;
  updateProgress((p) => {
    bump(p, "energy", amount);
    markActiveDay(p);
  });
  const after = levelOf(getState().progress.energy);
  fx({ type: "gain", amount, quiet: opts.quiet });
  if (label) fx({ type: "toast", icon: "bolt", text: `+${amount} kW · ${label}`, tone: "cyan" });
  if (after.index > before) {
    // Pas de son ici : la cérémonie plein écran joue elle-même « levelup ». Pendant un protocole, le grade n'est
    // annoncé qu'à la fin ; jouer le son tout de suite couvrait le bruit de la cellule de batterie qui s'allume
    // (remarque du propriétaire, 15/11/2026).
    // Pas de bandeau : la cérémonie (fin de protocole ou plein écran) annonce elle-même le nouveau grade.
    fx({ type: "burst", color: "#4dffa0" });
    fx({ type: "levelup", index: after.index, title: after.title, next: after.next });
  }
  checkBadges();
}

function markActiveDay(p: Progress) {
  const t = today();
  if (!p.days.includes(t)) p.days = [...p.days, t].slice(-400);
}

export function uptime(days: string[]) {
  const set = new Set(days);
  let d = today();
  if (!set.has(d)) d = addDays(d, -1); // la série reste vivante jusqu'à la fin de la journée
  let n = 0;
  while (set.has(d)) { n++; d = addDays(d, -1); }
  return n;
}

// ---------------- Révision espacée (méthode Leitner) ----------------
// Boîte 1 : revoir demain · 2 : dans 2 j · 3 : 4 j · 4 : 8 j · 5 : 16 j.
export const BOX_DAYS = [0, 1, 2, 4, 8, 16];

export function learnNotions(ids: string[], room: string) {
  updateProgress((p) => {
    for (const id of ids) {
      if (!p.notions[id]) p.notions[id] = { box: 1, due: addDays(today(), 1), seenAt: today(), room };
    }
  });
}

export function reviewNotion(id: string, ok: boolean) {
  updateProgress((p) => {
    const n = p.notions[id];
    if (!n) return;
    n.box = ok ? Math.min(5, n.box + 1) : 1;
    n.due = addDays(today(), BOX_DAYS[n.box]);
    bump(p, "reviews");
  });
}

export function dueNotions(p: Progress) {
  const t = today();
  return Object.entries(p.notions).filter(([, n]) => n.due <= t).map(([id]) => id);
}

// ---------------- Badges ----------------
export const BADGES: { id: string; icon: IconId; title: string; desc: string; test: (p: Progress, ctx: BadgeCtx) => boolean }[] = [
  { id: "boot", icon: "lever", title: "Premier réveil", desc: "Tu as abaissé le levier de la réserve.", test: (p) => p.bootedOnce },
  { id: "room1", icon: "bulb", title: "Premier membre", desc: "Un premier membre de l'équipe entièrement réveillé.", test: (_p, c) => c.roomsDone >= 1 },
  { id: "half", icon: "battery-half", title: "Mi-parcours", desc: "6 membres de l'équipe réveillés.", test: (_p, c) => c.roomsDone >= 6 },
  { id: "all", icon: "rack", title: "Équipe au complet", desc: "Les 11 membres de l'équipe sont réveillés.", test: (_p, c) => c.roomsTotal > 0 && c.roomsDone >= c.roomsTotal },
  { id: "nofuse", icon: "extinguisher", title: "Zéro fusible grillé", desc: "Une panne résolue sans aucune erreur.", test: (p) => Object.values(p.incidents).some((i) => i.fusesLeft === 3) },
  { id: "up3", icon: "flame", title: "Uptime 3 jours", desc: "3 jours d'affilée en ligne.", test: (p) => uptime(p.days) >= 3 },
  { id: "up7", icon: "blaze", title: "Uptime 7 jours", desc: "Une semaine sans coupure.", test: (p) => uptime(p.days) >= 7 },
  { id: "maint", icon: "toolbox", title: "Maintenance assidue", desc: "10 révisions de notions.", test: (p) => p.stats.reviews >= 10 },
  { id: "base20", icon: "books", title: "Base bien remplie", desc: "20 notions collectées.", test: (p) => Object.keys(p.notions).length >= 20 },
  { id: "feyn", icon: "mic", title: "Pédagogue", desc: "Une explication « avec tes mots » notée 80 ou plus.", test: (p) => Object.values(p.feynman).some((s) => s >= 80) },
  { id: "skill", icon: "forge", title: "Forgeron de Skills", desc: "Un Skill finalisé dans la Forge de Skills (caisson 02).", test: (p) => p.skills.some((s) => s.finalized) },
];

// Badges propres à FORMA-8 (mécaniques du code).
BADGES.push(
  { id: "livraison1", icon: "rocket", title: "Première livraison", desc: "Une livraison vérifiée sur GitHub.", test: (p) => Object.keys(p.deliveries ?? {}).length >= 1 },
  { id: "plume", icon: "pencil", title: "Plume de commandant", desc: "Une consigne notée 85 ou plus.", test: (p) => Object.values(p.consignes ?? {}).some((s) => s >= 85) },
  { id: "detective", icon: "search", title: "Détective", desc: "Un rapport de bug noté 80 ou plus.", test: (p) => Object.values(p.reports ?? {}).some((s) => s >= 80) },
);

export interface BadgeCtx { roomsDone: number; roomsTotal: number }
let badgeCtx: BadgeCtx = { roomsDone: 0, roomsTotal: 11 };
export function setBadgeCtx(c: BadgeCtx) { badgeCtx = c; }

export function checkBadges() {
  const p = getState().progress;
  const newOnes = BADGES.filter((b) => !p.badges[b.id] && b.test(p, badgeCtx));
  if (!newOnes.length) return;
  updateProgress((d) => { for (const b of newOnes) d.badges[b.id] = today(); });
  newOnes.forEach((b, i) => setTimeout(() => {
    sfx("badge");
    fx({ type: "toast", icon: b.icon, badge: b.id, text: `Badge débloqué : ${b.title}`, tone: "amber" });
  }, 600 + i * 900));
}

export function recordAnswer(ok: boolean) {
  updateProgress((p) => { bump(p, "answers"); if (ok) bump(p, "correct"); markActiveDay(p); });
}
