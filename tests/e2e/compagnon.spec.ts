import { readFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";
import { voiceKey } from "../../src/lib/voice-key.js";
import { boot } from "./helpers";

// Le compagnon du protocole (16/11/2026) : le membre du caisson, dans son hublot à gauche de la batterie, parle à
// l'ouverture, à des passages clés, et réagit à certaines réponses : une piste après deux erreurs sur la même
// vérification, puis il salue la persévérance. Chaque réplique a sa voix ; toucher la bulle coupe la parole.
const COMP = JSON.parse(readFileSync(new URL("../../src/content/compagnon.json", import.meta.url), "utf8"));
const said = (page: Page) => page.evaluate(() => (window as unknown as { __forma8Compagnon?: string[] }).__forma8Compagnon ?? []);
const lastVoice = (page: Page) => page.evaluate(() => (window as unknown as { __forma8Voice?: string }).__forma8Voice ?? "");

/**
 * Ce que la bulle du compagnon recouvre : textes, boutons ou encadrés de la page qui croisent son rectangle, et la
 * batterie posée en bas de l'écran si elle passe par-dessus la bulle.
 */
function underBubble(page: Page) {
  return page.evaluate(() => {
    const b = document.querySelector(".companion-bubble"); if (!b) return ["pas de bulle"];
    const r = b.getBoundingClientRect(), out: string[] = [];
    const dock = document.querySelector(".battery-dock > div")?.getBoundingClientRect();
    if (dock && r.bottom > dock.top + 1) out.push(`la batterie cache le bas de la bulle (${Math.round(r.bottom)} > ${Math.round(dock.top)})`);
    document.querySelectorAll("main p, main button, main li, main h1, main h2, main .panel").forEach((el) => {
      if (b.contains(el) || el.contains(b) || el.closest(".battery-dock")) return;
      const e = el.getBoundingClientRect(); if (!e.width || !e.height) return;
      if (e.left < r.right && e.right > r.left && e.top < r.bottom && e.bottom > r.top) out.push(`${el.tagName} « ${(el.textContent ?? "").slice(0, 30)} »`);
    });
    return out;
  });
}

test("le compagnon accompagne le protocole et réagit aux erreurs", async ({ page }) => {
  test.setTimeout(120_000);
  await boot(page);
  await page.goto("./#/caisson/c00/p1");
  const bubble = page.locator(".companion-bubble");

  // Ouverture : Forma Trisse est dans son hublot, sa bulle apparaît et sa voix part.
  await expect(page.locator(".companion-port")).toBeVisible();
  await expect(bubble.last()).toContainText(COMP.c00.protocoles.p1.debut);
  await expect.poll(() => lastVoice(page), { timeout: 20_000 }).toBe(voiceKey("ora", COMP.c00.protocoles.p1.debut));
  // La bulle est dans la page : rien de la page n'est dessous, et elle n'est pas cachée par la batterie.
  await page.waitForTimeout(900);
  expect(await underBubble(page)).toEqual([]);
  // Toucher la bulle : la voix se tait et la bulle se range.
  await bubble.last().click({ position: { x: 30, y: 40 } }).catch(() => {});
  await expect(bubble).toHaveCount(0, { timeout: 15_000 });
  // Toucher le personnage rouvre sa bulle et relit sa réplique (il respire en continu : clic forcé).
  await page.getByRole("button", { name: "Toucher Forma Trisse" }).click({ force: true });
  await expect(bubble.last()).toContainText(COMP.c00.protocoles.p1.debut.slice(0, 12));
  await bubble.last().click({ position: { x: 30, y: 40 } }).catch(() => {});
  await expect(bubble).toHaveCount(0, { timeout: 15_000 });

  // Jusqu'au premier QCM (bloc 9) : le passage clé du bloc 6 est dit en route (un joueur qui passe très vite un
  // bloc ne l'entend pas : la réplique part 0,7 s après l'apparition du bloc).
  const next = page.getByRole("button", { name: /^Continuer/ });
  for (let i = 0; i < 9; i++) { await next.click(); await page.waitForTimeout(i === 5 ? 1200 : 250); }
  await expect.poll(() => said(page)).toContain(`bloc:${COMP.c00.protocoles.p1.blocs["6"]}`);

  // Deux mauvaises réponses : une piste. Puis la bonne : la persévérance est saluée.
  const panel = page.locator(".panel", { hasText: "Vérification · QCM" }).first();
  await panel.scrollIntoViewIfNeeded();
  const options = panel.locator("button.choice");
  const texts = await options.allInnerTexts();
  const c00 = JSON.parse(readFileSync(new URL("../../src/content/caissons/c00.json", import.meta.url), "utf8"));
  const qcm = c00.steps[0].blocks[9].ex as { options: { t: string; ok?: boolean }[] };
  const good = qcm.options.find((o) => o.ok)!.t;
  const wrong = texts.map((t, i) => ({ t, i })).filter(({ t }) => !t.includes(good)).slice(0, 2);
  for (const w of wrong) { await options.nth(w.i).click({ force: true }); await page.waitForTimeout(700); }
  await expect.poll(async () => (await said(page)).some((l) => l.startsWith("indice:"))).toBe(true);
  // La bulle de la piste s'ouvre dans la page, sous le bouton : elle ne cache ni les réponses ni aucun autre texte
  // (demande du propriétaire, 24/11/2026). Le joueur peut la toucher pour la fermer, puis répond. Le 17/11/2026, le clic
  // forcé sur la bonne réponse tombait parfois à côté (2 échecs sur 5) quand elle était en première position, sous la
  // barre du haut : d'où le clic normal ci-dessous.
  await expect(bubble.last()).toBeVisible();
  await page.waitForTimeout(900); // la page finit de remonter pour montrer la bulle
  expect(await underBubble(page)).toEqual([]);
  if (await bubble.count()) await bubble.last().click({ position: { x: 30, y: 40 }, timeout: 3000 }).catch(() => {});
  await expect(bubble).toHaveCount(0, { timeout: 15_000 });
  // Clic normal (pas forcé) : Playwright vérifie que rien ne couvre la réponse et la fait défiler en vue.
  await options.filter({ hasText: good }).click();
  await expect.poll(async () => (await said(page)).some((l) => l.startsWith("perseverance:"))).toBe(true);
});
