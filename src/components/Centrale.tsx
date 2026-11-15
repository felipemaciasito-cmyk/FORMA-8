import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { sfx } from "../lib/sound";
import { arcs, bigStrike, flash, sparks, strike, type Pt } from "./Bolts";
import { createPlasma } from "./Plasma";

// La centrale d'un caisson (choix du propriétaire, 15/11/2026, piste « réacteur ») : un anneau d'énergie posé sous la
// capsule du membre, avec une prise par protocole. À la fin de chaque protocole, le joueur y branche la batterie qu'il
// vient de charger.
// - Chaque branchement fait réagir la centrale, un peu plus fort à chaque fois.
// - Dès la première prise, de l'électricité y circule en permanence (Plasma.ts) ; chaque prise la rend plus dense.
// - Toucher la centrale tente d'envoyer l'arc vers la capsule. La tentative échoue tant qu'une prise est libre, ou
//   tant que la panne du caisson coupe le circuit. Quand tout est prêt, l'arc part : la centrale passe en surcharge,
//   les arcs se multiplient jusqu'à une image saturée d'éclairs, puis le membre se réveille.
// Habillage « instrument » (demande du propriétaire : plus high-tech et sophistiqué) : graduations, anneau de mesure qui
// tourne, mires, repères des prises ; uniquement la palette de FORMA-7 (cyan, blanc, ambre pour l'attente, rouge pour
// la panne).

export type FireState = "ok" | "missing" | "fault";
export interface CentraleHandle {
  /** Positions à l'écran : prises, angle de chaque prise (degrés), cœur, électrode du haut, échelle du dessin. */
  geometry(): { sockets: Pt[]; angles: number[]; core: Pt; electrode: Pt; scale: number } | null;
  /** Réaction au branchement de la prise `index` (plus forte à chaque prise). */
  react(index: number): void;
}

const VW = 300, VH = 330, C = { x: 150, y: 172 }, R = 80, SOCK_R = R + 36, TOP = { x: 150, y: 26 };
const rad = (d: number) => (d * Math.PI) / 180;
const reduced = () => typeof document !== "undefined" && document.documentElement.classList.contains("reduce-motion");
const polar = (r: number, deg: number) => ({ x: C.x + Math.cos(rad(deg)) * r, y: C.y + Math.sin(rad(deg)) * r });

/** Angle (degrés) de la prise i : réparties autour de l'anneau, en laissant le haut libre pour l'électrode. */
export const socketAngle = (i: number, total: number) => -90 + (i + 0.5) * (360 / total);

export const Centrale = forwardRef<CentraleHandle, {
  total: number;
  /** Prises branchées (les premières de la liste). */
  plugged: number;
  /** Prise libre à signaler (celle du protocole qui vient de finir), ou -1. */
  free: number;
  fire: FireState;
  /** Point d'arrivée de l'arc (à l'écran), sous la capsule. */
  target: () => Pt;
  /** Une tentative a échoué. */
  onFail?: (why: Exclude<FireState, "ok">) => void;
  /** L'arc a fini de frapper la capsule (après la surcharge) : place au réveil. */
  onFire?: () => void;
  /** La charge de la tentative change (0 à 1), pour la télémétrie. */
  onCharge?: (k: number) => void;
  memberName: string;
}>(function Centrale({ total, plugged, free, fire, target, onFail, onFire, onCharge, memberName }, ref) {
  const svg = useRef<SVGSVGElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [charge, setCharge] = useState(0);
  const [failed, setFailed] = useState(false);
  const [fired, setFired] = useState(false);
  const hold = useRef({ on: false, prog: 0, last: 0, lastArc: 0, done: false });
  // toujours les dernières versions des rappels et de l'état (les boucles ne se recréent pas à chaque rendu)
  const cb = useRef({ target, onFail, onFire, onCharge });
  cb.current = { target, onFail, onFire, onCharge };
  const live = useRef({ plugged, charge: 0, overload: false, failed: false });
  live.current.plugged = plugged;
  const toScreen = (p: Pt): Pt => {
    const s = svg.current, m = s?.getScreenCTM();
    if (!s || !m) return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const q = s.createSVGPoint(); q.x = p.x; q.y = p.y; const r = q.matrixTransform(m); return { x: r.x, y: r.y };
  };
  const seg = 360 / total;
  const angles = Array.from({ length: total }, (_, i) => socketAngle(i, total));
  const sockAt = (i: number) => polar(SOCK_R, angles[i]);

  useImperativeHandle(ref, () => ({
    geometry() {
      const s = svg.current; if (!s) return null;
      const box = s.getBoundingClientRect();
      return { sockets: angles.map((_, i) => toScreen(sockAt(i))), angles, core: toScreen(C), electrode: toScreen(TOP), scale: box.width / VW };
    },
    react(index) {
      // Plus il y a de prises branchées, plus la centrale réagit fort.
      const k = (index + 1) / total, core = toScreen(C), s = toScreen(sockAt(index));
      sparks(s, 10 + Math.round(16 * k));
      for (let j = 0; j <= index; j++) window.setTimeout(() => strike(toScreen(sockAt(j)), { x: core.x + (Math.random() - 0.5) * 16, y: core.y + (Math.random() - 0.5) * 16 }), 60 + j * 90);
      arcs(core, 30 + 40 * k, 400 + 900 * k, 2 + Math.round(4 * k));
      if (k > 0.5) window.setTimeout(() => flash(0.12 + 0.3 * (k - 0.5), 420), 120);
      if (index === total - 1) window.setTimeout(() => bigStrike(s, [core], 0.05), 200);
    },
  }));

  // L'électricité qui vit dans l'anneau (toile locale ; rien avec « animations réduites »).
  useEffect(() => {
    const c = canvas.current; if (!c || reduced()) return;
    return createPlasma(c, () => {
      const n = live.current.overload ? total : live.current.plugged;
      return {
        cx: C.x, cy: C.y, ring: R, inner: 18,
        segments: Array.from({ length: n }, (_, i) => [-90 + i * seg + 5, -90 + (i + 1) * seg - 5] as [number, number]),
        sockets: Array.from({ length: live.current.plugged }, (_, i) => sockAt(i)),
      };
    }, () => ({ level: live.current.plugged / total, charge: live.current.charge, overload: live.current.overload, failed: live.current.failed }), VW, VH);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [total]);

  /** L'arc est parti : surcharge, arcs de plus en plus nombreux vers la capsule, image saturée, puis le réveil. */
  const climax = () => {
    live.current.overload = true; setFired(true);
    const top = toScreen(TOP), to = cb.current.target();
    const around = () => ({ x: to.x + (Math.random() - 0.5) * 120, y: to.y - Math.random() * 120 });
    if (reduced()) { flash(0.5, 500); window.setTimeout(() => cb.current.onFire?.(), 300); return; }
    bigStrike(top, [to, { x: to.x - 24, y: to.y - 30 }, { x: to.x + 24, y: to.y - 30 }], 0.05, () => flash(0.45, 600));
    arcs({ x: to.x, y: to.y - 60 }, 70, 2400, 5);
    arcs(toScreen(C), 90, 2400, 6, true);
    const t0 = performance.now();
    const id = window.setInterval(() => {
      const k = Math.min(1, (performance.now() - t0) / 2200), n = 1 + Math.round(k * 4);
      for (let i = 0; i < n; i++) strike(Math.random() < 0.5 ? top : toScreen(sockAt(Math.floor(Math.random() * total))), around());
      if (k >= 1) window.clearInterval(id);
    }, 80);
    [700, 1400].forEach((ms, i) => window.setTimeout(() => flash(0.25 + 0.15 * i, 380), ms));
    window.setTimeout(() => {
      // l'image finale : tous les arcs à la fois
      bigStrike(top, [to, around(), around(), around(), around()], 0.05, () => flash(0.85, 900));
      Array.from({ length: total }, (_, i) => toScreen(sockAt(i))).forEach((s) => strike(s, around()));
    }, 2250);
    window.setTimeout(() => cb.current.onFire?.(), 2650);
  };

  // Tentative d'envoi de l'arc : maintenir le doigt sur la centrale.
  useEffect(() => {
    let raf = 0;
    const MS = reduced() ? 1000 : 2400, FAIL_AT = 0.42;
    const loop = (t: number) => {
      // temps réel (et non nombre d'images) : la charge prend le même temps sur un appareil qui saccade ;
      // plafonné pour ne pas sauter d'un coup au retour d'une autre appli
      const h = hold.current, dt = Math.min(250, t - (h.last || t)); h.last = t;
      if (!h.done) {
        h.prog = h.on ? Math.min(1, h.prog + dt / MS) : Math.max(0, h.prog - dt / (MS * 1.4));
        live.current.charge = h.prog;
        if (h.on && !reduced() && t - h.lastArc > 85 - 45 * h.prog) {
          h.lastArc = t;
          const core = toScreen(C), top = toScreen(TOP), to = cb.current.target();
          strike({ x: core.x + (Math.random() - 0.5) * 18, y: core.y + (Math.random() - 0.5) * 18 }, { x: top.x, y: top.y + 4 });
          if (h.prog > 0.18) {
            // la colonne d'arcs monte vers la capsule, d'autant plus haut que la charge est forte
            const reach = Math.min(1, (h.prog - 0.18) / 0.7);
            strike({ x: top.x, y: top.y - 4 }, { x: top.x + (to.x - top.x) * reach + (Math.random() - 0.5) * 8, y: top.y + (to.y - top.y) * reach });
          }
        }
        if (h.on && fire !== "ok" && h.prog >= FAIL_AT) {
          // Échec : l'arc retombe, le circuit refuse.
          h.on = false; h.prog = 0; live.current.failed = true;
          sfx("circuit-fail"); arcs(toScreen(TOP), 26, 380, 3);
          setFailed(true); window.setTimeout(() => { setFailed(false); live.current.failed = false; }, 900);
          cb.current.onFail?.(fire);
        }
        if (h.on && fire === "ok" && h.prog >= 1) { h.on = false; h.done = true; climax(); }
        // on ne redessine que si la charge a vraiment bougé (pas 60 fois par seconde à l'arrêt)
        setCharge((c) => {
          const v = Math.abs(c - h.prog) > 0.004 || (h.prog === 0 && c !== 0) ? h.prog : c;
          if (v !== c) cb.current.onCharge?.(v);
          return v;
        });
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fire]);

  const start = () => { const h = hold.current; if (h.done || h.on) return; h.on = true; sfx("relay"); };
  const end = () => { hold.current.on = false; };
  const ticks = Array.from({ length: 72 }, (_, i) => i);

  return (
    <div className={`centrale ${failed ? "failed" : ""} ${fired ? "fired" : ""} ${charge > 0 ? "charging" : ""}`}>
      <svg ref={svg} viewBox={`0 0 ${VW} ${VH}`} role="button" tabIndex={0}
        aria-label={fire === "ok" ? `Centrale : maintiens pour envoyer l'arc à ${memberName}` : `Centrale : ${plugged} prise${plugged > 1 ? "s" : ""} branchée${plugged > 1 ? "s" : ""} sur ${total}. Maintiens pour tenter d'envoyer l'arc`}
        onPointerDown={(e) => { e.preventDefault(); (e.currentTarget as Element).setPointerCapture?.(e.pointerId); start(); }}
        onPointerUp={end} onPointerCancel={end} onLostPointerCapture={end}
        onKeyDown={(e) => { if ((e.key === "Enter" || e.key === " ") && !e.repeat) { e.preventDefault(); start(); } }}
        onKeyUp={(e) => { if (e.key === "Enter" || e.key === " ") end(); }}>
        <defs>
          <radialGradient id="ctl-core"><stop offset="0" stopColor="#ffffff" /><stop offset=".35" stopColor="#9ff3ff" /><stop offset="1" stopColor="#3be8ff" stopOpacity="0" /></radialGradient>
          <radialGradient id="ctl-disc" cx=".5" cy=".42" r=".6"><stop offset="0" stopColor="#13203a" /><stop offset="1" stopColor="#060a14" /></radialGradient>
          <linearGradient id="ctl-bezel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2b3b60" /><stop offset=".5" stopColor="#111a2e" /><stop offset="1" stopColor="#1d2a46" /></linearGradient>
        </defs>
        {/* mires et repères de l'instrument */}
        <g className="ctl-hud">
          <line x1="6" y1={C.y} x2={C.x - R - 26} y2={C.y} /><line x1={C.x + R + 26} y1={C.y} x2={VW - 6} y2={C.y} />
          <line x1={C.x} y1={C.y + R + 26} x2={C.x} y2={VH - 4} />
          {ticks.map((i) => { const long = i % 6 === 0, a = -90 + i * 5, p = polar(long ? 132 : 135, a), q = polar(140, a); return <line key={i} className={long ? "long" : ""} x1={p.x} y1={p.y} x2={q.x} y2={q.y} />; })}
          <circle cx={C.x} cy={C.y} r="146" className="ctl-faint" />
        </g>
        <g className="ctl-spin"><circle cx={C.x} cy={C.y} r="127" /></g>
        {/* électrode du haut, vers la capsule */}
        <line x1={C.x} y1={C.y - R - 20} x2={TOP.x} y2={TOP.y + 7} stroke="#c9d6ea" strokeWidth="3" />
        <rect x={TOP.x - 9} y={C.y - R - 30} width="18" height="10" rx="2" fill="url(#ctl-bezel)" stroke="#3a4b72" />
        <circle cx={TOP.x} cy={TOP.y} r="7.5" fill={charge > 0.05 || fired ? "#f4feff" : "#1a2336"} stroke="#c9d6ea" strokeWidth="2" className={charge > 0.05 ? "ctl-hot" : ""} />
        {/* le corps : lunette, disque, anneau en segments */}
        <circle cx={C.x} cy={C.y} r={R + 21} fill="url(#ctl-bezel)" />
        <circle cx={C.x} cy={C.y} r={R + 17} fill="url(#ctl-disc)" stroke="#2a3858" />
        <circle cx={C.x} cy={C.y} r={R - 17} fill="#04070f" stroke="#1c2740" />
        <circle cx={C.x} cy={C.y} r={R - 11} className="ctl-faint" strokeDasharray="1.5 4" />
        {angles.map((_, i) => {
          const s = rad(-90 + i * seg + 5), e = rad(-90 + (i + 1) * seg - 5), on = i < plugged || fired;
          return <path key={i} className={`ctl-seg ${on ? "on" : ""} ${failed && on ? "fail" : ""}`}
            d={`M${C.x + Math.cos(s) * R} ${C.y + Math.sin(s) * R} A${R} ${R} 0 0 1 ${C.x + Math.cos(e) * R} ${C.y + Math.sin(e) * R}`} />;
        })}
        <circle cx={C.x} cy={C.y} r="48" fill="url(#ctl-core)" opacity={Math.min(1, 0.06 + 0.3 * (plugged / total) + 0.5 * charge + (fired ? 0.5 : 0))} />
        <circle cx={C.x} cy={C.y} r="17" fill="#0b1324" stroke={failed ? "#ff4d6d" : "#c9d6ea"} strokeWidth="2" />
        <path d={`M${C.x - 7} ${C.y} h14 M${C.x} ${C.y - 7} v14`} stroke={failed ? "#ff4d6d" : "#8fdcef"} strokeWidth="1.4" />
        {/* jauge de la tentative, autour du cœur */}
        {charge > 0 && <circle cx={C.x} cy={C.y} r="27" fill="none" stroke={fire === "ok" ? "#f4feff" : "#ffb547"} strokeWidth="3" strokeLinecap="round"
          strokeDasharray={`${(2 * Math.PI * 27 * charge).toFixed(1)} 400`} transform={`rotate(-90 ${C.x} ${C.y})`} />}
        {angles.map((a, i) => {
          const p = sockAt(i), on = i < plugged, lp = polar(SOCK_R + 30, a);
          return (
            <g key={`s${i}`}>
              {i === free && <circle cx={p.x} cy={p.y} r="15" className="ctl-call" />}
              <circle cx={p.x} cy={p.y} r="12.5" fill="url(#ctl-bezel)" />
              <circle cx={p.x} cy={p.y} r="10" fill="#03060c" stroke={on ? "#f4feff" : i === free ? "#fff" : "#2a3858"} strokeWidth="1.8" />
              <rect x={p.x - 5.5} y={p.y - 1.5} width="11" height="3" rx="1.5" fill={on ? "#f4feff" : "#16203a"} transform={`rotate(${a + 90} ${p.x} ${p.y})`} />
              {on && <g transform={`translate(${p.x + Math.cos(rad(a)) * 12} ${p.y + Math.sin(rad(a)) * 12}) rotate(${a - 90})`}><SeatedPlug /></g>}
              <text x={lp.x} y={lp.y + 3} className={`ctl-lbl ${on ? "on" : i === free ? "free" : ""}`} textAnchor="middle">P{i + 1}</text>
            </g>
          );
        })}
      </svg>
      <canvas ref={canvas} className="ctl-plasma" aria-hidden="true" />
    </div>
  );
});

/** Fiche enfoncée dans sa prise (broches cachées), vue du dessus. */
export function SeatedPlug() {
  return (
    <g>
      <rect x="-13" y="-12" width="26" height="20" rx="6" fill="#1a2336" stroke="#f4feff" strokeWidth="1.5" />
      <rect x="-7" y="-4" width="14" height="3" rx="1.5" fill="#f4feff" />
      <path d="M-5 8 h10 v6 a5 5 0 0 1 -10 0 Z" fill="#141c2c" stroke="#3a4766" />
    </g>
  );
}
