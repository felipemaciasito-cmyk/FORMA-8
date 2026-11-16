// Clés des voix de l'équipe, partagées par l'appli (src/lib/voice.ts) et le validateur (scripts/validate-content.mjs).
// Une réplique est retrouvée par son personnage et par le texte réellement dit : si le texte change, la clé change,
// et l'ancien enregistrement ne correspond plus (le validateur le signale).

/** Le texte tel qu'il est dit : sans balises de notions ([[id|texte]]), sans gras, espaces normalisés. */
export function spokenText(md) {
  return String(md)
    .replace(/\[\[[a-z0-9-]+\|([^\]]+)\]\]/g, "$1")
    .replace(/\[\[([a-z0-9-]+)\]\]/g, (_, id) => id.replace(/-/g, " "))
    .replace(/\*\*|__/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Empreinte courte (FNV-1a sur 32 bits), en hexadécimal. */
export function fingerprint(text) {
  let h = 0x811c9dc5;
  const s = String(text);
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
}

/** Clé d'une réplique : « personnage:empreinte du texte dit ». */
export function voiceKey(speaker, md) {
  return `${speaker}:${fingerprint(spokenText(md))}`;
}

/** Nom du fichier audio d'une réplique : dépend aussi de la voix et du texte envoyé à ElevenLabs. */
export function voiceFile(speaker, voiceId, sent) {
  return `${speaker}-${fingerprint(`${voiceId}|${sent}`)}.mp3`;
}
