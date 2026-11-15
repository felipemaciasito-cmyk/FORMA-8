import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { boot, ceremonies, holdCentrale, closeGradeCeremony, dismissCeremonies, sendArc, LABEL, playMaintenance, playStep, solve, type Step } from "./helpers";

// Banc d'essai du caisson 00 : on joue tout le caisson comme le joueur, sur un écran
// d'iPhone. Chaque type d'exercice est résolu, les simulateurs et procédures sont
// utilisés, la panne est réparée, la livraison vérifiée (GitHub simulé), la
// maintenance lancée. Aucune erreur ne doit apparaître dans la page.

const C00 = JSON.parse(readFileSync(new URL("../../src/content/caissons/c00.json", import.meta.url), "utf8")) as {
  steps: Step[]; incident: { scenarios: { options: { t: string; ok: boolean }[] }[] };
};

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
      await closeGradeCeremony(page);
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
    await playStep(page, "c00", step, i + 1);
  }
  // Le grade Apprenti (150 kW) est gagné pendant un protocole : sa cérémonie s'est jouée en quittant l'écran,
  // jamais pendant la lecture (playStep le vérifie).
  expect(ceremonies.grade).toBeGreaterThan(0);

  // Les cinq prises de la centrale sont branchées, mais la panne coupe encore le circuit : toucher la centrale
  // tente d'envoyer l'arc, et la tentative échoue.
  await holdCentrale(page, 1600);
  await expect(page.getByText("Connexion impossible : la panne coupe le circuit. Répare-la d'abord.")).toBeVisible();

  // Procédure pas à pas : cocher une étape, l'état est gardé.
  // Le dernier protocole vient de se terminer : on referme sa cérémonie pour le relire.
  await page.getByRole("button", { name: "Relire le protocole" }).click();
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
  await closeGradeCeremony(page); // un grade retenu s'annonce en quittant l'écran précédent
  for (const [k, sc] of C00.incident.scenarios.entries()) {
    const good = sc.options.find((o) => o.ok)!;
    await page.getByRole("button", { name: good.t.slice(0, 40) }).click();
    await page.getByRole("button", { name: k < C00.incident.scenarios.length - 1 ? /Alerte suivante/ : /Rétablir le courant/ }).click();
  }
  await expect(page.getByText("Panne réparée")).toBeVisible();
  await sendArc(page);
  await expect(page.getByText("Sans un seul fusible grillé")).toBeVisible();
  // Le membre se réveille (scène plein écran), puis la montée de grade éventuelle.
  await expect(page.getByRole("dialog", { name: /^Réveil :/ })).toBeVisible({ timeout: 5000 });
  await dismissCeremonies(page);

  // Livraison : dépôt du produit, vérification sur GitHub (simulé), puis contrôle manuel.
  await page.goto("./#/equipe");
  await closeGradeCeremony(page); // un grade retenu s'annonce en quittant l'écran précédent
  await page.getByLabel("Dépôt du produit").fill("carnet-chantier");
  await page.goto("./#/caisson/c00");
  await closeGradeCeremony(page); // un grade retenu s'annonce en quittant l'écran précédent
  await page.getByRole("button", { name: /Vérifier ma livraison/ }).click();
  await expect(page.getByText("index.html est bien présent.")).toBeVisible();
  await expect(page.getByText(/En ligne : https:\/\/felipemaciasito-cmyk\.github\.io\/carnet-chantier\//)).toBeVisible();
  await page.getByRole("button", { name: "Cocher", exact: true }).click();
  await expect(page.getByText("Livraison validée")).toBeVisible();

  // Le caisson est réveillé : la carte le montre, et le caisson suivant s'ouvre.
  await page.goto("./");
  await closeGradeCeremony(page); // un grade retenu s'annonce en quittant l'écran précédent
  await expect(page.getByText("1 / 11 membres de l'équipe réveillés")).toBeVisible();
  await expect(page.getByRole("button", { name: /^CAISSON 01 / })).toBeAttached();

  // Base : les 23 notions du caisson 00 collectées (sur 34 depuis le caisson 01), portfolio avec la version 0.0.
  await page.getByRole("navigation", { name: "Navigation principale" }).getByRole("button", { name: "Base" }).click();
  await expect(page.getByText("23 / 34 notions collectées")).toBeVisible();
  await expect(page.getByText("Ta page de présentation en ligne")).toBeVisible();

  // Maintenance : entraînement libre sur les notions apprises.
  await playMaintenance(page);

  expect(errors).toEqual([]);
});
