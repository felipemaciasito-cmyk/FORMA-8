// Les éclairs de FORMA-8 (bonne réponse, fin de protocole, branchement, réveil, orage du levier).
//
// Moteur écrit pour FORMA-8 le 15/11/2026, d'après le déroulé d'un vrai coup de foudre :
//  1. le « traceur » : un canal faible et ramifié progresse par bonds vers sa cible ;
//  2. l'« arc en retour » : dès que le traceur touche, tout le canal s'illumine d'un coup, très blanc ;
//  3. les « re-frappes » : le même canal se rallume deux ou trois fois (le scintillement d'un éclair),
//     les ramifications, elles, s'éteignent vite ;
//  4. la lueur s'éteint ; la scène a été éclairée à chaque frappe.
// Le canal est fractal (déplacement du point milieu), ses ramifications aussi. Le halo est un vrai « bloom » :
// l'éclair est dessiné en petit sur une toile cachée, puis agrandi par-dessus, ce qui le floute à peu de frais.
// Couleurs : blanc et cyan seulement (choix du propriétaire).
//
// La toile n'existe que pendant un éclair : elle est créée au premier éclair et retirée dès que tout est éteint.
// (Une toile plein écran laissée en permanence faisait planter Safari par moments : constaté le 15/11/2026.)
// Avec « animations réduites », rien n'est dessiné : l'effet (la cellule qui s'allume…) arrive tout de suite.

export interface Pt { x: number; y: number }
interface Branch { pts: Pt[]; t0: number; span: number; depth: number }
interface Bolt { branches: Branch[]; length: number }
interface Stroke { paths: Pt[][]; alpha: number; width: number; depth: number }
interface Glow { x: number; y: number; r: number; alpha: number }

type Anim = (t: number) => boolean | void;

let canvas: HTMLCanvasElement | null = null;
let g: CanvasRenderingContext2D | null = null;
let small: HTMLCanvasElement | null = null;
let gs: CanvasRenderingContext2D | null = null;
let W = 0, H = 0;
const SCALE = 0.25; // résolution de la toile du halo
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
  if (ambient > 0.003) { g.fillStyle = `rgba(214,244,255,${Math.min(0.95, ambient)})`; g.fillRect(0, 0, W, H); }
  // 1. le halo : dessiné en petit, puis agrandi (flou naturel)
  gs.setTransform(1, 0, 0, 1, 0, 0); gs.clearRect(0, 0, small.width, small.height); gs.setTransform(SCALE, 0, 0, SCALE, 0, 0);
  gs.globalCompositeOperation = "lighter"; gs.lineCap = "round"; gs.lineJoin = "round";
  for (const s of strokes) {
    gs.beginPath(); for (const p of s.paths) path(gs, p);
    gs.lineWidth = s.width * 9; gs.strokeStyle = `rgba(90,220,255,${0.5 * s.alpha})`; gs.stroke();
    gs.lineWidth = s.width * 3.5; gs.strokeStyle = `rgba(200,245,255,${0.7 * s.alpha})`; gs.stroke();
  }
  for (const o of glows) {
    const gr = gs.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.r);
    gr.addColorStop(0, `rgba(255,255,255,${o.alpha})`); gr.addColorStop(0.35, `rgba(170,238,255,${o.alpha * 0.55})`); gr.addColorStop(1, "rgba(59,232,255,0)");
    gs.fillStyle = gr; gs.beginPath(); gs.arc(o.x, o.y, o.r, 0, Math.PI * 2); gs.fill();
  }
  g.save(); g.globalCompositeOperation = "lighter"; g.imageSmoothingEnabled = true;
  g.drawImage(small, 0, 0, W, H);
  g.globalAlpha = 0.6; g.drawImage(small, -W * 0.04, -H * 0.04, W * 1.08, H * 1.08);
  g.restore();
  // 2. le canal : un cœur blanc très fin dans une gaine bleutée
  g.save(); g.globalCompositeOperation = "lighter"; g.lineCap = "round"; g.lineJoin = "round";
  for (const s of strokes) {
    g.beginPath(); for (const p of s.paths) path(g, p);
    g.lineWidth = s.width * 2.2; g.strokeStyle = `rgba(160,235,255,${0.45 * s.alpha})`; g.stroke();
    g.lineWidth = Math.max(0.7, s.width * 0.8); g.strokeStyle = `rgba(255,255,255,${s.alpha})`; g.stroke();
  }
  g.restore();
}

// ---------------- génération d'un éclair ----------------
const dist = (a: Pt, b: Pt) => Math.hypot(b.x - a.x, b.y - a.y);
/** Canal fractal entre a et b (déplacement du point milieu, de plus en plus fin). */
function channel(a: Pt, b: Pt, rough: number): Pt[] {
  const len = dist(a, b);
  const levels = Math.max(3, Math.min(7, Math.round(Math.log2(len / 5))));
  let pts = [a, b], disp = len * rough;
  for (let l = 0; l < levels; l++) {
    const next: Pt[] = [pts[0]];
    for (let i = 0; i < pts.length - 1; i++) {
      const p = pts[i], q = pts[i + 1], dx = q.x - p.x, dy = q.y - p.y, d = Math.hypot(dx, dy) || 1, off = (Math.random() * 2 - 1) * disp;
      next.push({ x: (p.x + q.x) / 2 - (dy / d) * off, y: (p.y + q.y) / 2 + (dx / d) * off }, q);
    }
    pts = next; disp *= 0.55;
  }
  return pts;
}
function sumLen(pts: Pt[]) { let s = 0; for (let i = 1; i < pts.length; i++) s += dist(pts[i - 1], pts[i]); return s; }
/** Un éclair complet : canal principal et ramifications (jusqu'à deux niveaux). */
function makeBolt(a: Pt, b: Pt, big: boolean): Bolt {
  const main = channel(a, b, big ? 0.16 : 0.13), length = sumLen(main);
  const branches: Branch[] = [{ pts: main, t0: 0, span: 1, depth: 0 }];
  const grow = (parent: Pt[], t0: number, span: number, depth: number, prob: number) => {
    for (let k = Math.floor(parent.length * 0.12); k < parent.length * 0.88; k++) {
      if (Math.random() > prob) continue;
      const p = parent[k], q = parent[Math.min(parent.length - 1, k + 2)];
      const ang = Math.atan2(q.y - p.y, q.x - p.x) + (Math.random() < 0.5 ? -1 : 1) * (0.3 + Math.random() * 0.7);
      const rest = sumLen(parent.slice(k)), L = rest * (0.22 + Math.random() * 0.4) * (depth ? 0.6 : 1);
      if (L < 10) continue;
      const pts = channel(p, { x: p.x + Math.cos(ang) * L, y: p.y + Math.sin(ang) * L }, 0.22);
      const bt0 = t0 + span * (k / parent.length), bspan = (sumLen(pts) / length) * 1.3;
      branches.push({ pts, t0: bt0, span: bspan, depth: depth + 1 });
      if (depth < 2) grow(pts, bt0, bspan, depth + 1, prob * (depth ? 0.5 : 0.8));
    }
  };
  grow(main, 0, 1, 0, big ? 0.075 : 0.04);
  return { branches, length };
}
/** Le canal légèrement agité d'une re-frappe à l'autre (le même chemin, jamais tout à fait immobile). */
function jitter(pts: Pt[], amp: number) { return pts.map((p, i) => (i === 0 || i === pts.length - 1 ? p : { x: p.x + (Math.random() - 0.5) * amp, y: p.y + (Math.random() - 0.5) * amp })); }

interface StrikeOpts { leader: number; restrikes: number[]; width: number; light: number; impact: number }
/**
 * Joue un éclair : traceur, arc en retour, re-frappes, extinction. onHit est appelé au contact.
 * Renvoie la durée totale (ms).
 */
function animate(bolt: Bolt, from: Pt, to: Pt, o: StrikeOpts, onHit?: () => void) {
  const t0 = performance.now(); let hit = false;
  const strikesAt = [0, ...o.restrikes];
  const end = o.leader + strikesAt[strikesAt.length - 1] + 520;
  const ok = play((t) => {
    const e = t - t0;
    if (e < o.leader) {
      // 1. le traceur avance par bonds : faible, bleuté, avec une pointe brillante
      const prog = Math.pow(e / o.leader, 0.85), stepped = Math.floor(prog * 14) / 14 + (prog * 14 % 1 < 0.6 ? 0 : 1 / 14);
      for (const br of bolt.branches) {
        const f = (stepped - br.t0) / br.span; if (f <= 0) continue;
        const n = Math.max(2, Math.min(br.pts.length, Math.ceil(br.pts.length * f)));
        strokes.push({ paths: [br.pts.slice(0, n)], alpha: br.depth ? 0.32 : 0.55, width: o.width * (br.depth ? 0.35 : 0.55), depth: br.depth });
        if (br.depth === 0) { const tip = br.pts[n - 1]; glows.push({ x: tip.x, y: tip.y, r: 14 * o.width, alpha: 0.5 }); }
      }
      glows.push({ x: from.x, y: from.y, r: 18 * o.width, alpha: 0.35 + 0.3 * prog });
      return;
    }
    if (!hit) { hit = true; onHit?.(); }
    // 2 et 3. arc en retour puis re-frappes : intensité qui retombe vite après chaque coup
    const s = e - o.leader;
    let I = 0, last = 0;
    strikesAt.forEach((at, k) => { if (s >= at) { last = k; I = Math.max(I, (k === 0 ? 1 : 0.97 - k * 0.06) * Math.exp(-(s - at) / 85)); } });
    I = Math.max(I, 0.3 * Math.exp(-s / 380)); // courant persistant entre les coups : le canal reste lumineux
    if (s > end - o.leader) return false;
    const main = bolt.branches[0];
    const mainPts = last === 0 ? main.pts : jitter(main.pts, 1.2);
    strokes.push({ paths: [mainPts], alpha: Math.min(1, I * 1.15), width: o.width, depth: 0 });
    // les ramifications brillent surtout au premier coup, se rallument un peu aux suivants, et s'éteignent plus vite
    const bI = Math.max(Math.exp(-s / 140), 0.45 * I * I);
    if (bI > 0.03) {
      const byDepth = [1, 2].map((d) => bolt.branches.filter((b) => b.depth === d).map((b) => b.pts));
      if (byDepth[0].length) strokes.push({ paths: byDepth[0], alpha: 0.85 * bI, width: o.width * 0.5, depth: 1 });
      if (byDepth[1].length) strokes.push({ paths: byDepth[1], alpha: 0.65 * bI, width: o.width * 0.32, depth: 2 });
    }
    ambient = Math.max(ambient, o.light * I * I);
    glows.push({ x: to.x, y: to.y, r: o.impact * (0.6 + 0.6 * I), alpha: 0.95 * I });
    glows.push({ x: from.x, y: from.y, r: o.impact * 0.6 * (0.6 + 0.6 * I), alpha: 0.6 * I });
  });
  return ok ? end : 0;
}

/** Centre d'un élément à l'écran. */
export function centerOf(el: Element | null | undefined, fallback: Pt = { x: window.innerWidth / 2, y: window.innerHeight / 2 }): Pt {
  const r = el?.getBoundingClientRect();
  return r && r.width ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : fallback;
}

/** Petit éclair (bonne réponse) : traceur rapide, arc en retour, une re-frappe. onHit est appelé au contact. */
export function strike(from: Pt, to: Pt, onHit?: () => void) {
  if (reduced()) { onHit?.(); return; }
  const len = dist(from, to);
  const ms = animate(makeBolt(from, to, false), from, to, { leader: Math.min(110, 50 + len * 0.12), restrikes: [70 + Math.random() * 30], width: 1.5, light: 0.05, impact: 30 }, onHit);
  if (!ms) onHit?.();
}

/** Grand éclair : la charge s'accumule au départ pendant `delay` secondes (arcs qui crépitent), puis la frappe. */
export function bigStrike(from: Pt, targets: Pt[], delay: number, onHit?: () => void) {
  if (reduced()) { window.setTimeout(() => onHit?.(), delay * 1000); return; }
  const charge = Math.max(0, delay * 1000 - 120);
  if (charge > 0) arcs(from, 26, charge, 3, true);
  window.setTimeout(() => {
    let first = true;
    const hitOnce = () => { if (first) { first = false; onHit?.(); } };
    const played = targets.map((to) => animate(makeBolt(from, to, true), from, to, { leader: 120, restrikes: [80, 170, 240], width: 2.8, light: 0.22, impact: 70 }, hitOnce));
    if (!played.some(Boolean)) hitOnce();
  }, charge);
}

/** Un éclair qui tombe du ciel (orage du levier principal) : long traceur ramifié, puis plusieurs re-frappes. */
export function skyStrike(fromX: number, toX: number, toY: number) {
  if (reduced()) return;
  const from = { x: fromX, y: -30 }, to = { x: toX, y: toY };
  animate(makeBolt(from, to, true), from, to, { leader: 190, restrikes: [70, 150, 260, 330], width: 3.4, light: 0.4, impact: 110 });
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
    if (t - last > 55 + Math.random() * 40) {
      last = t;
      const n = Math.max(1, Math.round(count * (gather ? 0.5 + k : 1)));
      cur = Array.from({ length: n }, () => {
        const a = Math.random() * Math.PI * 2, b = a + (Math.random() - 0.5) * 1.8, r1 = radius * (gather ? 1.6 - 0.8 * k : 0.7 + Math.random() * 0.4), r2 = radius * (0.9 + Math.random() * 0.5);
        const p = { x: c.x + Math.cos(a) * r1, y: c.y + Math.sin(a) * r1 * 1.1 }, q = gather ? { x: c.x + (Math.random() - 0.5) * 6, y: c.y + (Math.random() - 0.5) * 6 } : { x: c.x + Math.cos(b) * r2, y: c.y + Math.sin(b) * r2 * 1.1 };
        return { pts: channel(p, q, 0.28), born: t };
      });
    }
    for (const a of cur) { const f = Math.exp(-(t - a.born) / 45); strokes.push({ paths: [a.pts], alpha: 0.9 * f, width: 1.1, depth: 1 }); }
    glows.push({ x: c.x, y: c.y, r: radius * (gather ? 0.8 + 0.8 * k : 1.2), alpha: gather ? 0.25 + 0.5 * k : 0.35 });
  });
}

/** Gerbe d'étincelles qui retombent, avec leur traînée. */
export function sparks(c: Pt, n = 14) {
  if (reduced()) return;
  const t0 = performance.now(), ps = Array.from({ length: n }, () => { const a = Math.random() * 6.28, v = 80 + Math.random() * 180; return { vx: Math.cos(a) * v, vy: Math.sin(a) * v - 60 }; });
  play((t) => {
    const e = (t - t0) / 1000; if (e > 0.75) return false;
    const f = 1 - e / 0.75;
    strokes.push({ paths: ps.map((p) => { const x = c.x + p.vx * e, y = c.y + p.vy * e + 300 * e * e; return [{ x, y }, { x: x - p.vx * 0.025, y: y - (p.vy + 600 * e) * 0.025 }]; }), alpha: f, width: 0.9, depth: 2 });
    glows.push({ x: c.x, y: c.y, r: 34 * f, alpha: 0.8 * f });
  });
}

/** Flash blanc sur tout l'écran, qui s'éteint (il survit au changement d'écran). */
export function flash(peak = 0.85, ms = 700) {
  if (reduced()) return;
  const t0 = performance.now();
  play((t) => { const k = (t - t0) / ms; if (k >= 1) return false; ambient = Math.max(ambient, peak * (1 - k) * (1 - k)); });
}
