import { channel, type Pt } from "./Bolts";

// L'électricité qui vit dans la centrale (demande du propriétaire, 15/11/2026 : « beaucoup plus réaliste »).
// Des filaments de plasma, fractals comme de vrais arcs, rampent le long de l'anneau sous tension, s'y accrochent,
// scintillent et meurent en quelques dixièmes de seconde ; des décharges partent du cœur vers l'anneau, des aigrettes
// jaillissent des fiches branchées. Une couronne de lumière tremble autour des segments allumés.
// Plus la centrale a de prises branchées, plus tout cela est dense ; pendant une tentative d'arc et au moment où l'arc
// part (« surcharge »), elle s'emballe.
// Toile locale (la taille de la centrale), 30 images par seconde au plus, arrêtée quand l'appli passe en arrière-plan ;
// jamais une toile plein écran laissée ouverte (elle faisait planter Safari, constaté le 15/11/2026).

interface Filament { paths: Pt[][]; born: number; life: number; k: number; w: number }
export interface PlasmaState {
  /** Part des prises branchées (0 à 1). */
  level: number;
  /** Charge de la tentative d'arc en cours (0 à 1). */
  charge: number;
  /** Surcharge : l'arc vient de partir. */
  overload: boolean;
  /** Échec : l'anneau tressaille. */
  failed: boolean;
}
export interface PlasmaGeometry { cx: number; cy: number; ring: number; inner: number; segments: [number, number][]; sockets: Pt[] }

const rnd = (a: number, b: number) => a + Math.random() * (b - a);
const polar = (cx: number, cy: number, r: number, deg: number): Pt => ({ x: cx + Math.cos((deg * Math.PI) / 180) * r, y: cy + Math.sin((deg * Math.PI) / 180) * r });

/** Un filament qui épouse l'anneau entre deux angles, avec ses petites ramifications. */
function ringFilament(g: PlasmaGeometry, a0: number, a1: number, jag: number): Pt[][] {
  const steps = Math.max(3, Math.round(Math.abs(a1 - a0) / 7)), base: Pt[] = [];
  for (let i = 0; i <= steps; i++) base.push(polar(g.cx, g.cy, g.ring + (i === 0 || i === steps ? 0 : rnd(-jag, jag)), a0 + ((a1 - a0) * i) / steps));
  const main: Pt[] = [base[0]];
  for (let i = 0; i < base.length - 1; i++) main.push(...channel(base[i], base[i + 1], 0.22).slice(1));
  const out = [main];
  // une ou deux aigrettes qui s'échappent de l'anneau, vers l'extérieur ou vers le cœur
  const n = Math.random() < 0.6 ? 1 : 2;
  for (let k = 0; k < n; k++) {
    const p = main[Math.floor(rnd(0.2, 0.8) * main.length)], ang = Math.atan2(p.y - g.cy, p.x - g.cx) + rnd(-0.6, 0.6), L = rnd(5, 14) * (Math.random() < 0.5 ? -1 : 1);
    out.push(channel(p, { x: p.x + Math.cos(ang) * L, y: p.y + Math.sin(ang) * L }, 0.3));
  }
  return out;
}

export function createPlasma(canvas: HTMLCanvasElement, geometry: () => PlasmaGeometry, state: () => PlasmaState, vw: number, vh: number) {
  const ctx = canvas.getContext("2d");
  let fil: Filament[] = [], raf = 0, last = 0, running = true;
  const acc = { ring: 0, radial: 0, socket: 0 };
  const resize = () => {
    const r = canvas.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.max(1, Math.round(r.width * dpr)); canvas.height = Math.max(1, Math.round(r.height * dpr));
    ctx?.setTransform((r.width * dpr) / vw, 0, 0, (r.height * dpr) / vh, 0, 0);
  };
  resize();

  const spawn = (t: number, dt: number) => {
    const g = geometry(), s = state(), lit = g.segments;
    if (!lit.length && !s.overload) return;
    const heat = Math.min(1, s.level * 0.7 + s.charge * 0.9 + (s.overload ? 1 : 0));
    // filaments le long de l'anneau
    acc.ring += dt * (3 + 14 * s.level + 26 * s.charge + (s.overload ? 60 : 0));
    while (acc.ring >= 1) {
      acc.ring--;
      const [sa, sb] = lit.length ? lit[Math.floor(Math.random() * lit.length)] : [0, 360];
      const len = rnd(10, 22 + 34 * heat), a0 = rnd(sa, Math.max(sa, sb - 4));
      fil.push({ paths: ringFilament(g, a0, Math.min(sb, a0 + len), 2.5 + 4 * heat), born: t, life: rnd(70, 200), k: rnd(0.55, 1), w: rnd(0.8, 1.2) });
    }
    // décharges du cœur vers l'anneau
    acc.radial += dt * (0.5 * s.level + 7 * s.charge + (s.overload ? 30 : 0));
    while (acc.radial >= 1) {
      acc.radial--;
      const [sa, sb] = lit.length ? lit[Math.floor(Math.random() * lit.length)] : [0, 360], a = rnd(sa, sb);
      fil.push({ paths: [channel(polar(g.cx, g.cy, g.inner, a + rnd(-20, 20)), polar(g.cx, g.cy, g.ring - 2, a), 0.2)], born: t, life: rnd(60, 140), k: rnd(0.6, 1), w: 1.1 });
    }
    // aigrettes au bout des fiches branchées
    acc.socket += dt * (0.4 * g.sockets.length * (0.4 + heat));
    while (acc.socket >= 1 && g.sockets.length) {
      acc.socket--;
      const p = g.sockets[Math.floor(Math.random() * g.sockets.length)], ang = Math.atan2(p.y - g.cy, p.x - g.cx) + Math.PI + rnd(-0.5, 0.5);
      fil.push({ paths: [channel(p, { x: p.x + Math.cos(ang) * rnd(14, 26), y: p.y + Math.sin(ang) * rnd(14, 26) }, 0.28)], born: t, life: rnd(60, 120), k: rnd(0.4, 0.8), w: 0.7 });
    }
  };

  const stroke = (paths: Pt[][]) => { if (!ctx) return; ctx.beginPath(); for (const p of paths) { ctx.moveTo(p[0].x, p[0].y); for (let i = 1; i < p.length; i++) ctx.lineTo(p[i].x, p[i].y); } };
  const draw = (t: number) => {
    if (!ctx) return;
    const g = geometry(), s = state();
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, canvas.width, canvas.height); ctx.restore();
    ctx.globalCompositeOperation = "lighter"; ctx.lineCap = "round"; ctx.lineJoin = "round";
    // la couronne : une lueur qui tremble autour des segments sous tension
    const heat = Math.min(1, s.level * 0.7 + s.charge + (s.overload ? 1 : 0));
    for (const [a, b] of g.segments) {
      const f = 0.6 + Math.random() * 0.4;
      ctx.beginPath(); ctx.arc(g.cx, g.cy, g.ring, (a * Math.PI) / 180, (b * Math.PI) / 180);
      ctx.lineWidth = 16; ctx.strokeStyle = `rgba(59,232,255,${(0.05 + 0.08 * heat) * f})`; ctx.stroke();
      ctx.lineWidth = 7; ctx.strokeStyle = `rgba(160,236,255,${(0.08 + 0.12 * heat) * f})`; ctx.stroke();
    }
    // le cœur respire et tressaille
    if (g.segments.length || s.overload) {
      const r = g.inner * (1.6 + heat), gr = ctx.createRadialGradient(g.cx, g.cy, 0, g.cx, g.cy, r), a = (0.25 + 0.6 * heat) * (0.75 + Math.random() * 0.25);
      gr.addColorStop(0, `rgba(255,255,255,${a})`); gr.addColorStop(0.3, `rgba(160,236,255,${a * 0.5})`); gr.addColorStop(1, "rgba(59,232,255,0)");
      ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(g.cx, g.cy, r, 0, Math.PI * 2); ctx.fill();
    }
    // les filaments : gaine bleutée, puis cœur blanc ; chacun scintille et s'éteint
    fil = fil.filter((f) => t - f.born < f.life);
    for (const f of fil) {
      const age = (t - f.born) / f.life, a = f.k * (age < 0.15 ? 1 : Math.exp(-(age - 0.15) * 3.2)) * (0.55 + Math.random() * 0.45) * (s.failed ? 0.5 : 1);
      stroke(f.paths);
      ctx.lineWidth = 5.5 * f.w; ctx.strokeStyle = `rgba(59,232,255,${0.1 * a})`; ctx.stroke();
      ctx.lineWidth = 2.2 * f.w; ctx.strokeStyle = `rgba(150,230,255,${0.4 * a})`; ctx.stroke();
      ctx.lineWidth = 0.8 * f.w; ctx.strokeStyle = s.failed ? `rgba(255,190,200,${a})` : `rgba(255,255,255,${a})`; ctx.stroke();
    }
  };

  const loop = (t: number) => {
    if (!running) return;
    raf = requestAnimationFrame(loop);
    if (document.visibilityState !== "visible") { last = t; return; }
    if (t - last < 32) return; // 30 images par seconde suffisent pour des arcs qui scintillent
    const dt = Math.min(0.1, (t - (last || t)) / 1000); last = t;
    spawn(t, dt); draw(t);
  };
  raf = requestAnimationFrame(loop);
  window.addEventListener("resize", resize);
  return () => { running = false; cancelAnimationFrame(raf); window.removeEventListener("resize", resize); canvas.width = 1; canvas.height = 1; };
}
