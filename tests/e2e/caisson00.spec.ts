import { readFileSync } from "node:fs";
import { expect, test, type Locator, type Page } from "@playwright/test";
import { boot } from "./helpers";

// Banc d'essai du caisson 00 : on joue tout le caisson comme le joueur, sur un écran
// d'iPhone. Chaque type d'exercice est résolu, les simulateurs et procédures sont
// utilisés, la panne est réparée, la livraison vérifiée (GitHub simulé), la
// maintenance lancée. Aucune erreur ne doit apparaître dans la page.

type Ex = Record<string, unknown> & { kind: string };
interface Block { type: string; ex?: Ex; widget?: string }
interface Step { id: string; title: string; blocks: Block[] }
const C00 = JSON.parse(readFileSync(new URL("../../src/content/caissons/c00.json", import.meta.url), "utf8")) as {
  steps: Step[]; incident: { scenarios: { options: { t: string; ok: boolean }[] }[] };
};

const plainText = (s: string) => s.replace(/\[\[[a-z0-9-]+\|([^\]]+)\]\]/g, "$1").replace(/\*\*/g, "");

/** Résout l'exercice affiché dans le panneau donné, d'après les réponses du contenu. */
async function solve(panel: Locator, ex: Ex) {
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

const LABEL: Record<string, string> = { qcm: "QCM", truefalse: "Vrai ou faux", cloze: "Texte à trous", order: "Remise en ordre", wiring: "Câblage", feynman: "Avec tes mots" };

/** Joue un protocole de bout en bout : affiche chaque bloc, résout chaque exercice, termine. */
async function playStep(page: Page, step: Step, n: number) {
  await page.goto(`./#/caisson/c00/${step.id}`);
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
    if (i < step.blocks.length - 1) {
      const next = page.getByRole("button", { name: /^Continuer/ });
      await expect(next).toBeEnabled();
      await next.click();
    }
  }
  await page.getByRole("button", { name: /Terminer le protocole/ }).click();
  await expect(page.getByText(`Protocole ${String(n).padStart(2, "0")} terminé`)).toBeVisible();
}

test("le caisson 00 se joue entièrement, avec chaque outil d'apprentissage", async ({ page }) => {
  test.setTimeout(300_000);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));

  // GitHub simulé : le dépôt du produit contient index.html, et la page est en ligne.
  await page.route("https://api.github.com/repos/**", (route) =>
    route.request().url().includes("/contents/index.html") ? route.fulfill({ status: 200, json: { name: "index.html" } }) : route.fulfill({ status: 404, json: {} }));
  await page.route("https://felipemaciasito-cmyk.github.io/carnet-chantier/", (route) => route.fulfill({ status: 200, contentType: "text/html", body: "<h1>Carnet de chantier</h1>" }));

  await boot(page);

  // Protocoles 1 à 5, avec tous les types d'exercices.
  const kinds = new Set(C00.steps.flatMap((s) => s.blocks.filter((b) => b.ex).map((b) => b.ex!.kind)));
  expect([...kinds].sort()).toEqual(["cloze", "feynman", "order", "qcm", "truefalse", "wiring"]);
  for (const [i, step] of C00.steps.entries()) {
    if (step.id === "p4") {
      // Laboratoire produit : noter une idée sur les 5 critères, puis la choisir.
      await page.goto("./#/caisson/c00/p4");
      for (let k = 0; k < step.blocks.length - 1; k++) {
        const b = step.blocks[k];
        if (b.type === "exercise" && b.ex) {
          const label = LABEL[b.ex.kind];
          const idx = step.blocks.slice(0, k).filter((x) => x.ex && LABEL[x.ex.kind] === label).length;
          await solve(page.locator(".panel", { hasText: `Vérification · ${label}` }).nth(idx), b.ex);
        }
        if (b.type === "interactive" && b.widget === "ProductLab") {
          await page.getByLabel("Nom de l'idée 1").fill("Carnet de chantier");
          await page.getByLabel("Pour qui, pour quoi, idée 1").fill("Pour les artisans : retrouver les photos d'un chantier en deux touchers");
          for (const c of ["Utile", "Faisable", "Peu coûteux", "Potentiel", "Envie"]) await page.getByRole("button", { name: `${c} : 5 sur 5, idée 1` }).click();
          await page.getByRole("button", { name: "Choisir ce produit" }).first().click();
          await expect(page.getByText("Ton produit", { exact: true })).toBeVisible();
        }
        await page.getByRole("button", { name: /^Continuer/ }).click();
      }
      await page.getByRole("button", { name: /Terminer le protocole/ }).click();
      await expect(page.getByText("Protocole 04 terminé")).toBeVisible();
      continue;
    }
    await playStep(page, step, i + 1);
  }

  // Procédure pas à pas : cocher une étape, l'état est gardé.
  await page.goto("./#/caisson/c00/p5");
  const proc = page.locator(".panel", { hasText: "Créer le dépôt de ton produit" });
  await proc.getByRole("button", { name: "Marquer l'étape 1 comme faite" }).click();
  await expect(proc.getByText("Procédure · 1/6")).toBeVisible();
  // Ordre de mission personnalisé avec le produit choisi.
  await expect(page.getByText("Mon produit : Carnet de chantier.")).toBeVisible();

  // Fiche d'une notion depuis un terme cliquable, puis « Demander à ORA » (clé API demandée).
  await page.locator("button.term", { hasText: "dépôt" }).first().click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Demander à ORA" }).click();
  await expect(page.getByText("Clé API nécessaire")).toBeVisible();
  await page.keyboard.press("Escape");

  // Panne : trois scénarios, on choisit la bonne cause à chaque fois.
  await page.goto("./#/panne/c00");
  for (const [k, sc] of C00.incident.scenarios.entries()) {
    const good = sc.options.find((o) => o.ok)!;
    await page.getByRole("button", { name: good.t.slice(0, 40) }).click();
    await page.getByRole("button", { name: k < C00.incident.scenarios.length - 1 ? /Alerte suivante/ : /Rétablir le courant/ }).click();
  }
  await expect(page.getByText("Panne réparée")).toBeVisible();
  await expect(page.getByText("Sans un seul fusible grillé")).toBeVisible();

  // Livraison : dépôt du produit, vérification sur GitHub (simulé), puis contrôle manuel.
  await page.goto("./#/equipe");
  await page.getByLabel("Dépôt du produit").fill("carnet-chantier");
  await page.goto("./#/caisson/c00");
  await page.getByRole("button", { name: /Vérifier ma livraison/ }).click();
  await expect(page.getByText("index.html est bien présent.")).toBeVisible();
  await expect(page.getByText(/En ligne : https:\/\/felipemaciasito-cmyk\.github\.io\/carnet-chantier\//)).toBeVisible();
  await page.getByRole("button", { name: "Cocher", exact: true }).click();
  await expect(page.getByText("Livraison validée")).toBeVisible();

  // Le caisson est réveillé : la carte le montre, et le caisson suivant s'ouvre.
  await page.goto("./");
  await expect(page.getByText("1 / 11 membres de l'équipe réveillés")).toBeVisible();
  await expect(page.getByRole("button", { name: /^CAISSON 01 / })).toBeAttached();

  // Base : 23 notions collectées, portfolio avec la version 0.0.
  await page.getByRole("navigation", { name: "Navigation principale" }).getByRole("button", { name: "Base" }).click();
  await expect(page.getByText("23 / 23 notions collectées")).toBeVisible();
  await expect(page.getByText("Ta page de présentation en ligne")).toBeVisible();

  // Maintenance : entraînement libre sur les notions apprises.
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

  expect(errors).toEqual([]);
});
