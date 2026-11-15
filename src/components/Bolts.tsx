// Les éclairs de FORMA-8 (bonne réponse, fin de protocole, branchement, réveil, orage du levier).
//
// Moteur écrit pour FORMA-8 le 15/11/2026, d'après le déroulé d'un vrai coup de foudre :
//  1. le « traceur » : un canal faible et ramifié progresse par bonds vers sa cible (quelques dizaines de ms) ;
//  2. l'« arc en retour » : dès que le traceur touche, tout le canal s'illumine d'un coup, très blanc ;
//  3. les « re-frappes » : le même canal se rallume deux ou trois fois (le scintillement d'un éclair),
//     les ramifications, elles, s'éteignent vite ;
//  4. la lueur s'éteint ; la scène a été éclairée à chaque frappe.
// Deuxième version (même jour, retour du propriétaire : « trop lents, grossiers ; plus nombreux, moins épais ;
// vraiment réaliste ») : un cœur blanc d'un pixel dans une gaine fine ; un halo serré au lieu d'un grand flou ;
// un canal très découpé (jusqu'à 8 niveaux de détail) ; des ramifications nombreuses qui s'effilent jusqu'au bout ;
// plusieurs canaux à chaque frappe (le canal principal et des canaux secondaires décalés de quelques ms) ;
// des durées environ deux fois plus courtes. Couleurs : blanc et cyan seulement (choix du propriétaire).
//
// La toile n'existe que pendant un éclair : elle est créée au premier éclair et retirée dès que tout est éteint.
// (Une toile plein écran laissée en permanence faisait planter Safari par moments : constaté le 15/11/2026.)
// Avec « animations réduites », rien n'est dessiné : l'effet (la cellule qui s'allume…) arrive tout de suite.
// Troisième version (même jour, « encore plus nombreux, avec un son de tonnerre et d'éclairs frappants ») : trois
// canaux par petit éclair, quatre par grand éclair, un claquement à chaque impact et du tonnerre sur les grands.

import { sfx } from "../lib/sound";

export interface Pt { x: number; y: number }
interface Branch { pts: Pt[]; t0: number; span: number; depth: number }
interface Bolt { branches: Branch[]; length: number }
/** Un lot de tracés de même épaisseur et même éclat (dessinés en une fois, pour ménager l'iPhone). */
interface Stroke { paths: Pt[][]; alpha: number; width: number }
interface Glow { x: number; y: number; r: number; alpha: number }

type Anim = (t: number) => boolean | void;

let canvas: HTMLCanvasElement | null = null;
let g: CanvasRenderingContext2D | null = null;
let small: HTMLCanvasElement | null = null;
let gs: CanvasRenderingContext2D | null = null;
let W = 0, H = 0;
const SCALE = 0.5; // résolution de la toile du halo (assez fine pour un halo serré, assez petite pour être rapide)
const anims = new Set<Anim>();
let looping = false;
let strokes: Stroke[] = [];
let glows: Glow[] = [];
let ambient = 0;

const reduced = () => document.documentElement.classList.contains("reduce-motion");

/** Ancien point de montage : la toile est maintenant créée à la demande. Gardé pour compatibilité. */
export function BoltCanvas() { return null; }

function ensureCanvas() {
  if (canvas) return true;
  if (typeof document === "undefined" || reduced()) return false;
  const c = document.createElement("canvas");
  c.setAttribute("aria-hidden", "true");
  c.className = "no-print";
  Object.assign(c.style, { position: "fixed", inset: "0", width: "100%", height: "100%", zIndex: "115", pointerEvents: "none" });
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  W = window.innerWidth; H = window.innerHeight;
  c.width = Math.round(W * dpr); c.height = Math.round(H * dpr);
  const ctx = c.getContext("2d"); if (!ctx) return false;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const s = document.createElement("canvas");
  s.width = Math.max(1, Math.round(W * SCALE)); s.height = Math.max(1, Math.round(H * SCALE));
  const sctx = s.getContext("2d"); if (!sctx) return false;
  sctx.setTransform(SCALE, 0, 0, SCALE, 0, 0);
  document.body.appendChild(c);
  canvas = c; g = ctx; small = s; gs = sctx;
  return true;
}
function releaseCanvas() {
  canvas?.remove(); canvas = null; g = null;
  if (small) { small.width = 1; small.height = 1; }
  small = null; gs = null;
}

function loop() {
  if (!g || !gs || !small) { anims.clear(); looping = false; releaseCanvas(); return; }
  strokes = []; glows = []; ambient = 0;
  const t = performance.now();
  for (const a of [...anims]) if (a(t) === false) anims.delete(a);
  render();
  if (anims.size) requestAnimationFrame(loop);
  else { looping = false; releaseCanvas(); }
}
function play(a: Anim) {
  if (!ensureCanvas()) return false;
  anims.add(a);
  if (!looping) { looping = true; requestAnimationFrame(loop); }
  return true;
}

function path(ctx: CanvasRenderingContext2D, pts: Pt[]) {
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
}
function render() {
  if (!g || !gs || !small) return;
  g.clearRect(0, 0, W, H);
  // la scène éclairée par la frappe
  if (ambient > 0.003) { g.fillStyle = `rgba(214,244,255,${Math.min(0.9, ambient)})`; g.fillRect(0, 0, W, H); }
  // 1. le halo : un trait à peine plus large, dessiné à demi-résolution puis agrandi (flou léger et serré)
  gs.setTransform(1, 0, 0, 1, 0, 0); gs.clearRect(0, 0, small.width, small.height); gs.setTransform(SCALE, 0, 0, SCALE, 0, 0);
  gs.globalCompositeOperation = "lighter"; gs.lineCap = "round"; gs.lineJoin = "round";
  for (const s of strokes) {
    if (s.alpha < 0.02) continue;
    gs.beginPath(); for (const p of s.paths) path(gs, p);
    gs.lineWidth = Math.max(1.5, s.width * 4); gs.strokeStyle = `rgba(80,215,255,${0.32 * s.alpha})`; gs.stroke();
  }
  for (const o of glows) {
    if (o.alpha < 0.02 || o.r < 1) continue;
    const gr = gs.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.r);
    gr.addColorStop(0, `rgba(255,255,255,${o.alpha})`); gr.addColorStop(0.25, `rgba(170,238,255,${o.alpha * 0.45})`); gr.addColorStop(1, "rgba(59,232,255,0)");
    gs.fillStyle = gr; gs.beginPath(); gs.arc(o.x, o.y, o.r, 0, Math.PI * 2); gs.fill();
  }
  g.save(); g.globalCompositeOperation = "lighter"; g.imageSmoothingEnabled = true;
  g.drawImage(small, 0, 0, W, H);
  g.restore();
  // 2. le canal : une gaine bleutée très fine, puis un cœur blanc d'environ un pixel
  g.save(); g.globalCompositeOperation = "lighter"; g.lineCap = "round"; g.lineJoin = "round";
  for (const s of strokes) {
    if (s.alpha < 0.02) continue;
    g.beginPath(); for (const p of s.paths) path(g, p);
    g.lineWidth = s.width * 1.7; g.strokeStyle = `rgba(150,230,255,${0.4 * s.alpha})`; g.stroke();
    g.lineWidth = Math.max(0.5, s.width * 0.55); g.strokeStyle = `rgba(255,255,255,${Math.min(1, s.alpha * 1.1)})`; g.stroke();
  }
  g.restore();
}

// ---------------- génération d'un éclair ----------------
const dist = (a: Pt, b: Pt) => Math.hypot(b.x - a.x, b.y - a.y);
/** Canal fractal entre a et b (déplacement du point milieu), découpé jusqu'à des segments de 2 à 4 px. */
function channel(a: Pt, b: Pt, rough: number): Pt[] {
  const len = dist(a, b);
  const levels = Math.max(2, Math.min(8, Math.round(Math.log2(len / 3))));
  let pts = [a, b], disp = len * rough;
  for (let l = 0; l < levels; l++) {
    const next: Pt[] = [pts[0]];
    for (let i = 0; i < pts.length - 1; i++) {
      const p = pts[i], q = pts[i + 1], dx = q.x - p.x, dy = q.y - p.y, d = Math.hypot(dx, dy) || 1, off = (Math.random() * 2 - 1) * disp;
      next.push({ x: (p.x + q.x) / 2 - (dy / d) * off, y: (p.y + q.y) / 2 + (dx / d) * off }, q);
    }
    // les grands coudes d'abord, puis des détails de plus en plus fins (aspect « tortueux » d'un vrai canal)
    pts = next; disp *= l < 2 ? 0.6 : 0.5;
  }
  return pts;
}
function sumLen(pts: Pt[]) { let s = 0; for (let i = 1; i < pts.length; i++) s += dist(pts[i - 1], pts[i]); return s; }
/**
 * Un éclair complet : canal principal et ramifications (jusqu'à trois niveaux). `density` est le nombre moyen de
 * ramifications pour 100 px de canal principal.
 */
function makeBolt(a: Pt, b: Pt, rough: number, density: number): Bolt {
  const main = channel(a, b, rough), length = sumLen(main);
  const branches: Branch[] = [{ pts: main, t0: 0, span: 1, depth: 0 }];
  const grow = (parent: Pt[], t0: number, span: number, depth: number, dens: number) => {
    const plen = sumLen(parent), step = plen / Math.max(1, parent.length - 1);
    const prob = (dens * step) / 100;
    for (let k = Math.floor(parent.length * 0.06); k < parent.length * 0.9; k++) {
      if (Math.random() > prob) continue;
      const p = parent[k], q = parent[Math.min(parent.length - 1, k + 3)];
      // une ramification part en biais, plutôt vers l'avant, et s'arrête bien avant la cible
      const ang = Math.atan2(q.y - p.y, q.x - p.x) + (Math.random() < 0.5 ? -1 : 1) * (0.25 + Math.random() * 0.75);
      const rest = sumLen(parent.slice(k)), L = rest * (0.12 + Math.random() * 0.38) * (depth ? 0.7 : 1);
      if (L < 8) continue;
      const pts = channel(p, { x: p.x + Math.cos(ang) * L, y: p.y + Math.sin(ang) * L }, 0.2);
      const bt0 = t0 + span * (k / parent.length), bspan = (sumLen(pts) / length) * 1.2;
      branches.push({ pts, t0: bt0, span: bspan, depth: depth + 1 });
      if (depth < 2) grow(pts, bt0, bspan, depth + 1, dens * 1.3);
    }
  };
  grow(main, 0, 1, 0, density);
  return { branches, length };
}
/** Le canal légèrement agité d'une re-frappe à l'autre (le même chemin, jamais tout à fait immobile). */
function jitter(pts: Pt[], amp: number) { return pts.map((p, i) => (i === 0 || i === pts.length - 1 ? p : { x: p.x + (Math.random() - 0.5) * amp, y: p.y + (Math.random() - 0.5) * amp })); }

/** Les ramifications rangées par épaisseur : chaque branche s'effile (son dernier tiers passe à la classe plus fine). */
function taperedBranches(bolt: Bolt, upTo: (br: Branch) => number) {
  const classes: Pt[][][] = [[], [], [], []];
  for (const br of bolt.branches) {
    if (br.depth === 0) continue;
    const n = upTo(br); if (n < 2) continue;
    const pts = br.pts.slice(0, n), cut = Math.max(2, Math.floor(pts.length * 0.62));
    classes[Math.min(3, br.depth)].push(pts.slice(0, cut));
    if (pts.length > cut) classes[Math.min(3, br.depth + 1)].push(pts.slice(cut - 1));
  }
  return classes;
}
const BRANCH_W = [1, 0.5, 0.32, 0.2];

interface StrikeOpts { leader: number; restrikes: number[]; width: number; light: number; impact: number; decay: number; tail: number; strength?: number }
/**
 * Joue un éclair : traceur, arc en retour, re-frappes, extinction. onHit est appelé au contact.
 * Renvoie la durée totale (ms), 0 si rien n'a pu être dessiné.
 */
function animate(bolt: Bolt, from: Pt, to: Pt, o: StrikeOpts, onHit?: () => void) {
  const t0 = performance.now(); let hit = false;
  const k0 = o.strength ?? 1;
  const strikesAt = [0, ...o.restrikes];
  const end = o.leader + strikesAt[strikesAt.length - 1] + o.tail;
  const ok = play((t) => {
    const e = t - t0;
    if (e < o.leader) {
      // 1. le traceur avance par bonds : faible, bleuté, avec une pointe brillante
      const prog = Math.pow(e / o.leader, 0.8), stepped = Math.floor(prog * 16) / 16 + (prog * 16 % 1 < 0.6 ? 0 : 1 / 16);
      const upTo = (br: Branch) => { const f = (stepped - br.t0) / br.span; return f <= 0 ? 0 : Math.max(2, Math.min(br.pts.length, Math.ceil(br.pts.length * f))); };
      const main = bolt.branches[0], n = upTo(main);
      if (n >= 2) {
        strokes.push({ paths: [main.pts.slice(0, n)], alpha: 0.4 * k0, width: o.width * 0.6 });
        const tip = main.pts[n - 1]; glows.push({ x: tip.x, y: tip.y, r: 8 * o.width, alpha: 0.45 * k0 });
      }
      taperedBranches(bolt, upTo).forEach((paths, d) => { if (d && paths.length) strokes.push({ paths, alpha: 0.28 * k0, width: o.width * BRANCH_W[d] * 0.8 }); });
      return;
    }
    if (!hit) { hit = true; onHit?.(); }
    // 2 et 3. arc en retour puis re-frappes : intensité qui retombe très vite après chaque coup
    const s = e - o.leader;
    let I = 0, last = 0;
    strikesAt.forEach((at, k) => { if (s >= at) { last = k; I = Math.max(I, (k === 0 ? 1 : 0.95 - k * 0.07) * Math.exp(-(s - at) / o.decay)); } });
    I = Math.max(I, 0.22 * Math.exp(-s / (o.decay * 3))); // courant persistant entre les coups
    if (s > end - o.leader) return false;
    I *= k0;
    const main = bolt.branches[0];
    const mainPts = last === 0 ? main.pts : jitter(main.pts, 0.9);
    strokes.push({ paths: [mainPts], alpha: Math.min(1, I * 1.2), width: o.width });
    // les ramifications brillent surtout au premier coup, se rallument un peu aux suivants, et s'éteignent plus vite
    const bI = k0 * Math.max(Math.exp(-s / (o.decay * 1.4)), 0.4 * (I / k0) * (I / k0));
    if (bI > 0.03) taperedBranches(bolt, (br) => br.pts.length).forEach((paths, d) => { if (d && paths.length) strokes.push({ paths, alpha: (1.05 - d * 0.15) * bI, width: o.width * BRANCH_W[d] }); });
    ambient = Math.max(ambient, o.light * I * I);
    glows.push({ x: to.x, y: to.y, r: o.impact * (0.5 + 0.5 * I), alpha: 0.9 * I });
    glows.push({ x: from.x, y: from.y, r: o.impact * 0.5 * (0.5 + 0.5 * I), alpha: 0.5 * I });
  });
  return ok ? end : 0;
}

/** Point légèrement décalé autour d'une cible (point d'arrivée d'un canal secondaire). */
const near = (p: Pt, r: number): Pt => { const a = Math.random() * Math.PI * 2, d = r * (0.4 + Math.random() * 0.6); return { x: p.x + Math.cos(a) * d, y: p.y + Math.sin(a) * d }; };

/** Centre d'un élément à l'écran. */
export function centerOf(el: Element | null | undefined, fallback: Pt = { x: window.innerWidth / 2, y: window.innerHeight / 2 }): Pt {
  const r = el?.getBoundingClientRect();
  return r && r.width ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : fallback;
}

/** Durée du traceur d'un grand éclair : la frappe tombe exactement à la fin de la charge (synchronisée au son). */
const BIG_LEADER = 70;

/**
 * Petit éclair (bonne réponse) : un canal principal et un canal secondaire décalé de quelques ms, traceur très bref,
 * arc en retour, une re-frappe. onHit est appelé au contact.
 */
export function strike(from: Pt, to: Pt, onHit?: () => void) {
  if (reduced()) { onHit?.(); return; }
  const len = dist(from, to);
  const leader = Math.min(60, 25 + len * 0.06);
  const hit = () => { sfx("crack"); onHit?.(); };
  const ms = animate(makeBolt(from, to, 0.13, 2.8), from, to, { leader, restrikes: [45 + Math.random() * 25], width: 1.1, light: 0.05, impact: 22, decay: 50, tail: 230 }, hit);
  if (!ms) { onHit?.(); return; }
  for (let k = 0; k < 2; k++) {
    const to2 = near(to, 12 + k * 8);
    window.setTimeout(() => animate(makeBolt(from, to2, 0.16, 2), from, to2, { leader: leader * 0.8, restrikes: k ? [] : [55], width: 0.7, light: 0, impact: 10, decay: 40, tail: 160, strength: 0.6 }), 12 + k * 28 + Math.random() * 20);
  }
}

/**
 * Grand éclair : la charge s'accumule au départ pendant `delay` secondes (arcs qui crépitent), puis la frappe :
 * pour chaque cible, un canal principal et deux canaux secondaires.
 */
export function bigStrike(from: Pt, targets: Pt[], delay: number, onHit?: () => void) {
  if (reduced()) { window.setTimeout(() => onHit?.(), delay * 1000); return; }
  const charge = Math.max(0, delay * 1000 - BIG_LEADER);
  if (charge > 0) arcs(from, 26, charge, 3, true);
  window.setTimeout(() => {
    let first = true;
    const hitOnce = () => { if (first) { first = false; sfx("thunder"); onHit?.(); } };
    const played = targets.map((to) => {
      const ms = animate(makeBolt(from, to, 0.15, 3.6), from, to, { leader: BIG_LEADER, restrikes: [55, 115, 170], width: 1.8, light: 0.16, impact: 36, decay: 60, tail: 320 }, hitOnce);
      for (let k = 0; k < 3; k++) {
        const t2 = near(to, 22 + k * 8);
        window.setTimeout(() => animate(makeBolt(from, t2, 0.19, 2.2), from, t2, { leader: BIG_LEADER * 0.9, restrikes: [70], width: 0.9, light: 0, impact: 14, decay: 45, tail: 200, strength: 0.7 }), 10 + k * 35 + Math.random() * 25);
      }
      return ms;
    });
    if (!played.some(Boolean)) hitOnce();
  }, charge);
}

/**
 * Un éclair qui tombe du ciel (orage du levier principal) : long traceur très ramifié, plusieurs re-frappes,
 * un ou deux canaux voisins, et une décharge qui rampe sous les nuages.
 */
export function skyStrike(fromX: number, toX: number, toY: number) {
  if (reduced()) return;
  const from = { x: fromX, y: -30 }, to = { x: toX, y: toY };
  animate(makeBolt(from, to, 0.14, 2.6), from, to, { leader: 110, restrikes: [60, 130, 210, 280], width: 2.2, light: 0.32, impact: 44, decay: 65, tail: 360 });
  const extra = 1 + Math.round(Math.random());
  for (let k = 0; k < extra; k++) {
    const f2 = { x: fromX + (Math.random() - 0.5) * 160, y: -30 }, t2 = { x: toX + (Math.random() - 0.5) * 120, y: toY * (0.55 + Math.random() * 0.35) };
    window.setTimeout(() => animate(makeBolt(f2, t2, 0.17, 2.2), f2, t2, { leader: 90, restrikes: [80], width: 1.1, light: 0.05, impact: 20, decay: 50, tail: 240, strength: 0.75 }), 25 + k * 45 + Math.random() * 40);
  }
  // la décharge « rampante » sous les nuages : presque horizontale, très ramifiée, faible
  const y = 30 + Math.random() * 60, a = { x: fromX - 120 - Math.random() * 80, y }, b = { x: fromX + 120 + Math.random() * 80, y: y + (Math.random() - 0.5) * 40 };
  window.setTimeout(() => animate(makeBolt(a, b, 0.12, 4), a, b, { leader: 140, restrikes: [70], width: 0.9, light: 0.04, impact: 0, decay: 70, tail: 260, strength: 0.6 }), 20);
}

/**
 * Arcs électriques qui sautent autour d'un point (une capsule qui se charge, une prise qu'on branche) :
 * de petits éclairs fractals qui naissent, scintillent et changent de place.
 */
export function arcs(c: Pt, radius: number, ms: number, count = 3, gather = false) {
  if (reduced() || ms <= 0) return;
  const t0 = performance.now(); let last = -1e9;
  let cur: { pts: Pt[]; born: number }[] = [];
  play((t) => {
    const e = t - t0; if (e > ms) return false;
    const k = gather ? e / ms : 1; // la charge qui s'accumule : de plus en plus d'arcs, de plus en plus près
    if (t - last > 40 + Math.random() * 35) {
      last = t;
      const n = Math.max(1, Math.round(count * (gather ? 0.6 + k : 1)));
      cur = Array.from({ length: n }, () => {
        const a = Math.random() * Math.PI * 2, b = a + (Math.random() - 0.5) * 1.8, r1 = radius * (gather ? 1.6 - 0.8 * k : 0.7 + Math.random() * 0.4), r2 = radius * (0.9 + Math.random() * 0.5);
        const p = { x: c.x + Math.cos(a) * r1, y: c.y + Math.sin(a) * r1 * 1.1 }, q = gather ? { x: c.x + (Math.random() - 0.5) * 6, y: c.y + (Math.random() - 0.5) * 6 } : { x: c.x + Math.cos(b) * r2, y: c.y + Math.sin(b) * r2 * 1.1 };
        return { pts: channel(p, q, 0.24), born: t };
      });
    }
    const live = cur.map((a) => ({ a, f: Math.exp(-(t - a.born) / 35) }));
    strokes.push({ paths: live.filter((x) => x.f > 0.05).map((x) => x.a.pts), alpha: 0.9 * Math.max(0, ...live.map((x) => x.f)), width: 0.75 });
    glows.push({ x: c.x, y: c.y, r: radius * (gather ? 0.6 + 0.6 * k : 0.9), alpha: gather ? 0.2 + 0.4 * k : 0.28 });
  });
}

/** Gerbe d'étincelles qui retombent, avec leur traînée. */
export function sparks(c: Pt, n = 14) {
  if (reduced()) return;
  const t0 = performance.now(), ps = Array.from({ length: n }, () => { const a = Math.random() * 6.28, v = 80 + Math.random() * 180; return { vx: Math.cos(a) * v, vy: Math.sin(a) * v - 60 }; });
  play((t) => {
    const e = (t - t0) / 1000; if (e > 0.75) return false;
    const f = 1 - e / 0.75;
    strokes.push({ paths: ps.map((p) => { const x = c.x + p.vx * e, y = c.y + p.vy * e + 300 * e * e; return [{ x, y }, { x: x - p.vx * 0.025, y: y - (p.vy + 600 * e) * 0.025 }]; }), alpha: f, width: 0.8 });
    glows.push({ x: c.x, y: c.y, r: 26 * f, alpha: 0.7 * f });
  });
}

/** Flash blanc sur tout l'écran, qui s'éteint (il survit au changement d'écran). */
export function flash(peak = 0.85, ms = 700) {
  if (reduced()) return;
  const t0 = performance.now();
  play((t) => { const k = (t - t0) / ms; if (k >= 1) return false; ambient = Math.max(ambient, peak * (1 - k) * (1 - k)); });
}
