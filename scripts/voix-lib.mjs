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
export function requiredLines(rooms, crew, compagnon, interactions) {
  const out = [];
  // Répliques des interactions (src/content/interactions.json) : toutes.
  for (const l of interactionTexts(interactions)) out.push({ speaker: l.speaker, where: `interactions.${l.where}`, text: l.text, key: voiceKey(l.speaker, l.text) });
  // Répliques du compagnon (src/content/compagnon.json) : toutes, pour un caisson jouable.
  for (const room of rooms) {
    if (!room.steps?.length || !compagnon?.[room.id]) continue;
    for (const l of companionTexts(compagnon[room.id])) out.push({ speaker: speakerOf(room.id), where: `${room.id}.compagnon.${l.where}`, text: l.text, key: voiceKey(speakerOf(room.id), l.text) });
  }
  for (const room of rooms) {
    const c = crew?.[room.id]; if (!c) continue;
    const fields = room.steps?.length ? CREW_FIELDS : ["role", "dort"];
    for (const f of fields) if (c[f]) out.push({ speaker: speakerOf(room.id), where: `${room.id}.${f}`, text: c[f], key: voiceKey(speakerOf(room.id), c[f]) });
  }
  return out;
}

/** Toutes les répliques du compagnon d'un caisson, avec leur emplacement (pour les messages). */
export function companionTexts(c) {
  const out = [];
  // Réactions : une liste par sorte (ancienne forme), ou une liste par état de sommeil puis par sorte.
  for (const [k1, v1] of Object.entries(c.reactions ?? {})) {
    if (Array.isArray(v1)) v1.forEach((text, i) => out.push({ where: `reactions.${k1}.${i}`, text }));
    else for (const [k2, list] of Object.entries(v1)) list.forEach((text, i) => out.push({ where: `reactions.${k1}.${k2}.${i}`, text }));
  }
  for (const [step, p] of Object.entries(c.protocoles ?? {})) {
    if (p.debut) out.push({ where: `${step}.debut`, text: p.debut });
    for (const [b, text] of Object.entries(p.blocs ?? {})) out.push({ where: `${step}.bloc${b}`, text });
    if (p.fin) out.push({ where: `${step}.fin`, text: p.fin });
  }
  for (const k of ["carte", "panne", "panneFin", "livraison"]) if (c[k]) out.push({ where: k, text: c[k] });
  return out;
}

/**
 * Toutes les répliques des interactions, avec leur personnage (identifiant de voix), leur emplacement et, quand il
 * compte pour la règle « zéro zone de flou », le moment où elles s'affichent : « debut » (dès le début du jeu),
 * « apres:<caisson> » (une fois ce caisson terminé).
 */
export function interactionTexts(I) {
  const out = [];
  if (!I) return out;
  const add = (speaker, where, text, quand) => { if (text) out.push({ speaker, where, text, quand }); };
  add("ora", "boot.accueil", I.boot?.accueil, "debut");
  add("ora", "boot.ambiance", I.boot?.ambiance?.texte, "debut");
  add("ora", "boot.levier", I.boot?.levier, "debut");
  add("ora", "carte.premiere", I.carte?.premiere, "debut");
  for (const [etat, d] of Object.entries(I.carte?.surchauffe ?? {})) for (const k of ["question", "oui", "non"]) add("ora", `carte.surchauffe.${etat}.${k}`, d[k], etat === "eveil" ? "apres:c00" : "debut");
  for (const [room, list] of Object.entries(I.scenes ?? {})) list.forEach((l, i) => { if (!l.reveil) add(l.qui, `scenes.${room}.${i}`, l.texte, `apres:${room}`); });
  for (const sorte of ["retours", "toucher"]) for (const [qui, etats] of Object.entries(I[sorte] ?? {})) for (const [etat, list] of Object.entries(etats))
    list.forEach((t, i) => add(qui, `${sorte}.${qui}.${etat}.${i}`, t, etat === "eveil" ? `apres:${qui === "ora" ? "c00" : qui}` : "debut"));
  for (const [qui, d] of Object.entries(I.defis ?? {})) {
    const quand = `apres:${qui === "ora" ? "c00" : qui}`;
    (d.questions ?? []).forEach((q, i) => { add(qui, `defis.${qui}.${i}.question`, q.question, quand); add(qui, `defis.${qui}.${i}.piste`, q.piste, quand); });
    (d.bravo ?? []).forEach((t, i) => add(qui, `defis.${qui}.bravo.${i}`, t, quand));
    add(qui, `defis.${qui}.fait`, d.fait, quand);
  }
  for (const [qui, d] of Object.entries(I.question ?? {})) add(qui, `question.${qui}.cle`, d.cle, `apres:${qui === "ora" ? "c00" : qui}`);
  for (const [nom, d] of Object.entries(I.annexes ?? {})) for (const [etat, t] of Object.entries(d)) add("ora", `annexes.${nom}.${etat}`, t, etat === "eveil" ? "apres:c00" : "debut");
  return out;
}

/** Contrôle des enregistrements : renvoie { errors, warnings } (listes de messages). */
export function checkVoices({ voix, recordings, rooms, crew, compagnon, interactions, voixDir }) {
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
  for (const line of requiredLines(rooms, crew, compagnon, interactions)) {
    if (!recs[line.key]) warnings.push(`réplique sans voix : ${line.where} (${line.text.length} caractères à enregistrer)`);
  }
  return { errors, warnings };
}
