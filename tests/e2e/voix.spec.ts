import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { voiceKey } from "../../src/lib/voice-key.js";
import { boot } from "./helpers";

// Voix de l'équipe (règles du 17/11/2026) : toute bulle est lue à voix haute, dans l'ordre ; la première bulle de
// Forma Trisse se lit toute seule après le premier toucher (son débloqué), et toucher le personnage la relit.
// L'indicateur window.__forma8Voice donne la dernière réplique lancée (même son coupé : lecture muette).
const INTER = JSON.parse(readFileSync(new URL("../../src/content/interactions.json", import.meta.url), "utf8"));
const lastVoice = (page: import("@playwright/test").Page) => page.evaluate(() => (window as unknown as { __forma8Voice?: string }).__forma8Voice ?? "");

test("Forma Trisse lit sa première bulle, et la relit quand on la touche", async ({ page }) => {
  await page.goto("./");
  await page.getByRole("button", { name: "Mettre sous tension" }).click();
  await page.locator(".boot").click(); // accélère le BIOS
  await expect(page.getByLabel("Ton prénom")).toBeVisible({ timeout: 15_000 });
  const first = voiceKey("ora", INTER.boot.accueil);
  await expect.poll(() => lastVoice(page), { timeout: 20_000 }).toBe(first);
  // Elle dort encore : sa bulle le dit.
  await expect(page.locator(".bulle").first()).toContainText("parle en dormant");
  await page.evaluate(() => { (window as unknown as { __forma8Voice?: string }).__forma8Voice = ""; });
  await page.getByRole("button", { name: "Toucher Forma Trisse" }).click();
  await expect.poll(() => lastVoice(page), { timeout: 10_000 }).toBe(first);
});

test("réglage « Voix » coupé : la bulle s'écrit sans indicateur de voix", async ({ page }) => {
  await boot(page);
  await page.getByRole("button", { name: /régler le son/ }).click();
  await page.getByRole("dialog", { name: "Réglage du son" }).getByRole("switch", { name: "Voix", exact: true }).click();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Toucher Forma Trisse" }).first().click();
  await expect(page.locator(".bulle").first()).toBeVisible();
  await expect(page.locator(".bulle .voice-bars")).toHaveCount(0);
});
