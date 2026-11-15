import { readFileSync } from "node:fs";
import { devices, expect, test, type Page } from "@playwright/test";
import { expectCoversTop } from "./helpers";

// Contrôle d'affichage sur les deux appareils du propriétaire (iPhone et iPad en paysage) : l'écran de fin d'un
// protocole couvre tout l'écran ; rien du protocole ne doit apparaître autour de la barre du haut.
const C00 = JSON.parse(readFileSync(new URL("../../src/content/caissons/c00.json", import.meta.url), "utf8")) as { steps: { id: string }[] };

async function relaunchFirstStep(page: Page) {
  const day = "2026-11-14";
  await page.addInitScript((p) => {
    if (sessionStorage.getItem("banc-affichage")) return;
    sessionStorage.setItem("banc-affichage", "1");
    localStorage.setItem("forma8:progress-secours", JSON.stringify(p));
  }, { name: "Alex", bootedOnce: true, steps: { [`c00/${C00.steps[0].id}`]: `${day}T08:00:00.000Z` } });
  await page.goto(`./#/caisson/c00/${C00.steps[0].id}`);
  const next = page.getByRole("button", { name: /^Continuer/ });
  while (await next.isVisible()) { await next.click(); }
  await page.getByRole("button", { name: /Relancer le protocole/ }).click();
  // On fait défiler l'écran de fin : son contenu ne doit jamais passer au-dessus de la barre du haut.
  await page.mouse.wheel(0, 400);
  await expectCoversTop(page, "Protocole 01 terminé");
}

const { defaultBrowserType: _i, ...iphone } = devices["iPhone 13"];
const { defaultBrowserType: _p, ...ipad } = devices["iPad Pro 11 landscape"];

test.describe("iPhone", () => {
  test.use(iphone);
  test("écran de fin de protocole : rien ne dépasse en haut", async ({ page }) => { await relaunchFirstStep(page); });
});
test.describe("iPad en paysage", () => {
  test.use(ipad);
  test("écran de fin de protocole : rien ne dépasse en haut", async ({ page }) => { await relaunchFirstStep(page); });
});
