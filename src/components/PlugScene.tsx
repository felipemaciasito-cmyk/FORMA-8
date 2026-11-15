import { motion } from "motion/react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { Room } from "../content/types";
import { releaseEnergy } from "../lib/energy";
import { sfx } from "../lib/sound";
import { arcs, centerOf, sparks, strike } from "./Bolts";
import { ChargedCapsule } from "./Crew";

// Fin d'un protocole : la batterie est pleine, et le joueur la branche lui-même sur la capsule du membre
// (choix du propriétaire, 15/11/2026). La capsule a une prise par protocole du caisson. À chaque branchement, la
// batterie se vide dans la capsule, qui s'éclaire un peu plus, et les kW rejoignent le compteur du haut.
// Quand tous les câbles sont branchés, le courant passe… sauf si la panne du caisson coupe le circuit : il faut
// alors la réparer (puis réarmer le disjoncteur) pour réveiller le membre.
// Geste : faire glisser la prise jusqu'à la prise libre. Un simple toucher la branche aussi (accessibilité).

interface Pt { x: number; y: number }
type Phase = "ready" | "plugging" | "flowing" | "done" | "fault";

const PLUG_SVG = (
  <svg width="34" height="44" viewBox="0 0 34 44" aria-hidden="true">
    <rect x="10" y="1" width="3.4" height="11" rx="1.2" fill="#c9d6ea" /><rect x="20.6" y="1" width="3.4" height="11" rx="1.2" fill="#c9d6ea" />
    <rect x="3" y="10" width="28" height="22" rx="7" fill="#1a2336" stroke="#f4feff" strokeWidth="1.6" />
    <rect x="9" y="17" width="16" height="3" rx="1.5" fill="#3be8ff" />
    <path d="M12 32 h10 v6 a5 5 0 0 1 -10 0 Z" fill="#141c2c" stroke="#3a4766" />
  </svg>
);

export function PlugScene({ room: r, index, cells, energy, incidentOpen, onPlugged }: {
  room: Room; index: number; cells: number; energy: number; incidentOpen: boolean;
  /** Appelé quand la batterie est branchée (last : c'était la dernière prise). */
  onPlugged: (last: boolean) => void;
}) {
  const total = r.steps.length;
  const last = index === total - 1;
  const box = useRef<HTMLDivElement>(null);
  const capRef = useRef<HTMLDivElement>(null);
  const battRef = useRef<HTMLDivElement>(null);
  const sockRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const [phase, setPhase] = useState<Phase>("ready");
  const [plugged, setPlugged] = useState(index);
  const [drained, setDrained] = useState(0);
  const [geo, setGeo] = useState<{ socks: Pt[]; batt: Pt; home: Pt; w: number; floor: number } | null>(null);
  const [plug, setPlug] = useState<Pt | null>(null);
  const [flight, setFlight] = useState<null | { from: Pt; to: Pt }>(null);
  const drag = useRef<null | { sx: number; sy: number; px: number; py: number; moved: boolean }>(null);

  // Géométrie (coordonnées dans la scène), mesurée à l'ouverture et quand l'écran change de taille.
  const measure = useCallback(() => {
    const b = box.current?.getBoundingClientRect(); const bt = battRef.current?.getBoundingClientRect();
    if (!b || !bt) return;
    const socks = sockRefs.current.map((s) => { const q = s?.getBoundingClientRect(); return q ? { x: q.left - b.left + q.width / 2, y: q.top - b.top + q.height / 2 } : { x: 0, y: 0 }; });
    const batt = { x: bt.left - b.left + bt.width / 2, y: bt.top - b.top - 2 };
    const floor = Math.max(...socks.map((s) => s.y)) + 44; // sous le socle, sans cacher les étiquettes
    setGeo({ socks, batt, home: { x: batt.x + Math.min(70, bt.width / 3), y: batt.y - 36 }, w: b.width, floor });
  }, []);
  useLayoutEffect(() => { measure(); }, [measure]);
  useEffect(() => { window.addEventListener("resize", measure); return () => window.removeEventListener("resize", measure); }, [measure]);
  useEffect(() => { if (geo && !plug && phase === "ready") setPlug(geo.home); }, [geo, plug, phase]);

  const lux = (plugged / total) * 0.8;
  const target = geo?.socks[index];

  const connect = () => {
    if (!geo || !target) return;
    setPhase("flowing");
    sfx("plug");
    const rect = box.current!.getBoundingClientRect(), s = { x: rect.left + target.x, y: rect.top + target.y };
    sparks(s, 16); arcs(s, 18, 300, 2);
    // La batterie se vide dans la capsule, cellule après cellule.
    for (let k = 1; k <= cells; k++) window.setTimeout(() => setDrained(k), 250 + k * 190);
    window.setTimeout(() => {
      setPlugged(index + 1);
      const c = centerOf(capRef.current);
      strike(s, { x: c.x, y: c.y - 10 });
      const hud = centerOf(document.querySelector(".hud-stat.kw"), { x: window.innerWidth - 70, y: 30 });
      if (energy > 0) setFlight({ from: { x: c.x, y: c.y - 40 }, to: hud });
      else releaseEnergy();
    }, 900);
    window.setTimeout(() => {
      setPlug(null);
      if (last && incidentOpen) {
        // Tous les câbles sont branchés, mais la panne coupe le circuit.
        sfx("circuit-fail");
        window.setTimeout(() => setPhase("fault"), 650);
      } else setPhase("done");
      onPlugged(last);
    }, 2400);
  };

  const animateTo = (to: Pt, ms: number, hop: number, then?: () => void) => {
    const from = plug ?? to, t0 = performance.now();
    const step = (t: number) => {
      const k = Math.min(1, (t - t0) / ms), e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      setPlug({ x: from.x + (to.x - from.x) * e, y: from.y + (to.y - from.y) * e - Math.sin(Math.PI * k) * hop });
      if (k < 1) requestAnimationFrame(step); else then?.();
    };
    requestAnimationFrame(step);
  };
  const autoPlug = (animated: boolean) => {
    if (phase !== "ready" || !target) return;
    setPhase("plugging");
    animateTo({ x: target.x, y: target.y + 22 }, animated ? 560 : 120, animated ? 40 : 0, connect);
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
    const d = drag.current; drag.current = null; if (!d || !plug || !target || !geo) return;
    const dist = Math.hypot(plug.x - target.x, plug.y - 22 - target.y);
    if (!d.moved || dist < 48) autoPlug(!d.moved);
    else animateTo(geo.home, 380, 0);
  };

  // Câbles : ceux des protocoles précédents descendent sous le socle et partent sur les côtés ;
  // celui de la batterie suit la prise.
  const cable = (a: Pt, b: Pt, sag: number) => { const my = Math.max(a.y, b.y) + sag; return `M${a.x} ${a.y} C ${a.x} ${my}, ${b.x} ${my}, ${b.x} ${b.y}`; };
  const pastCls = phase === "fault" ? "cut" : "live";
  const doneCount = phase === "fault" || phase === "done" ? plugged : Math.min(plugged, index);

  return (
    <div ref={box} className="plug-scene">
      <div className="kicker" style={{ color: "#fff" }}>Protocole {String(index + 1).padStart(2, "0")} terminé · {phase === "fault" ? "disjoncté" : phase === "done" ? `capsule ${plugged} / ${total}` : "batterie pleine"}</div>
      <div style={{ fontSize: 19, fontWeight: 700, lineHeight: 1.2, marginTop: 2 }}>
        {phase === "fault" ? "Le courant ne passe pas" : phase === "done" ? (plugged >= total ? "Le courant passe" : `${r.member} reprend des forces`) : `Branche-la sur la capsule de ${r.member}`}
      </div>
      <div className="small muted" style={{ minHeight: 40, maxWidth: 320 }}>
        {phase === "fault" ? `Les ${total} câbles sont branchés, mais une panne coupe le circuit. Répare-la pour réveiller ${r.member}.`
          : phase === "done" ? (plugged >= total ? "" : `Encore ${total - plugged} protocole${total - plugged > 1 ? "s" : ""} pour le réveiller.`)
          : "Fais glisser la prise jusqu'à la prise libre, ou touche-la."}
      </div>
      <div ref={capRef} style={{ marginTop: 6 }}>
        <ChargedCapsule id={r.id} state="asleep" lux={phase === "fault" ? 0.55 : lux} size={124} />
      </div>
      <div className="socle" aria-label={`Capsule : ${plugged} câble${plugged > 1 ? "s" : ""} branché${plugged > 1 ? "s" : ""} sur ${total}`}>
        {r.steps.map((s, i) => (
          <span key={s.id} ref={(el) => { sockRefs.current[i] = el; }} className={`sock ${i < plugged ? (phase === "fault" ? "on dead" : "on") : ""} ${i === index && phase === "ready" ? "free" : ""}`}>
            <small>P{i + 1}</small>
          </span>
        ))}
        {r.incident && <span className={`breaker ${phase === "fault" ? "off" : ""}`}><small>PANNE</small></span>}
      </div>
      <div className="plug-dock" ref={battRef}>
        <div className="lbl"><span>BATTERIE DU PROTOCOLE {String(index + 1).padStart(2, "0")}</span><b>{Math.round(((cells - drained) / cells) * 100)} %</b></div>
        <div className={`battery xl ${drained === 0 ? "full" : ""}`} aria-hidden="true">
          {Array.from({ length: cells }, (_, i) => <i key={i} className={`${i === cells - 1 ? "final" : ""} ${i < cells - drained ? "on" : "drain"}`} />)}
        </div>
      </div>
      {geo && (
        <svg className="cables" aria-hidden="true">
          {geo.socks.slice(0, doneCount).map((s, i) => {
            const side = (i < total / 2 ? -1 : 1), end = { x: side < 0 ? -24 : geo.w + 24, y: geo.floor + Math.abs(i - (total - 1) / 2) * 7 };
            const d = `M${s.x} ${s.y + 8} C ${s.x} ${end.y + 4}, ${s.x + side * 30} ${end.y}, ${end.x} ${end.y}`;
            return <g key={i} className={pastCls}><path className="glow" d={d} /><path className="sheath" d={d} /><path className="core" d={d} /></g>;
          })}
          {plug && (() => {
            const d = cable(geo.batt, { x: plug.x, y: plug.y + 20 }, 40 + Math.max(0, 60 - Math.abs(geo.batt.y - plug.y) * 0.2));
            return <g className={phase === "flowing" ? "live" : ""}><path className={phase === "flowing" ? "glow" : ""} d={phase === "flowing" ? d : ""} /><path className="sheath" d={d} /><path className="core" d={d} /></g>;
          })()}
        </svg>
      )}
      {plug && (
        <div className={`plug ${phase === "ready" && !drag.current ? "hint" : ""}`} style={{ left: plug.x, top: plug.y }} role="button" tabIndex={0}
          aria-label={`Brancher la batterie sur la capsule de ${r.member}`}
          onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); autoPlug(true); } }}>
          {PLUG_SVG}
        </div>
      )}
      {flight && (
        <motion.div className="kw-flight" aria-hidden="true"
          initial={{ x: flight.from.x - 70, y: flight.from.y - 26, scale: 0.5, opacity: 0 }}
          animate={{ x: [flight.from.x - 70, flight.from.x - 70, flight.from.x - 70, flight.to.x - 70], y: [flight.from.y - 6, flight.from.y - 36, flight.from.y - 40, flight.to.y - 26], scale: [0.5, 1.1, 1, 0.3], opacity: [0, 1, 1, 0.2] }}
          transition={{ duration: 1.7, times: [0, 0.2, 0.55, 1], ease: [0.5, 0, 0.2, 1] }}
          onAnimationComplete={() => { setFlight(null); releaseEnergy(); sfx("relay"); }}
          style={{ width: 140, textAlign: "center" }}>
          +{energy}<small>kW</small>
        </motion.div>
      )}
    </div>
  );
}
