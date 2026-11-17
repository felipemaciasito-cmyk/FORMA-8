import { expect, type Locator, type Page } from "@playwright/test";

/** Démarrage complet : BIOS, prénom, levier. */
export async function boot(page: Page, name = "Alex") {
  await page.goto("./");
  // Premier lancement : l'écran est hors tension ; un toucher le met sous tension (et débloque le son sur iPhone).
  await page.getByRole("button", { name: "Mettre sous tension" }).click();
  await expect(page.getByText("FORMA-8 · BIOS v8.0.26")).toBeVisible();
  await page.locator(".boot").click(); // accélère le BIOS
  // Forma Trisse se réveille à moitié et demande le prénom (le champ suit sa bulle).
  await expect(page.getByLabel("Ton prénom")).toBeVisible({ timeout: 15_000 });
  await page.getByLabel("Ton prénom").fill(name);
  await page.getByRole("button", { name: "Prendre mon poste" }).click();
  // Forma Trisse propose le fond sonore : les choix apparaissent dans sa bulle, une fois sa phrase écrite.
  await page.getByRole("button", { name: "Non merci" }).click({ timeout: 20_000 });
  await page.getByRole("button", { name: "Abaisser le levier principal" }).click();
  await expect(page.getByText("Réserve de FORMA-8")).toBeVisible({ timeout: 15_000 });
}

// ---------- Outils communs aux bancs d'essai des caissons ----------
export type Ex = Record<string, unknown> & { kind: string };
export interface Block { type: string; ex?: Ex; widget?: string }
export interface Step { id: string; title: string; blocks: Block[] }

export const plainText = (s: string) => s.replace(/\[\[[a-z0-9-]+\|([^\]]+)\]\]/g, "$1").replace(/\*\*/g, "");

/** Résout l'exercice affiché dans le panneau donné, d'après les réponses du contenu. */
export async function solve(panel: Locator, ex: Ex) {
  switch (ex.kind) {
    case "qcm": {
      const good = (ex.options as { t: string; ok: boolean }[]).find((o) => o.ok)!;
      await panel.getByRole("button", { name: plainText(good.t).slice(0, 40) }).click();
      await expect(panel.getByText("Correct", { exact: true })).toBeVisible();
      break;
    }
    case "truefalse": {
      const items = ex.items as { ok: boolean }[];
      const rows = panel.locator(".choice");
      for (let i = 0; i < items.length; i++) await rows.nth(i).getByRole("button", { name: items[i].ok ? "Vrai" : "Faux" }).click();
      break;
    }
    case "cloze": {
      const answers = [...String(ex.text).matchAll(/\{\{([^}]+)\}\}/g)].map((m) => m[1]);
      for (const a of answers) await panel.getByRole("button", { name: a, exact: true }).click();
      await panel.getByRole("button", { name: "Vérifier", exact: true }).click();
      await expect(panel.getByText("Journal validé")).toBeVisible();
      break;
    }
    case "order": {
      const target = ex.items as string[];
      for (let t = 0; t < target.length; t++) {
        const current = await panel.locator("li .grow").allInnerTexts();
        let c = current.findIndex((x) => x.trim() === plainText(target[t]));
        while (c > t) { await panel.locator("li").nth(c).getByRole("button", { name: "Monter" }).click(); c--; }
      }
      await panel.getByRole("button", { name: "Vérifier l'ordre" }).click();
      await expect(panel.getByText("Séquence validée")).toBeVisible();
      break;
    }
    case "wiring": {
      for (const pr of ex.pairs as { l: string; r: string }[]) {
        await panel.getByRole("button", { name: pr.l, exact: true }).click();
        await panel.getByRole("button", { name: pr.r, exact: true }).click();
      }
      await panel.getByRole("button", { name: "Tester les connexions" }).click();
      await expect(panel.getByText("Réseau opérationnel")).toBeVisible();
      break;
    }
    case "feynman": {
      await panel.locator("textarea").fill(String(ex.model));
      await panel.getByRole("button", { name: "Comparer à la réponse modèle" }).click();
      for (const c of ex.criteria as string[]) await panel.getByRole("button", { name: c }).click();
      await panel.getByRole("button", { name: "Valider mon auto-évaluation" }).click();
      await expect(panel.getByText("Enregistré")).toBeVisible();
      break;
    }
    default: throw new Error(`type d'exercice non géré : ${ex.kind}`);
  }
}

export const LABEL: Record<string, string> = { qcm: "QCM", truefalse: "Vrai ou faux", cloze: "Texte à trous", order: "Remise en ordre", wiring: "Câblage", feynman: "Avec tes mots" };

/** Nombre de cérémonies de grade vues en quittant un écran (voir closeGradeCeremony). */
export const ceremonies = { grade: 0 };

/**
 * Un grade gagné pendant un protocole est annoncé quand le joueur quitte cet écran (choix du propriétaire,
 * 15/11/2026) : la cérémonie couvre alors l'écran suivant. On la referme, et on la compte.
 */
export async function closeGradeCeremony(page: Page) {
  const grade = page.getByRole("dialog", { name: /^Nouvelle accréditation/ }).first();
  await page.waitForTimeout(300);
  if (!(await grade.isVisible())) return;
  ceremonies.grade++;
  await grade.getByRole("button", { name: "Continuer" }).click();
  await expect(grade).toBeHidden();
}

/** Joue un protocole de bout en bout : affiche chaque bloc, résout chaque exercice, termine. */
export async function playStep(page: Page, roomId: string, step: Step, n: number, onBlock?: (block: Block, index: number) => Promise<void>) {
  await page.goto(`./#/caisson/${roomId}/${step.id}`);
  await closeGradeCeremony(page);
  await expect(page.getByText(step.title).first()).toBeVisible();
  const seen: Record<string, number> = {};
  for (let i = 0; i < step.blocks.length; i++) {
    const b = step.blocks[i];
    if (b.type === "exercise" && b.ex) {
      const label = LABEL[b.ex.kind];
      const k = seen[label] ?? 0; seen[label] = k + 1;
      const panel = page.locator(".panel", { hasText: `Vérification · ${label}` }).nth(k);
      await panel.scrollIntoViewIfNeeded();
      await solve(panel, b.ex);
    }
    // Bloc particulier (simulateur, procédure…) : le test du caisson s'en occupe ici.
    if (onBlock) await onBlock(b, i);
    if (i < step.blocks.length - 1) {
      const next = page.getByRole("button", { name: /^Continuer/ });
      await expect(next).toBeEnabled();
      // Juste après certains exercices (remise en ordre), la page bouge encore un instant : un clic du robot peut
      // tomber pendant ce mouvement et se perdre. On vérifie que le bloc suivant est bien apparu, et on reclique
      // sinon, comme le ferait un joueur.
      const counter = page.getByText(/^BLOC \d+ \/ \d+$/);
      const before = await counter.innerText();
      await expect(async () => {
        if ((await counter.innerText()) === before) await next.click();
        expect(await counter.innerText()).not.toBe(before);
      }).toPass({ timeout: 15_000 });
    }
  }
  // Jamais de cérémonie de grade pendant un protocole : elle attend que le joueur quitte l'écran.
  await expect(page.getByRole("dialog", { name: /^Nouvelle accréditation/ })).toHaveCount(0);
  await page.getByRole("button", { name: /Terminer le protocole/ }).click();
  await expect(page.getByText(`Protocole ${String(n).padStart(2, "0")} terminé`)).toBeVisible();
  await plugBattery(page);
  await expect(page.getByRole("dialog", { name: /^Nouvelle accréditation/ })).toHaveCount(0);
}

/**
 * Un écran plein écran (fin de protocole, cérémonie) doit tout couvrir : en haut de l'écran, on ne doit voir que la
 * barre du haut, puis cet écran, jamais la page qui est dessous (défaut vu par le propriétaire sur iPad, 15/11/2026).
 * On sonde des points le long du haut de l'écran, au-dessus, dans et juste sous la barre du haut.
 */
export async function expectCoversTop(page: Page, dialogName: RegExp | string) {
  const dialog = page.getByRole("dialog", { name: dialogName }).first();
  await expect(dialog).toBeVisible();
  const handle = await dialog.elementHandle();
  const leaks = await page.evaluate((dlg) => {
    const hud = document.querySelector(".hud");
    const hb = hud ? hud.getBoundingClientRect().bottom : 0;
    const w = window.innerWidth, out: string[] = [];
    for (const y of [1, hb * 0.5, hb - 6, hb + 4, hb + 20]) for (const x of [6, w * 0.25, w * 0.5, w * 0.75, w - 6]) {
      // La barre du haut et les notifications (badges, kW) ont le droit de passer par-dessus.
      const under = document.elementsFromPoint(x, y).find((el) => !hud?.contains(el) && !el.closest(".toast-zone"));
      if (under && dlg && !dlg.contains(under) && under !== document.documentElement && under !== document.body)
        out.push(`${Math.round(x)},${Math.round(y)} : ${under.tagName.toLowerCase()}.${String(under.className).slice(0, 40)}`);
    }
    return out;
  }, handle);
  expect(leaks, "la page du dessous apparaît en haut de l'écran").toEqual([]);
}

/** Fin de protocole : branche la batterie sur la capsule (un toucher sur la prise suffit), puis attend la suite. */
export async function plugBattery(page: Page) {
  await expectCoversTop(page, /^Protocole \d+ terminé$/);
  await page.getByRole("button", { name: /^Brancher la batterie/ }).click({ force: true }); // la prise bouge doucement
  await expect(page.getByRole("button", { name: "Retour au caisson" })).toBeVisible({ timeout: 8000 });
}

/** Maintient le doigt sur la centrale du caisson pendant `ms` millisecondes (tentative d'envoi de l'arc). */
export async function holdCentrale(page: Page, ms: number) {
  const c = page.getByRole("button", { name: /^Centrale : / }).first();
  await c.scrollIntoViewIfNeeded();
  const b = await c.boundingBox();
  if (!b) throw new Error("centrale introuvable");
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(ms);
  await page.mouse.up();
}

/** Panne réparée : toutes les prises sont branchées, on envoie l'arc depuis la centrale (réveil du membre). */
export async function sendArc(page: Page) {
  await expect(page.getByRole("button", { name: /^Centrale : maintiens pour envoyer l'arc/ })).toBeVisible();
  await holdCentrale(page, 3200);
}

/** Maintenance : entraînement libre sur les notions apprises, jusqu'à l'écran de fin. */
export async function playMaintenance(page: Page) {
  await page.getByRole("navigation", { name: "Navigation principale" }).getByRole("button", { name: "Maint." }).click();
  await page.getByRole("button", { name: "Entraînement libre" }).click();
  const finished = page.getByText("Maintenance terminée").first();
  const counter = page.getByText(/^Notion \d+ \/ \d+$/);
  for (let k = 0; k < 12 && !(await finished.isVisible()); k++) {
    const before = await counter.innerText();
    const flip = page.getByRole("button", { name: "Retourner la carte" });
    const choice = page.locator("button.choice:not([disabled])").first();
    await expect(flip.or(choice)).toBeVisible(); // la carte (à retourner ou à choix) est affichée
    if (await flip.isVisible()) { await flip.click(); await page.getByRole("button", { name: "Je savais" }).click(); }
    else await choice.click();
    // On attend la carte suivante (ou la fin) avant de continuer : pas de clic pendant une animation.
    await expect(async () => {
      const done = await finished.isVisible();
      expect(done || (await counter.innerText().catch(() => before)) !== before).toBeTruthy();
    }).toPass({ timeout: 6000 });
  }
  await expect(finished).toBeVisible();
}

/**
 * Ferme les cérémonies plein écran (réveil d'un membre, montée de grade) si elles sont affichées :
 * elles se superposent à l'écran et bloqueraient la suite du banc d'essai.
 */
export async function dismissCeremonies(page: Page) {
  for (let k = 0; k < 6; k++) {
    const wake = page.getByRole("dialog", { name: /^Réveil :/ });
    const grade = page.getByRole("dialog", { name: /^Nouvelle accréditation/ }).first();
    if (await wake.isVisible()) {
      await wake.click({ position: { x: 20, y: 20 } }); // passe directement à la fin de la scène
      await wake.getByRole("button", { name: /Accueillir dans l'équipe|Fermer/ }).click();
      await expect(wake).toBeHidden();
      continue;
    }
    if (await grade.isVisible()) {
      await grade.getByRole("button", { name: "Continuer" }).click();
      await expect(grade).toBeHidden();
      continue;
    }
    // Une cérémonie peut encore arriver (elles se suivent) : on laisse une courte chance.
    if (k === 0) { await page.waitForTimeout(1500); continue; }
    break;
  }
}
