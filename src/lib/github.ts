import { getState } from "./store";

// ---------------------------------------------------------------
// Accès à l'API GitHub avec le jeton du joueur (stocké sur l'appareil).
// Utilisé par la synchronisation, le clin d'oeil FORMA-7 et, plus tard,
// la vérification des livraisons.
// ---------------------------------------------------------------

export function ghHeaders(accept = "application/vnd.github+json"): Record<string, string> {
  return { Authorization: `Bearer ${getState().settings.ghToken}`, Accept: accept, "X-GitHub-Api-Version": "2022-11-28" };
}

export function repoUrl(owner: string, repo: string, path = "") {
  return `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}${path ? `/${path}` : ""}`;
}

export function ghError(status: number) {
  if (status === 401) return "Jeton refusé (401) : il est invalide ou expiré.";
  if (status === 403) return "Accès refusé (403) : vérifie les droits du jeton sur ce dépôt.";
  if (status === 404) return "Dépôt ou fichier introuvable (404) : vérifie le compte, le dépôt, et que le jeton y a accès.";
  return `Erreur GitHub ${status}.`;
}

/** Test de connexion pour l'écran Réglages : le jeton voit-il le dépôt de données ? */
export async function testGithub(): Promise<string> {
  const { ghOwner, ghRepo, ghToken } = getState().settings;
  if (!ghToken) throw new Error("Aucun jeton GitHub n'est enregistré.");
  const res = await fetch(repoUrl(ghOwner, ghRepo), { headers: ghHeaders(), cache: "no-store" });
  if (!res.ok) throw new Error(ghError(res.status));
  const json = (await res.json()) as { full_name: string; private: boolean; permissions?: { push?: boolean } };
  const write = json.permissions?.push;
  return `Connexion réussie au dépôt ${json.full_name}${json.private ? " (privé)" : ""}.${write === false ? " Attention : le jeton est en lecture seule, la synchronisation ne pourra pas écrire." : ""}`;
}
