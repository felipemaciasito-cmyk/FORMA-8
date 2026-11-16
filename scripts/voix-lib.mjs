// Voix de l'équipe : règles communes au validateur (scripts/validate-content.mjs) et à l'outil d'enregistrement
// (scripts/voix.mjs). Voir src/content/voix.json et src/content/voix-enregistrements.json.
import { existsSync } from "node:fs";
import { join } from "node:path";
import { voiceKey, voiceFile } from "../src/lib/voice-key.js";

export const CREW_FIELDS = ["role", "dort", "demi", "reveil"];
export const speakerOf = (roomId) => (roomId === "c00" ? "ora" : roomId);

/**
 * Répliques qui doivent avoir une voix : pour un caisson jouable, ses quatre répliques ; pour un caisson en
 * préparation, seulement « role » et « dort » (les autres sont provisoires et seront réécrites avec le caisson).
 */
export function requiredLines(rooms, crew) {
  const out = [];
  for (const room of rooms) {
    const c = crew?.[room.id]; if (!c) continue;
    const fields = room.steps?.length ? CREW_FIELDS : ["role", "dort"];
    for (const f of fields) if (c[f]) out.push({ speaker: speakerOf(room.id), where: `${room.id}.${f}`, text: c[f], key: voiceKey(speakerOf(room.id), c[f]) });
  }
  return out;
}

/** Contrôle des enregistrements : renvoie { errors, warnings } (listes de messages). */
export function checkVoices({ voix, recordings, rooms, crew, voixDir }) {
  const errors = [], warnings = [];
  const persos = voix?.personnages ?? {};
  const recs = recordings?.repliques ?? {};
  for (const [key, r] of Object.entries(recs)) {
    const speaker = key.split(":")[0];
    const p = persos[speaker];
    if (!p) { errors.push(`${key} : personnage inconnu (${speaker})`); continue; }
    if (!r.fichier || !r.voix || !r.envoye || !r.texte) { errors.push(`${key} : champs manquants (fichier, voix, envoye, texte)`); continue; }
    if (voiceKey(speaker, r.texte) !== key) errors.push(`${key} : la clé ne correspond pas au texte « ${r.texte.slice(0, 40)}… »`);
    if (p.voix !== r.voix) errors.push(`${key} : enregistré avec la voix ${r.voix}, mais la voix de ${p.nom} est ${p.voix ?? "(non choisie)"}`);
    if (r.fichier !== voiceFile(speaker, r.voix, r.envoye)) errors.push(`${key} : nom de fichier inattendu (${r.fichier})`);
    if (voixDir && !existsSync(join(voixDir, r.fichier))) errors.push(`${key} : fichier absent dans public/voix (${r.fichier})`);
    // Deux voix pour un même personnage (« voixDuo ») : chaque réplique a sa seconde prise.
    if (p.voixDuo && !r.duo) errors.push(`${key} : seconde voix (duo) manquante pour ${p.nom}`);
    if (r.duo) {
      if (r.duo.voix !== p.voixDuo) errors.push(`${key} : seconde voix ${r.duo.voix}, attendue ${p.voixDuo ?? "(aucune)"}`);
      if (r.duo.fichier !== voiceFile(speaker, r.duo.voix, r.envoye)) errors.push(`${key} : nom de fichier inattendu pour la seconde voix (${r.duo.fichier})`);
      if (voixDir && !existsSync(join(voixDir, r.duo.fichier))) errors.push(`${key} : fichier absent dans public/voix (${r.duo.fichier})`);
    }
  }
  for (const line of requiredLines(rooms, crew)) {
    if (!recs[line.key]) warnings.push(`réplique sans voix : ${line.where} (${line.text.length} caractères à enregistrer)`);
  }
  return { errors, warnings };
}
