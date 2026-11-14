import { expect, type Page } from "@playwright/test";

/** Démarrage complet : BIOS, prénom, levier. */
export async function boot(page: Page, name = "Alex") {
  await page.goto("./");
  await expect(page.getByText("FORMA-8 · BIOS v8.0.26")).toBeVisible();
  await page.locator(".boot").click(); // accélère le BIOS
  await expect(page.getByText("11 membres d'équipe")).toBeVisible({ timeout: 15_000 });
  await page.getByLabel("Ton prénom").fill(name);
  await page.getByRole("button", { name: "Prendre mon poste" }).click();
  await page.getByRole("button", { name: "Abaisser le levier principal" }).click();
  await expect(page.getByText("Réserve de FORMA-8")).toBeVisible({ timeout: 15_000 });
}

