import type { Room } from "../content/types";
import { evaluateCheck, type CheckDeps, type CheckResult } from "./checks";
import { addEnergy, checkBadges, fx, REWARD } from "./game";
import { sfx } from "./sound";
import { getState, nowIso, today, updateProgress, type Progress } from "./store";

export { pagesUrl, type CheckResult } from "./checks";

// ---------------------------------------------------------------
// Livraisons vérifiées : chaque caisson se termine par une nouvelle
// version du produit fil rouge. L'appli vérifie les preuves sur GitHub,
// dans le dépôt du produit (jeton du joueur, lecture seule suffit).
// Si la vérification est impossible, le joueur peut cocher à la main :
// le contrôle est alors marqué « déclaré », jamais « vérifié ».
// ---------------------------------------------------------------

export const checkKey = (roomId: string, checkId: string) => `${roomId}:${checkId}`;

export function deliveryState(p: Progress, r: Room) {
  const checks = r.delivery?.checks ?? [];
  const states = checks.map((c) => p.deliveryChecks[checkKey(r.id, c.id)]);
  return {
    total: checks.length,
    done: states.filter(Boolean).length,
    verified: states.filter((s) => s?.state === "verified").length,
    complete: checks.length > 0 && states.every(Boolean),
    validated: !!p.deliveries[r.id],
  };
}

/** Lance tous les contrôles automatiques d'un caisson et enregistre ceux qui réussissent. */
export async function verifyDelivery(r: Room): Promise<Record<string, CheckResult>> {
  const p = getState().progress;
  const deps: CheckDeps = { fetch: (...a) => fetch(...a), token: getState().settings.ghToken };
  const out: Record<string, CheckResult> = {};
  for (const c of r.delivery?.checks ?? []) {
    if (c.kind === "manual") continue;
    try { out[c.id] = await evaluateCheck(c, p.product, deps); }
    catch (e) { out[c.id] = { ok: false, detail: /fetch|network|Load failed/i.test(String(e)) ? "Pas de connexion." : String(e) }; }
  }
  const ok = Object.entries(out).filter(([, v]) => v.ok).map(([k]) => k);
  if (ok.length) updateProgress((d) => { for (const id of ok) d.deliveryChecks[checkKey(r.id, id)] = { state: "verified", at: nowIso() }; });
  completeIfReady(r);
  return out;
}

/** Coche ou décoche un contrôle à la main (« déclaré »). Un contrôle déjà vérifié ne se décoche pas. */
export function toggleManual(r: Room, checkId: string) {
  const k = checkKey(r.id, checkId);
  const cur = getState().progress.deliveryChecks[k];
  if (cur?.state === "verified") return;
  updateProgress((d) => { if (cur) delete d.deliveryChecks[k]; else d.deliveryChecks[k] = { state: "manual", at: nowIso() }; });
  completeIfReady(r);
}

function completeIfReady(r: Room) {
  const p = getState().progress;
  const st = deliveryState(p, r);
  if (!st.complete || st.validated) return;
  updateProgress((d) => { d.deliveries[r.id] = today(); });
  addEnergy(REWARD.delivery, `livraison ${r.version}`);
  sfx("power");
  fx({ type: "burst", color: `hsl(${r.hue} 100% 62%)` });
  checkBadges();
}
