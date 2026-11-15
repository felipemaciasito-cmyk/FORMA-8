import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { sfx } from "../lib/sound";
import { arcs, bigStrike, flash, sparks, strike, type Pt } from "./Bolts";

// La centrale d'un caisson (choix du propriétaire, 15/11/2026, piste « réacteur ») : un anneau d'énergie posé sous la
// capsule du membre, avec une prise par protocole. À la fin de chaque protocole, le joueur y branche la batterie qu'il
// vient de charger.
// - Chaque branchement fait réagir la centrale, un peu plus fort à chaque fois.
// - Dès la première prise, de l'électricité y circule en permanence ; chaque prise la rend plus vive.
// - Toucher la centrale tente d'envoyer l'arc vers la capsule. La tentative échoue tant qu'une prise est libre, ou
//   tant que la panne du caisson coupe le circuit. Quand tout est prêt, l'arc part et réveille le membre.
// L'électricité permanente est dessinée en SVG (quelques traits redessinés 12 fois par seconde), jamais sur une toile
// laissée ouverte : une toile plein écran permanente faisait planter Safari (constaté le 15/11/2026).

export type FireState = "ok" | "missing" | "fault";
export interface CentraleHandle {
  /** Positions à l'écran : prises, angle de chaque prise (degrés), cœur, électrode du haut, échelle du dessin. */
  geometry(): { sockets: Pt[]; angles: number[]; core: Pt; electrode: Pt; scale: number } | null;
  /** Réaction au branchement de la prise `index` (plus forte à chaque prise). */
  react(index: number): void;
}

const VB = 300, C = { x: 150, y: 168 }, R = 80, SOCK_R = R + 36, TOP = { x: 150, y: 30 };
const rad = (d: number) => (d * Math.PI) / 180;
const reduced = () => typeof document !== "undefined" && document.documentElement.classList.contains("reduce-motion");

/** Angle (degrés) de la prise i : réparties autour de l'anneau, en laissant le haut libre pour l'électrode. */
export const socketAngle = (i: number, total: number) => -90 + (i + 0.5) * (360 / total);

/** Petit éclair en zigzag le long de l'anneau, entre deux angles (l'électricité qui circule). */
function crawler(a0: number, a1: number, r: number, jag: number) {
  const n = 9, pts: string[] = [];
  for (let k = 0; k <= n; k++) {
    const a = rad(a0 + ((a1 - a0) * k) / n), rr = r + (k === 0 || k === n ? 0 : (Math.random() * 2 - 1) * jag);
    pts.push(`${(C.x + Math.cos(a) * rr).toFixed(1)},${(C.y + Math.sin(a) * rr).toFixed(1)}`);
  }
  return pts.join(" ");
}

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
  /** L'arc a frappé la capsule. */
  onFire?: () => void;
  memberName: string;
}>(function Centrale({ total, plugged, free, fire, target, onFail, onFire, memberName }, ref) {
  const svg = useRef<SVGSVGElement>(null);
  const [tick, setTick] = useState(0);
  const [charge, setCharge] = useState(0);
  const [failed, setFailed] = useState(false);
  const [fired, setFired] = useState(false);
  const hold = useRef({ on: false, prog: 0, last: 0, lastArc: 0, done: false, failedAt: 0 });
  // toujours les dernières versions des rappels (la boucle de la tentative ne se recrée qu'au changement d'état)
  const cb = useRef({ target, onFail, onFire });
  cb.current = { target, onFail, onFire };
  const toScreen = (p: Pt): Pt => {
    const s = svg.current, m = s?.getScreenCTM();
    if (!s || !m) return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const q = s.createSVGPoint(); q.x = p.x; q.y = p.y; const r = q.matrixTransform(m); return { x: r.x, y: r.y };
  };
  const angles = Array.from({ length: total }, (_, i) => socketAngle(i, total));
  const sockAt = (i: number) => ({ x: C.x + Math.cos(rad(angles[i])) * SOCK_R, y: C.y + Math.sin(rad(angles[i])) * SOCK_R });

  useImperativeHandle(ref, () => ({
    geometry() {
      const s = svg.current; if (!s) return null;
      const box = s.getBoundingClientRect();
      return { sockets: angles.map((_, i) => toScreen(sockAt(i))), angles, core: toScreen(C), electrode: toScreen(TOP), scale: box.width / VB };
    },
    react(index) {
      // Plus il y a de prises branchées, plus la centrale réagit fort.
      const k = (index + 1) / total, core = toScreen(C), s = toScreen(sockAt(index));
      sparks(s, 10 + Math.round(14 * k));
      for (let j = 0; j <= index; j++) window.setTimeout(() => strike(toScreen(sockAt(j)), { x: core.x + (Math.random() - 0.5) * 16, y: core.y + (Math.random() - 0.5) * 16 }), 60 + j * 90);
      arcs(core, 30 + 40 * k, 400 + 900 * k, 2 + Math.round(4 * k));
      if (k > 0.5) window.setTimeout(() => flash(0.12 + 0.3 * (k - 0.5), 420), 120);
      if (index === total - 1) window.setTimeout(() => bigStrike(s, [core], 0.05), 200);
    },
  }));

  // L'électricité permanente : redessinée 12 fois par seconde dès la première prise (rien avec « animations réduites »).
  useEffect(() => {
    if (plugged < 1 || reduced()) return;
    const id = window.setInterval(() => setTick((t) => t + 1), 85);
    return () => window.clearInterval(id);
  }, [plugged]);

  // Tentative d'envoi de l'arc : maintenir le doigt sur la centrale.
  useEffect(() => {
    let raf = 0;
    const MS = reduced() ? 1000 : 2400, FAIL_AT = 0.42;
    const loop = (t: number) => {
      const h = hold.current, dt = Math.min(50, t - (h.last || t)); h.last = t;
      if (!h.done) {
        h.prog = h.on ? Math.min(1, h.prog + dt / MS) : Math.max(0, h.prog - dt / (MS * 1.4));
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
          h.on = false; h.prog = 0; h.failedAt = t;
          sfx("circuit-fail"); arcs(toScreen(TOP), 26, 380, 3);
          setFailed(true); window.setTimeout(() => setFailed(false), 900);
          cb.current.onFail?.(fire);
        }
        if (h.on && fire === "ok" && h.prog >= 1) {
          h.on = false; h.done = true; setFired(true);
          const top = toScreen(TOP), to = cb.current.target();
          bigStrike(top, [to, { x: to.x - 24, y: to.y - 30 }, { x: to.x + 24, y: to.y - 30 }], 0.05, () => { flash(0.5, 650); cb.current.onFire?.(); });
        }
        // on ne redessine que si la charge a vraiment bougé (pas 60 fois par seconde à l'arrêt)
        setCharge((c) => (Math.abs(c - h.prog) > 0.004 || (h.prog === 0 && c !== 0) ? h.prog : c));
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fire]);

  const start = () => { const h = hold.current; if (h.done || h.on) return; h.on = true; sfx("relay"); };
  const end = () => { hold.current.on = false; };

  // Anneau : un segment par protocole, allumé quand sa prise est branchée ; la lumière tourne pendant la charge.
  const seg = 360 / total, spin = charge > 0 ? (tick * (0.5 + charge * 3)) % total : -1;
  const level = plugged / total;
  const boost = Math.round(charge * 4);
  const crawlers = useMemo(() => (plugged > 0 && !reduced()
    ? Array.from({ length: plugged + boost }, (_, k) => {
      const a = Math.random() * 360, len = 18 + Math.random() * (22 + 30 * level);
      return <polyline key={`${tick}-${k}`} points={crawler(a, a + len, R + (Math.random() - 0.5) * 6, 4 + 4 * level)} />;
    })
    : []), [tick, plugged, boost, level]);

  return (
    <div className={`centrale ${failed ? "failed" : ""} ${fired ? "fired" : ""}`}>
      <svg ref={svg} viewBox={`0 0 ${VB} ${VB}`} role="button" tabIndex={0}
        aria-label={fire === "ok" ? `Centrale : maintiens pour envoyer l'arc à ${memberName}` : `Centrale : ${plugged} prise${plugged > 1 ? "s" : ""} branchée${plugged > 1 ? "s" : ""} sur ${total}. Maintiens pour tenter d'envoyer l'arc`}
        onPointerDown={(e) => { e.preventDefault(); (e.currentTarget as Element).setPointerCapture?.(e.pointerId); start(); }}
        onPointerUp={end} onPointerCancel={end} onLostPointerCapture={end}
        onKeyDown={(e) => { if ((e.key === "Enter" || e.key === " ") && !e.repeat) { e.preventDefault(); start(); } }}
        onKeyUp={(e) => { if (e.key === "Enter" || e.key === " ") end(); }}>
        <defs>
          <radialGradient id="ctl-core"><stop offset="0" stopColor="#ffffff" /><stop offset=".35" stopColor="#9ff3ff" /><stop offset="1" stopColor="#3be8ff" stopOpacity="0" /></radialGradient>
          <linearGradient id="ctl-metal" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#17233c" /><stop offset="1" stopColor="#070c17" /></linearGradient>
        </defs>
        {/* électrode du haut, vers la capsule */}
        <line x1={C.x} y1={C.y - R - 18} x2={TOP.x} y2={TOP.y + 6} stroke="#c9d6ea" strokeWidth="3" />
        <circle cx={TOP.x} cy={TOP.y} r="7" fill={charge > 0.05 ? "#f4feff" : "#1a2336"} stroke="#c9d6ea" strokeWidth="2" />
        <circle cx={C.x} cy={C.y} r={R + 20} fill="url(#ctl-metal)" stroke="#2a3858" />
        <circle cx={C.x} cy={C.y} r={R - 18} fill="#060a14" stroke="#1c2740" />
        {angles.map((_, i) => {
          const s = rad(-90 + i * seg + 5), e = rad(-90 + (i + 1) * seg - 5), on = i < plugged, hot = Math.floor(spin) === i;
          return <path key={i} className={`ctl-seg ${on ? "on" : ""} ${hot ? "hot" : ""} ${failed && on ? "fail" : ""}`}
            d={`M${C.x + Math.cos(s) * R} ${C.y + Math.sin(s) * R} A${R} ${R} 0 0 1 ${C.x + Math.cos(e) * R} ${C.y + Math.sin(e) * R}`} />;
        })}
        <g className="ctl-crawl">{crawlers}</g>
        <circle cx={C.x} cy={C.y} r="48" fill="url(#ctl-core)" opacity={Math.min(1, 0.08 + 0.55 * level + 0.4 * charge + (plugged && tick % 3 === 0 ? 0.06 : 0))} />
        <circle cx={C.x} cy={C.y} r="16" fill="#0e1628" stroke={failed ? "#ff4d6d" : "#c9d6ea"} strokeWidth="2" />
        {/* jauge de la tentative, autour du cœur */}
        {charge > 0 && <circle cx={C.x} cy={C.y} r="26" fill="none" stroke={fire === "ok" ? "#f4feff" : "#ffb547"} strokeWidth="3" strokeLinecap="round"
          strokeDasharray={`${(2 * Math.PI * 26 * charge).toFixed(1)} 400`} transform={`rotate(-90 ${C.x} ${C.y})`} />}
        {angles.map((a, i) => {
          const p = sockAt(i), on = i < plugged;
          return (
            <g key={`s${i}`}>
              {i === free && <circle cx={p.x} cy={p.y} r="15" className="ctl-call" />}
              <circle cx={p.x} cy={p.y} r="11" fill="#03060c" stroke={on ? "#f4feff" : i === free ? "#fff" : "#2a3858"} strokeWidth="2" />
              <rect x={p.x - 5.5} y={p.y - 1.5} width="11" height="3" rx="1.5" fill={on ? "#f4feff" : "#16203a"} transform={`rotate(${a + 90} ${p.x} ${p.y})`} />
              {on && <g transform={`translate(${p.x + Math.cos(rad(a)) * 12} ${p.y + Math.sin(rad(a)) * 12}) rotate(${a - 90})`}><SeatedPlug /></g>}
            </g>
          );
        })}
      </svg>
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
