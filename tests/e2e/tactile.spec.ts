import { readFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";
import { boot, closeGradeCeremony, playStep, solve, type Step } from "./helpers";

// Gestes au doigt. Le propriétaire joue sur iPhone : le 15/11/2026, il a signalé que la remise en ordre marchait à
// la souris mais pas au doigt (l'écran du protocole défile, et Safari prenait le glisser pour un défilement).
// Ici, de vrais touchers sont envoyés au navigateur (Chromium, protocole de débogage), pas des clics.
// Limite : Chromium ne reproduit pas exactement Safari ; le geste reste à confirmer sur un vrai iPhone.

const C00 = JSON.parse(readFileSync(new URL("../../src/content/caissons/c00.json", import.meta.url), "utf8")) as { steps: Step[] };

async function swipe(page: Page, from: { x: number; y: number }, toY: number) {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [from] });
  for (let k = 1; k <= 25; k++) {
    await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: from.x, y: from.y + ((toY - from.y) * k) / 25 }] });
    await page.waitForTimeout(16);
  }
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await page.waitForTimeout(500);
}

test("remise en ordre : une ligne se glisse au doigt, sans faire défiler l'écran", async ({ page }) => {
  test.setTimeout(120_000);
  await boot(page);
  await playStep(page, "c00", C00.steps[0], 1);

  // Protocole 2 : on avance jusqu'à la remise en ordre (le texte à trous qui la précède est résolu).
  const step = C00.steps[1];
  const at = step.blocks.findIndex((b) => b.ex?.kind === "order");
  await page.goto(`./#/caisson/c00/${step.id}`);
  await closeGradeCeremony(page);
  for (let i = 0; i < at; i++) {
    const b = step.blocks[i];
    if (b.ex?.kind === "cloze") await solve(page.locator(".panel", { hasText: "Vérification · Texte à trous" }).first(), b.ex);
    const next = page.getByRole("button", { name: /^Continuer/ });
    await expect(next).toBeEnabled();
    await next.click();
  }
  const panel = page.locator(".panel", { hasText: "Vérification · Remise en ordre" }).first();
  await panel.evaluate((el) => el.scrollIntoView({ block: "center" }));
  await page.waitForTimeout(600);

  const lines = panel.locator("li .grow");
  const before = await lines.allInnerTexts();
  const first = (await panel.locator("li").nth(0).locator(".grow").boundingBox())!;
  const third = (await panel.locator("li").nth(2).boundingBox())!;
  const screen = page.locator(".screen").first();
  const top = await screen.evaluate((el) => el.scrollTop);

  // La première ligne, glissée au doigt sous la troisième, prend la troisième place.
  await swipe(page, { x: first.x + 20, y: first.y + first.height / 2 }, third.y + third.height - 5);
  const after = await lines.allInnerTexts();
  expect(after[2]).toBe(before[0]);
  expect(after).not.toEqual(before);
  // L'écran n'a pas défilé pendant le geste.
  expect(await screen.evaluate((el) => el.scrollTop)).toBe(top);

  // Ailleurs que sur la liste, le doigt fait toujours défiler l'écran. On remonte d'abord un peu l'écran : tout en
  // bas, Chromium sans écran ne défile pas toujours au doigt. Les touchers simulés se perdent aussi parfois quand la
  // machine de test est chargée : on refait alors le geste.
  await screen.evaluate((el) => { el.scrollTop -= 300; });
  await page.waitForTimeout(300);
  const mid = await screen.evaluate((el) => el.scrollTop);
  // Point de départ : dans la zone qui défile, hors de la liste (espaces entre les lignes compris) et hors des
  // éléments fixes (barre d'énergie…).
  const spot = await page.evaluate(() => {
    const scr = document.querySelector(".screen")!;
    for (let y = Math.round(innerHeight * 0.3); y < innerHeight * 0.7; y += 10) {
      const el = document.elementFromPoint(40, y);
      if (el && scr.contains(el) && !el.closest(".order-list")) return { x: 40, y };
    }
    throw new Error("aucun point libre dans la zone qui défile");
  });
  await expect(async () => {
    await swipe(page, spot, spot.y + 160);
    expect(await screen.evaluate((el) => el.scrollTop)).toBeLessThan(mid);
  }).toPass({ timeout: 20_000 });
});
