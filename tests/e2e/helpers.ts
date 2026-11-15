import { expect, type Locator, type Page } from "@playwright/test";

/** Démarrage complet : BIOS, prénom, levier. */
export async function boot(page: Page, name = "Alex") {
  await page.goto("./");
  await expect(page.getByText("FORMA-8 · BIOS v8.0.26")).toBeVisible();
  await page.locator(".boot").click(); // accélère le BIOS
  await expect(page.getByText("11 membres d'équipe")).toBeVisible({ timeout: 15_000 });
  await page.getByLabel("Ton prénom").fill(name);
  await page.getByRole("button", { name: "Prendre mon poste" }).click();
  // ORA propose le fond sonore de la réserve avant le levier.
  await page.getByRole("button", { name: "Non merci" }).click();
  await page.getByRole("button", { name: "Abaisser le levier principal" }).click();
  await expect(page.getByText("Réserve de FORMA-8")).toBeVisible({ timeout: 15_000 });
}

// ---------- Outils communs aux bancs d'essai des caissons ----------
export type Ex = Record<string, unknown> & { kind: string };
export interface Block { type: string; ex?: Ex; widget?: string }
export interface Step { id: string; title: string; blocks: Block[] }

export const plainText = (s: string) => s.replace(/\[\[[a-z0-9-]+\|([^\]]+)\]\]/g, "$1").replace(/\*\*/g, "");

/** Résout l'exercice affiché dans le panneau donné, d'après les réponses du contenu. */
export async function solve(panel: Locator, ex: Ex) {
  switch (ex.kind) {
    case "qcm": {
      const good = (ex.options as { t: string; ok: boolean }[]).find((o) => o.ok)!;
      await panel.getByRole("button", { name: plainText(good.t).slice(0, 40) }).click();
      await expect(panel.getByText("Correct", { exact: true })).toBeVisible();
      break;
    }
    case "truefalse": {
      const items = ex.items as { ok: boolean }[];
      const rows = panel.locator(".choice");
      for (let i = 0; i < items.length; i++) await rows.nth(i).getByRole("button", { name: items[i].ok ? "Vrai" : "Faux" }).click();
      break;
    }
    case "cloze": {
      const answers = [...String(ex.text).matchAll(/\{\{([^}]+)\}\}/g)].map((m) => m[1]);
      for (const a of answers) await panel.getByRole("button", { name: a, exact: true }).click();
      await panel.getByRole("button", { name: "Vérifier", exact: true }).click();
      await expect(panel.getByText("Journal validé")).toBeVisible();
      break;
    }
    case "order": {
      const target = ex.items as string[];
      for (let t = 0; t < target.length; t++) {
        const current = await panel.locator("li .grow").allInnerTexts();
        let c = current.findIndex((x) => x.trim() === plainText(target[t]));
        while (c > t) { await panel.locator("li").nth(c).getByRole("button", { name: "Monter" }).click(); c--; }
      }
      await panel.getByRole("button", { name: "Vérifier l'ordre" }).click();
      await expect(panel.getByText("Séquence validée")).toBeVisible();
      break;
    }
    case "wiring": {
      for (const pr of ex.pairs as { l: string; r: string }[]) {
        await panel.getByRole("button", { name: pr.l, exact: true }).click();
        await panel.getByRole("button", { name: pr.r, exact: true }).click();
      }
      await panel.getByRole("button", { name: "Tester les connexions" }).click();
      await expect(panel.getByText("Réseau opérationnel")).toBeVisible();
      break;
    }
    case "feynman": {
      await panel.locator("textarea").fill(String(ex.model));
      await panel.getByRole("button", { name: "Comparer à la réponse modèle" }).click();
      for (const c of ex.criteria as string[]) await panel.getByRole("button", { name: c }).click();
      await panel.getByRole("button", { name: "Valider mon auto-évaluation" }).click();
      await expect(panel.getByText("Enregistré")).toBeVisible();
      break;
    }
    default: throw new Error(`type d'exercice non géré : ${ex.kind}`);
  }
}

export const LABEL: Record<string, string> = { qcm: "QCM", truefalse: "Vrai ou faux", cloze: "Texte à trous", order: "Remise en ordre", wiring: "Câblage", feynman: "Avec tes mots" };

/** Joue un protocole de bout en bout : affiche chaque bloc, résout chaque exercice, termine. */
export async function playStep(page: Page, roomId: string, step: Step, n: number, onBlock?: (block: Block, index: number) => Promise<void>) {
  await page.goto(`./#/caisson/${roomId}/${step.id}`);
  await expect(page.getByText(step.title).first()).toBeVisible();
  const seen: Record<string, number> = {};
  for (let i = 0; i < step.blocks.length; i++) {
    const b = step.blocks[i];
    if (b.type === "exercise" && b.ex) {
      const label = LABEL[b.ex.kind];
      const k = seen[label] ?? 0; seen[label] = k + 1;
      const panel = page.locator(".panel", { hasText: `Vérification · ${label}` }).nth(k);
      await panel.scrollIntoViewIfNeeded();
      await solve(panel, b.ex);
    }
    // Bloc particulier (simulateur, procédure…) : le test du caisson s'en occupe ici.
    if (onBlock) await onBlock(b, i);
    if (i < step.blocks.length - 1) {
      const next = page.getByRole("button", { name: /^Continuer/ });
      await expect(next).toBeEnabled();
      await next.click();
    }
  }
  await page.getByRole("button", { name: /Terminer le protocole/ }).click();
  await expect(page.getByText(`Protocole ${String(n).padStart(2, "0")} terminé`)).toBeVisible();
  await plugBattery(page);
}

/** Fin de protocole : branche la batterie sur la capsule (un toucher sur la prise suffit), puis attend la suite. */
export async function plugBattery(page: Page) {
  await page.getByRole("button", { name: /^Brancher la batterie/ }).click({ force: true }); // la prise bouge doucement
  await expect(page.getByRole("button", { name: "Retour au caisson" })).toBeVisible({ timeout: 8000 });
}

/** Panne réparée : réarme le disjoncteur pour faire passer le courant (réveil du membre). */
export async function rearmBreaker(page: Page) {
  await page.getByRole("button", { name: /Réarmer le disjoncteur/ }).click();
}

/** Maintenance : entraînement libre sur les notions apprises, jusqu'à l'écran de fin. */
export async function playMaintenance(page: Page) {
  await page.getByRole("navigation", { name: "Navigation principale" }).getByRole("button", { name: "Maint." }).click();
  await page.getByRole("button", { name: "Entraînement libre" }).click();
  const finished = page.getByText("Maintenance terminée").first();
  const counter = page.getByText(/^Notion \d+ \/ \d+$/);
  for (let k = 0; k < 12 && !(await finished.isVisible()); k++) {
    const before = await counter.innerText();
    const flip = page.getByRole("button", { name: "Retourner la carte" });
    const choice = page.locator("button.choice:not([disabled])").first();
    await expect(flip.or(choice)).toBeVisible(); // la carte (à retourner ou à choix) est affichée
    if (await flip.isVisible()) { await flip.click(); await page.getByRole("button", { name: "Je savais" }).click(); }
    else await choice.click();
    // On attend la carte suivante (ou la fin) avant de continuer : pas de clic pendant une animation.
    await expect(async () => {
      const done = await finished.isVisible();
      expect(done || (await counter.innerText().catch(() => before)) !== before).toBeTruthy();
    }).toPass({ timeout: 6000 });
  }
  await expect(finished).toBeVisible();
}

/**
 * Ferme les cérémonies plein écran (réveil d'un membre, montée de grade) si elles sont affichées :
 * elles se superposent à l'écran et bloqueraient la suite du banc d'essai.
 */
export async function dismissCeremonies(page: Page) {
  for (let k = 0; k < 6; k++) {
    const wake = page.getByRole("dialog", { name: /^Réveil :/ });
    const grade = page.getByRole("dialog", { name: /^Nouvelle accréditation/ }).first();
    if (await wake.isVisible()) {
      await wake.click({ position: { x: 20, y: 20 } }); // passe directement à la fin de la scène
      await wake.getByRole("button", { name: /Accueillir dans l'équipe|Fermer/ }).click();
      await expect(wake).toBeHidden();
      continue;
    }
    if (await grade.isVisible()) {
      await grade.getByRole("button", { name: "Continuer" }).click();
      await expect(grade).toBeHidden();
      continue;
    }
    // Une cérémonie peut encore arriver (elles se suivent) : on laisse une courte chance.
    if (k === 0) { await page.waitForTimeout(1500); continue; }
    break;
  }
}
