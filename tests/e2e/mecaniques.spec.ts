import { expect, test } from "@playwright/test";
import { boot } from "./helpers";

// Mécaniques du lot 2 : atelier des consignes, équipe, produit, portfolio.

test("atelier des consignes : situations ouvertes et clé API demandée", async ({ page }) => {
  await boot(page);
  await page.getByRole("navigation", { name: "Navigation principale" }).getByRole("button", { name: "Atelier" }).click();
  await expect(page.getByText("Atelier des consignes", { exact: true }).first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Un bouton pour être contacté" })).toBeVisible();
  // Les situations qui utilisent des notions pas encore vues restent verrouillées.
  await expect(page.getByText(/autres situations s'ouvriront/)).toBeVisible();
  await page.getByPlaceholder("Ta consigne…").fill("Ajoute un bouton Nous contacter en bas de la page d'accueil, même style que les autres.");
  await expect(page.getByText("Clé API nécessaire")).toBeVisible();
  await page.getByRole("button", { name: "Skills" }).click();
  await expect(page.getByText("Forge de Skills")).toBeVisible();
});

test("l'équipe : fiches, produit enregistré et adresse publique", async ({ page }) => {
  await boot(page);
  await page.getByRole("button", { name: "Ton équipe", exact: true }).click();
  await expect(page.getByText("Ton équipe", { exact: true })).toBeVisible();
  await expect(page.getByText(/EN SOMMEIL/)).toHaveCount(11);
  await page.getByLabel("Nom de ton produit").fill("Carnet de chantier");
  await page.getByLabel("Dépôt du produit").fill("carnet-chantier");
  await expect(page.getByText("Page publiée attendue : https://felipemaciasito-cmyk.github.io/carnet-chantier/")).toBeVisible();
  // Le produit est conservé (synchronisable) dans la progression.
  await page.waitForTimeout(600); // laisse l'écriture locale se terminer avant de recharger
  await page.reload();
  await page.locator(".boot").click();
  // Au retour, l'appli rouvre l'écran où l'on était (ici, l'équipe).
  await expect(page.getByLabel("Nom de ton produit")).toHaveValue("Carnet de chantier", { timeout: 15_000 });
  await page.getByRole("navigation", { name: "Navigation principale" }).getByRole("button", { name: "Base" }).click();
  await expect(page.getByText("Portfolio · Carnet de chantier")).toBeVisible();
  await expect(page.getByText("En ligne : https://felipemaciasito-cmyk.github.io/carnet-chantier/")).toBeVisible();
});
