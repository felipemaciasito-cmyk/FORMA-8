// Bibliothèque de pictogrammes maison de FORMA-7 (aucun emoji).
// Grille 24 × 24, contenu entre 2 et 22, trait 1.8 aux bouts et angles arrondis.
// Chaque glyphe combine jusqu'à quatre couches :
//   d : trait principal (couleur pleine)
//   a : trait secondaire, plus discret (profondeur, détails)
//   f : aplats (voyants, points, pastilles)
//   t : monogramme typographique (marques citées sans logo)
// Les identifiants viennent de src/content/icon-ids.json : la vérification des
// types échoue s'il manque un dessin ou s'il y en a un de trop.
import ids from "../content/icon-ids.json";

export type IconId = keyof typeof ids.notions | keyof typeof ids.interface;
export interface Glyph { d?: string; a?: string; f?: string; t?: string }

export const NOTION_ICON_IDS = Object.keys(ids.notions) as IconId[];
export const UI_ICON_IDS = Object.keys(ids.interface) as IconId[];
export const ICON_LABELS: Record<string, string> = { ...ids.notions, ...ids.interface };

// ---------- Petits outils de tracé ----------
const n = (v: number) => +v.toFixed(2);
/** Rectangle aux coins arrondis. */
const rr = (x: number, y: number, w: number, h: number, r = 1.5) =>
  `M${n(x + r)} ${n(y)}h${n(w - 2 * r)}a${r} ${r} 0 0 1 ${r} ${r}v${n(h - 2 * r)}a${r} ${r} 0 0 1 ${-r} ${r}h${n(-(w - 2 * r))}a${r} ${r} 0 0 1 ${-r} ${-r}v${n(-(h - 2 * r))}a${r} ${r} 0 0 1 ${r} ${-r}Z`;
/** Cercle. */
const c = (cx: number, cy: number, r: number) => `M${n(cx - r)} ${n(cy)}a${r} ${r} 0 1 0 ${n(2 * r)} 0a${r} ${r} 0 1 0 ${n(-2 * r)} 0Z`;
/** Carré plein (touches, cases). */
const sq = (x: number, y: number, s = 1.6) => `M${x} ${y}h${s}v${s}h${-s}Z`;
const many = (...parts: string[]) => parts.join("");

// Formes réutilisées
const BUBBLE = "M4.5 4h15A1.5 1.5 0 0 1 21 5.5v10a1.5 1.5 0 0 1-1.5 1.5H11l-5 4v-4H4.5A1.5 1.5 0 0 1 3 15.5v-10A1.5 1.5 0 0 1 4.5 4Z";
const FILE = "M6 3h8l5 5v12a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Zm8 0v5h5";
const SHIELD = "M12 3 5 6v5.5c0 4.4 3 8 7 9.5 4-1.5 7-5.1 7-9.5V6l-7-3Z";
const REFRESH = "M20 11a8 8 0 0 0-14.8-4M4 4v4h4m-4 5a8 8 0 0 0 14.8 4M20 20v-4h-4";
const WRENCH = "M14.7 6.3a4 4 0 0 0-5.4 5.2L4 16.8V20h3.2l5.3-5.3a4 4 0 0 0 5.2-5.4l-2.6 2.6-2.4-.6-.6-2.4 2.6-2.6Z";
const FLAME = "M12 22c4 0 7-2.8 7-6.8 0-4.2-3-6.7-4.6-9.7-.5 2.3-1.8 3.6-3.1 4.2.1-2.8-1-5.6-3.3-7.7C8.4 6.6 5 9.6 5 15.2 5 19.2 8 22 12 22Z";
const BOLT = "M13 2 4 14h7l-1 8 9-12h-7l1-8Z";
const PLAY = "M8 5v14l11-7L8 5Z";
const CALENDAR = many(rr(3, 5, 18, 16, 2), "M3 10h18M8 3v4M16 3v4");
// Équerres d'angle qui encadrent les monogrammes.
const BRACKETS = "M3 8V6a1.5 1.5 0 0 1 1.5-1.5h2M17.5 4.5h2A1.5 1.5 0 0 1 21 6v2M21 16v2a1.5 1.5 0 0 1-1.5 1.5h-2M6.5 19.5h-2A1.5 1.5 0 0 1 3 18v-2";
const FOLDER = "M3 7a2 2 0 0 1 2-2h4l2 2.5h8a2 2 0 0 1 2 2V17a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z";

// Nœuds de la boucle d'agent : cinq points sur un anneau.
const ring = [0, 1, 2, 3, 4].map((k) => {
  const a = (k / 5) * Math.PI * 2 - Math.PI / 2;
  return c(12 + 7 * Math.cos(a), 12 + 7 * Math.sin(a), 1.9);
}).join("");

export const GLYPHS: Record<IconId, Glyph> = {
  // ======================= Notions =======================
  "neural-chip": {
    d: many(rr(6, 6, 12, 12, 1.5), "M9.5 3v3M14.5 3v3M9.5 18v3M14.5 18v3M3 9.5h3M3 14.5h3M18 9.5h3M18 14.5h3"),
    a: "M12 9.5 9.5 14.5h5Z",
    f: many(c(12, 9.5, 1.25), c(9.5, 14.5, 1.25), c(14.5, 14.5, 1.25)),
  },
  cube: { d: "M12 2.8 20 7.4v9.2L12 21.2 4 16.6V7.4L12 2.8Z", a: "M4 7.4l8 4.6 8-4.6M12 12v9.2" },
  dumbbell: { d: many(rr(4.5, 6.5, 3, 11, 1), rr(16.5, 6.5, 3, 11, 1), rr(2, 9, 2.5, 6, 0.8), rr(19.5, 9, 2.5, 6, 0.8), "M7.5 12h9") },
  "chat-lines": { d: BUBBLE, a: "M7.5 9h9M7.5 12.5h6" },
  tokens: { d: many(rr(2.5, 7.5, 5.5, 7, 1.2), rr(9.5, 7.5, 4, 7, 1.2), rr(15.5, 7.5, 6, 7, 1.2)), a: "M2.5 18.5h19M8.75 17v3M14.75 17v3" },
  keyboard: {
    d: rr(2, 6, 20, 12, 2),
    a: "M7.5 15h9",
    f: many(sq(4.9, 8.6), sq(8.2, 8.6), sq(11.5, 8.6), sq(14.8, 8.6), sq(18.1, 8.6), sq(6.5, 11.6), sq(9.8, 11.6), sq(13.1, 11.6), sq(16.4, 11.6)),
  },
  bot: { d: many(rr(5, 7, 14, 11, 3), "M12 7V4.6M3 11v3M21 11v3"), a: "M10 15.2h4", f: many(c(12, 3.8, 1.2), c(9.5, 12, 1.3), c(14.5, 12, 1.3)) },
  bubbles: {
    d: "M4 9h9.5a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H9l-3.5 3v-3H4a1 1 0 0 1-1-1v-6a1 1 0 0 1 1-1ZM8 9V5a1 1 0 0 1 1-1h11a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1h-1.5v2.5L16 12h-1.5",
    a: "M6 12.4h5.5M6 14.6h3",
  },
  "media-mix": {
    d: many(rr(3, 3, 11, 9, 1.5), "M10 18.5c1-2.5 2-2.5 3 0s2 2.5 3 0 2-2.5 3 0"),
    a: "M4.5 10.5l3-3 2.5 2.5 1.5-1.5 1.5 1.5M17 5h4M17 8.5h4M3 16h4M3 19.5h4",
  },
  card: { d: many(rr(2.5, 5, 19, 14, 2), "M2.5 9.5h19"), a: "M6 15h4", f: rr(14.5, 13.5, 3.5, 2.5, 0.6) },
  gauge: { d: "M4 17a8 8 0 1 1 16 0M12 17l4.5-5", a: "M6.3 11.3l1 1M12 9v1.5M17.7 11.3l-1 1M4 20.5h16", f: c(12, 17, 1.5) },
  hourglass: {
    d: "M6.5 3h11M6.5 21h11M8 3v3.5c0 2.2 4 3.3 4 5.5 0-2.2 4-3.3 4-5.5V3M8 21v-3.5c0-2.2 4-3.3 4-5.5 0 2.2 4 3.3 4 5.5V21",
    f: "M9.6 19.6c.6-1.3 2.4-2.1 2.4-2.1s1.8.8 2.4 2.1Z",
  },
  layers: { d: "M12 3 3 7.5 12 12l9-4.5L12 3Z", a: "M3 12l9 4.5 9-4.5M3 16.5 12 21l9-4.5" },
  window: {
    d: many(rr(3, 4, 18, 16, 2), "M3 8h18"),
    a: "M7.5 11.5H6V17h1.5M16.5 11.5H18V17h-1.5M9.5 13h5M9.5 15.5h3",
    f: many(c(5.6, 6, 0.7), c(7.8, 6, 0.7)),
  },
  ram: {
    d: many(rr(2.5, 7, 19, 9, 1), "M4.5 16v2.5M7 16v2.5M9.5 16v2.5M14.5 16v2.5M17 16v2.5M19.5 16v2.5"),
    a: many(rr(5, 9.5, 3.5, 4, 0.5), rr(10.25, 9.5, 3.5, 4, 0.5), rr(15.5, 9.5, 3.5, 4, 0.5)),
  },
  "calendar-cut": { d: many(CALENDAR, "M14.5 12v1.8M14.5 15.6v1.8M14.5 19.2v3.3"), f: many(sq(6.5, 13, 2), sq(10, 13, 2), sq(6.5, 16.5, 2), sq(10, 16.5, 2)) },
  spiral: { d: "M12 11.25a1.5 1.5 0 0 1 3 0 3 3 0 0 1-6 0 4.5 4.5 0 0 1 9 0 6 6 0 0 1-12 0" },
  "globe-search": {
    d: many(c(10, 10, 6.5), "M15 15l5.5 5.5"),
    a: "M3.5 10h13M10 3.5c-1.8 1.8-2.6 4-2.6 6.5s.8 4.7 2.6 6.5c1.8-1.8 2.6-4 2.6-6.5s-.8-4.7-2.6-6.5",
  },
  think: {
    d: "M7 16a4 4 0 0 1-.6-8 5.5 5.5 0 0 1 10.6-1.2A4 4 0 0 1 17.5 16H7Z",
    a: "M9 13h2v-2h2V9h2",
    f: many(c(7, 19.2, 1.1), c(4.6, 21.4, 0.7)),
  },
  "id-badge": { d: many(rr(5, 4, 14, 17, 2), c(12, 11, 2.3), "M8 17.5a4 4 0 0 1 8 0"), a: rr(10, 2.5, 4, 3, 1) },
  target: { d: many(c(12, 12, 8.5), "M12 12 19.5 4.5M16.5 4.5h3v3"), a: c(12, 12, 5), f: c(12, 12, 1.6) },
  layout: { d: many(rr(3, 4, 18, 16, 2), "M3 9h18M10 9v11"), a: "M13 12.5h5M13 16h5M5.5 12.5h2M5.5 16h2" },
  barrier: {
    d: many(rr(2.5, 7, 19, 6, 1), "M5.5 13v8M18.5 13v8M3.5 21h4M16.5 21h4M5.5 6v1M18.5 6v1"),
    a: "M7 7l-3 6M12 7 9 13M17 7l-3 6M21.5 8.5 19 13",
    f: many(c(5.5, 4.8, 1.2), c(18.5, 4.8, 1.2)),
  },
  "doc-copy": {
    d: "M5 7.5h7.5l3.5 3.5v9a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V8.5a1 1 0 0 1 1-1ZM8 7.5V4a1 1 0 0 1 1-1h7l4 4v10a1 1 0 0 1-1 1h-3",
    a: "M7 14h6M7 17.5h4",
  },
  "question-bubble": { d: many(BUBBLE, "M10 8.6a2 2 0 1 1 2.8 1.8c-.5.2-.8.6-.8 1.1v.4"), f: c(12, 13.9, 1) },
  cycle: { d: REFRESH, a: "M9.5 13.5 12 11l2.5 2.5" },
  "folder-stack": {
    d: "M3 9a2 2 0 0 1 2-2h4l2 2.5h8a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z",
    a: "M5.5 7V5.5a1 1 0 0 1 1-1H10l1.5 1.5h7a1 1 0 0 1 1 1v1",
  },
  checklist: { d: many(rr(5, 3, 14, 18, 1.5), "M8 8l1 1 2-2M8 13l1 1 2-2"), a: "M13 8h3M13 13h3M8 17.5h8" },
  clip: { d: "M16.5 7.5 9 15a2.1 2.1 0 0 0 3 3l8-8a4.2 4.2 0 0 0-6-6l-8.5 8.5a6 6 0 0 0 8.5 8.5l6-6" },
  sliders: { d: many("M4 6h9M17 6h3M4 12h3M11 12h9M4 18h11M19 18h1", c(15, 6, 2), c(9, 12, 2), c(17, 18, 2)) },
  "bot-gear": {
    d: many(rr(2.5, 5.5, 13, 10, 3), "M9 5.5V3.8"),
    a: many(c(18, 17.5, 2.2), "M18 13.5V15M18 20v1.5M14 17.5h1.5M20.5 17.5H22M15.2 14.7l1 1M19.8 19.3l1 1M15.2 20.3l1-1M19.8 15.7l1-1"),
    f: many(c(9, 3, 1.1), c(6.5, 10.5, 1.15), c(11.5, 10.5, 1.15)),
  },
  hash: { d: "M9.5 4 7.5 20M16.5 4l-2 16M5 9h15M4 15h15" },
  "expansion-card": {
    d: many(rr(3, 5, 18, 10, 1.5), "M6 15v3M8.5 15v3M11 15v3M13.5 15v3M18 15v3"),
    a: many(rr(6, 7.5, 5.5, 4.5, 0.8), "M14 9h4M14 11.5h2.5"),
    f: c(18.5, 8, 0.9),
  },
  "file-md": { d: FILE, a: "M7.5 18v-5l2 2.5 2-2.5v5M15 13v5m0 0-1.8-1.8M15 18l1.8-1.8" },
  tag: { d: "M3 12.6V4.5A1.5 1.5 0 0 1 4.5 3h8.1c.4 0 .8.2 1 .4l7 7a1.5 1.5 0 0 1 0 2.2l-8.1 8.1a1.5 1.5 0 0 1-2.2 0l-7-7a1.5 1.5 0 0 1-.4-1.1Z", f: c(8, 8, 1.5) },
  "inbox-down": { d: "M3 13h5l1.5 3h5L16 13h5v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-6ZM12 3v9m0 0-3.5-3.5M12 12l3.5-3.5", a: "M3 13l2.5-5H7M21 13l-2.5-5H17" },
  plug: { d: "M7 9h10v3.5a5 5 0 0 1-10 0V9ZM9.5 9V4M14.5 9V4M12 17.5V21" },
  connector: { d: many("M2 12h3M19 12h3", rr(5, 8, 6, 8, 1.5), "M11 10h2.5M11 14h2.5", rr(14.5, 7.5, 4.5, 9, 1.5)), a: "M16.75 10.5v1M16.75 12.5v1" },
  hub: {
    d: many(rr(8.5, 8.5, 7, 7, 1.5), "M12 8.5V5.5M12 15.5v3M8.5 12h-3M15.5 12h3"),
    f: many(c(12, 4, 1.6), c(12, 20, 1.6), c(4, 12, 1.6), c(20, 12, 1.6), c(12, 12, 1.2)),
  },
  "shield-check": { d: many(SHIELD, "M9 12l2.2 2.2L15.5 10") },
  key: { d: many(c(8, 15, 4), "M10.8 12.2 20 3M17 6l2.5 2.5M14.5 8.5l2 2"), f: c(7.5, 15.5, 1) },
  "db-lock": {
    d: many("M4 6c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3Zm0 0v12c0 1.7 3.6 3 8 3M20 6v5", rr(14, 15, 7, 6, 1), "M15.5 15v-1.5a2 2 0 0 1 4 0V15"),
    a: "M4 12c0 1.7 3.6 3 8 3",
  },
  "robot-arm": {
    d: "M3.5 21h9M5.5 21v-2.5h5V21M8 18.5 6.5 12l7-4.5 4-2M17.5 5.5l2.5-2M17.5 5.5l2.8.8",
    f: many(c(6.5, 12, 1.6), c(13.5, 7.5, 1.6)),
  },
  wrench: { d: WRENCH },
  "orbit-loop": { d: c(12, 12, 7), f: ring },
  "user-check": { d: many(c(9, 7.5, 3.5), "M2.5 20a6.5 6.5 0 0 1 13 0M15.5 11.5l2 2 4-4") },
  fader: {
    a: "M6 4v16M12 4v16M18 4v16",
    d: many(rr(4, 13, 4, 3, 1), rr(10, 7, 4, 3, 1), rr(16, 10, 4, 3, 1)),
    f: many(rr(4, 13, 4, 3, 1), rr(10, 7, 4, 3, 1), rr(16, 10, 4, 3, 1)),
  },
  terminal: { d: many(rr(3, 4, 18, 16, 2), "M7 9.5l3 2.5-3 2.5M12.5 15H17") },
  delegate: {
    d: many(c(6, 8, 2.5), "M2.5 17a3.5 3.5 0 0 1 7 0M11 12h4.5m0 0-2-2m2 2-2 2", rr(16.5, 8.5, 5.5, 5, 1.3), "M19.25 8.5V7"),
    f: many(c(19.25, 6.3, 0.8), c(18.2, 11, 0.6), c(20.3, 11, 0.6)),
  },
  table: { d: many(rr(3, 4, 18, 16, 2), "M3 9.5h18M3 15h18M9.5 4v16") },
  "mono-cl": { t: "CL", a: BRACKETS },
  "mono-gpt": { t: "GPT", a: BRACKETS },
  "mono-gem": { t: "GEM", a: BRACKETS },
  "mono-cc": { t: "CC", a: BRACKETS },
  "mono-cdx": { t: "CDX", a: BRACKETS },
  "mono-cw": { t: "CW", a: BRACKETS },

  // ======================= Interface =======================
  map: { d: "M9 4 3 6.5v13L9 17l6 2.5 6-2.5v-13L15 7 9 4Zm0 0v13m6-10v12.5" },
  base: { d: "M4 5.5A1.5 1.5 0 0 1 5.5 4H11v16H5.5A1.5 1.5 0 0 1 4 18.5v-13ZM13 4h5.5A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5H13V4Zm-6 4h1.5M7 11h1.5m8-3H15m1.5 3H15" },
  maint: { d: WRENCH },
  forge: { d: "M4 9h11a4 4 0 0 1-4 4H9l-1 4h6m-9 3h14M15 9l5-3" },
  gear: { d: "M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Zm7.4-3.2c0-.5 0-.9-.1-1.3l2-1.6-2-3.4-2.4 1a7.4 7.4 0 0 0-2.2-1.3L14.3 3h-4l-.4 2.4c-.8.3-1.5.8-2.2 1.3l-2.4-1-2 3.4 2 1.6a7.6 7.6 0 0 0 0 2.6l-2 1.6 2 3.4 2.4-1c.7.5 1.4 1 2.2 1.3l.4 2.4h4l.4-2.4c.8-.3 1.5-.8 2.2-1.3l2.4 1 2-3.4-2-1.6c.1-.4.1-.8.1-1.3Z" },
  back: { d: "M15 5 8 12l7 7" },
  close: { d: "M6 6l12 12M18 6 6 18" },
  check: { d: "M5 12.5 10 17 19 7" },
  plus: { d: "M12 5v14M5 12h14" },
  "chevron-right": { d: "M9 5.5 15.5 12 9 18.5" },
  "chevron-up": { d: "M5.5 15 12 8.5l6.5 6.5" },
  "chevron-down": { d: "M5.5 9 12 15.5 18.5 9" },
  external: { d: "M14 4h6v6M20 4l-8.5 8.5M18 14v4.5a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 4 18.5v-11A1.5 1.5 0 0 1 5.5 6H10" },
  link: { d: "M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" },
  bolt: { d: BOLT, f: BOLT },
  flame: { d: FLAME },
  blaze: { d: FLAME, a: "M12 19.5c-1.7 0-3-1.2-3-2.8 0-1.8 1.3-2.8 2.3-4 .3 1 1 1.6 1.7 1.9.4-.6.6-1.3.6-2 1 1 1.4 2.3 1.4 3.4 0 2.1-1.4 3.5-3 3.5Z" },
  thermo: { d: "M10 13.5V5a2 2 0 0 1 4 0v8.5a4 4 0 1 1-4 0Z", a: "M12 8.5V16M16.5 6H18M16.5 9H18", f: c(12, 17, 1.8) },
  lock: { d: "M7 11V8a5 5 0 0 1 10 0v3M6 11h12v10H6V11Zm6 4v2" },
  play: { d: PLAY, f: PLAY },
  power: { d: "M12 3v8M7.1 6.1a7.5 7.5 0 1 0 9.8 0" },
  lever: { d: many(rr(4, 14, 16, 6.5, 1.5), "M12 14 16.5 5.5"), a: "M8 17.2h8", f: c(17, 4.8, 2) },
  speaker: { d: "M4 10v4h4l5 4V6L8 10H4Zm12.5-1.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" },
  share: { d: "M12 3v12m0-12L8 7m4-4 4 4M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" },
  download: { d: "M12 3v12m0 0-4.5-4.5M12 15l4.5-4.5M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" },
  copy: { d: "M9 9h10v11H9V9ZM5 15V4h10" },
  clipboard: { d: many("M9 4H7a1 1 0 0 0-1 1v15a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1h-2", rr(9, 2.5, 6, 3, 1)), a: "M9 11h6M9 14.5h6M9 18h3.5" },
  trash: { d: "M5 7h14M10 11v6m4-6v6M6 7l1 13h10l1-13M9 7V4h6v3" },
  eye: { d: "M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Zm10 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" },
  refresh: { d: REFRESH },
  signal: { d: "M12 13a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm-4.2-5.7a6 6 0 0 0 0 8.4m8.4 0a6 6 0 0 0 0-8.4M5 4.5a10 10 0 0 0 0 14m14 0a10 10 0 0 0 0-14M12 13v8" },
  dish: { d: "M4.5 8.5A10 10 0 0 0 15.5 19.5ZM10 14l4-4M7.4 16.6 6.5 21M4.5 21h5", a: "M15.5 3.5a5 5 0 0 1 5 5M15.5 6.5a2 2 0 0 1 2 2", f: c(14.5, 9.5, 1.3) },
  spark: { d: "M12 3v4m0 10v4M3 12h4m10 0h4M6 6l2.5 2.5m7 7L18 18M6 18l2.5-2.5m7-7L18 6" },
  info: { d: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-10v6m0-9.5v.5" },
  warn: { d: "M10.3 4.6 2.9 17.4A2 2 0 0 0 4.6 20.4h14.8a2 2 0 0 0 1.7-3L13.7 4.6a2 2 0 0 0-3.4 0ZM12 9.5V14", f: c(12, 17, 1.1) },
  clock: { d: many(c(12, 12, 9), "M12 7.5V12l3 2") },
  help: { d: many(c(12, 12, 9), "M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .8-1 1.5v.7"), f: c(12, 17, 1.1) },
  trophy: { d: "M8 4h8v5a4 4 0 0 1-8 0V4Zm0 2H4v1a4 4 0 0 0 4 4m8-5h4v1a4 4 0 0 1-4 4m-4 2v4m-4 3h8" },
  shield: { d: SHIELD, a: "M12 7.5v9" },
  frame: { d: many(rr(3, 4, 18, 16, 2), "M3 16.5l5-5 4 4 2.5-2.5 6.5 6.5"), f: c(15.5, 8.5, 1.5) },
  flask: { d: "M9 3h6M10 3v6L4.7 18.2A1.8 1.8 0 0 0 6.2 21h11.6a1.8 1.8 0 0 0 1.5-2.8L14 9V3", a: "M7 15.5h10", f: many(c(11, 18, 0.9), c(14, 17.2, 0.7)) },
  moon: { d: "M20 14.5A8.5 8.5 0 1 1 9.5 4a6.8 6.8 0 0 0 10.5 10.5Z", a: "M17 3.5v3M15.5 5h3" },
  siren: { d: "M7 17v-4a5 5 0 0 1 10 0v4M4.5 17h15v3.5h-15ZM12 3v2M5.6 5.6 7 7M18.4 5.6 17 7M3 12h1.5M19.5 12H21", a: "M10 13a2 2 0 0 1 2-2" },
  extinguisher: { d: "M7.5 10.5a3.5 3.5 0 0 1 7 0V20a1 1 0 0 1-1 1h-5a1 1 0 0 1-1-1v-9.5ZM11 7V4.5M8.5 4.5h5L17 3M14.5 8.5c2.5 0 4 1.5 4 4V16", a: "M7.5 14h7" },
  bulb: { d: "M9 18h6M10 21h4M12 3a6 6 0 0 0-3.6 10.8c.7.6 1.1 1.3 1.1 2.2h5c0-.9.4-1.6 1.1-2.2A6 6 0 0 0 12 3Z", a: "M12 6.5a2.5 2.5 0 0 1 2.5 2.5" },
  "battery-half": { d: many(rr(2.5, 7.5, 16.5, 9, 1.5), "M21.5 10.5v3"), f: rr(4.5, 9.5, 6, 5, 0.8) },
  rack: {
    d: many(rr(5, 3, 14, 18, 1.5), "M5 8.5h14M5 14h14"),
    a: "M11 5.8h5M11 11.2h5M11 17.5h5",
    f: many(c(8, 5.8, 0.9), c(8, 11.2, 0.9), c(8, 17.5, 0.9)),
  },
  toolbox: { d: "M3 9h18v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9Zm0 0 2-3h14l2 3M9 6V4h6v2", a: "M3 13.5h18M10.5 12v3M13.5 12v3" },
  books: { d: many(rr(3, 4, 4, 16, 1), rr(8, 4, 4, 16, 1), "M13.5 5.3l3.9-1 4 15.5-3.9 1Z"), a: "M3 8h4M8 8h4M3 16h4M8 16h4" },
  book: { d: "M5 5a2 2 0 0 1 2-2h12v15H7a2 2 0 0 0-2 2V5Zm0 15a2 2 0 0 0 2 2h12v-4", a: "M9 7.5h6" },
  article: { d: "M4 4h13v15a2 2 0 0 0 2 2H6a2 2 0 0 1-2-2V4Zm13 4h3v11a2 2 0 0 1-4 0", a: "M7 8h7M7 11.5h7M7 15h4" },
  video: { d: many(rr(3, 6, 13, 12, 1.5), "M16 10.5l5-3v9l-5-3"), f: "M8 9.5v5l4-2.5Z" },
  mic: { d: "M12 3a3 3 0 0 0-3 3v5a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3ZM5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M8.5 21h7" },
  pencil: { d: "M4 20l1-4.5L15.5 5a2.1 2.1 0 0 1 3 3L8 18.5 4 20Zm9.5-13 3 3" },
  "set-square": { d: "M4 4v16h16L4 4Z", a: "M4 8h2M4 12h2M4 16h2M8 20v-2M12 20v-2" },
  mail: { d: many(rr(3, 5, 18, 14, 1.5), "M3.8 6.5 12 13l8.2-6.5") },
  folder: { d: FOLDER, a: "M3 10.5h18" },
  calendar: { d: CALENDAR, f: many(sq(7, 13, 2), sq(11, 13, 2), sq(15, 13, 2), sq(7, 16.5, 2), sq(11, 16.5, 2)) },
  note: { d: many(rr(5, 4, 14, 17, 2), "M9 2.5v3M12 2.5v3M15 2.5v3"), a: "M8.5 10h7M8.5 13.5h7M8.5 17H13" },
  chat: { d: BUBBLE, f: many(c(8.5, 10.5, 1.1), c(12, 10.5, 1.1), c(15.5, 10.5, 1.1)) },
  "file-lines": { d: FILE, a: "M8.5 12.5h7M8.5 16h7" },
  palette: { d: "M12 3a9 9 0 0 0 0 18c1.2 0 1.8-.8 1.8-1.7 0-1.2-1-1.6-1-2.6 0-.9.8-1.7 1.8-1.7H17a4 4 0 0 0 4-4C21 6.6 17 3 12 3Z", f: many(c(7.5, 11.5, 1.3), c(10, 7.5, 1.3), c(14.5, 7.5, 1.3)) },
  receipt: { d: "M6 3h12v18l-2-1.5-2 1.5-2-1.5-2 1.5-2-1.5L6 21V3Z", a: "M9 8h6M9 11.5h6M9 15h3.5" },
  hdd: { d: many(rr(4, 3, 16, 18, 1.5), c(12, 10, 4)), a: "M12 10l3.2 4.2", f: many(c(8, 17.5, 0.9), c(16, 17.5, 0.9)) },
  phone: { d: many(rr(6.5, 2.5, 11, 19, 2), "M10.5 5.5h3"), f: c(12, 18.5, 0.9) },
  generic: { d: "M12 3.5 20.5 12 12 20.5 3.5 12 12 3.5Z", f: c(12, 12, 1.8) },
};

export function isIconId(v: unknown): v is IconId {
  return typeof v === "string" && Object.prototype.hasOwnProperty.call(GLYPHS, v);
}
