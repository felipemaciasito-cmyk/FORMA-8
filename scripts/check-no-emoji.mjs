#!/usr/bin/env node
// =====================================================================
// Contrôle « zéro emoji » du code de FORMA-8.
//
// Règle : jamais d'emoji dans l'application. Quand un pictogramme est utile,
// on utilise une icône maison (src/components/glyphs.ts, identifiants dans
// src/content/icon-ids.json).
//
// Analyse src/, index.html, vite.config.ts et les fichiers texte de public/.
// Le build échoue au moindre emoji ou symbole décoratif (règles partagées
// avec l'appli dans src/lib/emoji-rules.js).
//
// Usage : node scripts/check-no-emoji.mjs
// =====================================================================
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { codepoint, findEmoji } from "../src/lib/emoji-rules.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const TEXT = /\.(tsx?|jsx?|mjs|cjs|json|css|html|svg|webmanifest|md|txt)$/i;

function* files(p) {
  if (!existsSync(p)) return;
  if (statSync(p).isDirectory()) {
    for (const f of readdirSync(p)) yield* files(join(p, f));
  } else if (TEXT.test(p)) yield p;
}

const targets = [join(root, "src"), join(root, "public"), join(root, "index.html"), join(root, "vite.config.ts")];
const hits = [];
let scanned = 0;
for (const t of targets) {
  for (const f of files(t)) {
    scanned++;
    readFileSync(f, "utf8").split("\n").forEach((line, i) => {
      for (const { char, index } of findEmoji(line)) {
        hits.push(`✗ ${relative(root, f)}:${i + 1}:${index + 1}  « ${char} » ${codepoint(char)}  ${line.trim().slice(0, 90)}`);
      }
    });
  }
}

console.log(`FORMA-8 · contrôle zéro emoji : ${scanned} fichiers analysés.`);
if (hits.length) {
  for (const h of hits) console.error(h);
  console.error(`\n${hits.length} emoji ou symbole(s) décoratif(s) trouvé(s). Remplace-les par une icône maison (composant Icon, identifiants dans src/content/icon-ids.json). Build bloqué.`);
  process.exit(1);
}
console.log("✓ Aucun emoji dans l'application.");
