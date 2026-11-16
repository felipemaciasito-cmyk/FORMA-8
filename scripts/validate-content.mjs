#!/usr/bin/env node
// =====================================================================
// Validateur « zéro zone de flou » de FORMA-8 (repris de FORMA-7).
//
// Règles (le build échoue si l'une d'elles est violée) :
//  1. Chaque notion du glossaire a un id unique, 3 niveaux de définition,
//     une analogie, un exemple, et des prérequis qui existent (sans boucle).
//  2. Les caissons sont parcourus dans l'ordre (champ index). Une notion doit
//     être introduite (introduces) avant d'être utilisée (uses ou [[id]]).
//     Dans le code, un caisson est une « room », un protocole de réveil une
//     « step » et une panne un « incident ».
//  3. Les prérequis d'une notion doivent être introduits avant elle.
//  4. Les [[références]] dans les définitions ne pointent que vers des
//     notions déjà connues au moment où la notion est introduite.
//  5. Un mot technique « surveillé » (champ watch) ne peut pas apparaître
//     en clair dans un protocole avant que sa notion soit introduite.
//  6. Les exercices sont bien formés (au moins une bonne réponse, etc.).
//  7. Chaque caisson a un code, un membre de l'équipe, un sujet, une version
//     et une teinte ; un caisson sans protocole est signalé « en préparation ».
//  9. Blocs propres à FORMA-8 (ordre de mission, consigne, rapport de bug,
//     lecture de modification, source datée) et livraisons bien formés.
//     Un simulateur doit exister, et son mode éventuel être reconnu.
// 12. Les répliques du compagnon (src/content/compagnon.json) suivent la même règle, à l'endroit où elles s'affichent.
// 10. Les répliques de l'équipe (src/content/equipe.json) n'emploient que des notions déjà
//     connues au moment où elles s'affichent.
// 11. Voix de l'équipe : chaque enregistrement (src/content/voix-enregistrements.json) a son fichier dans
//     public/voix, la voix choisie pour son personnage, et correspond au texte actuel ; une réplique qui devrait
//     être dite sans voix enregistrée est signalée (avertissement).
//  8. Zéro emoji : aucun emoji ni symbole décoratif dans le glossaire et les
//     caissons ; le champ « icon » d'une notion est un identifiant de
//     src/content/icon-ids.json.
//
// Usage : node scripts/validate-content.mjs
// =====================================================================
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { codepoint, findEmoji } from "../src/lib/emoji-rules.js";
import { checkVoices } from "./voix-lib.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
// FORMA8_CONTENT_DIR permet aux tests de valider un contenu volontairement fautif.
const contentDir = process.env.FORMA8_CONTENT_DIR ?? join(root, "src", "content");

const errors = [];
const warnings = [];
const err = (where, msg) => errors.push(`✗ [${where}] ${msg}`);
const warn = (where, msg) => warnings.push(`! [${where}] ${msg}`);

const readJSON = (p) => JSON.parse(readFileSync(p, "utf8"));

// ---------- Chargement ----------
const glossary = readJSON(join(contentDir, "glossary.json"));
const roomsDir = join(contentDir, "caissons");
const rooms = readdirSync(roomsDir).filter((f) => f.endsWith(".json")).map((f) => ({ file: f, ...readJSON(join(roomsDir, f)) }))
  .sort((a, b) => a.index - b.index);

const iconIds = readJSON(join(contentDir, "icon-ids.json"));
// Répliques des membres de l'équipe (facultatif dans les contenus de test).
const crewPath = join(contentDir, "equipe.json");
const crew = existsSync(crewPath) ? readJSON(crewPath) : null;
// Répliques du compagnon (facultatif dans les contenus de test).
const compPath = join(contentDir, "compagnon.json");
const compagnon = existsSync(compPath) ? readJSON(compPath) : null;
const ICONS = new Set([...Object.keys(iconIds.notions), ...Object.keys(iconIds.interface)]);

// ---------- 8. Zéro emoji ----------
/** Signale chaque emoji présent dans n'importe quelle chaîne (y compris les clés). */
function checkNoEmoji(obj, where) {
  const seen = new Set();
  const walk = (v, path) => {
    if (typeof v === "string") {
      for (const { char } of findEmoji(v)) {
        const k = `${path}:${char}`;
        if (seen.has(k)) continue;
        seen.add(k);
        err(where, `emoji interdit « ${char} » (${codepoint(char)}) dans ${path || "le texte"} : remplace-le par des mots, ou par un identifiant d'icône de src/content/icon-ids.json pour le champ icon. Texte : « ${v.slice(0, 70)} »`);
      }
    } else if (Array.isArray(v)) v.forEach((x, i) => walk(x, `${path}[${i}]`));
    else if (v && typeof v === "object") for (const [k, x] of Object.entries(v)) { walk(k, path ? `${path}.${k}` : k); walk(x, path ? `${path}.${k}` : k); }
  };
  walk(obj, "");
}
function checkIcon(n, where) {
  if (!n.icon) err(where, `notion ${n.id} : champ icon manquant (identifiant de src/content/icon-ids.json)`);
  else if (!ICONS.has(n.icon)) err(where, `notion ${n.id} : icône « ${n.icon} » inconnue. Choisis un identifiant dans src/content/icon-ids.json (section « notions »), par exemple « ${[...Object.keys(iconIds.notions)].slice(0, 4).join(" », « ")} ».`);
}

const byId = new Map();
for (const n of glossary) {
  if (byId.has(n.id)) err("glossaire", `id en double : ${n.id}`);
  byId.set(n.id, n);
}

// ---------- Utilitaires texte ----------
const REF_RE = /\[\[([a-z0-9-]+)(?:\|[^\]]+)?\]\]/g;
const norm = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
function refsIn(text) { return [...String(text).matchAll(REF_RE)].map((m) => m[1]); }
function stripRefs(text) { return String(text).replace(REF_RE, " ").replace(/`[^`]*`/g, " "); }
function escapeRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
function containsWord(text, word) {
  const t = norm(stripRefs(text));
  const w = norm(word);
  const re = new RegExp(`(^|[^a-z0-9])${escapeRe(w)}($|[^a-z0-9])`, "i");
  return re.test(t);
}

/** Récupère toutes les chaînes de texte d'un bloc ou d'un exercice. */
function textsOf(obj) {
  const out = [];
  const walk = (v, key) => {
    if (typeof v === "string") { if (!["type", "kind", "widget", "notion", "art", "tone", "id", "url", "file"].includes(key)) out.push(v); }
    else if (Array.isArray(v)) v.forEach((x) => walk(x, key));
    else if (v && typeof v === "object") for (const [k, x] of Object.entries(v)) walk(x, k);
  };
  walk(obj, "");
  return out;
}

// ---------- 1. Glossaire ----------
for (const n of glossary) {
  const w = `notion ${n.id}`;
  if (!/^[a-z0-9-]+$/.test(n.id)) err(w, "id invalide (minuscules, chiffres, tirets)");
  for (const lv of ["simple", "standard", "expert"]) if (!n.def?.[lv] || n.def[lv].length < 20) err(w, `définition « ${lv} » manquante ou trop courte`);
  if (!n.analogy) err(w, "analogie manquante");
  if (!n.example) err(w, "exemple manquant");
  if (!n.term) err(w, "terme manquant");
  checkIcon(n, "glossaire");
  for (const p of n.prereq ?? []) if (!byId.has(p)) err(w, `prérequis inconnu : ${p}`);
}
// boucles de prérequis
{
  const state = new Map();
  const visit = (id, path) => {
    if (state.get(id) === 2) return;
    if (state.get(id) === 1) { err("glossaire", `boucle de prérequis : ${[...path, id].join(" → ")}`); return; }
    state.set(id, 1);
    for (const p of byId.get(id)?.prereq ?? []) visit(p, [...path, id]);
    state.set(id, 2);
  };
  for (const n of glossary) visit(n.id, []);
}

checkNoEmoji(glossary, "glossaire");
if (crew) checkNoEmoji(crew, "equipe.json");
if (compagnon) checkNoEmoji(compagnon, "compagnon.json");
for (const room of rooms) checkNoEmoji(room, room.file);

// ---------- 6. Exercices ----------
function checkExercise(ex, where) {
  switch (ex.kind) {
    case "qcm":
      if (!ex.q) err(where, "QCM sans question");
      if (!ex.options?.length || ex.options.length < 2) err(where, "QCM : au moins 2 options");
      if (!ex.options?.some((o) => o.ok)) err(where, "QCM : aucune bonne réponse");
      for (const o of ex.options ?? []) if (!o.why) err(where, `QCM : option « ${o.t} » sans explication`);
      break;
    case "truefalse":
      if (!ex.items?.length) err(where, "Vrai/faux vide");
      for (const it of ex.items ?? []) if (typeof it.ok !== "boolean" || !it.why) err(where, `Vrai/faux mal formé : ${it.s}`);
      break;
    case "cloze": {
      const blanks = [...String(ex.text).matchAll(/\{\{([^}]+)\}\}/g)];
      if (!blanks.length) err(where, "Texte à trous sans {{trou}}");
      if (!ex.why) err(where, "Texte à trous sans explication");
      break;
    }
    case "order":
      if ((ex.items?.length ?? 0) < 3) err(where, "Remise en ordre : au moins 3 éléments");
      if (!ex.why) err(where, "Remise en ordre sans explication");
      break;
    case "wiring":
      if ((ex.pairs?.length ?? 0) < 3) err(where, "Câblage : au moins 3 paires");
      if (!ex.why) err(where, "Câblage sans explication");
      break;
    case "feynman":
      if (!ex.model || !(ex.criteria?.length >= 2)) err(where, "Feynman : réponse modèle et au moins 2 critères requis");
      break;
    default:
      err(where, `type d'exercice inconnu : ${ex.kind}`);
  }
}

// ---------- 9. Blocs et livraisons propres à FORMA-8 ----------
const blockIds = new Set();
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const ILLUSTRATIONS = new Set(Object.keys(readJSON(join(contentDir, "illustration-ids.json"))));
// Simulateurs existants (un fichier par simulateur) et modes reconnus. Un mode mal écrit
// afficherait le simulateur complet, donc des gestes pas encore appris : on le refuse.
const WIDGETS = new Set(readdirSync(join(root, "src", "components", "widgets")).filter((f) => f.endsWith(".tsx")).map((f) => f.replace(/\.tsx$/, "")));
const WIDGET_MODES = { GitBranches: ["commits", "branches"] };
function checkMechanicBlock(b, where) {
  switch (b.type) {
    case "interactive":
      if (!WIDGETS.has(b.widget)) err(where, `simulateur inconnu « ${b.widget} » : aucun fichier src/components/widgets/${b.widget}.tsx`);
      else if (b.mode !== undefined && !(WIDGET_MODES[b.widget] ?? []).includes(b.mode)) err(where, `simulateur ${b.widget} : mode inconnu « ${b.mode} »${WIDGET_MODES[b.widget] ? ` (modes possibles : ${WIDGET_MODES[b.widget].join(", ")})` : " (ce simulateur n'a pas de mode)"}`);
      break;
    case "analogy":
      // Seules les illustrations dessinées pour FORMA-8 sont permises (aucun contenu de FORMA-7).
      if (b.art && !ILLUSTRATIONS.has(b.art)) err(where, `illustration inconnue « ${b.art} » : choisis-en une dans src/content/illustration-ids.json`);
      break;
    case "mission":
      if (!b.title || !b.goal || !b.prompt) err(where, "ordre de mission : titre, objectif et texte requis");
      if (!Array.isArray(b.verify)) err(where, "ordre de mission : liste « verify » requise (peut être vide)");
      break;
    case "consigne":
    case "bugreport":
      if (!b.id) err(where, `${b.type} : identifiant requis`);
      else if (blockIds.has(b.id)) err(where, `${b.type} : identifiant en double ${b.id}`);
      else blockIds.add(b.id);
      if (!(b.expected?.length >= 3)) err(where, `${b.type} : au moins 3 points attendus`);
      if (b.type === "consigne" && !b.situation) err(where, "consigne : situation requise");
      if (b.type === "bugreport" && (!b.symptom || !b.context)) err(where, "rapport de bug : symptôme et contexte requis");
      break;
    case "diff":
      if (!b.file || !b.title || !(b.lines?.length)) err(where, "lecture de modification : titre, fichier et lignes requis");
      for (const l of b.lines ?? []) if (!["add", "del", "ctx"].includes(l.kind)) err(where, `ligne de modification invalide : ${l.kind}`);
      break;
    case "procedure":
      if (!b.id) err(where, "procédure : identifiant requis");
      else if (blockIds.has(`proc:${b.id}`)) err(where, `procédure : identifiant en double ${b.id}`);
      else blockIds.add(`proc:${b.id}`);
      if (!b.title || !(b.steps?.length >= 2)) err(where, "procédure : titre et au moins 2 étapes requis");
      for (const [k, st] of (b.steps ?? []).entries()) if (!st.do) err(where, `procédure : étape ${k + 1} sans action`);
      break;
    case "source":
      if (!/^https:\/\//.test(b.url ?? "")) err(where, `source : adresse invalide ${b.url}`);
      if (!ISO_DATE.test(b.checked ?? "")) err(where, "source : date de vérification au format AAAA-MM-JJ requise");
      break;
  }
}
const CHECK_KINDS = { manual: [], file: ["path"], commits: ["min"], pullsMerged: ["min"], workflow: [], pages: [] };
function checkDelivery(room) {
  const d = room.delivery;
  if (!d) return;
  const where = `${room.id}/livraison`;
  if (!d.title || !d.goal) err(where, "titre et objectif requis");
  if (!(d.checks?.length)) err(where, "au moins un contrôle requis");
  const ids = new Set();
  for (const c of d.checks ?? []) {
    if (!c.id || ids.has(c.id)) err(where, `contrôle sans identifiant ou en double : ${c.id}`);
    ids.add(c.id);
    if (!(c.kind in CHECK_KINDS)) { err(where, `type de contrôle inconnu : ${c.kind}`); continue; }
    for (const f of CHECK_KINDS[c.kind]) if (c[f] === undefined || c[f] === "") err(where, `contrôle ${c.id} : champ ${f} requis`);
    if (!c.label) err(where, `contrôle ${c.id} : libellé requis`);
  }
  if (!d.checks?.some((c) => c.kind !== "manual")) warn(where, "aucun contrôle vérifiable automatiquement");
}

// ---------- 2-5. Parcours des caissons ----------
const known = new Set();
const introducedWhere = new Map();

function introduce(ids, where, stepIntro) {
  for (const id of ids) {
    const n = byId.get(id);
    if (!n) { err(where, `introduit une notion inconnue : ${id}`); continue; }
    if (introducedWhere.has(id)) err(where, `notion « ${id} » déjà introduite dans ${introducedWhere.get(id)}`);
    for (const p of n.prereq ?? []) if (!known.has(p) && !stepIntro.has(p)) err(where, `notion « ${id} » introduite avant son prérequis « ${p} »`);
    for (const lv of ["simple", "standard", "expert"]) for (const r of refsIn(n.def[lv])) {
      if (!byId.has(r)) err(`notion ${id}`, `définition ${lv} : référence inconnue [[${r}]]`);
      else if (!known.has(r) && !stepIntro.has(r)) err(`notion ${id}`, `définition ${lv} : [[${r}]] n'est pas encore définie au moment où « ${id} » est introduite (${where})`);
    }
  }
  for (const id of ids) { known.add(id); introducedWhere.set(id, where); }
}

function checkTexts(texts, where, allowed) {
  for (const t of texts) {
    for (const r of refsIn(t)) {
      if (!byId.has(r)) err(where, `référence inconnue [[${r}]]`);
      else if (!known.has(r) && !allowed.has(r)) err(where, `[[${r}]] utilisée avant d'être définie`);
    }
    for (const n of glossary) {
      if (known.has(n.id) || allowed.has(n.id)) continue;
      for (const w of n.watch ?? []) {
        if (containsWord(t, w)) err(where, `le mot « ${w} » apparaît avant que la notion « ${n.id} » soit définie. Balise-le [[${n.id}]] après l'avoir introduite, ou reformule. Texte : « ${t.slice(0, 90)}… »`);
      }
    }
  }
}

/** Comme checkTexts, mais avec un ensemble de notions connues donné (au bloc près). */
function checkTextsAt(texts, where, knownHere) {
  for (const t of texts) {
    for (const r of refsIn(t)) {
      if (!byId.has(r)) err(where, `référence inconnue [[${r}]]`);
      else if (!knownHere.has(r)) err(where, `[[${r}]] utilisée avant d'être définie`);
    }
    for (const n of glossary) {
      if (knownHere.has(n.id)) continue;
      for (const w of n.watch ?? []) if (containsWord(t, w)) err(where, `le mot « ${w} » apparaît avant que la notion « ${n.id} » soit définie : « ${t.slice(0, 90)}… »`);
    }
  }
}

// ---------- 10. Répliques de l'équipe ----------
// « role » et « dort » s'affichent dès le début du jeu ; « demi » après le premier protocole du
// caisson ; « reveil » quand le caisson est terminé. Chacune ne peut employer que les notions connues à ce moment.
const CREW_FIELDS = ["role", "dort", "demi", "reveil"];
if (crew) {
  for (const room of rooms) {
    const c = crew[room.id];
    if (!c) { err("equipe.json", `répliques manquantes pour ${room.id} (${room.member})`); continue; }
    for (const f of CREW_FIELDS) if (!c[f] || c[f].length < 10) err("equipe.json", `${room.id} : réplique « ${f} » manquante ou trop courte`);
    checkTexts([c.role ?? "", c.dort ?? ""], `equipe.json/${room.id} (début du jeu)`, new Set());
  }
}
const crewCheck = (room, field, when) => { if (crew?.[room.id]?.[field]) checkTexts([crew[room.id][field]], `equipe.json/${room.id} (${when})`, new Set()); };

const roomIds = new Set(rooms.map((r) => r.id));
const indexes = new Set();
for (const room of rooms) {
  const rw = `${room.file}`;
  // ---------- 7. Fiche du caisson ----------
  for (const f of ["id", "code", "member", "name", "version", "tagline"]) if (!room[f]) err(rw, `champ manquant : ${f}`);
  if (typeof room.hue !== "number") err(rw, "teinte (hue) manquante");
  if (indexes.has(room.index)) err(rw, `index en double : ${room.index}`);
  indexes.add(room.index);
  if (!Array.isArray(room.steps)) err(rw, "liste des protocoles (steps) manquante");
  else if (!room.steps.length) warn(rw, "caisson en préparation : aucun protocole de réveil");
  for (const req of room.requires ?? []) if (!roomIds.has(req)) err(rw, `caisson requis inconnu : ${req}`);
  // Le titre d'un caisson annonce son sujet : il peut nommer les notions que le caisson va définir.
  checkTexts([room.member, room.name, room.tagline], rw, new Set(room.steps.flatMap((s) => s.introduces)));
  // ---------- 12. Compagnon (src/content/compagnon.json) ----------
  // Sur la carte et dans ses réactions, le membre ne peut employer que les notions connues avant son caisson.
  const comp = compagnon?.[room.id];
  const cw = (what) => `compagnon.json/${room.id} (${what})`;
  if (comp) {
    for (const k of Object.keys(comp.protocoles ?? {})) if (!room.steps.some((st) => st.id === k)) err(cw(k), `protocole inconnu : ${k}`);
    if (comp.carte) checkTexts([comp.carte], cw("carte"), new Set());
    for (const [kind, list] of Object.entries(comp.reactions ?? {})) checkTexts(list, cw(`réactions ${kind}`), new Set());
  }
  for (const [si, step] of room.steps.entries()) {
    const where = `${room.id}/${step.id}`;
    const stepIntro = new Set(step.introduces);
    introduce(step.introduces, where, stepIntro);
    for (const u of step.uses ?? []) {
      if (!byId.has(u)) err(where, `uses : notion inconnue ${u}`);
      else if (!known.has(u)) err(where, `uses : « ${u} » utilisée avant d'être définie`);
    }
    // Les notions introduites doivent avoir un bloc « definition » dans l'étape.
    const defined = new Set(step.blocks.filter((b) => b.type === "definition").map((b) => b.notion));
    for (const id of step.introduces) if (!defined.has(id)) err(where, `la notion « ${id} » est introduite sans bloc de définition`);
    checkTexts([step.title, step.kicker, ...step.blocks.flatMap((b) => textsOf(b))], where, new Set());
    const cp = comp?.protocoles?.[step.id];
    if (cp) {
      // Une réplique s'affiche quand son bloc apparaît : seules les notions définies jusqu'à ce bloc sont connues.
      const before = new Set([...known].filter((id) => !stepIntro.has(id)));
      const upTo = (k) => new Set([...before, ...step.blocks.slice(0, k + 1).filter((b) => b.type === "definition").map((b) => b.notion)]);
      if (cp.debut) checkTextsAt([cp.debut], cw(`${step.id} début`), upTo(0));
      for (const [b, t] of Object.entries(cp.blocs ?? {})) checkTextsAt([t], cw(`${step.id} bloc ${b}`), upTo(+b));
      if (cp.fin) checkTextsAt([cp.fin], cw(`${step.id} fin`), upTo(step.blocks.length));
      for (const b of Object.keys(cp.blocs ?? {})) if (!(+b >= 0 && +b < step.blocks.length)) err(cw(step.id), `bloc ${b} inexistant (le protocole a ${step.blocks.length} blocs)`);
    } else if (comp) warn(cw(step.id), "aucune réplique du compagnon pour ce protocole");
    step.blocks.forEach((b, i) => {
      if (b.type === "exercise") checkExercise(b.ex, `${where} bloc ${i}`);
      if (b.type === "definition" && !byId.has(b.notion)) err(where, `définition d'une notion inconnue : ${b.notion}`);
      checkMechanicBlock(b, `${where} bloc ${i}`);
    });
    if (!step.blocks.some((b) => b.type === "exercise")) warn(where, "protocole sans exercice de vérification");
    if (si === 0) crewCheck(room, "demi", "après le premier protocole");
  }
  if (!room.steps.length) crewCheck(room, "demi", "caisson en préparation");
  crewCheck(room, "reveil", "caisson terminé");
  if (room.incident) {
    const where = `${room.id}/panne`;
    checkTexts(textsOf(room.incident), where, new Set());
    for (const s of room.incident.scenarios) checkExercise({ kind: "qcm", q: s.q, options: s.options }, where);
  }
  if (room.project) checkTexts(textsOf(room.project), `${room.id}/projet`, new Set());
  if (room.delivery) { checkDelivery(room); checkTexts(textsOf(room.delivery), `${room.id}/livraison`, new Set()); }
  if (comp) checkTexts([comp.panne ?? "", comp.panneFin ?? "", comp.livraison ?? ""], cw("panne, livraison"), new Set());
  // La fiche de l'équipe s'affiche une fois le caisson terminé : elle peut nommer ses notions.
  if (room.teamFile) {
    if (!room.teamFile.label || !room.teamFile.path || !room.teamFile.role) err(rw, "fiche de l'équipe incomplète (label, path, role)");
    checkTexts([room.teamFile.label, room.teamFile.role], `${room.id}/équipe`, new Set());
  }
}

for (const n of glossary) if (!introducedWhere.has(n.id)) warn("glossaire", `notion jamais introduite dans un caisson : ${n.id}`);

// ---------- 11. Voix de l'équipe ----------
{
  const voixPath = join(contentDir, "voix.json"), recPath = join(contentDir, "voix-enregistrements.json");
  if (existsSync(voixPath) && existsSync(recPath)) {
    const voixDir = process.env.FORMA8_VOIX_DIR ?? join(here, "..", "public", "voix");
    const res = checkVoices({ voix: readJSON(voixPath), recordings: readJSON(recPath), rooms, crew, compagnon, voixDir });
    for (const e of res.errors) err("voix", e);
    for (const w of res.warnings) warn("voix", w);
  }
}

// ---------- Rapport ----------
const nNotions = glossary.length;
const nSteps = rooms.reduce((a, r) => a + r.steps.length, 0);
console.log(`FORMA-8 · validation du contenu : ${rooms.length} caissons, ${nSteps} protocoles, ${nNotions} notions.`);
for (const w of warnings) console.log(w);
if (errors.length) {
  for (const e of errors) console.error(e);
  console.error(`\n${errors.length} erreur(s) : des zones de flou ont été détectées. Build bloqué.`);
  process.exit(1);
}
console.log("✓ Aucune zone de flou détectée.");
