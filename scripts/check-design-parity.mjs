#!/usr/bin/env node
// =====================================================================
// Contrôle de parité visuelle entre FORMA-8 et FORMA-7.
//
// FORMA-8 doit avoir exactement l'esthétique de FORMA-7. Ce script vérifie,
// quand les deux dépôts sont présents :
//  1. les variables de « :root » (couleurs, rayons, polices) : identiques ;
//  2. les fichiers de la couche visuelle (liste « exact » de
//     scripts/design-parity.json) : identiques à ceux de FORMA-7, après
//     application des SEULES substitutions autorisées (textes et clés,
//     validées par le propriétaire) ;
//  3. les fichiers « enrichOnly » (glyphes, identifiants d'icônes) :
//     FORMA-8 peut en AJOUTER, jamais en modifier ni en retirer ;
//  4. les réglages obligatoires (couleur de thème #04060c, barre d'état
//     « black-translucent »).
// Tout autre écart est signalé et fait échouer le contrôle.
//
// Usage : node scripts/check-design-parity.mjs [--forma7 <dossier>] [--require]
//   --forma7  : dossier du dépôt FORMA-7 (sinon : variable FORMA7_DIR, puis
//               ../FORMA-7, ../forma-7, ../felipemaciasito-cmyk/forma-7, ./forma-7)
//   --require : échoue si FORMA-7 est introuvable (utilisé par l'intégration continue)
// =====================================================================
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const cfg = JSON.parse(readFileSync(join(root, "scripts", "design-parity.json"), "utf8"));
const args = process.argv.slice(2);
const argVal = (name) => { const i = args.indexOf(name); return i > -1 ? args[i + 1] : undefined; };
const require = args.includes("--require");

const candidates = [argVal("--forma7"), process.env.FORMA7_DIR, "../FORMA-7", "../forma-7", "../felipemaciasito-cmyk/forma-7", "forma-7"]
  .filter(Boolean).map((p) => resolve(root, p));
const f7 = candidates.find((p) => existsSync(join(p, "src", "styles", "app.css")) && existsSync(join(p, "src", "components", "Boot.tsx")));

if (!f7) {
  const msg = "FORMA-8 · parité visuelle : dépôt FORMA-7 introuvable, contrôle non effectué.";
  if (require) { console.error(`${msg} (--require : échec)`); process.exit(1); }
  console.log(`${msg} Indique son dossier avec --forma7 <dossier>.`);
  process.exit(0);
}

const errors = [];
const read = (base, rel) => readFileSync(join(base, rel), "utf8");

/** Applique les substitutions autorisées ; signale celles qui ne trouvent pas leur texte d'origine. */
function applySubs(rel, text) {
  let out = text;
  for (const s of cfg.substitutions[rel] ?? []) {
    if (!out.includes(s.from)) { errors.push(`[${rel}] substitution autorisée introuvable dans FORMA-7 (FORMA-7 a-t-il changé ?) : « ${s.from.slice(0, 70)} »`); continue; }
    out = out.split(s.from).join(s.to);
  }
  return out;
}

function firstDiff(a, b) {
  const la = a.split("\n"), lb = b.split("\n");
  const n = Math.max(la.length, lb.length);
  for (let i = 0; i < n; i++) if (la[i] !== lb[i]) return { line: i + 1, expected: la[i] ?? "(fin du fichier)", actual: lb[i] ?? "(fin du fichier)" };
  return null;
}

// ---------- 1. Variables de :root ----------
function rootVars(css) {
  const vars = new Map();
  for (const block of css.matchAll(/:root\s*\{([^}]*)\}/g)) {
    for (const m of block[1].matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) vars.set(m[1], m[2].trim());
  }
  return vars;
}
{
  const a = rootVars(read(f7, cfg.rootVariables)), b = rootVars(read(root, cfg.rootVariables));
  for (const [k, v] of a) {
    if (!b.has(k)) errors.push(`[:root] variable ${k} absente de FORMA-8 (FORMA-7 : ${v})`);
    else if (b.get(k) !== v) errors.push(`[:root] variable ${k} : ${b.get(k)} au lieu de ${v}`);
  }
  for (const k of b.keys()) if (!a.has(k)) errors.push(`[:root] variable ${k} ajoutée dans FORMA-8 : écart à valider`);
  console.log(`Variables de :root comparées : ${a.size}.`);
}

// ---------- 2. Fichiers identiques (après substitutions autorisées) ----------
for (const rel of cfg.exact) {
  if (!existsSync(join(f7, rel))) { errors.push(`[${rel}] absent de FORMA-7`); continue; }
  if (!existsSync(join(root, rel))) { errors.push(`[${rel}] absent de FORMA-8`); continue; }
  const expected = applySubs(rel, read(f7, rel));
  const actual = read(root, rel);
  if (expected !== actual) {
    const d = firstDiff(expected, actual);
    errors.push(`[${rel}] écart visuel non autorisé, ligne ${d?.line} :\n    attendu : ${d?.expected.trim().slice(0, 120)}\n    trouvé  : ${d?.actual.trim().slice(0, 120)}`);
  }
}

// ---------- 3. Fichiers enrichissables ----------
for (const rel of cfg.enrichOnly) {
  const a = read(f7, rel), b = read(root, rel);
  if (rel.endsWith(".json")) {
    const ja = JSON.parse(a), jb = JSON.parse(b);
    const walk = (x, y, path) => {
      if (x && typeof x === "object" && !Array.isArray(x)) {
        for (const k of Object.keys(x)) {
          if (!y || typeof y !== "object" || !(k in y)) errors.push(`[${rel}] entrée retirée : ${path}${k}`);
          else walk(x[k], y[k], `${path}${k}.`);
        }
      } else if (JSON.stringify(x) !== JSON.stringify(y)) errors.push(`[${rel}] entrée modifiée : ${path.slice(0, -1)}`);
    };
    walk(ja, jb, "");
  } else {
    // Chaque ligne de FORMA-7 doit se retrouver, dans le même ordre, dans FORMA-8.
    const lb = b.split("\n");
    let j = 0;
    for (const [i, line] of a.split("\n").entries()) {
      while (j < lb.length && lb[j] !== line) j++;
      if (j >= lb.length) { errors.push(`[${rel}] ligne ${i + 1} de FORMA-7 modifiée ou retirée : « ${line.trim().slice(0, 100)} »`); break; }
      j++;
    }
  }
}

// ---------- 4. Réglages obligatoires ----------
for (const [rel, needles] of Object.entries(cfg.required)) {
  const t = read(root, rel);
  for (const n of needles) if (!t.includes(n)) errors.push(`[${rel}] réglage obligatoire manquant : ${n}`);
}

console.log(`FORMA-8 · parité visuelle avec FORMA-7 (${f7}) : ${cfg.exact.length} fichiers identiques attendus, ${cfg.enrichOnly.length} enrichissables.`);
if (errors.length) {
  for (const e of errors) console.error(`x ${e}`);
  console.error(`\n${errors.length} écart(s) détecté(s). Tout écart visuel doit être validé explicitement par le propriétaire avant d'être fait.`);
  process.exit(1);
}
console.log("Parité visuelle respectée : aucun écart non autorisé.");
