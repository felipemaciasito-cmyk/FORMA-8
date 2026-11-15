import { expect, test, type Page } from "@playwright/test";
import { boot } from "./helpers";

// Parcours du socle : démarrage, carte des caissons, onglets, stockage forma8:,
// et clin d'oeil FORMA-7 en lecture seule.

/** Lit toutes les entrées du stockage local partagé avec FORMA-7 (IndexedDB « keyval-store »). */
async function idbEntries(page: Page): Promise<Record<string, unknown>> {
  return page.evaluate(() => new Promise<Record<string, unknown>>((resolve, reject) => {
    const req = indexedDB.open("keyval-store");
    req.onupgradeneeded = () => req.result.createObjectStore("keyval");
    req.onerror = () => reject(req.error);
    req.onsuccess = () => {
      const tx = req.result.transaction("keyval", "readonly");
      const store = tx.objectStore("keyval");
      const out: Record<string, unknown> = {};
      const cur = store.openCursor();
      cur.onsuccess = () => {
        const c = cur.result;
        if (c) { out[String(c.key)] = c.value; c.continue(); } else resolve(out);
      };
      cur.onerror = () => reject(cur.error);
    };
  }));
}

async function seedForma7(page: Page, value: unknown) {
  await page.evaluate((v) => new Promise<void>((resolve, reject) => {
    const req = indexedDB.open("keyval-store");
    req.onupgradeneeded = () => req.result.createObjectStore("keyval");
    req.onerror = () => reject(req.error);
    req.onsuccess = () => {
      const tx = req.result.transaction("keyval", "readwrite");
      tx.objectStore("keyval").put(v, "forma7:progress");
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    };
  }), value);
}

test("démarrage puis carte des 11 caissons", async ({ page }) => {
  await boot(page);
  await expect(page.getByRole("button", { name: /^CAISSON \d\d / })).toHaveCount(11);
  for (const code of ["CAISSON 00", "CAISSON 05", "CAISSON 10"]) await expect(page.getByRole("button", { name: new RegExp(`^${code} `) })).toBeAttached();
  await expect(page.getByText("0 / 11 membres de l'équipe réveillés")).toBeVisible();
  await expect(page).toHaveTitle("FORMA-8");
});

test("navigation entre les onglets", async ({ page }) => {
  await boot(page);
  const nav = page.getByRole("navigation", { name: "Navigation principale" });
  await nav.getByRole("button", { name: "Base" }).click();
  await expect(page.getByText("Base de connaissances")).toBeVisible();
  await expect(page.getByText("Héritage FORMA-7")).toBeVisible();
  await nav.getByRole("button", { name: "Maint." }).click();
  await expect(page.getByText("Tes 5 boîtes")).toBeVisible();
  await nav.getByRole("button", { name: "Atelier" }).click();
  await expect(page.getByText("Atelier des consignes", { exact: true }).first()).toBeVisible();
  await nav.getByRole("button", { name: "Réglages" }).click();
  await expect(page.getByText("Claude dans l'appli (indispensable)")).toBeVisible();
  await expect(page.getByText("progress/forma-8.json")).toBeVisible();
});

test("ouvrir le caisson 00 : ses cinq protocoles de réveil", async ({ page }) => {
  await boot(page);
  await page.getByRole("button", { name: /CAISSON 00 ORA/ }).click();
  await expect(page.getByText("Protocoles de réveil")).toBeVisible();
  await expect(page.getByText(/PROTOCOLE 0[1-5]/)).toHaveCount(5);
});

test("le stockage n'utilise que des clés forma8:", async ({ page }) => {
  await boot(page);
  await page.waitForTimeout(600); // l'enregistrement est différé de 250 ms
  const keys = Object.keys(await idbEntries(page));
  expect(keys).toContain("forma8:progress");
  expect(keys).toContain("forma8:settings");
  expect(keys.filter((k) => k.startsWith("forma7:"))).toEqual([]);
});

test("clin d'oeil FORMA-7 : lu, affiché, jamais modifié", async ({ page }) => {
  const forma7 = { name: "Alex", energy: 450, counters: { iphone: { energy: 450 } }, notions: { ia: {}, prompt: {} }, badges: { boot: "2026-11-13", room1: "2026-11-13" } };
  await page.goto("./");
  await seedForma7(page, forma7);
  await page.reload();
  await page.locator(".boot").click();
  await expect(page.getByLabel("Ton prénom")).toBeVisible({ timeout: 15_000 });
  await page.getByRole("button", { name: "Prendre mon poste" }).click();
  await page.getByRole("button", { name: "Non merci" }).click();
  await page.getByRole("button", { name: "Abaisser le levier principal" }).click();
  await page.getByRole("navigation", { name: "Navigation principale" }).getByRole("button", { name: "Base" }).click();
  await expect(page.getByText("Pilote de baie")).toBeVisible();
  await expect(page.getByText(/2 notions collectées/)).toBeVisible();
  const after = await idbEntries(page);
  expect(after["forma7:progress"]).toEqual(forma7);
});
