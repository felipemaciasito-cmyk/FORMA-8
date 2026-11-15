import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { crewLines, room as getRoom } from "../content";
import { fx, LEVELS, onFx, REWARD, type FxEvent } from "../lib/game";
import { getEnergyBar, holdEnergy, landEnergy } from "../lib/energy";
import { useReduceMotion } from "../lib/motion";
import { go } from "../lib/router";
import { key, LEVELUP_HIT, LEVELUP_LOCKS, sfx, WAKE_BEATS, WAKE_HIT, WAKE_SYSTEMS } from "../lib/sound";
import { arcs, centerOf, sparks, strike, type Pt } from "./Bolts";
import { ChargedCapsule } from "./Crew";
import { Icon } from "./Icon";

// Couche des récompenses de FORMA-8, posée au-dessus de l'appli (refonte « son et lumière » du 15/11/2026) :
// - chaque kW gagné part en éclair de l'endroit touché. Pendant un protocole, l'éclair charge une cellule de la
//   batterie (en bas de l'écran) ; ailleurs (maintenance, atelier, livraisons), il file vers le compteur du haut ;
// - une montée de grade ouvre la cérémonie « Accréditation validée » ;
// - un caisson terminé joue la scène de réveil « Défibrillateur » de son membre.
// Les cérémonies passent l'une après l'autre (file d'attente) et se ferment d'un toucher.
// Couleurs : blanc et cyan pour l'énergie ; la teinte du membre reste sur sa capsule.

type Ceremony = Extract<FxEvent, { type: "levelup" } | { type: "awaken" }>;
interface Pop { id: number; amount: number; x: number; y: number }

export function RewardLayer() {
  const [pops, setPops] = useState<Pop[]>([]);
  const [queue, setQueue] = useState<Ceremony[]>([]);
  const last = useRef({ x: window.innerWidth / 2, y: window.innerHeight * 0.6 });
  const held = useRef<Ceremony[]>([]);
  // Écran où un grade a été mis en attente : la cérémonie se joue dès que le joueur le quitte.
  const heldAt = useRef("");
  const release = () => {
    const h = held.current; held.current = [];
    if (h.length) setQueue((q) => [...q.filter((x, i) => i === 0 || x.type !== "levelup"), ...h]);
  };

  useEffect(() => {
    const down = (e: PointerEvent) => { last.current = { x: e.clientX, y: e.clientY }; };
    window.addEventListener("pointerdown", down, true);
    return () => window.removeEventListener("pointerdown", down, true);
  }, []);

  useEffect(() => onFx((e) => {
    const pop = (p: Pt, amount: number) => { const id = Date.now() + Math.random(); setPops((l) => [...l.slice(-5), { id, amount, x: p.x, y: p.y }]); };
    if (e.type === "gain" && e.amount > 0) {
      const from = { x: e.x ?? last.current.x, y: e.y ?? last.current.y };
      const bar = getEnergyBar();
      if (bar.max > 0) {
        // Pendant un protocole : l'éclair charge la prochaine cellule de la batterie ; le compteur attend le branchement.
        holdEnergy(e.amount);
        if (e.quiet) { landEnergy(e.amount, false); return; }
        const to = centerOf(document.querySelector(`.battery [data-cell="${bar.lit}"]`), { x: window.innerWidth / 2, y: window.innerHeight - 90 });
        strike(from, to, () => { landEnergy(e.amount); sfx("cell"); pop({ x: to.x, y: to.y - 18 }, e.amount); });
      } else {
        const to = centerOf(document.querySelector(".hud-stat.kw"), { x: window.innerWidth - 70, y: 30 });
        strike(from, to, () => pop({ x: to.x, y: to.y + 30 }, e.amount));
      }
    }
    // Une montée de grade pendant un protocole, une panne ou une maintenance attend que le joueur quitte cet écran
    // (choix du propriétaire, 15/11/2026 : « quand je quitte un protocole », par « Retour » ou « Protocole
    // suivant »). Plusieurs grades d'un coup : une seule cérémonie, pour le plus récent.
    if (e.type === "levelup") {
      if (busyRoute()) { held.current = [...held.current.filter((x) => x.type !== "levelup"), e]; heldAt.current = window.location.hash; }
      else setQueue((q) => [...q.filter((x, i) => i === 0 || x.type !== "levelup"), e]);
    }
    // Le réveil se joue tout de suite (c'est le moment fort) ; un grade retenu attend toujours la sortie de l'écran.
    if (e.type === "awaken") setQueue((q) => [e, ...q]);
  }), []);

  useEffect(() => {
    const onHash = () => { if (held.current.length && window.location.hash !== heldAt.current) release(); };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const current = queue[0];
  const close = () => setQueue((q) => q.slice(1));

  return (
    <>
      <div aria-hidden="true" style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 116 }}>
        {pops.map((p) => <KwPop key={p.id} p={p} onDone={() => setPops((l) => l.filter((x) => x.id !== p.id))} />)}
      </div>
      <AnimatePresence mode="wait">
        {current?.type === "levelup" && <LevelUp key={`lv-${current.index}`} e={current} onClose={close} />}
        {current?.type === "awaken" && <Awakening key={`aw-${current.roomId}`} e={current} onClose={close} />}
      </AnimatePresence>
    </>
  );
}

/** « +10 kW » qui s'élève de l'endroit frappé par l'éclair. */
function KwPop({ p, onDone }: { p: Pop; onDone: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: 4, scale: 0.6 }} animate={{ opacity: [0, 1, 1, 0], y: [4, -14, -22, -30], scale: [0.6, 1.1, 1, 0.9] }}
      transition={{ duration: 1, times: [0, 0.25, 0.7, 1], ease: "easeOut" }} onAnimationComplete={onDone}
      style={{ position: "absolute", left: p.x - 30, top: p.y - 12, width: 60, textAlign: "center", whiteSpace: "nowrap", font: "700 15px var(--mono)", color: "#fff", textShadow: "0 0 10px rgba(59,232,255,.95)" }}>
      +{p.amount}<span style={{ fontSize: 10, marginLeft: 2, color: "var(--cyan)" }}>kW</span>
    </motion.div>
  );
}

// ======================= Langage visuel des cérémonies =======================
/** Onde de choc : un anneau qui s'élargit et s'éteint, centré sur son parent. */
export function Shockwave({ color, delay = 0, size = 240 }: { color: string; delay?: number; size?: number }) {
  return (
    <motion.span aria-hidden="true" initial={{ scale: 0.15, opacity: 0 }} animate={{ scale: [0.15, 1.5], opacity: [0.95, 0] }} transition={{ duration: 0.95, delay, ease: "easeOut" }}
      style={{ position: "absolute", left: "50%", top: "50%", width: size, height: size, marginLeft: -size / 2, marginTop: -size / 2, borderRadius: "50%",
        border: `3px solid ${color}`, boxShadow: `0 0 24px ${color}, inset 0 0 24px ${color}`, pointerEvents: "none" }} />
  );
}

/** Éclats lumineux qui partent du centre de leur parent. */
export function Sparks({ color, count = 18, radius = 120, delay = 0 }: { color: string; count?: number; radius?: number; delay?: number }) {
  const parts = useRef(Array.from({ length: count }, (_, i) => {
    const a = (i / count) * Math.PI * 2 + Math.random() * 0.4;
    const r = radius * (0.55 + Math.random() * 0.6);
    return { x: Math.cos(a) * r, y: Math.sin(a) * r, s: 3 + Math.random() * 4, d: 0.7 + Math.random() * 0.5 };
  })).current;
  return (
    <span aria-hidden="true" style={{ position: "absolute", left: "50%", top: "50%", width: 0, height: 0, pointerEvents: "none" }}>
      {parts.map((p, i) => (
        <motion.span key={i} initial={{ x: 0, y: 0, opacity: 0, scale: 1 }} animate={{ x: p.x, y: p.y, opacity: [0, 1, 0], scale: [1, 1, 0.3] }}
          transition={{ duration: p.d, delay: delay + (i % 4) * 0.02, ease: [0.1, 0.8, 0.3, 1] }}
          style={{ position: "absolute", left: -p.s / 2, top: -p.s / 2, width: p.s, height: p.s, borderRadius: i % 3 ? "50%" : 2, background: i % 4 ? color : "#ffffff", boxShadow: `0 0 ${p.s * 2}px ${color}` }} />
      ))}
    </span>
  );
}

/** Rayons de lumière qui tournent lentement derrière le héros d'une cérémonie. */
export function Rays({ color, size = 420, opacity = 0.5 }: { color: string; size?: number; opacity?: number }) {
  return (
    <motion.span aria-hidden="true" initial={{ opacity: 0, rotate: 0 }} animate={{ opacity, rotate: 360 }} transition={{ opacity: { duration: 0.8 }, rotate: { duration: 26, repeat: Infinity, ease: "linear" } }}
      style={{ position: "absolute", left: "50%", top: "50%", width: size, height: size, marginLeft: -size / 2, marginTop: -size / 2, borderRadius: "50%", pointerEvents: "none",
        background: `repeating-conic-gradient(from 0deg, ${color} 0deg 7deg, transparent 7deg 20deg)`,
        maskImage: "radial-gradient(circle, #000 18%, transparent 68%)", WebkitMaskImage: "radial-gradient(circle, #000 18%, transparent 68%)" }} />
  );
}

/** Flash blanc plein écran. */
function Flash({ peak = 0.85, duration = 0.8 }: { peak?: number; duration?: number }) {
  return <motion.div aria-hidden="true" initial={{ opacity: peak }} animate={{ opacity: 0 }} transition={{ duration }} style={{ position: "fixed", inset: 0, background: "#fff", pointerEvents: "none", zIndex: 5 }} />;
}

/** Une leçon (protocole), une panne ou une maintenance est en cours : on n'interrompt pas. */
function busyRoute() {
  return /^#\/(caisson\/[^/]+\/[^/]+|panne\/[^/]+|maintenance)$/.test(window.location.hash);
}

// ======================= Montée de grade : « Accréditation validée » =======================
// Un faisceau te scanne de gauche à droite, quatre verrous lourds s'ouvrent l'un après l'autre, puis la puissance
// s'installe et le nouveau grade apparaît (synchronisé sur le son « levelup »).
function LevelUp({ e, onClose }: { e: Extract<FxEvent, { type: "levelup" }>; onClose: () => void }) {
  const reduce = useReduceMotion();
  const [locks, setLocks] = useState(reduce ? 4 : 0);
  const [granted, setGranted] = useState(reduce);
  useEffect(() => {
    sfx("levelup");
    if (reduce) return;
    const t = [...LEVELUP_LOCKS.map((d, i) => window.setTimeout(() => setLocks(i + 1), d * 1000)), window.setTimeout(() => setGranted(true), LEVELUP_HIT * 1000)];
    return () => t.forEach((x) => window.clearTimeout(x));
  }, [reduce]);
  return (
    <motion.div role="dialog" aria-modal="true" aria-label={`Nouvelle accréditation : ${e.title}`} onClick={() => { if (!granted) { setLocks(4); setGranted(true); } }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: "fixed", inset: 0, zIndex: 110, display: "flex", flexDirection: "column", alignItems: "center", overflowY: "auto", padding: "calc(var(--safe-top) + 24px) 24px calc(var(--safe-bottom) + 24px)", background: `radial-gradient(circle at 50% 40%, rgba(59,232,255,${granted ? 0.2 : 0.07}), transparent 62%), #04060c`, backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", transition: "background .6s" }}>
      {granted && !reduce && <Flash peak={0.6} duration={0.7} />}
      <div style={{ textAlign: "center", maxWidth: 340, margin: "auto 0", position: "relative", zIndex: 3 }} onClick={(x) => x.stopPropagation()}>
        <div className="mono" style={{ fontSize: 11, letterSpacing: ".18em", color: granted ? "#fff" : "var(--text-3)" }}>{granted ? "ACCRÉDITATION VALIDÉE" : "CONTRÔLE D'ACCRÉDITATION"}</div>
        <div style={{ position: "relative", width: 220, height: 220, margin: "10px auto 0" }}>
          {/* le faisceau qui scanne */}
          {!granted && !reduce && (
            <motion.span aria-hidden="true" initial={{ left: "0%", opacity: 0 }} animate={{ left: ["0%", "100%"], opacity: [0, 1, 1, 0] }} transition={{ duration: 0.9, ease: "linear" }}
              style={{ position: "absolute", top: -6, bottom: -6, width: 3, marginLeft: -1.5, background: "#fff", boxShadow: "0 0 14px #fff, 0 0 30px var(--cyan)", zIndex: 2 }} />
          )}
          {granted && <><Shockwave color="#ffffff" size={220} /><Shockwave color="var(--cyan)" delay={0.18} size={300} /><Sparks color="var(--cyan)" count={24} radius={160} /></>}
          <svg width="220" height="220" viewBox="0 0 200 200" style={{ position: "relative" }} aria-hidden="true">
            {LEVELS.map((_l, i) => {
              const a0 = (i / LEVELS.length) * Math.PI * 2 - Math.PI / 2 + 0.05, a1 = ((i + 1) / LEVELS.length) * Math.PI * 2 - Math.PI / 2 - 0.05;
              const R = 86, on = i < e.index;
              return (
                <motion.path key={i} d={`M${100 + R * Math.cos(a0)} ${100 + R * Math.sin(a0)} A${R} ${R} 0 0 1 ${100 + R * Math.cos(a1)} ${100 + R * Math.sin(a1)}`}
                  fill="none" stroke={on && (granted || i < e.index - 1) ? "#f4feff" : "#1c2a44"} strokeWidth="10" strokeLinecap="round"
                  initial={{ pathLength: i === e.index - 1 ? 0 : 1 }} animate={{ pathLength: i === e.index - 1 && !granted ? 0 : 1 }} transition={{ duration: 0.6 }}
                  style={on ? { filter: "drop-shadow(0 0 6px rgba(59,232,255,.9))" } : undefined} />
              );
            })}
            <circle cx="100" cy="100" r="64" fill="#0b1424" stroke={granted ? "rgba(244,254,255,.8)" : "rgba(59,232,255,.35)"} />
            {granted && (
              <motion.text x="100" y="118" textAnchor="middle" fill="#ffffff" style={{ font: "700 52px var(--mono)" }}
                initial={{ opacity: 0, scale: 0.4 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: "spring", stiffness: 260, damping: 14 }}>{e.index}</motion.text>
            )}
          </svg>
        </div>
        {/* les quatre verrous */}
        <div aria-hidden="true" style={{ display: "flex", gap: 10, justifyContent: "center", margin: "6px 0 4px" }}>
          {LEVELUP_LOCKS.map((_, i) => (
            <motion.span key={i} animate={{ scale: locks > i ? [1.25, 1] : 1 }} transition={{ duration: 0.25 }}
              style={{ width: 34, height: 34, borderRadius: 10, display: "grid", placeItems: "center", border: `1.5px solid ${locks > i ? "#f4feff" : "#2a3858"}`, color: locks > i ? "#fff" : "var(--text-3)",
                background: locks > i ? "rgba(59,232,255,.16)" : "#070c17", boxShadow: locks > i ? "0 0 14px rgba(59,232,255,.6)" : "none" }}>
              <Icon name="lock" size={16} />
            </motion.span>
          ))}
        </div>
        <motion.div initial={false} animate={{ opacity: granted ? 1 : 0, y: granted ? 0 : 10 }} transition={{ delay: granted ? 0.3 : 0 }}>
          <div className="kicker" style={{ color: "var(--cyan)", marginTop: 10 }}>Nouvelle accréditation</div>
          <div style={{ fontSize: 34, fontWeight: 700, lineHeight: 1.1, margin: "4px 0 10px" }}>{e.title}</div>
          <div className="muted">{e.next ? `Prochain grade : ${e.next.title}, à ${e.next.at} kW.` : "Tu as atteint le plus haut grade de la réserve."}</div>
        </motion.div>
        <button className="btn block" style={{ marginTop: 22 }} onClick={() => { sfx("tap"); onClose(); }}>Continuer</button>
      </div>
    </motion.div>
  );
}

// ======================= Réveil d'un membre : « Défibrillateur » =======================
// Synchronisé sur le son « awaken » : la charge siffle et monte (arcs autour de la capsule), un silence, la décharge
// (flash, la vitre se lève, les yeux s'allument), puis le cœur électrique du membre repart (deux doubles battements)
// et ses systèmes démarrent. Enfin, sa réplique s'écrit et la récompense apparaît. Un toucher passe à la fin.
// Phases : 0 endormi, 1 charge, 2 silence, 3 décharge et battements, 4 réplique, 5 récompense.
const START = 0.5; // la charge commence 0,5 s après l'ouverture

function Awakening({ e, onClose }: { e: Extract<FxEvent, { type: "awaken" }>; onClose: () => void }) {
  const r = getRoom(e.roomId);
  const reduce = useReduceMotion();
  const [phase, setPhase] = useState(reduce ? 5 : 0);
  const [beat, setBeat] = useState(0);
  const [typed, setTyped] = useState(0);
  const capRef = useRef<HTMLDivElement>(null);
  const line = crewLines(e.roomId)?.reveil ?? "";

  useEffect(() => {
    if (reduce) { sfx("power"); return; }
    const T = (s: number, f: () => void) => window.setTimeout(f, s * 1000);
    const t = [
      T(START, () => { setPhase(1); sfx("awaken"); arcs(centerOf(capRef.current), 70, 1600, 3); }),
      T(START + 1.72, () => setPhase(2)),
      T(START + WAKE_HIT, () => { setPhase(3); sparks(centerOf(capRef.current), 28); fx({ type: "burst", color: "#3be8ff" }); }),
      ...WAKE_BEATS.map((d, i) => T(START + WAKE_HIT + d, () => setBeat(i + 1))),
      T(START + WAKE_HIT + WAKE_SYSTEMS, () => setPhase(4)),
    ];
    return () => t.forEach((x) => window.clearTimeout(x));
  }, [reduce]);

  useEffect(() => {
    if (phase !== 4) return;
    if (typed >= line.length) { const t = window.setTimeout(() => setPhase(5), 400); return () => window.clearTimeout(t); }
    const t = window.setTimeout(() => { setTyped((n) => Math.min(line.length, n + 2)); if (typed % 6 === 0) key("char"); }, 26);
    return () => window.clearTimeout(t);
  }, [phase, typed, line]);

  if (!r) return null;
  const hue = r.hue;
  const skip = () => { if (phase < 5) { setPhase(5); setTyped(line.length); setBeat(4); } };
  const shown = phase >= 5 ? line : line.slice(0, typed);
  const awake = phase >= 3;

  return (
    <motion.div role="dialog" aria-modal="true" aria-label={`Réveil : ${r.member}`} onClick={skip}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}
      style={{ position: "fixed", inset: 0, zIndex: 111, overflowY: "auto", background: `radial-gradient(circle at 50% 34%, rgba(59,232,255,${awake ? 0.22 : phase === 1 ? 0.1 : 0.04}), transparent 64%), #04060c`, transition: "background .8s" }}>
      {phase === 3 && beat === 0 && <Flash peak={0.9} duration={0.9} />}
      <AnimatePresence>{phase === 2 && <motion.div key="dim" aria-hidden="true" initial={{ opacity: 0 }} animate={{ opacity: 0.55 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} style={{ position: "fixed", inset: 0, background: "#000", pointerEvents: "none" }} />}</AnimatePresence>
      <div style={{ minHeight: "100%", display: "flex", flexDirection: "column", alignItems: "center", padding: "calc(var(--safe-top) + 18px) 20px calc(var(--safe-bottom) + 18px)", textAlign: "center", position: "relative", zIndex: 3 }}>
        {/* Centrage vertical sans jamais couper le haut : ces espaceurs disparaissent quand la scène dépasse l'écran. */}
        <div aria-hidden="true" style={{ flex: "1 0 0" }} />
        <div className="mono" style={{ fontSize: 11, letterSpacing: ".16em", color: awake ? "#fff" : "var(--cyan)" }}>{r.code} · {phase === 1 ? "CHARGE EN COURS" : phase === 2 ? "CHARGÉ" : "SÉQUENCE DE RÉVEIL"}</div>
        {/* jauge de charge du défibrillateur */}
        <div style={{ width: 240, margin: "8px 0 0" }}>
          <div style={{ height: 5, borderRadius: 3, background: "rgba(255,255,255,.07)", overflow: "hidden" }}>
            <motion.i initial={{ width: "0%" }} animate={{ width: phase >= 1 ? "100%" : "0%" }} transition={{ duration: phase === 1 ? 1.7 : 0.2, ease: "easeIn" }}
              style={{ display: "block", height: "100%", background: "#f4feff", boxShadow: "0 0 10px var(--cyan)" }} />
          </div>
        </div>
        <motion.div ref={capRef} animate={phase === 1 ? { x: [0, -1.5, 1.5, -1, 1, 0] } : { x: 0 }} transition={{ duration: 0.3, repeat: phase === 1 ? 5 : 0 }} style={{ margin: "14px 0 4px", position: "relative" }}>
          {awake && <Rays color="rgba(190,245,255,.18)" size={460} opacity={0.7} />}
          {phase === 3 && beat === 0 && <><Shockwave key="sw1" color="#ffffff" size={240} /><Shockwave key="sw2" color="var(--cyan)" delay={0.18} size={320} /></>}
          {beat > 0 && beat <= 4 && <Shockwave key={`b${beat}`} color={beat % 2 ? "#ffffff" : "var(--cyan)"} size={beat > 2 ? 280 : 220} />}
          <motion.div key={`beat-${beat}`} animate={{ scale: beat > 0 ? [1.09, 1] : phase === 1 ? 1.02 : 1 }} transition={{ duration: 0.28 }}>
            <ChargedCapsule id={r.id} state={awake ? "awake" : "asleep"} lux={awake ? 1 : phase === 1 ? 0.95 : phase === 2 ? 0.35 : 0.6} size={156} mood={phase >= 4 ? "happy" : "neutral"} />
          </motion.div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: phase >= 4 ? 1 : 0, y: phase >= 4 ? 0 : 10 }} transition={{ duration: 0.5 }}>
          <div style={{ fontSize: 30, fontWeight: 700, lineHeight: 1.1 }}>{r.member}</div>
          <div className="kicker" style={{ color: "var(--cyan)", marginTop: 4 }}>{e.replay ? "Souvenir du réveil" : "Membre de l'équipe réveillé"}</div>
        </motion.div>
        <div style={{ minHeight: 96, maxWidth: 360, marginTop: 10 }}>
          {phase >= 4 && (
            <div style={{ textAlign: "left", padding: "12px 14px", borderRadius: "4px 16px 16px 16px", background: `linear-gradient(135deg, hsl(${hue} 90% 55% / .12), rgba(12,19,34,.6))`, border: `1px solid hsl(${hue} 90% 60% / .3)` }}>
              <div className="mono" style={{ fontSize: 10.5, letterSpacing: ".14em", color: `hsl(${hue} 100% 70%)`, marginBottom: 4 }}>{r.member.toUpperCase()}</div>
              <span>{shown}</span>{phase === 4 && <span className="caret" />}
            </div>
          )}
        </div>
        <AnimatePresence>
          {phase >= 5 && (
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} style={{ width: "100%", maxWidth: 360, marginTop: 10 }}>
              {!e.replay && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
                  {r.incident
                    ? <div className="panel" style={{ margin: 0, padding: 10 }}><div className="mono" style={{ color: "#fff", fontSize: 20 }}>+{REWARD.incident}</div><div className="small muted">kW pour la panne réparée</div></div>
                    : <div className="panel" style={{ margin: 0, padding: 10 }}><div className="mono" style={{ color: "#fff", fontSize: 20 }}>{r.steps.length}</div><div className="small muted">câbles branchés</div></div>}
                  <div className="panel" style={{ margin: 0, padding: 10 }}><div className="mono" style={{ color: "var(--cyan)", fontSize: 20 }}>{r.version}</div><div className="small muted">version de ton produit à livrer</div></div>
                </div>
              )}
              <button className="btn block" onClick={(x) => { x.stopPropagation(); sfx("tap"); onClose(); }}>{e.replay ? "Fermer" : "Accueillir dans l'équipe"}</button>
              {!e.replay && <button className="btn ghost block" style={{ marginTop: 8 }} onClick={(x) => { x.stopPropagation(); onClose(); go("equipe"); }}><Icon name="team" size={18} /> Voir ton équipe</button>}
            </motion.div>
          )}
        </AnimatePresence>
        {phase < 5 && <div className="small dim" style={{ marginTop: 16 }}>Touche l'écran pour passer</div>}
        <div aria-hidden="true" style={{ flex: "1 0 0" }} />
      </div>
    </motion.div>
  );
}
