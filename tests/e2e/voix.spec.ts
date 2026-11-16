import { expect, test } from "@playwright/test";
import { boot } from "./helpers";

// Voix de l'équipe : la première bulle d'ORA se lit toute seule après le premier toucher (son débloqué), et le
// bouton « Réécouter » la relance. L'indicateur window.__forma8Voice donne la dernière réplique lancée.
const lastVoice = (page: import("@playwright/test").Page) => page.evaluate(() => (window as unknown as { __forma8Voice?: string }).__forma8Voice ?? "");

test("ORA lit sa première bulle, et le bouton la relance", async ({ page }) => {
  await page.goto("./");
  await page.getByRole("button", { name: "Mettre sous tension" }).click();
  await page.locator(".boot").click(); // accélère le BIOS
  await expect(page.getByText("11 membres d'équipe")).toBeVisible({ timeout: 15_000 });
  // Lecture automatique : la voix démarre (préparation hors temps réel comprise).
  await expect.poll(() => lastVoice(page), { timeout: 20_000 }).toMatch(/^ora:[0-9a-f]{8}$/);
  const first = await lastVoice(page);
  // Pendant la lecture, le bouton propose d'arrêter ; on l'arrête, puis on réécoute.
  const stop = page.getByRole("button", { name: "Arrêter la voix de ORA" });
  const replay = page.getByRole("button", { name: "Réécouter ORA" });
  if (await stop.isVisible()) await stop.click();
  await expect(replay).toBeVisible();
  await page.evaluate(() => { (window as unknown as { __forma8Voice?: string }).__forma8Voice = ""; });
  await replay.click();
  await expect.poll(() => lastVoice(page), { timeout: 10_000 }).toBe(first);
  await expect(stop).toBeVisible();
});

test("réglage « Voix de l'équipe » coupé : plus de bouton de lecture", async ({ page }) => {
  await boot(page);
  await expect(page.getByRole("button", { name: /Réécouter ORA|Arrêter la voix de ORA/ })).toBeVisible();
  await page.getByRole("button", { name: /régler le son/ }).click();
  await page.getByRole("dialog", { name: "Réglage du son" }).getByRole("switch", { name: "Voix", exact: true }).click();
  await expect(page.getByRole("button", { name: /Réécouter ORA|Arrêter la voix de ORA/ })).toHaveCount(0);
});
