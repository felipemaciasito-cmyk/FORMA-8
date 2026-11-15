import { motion } from "motion/react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { Room } from "../content/types";
import { releaseEnergy } from "../lib/energy";
import { sfx } from "../lib/sound";
import { arcs, centerOf, sparks, strike } from "./Bolts";
import { ChargedCapsule } from "./Crew";

// Fin d'un protocole : la batterie est pleine, et le joueur la branche lui-même sur la capsule du membre.
// Deuxième version (15/11/2026, retour du propriétaire : « les prises doivent être rattachées à la jauge de batterie
// et se brancher à la capsule ») :
// - la capsule repose sur son socle, qui porte une prise par protocole du caisson (et le disjoncteur de la panne) ;
// - sous la capsule, le banc de batteries : une batterie par protocole, chacune juste sous sa prise. Le câble sort
//   de la borne de la batterie, et sa fiche se branche dans la prise du socle ;
// - les batteries des protocoles déjà faits restent branchées (vidées dans la capsule, câble sous tension) ;
// - à chaque branchement, la batterie se vide cellule après cellule dans la capsule, qui s'éclaire un peu plus,
//   et les kW rejoignent le compteur du haut.
// Quand tous les câbles sont branchés, le courant passe… sauf si la panne du caisson coupe le circuit : il faut
// alors la réparer (puis réarmer le disjoncteur) pour réveiller le membre.
// Geste : faire glisser la fiche jusqu'à la prise libre. Un simple toucher la branche aussi (accessibilité).

interface Pt { x: number; y: number }
type Phase = "ready" | "plugging" | "flowing" | "done" | "fault";

/** Décalage entre le centre de la fiche et sa prise : les broches entrent dans la prise par le bas. */
const SEAT = 13;
/** Bas de la fiche (là où le câble la rejoint), mesuré depuis son centre. */
const TAIL = 16;

/** La fiche du câble ; une fois branchée, ses broches sont dans la prise et ne se voient plus. */
function PlugSvg({ live, seated }: { live?: boolean; seated?: boolean }) {
  return (
    <svg width="30" height="40" viewBox="0 0 30 40" aria-hidden="true">
      {!seated && <rect x="8.6" y="0.5" width="3.2" height="10" rx="1.1" fill="#c9d6ea" />}
      {!seated && <rect x="18.2" y="0.5" width="3.2" height="10" rx="1.1" fill="#c9d6ea" />}
      <rect x="2.5" y="9" width="25" height="19" rx="6" fill="#1a2336" stroke="#f4feff" strokeWidth="1.5" />
      <rect x="8" y="15.5" width="14" height="2.8" rx="1.4" fill={live ? "#f4feff" : "#3be8ff"} />
      <path d="M10.5 28 h9 v5 a4.5 4.5 0 0 1 -9 0 Z" fill="#141c2c" stroke="#3a4766" />
    </svg>
  );
}

/** Nombre de cellules de la batterie d'un protocole : une par vérification, plus une pour la fin. */
const cellsOf = (r: Room, i: number) => (r.steps[i]?.blocks.filter((b) => b.type === "exercise").length ?? 0) + 1;

export function PlugScene({ room: r, index, cells, energy, incidentOpen, onPlugged }: {
  room: Room; index: number; cells: number; energy: number; incidentOpen: boolean;
  /** Appelé quand la batterie est branchée (last : c'était la dernière prise). */
  onPlugged: (last: boolean) => void;
}) {
  const total = r.steps.length;
  const last = index === total - 1;
  const box = useRef<HTMLDivElement>(null);
  const capRef = useRef<HTMLDivElement>(null);
  const sockRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const termRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const [phase, setPhase] = useState<Phase>("ready");
  const [plugged, setPlugged] = useState(index);
  const [drained, setDrained] = useState(0);
  const [geo, setGeo] = useState<{ socks: Pt[]; terms: Pt[] } | null>(null);
  const [plug, setPlug] = useState<Pt | null>(null);
  const [flight, setFlight] = useState<null | { from: Pt; to: Pt }>(null);
  const drag = useRef<null | { sx: number; sy: number; px: number; py: number; moved: boolean }>(null);

  // Géométrie (coordonnées dans la scène), mesurée à l'ouverture et quand l'écran change de taille.
  const measure = useCallback(() => {
    const b = box.current?.getBoundingClientRect();
    if (!b) return;
    const at = (el: Element | null | undefined, dy = 0) => { const q = el?.getBoundingClientRect(); return q ? { x: q.left - b.left + q.width / 2, y: q.top - b.top + q.height / 2 + dy } : { x: 0, y: 0 }; };
    setGeo({ socks: sockRefs.current.map((s) => at(s)), terms: termRefs.current.map((t) => at(t, -3)) });
  }, []);
  // Les textes changent de hauteur au fil de la scène : on remesure, pour que les câbles suivent les prises.
  useLayoutEffect(() => { measure(); }, [measure, phase, plugged]);
  useEffect(() => { window.addEventListener("resize", measure); return () => window.removeEventListener("resize", measure); }, [measure]);
  // Au repos, la fiche attend juste au-dessus de la borne de sa batterie.
  const home = geo ? { x: geo.terms[index].x, y: geo.terms[index].y - 34 } : null;
  useEffect(() => { if (home && !plug && phase === "ready") setPlug(home); }, [home, plug, phase]);

  // La capsule s'illumine un peu plus à chaque câble branché (sans jamais atteindre le plein : c'est le réveil).
  const lux = 0.1 + 0.75 * (plugged / total);
  const target = geo?.socks[index];

  const connect = () => {
    if (!geo || !target) return;
    setPhase("flowing");
    sfx("plug");
    const rect = box.current!.getBoundingClientRect(), s = { x: rect.left + target.x, y: rect.top + target.y };
    sparks(s, 14); arcs(s, 16, 260, 2);
    // La batterie se vide dans la capsule, cellule après cellule (de la plus haute à la plus basse).
    for (let k = 1; k <= cells; k++) window.setTimeout(() => setDrained(k), 200 + k * 170);
    window.setTimeout(() => {
      setPlugged(index + 1);
      const c = centerOf(capRef.current);
      strike(s, { x: c.x, y: c.y - 10 });
      const hud = centerOf(document.querySelector(".hud-stat.kw"), { x: window.innerWidth - 70, y: 30 });
      if (energy > 0) setFlight({ from: { x: c.x, y: c.y - 40 }, to: hud });
      else releaseEnergy();
    }, 300 + cells * 170);
    window.setTimeout(() => {
      setPlug(null);
      if (last && incidentOpen) {
        // Tous les câbles sont branchés, mais la panne coupe le circuit.
        sfx("circuit-fail");
        window.setTimeout(() => setPhase("fault"), 650);
      } else setPhase("done");
      onPlugged(last);
    }, 1900 + cells * 120);
  };

  const animateTo = (to: Pt, ms: number, hop: number, then?: () => void) => {
    const from = plug ?? to, t0 = performance.now();
    const step = (t: number) => {
      const k = Math.min(1, (t - t0) / ms), e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      setPlug({ x: from.x + (to.x - from.x) * e + Math.sin(Math.PI * k) * hop, y: from.y + (to.y - from.y) * e });
      if (k < 1) requestAnimationFrame(step); else then?.();
    };
    requestAnimationFrame(step);
  };
  const autoPlug = (animated: boolean) => {
    if (phase !== "ready" || !target) return;
    setPhase("plugging");
    animateTo({ x: target.x, y: target.y + SEAT }, animated ? 520 : 120, animated ? 10 : 0, connect);
  };

  const onDown = (e: React.PointerEvent) => {
    if (phase !== "ready" || !plug) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    drag.current = { sx: e.clientX, sy: e.clientY, px: plug.x, py: plug.y, moved: false };
    sfx("tap");
  };
  const onMove = (e: React.PointerEvent) => {
    const d = drag.current; if (!d) return;
    const dx = e.clientX - d.sx, dy = e.clientY - d.sy;
    if (Math.hypot(dx, dy) > 6) d.moved = true;
    setPlug({ x: d.px + dx, y: d.py + dy });
  };
  const onUp = () => {
    const d = drag.current; drag.current = null; if (!d || !plug || !target || !home) return;
    const dist = Math.hypot(plug.x - target.x, plug.y - SEAT - target.y);
    if (!d.moved || dist < 52) autoPlug(!d.moved);
    else animateTo(home, 380, 0);
  };

  // Câble d'une borne de batterie (en bas) jusqu'à la fiche (en haut) : il monte en souplesse.
  const cable = (a: Pt, b: Pt) => {
    const h = Math.max(24, (a.y - b.y) * 0.5);
    return `M${a.x} ${a.y} C ${a.x} ${a.y - h}, ${b.x} ${b.y + h}, ${b.x} ${b.y}`;
  };
  const pastCls = phase === "fault" ? "cut" : "live";
  const pct = Math.round(((cells - drained) / cells) * 100);
  // Mêmes colonnes pour le socle et le banc : chaque batterie est juste sous sa prise (plus le disjoncteur).
  const cols = `repeat(${total}, var(--col))${r.incident ? " 30px" : ""}`;

  return (
    <div ref={box} className="plug-scene">
      <div className="kicker" style={{ color: "#fff" }}>Protocole {String(index + 1).padStart(2, "0")} terminé · {phase === "fault" ? "disjoncté" : phase === "done" ? `capsule ${plugged} / ${total}` : `batterie ${pct} %`}</div>
      <div style={{ fontSize: 19, fontWeight: 700, lineHeight: 1.2, marginTop: 2 }}>
        {phase === "fault" ? "Le courant ne passe pas" : phase === "done" ? (plugged >= total ? "Le courant passe" : `${r.member} reprend des forces`) : `Branche ta batterie sur la capsule de ${r.member}`}
      </div>
      <div className="small muted" style={{ minHeight: 40, maxWidth: 320 }}>
        {phase === "fault" ? `Les ${total} batteries sont branchées, mais une panne coupe le circuit. Répare-la pour réveiller ${r.member}.`
          : phase === "done" ? (plugged >= total ? "" : `Encore ${total - plugged} protocole${total - plugged > 1 ? "s" : ""} pour le réveiller.`)
          : "Fais glisser la fiche de ta batterie jusqu'à la prise libre du socle, ou touche-la."}
      </div>

      {/* La capsule et son socle : une seule pièce. */}
      <div className="capsule-unit">
        <motion.div ref={capRef} key={`cap-${plugged}`} style={{ position: "relative", zIndex: 1 }}
          initial={plugged > index ? { scale: 1.06, filter: "brightness(1.8)" } : false} animate={{ scale: 1, filter: "brightness(1)" }} transition={{ duration: 0.7, ease: "easeOut" }}>
          <ChargedCapsule id={r.id} state="asleep" lux={phase === "fault" ? 0.4 : lux} size={120} />
        </motion.div>
        <div className={`socle ${phase === "fault" ? "fault" : ""}`} style={{ gridTemplateColumns: cols }} aria-label={`Socle de la capsule : ${plugged} batterie${plugged > 1 ? "s" : ""} branchée${plugged > 1 ? "s" : ""} sur ${total}`}>
          {r.steps.map((s, i) => (
            <span key={s.id} className="col">
              <span ref={(el) => { sockRefs.current[i] = el; }} className={`sock ${i < plugged ? (phase === "fault" ? "on dead" : "on") : ""} ${i === index && phase === "ready" ? "free" : ""}`} />
            </span>
          ))}
          {r.incident && <span className={`breaker ${phase === "fault" ? "off" : ""}`} aria-label={phase === "fault" ? "Disjoncteur de la panne : coupé" : "Disjoncteur de la panne"}><small>PANNE</small></span>}
        </div>
      </div>

      {/* Le banc de batteries : une par protocole, chacune sous sa prise. */}
      <div className="bank" style={{ gridTemplateColumns: cols }} aria-hidden="true">
        {r.steps.map((s, i) => {
          const n = i === index ? cells : cellsOf(r, i);
          const state = i < plugged ? "used" : i === index ? "current" : "empty";
          const lit = state === "current" ? n - drained : 0;
          return (
            <span key={s.id} className={`col ${state}`}>
              <span className={`vbatt ${state === "current" && drained === 0 ? "full" : ""}`}>
                <span ref={(el) => { termRefs.current[i] = el; }} className="term" />
                {Array.from({ length: n }, (_, k) => <i key={k} className={k >= n - lit ? "on" : ""} />)}
              </span>
              <small>P{i + 1}</small>
            </span>
          );
        })}
        {r.incident && <span />}
      </div>
      <div className="small muted mono" style={{ fontSize: 10.5, letterSpacing: ".1em", marginTop: 6 }}>BATTERIE DU PROTOCOLE {String(index + 1).padStart(2, "0")} · {pct} %</div>

      {geo && (
        <svg className="cables" aria-hidden="true">
          {geo.socks.slice(0, plugged).map((s, i) => {
            if (i === index && plug) return null; // le câble de la batterie en cours suit sa fiche
            const d = cable(geo.terms[i], { x: s.x, y: s.y + SEAT + TAIL });
            return <g key={i} className={pastCls}><path className="glow" d={d} /><path className="sheath" d={d} /><path className="core" d={d} /></g>;
          })}
          {plug && (() => {
            const d = cable(geo.terms[index], { x: plug.x, y: plug.y + TAIL });
            const on = phase === "flowing";
            return <g className={on ? "live" : ""}>{on && <path className="glow" d={d} />}<path className="sheath" d={d} /><path className="core" d={d} /></g>;
          })()}
        </svg>
      )}
      {/* Fiches déjà branchées dans le socle. */}
      {geo && geo.socks.slice(0, plugged).map((s, i) => (i === index && plug ? null : (
        <div key={i} className="plug seated" style={{ left: s.x, top: s.y + SEAT }} aria-hidden="true"><PlugSvg live={phase !== "fault"} seated /></div>
      )))}
      {plug && (
        <div className={`plug ${phase === "ready" && !drag.current ? "hint" : ""}`} style={{ left: plug.x, top: plug.y }} role="button" tabIndex={0}
          aria-label={`Brancher la batterie sur la capsule de ${r.member}`}
          onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); autoPlug(true); } }}>
          <PlugSvg live={phase === "flowing"} seated={phase === "flowing"} />
        </div>
      )}
      {flight && (
        <motion.div className="kw-flight" aria-hidden="true"
          initial={{ x: flight.from.x - 70, y: flight.from.y - 26, scale: 0.5, opacity: 0 }}
          animate={{ x: [flight.from.x - 70, flight.from.x - 70, flight.from.x - 70, flight.to.x - 70], y: [flight.from.y - 6, flight.from.y - 36, flight.from.y - 40, flight.to.y - 26], scale: [0.5, 1.1, 1, 0.3], opacity: [0, 1, 1, 0.2] }}
          transition={{ duration: 1.5, times: [0, 0.2, 0.55, 1], ease: [0.5, 0, 0.2, 1] }}
          onAnimationComplete={() => { setFlight(null); releaseEnergy(); sfx("relay"); }}
          style={{ width: 140, textAlign: "center" }}>
          +{energy}<small>kW</small>
        </motion.div>
      )}
    </div>
  );
}
