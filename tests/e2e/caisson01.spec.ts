import { readFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";
import { closeGradeCeremony, dismissCeremonies, sendArc, playMaintenance, playStep, type Block, type Step } from "./helpers";

// Banc d'essai du caisson 01 (L'Archiviste) : on joue tout le caisson comme le joueur, sur
// un écran d'iPhone. Les cinq protocoles et leurs exercices, les trois simulateurs (machine
// à remonter les versions, branches dans ses trois modes, atelier des conflits), les
// procédures, l'ordre de mission, la panne, la livraison (GitHub simulé) et la maintenance.
// Aucune erreur ne doit apparaître dans la page.

const read = (f: string) => JSON.parse(readFileSync(new URL(`../../src/content/${f}`, import.meta.url), "utf8"));
const C00 = read("caissons/c00.json") as { steps: (Step & { introduces: string[] })[] };
const C01 = read("caissons/c01.json") as {
  steps: (Step & { introduces: string[] })[]; incident: { scenarios: { options: { t: string; ok: boolean }[] }[] };
};
const GLOSSARY = read("glossary.json") as { id: string }[];

/**
 * Le caisson 00 est déjà réveillé : on dépose une progression dans la copie de secours
 * (forma8:progress-secours), que l'appli fusionne au démarrage. Le caisson 00 a son propre banc.
 */
async function seedCaisson00(page: Page) {
  const day = "2026-11-14";
  const progress = {
    name: "Alex", bootedOnce: true,
    steps: Object.fromEntries(C00.steps.map((s) => [`c00/${s.id}`, `${day}T08:00:00.000Z`])),
    incidents: { c00: { at: `${day}T08:30:00.000Z`, fusesLeft: 3 } },
    notions: Object.fromEntries(C00.steps.flatMap((s) => s.introduces).map((id) => [id, { box: 1, due: day, seenAt: day, room: "c00" }])),
    product: { name: "Carnet de chantier", pitch: "Pour les artisans : retrouver les photos d'un chantier en deux touchers", owner: "felipemaciasito-cmyk", repo: "carnet-chantier", at: `${day}T08:10:00.000Z` },
  };
  await page.addInitScript((p) => {
    if (sessionStorage.getItem("banc-c01")) return; // une seule fois : ensuite, l'appli garde sa propre progression
    sessionStorage.setItem("banc-c01", "1");
    localStorage.setItem("forma8:progress-secours", JSON.stringify(p));
  }, progress);
}

/** Le panneau du k-ième simulateur affiché dans le protocole en cours. */
const sim = (page: Page, k = 0) => page.locator(".panel", { hasText: "Simulateur" }).nth(k);

async function playWidget(page: Page, stepId: string, b: Block, nth: number) {
  const w = sim(page, nth);
  await w.scrollIntoViewIfNeeded();
  const commit = w.getByRole("button", { name: "Commit", exact: true });
  if (b.widget === "TimeMachine") {
    await expect(w.getByText("HISTORIQUE · 5 VERSIONS")).toBeVisible();
    await w.getByRole("button", { name: /^Voir la version 1 :/ }).click();
    await expect(w.getByText("Le tout début")).toBeVisible();
    await w.getByRole("button", { name: /^Voir la version 3 :/ }).click();
    await w.getByRole("button", { name: "Restaurer cette version" }).click();
    await expect(w.getByText("HISTORIQUE · 6 VERSIONS")).toBeVisible(); // restaurer ajoute une version
    await expect(w.getByText("DÉFIS RÉUSSIS")).toBeVisible();
  } else if (b.widget === "GitBranches" && stepId === "p2") {
    // Mode « commits » : ni branche ni fusion, qui ne sont pas encore définies.
    await expect(w.getByRole("button", { name: "Créer une branche" })).toHaveCount(0);
    for (let i = 0; i < 3; i++) await commit.click();
    await w.getByRole("button", { name: "Commit 2 : Ajoute le titre" }).click();
    await expect(w.getByText("Commit 2 sur 4")).toBeVisible();
    await expect(w.getByText("DÉFIS RÉUSSIS")).toBeVisible();
  } else if (b.widget === "GitBranches" && stepId === "p3") {
    await expect(w.getByRole("button", { name: "Revenir en arrière" })).toHaveCount(0);
    await w.getByRole("button", { name: "Créer une branche" }).click();
    await commit.click(); await commit.click();
    await w.getByRole("button", { name: "Fusionner" }).click();
    await expect(w.getByText("DÉFIS RÉUSSIS")).toBeVisible();
  } else if (b.widget === "GitBranches") {
    await w.getByRole("button", { name: "Créer une branche" }).click();
    await commit.click();
    await w.getByRole("button", { name: "Fusionner" }).click();
    await w.getByRole("button", { name: "Revenir en arrière" }).click();
    await expect(w.getByText("HISTORIQUE · 4 commits")).toBeVisible(); // annuler ajoute un commit
    await w.getByRole("button", { name: "Commit 4 : Annule le dernier changement" }).click();
    await expect(w.getByText("DÉFIS RÉUSSIS")).toBeVisible();
  } else if (b.widget === "ConflictLab") {
    const next = w.getByRole("button", { name: /Choisir la version finale|Touche les 3 marqueurs/ });
    await expect(next).toBeDisabled();
    for (const m of ["<<<<<<< titre-court", "=======", ">>>>>>> main"]) await w.getByRole("button", { name: `Marqueur ${m}` }).click();
    await next.click();
    await w.getByRole("button", { name: "Tout laisser tel quel, marqueurs compris" }).click();
    await expect(w.getByText("Piège")).toBeVisible();
    await w.getByRole("button", { name: "Écrire une version qui combine les deux" }).click();
    await expect(w.getByText("<<<<<<< titre-court")).toHaveCount(0); // les marqueurs ont disparu
    await w.getByRole("button", { name: "Mark as resolved" }).click();
    await w.getByRole("button", { name: "Commit merge" }).click();
    await expect(w.getByText("Conflit résolu")).toBeVisible();
  } else throw new Error(`simulateur non joué : ${b.widget}`);
}

test("le caisson 01 se joue entièrement, avec chaque outil d'apprentissage", async ({ page }) => {
  test.setTimeout(Number(process.env.E2E_TIMEOUT ?? 300_000));
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));

  // GitHub simulé : 6 commits, une pull request fusionnée (et une fermée sans fusion), un README, la page en ligne.
  await page.route("https://api.github.com/repos/**", (route) => {
    const url = route.request().url();
    if (url.includes("/commits?")) return route.fulfill({ status: 200, json: Array.from({ length: 6 }, (_v, i) => ({ sha: `c${i}` })) });
    if (url.includes("/pulls?state=closed")) return route.fulfill({ status: 200, json: [{ number: 2, merged_at: "2026-11-15T10:00:00Z" }, { number: 1, merged_at: null }] });
    if (url.includes("/contents/README.md")) return route.fulfill({ status: 200, json: { name: "README.md" } });
    return route.fulfill({ status: 404, json: {} });
  });
  await page.route("https://felipemaciasito-cmyk.github.io/carnet-chantier/", (route) => route.fulfill({ status: 200, contentType: "text/html", body: "<h1>Carnet de chantier</h1>" }));

  await seedCaisson00(page);
  await page.goto("./");
  await closeGradeCeremony(page); // un grade retenu s'annonce en quittant l'écran précédent
  await expect(page.getByText("1 / 11 membres de l'équipe réveillés")).toBeVisible({ timeout: 20_000 });

  // Le caisson 01 est ouvert, avec ses cinq protocoles.
  await page.goto("./#/caisson/c01");
  await closeGradeCeremony(page); // un grade retenu s'annonce en quittant l'écran précédent
  for (const s of C01.steps) await expect(page.getByText(s.title).first()).toBeVisible();

  // Protocoles 1 à 5 : tous les types d'exercices, et chaque simulateur réellement utilisé.
  const kinds = new Set(C01.steps.flatMap((s) => s.blocks.filter((b) => b.ex).map((b) => b.ex!.kind)));
  expect([...kinds].sort()).toEqual(["cloze", "feynman", "order", "qcm", "truefalse", "wiring"]);
  const played: string[] = [];
  for (const [i, step] of C01.steps.entries()) {
    let nth = 0;
    await playStep(page, "c01", step, i + 1, async (b) => {
      if (b.type !== "interactive") return;
      await playWidget(page, step.id, b, nth++);
      played.push(`${step.id}:${b.widget}`);
    });
  }
  expect(played).toEqual(["p1:TimeMachine", "p2:GitBranches", "p3:GitBranches", "p5:GitBranches", "p5:ConflictLab"]);

  // Procédure pas à pas : cocher une étape, l'état est gardé ; l'aide « Je suis bloqué » existe.
  await page.goto("./#/caisson/c01/p2");
  await closeGradeCeremony(page); // un grade retenu s'annonce en quittant l'écran précédent
  const proc = page.locator(".panel", { hasText: "Lire l'historique de ton dépôt" });
  await proc.getByRole("button", { name: "Marquer l'étape 1 comme faite" }).click();
  await expect(proc.getByText("Procédure · 1/5")).toBeVisible();
  // Lecture guidée d'un vrai commit (étude de cas) : une ligne retirée, une ajoutée.
  await expect(page.getByText("Un vrai commit de FORMA-7")).toBeVisible();

  // Protocole 4 : ordre de mission personnalisé, liste de vérification gardée, atelier noté par Claude.
  await page.goto("./#/caisson/c01/p4");
  await closeGradeCeremony(page); // un grade retenu s'annonce en quittant l'écran précédent
  await expect(page.getByText(/de mon produit Carnet de chantier une section/)).toBeVisible();
  const mission = page.locator(".panel", { hasText: "Un changement relu de bout en bout" });
  await mission.getByRole("button", { name: /Dans Files changed, seul index.html est modifié/ }).click();
  await expect(mission.locator("button.choice.ok")).toHaveCount(1);
  await expect(page.locator(".panel", { hasText: "Atelier des consignes" }).getByText("Clé API nécessaire")).toBeVisible();

  // Une notion du caisson s'ouvre depuis un terme cliquable.
  await page.locator("button.term", { hasText: "relecture" }).first().click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");

  // Panne : trois alertes, la bonne réponse à chaque fois.
  await page.goto("./#/panne/c01");
  await closeGradeCeremony(page); // un grade retenu s'annonce en quittant l'écran précédent
  for (const [k, sc] of C01.incident.scenarios.entries()) {
    const good = sc.options.find((o) => o.ok)!;
    await page.getByRole("button", { name: good.t.slice(0, 40) }).click();
    await page.getByRole("button", { name: k < C01.incident.scenarios.length - 1 ? /Alerte suivante/ : /Rétablir le courant/ }).click();
  }
  await expect(page.getByText("Panne réparée")).toBeVisible();
  await sendArc(page);
  // Le membre se réveille (scène plein écran), puis la montée de grade éventuelle.
  await expect(page.getByRole("dialog", { name: /^Réveil :/ })).toBeVisible({ timeout: 5000 });
  await dismissCeremonies(page);

  // Livraison v0.1 : quatre contrôles vérifiés sur GitHub (simulé).
  await page.goto("./#/caisson/c01");
  await closeGradeCeremony(page); // un grade retenu s'annonce en quittant l'écran précédent
  await page.getByRole("button", { name: /Vérifier ma livraison/ }).click();
  await expect(page.getByText("6 commits trouvés.")).toBeVisible();
  await expect(page.getByText("1 pull request fusionnée.")).toBeVisible();
  await expect(page.getByText("README.md est bien présent.")).toBeVisible();
  await expect(page.getByText(/En ligne : https:\/\/felipemaciasito-cmyk\.github\.io\/carnet-chantier\//)).toBeVisible();
  await expect(page.getByText("Livraison validée")).toBeVisible();

  // Deux membres réveillés ; le caisson 02 est encore en préparation.
  await page.goto("./");
  await closeGradeCeremony(page); // un grade retenu s'annonce en quittant l'écran précédent
  await expect(page.getByText("2 / 11 membres de l'équipe réveillés")).toBeVisible();

  // Base : toutes les notions collectées, portfolio avec la version 0.1.
  await page.getByRole("navigation", { name: "Navigation principale" }).getByRole("button", { name: "Base" }).click();
  await expect(page.getByText(`${GLOSSARY.length} / ${GLOSSARY.length} notions collectées`)).toBeVisible();
  await expect(page.getByText("Un historique propre, par pull requests")).toBeVisible();

  // Atelier : la situation « Faire relire avant de fusionner » s'est ouverte.
  await page.goto("./#/atelier");
  await closeGradeCeremony(page); // un grade retenu s'annonce en quittant l'écran précédent
  await expect(page.getByText("Faire relire avant de fusionner")).toBeVisible();

  // Maintenance : entraînement libre sur les notions apprises.
  await playMaintenance(page);

  expect(errors).toEqual([]);
});
