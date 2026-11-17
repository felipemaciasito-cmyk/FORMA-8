// Liste de travail des répliques du caisson 02 à enregistrer (17/11/2026) : texte, texte envoyé (indications de
// ton selon l'état de sommeil, comme au lot précédent) et voix. Usage : node outils/voix-c02/travail.mjs
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { requiredLines } from "../../scripts/voix-lib.mjs";
import { voiceKey } from "../../src/lib/voice-key.js";
const j = (p) => JSON.parse(readFileSync(p, "utf8"));
const rooms = readdirSync("src/content/caissons").sort().map((f) => j("src/content/caissons/" + f));
const req = requiredLines(rooms, j("src/content/equipe.json"), j("src/content/compagnon.json"), j("src/content/interactions.json"));
const rec = j("src/content/voix-enregistrements.json").repliques;
const voix = j("src/content/voix.json").personnages;
const SOMMEIL = "[sleepy] [mumbling] [slowly] ", DEMI = "[sleepy] ";
function etat(l) {
  const w = l.where;
  if (/\.sommeil|reactions\.sommeil|\.p[12]\b|\.p[12]\.|carte|\.demi$|equipe\.json\/c02\.demi|c02 \(.*demi/.test(w)) return SOMMEIL;
  if (/reactions\.demi|\.p[3-6]\b|\.p[3-6]\.|panne/.test(w)) return DEMI;
  return "";
}
const todo = req.filter((l) => !rec[voiceKey(l.speaker, l.text)]);
const out = todo.map((l) => ({ where: l.where, qui: l.speaker, voix: voix[l.speaker].voix, texte: l.text, envoye: etat(l) + l.text.replace(/\*\*/g, "") }));
writeFileSync("outils/voix-c02/travail.json", JSON.stringify(out, null, 1) + "\n");
const tot = out.reduce((a, b) => a + b.envoye.length, 0);
for (const o of out) console.log(o.where.padEnd(48), o.envoye.slice(0, 70));
console.log(out.length, "répliques,", tot, "caractères envoyés");
