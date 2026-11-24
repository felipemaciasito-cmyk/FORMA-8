import { motion } from "motion/react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import type { Room } from "../content/types";
import { releaseEnergy } from "../lib/energy";
import { sfx } from "../lib/sound";
import { centerOf, type Pt } from "./Bolts";
import { Centrale, type CentraleHandle, type FireState } from "./Centrale";
import { ChargedCapsule } from "./Crew";
import { BulleSeule } from "./Bulle";
import type { Speaker } from "../lib/voice";

// Fin d'un protocole (troisième version, choisie par le propriétaire le 15/11/2026 : la « centrale ») :
// la jauge que le joueur a chargée pendant le protocole a un vrai câble, qui sort de sa borne « + ». Il tire la fiche et
// la branche dans la prise libre de la centrale du caisson (un anneau posé sous la capsule du membre). La batterie se
// vide dans la centrale, qui réagit un peu plus fort à chaque prise, et les kW rejoignent le compteur du haut.
// Quand toutes les prises sont branchées et que la panne est réparée, le joueur maintient son doigt sur la centrale :
// l'arc part vers la capsule et réveille le membre. Avant, la tentative échoue (prise libre ou panne).
// Geste : faire glisser la fiche jusqu'à la prise. Un simple toucher la branche aussi (accessibilité).

type Phase = "ready" | "drag" | "seat" | "flow" | "done";

/** Câble souple : une corde simulée (points reliés), qui pend, se balance et suit la fiche. */
class Rope {
  n: number; seg: number; p: Pt[]; q: Pt[];
  constructor(a: Pt, b: Pt, n: number, len: number) {
    this.n = n; this.seg = len / n; this.p = []; this.q = [];
    for (let i = 0; i <= n; i++) { const pt = { x: a.x + (b.x - a.x) * (i / n), y: a.y + (b.y - a.y) * (i / n) + Math.sin(Math.PI * i / n) * 16 }; this.p.push(pt); this.q.push({ ...pt }); }
  }
  step(a: Pt, b: Pt, floor: number) {
    const { p, q, n } = this;
    for (let i = 1; i < n; i++) { const vx = (p[i].x - q[i].x) * 0.97, vy = (p[i].y - q[i].y) * 0.97; q[i].x = p[i].x; q[i].y = p[i].y; p[i].x += vx; p[i].y += vy + 0.45; }
    for (let it = 0; it < 14; it++) {
      p[0].x = a.x; p[0].y = a.y; p[n].x = b.x; p[n].y = b.y;
      for (let i = 0; i < n; i++) {
        const u = p[i], v = p[i + 1], dx = v.x - u.x, dy = v.y - u.y, d = Math.hypot(dx, dy) || 1, k = ((d - this.seg) / d) * 0.5;
        if (i > 0) { u.x += dx * k; u.y += dy * k; }
        if (i + 1 < n) { v.x -= dx * k; v.y -= dy * k; }
      }
      for (let i = 1; i < n; i++) if (p[i].y > floor) p[i].y = floor;
    }
  }
  d() {
    const p = this.p; let s = `M${p[0].x.toFixed(1)} ${p[0].y.toFixed(1)}`;
    for (let i = 1; i < p.length - 1; i++) { const mx = (p[i].x + p[i + 1].x) / 2, my = (p[i].y + p[i + 1].y) / 2; s += ` Q${p[i].x.toFixed(1)} ${p[i].y.toFixed(1)} ${mx.toFixed(1)} ${my.toFixed(1)}`; }
    const l = p[p.length - 1]; return `${s} L${l.x.toFixed(1)} ${l.y.toFixed(1)}`;
  }
}

/** La fiche du câble (broches vers le haut avant rotation). */
function PlugSvg({ live }: { live?: boolean }) {
  return (
    <svg width="30" height="40" viewBox="-15 -22 30 40" aria-hidden="true">
      <rect x="-8.5" y="-21" width="3.4" height="10" rx="1.2" fill="#c9d6ea" /><rect x="5" y="-21" width="3.4" height="10" rx="1.2" fill="#c9d6ea" />
      <rect x="-13" y="-12" width="26" height="20" rx="6" fill="#1a2336" stroke="#f4feff" strokeWidth="1.5" />
      <rect x="-7" y="-4" width="14" height="3" rx="1.5" fill={live ? "#f4feff" : "#3be8ff"} />
      <path d="M-5 8 h10 v6 a5 5 0 0 1 -10 0 Z" fill="#141c2c" stroke="#3a4766" />
    </svg>
  );
}

/** Taille de référence du dessin de la capsule : elle est ensuite mise à l'échelle de l'écran (voir PlugScene). */
const CAP_BASE = 240;

/** La capsule du membre dans son cadre de visée, son électrode de réception, la centrale, puis la télémétrie. */
function Reactor({ room: r, plugged, free, fire, ctl, onFail, onFire, recvRef, lux, size, telemetry = true }: {
  room: Room; plugged: number; free: number; fire: FireState; ctl: React.RefObject<CentraleHandle | null>;
  onFail: (why: Exclude<FireState, "ok">) => void; onFire: () => void; recvRef: React.RefObject<HTMLSpanElement | null>; lux: number;
  /** Taille de la capsule et largeur de la centrale (px), calculées pour que tout tienne à l'écran. */
  size?: { cap: number; ctl: number; anim: boolean };
  /** Le nom du membre sous la capsule et la ligne de télémétrie (prises, charge, circuit) sous la centrale. Une fois la
   *  batterie branchée, ils laissent leur place à la capsule (la bulle du membre porte déjà son nom). */
  telemetry?: boolean;
}) {
  const total = r.steps.length;
  const [attempt, setAttempt] = useState(0);
  const [fired, setFired] = useState(false);
  const circuit = fired ? "ARC ENVOYÉ" : fire === "ok" ? "PRÊT" : fire === "fault" ? "COUPÉ · PANNE" : "INCOMPLET";
  const cap = size?.cap ?? 140;
  return (
    <div className={`reactor ${size?.anim ? "anim" : ""}`}>
      <div className="cap-frame">
        <div className="cap-zoom" style={{ width: cap, height: cap * 1.2 }}>
          <div style={{ width: CAP_BASE, height: CAP_BASE * 1.2, transform: `scale(${(cap / CAP_BASE).toFixed(4)})` }}>
            <ChargedCapsule id={r.id} state="asleep" lux={fired ? 1 : lux} size={CAP_BASE} />
          </div>
        </div>
        {telemetry && <div className="cap-tag"><span className={`dot ${fired ? "on" : ""}`} />{r.member.toUpperCase()} · {fired ? "ARC REÇU" : "EN VEILLE"}</div>}
      </div>
      <span className="recv" ref={recvRef} aria-hidden="true" />
      <div className="ctl-zoom" style={size ? { width: size.ctl } : undefined}>
        <Centrale ref={ctl} total={total} plugged={plugged} free={free} fire={fire} memberName={r.member}
          target={() => centerOf(recvRef.current)} onFail={onFail} onCharge={setAttempt} onFire={() => { setFired(true); onFire(); }} />
      </div>
      {telemetry && <div className="telemetry" aria-hidden="true">
        <span>PRISES <b>{plugged}/{total}</b></span>
        <span>{attempt > 0 ? "ARC" : "CHARGE"} <b>{Math.round((attempt > 0 ? attempt : plugged / total) * 100)} %</b></span>
        <span className={fire === "ok" || fired ? "ok" : fire === "fault" ? "bad" : ""}>CIRCUIT <b>{circuit}</b></span>
      </div>}
    </div>
  );
}

const failText = (why: Exclude<FireState, "ok">, left: number) => why === "fault"
  ? "Connexion impossible : la panne coupe le circuit. Répare-la d'abord."
  : `Connexion impossible : encore ${left} prise${left > 1 ? "s" : ""} à brancher.`;

/**
 * Fin d'un protocole, écran fixe (demande du propriétaire, 24/11/2026) : tout tient dans l'écran, sans défilement.
 * De haut en bas : le titre court, la zone de parole (consigne, puis bulle du membre), la capsule et sa centrale (elles
 * prennent toute la place qui reste, la capsule en premier), puis la batterie ; une fois branchée, les modules gagnés
 * et les boutons prennent sa place, et la centrale se fait plus petite pour leur laisser de la place.
 */
export function PlugScene({ room: r, index, cells, energy, incidentOpen, onPlugged, onAwaken, speech, after }: {
  room: Room; index: number; cells: number; energy: number; incidentOpen: boolean;
  /** Appelé quand la batterie est branchée (last : c'était la dernière prise). */
  onPlugged: (last: boolean) => void;
  /** L'arc a frappé la capsule (toutes les prises branchées, sans panne) : le membre se réveille. */
  onAwaken: () => void;
  /** Réplique du membre, dite une fois la batterie branchée (dans la zone de parole, au-dessus de sa capsule). */
  speech?: { speaker: Speaker; md?: string };
  /** La suite (modules gagnés, boutons), affichée sous la centrale une fois la batterie branchée. */
  after?: ReactNode;
}) {
  const total = r.steps.length;
  const last = index === total - 1;
  const box = useRef<HTMLDivElement>(null);
  const ctl = useRef<CentraleHandle | null>(null);
  const termRef = useRef<HTMLSpanElement>(null);
  const recvRef = useRef<HTMLSpanElement>(null);
  const plugEl = useRef<HTMLDivElement>(null);
  const paths = useRef<(SVGPathElement | null)[]>([]);
  const [phase, setPhase] = useState<Phase>("ready");
  const [plugged, setPlugged] = useState(index);
  const [drained, setDrained] = useState(0);
  const [flight, setFlight] = useState<null | { from: Pt; to: Pt }>(null);
  const [msg, setMsg] = useState("");
  const geo = useRef<null | { seat: Pt; tail: (p: Pt) => Pt; term: Pt; home: Pt; angle: number; scale: number; floor: number; reach: number }>(null);
  const pos = useRef<Pt | null>(null);
  const rope = useRef<Rope | null>(null);
  const ropeLen = useRef(110);
  const phaseRef = useRef<Phase>("ready");
  phaseRef.current = phase;

  // Taille de la capsule et de la centrale : elles occupent toute la hauteur laissée libre par le reste de l'écran.
  // Avant le branchement, la centrale reste grande (on y glisse la fiche) ; ensuite, elle se fait plus petite pour
  // laisser la place aux modules et aux boutons, et la capsule garde la plus grande taille possible.
  const stage = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<{ cap: number; ctl: number; anim: boolean } | null>(null);
  const done = phase === "done";
  useLayoutEffect(() => {
    const el = stage.current; if (!el) return;
    const fit = () => {
      const h = el.clientHeight, w = el.clientWidth;
      const re = el.querySelector<HTMLElement>(".reactor"), cz = el.querySelector<HTMLElement>(".cap-zoom"), kz = el.querySelector<HTMLElement>(".ctl-zoom");
      // Ce qui n'est ni la capsule ni la centrale (nom, électrode, télémétrie) : mesuré, pour ne rien oublier.
      const fixed = re && cz && kz ? Math.max(8, re.offsetHeight - cz.offsetHeight - kz.offsetHeight) : 70;
      const room = Math.max(0, h - fixed - 8);
      const k = done ? 0.5 : 0.92; // largeur de la centrale par rapport à la capsule
      let cap = room / (1.2 + 1.1 * k), ctl = cap * k;
      const minCtl = done ? 70 : 150;
      if (ctl < minCtl) { ctl = Math.min(minCtl, room / 1.1 * 0.6); cap = (room - 1.1 * ctl) / 1.2; }
      cap = Math.max(72, Math.min(cap, 280, w / 1.5));
      ctl = Math.max(60, Math.min(ctl, 300, w - 8));
      setSize((s) => (s && Math.abs(s.cap - cap) < 1 && Math.abs(s.ctl - ctl) < 1 ? s : { cap, ctl, anim: !!s }));
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    // le nom et la télémétrie disparaissent au branchement : la place libérée revient à la capsule
    const re = el.querySelector(".reactor"); if (re) ro.observe(re);
    return () => ro.disconnect();
  }, [done]);

  // Géométrie (coordonnées dans la scène), mesurée à l'ouverture et quand l'écran change.
  const measure = useCallback(() => {
    const b = box.current?.getBoundingClientRect(), g = ctl.current?.geometry(), t = termRef.current?.getBoundingClientRect();
    if (!b || !g || !t) return;
    const a = (g.angles[index] * Math.PI) / 180, dx = Math.cos(a), dy = Math.sin(a);
    const sock = { x: g.sockets[index].x - b.left, y: g.sockets[index].y - b.top };
    const term = { x: t.left - b.left + t.width / 2, y: t.top - b.top + t.height / 2 };
    const k = g.scale;
    geo.current = {
      seat: { x: sock.x + dx * 12 * k, y: sock.y + dy * 12 * k },
      tail: (p) => ({ x: p.x + dx * 16 * k, y: p.y + dy * 16 * k }),
      term, home: { x: term.x - 72, y: term.y - 34 }, angle: g.angles[index] - 90, scale: k, floor: term.y + 26,
      // le câble est assez long pour la prise la plus éloignée (au dernier protocole, elle est en haut à gauche)
      reach: Math.max(330, Math.hypot(sock.x - term.x, sock.y - term.y) + 70),
    };
    if (!pos.current) pos.current = { ...geo.current.home };
    if (!rope.current) rope.current = new Rope(term, geo.current.tail(pos.current), 24, ropeLen.current);
  }, [index]);
  useLayoutEffect(() => { measure(); }, [measure, phase, msg]);
  // La scène a changé de taille (premier calcul, rotation de l'écran) : la fiche au repos revient près de sa batterie.
  useLayoutEffect(() => { if (phaseRef.current === "ready") pos.current = null; measure(); }, [measure, size]);
  useEffect(() => { const re = () => { geo.current = null; measure(); }; window.addEventListener("resize", re); return () => window.removeEventListener("resize", re); }, [measure]);

  // Le câble et la fiche suivent le doigt (dessinés hors de React, 60 fois par seconde, pendant la scène).
  useEffect(() => {
    let raf = 0;
    const loop = () => {
      const g = geo.current, p = pos.current, rp = rope.current;
      if (g && p && rp) {
        const tail = g.tail(p), want = Math.min(g.reach * 1.12, Math.max(110, Math.hypot(tail.x - g.term.x, tail.y - g.term.y) * 1.25));
        if (want > ropeLen.current) { ropeLen.current = want; rp.seg = want / rp.n; }
        rp.step(g.term, tail, g.floor);
        const d = rp.d(); paths.current.forEach((el) => el?.setAttribute("d", d));
        const el = plugEl.current;
        if (el) { el.style.transform = `translate(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px) rotate(${g.angle.toFixed(1)}deg) scale(${g.scale.toFixed(3)})`; el.style.visibility = "visible"; }
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const animateTo = (to: Pt, ms: number, then?: () => void) => {
    const from = { ...(pos.current ?? to) }, t0 = performance.now();
    const step = (t: number) => {
      const k = Math.min(1, (t - t0) / ms), e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      pos.current = { x: from.x + (to.x - from.x) * e, y: from.y + (to.y - from.y) * e };
      if (k < 1) requestAnimationFrame(step); else then?.();
    };
    requestAnimationFrame(step);
  };

  const connect = () => {
    setPhase("flow"); setMsg("");
    sfx("plug");
    ctl.current?.react(index);
    // La batterie se vide dans la centrale, cellule après cellule.
    for (let k = 1; k <= cells; k++) window.setTimeout(() => { setDrained(k); sfx("cell"); }, 260 + k * 240);
    window.setTimeout(() => {
      setPlugged(index + 1);
      const core = ctl.current?.geometry()?.core ?? centerOf(box.current);
      const hud = centerOf(document.querySelector(".hud-stat.kw"), { x: window.innerWidth - 70, y: 30 });
      if (energy > 0) setFlight({ from: { x: core.x, y: core.y - 20 }, to: hud });
      else releaseEnergy();
    }, 360 + cells * 240);
    window.setTimeout(() => { setPhase("done"); onPlugged(last); }, 1500 + cells * 240);
  };
  const autoPlug = (animated: boolean) => {
    const g = geo.current; if (phaseRef.current !== "ready" || !g) return;
    setPhase("seat");
    animateTo(g.seat, animated ? 520 : 120, connect);
  };

  const drag = useRef<null | { sx: number; sy: number; px: number; py: number; moved: boolean }>(null);
  const onDown = (e: React.PointerEvent) => {
    if (phaseRef.current !== "ready" || !pos.current) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    drag.current = { sx: e.clientX, sy: e.clientY, px: pos.current.x, py: pos.current.y, moved: false };
    setPhase("drag"); sfx("tap");
  };
  const onMove = (e: React.PointerEvent) => {
    const d = drag.current, g = geo.current; if (!d || !g) return;
    const dx = e.clientX - d.sx, dy = e.clientY - d.sy;
    if (Math.hypot(dx, dy) > 6) d.moved = true;
    // le câble a une longueur : la fiche ne va pas plus loin
    let p = { x: d.px + dx, y: d.py + dy }; const tx = p.x - g.term.x, ty = p.y - g.term.y, dist = Math.hypot(tx, ty), max = g.reach;
    if (dist > max) p = { x: g.term.x + (tx * max) / dist, y: g.term.y + (ty * max) / dist };
    pos.current = p;
  };
  const onUp = () => {
    const d = drag.current, g = geo.current, p = pos.current; drag.current = null; if (!d || !g || !p) return;
    phaseRef.current = "ready"; setPhase("ready");
    if (!d.moved || Math.hypot(p.x - g.seat.x, p.y - g.seat.y) < 48 * Math.max(0.8, g.scale)) autoPlug(!d.moved);
    else animateTo(g.home, 380);
  };

  // Tentative d'envoi de l'arc : selon les prises branchées et la panne.
  const fire: FireState = plugged < total ? "missing" : incidentOpen ? "fault" : "ok";
  const onFail = (why: Exclude<FireState, "ok">) => setMsg(failText(why, total - plugged));
  // Le message d'échec s'efface au bout de quelques secondes : la zone de parole revient au membre.
  useEffect(() => { if (!msg) return; const t = window.setTimeout(() => setMsg(""), 4500); return () => window.clearTimeout(t); }, [msg]);
  const live = phase === "flow" || phase === "done";

  const kicker = `Protocole ${String(index + 1).padStart(2, "0")} terminé · centrale ${plugged} / ${total}`;
  // Zone de parole. Avant le branchement : la consigne. Ensuite : la bulle du membre (plus de texte « la centrale monte
  // en puissance », retiré à la demande du propriétaire le 24/11/2026), un message d'échec, ou la consigne de l'arc.
  const voix = msg ? <div className="small plug-msg" role="status">{msg}</div>
    : !done ? (<>
      <div className="plug-titre">Branche ta batterie sur la centrale</div>
      <div className="small muted plug-consigne" role="status">Fais glisser la fiche de ta batterie jusqu'à la prise libre de la centrale, ou touche-la.</div>
    </>)
    : speech?.md ? <BulleSeule speaker={speech.speaker} md={speech.md} vers="bas" />
    : fire === "ok" ? <div className="small muted plug-consigne" role="status">Maintiens ton doigt sur la centrale pour envoyer l'arc à {r.member}.</div>
    : null;

  return (
    <div ref={box} className={`plug-scene plug-fixe hud-scene ${done ? "fini" : ""}`}>
      <div className="kicker" style={{ color: "#fff" }}>{kicker}</div>
      <div className="plug-voix">{voix}</div>
      <div ref={stage} className="plug-stage">
        <Reactor room={r} plugged={plugged} free={done ? -1 : index} fire={fire} ctl={ctl} recvRef={recvRef}
          lux={0.5 + 0.2 * (plugged / total)} onFail={onFail} onFire={onAwaken} size={size ?? undefined} telemetry={!done} />
      </div>
      {done ? <motion.div className="plug-suite" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}>{after}</motion.div>
        : <div className="plug-gauge panel">
        <div className="lbl"><span>BATTERIE DU PROTOCOLE {String(index + 1).padStart(2, "0")}</span><b>{Math.round(((cells - drained) / cells) * 100)} %</b></div>
        <div className={`battery xl ${drained === 0 ? "full" : ""}`} aria-hidden="true">
          {Array.from({ length: cells }, (_, i) => <i key={i} className={`${i === cells - 1 ? "final" : ""} ${i < cells - drained ? "on" : "drain"}`} />)}
          <span className="term" ref={termRef} />
        </div>
      </div>}
      {!done && <svg className="cables" aria-hidden="true">
        <g className={live ? "live" : ""}>
          {live && <path className="glow" ref={(el) => { paths.current[0] = el; }} />}
          <path className="sheath" ref={(el) => { paths.current[1] = el; }} />
          <path className="core" ref={(el) => { paths.current[2] = el; }} />
        </g>
      </svg>}
      {plugged === index && <div ref={plugEl} className={`plug ${phase === "ready" ? "hint" : ""}`} role="button" tabIndex={0}
        aria-label={`Brancher la batterie sur la centrale de ${r.member}`}
        onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); autoPlug(true); } }}>
        <div className="plug-in"><PlugSvg live={live} /></div>
      </div>}
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

/**
 * Après la panne réparée : toutes les prises de la centrale sont branchées. Le joueur maintient son doigt sur la
 * centrale pour envoyer l'arc vers la capsule (remplace l'ancien « Réarmer le disjoncteur »).
 */
export function ArcScene({ room: r, onAwaken }: { room: Room; onAwaken: () => void }) {
  const ctl = useRef<CentraleHandle | null>(null);
  const recvRef = useRef<HTMLSpanElement>(null);
  const [fired, setFired] = useState(false);
  return (
    <div className="plug-scene hud-scene" style={{ marginTop: 6 }}>
      <div className="small muted" role="status" style={{ minHeight: 40, maxWidth: 330 }}>
        {fired ? `${r.member} reçoit l'arc.` : `Le circuit est réparé. Maintiens ton doigt sur la centrale pour envoyer l'arc à ${r.member}.`}
      </div>
      <Reactor room={r} plugged={r.steps.length} free={-1} fire="ok" ctl={ctl} recvRef={recvRef} lux={0.7}
        onFail={() => {}} onFire={() => { setFired(true); onAwaken(); }} />
    </div>
  );
}
