import { useEffect, useRef } from "react";

// Les éclairs de FORMA-8 : une seule toile, posée au-dessus de tout l'écran, sur laquelle on dessine les arcs
// (bonne réponse, fin de protocole, branchement, réveil). Blanc et cyan seulement (choix du 15/11/2026).
// Avec « animations réduites », rien n'est dessiné : l'effet (la cellule qui s'allume…) arrive tout de suite.

export interface Pt { x: number; y: number }
type Anim = (t: number) => boolean | void;

let canvas: HTMLCanvasElement | null = null;
let g: CanvasRenderingContext2D | null = null;
let W = 0, H = 0;
const anims = new Set<Anim>();
let looping = false;

const reduced = () => document.documentElement.classList.contains("reduce-motion");

/** La toile des éclairs, à monter une fois (dans la couche des récompenses). */
export function BoltCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current; if (!c) return;
    const size = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1); W = window.innerWidth; H = window.innerHeight;
      c.width = Math.round(W * dpr); c.height = Math.round(H * dpr); g = c.getContext("2d"); g?.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    canvas = c; size();
    window.addEventListener("resize", size);
    return () => { window.removeEventListener("resize", size); if (canvas === c) { canvas = null; g = null; } };
  }, []);
  return <canvas ref={ref} aria-hidden="true" className="no-print" style={{ position: "fixed", inset: 0, width: "100%", height: "100%", zIndex: 115, pointerEvents: "none" }} />;
}

function loop() {
  if (!g) { anims.clear(); looping = false; return; }
  g.clearRect(0, 0, W, H);
  const t = performance.now();
  for (const a of [...anims]) if (a(t) === false) anims.delete(a);
  if (anims.size) requestAnimationFrame(loop); else { g.clearRect(0, 0, W, H); looping = false; }
}
function play(a: Anim) { anims.add(a); if (!looping) { looping = true; requestAnimationFrame(loop); } }

type Path = { pts: [number, number][]; w: number };
function line(x1: number, y1: number, x2: number, y2: number, rough: number): [number, number][] {
  const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy) || 1, nx = -dy / len, ny = dx / len, n = Math.max(6, Math.min(42, Math.round(len / 11)));
  const pts: [number, number][] = []; let off = 0;
  for (let k = 0; k <= n; k++) { const u = k / n; off = off * 0.55 + (Math.random() - 0.5) * len * rough; const tp = Math.sin(Math.PI * u); pts.push([x1 + dx * u + nx * off * tp, y1 + dy * u + ny * off * tp]); }
  return pts;
}
function bolt(a: Pt, b: Pt, big: boolean): Path[] {
  const main = line(a.x, a.y, b.x, b.y, big ? 0.11 : 0.09), paths: Path[] = [{ pts: main, w: 1 }];
  const nb = big ? 4 + Math.floor(Math.random() * 3) : 1 + Math.floor(Math.random() * 2);
  for (let i = 0; i < nb; i++) {
    const [bx, by] = main[Math.floor(main.length * (0.15 + Math.random() * 0.6))];
    const ang = Math.atan2(b.y - a.y, b.x - a.x) + (Math.random() < 0.5 ? -1 : 1) * (0.35 + Math.random() * 0.6), L = Math.hypot(b.x - a.x, b.y - a.y) * (0.12 + Math.random() * 0.22);
    paths.push({ pts: line(bx, by, bx + Math.cos(ang) * L, by + Math.sin(ang) * L, 0.12), w: 0.45 });
  }
  return paths;
}
function draw(paths: Path[], alpha: number, width: number) {
  if (!g) return;
  g.save(); g.globalCompositeOperation = "lighter"; g.lineJoin = "round"; g.lineCap = "round";
  for (const p of paths) for (const [lw, c] of [[width * 7 * p.w, `rgba(59,232,255,${0.1 * alpha})`], [width * 2.6 * p.w, `rgba(59,232,255,${0.45 * alpha})`], [Math.max(0.8, width * p.w), `rgba(255,255,255,${alpha})`]] as const) {
    g.beginPath(); p.pts.forEach(([x, y], i) => (i ? g!.lineTo(x, y) : g!.moveTo(x, y))); g.lineWidth = lw; g.strokeStyle = c; g.stroke();
  }
  g.restore();
}
function glow(x: number, y: number, r: number, alpha: number) {
  if (!g || r <= 0) return;
  g.save(); g.globalCompositeOperation = "lighter";
  const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(255,255,255,${alpha})`); gr.addColorStop(0.3, `rgba(190,245,255,${alpha * 0.6})`); gr.addColorStop(1, "rgba(59,232,255,0)");
  g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); g.restore();
}

/** Centre d'un élément à l'écran. */
export function centerOf(el: Element | null | undefined, fallback: Pt = { x: window.innerWidth / 2, y: window.innerHeight / 2 }): Pt {
  const r = el?.getBoundingClientRect();
  return r && r.width ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : fallback;
}

/** Petit éclair : frappe, re-frappe, s'éteint (environ 0,35 s). onHit est appelé à l'impact. */
export function strike(from: Pt, to: Pt, onHit?: () => void) {
  if (reduced() || !g) { onHit?.(); return; }
  const t0 = performance.now(); const p1 = bolt(from, to, false); let p2: Path[] | null = null, hit = false;
  play((t) => {
    const e = t - t0;
    if (!hit && e > 30) { hit = true; onHit?.(); }
    if (e < 45) { draw(p1, 1, 2); glow(to.x, to.y, 34, 0.9); glow(from.x, from.y, 18, 0.6); }
    else if (e < 90) draw(p1, 0.3, 1.6);
    else if (e < 150) { p2 = p2 ?? bolt(from, to, false); draw(p2, 0.9, 1.8); glow(to.x, to.y, 26, 0.7); }
    else if (e < 360) { const k = 1 - (e - 150) / 210; draw(p2 ?? p1, 0.55 * k, 1.4); glow(to.x, to.y, 22, 0.4 * k); }
    else return false;
  });
}

/** Grand éclair : la charge s'accumule au point de départ pendant `delay` secondes, puis plusieurs frappes. */
export function bigStrike(from: Pt, targets: Pt[], delay: number, onHit?: () => void) {
  if (reduced() || !g) { window.setTimeout(() => onHit?.(), delay * 1000); return; }
  const t0 = performance.now(), H0 = delay * 1000; let bolts: Path[] | null = null, hit = false;
  play((t) => {
    const e = t - t0;
    if (e < H0) {
      const k = e / H0; glow(from.x, from.y, 14 + 40 * k, 0.25 + 0.6 * k);
      for (let i = 0; i < 2 + Math.floor(k * 4); i++) { const a = Math.random() * 6.28, r = 16 + 30 * k * Math.random(); draw([{ pts: line(from.x, from.y, from.x + Math.cos(a) * r, from.y + Math.sin(a) * r, 0.25), w: 0.5 }], 0.35 + 0.5 * k, 1); }
      return;
    }
    const s = e - H0;
    if (!hit) { hit = true; onHit?.(); }
    if (!bolts || (s > 70 && s < 90) || (s > 190 && s < 210)) bolts = targets.flatMap((to) => bolt(from, to, true));
    let a: number;
    if (s < 60) a = 1; else if (s < 110) a = 0.35; else if (s < 200) a = 1; else if (s < 260) a = 0.5; else if (s < 600) a = 0.85 * (1 - (s - 260) / 340); else return false;
    draw(bolts, a, 3); targets.forEach((to) => glow(to.x, to.y, 60, 0.8 * a)); glow(from.x, from.y, 36, 0.7 * a);
  });
}

/** Arcs qui sautent autour d'un point (une capsule qui se charge, une prise qu'on branche). */
export function arcs(c: Pt, radius: number, ms: number, count = 3) {
  if (reduced() || !g) return;
  const t0 = performance.now(); let last = 0, cur: Path[] = [];
  play((t) => {
    if (t - t0 > ms) return false;
    if (t - last > 70) {
      last = t;
      cur = Array.from({ length: count }, () => {
        const a = Math.random() * 6.28, b = a + (Math.random() - 0.5) * 1.6, r1 = radius * (0.7 + Math.random() * 0.4), r2 = radius * (0.9 + Math.random() * 0.5);
        return { pts: line(c.x + Math.cos(a) * r1, c.y + Math.sin(a) * r1 * 1.15, c.x + Math.cos(b) * r2, c.y + Math.sin(b) * r2 * 1.15, 0.25), w: 0.55 };
      });
    }
    draw(cur, 0.85 * (0.5 + Math.random() * 0.5), 1.4);
  });
}

/** Gerbe d'étincelles qui retombent. */
export function sparks(c: Pt, n = 14) {
  if (reduced() || !g) return;
  const t0 = performance.now(), ps = Array.from({ length: n }, () => { const a = Math.random() * 6.28, v = 60 + Math.random() * 140; return { vx: Math.cos(a) * v, vy: Math.sin(a) * v - 40 }; });
  play((t) => {
    const e = (t - t0) / 1000; if (e > 0.7 || !g) return false;
    g.save(); g.globalCompositeOperation = "lighter";
    for (const p of ps) { const x = c.x + p.vx * e, y = c.y + p.vy * e + 260 * e * e; g.strokeStyle = `rgba(255,255,255,${1 - e / 0.7})`; g.lineWidth = 1.6; g.beginPath(); g.moveTo(x, y); g.lineTo(x - p.vx * 0.03, y - p.vy * 0.03); g.stroke(); }
    g.restore(); glow(c.x, c.y, 30 * (1 - e), 0.8 * (1 - e / 0.7));
  });
}

/** Flash blanc sur tout l'écran, qui s'éteint (il survit au changement d'écran : la toile reste montée). */
export function flash(peak = 0.85, ms = 700) {
  if (reduced() || !g) return;
  const t0 = performance.now();
  play((t) => {
    const k = (t - t0) / ms; if (k >= 1 || !g) return false;
    g.save(); g.fillStyle = `rgba(235,252,255,${peak * (1 - k) * (1 - k)})`; g.fillRect(0, 0, W, H); g.restore();
  });
}

/** Un éclair qui tombe du haut de l'écran (orage du levier principal). */
export function skyStrike(fromX: number, toX: number, toY: number) {
  bigStrike({ x: fromX, y: -20 }, [{ x: toX, y: toY }], 0.02);
}
