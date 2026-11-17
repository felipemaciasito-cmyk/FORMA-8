import { readFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";
import { closeGradeCeremony, dismissCeremonies, playMaintenance, playStep, sendArc, type Block, type Step } from "./helpers";

// Banc d'essai du caisson 02 (Général Calpin, « L'environnement de ton équipe ») : on joue tout le caisson comme le
// joueur, sur un écran d'iPhone. Les six protocoles et leurs exercices, les cinq simulateurs (fenêtre de contexte,
// boîte à outils, Forge de Skills, prises MCP, constructeur de jeton), les procédures, les ordres de mission, la panne,
// la livraison (GitHub simulé) et la maintenance. Aucune erreur ne doit apparaître dans la page.

const read = (f: string) => JSON.parse(readFileSync(new URL(`../../src/content/${f}`, import.meta.url), "utf8"));
type Room = { steps: (Step & { introduces: string[] })[]; incident: { scenarios: { options: { t: string; ok: boolean }[] }[] } };
const C00 = read("caissons/c00.json") as Room;
const C01 = read("caissons/c01.json") as Room;
const C02 = read("caissons/c02.json") as Room;
const GLOSSARY = read("glossary.json") as { id: string }[];

/** Les caissons 00 et 01 sont déjà réveillés (ils ont leurs propres bancs) : progression déposée dans la copie de secours. */
async function seedCaissons(page: Page) {
  const day = "2026-11-16";
  const rooms: [string, Room][] = [["c00", C00], ["c01", C01]];
  const progress = {
    name: "Alex", bootedOnce: true,
    steps: Object.fromEntries(rooms.flatMap(([id, r]) => r.steps.map((s) => [`${id}/${s.id}`, `${day}T08:00:00.000Z`]))),
    incidents: { c00: { at: `${day}T08:30:00.000Z`, fusesLeft: 3 }, c01: { at: `${day}T09:30:00.000Z`, fusesLeft: 3 } },
    notions: Object.fromEntries(rooms.flatMap(([id, r]) => r.steps.flatMap((s) => s.introduces).map((n) => [n, { box: 1, due: day, seenAt: day, room: id }]))),
    product: { name: "Carnet de chantier", pitch: "Pour les artisans : retrouver les photos d'un chantier en deux touchers", owner: "felipemaciasito-cmyk", repo: "carnet-chantier", at: `${day}T08:10:00.000Z` },
  };
  await page.addInitScript((p) => {
    if (sessionStorage.getItem("banc-c02")) return;
    sessionStorage.setItem("banc-c02", "1");
    localStorage.setItem("forma8:progress-secours", JSON.stringify(p));
  }, progress);
}

const sim = (page: Page, k = 0) => page.locator(".panel", { hasText: "Simulateur" }).nth(k);

async function playWidget(page: Page, b: Block, nth: number) {
  const w = sim(page, nth);
  await w.scrollIntoViewIfNeeded();
  if (b.widget === "ContextView") {
    // La consigne dite seulement dans la conversation se perd à la compaction ; écrite dans les règles, elle reste.
    await expect(w.getByText("CLAUDE.md")).toHaveCount(0); // le nom n'est défini qu'au protocole suivant
    const lire = w.getByRole("button", { name: "Lire la page d'accueil" });
    for (let i = 0; i < 6 && !(await w.getByText(/compaction/).first().isVisible()); i++) await lire.click();
    await expect(w.getByText(/elle a pu se perdre/)).toBeVisible();
    await w.getByRole("checkbox").check();
    for (let i = 0; i < 6 && !(await w.getByText(/elle est toujours là/).isVisible()); i++) await lire.click();
    await expect(w.getByText(/elle est toujours là/)).toBeVisible();
  } else if (b.widget === "SkillToolbox") {
    await w.getByRole("button", { name: "Sur iPhone, la page est-elle lisible ?" }).click();
    await expect(w.getByText(/Claude charge son contenu complet/)).toBeVisible();
  } else if (b.widget === "SkillForge") {
    await w.getByRole("button", { name: "Vérifier sur iPhone" }).click();
    await expect(w.getByRole("button", { name: "Termine les contrôles" })).toBeDisabled();
    await w.getByRole("button", { name: /^Vérifie qu'une page reste lisible/ }).click();
    await w.getByRole("button", { name: /^À utiliser quand on modifie une page/ }).click();
    // La règle la plus importante (repère « Ne jamais valider ») doit monter en tête.
    for (let k = 0; k < 4; k++) {
      const first = await w.locator("ol li").first().innerText();
      if (first.includes("Ne jamais valider")) break;
      const row = w.locator("ol li", { hasText: "Ne jamais valider" });
      await row.getByRole("button", { name: "Monter" }).click();
    }
    await w.getByRole("button", { name: "Essayer le skill" }).click();
    for (const r of ["Ma page s'affiche bien sur téléphone ?", "J'ai modifié la page d'accueil, vérifie-la", "Écris le message de commit"]) await w.getByRole("button", { name: r }).click();
    await w.getByRole("button", { name: "Finaliser ce skill" }).click();
    await expect(w.getByText("Skill forgé.")).toBeVisible();
    await expect(w.getByRole("button", { name: /Copier le SKILL.md/ })).toBeVisible();
  } else if (b.widget === "McpPlugs") {
    await w.getByRole("button", { name: /Base de données/ }).click();
    const effacer = w.locator(".choice", { hasText: "Effacer des données" });
    await effacer.getByRole("button", { name: "Refuser" }).click();
    await w.getByRole("button", { name: /Lancer la tâche/ }).click();
    await expect(w.getByText(/Refusé : la règle interdit cette action/)).toBeVisible();
  } else if (b.widget === "TokenBuilder") {
    await w.getByRole("button", { name: "Seulement FORMA-7-data" }).click();
    // Trois rangées ont un bouton « Aucun » : contenu (0), robots d'intégration (1), réglages des dépôts (2).
    const aucun = w.getByRole("button", { name: "Aucun", exact: true });
    await aucun.nth(1).click();
    await aucun.nth(2).click();
    await w.getByRole("button", { name: "90 jours" }).click();
    await expect(w.getByText("Moindre privilège")).toBeVisible();
  } else throw new Error(`simulateur non joué : ${b.widget}`);
}

test("le caisson 02 se joue entièrement, avec chaque outil d'apprentissage", async ({ page }) => {
  test.setTimeout(Number(process.env.E2E_TIMEOUT ?? 540_000));
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));

  // GitHub simulé : CLAUDE.md, .claude/settings.json et un skill dans .claude/skills.
  await page.route("https://api.github.com/repos/**", (route) => {
    const url = route.request().url();
    if (url.includes("/contents/CLAUDE.md")) return route.fulfill({ status: 200, json: { name: "CLAUDE.md" } });
    if (url.includes("/contents/.claude/settings.json")) return route.fulfill({ status: 200, json: { name: "settings.json" } });
    if (url.includes("/contents/.claude/skills")) return route.fulfill({ status: 200, json: [{ type: "dir", name: "verif-iphone" }] });
    return route.fulfill({ status: 404, json: {} });
  });

  await seedCaissons(page);
  await page.goto("./");
  await closeGradeCeremony(page);
  await expect(page.getByText("2 / 11 membres de l'équipe réveillés")).toBeVisible({ timeout: 20_000 });

  // Le caisson 02 est ouvert, avec ses six protocoles.
  await page.goto("./#/caisson/c02");
  await closeGradeCeremony(page);
  for (const s of C02.steps) await expect(page.getByText(s.title).first()).toBeVisible();

  const kinds = new Set(C02.steps.flatMap((s) => s.blocks.filter((b) => b.ex).map((b) => b.ex!.kind)));
  expect([...kinds].sort()).toEqual(["cloze", "order", "qcm", "truefalse", "wiring"]);
  const played: string[] = [];
  for (const [i, step] of C02.steps.entries()) {
    let nth = 0;
    await playStep(page, "c02", step, i + 1, async (b) => {
      if (b.type !== "interactive") return;
      await playWidget(page, b, nth++);
      played.push(`${step.id}:${b.widget}`);
    });
  }
  expect(played).toEqual(["p2:ContextView", "p5:SkillToolbox", "p5:SkillForge", "p5:McpPlugs", "p6:TokenBuilder"]);

  // La Forge a finalisé un skill : le badge « Forgeron de Skills » est obtenu.
  await page.goto("./#/base");
  await closeGradeCeremony(page);
  await expect(page.getByText("Forgeron de Skills").first()).toBeVisible();

  // Protocole 3 : ordre de mission personnalisé ; atelier noté par Claude (clé demandée).
  await page.goto("./#/caisson/c02/p3");
  await closeGradeCeremony(page);
  await expect(page.getByText(/dépôt de mon produit Carnet de chantier/).first()).toBeVisible();
  await expect(page.locator(".panel", { hasText: "Atelier des consignes" }).getByText("Clé API nécessaire")).toBeVisible();

  // Une notion du caisson s'ouvre depuis un terme cliquable.
  await page.locator("button.term", { hasText: "compaction" }).first().click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");

  // Panne : trois alertes, la bonne réponse à chaque fois, puis l'arc et la scène du réveil.
  await page.goto("./#/panne/c02");
  await closeGradeCeremony(page);
  for (const [k, sc] of C02.incident.scenarios.entries()) {
    const good = sc.options.find((o) => o.ok)!;
    await page.getByRole("button", { name: good.t.slice(0, 40) }).click();
    await page.getByRole("button", { name: k < C02.incident.scenarios.length - 1 ? /Alerte suivante/ : /Rétablir le courant/ }).click();
  }
  await expect(page.getByText("Panne réparée")).toBeVisible();
  await sendArc(page);
  await expect(page.getByRole("dialog", { name: /^Réveil :/ })).toBeVisible({ timeout: 5000 });
  await dismissCeremonies(page);

  // Livraison v0.2 : trois contrôles vérifiés sur GitHub (simulé), la synchronisation cochée à la main.
  await page.goto("./#/caisson/c02");
  await closeGradeCeremony(page);
  await page.getByRole("button", { name: /Vérifier ma livraison/ }).click();
  await expect(page.getByText("CLAUDE.md est bien présent.")).toBeVisible();
  await expect(page.getByText(".claude/settings.json est bien présent.")).toBeVisible();
  await expect(page.getByText("Trouvé dans .claude/skills : verif-iphone.")).toBeVisible();
  await page.getByRole("button", { name: "Cocher", exact: true }).click();
  await expect(page.getByText("Livraison validée")).toBeVisible();

  // Trois membres réveillés.
  await page.goto("./");
  await closeGradeCeremony(page);
  await expect(page.getByText("3 / 11 membres de l'équipe réveillés")).toBeVisible();

  // Base : toutes les notions collectées.
  await page.getByRole("navigation", { name: "Navigation principale" }).getByRole("button", { name: "Base" }).click();
  await expect(page.getByText(`${GLOSSARY.length} / ${GLOSSARY.length} notions collectées`)).toBeVisible();

  await playMaintenance(page);
  expect(errors).toEqual([]);
});
