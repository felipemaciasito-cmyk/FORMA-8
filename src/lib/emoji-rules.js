// Règle « zéro emoji » de FORMA-8 (reprise de FORMA-7) : source unique, partagée par l'appli
// (nettoyage à l'affichage) et par les scripts de contrôle (validateur,
// check-no-emoji). Écrite uniquement avec des échappements, pour que ce
// fichier passe lui-même le contrôle.
//
// Interdits :
//  - tout pictogramme emoji (propriété Unicode Extended_Pictographic),
//    les drapeaux, les sélecteurs de variante et modificateurs de teinte ;
//  - les symboles décoratifs utilisés comme pictos (coches, étoiles,
//    triangles de lecture, flèches circulaires, cibles…).
// Autorisés : les signes typographiques courants (copyright, marque
// déposée, marque commerciale) et les flèches de texte simples (dont la
// double flèche horizontale ou verticale).

const DECORATIVE =
  "\u2713\u2714\u2715\u2716\u2717\u2718" + // coches et croix
  "\u2726\u2727\u2733\u2734\u2735\u2736\u2737\u2738\u2739\u273A\u274B" + // étoiles et astérisques décoratifs
  "\u2605\u2606\u25CE\u25C9\u25CF\u25C6\u25C7" + // étoiles, cibles, pastilles
  "\u25B2\u25B3\u25B4\u25B6\u25B7\u25B8\u25B9\u25BA\u25BC\u25BD\u25BE\u25C0\u25C1\u25C2\u25C3\u25C4" + // triangles
  "\u21BA\u21BB\u27F2\u27F3" + // flèches circulaires
  "\u2753\u2754\u2755\u2757"; // points d'interrogation et d'exclamation ornés

const ALLOWED = new Set(["\u00A9", "\u00AE", "\u2122", "\u2194", "\u2195"]);

/** Expression globale qui repère chaque caractère interdit. */
export const EMOJI_RE = new RegExp(
  "[\\p{Extended_Pictographic}\\p{Regional_Indicator}\\u{FE0E}\\u{FE0F}\\u{20E3}\\u{1F3FB}-\\u{1F3FF}\\u{E0020}-\\u{E007F}" + DECORATIVE + "]",
  "gu",
);

/** Liste des caractères interdits présents dans un texte (vide si conforme). */
export function findEmoji(text) {
  const out = [];
  for (const m of String(text).matchAll(EMOJI_RE)) {
    if (!ALLOWED.has(m[0])) out.push({ char: m[0], index: m.index ?? 0 });
  }
  return out;
}

/** Code lisible d'un caractère, ex. « U+1F916 ». */
export function codepoint(ch) {
  return "U+" + ch.codePointAt(0).toString(16).toUpperCase().padStart(4, "0");
}

/** Retire les caractères interdits (et les espaces doublés qu'ils laissent). */
export function stripEmoji(text) {
  const s = String(text);
  if (!findEmoji(s).length) return s;
  return s
    .replace(EMOJI_RE, (c) => (ALLOWED.has(c) ? c : ""))
    .replace(/‍/g, "")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/^[ \t]+|[ \t]+$/gm, "");
}
