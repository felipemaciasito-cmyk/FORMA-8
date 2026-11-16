// Voix de l'équipe : clés des répliques et contrôle des enregistrements (scripts/voix-lib.mjs).
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spokenText, fingerprint, voiceKey, voiceFile } from "../../src/lib/voice-key.js";
import { checkVoices, requiredLines } from "../../scripts/voix-lib.mjs";

test("le texte dit retire les balises de notions et le gras", () => {
  assert.equal(spokenText("Je garde ta **[[memoire|mémoire]]**  en  [[claude-code]]."), "Je garde ta mémoire en claude code.");
});

test("l'empreinte est stable et sensible au texte", () => {
  assert.equal(fingerprint("abc"), fingerprint("abc"));
  assert.notEqual(fingerprint("abc"), fingerprint("abd"));
  assert.match(fingerprint(""), /^[0-9a-f]{8}$/);
  // Le balisage ne change pas la clé : seul compte ce qui est dit.
  assert.equal(voiceKey("c01", "Je suis **là**."), voiceKey("c01", "Je suis là."));
  assert.notEqual(voiceKey("c01", "Je suis là."), voiceKey("c02", "Je suis là."));
});

test("le nom du fichier dépend de la voix et du texte envoyé", () => {
  assert.notEqual(voiceFile("ora", "v1", "Bonjour"), voiceFile("ora", "v2", "Bonjour"));
  assert.notEqual(voiceFile("ora", "v1", "Bonjour"), voiceFile("ora", "v1", "[whispering] Bonjour"));
  assert.match(voiceFile("ora", "v1", "Bonjour"), /^ora-[0-9a-f]{8}\.mp3$/);
});

const voix = { personnages: { c01: { nom: "L'Archiviste", voix: "A" }, c05: { nom: "L'Inspecteur", voix: "J", voixDuo: "O" } } };
const rooms = [{ id: "c01", steps: [{}] }, { id: "c05", steps: [] }];
const crew = { c01: { role: "Je range.", dort: "Je dors.", demi: "J'arrive.", reveil: "Me voilà." }, c05: { role: "Je vérifie.", dort: "Zzz.", demi: "Bientôt.", reveil: "Debout." } };
const rec = (speaker, voice, texte, envoye = texte) => ({ fichier: voiceFile(speaker, voice, envoye), voix: voice, envoye, texte, date: "2026-11-16" });

test("répliques requises : quatre pour un caisson jouable, deux pour un caisson en préparation", () => {
  const lines = requiredLines(rooms, crew);
  assert.deepEqual(lines.map((l) => l.where), ["c01.role", "c01.dort", "c01.demi", "c01.reveil", "c05.role", "c05.dort"]);
});

test("des enregistrements complets passent, une réplique manquante est signalée", () => {
  const dir = mkdtempSync(join(tmpdir(), "forma8-voix-"));
  const repliques = {};
  for (const l of requiredLines(rooms, crew)) {
    const p = voix.personnages[l.speaker];
    const r = rec(l.speaker, p.voix, l.text);
    if (p.voixDuo) r.duo = { fichier: voiceFile(l.speaker, p.voixDuo, l.text), voix: p.voixDuo };
    repliques[l.key] = r;
    writeFileSync(join(dir, r.fichier), "x");
    if (r.duo) writeFileSync(join(dir, r.duo.fichier), "x");
  }
  const ok = checkVoices({ voix, recordings: { repliques }, rooms, crew, voixDir: dir });
  assert.deepEqual(ok, { errors: [], warnings: [] });
  const sans = { ...repliques }; delete sans[voiceKey("c01", crew.c01.dort)];
  const r = checkVoices({ voix, recordings: { repliques: sans }, rooms, crew, voixDir: dir });
  assert.equal(r.errors.length, 0);
  assert.equal(r.warnings.length, 1);
  assert.match(r.warnings[0], /c01\.dort/);
});

test("un texte modifié, une autre voix, une seconde voix absente ou un fichier perdu bloquent", () => {
  const dir = mkdtempSync(join(tmpdir(), "forma8-voix-"));
  const bon = rec("c01", "A", "Je range.");
  const cas = {
    texte: { [voiceKey("c01", "Je range tout.")]: bon },
    voix: { [voiceKey("c01", "Je range.")]: rec("c01", "Z", "Je range.") },
    duo: { [voiceKey("c05", "Je vérifie.")]: rec("c05", "J", "Je vérifie.") },
    fichier: { [voiceKey("c01", "Je range.")]: bon },
  };
  for (const [nom, repliques] of Object.entries(cas)) {
    if (nom !== "fichier") for (const r of Object.values(repliques)) writeFileSync(join(dir, r.fichier), "x");
    const { errors } = checkVoices({ voix, recordings: { repliques }, rooms: [], crew: {}, voixDir: nom === "fichier" ? mkdtempSync(join(tmpdir(), "forma8-vide-")) : dir });
    assert.ok(errors.length > 0, `le cas « ${nom} » devrait bloquer`);
  }
});
