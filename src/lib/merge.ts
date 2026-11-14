import type { Counters, NotionState, Progress, SavedSkill } from "./store";

// ---------------------------------------------------------------
// Fusion de deux progressions (cet appareil + un autre appareil).
// Principe : ne jamais perdre ce qui a été fait d'un côté ou de l'autre.
//  - « epoch » : une réinitialisation ou un import crée une nouvelle époque ;
//    l'époque la plus récente remplace entièrement l'autre.
//  - Compteurs (énergie, réponses, révisions) : un compteur par appareil,
//    on garde le maximum de chaque appareil, et le total est la somme.
//  - Ensembles (protocoles, badges, pannes, jours) : union.
//  - Position dans les leçons en cours : la plus avancée des deux.
//  - Éléments modifiables (notions, cases cochées, Skills, prénom) : le plus récent gagne.
// ---------------------------------------------------------------

const minStr = (a?: string, b?: string) => (!a ? b : !b ? a : a < b ? a : b);
const maxStr = (a?: string, b?: string) => (!a ? b : !b ? a : a > b ? a : b);

function unionWith<T>(a: Record<string, T>, b: Record<string, T>, pick: (x: T, y: T) => T): Record<string, T> {
  const out: Record<string, T> = { ...a };
  for (const [k, v] of Object.entries(b)) out[k] = k in out ? pick(out[k], v) : v;
  return out;
}

export function totalsFrom(counters: Record<string, Counters>) {
  const t = { energy: 0, answers: 0, correct: 0, reviews: 0 };
  for (const c of Object.values(counters)) {
    t.energy += c.energy || 0; t.answers += c.answers || 0; t.correct += c.correct || 0; t.reviews += c.reviews || 0;
  }
  return t;
}

export function withTotals(p: Progress): Progress {
  const t = totalsFrom(p.counters);
  return { ...p, energy: t.energy, stats: { answers: t.answers, correct: t.correct, reviews: t.reviews } };
}

function newerNotion(x: NotionState, y: NotionState): NotionState {
  const ax = x.at ?? "", ay = y.at ?? "";
  if (ax !== ay) return ax > ay ? x : y;
  // À défaut d'horodatage : la notion la plus avancée.
  if (x.box !== y.box) return x.box > y.box ? x : y;
  return x.due >= y.due ? x : y;
}

function mergeSkills(a: Progress, b: Progress): { skills: SavedSkill[]; deletedSkills: Record<string, string> } {
  const deleted = unionWith(a.deletedSkills, b.deletedSkills, (x, y) => maxStr(x, y)!);
  const byId = new Map<string, SavedSkill>();
  for (const s of [...a.skills, ...b.skills]) {
    const cur = byId.get(s.id);
    if (!cur || (s.updatedAt ?? "") > (cur.updatedAt ?? "")) byId.set(s.id, s);
  }
  // Ordre stable : d'abord ceux de a, puis les nouveaux de b.
  const order = [...a.skills.map((s) => s.id), ...b.skills.map((s) => s.id)].filter((id, i, arr) => arr.indexOf(id) === i);
  const skills = order.map((id) => byId.get(id)!).filter((s) => !(deleted[s.id] && deleted[s.id] >= (s.updatedAt ?? "")));
  return { skills, deletedSkills: deleted };
}

export function mergeProgress(a: Progress, b: Progress): Progress {
  if (a.epoch !== b.epoch) return withTotals(structuredClone(a.epoch > b.epoch ? a : b));

  const nameFromA = (a.nameAt ?? "") >= (b.nameAt ?? "");
  const checks: Record<string, boolean> = {};
  const checksAt: Record<string, string> = {};
  for (const k of new Set([...Object.keys(a.checks), ...Object.keys(b.checks)])) {
    const ta = a.checksAt[k] ?? "", tb = b.checksAt[k] ?? "";
    const fromA = k in a.checks && (!(k in b.checks) || ta >= tb);
    checks[k] = fromA ? a.checks[k] : b.checks[k];
    const t = fromA ? ta : tb;
    if (t) checksAt[k] = t;
  }

  const merged: Progress = {
    version: 1,
    epoch: a.epoch,
    name: nameFromA ? a.name || b.name : b.name || a.name,
    nameAt: maxStr(a.nameAt, b.nameAt),
    bootedOnce: a.bootedOnce || b.bootedOnce,
    energy: 0,
    counters: unionWith(a.counters, b.counters, (x, y) => ({
      energy: Math.max(x.energy || 0, y.energy || 0),
      answers: Math.max(x.answers || 0, y.answers || 0),
      correct: Math.max(x.correct || 0, y.correct || 0),
      reviews: Math.max(x.reviews || 0, y.reviews || 0),
    })),
    steps: unionWith(a.steps, b.steps, (x, y) => minStr(x, y)!),
    lessons: unionWith(a.lessons ?? {}, b.lessons ?? {}, (x, y) => Math.max(x, y)),
    exercises: unionWith(a.exercises, b.exercises, (x, y) => Math.min(x, y)),
    incidents: unionWith(a.incidents, b.incidents, (x, y) => ({ at: minStr(x.at, y.at)!, fusesLeft: Math.max(x.fusesLeft, y.fusesLeft) })),
    notions: unionWith(a.notions, b.notions, newerNotion),
    days: [...new Set([...a.days, ...b.days])].sort().slice(-400),
    badges: unionWith(a.badges, b.badges, (x, y) => minStr(x, y)!),
    feynman: unionWith(a.feynman, b.feynman, (x, y) => Math.max(x, y)),
    ...mergeSkills(a, b),
    stats: { answers: 0, correct: 0, reviews: 0 },
    orientationSeen: [...new Set([...a.orientationSeen, ...b.orientationSeen])],
    checks,
    checksAt,
  };
  return withTotals(merged);
}

/** JSON stable (clés triées) pour comparer deux progressions. */
export function canonical(v: unknown): string {
  if (Array.isArray(v)) return `[${v.map(canonical).join(",")}]`;
  if (v && typeof v === "object") {
    const o = v as Record<string, unknown>;
    return `{${Object.keys(o).filter((k) => o[k] !== undefined).sort().map((k) => `${JSON.stringify(k)}:${canonical(o[k])}`).join(",")}}`;
  }
  return JSON.stringify(v);
}
