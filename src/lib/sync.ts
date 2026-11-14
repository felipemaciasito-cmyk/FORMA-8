import { useEffect, useSyncExternalStore } from "react";
import { get, set } from "idb-keyval";
import { canonical, mergeProgress } from "./merge";
import { applySyncedProgress, getState, normalizeProgress, subscribeStore, type Progress } from "./store";
import { fx } from "./game";

// ---------------------------------------------------------------
// Synchronisation de la progression de FORMA-8 entre appareils, via le
// dépôt privé FORMA-7-data (fichier progress/forma-8.json, API GitHub).
// Le jeton doit avoir « Contents: Read and write » sur ce dépôt.
// Le fichier progress/progress.json appartient à FORMA-7 : il n'est jamais modifié ici.
// ---------------------------------------------------------------

const PATH = "progress/forma-8.json";
const DEBOUNCE_MS = 30_000;
const META_KEY = "forma8:sync";

export interface SyncState {
  status: "off" | "idle" | "syncing" | "ok" | "error";
  lastSyncAt?: string;
  error?: string;
}

let ss: SyncState = { status: "off" };
const ls = new Set<() => void>();
function setSs(patch: Partial<SyncState>) { ss = { ...ss, ...patch }; ls.forEach((l) => l()); }
export function useSyncState() { return useSyncExternalStore((l) => { ls.add(l); return () => ls.delete(l); }, () => ss, () => ss); }

let lastSyncedCanon: string | null = null;
let inflight: Promise<void> | null = null;
let debounce: number | undefined;

export function deviceLabel() {
  const ua = navigator.userAgent;
  if (/iPad/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) return "iPad";
  if (/iPhone/.test(ua)) return "iPhone";
  if (/Android/.test(ua)) return "Android";
  return "ordinateur";
}

const enabled = () => { const s = getState().settings; return s.syncEnabled && !!s.ghToken; };

function api(path: string) {
  const { ghOwner, ghRepo } = getState().settings;
  return `https://api.github.com/repos/${encodeURIComponent(ghOwner)}/${encodeURIComponent(ghRepo)}/contents/${path}`;
}
function headers() {
  return { Authorization: `Bearer ${getState().settings.ghToken}`, Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28" };
}

const b64encode = (text: string) => {
  const bytes = new TextEncoder().encode(text);
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
};
const b64decode = (b64: string) => new TextDecoder().decode(Uint8Array.from(atob(b64.replace(/\s/g, "")), (c) => c.charCodeAt(0)));

class Conflict extends Error {}

function httpError(status: number, writing: boolean) {
  if (status === 401) return "Jeton refusé (401) : il est invalide ou expiré.";
  if (status === 403) return writing
    ? "Écriture refusée (403) : ton jeton est probablement en lecture seule. Pour synchroniser, il faut « Contents : Read and write »."
    : "Accès refusé (403) : vérifie les droits du jeton sur ce dépôt.";
  if (status === 404) return "Dépôt introuvable (404) : vérifie le compte, le dépôt, et que le jeton y a accès.";
  return `Erreur GitHub ${status}.`;
}

async function getRemote(): Promise<{ sha: string | null; progress: Progress | null }> {
  const res = await fetch(api(PATH), { headers: headers(), cache: "no-store" });
  if (res.status === 404) {
    // Fichier pas encore créé… ou dépôt inaccessible : on vérifie le dépôt.
    const { ghOwner, ghRepo } = getState().settings;
    const probe = await fetch(`https://api.github.com/repos/${encodeURIComponent(ghOwner)}/${encodeURIComponent(ghRepo)}`, { headers: headers(), cache: "no-store" });
    if (!probe.ok) throw new Error(httpError(probe.status, false));
    return { sha: null, progress: null };
  }
  if (!res.ok) throw new Error(httpError(res.status, false));
  const json = (await res.json()) as { sha: string; content: string };
  return { sha: json.sha, progress: normalizeProgress(JSON.parse(b64decode(json.content)), getState().settings.deviceId) };
}

async function putRemote(p: Progress, sha: string | null) {
  const body = JSON.stringify({
    message: `FORMA-8 : synchro de la progression (${deviceLabel()})`,
    content: b64encode(JSON.stringify(p, null, 1)),
    ...(sha ? { sha } : {}),
  });
  const res = await fetch(api(PATH), { method: "PUT", headers: { ...headers(), "Content-Type": "application/json" }, body, keepalive: body.length < 60_000 });
  if (res.status === 409 || res.status === 422) throw new Conflict();
  if (!res.ok) throw new Error(httpError(res.status, true));
}

/** Récupère, fusionne, puis envoie si nécessaire. Sans risque si appelée souvent. */
export function syncNow(): Promise<void> {
  if (!enabled()) { setSs({ status: "off" }); return Promise.resolve(); }
  if (inflight) return inflight;
  window.clearTimeout(debounce);
  setSs({ status: "syncing", error: undefined });
  inflight = (async () => {
    try {
      for (let attempt = 0; attempt < 3; attempt++) {
        const remote = await getRemote();
        const local = getState().progress;
        const merged = remote.progress ? mergeProgress(local, remote.progress) : local;
        const mergedCanon = canonical(merged);
        if (mergedCanon !== canonical(local)) {
          const gained = Object.keys(merged.steps).length - Object.keys(local.steps).length;
          applySyncedProgress(merged);
          if (gained > 0 || merged.energy > local.energy) fx({ type: "toast", icon: "refresh", text: "Progression récupérée depuis ton autre appareil", tone: "cyan" });
        }
        if (!remote.progress || mergedCanon !== canonical(remote.progress)) {
          try { await putRemote(merged, remote.sha); }
          catch (e) { if (e instanceof Conflict) continue; throw e; }
        }
        lastSyncedCanon = mergedCanon;
        const at = new Date().toISOString();
        setSs({ status: "ok", lastSyncAt: at });
        set(META_KEY, { lastSyncAt: at }).catch(() => {});
        return;
      }
      throw new Error("Conflit répété avec un autre appareil : réessaie dans un instant.");
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setSs({ status: "error", error: /fetch|network|Load failed/i.test(msg) ? "Pas de connexion : la synchronisation reprendra plus tard." : msg });
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}

function isDirty() { return lastSyncedCanon !== canonical(getState().progress); }

/** Branche la synchronisation automatique : au démarrage, au retour dans l'appli, et après chaque progrès. */
export function useProgressSync(ready: boolean) {
  useEffect(() => {
    if (!ready) return;
    get<{ lastSyncAt?: string }>(META_KEY).then((m) => { if (m?.lastSyncAt) setSs({ lastSyncAt: m.lastSyncAt }); }).catch(() => {});
    syncNow();
    let lastProgress = getState().progress;
    let lastEnabled = enabled();
    const unsub = subscribeStore(() => {
      const st = getState();
      const nowEnabled = enabled();
      if (nowEnabled !== lastEnabled) { lastEnabled = nowEnabled; syncNow(); }
      if (st.progress === lastProgress) return;
      lastProgress = st.progress;
      if (!nowEnabled || inflight || !isDirty()) return;
      window.clearTimeout(debounce);
      debounce = window.setTimeout(() => syncNow(), DEBOUNCE_MS);
    });
    const onVis = () => {
      if (document.visibilityState === "visible") syncNow();
      else if (enabled() && isDirty()) syncNow(); // on quitte l'appli : on envoie tout de suite
    };
    const onOnline = () => syncNow();
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("online", onOnline);
    return () => { unsub(); document.removeEventListener("visibilitychange", onVis); window.removeEventListener("online", onOnline); window.clearTimeout(debounce); };
  }, [ready]);
}
