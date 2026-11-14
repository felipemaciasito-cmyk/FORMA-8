// Fonctions GitHub sans dépendance (testables dans Node) : adresses et messages d'erreur.

export function repoUrl(owner: string, repo: string, path = "") {
  return `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}${path ? `/${path}` : ""}`;
}

export function apiHeaders(token: string, accept = "application/vnd.github+json"): Record<string, string> {
  const h: Record<string, string> = { Accept: accept, "X-GitHub-Api-Version": "2022-11-28" };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

export function ghError(status: number) {
  if (status === 401) return "Jeton refusé (401) : il est invalide ou expiré.";
  if (status === 403) return "Accès refusé (403) : vérifie les droits du jeton sur ce dépôt.";
  if (status === 404) return "Dépôt ou fichier introuvable (404) : vérifie le compte, le dépôt, et que le jeton y a accès.";
  return `Erreur GitHub ${status}.`;
}
