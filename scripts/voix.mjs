#!/usr/bin/env node
// Outil des voix de l'équipe (voir src/content/voix.json).
//
//   node scripts/voix.mjs manquantes
//       Liste les répliques qui devraient avoir une voix, avec le nombre de caractères (1 crédit ElevenLabs par
//       caractère avec eleven_v4, vérifié le 16/11/2026 par une estimation).
//
//   node scripts/voix.mjs ajouter <personnage> <url-ou-fichier> --texte "<réplique affichée>" [--envoye "<texte envoyé>"]
//                                [--duo <url-ou-fichier>]
//       Copie une prise générée avec ElevenLabs (adresse de téléchargement, ou fichier mp3 déjà téléchargé) dans
//       public/voix et l'inscrit dans src/content/voix-enregistrements.json, avec la voix choisie pour ce personnage.
//       --duo : la prise de la seconde voix, pour un personnage qui parle à deux voix (« voixDuo »).
//
// Les générations se font avec le connecteur ElevenLabs de Claude Code (jamais depuis l'appli, jamais avec une clé
// écrite dans le dépôt).
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { voiceFile, voiceKey } from "../src/lib/voice-key.js";
import { requiredLines } from "./voix-lib.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const content = join(root, "src", "content");
const voixDir = join(root, "public", "voix");
const readJSON = (p) => JSON.parse(readFileSync(p, "utf8"));
const recPath = join(content, "voix-enregistrements.json");

function rooms() {
  return readdirSync(join(content, "caissons")).filter((f) => f.endsWith(".json")).sort().map((f) => readJSON(join(content, "caissons", f)));
}
function arg(name) { const i = process.argv.indexOf(name); return i > 0 ? process.argv[i + 1] : undefined; }

const [cmd, speaker, url] = process.argv.slice(2);
if (cmd === "manquantes") {
  const recs = readJSON(recPath).repliques;
  const comp = existsSync(join(content, "compagnon.json")) ? readJSON(join(content, "compagnon.json")) : null;
  const todo = requiredLines(rooms(), readJSON(join(content, "equipe.json")), comp).filter((l) => !recs[l.key]);
  let total = 0;
  const json = process.argv.includes("--json");
  for (const l of todo) { total += l.text.length; if (!json) console.log(`${l.where.padEnd(10)} ${String(l.text.length).padStart(4)}  ${l.text}`); }
  if (json) { console.log(JSON.stringify(todo)); process.exit(0); }
  console.log(`\n${todo.length} réplique(s) sans voix, ${total} caractères.`);
} else if (cmd === "ajouter" && speaker && url) {
  const texte = arg("--texte"); const envoye = arg("--envoye") ?? texte;
  if (!texte) throw new Error("--texte manquant");
  const voix = readJSON(join(content, "voix.json")).personnages[speaker];
  if (!voix) throw new Error(`personnage inconnu : ${speaker}`);
  if (!voix.voix) throw new Error(`aucune voix choisie pour ${voix.nom} dans src/content/voix.json`);
  const load = async (src) => {
    let buf;
    if (existsSync(src)) buf = readFileSync(src);
    else { const res = await fetch(src); if (!res.ok) throw new Error(`téléchargement refusé : ${res.status}`); buf = Buffer.from(await res.arrayBuffer()); }
    if (buf.length < 2000) throw new Error(`fichier trop petit (${buf.length} octets) : ce n'est sans doute pas un mp3`);
    return buf;
  };
  mkdirSync(voixDir, { recursive: true });
  const file = voiceFile(speaker, voix.voix, envoye);
  const buf = await load(url);
  writeFileSync(join(voixDir, file), buf);
  const entry = { fichier: file, voix: voix.voix, envoye, texte, date: new Date().toISOString().slice(0, 10) };
  const duoSrc = arg("--duo");
  if (voix.voixDuo && !duoSrc) throw new Error(`${voix.nom} parle à deux voix : --duo manquant`);
  if (duoSrc) {
    const duoFile = voiceFile(speaker, voix.voixDuo, envoye);
    writeFileSync(join(voixDir, duoFile), await load(duoSrc));
    entry.duo = { fichier: duoFile, voix: voix.voixDuo };
  }
  const rec = readJSON(recPath);
  rec.repliques[voiceKey(speaker, texte)] = entry;
  rec.repliques = Object.fromEntries(Object.entries(rec.repliques).sort(([a], [b]) => a.localeCompare(b)));
  writeFileSync(recPath, JSON.stringify(rec, null, 1) + "\n");
  console.log(`Ajouté : ${file} (${Math.round(buf.length / 1024)} Ko) pour ${voix.nom}.`);
} else {
  console.log("Usage : node scripts/voix.mjs manquantes | ajouter <personnage> <url> --texte \"…\" [--envoye \"…\"]");
  process.exit(1);
}
