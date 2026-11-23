import type { DeliveryCheck } from "../content/types";
import { apiHeaders, ghError, repoUrl } from "./gh-core.ts";
import type { ProductInfo } from "./store";

// Contrôles de livraison, sans état : interrogent GitHub (ou la page publiée)
// et renvoient un résultat. Testables dans Node avec un faux « fetch ».

export interface CheckResult { ok: boolean; detail: string }

export interface CheckDeps {
  fetch: typeof fetch;
  token: string;
}

/** Adresse publique GitHub Pages du produit (même site que FORMA-8 : aucune restriction d'accès). */
export function pagesUrl(product: Pick<ProductInfo, "owner" | "repo">) {
  return `https://${product.owner.toLowerCase()}.github.io/${product.repo}/`;
}

async function api(deps: CheckDeps, product: ProductInfo, path: string) {
  return deps.fetch(repoUrl(product.owner, product.repo, path), { headers: apiHeaders(deps.token), cache: "no-store" });
}

/** Évalue un contrôle automatique. Ne modifie rien (fonction testable avec un faux fetch). */
export async function evaluateCheck(check: DeliveryCheck, product: ProductInfo, deps: CheckDeps): Promise<CheckResult> {
  if (check.kind === "manual") return { ok: false, detail: "À cocher toi-même." };
  if (!product.repo) return { ok: false, detail: "Indique d'abord le dépôt de ton produit." };
  switch (check.kind) {
    case "file": {
      const res = await api(deps, product, `contents/${check.path.split("/").map(encodeURIComponent).join("/")}`);
      if (res.status === 404) return { ok: false, detail: `${check.path} est introuvable dans ${product.repo}.` };
      if (!res.ok) return { ok: false, detail: ghError(res.status) };
      return { ok: true, detail: `${check.path} est bien présent.` };
    }
    case "folder": {
      const res = await api(deps, product, `contents/${check.path.split("/").map(encodeURIComponent).join("/")}`);
      if (res.status === 404) return { ok: false, detail: `Le dossier ${check.path} est introuvable dans ${product.repo}.` };
      if (!res.ok) return { ok: false, detail: ghError(res.status) };
      const list = (await res.json()) as { type: string; name: string }[] | { type: string };
      const dirs = Array.isArray(list) ? list.filter((e) => e.type === "dir").map((e) => e.name) : [];
      return dirs.length ? { ok: true, detail: `Trouvé dans ${check.path} : ${dirs.join(", ")}.` } : { ok: false, detail: `Le dossier ${check.path} ne contient encore aucun sous-dossier.` };
    }
    case "commits": {
      const res = await api(deps, product, "commits?per_page=100");
      if (res.status === 409) return { ok: false, detail: "Le dépôt est encore vide : aucun commit." };
      if (!res.ok) return { ok: false, detail: ghError(res.status) };
      const n = ((await res.json()) as unknown[]).length;
      return n >= check.min ? { ok: true, detail: `${n >= 100 ? "100 ou plus" : n} commits trouvés.` } : { ok: false, detail: `${n} commit${n > 1 ? "s" : ""} sur ${check.min} attendus.` };
    }
    case "pullsMerged": {
      const res = await api(deps, product, "pulls?state=closed&per_page=100");
      if (!res.ok) return { ok: false, detail: ghError(res.status) };
      const n = ((await res.json()) as { merged_at: string | null }[]).filter((p) => p.merged_at).length;
      return n >= check.min ? { ok: true, detail: `${n} pull request${n > 1 ? "s" : ""} fusionnée${n > 1 ? "s" : ""}.` } : { ok: false, detail: `${n} pull request fusionnée sur ${check.min} attendue${check.min > 1 ? "s" : ""}.` };
    }
    case "workflow": {
      const path = check.file ? `actions/workflows/${encodeURIComponent(check.file)}/runs?status=success&per_page=1` : "actions/runs?status=success&per_page=1";
      const res = await api(deps, product, path);
      if (res.status === 404) return { ok: false, detail: check.file ? `Le workflow ${check.file} est introuvable.` : "Aucun workflow trouvé." };
      if (!res.ok) return { ok: false, detail: res.status === 403 ? "Accès refusé (403) : ajoute la permission « Actions : Read-only » à ton jeton." : ghError(res.status) };
      const total = ((await res.json()) as { total_count: number }).total_count;
      return total > 0 ? { ok: true, detail: "Au moins une exécution réussie." } : { ok: false, detail: "Aucune exécution réussie pour l'instant." };
    }
    case "pages": {
      const url = pagesUrl(product);
      const res = await deps.fetch(url, { cache: "no-store" });
      return res.ok ? { ok: true, detail: `En ligne : ${url}` } : { ok: false, detail: `La page ne répond pas encore (${res.status}) : ${url}` };
    }
  }
}

