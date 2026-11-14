// Le validateur doit refuser un contenu mal formé (un garde-fou se teste aussi).
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, copyFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

function validate(caisson, glossary = []) {
  const dir = mkdtempSync(join(tmpdir(), "forma8-contenu-"));
  mkdirSync(join(dir, "caissons"));
  writeFileSync(join(dir, "glossary.json"), JSON.stringify(glossary));
  copyFileSync(join(root, "src", "content", "icon-ids.json"), join(dir, "icon-ids.json"));
  copyFileSync(join(root, "src", "content", "illustration-ids.json"), join(dir, "illustration-ids.json"));
  writeFileSync(join(dir, "caissons", "c00.json"), JSON.stringify(caisson));
  const r = spawnSync(process.execPath, [join(root, "scripts", "validate-content.mjs")], { env: { ...process.env, FORMA8_CONTENT_DIR: dir }, encoding: "utf8" });
  return { code: r.status, out: r.stdout + r.stderr };
}

const caisson = (steps, extra = {}) => ({ id: "c00", index: 0, code: "CAISSON 00", member: "ORA", name: "Test", version: "v0.0", tagline: "Un essai.", hue: 190, requires: [], steps, ...extra });
const notionTest = { id: "essai", term: "Essai", icon: "generic", def: { simple: "Une définition simple assez longue.", standard: "Une définition standard assez longue.", expert: "Une définition experte assez longue." }, analogy: "Comme un brouillon.", example: "Un exemple.", prereq: [] };

test("un contenu correct passe", () => {
  const step = { id: "p1", title: "Premier protocole", kicker: "Accroche", introduces: ["essai"], uses: [], blocks: [
    { type: "definition", notion: "essai" },
    { type: "source", title: "Documentation", url: "https://code.claude.com/docs/fr/overview", checked: "2026-11-14" },
    { type: "exercise", ex: { kind: "qcm", q: "Question ?", options: [{ t: "Oui", ok: true, why: "Parce que." }, { t: "Non", ok: false, why: "Non." }] } },
  ] };
  const r = validate(caisson([step], { delivery: { title: "v0.0", goal: "Publier", steps: [], checks: [{ id: "page", kind: "pages", label: "La page est en ligne" }] } }), [notionTest]);
  assert.equal(r.code, 0, r.out);
});

test("une notion utilisée avant d'être définie bloque", () => {
  const step = { id: "p1", title: "Titre", kicker: "Accroche", introduces: [], uses: [], blocks: [{ type: "text", md: "On parle de [[essai]] trop tôt." }] };
  const r = validate(caisson([step]), [notionTest]);
  assert.equal(r.code, 1);
  assert.match(r.out, /utilisée avant d'être définie/);
});

test("un ordre de mission sans texte et une livraison mal formée bloquent", () => {
  const step = { id: "p1", title: "Titre", kicker: "Accroche", introduces: [], uses: [], blocks: [{ type: "mission", title: "Mission", goal: "But", prompt: "", verify: [] }] };
  const r = validate(caisson([step], { delivery: { title: "v0.0", goal: "But", steps: [], checks: [{ id: "x", kind: "inconnu", label: "?" }, { id: "f", kind: "file", label: "Fichier" }] } }));
  assert.equal(r.code, 1);
  assert.match(r.out, /ordre de mission/);
  assert.match(r.out, /type de contrôle inconnu/);
  assert.match(r.out, /champ path requis/);
});

test("une source sans date de vérification bloque", () => {
  const step = { id: "p1", title: "Titre", kicker: "Accroche", introduces: [], uses: [], blocks: [{ type: "source", title: "Doc", url: "https://code.claude.com/docs/fr/overview", checked: "novembre" }] };
  const r = validate(caisson([step]));
  assert.equal(r.code, 1);
  assert.match(r.out, /AAAA-MM-JJ/);
});

test("un emoji dans le contenu bloque", () => {
  const step = { id: "p1", title: "Titre \u{1F680}", kicker: "Accroche", introduces: [], uses: [], blocks: [] };
  const r = validate(caisson([step]));
  assert.equal(r.code, 1);
  assert.match(r.out, /emoji interdit/);
});
