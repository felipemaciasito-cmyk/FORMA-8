import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { crewLines, room as getRoom } from "../content";
import { fx, LEVELS, onFx, REWARD, type FxEvent } from "../lib/game";
import { useReduceMotion } from "../lib/motion";
import { go } from "../lib/router";
import { sfx } from "../lib/sound";
import { CrewCapsule } from "./Crew";
import { Icon } from "./Icon";

// Couche des récompenses de FORMA-8, posée au-dessus de l'appli (sans toucher à la couche visuelle de FORMA-7) :
// - les kW gagnés s'envolent depuis l'endroit touché vers le compteur d'énergie ;
// - une montée de grade ouvre une cérémonie plein écran ;
// - un caisson terminé joue la scène de réveil de son membre.
// Les cérémonies passent l'une après l'autre (file d'attente) et se ferment d'un toucher.

type Ceremony = Extract<FxEvent, { type: "levelup" } | { type: "awaken" }>;
interface Float { id: number; amount: number; x: number; y: number; tx: number; ty: number }

export function RewardLayer() {
  const [floats, setFloats] = useState<Float[]>([]);
  const [queue, setQueue] = useState<Ceremony[]>([]);
  const last = useRef({ x: window.innerWidth / 2, y: window.innerHeight * 0.6 });
  const reduce = useReduceMotion();

  useEffect(() => {
    const down = (e: PointerEvent) => { last.current = { x: e.clientX, y: e.clientY }; };
    window.addEventListener("pointerdown", down, true);
    return () => window.removeEventListener("pointerdown", down, true);
  }, []);

  useEffect(() => onFx((e) => {
    if (e.type === "gain" && e.amount > 0) {
      const target = document.querySelector(".hud-stat.kw")?.getBoundingClientRect();
      const id = Date.now() + Math.random();
      const f: Float = { id, amount: e.amount, x: e.x ?? last.current.x, y: e.y ?? last.current.y, tx: target ? target.left + target.width / 2 : window.innerWidth - 80, ty: target ? target.top + target.height / 2 : 30 };
      setFloats((l) => [...l.slice(-4), f]);
      window.setTimeout(() => setFloats((l) => l.filter((x) => x.id !== id)), 1500);
    }
    if (e.type === "levelup" || e.type === "awaken") {
      // Le réveil passe avant la montée de grade : c'est le moment fort.
      setQueue((q) => (e.type === "awaken" ? [e, ...q] : [...q, e]));
    }
  }), []);

  const current = queue[0];
  const close = () => setQueue((q) => q.slice(1));

  return (
    <>
      <div aria-hidden="true" style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 96 }}>
        <AnimatePresence>
          {floats.map((f) => (
            <motion.div key={f.id} initial={{ opacity: 0, x: f.x - 34, y: f.y - 20, scale: 0.6 }} exit={{ opacity: 0 }}
              animate={reduce ? { opacity: [0, 1, 0] } : { opacity: [0, 1, 1, 0], x: [f.x - 34, f.x - 34, f.tx - 34], y: [f.y - 20, f.y - 70, f.ty - 12], scale: [0.6, 1.15, 0.5] }}
              transition={{ duration: 1.3, times: [0, 0.35, 1], ease: "easeInOut" }}
              style={{ position: "absolute", left: 0, top: 0, width: 68, textAlign: "center", font: "700 17px var(--mono)", color: "var(--cyan)", textShadow: "0 0 12px rgba(59,232,255,.9)" }}>
              +{f.amount}<span style={{ fontSize: 11, marginLeft: 2 }}>kW</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      <AnimatePresence>
        {current?.type === "levelup" && <LevelUp key={`lv-${current.index}`} e={current} onClose={close} />}
        {current?.type === "awaken" && <Awakening key={`aw-${current.roomId}`} e={current} onClose={close} />}
      </AnimatePresence>
    </>
  );
}

// ======================= Montée de grade =======================
function LevelUp({ e, onClose }: { e: Extract<FxEvent, { type: "levelup" }>; onClose: () => void }) {
  return (
    <motion.div role="dialog" aria-modal="true" aria-label={`Nouvelle accréditation : ${e.title}`} onClick={onClose}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: "fixed", inset: 0, zIndex: 110, display: "grid", placeItems: "center", padding: 24, background: "radial-gradient(circle at 50% 42%, rgba(77,255,160,.18), rgba(4,6,12,.94) 62%)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)" }}>
      <div style={{ textAlign: "center", maxWidth: 340 }} onClick={(x) => x.stopPropagation()}>
        <div style={{ position: "relative", width: 200, height: 200, margin: "0 auto" }}>
          <motion.div aria-hidden="true" animate={{ rotate: 360 }} transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
            style={{ position: "absolute", inset: -40, borderRadius: "50%", background: "repeating-conic-gradient(from 0deg, rgba(77,255,160,.16) 0deg 8deg, transparent 8deg 22deg)", maskImage: "radial-gradient(circle, #000 30%, transparent 70%)", WebkitMaskImage: "radial-gradient(circle, #000 30%, transparent 70%)" }} />
          <svg width="200" height="200" viewBox="0 0 200 200" style={{ position: "relative" }} aria-hidden="true">
            {LEVELS.map((_l, i) => {
              const a0 = (i / LEVELS.length) * Math.PI * 2 - Math.PI / 2 + 0.05, a1 = ((i + 1) / LEVELS.length) * Math.PI * 2 - Math.PI / 2 - 0.05;
              const R = 86;
              const on = i < e.index;
              return (
                <motion.path key={i} d={`M${100 + R * Math.cos(a0)} ${100 + R * Math.sin(a0)} A${R} ${R} 0 0 1 ${100 + R * Math.cos(a1)} ${100 + R * Math.sin(a1)}`}
                  fill="none" stroke={on ? "var(--led)" : "#1c2a44"} strokeWidth="10" strokeLinecap="round"
                  initial={{ pathLength: i === e.index - 1 ? 0 : 1 }} animate={{ pathLength: 1 }} transition={{ delay: 0.5, duration: 0.8 }}
                  style={on ? { filter: "drop-shadow(0 0 6px rgba(77,255,160,.8))" } : undefined} />
              );
            })}
            <circle cx="100" cy="100" r="64" fill="#0b1424" stroke="rgba(77,255,160,.5)" />
            <motion.text x="100" y="118" textAnchor="middle" fill="#e7f0ff" style={{ font: "700 52px var(--mono)" }}
              initial={{ opacity: 0, scale: 0.4 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3, type: "spring", stiffness: 260, damping: 14 }}>{e.index}</motion.text>
          </svg>
        </div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
          <div className="kicker" style={{ color: "var(--led)", marginTop: 8 }}>Nouvelle accréditation</div>
          <div style={{ fontSize: 34, fontWeight: 700, lineHeight: 1.1, margin: "4px 0 10px" }}>{e.title}</div>
          <div className="muted">{e.next ? `Prochain grade : ${e.next.title}, à ${e.next.at} kW.` : "Tu as atteint le plus haut grade de la réserve."}</div>
          <button className="btn block led" style={{ marginTop: 22 }} onClick={() => { sfx("tap"); onClose(); }}>Continuer</button>
        </motion.div>
      </div>
    </motion.div>
  );
}

// ======================= Scène de réveil d'un membre =======================
// Phases : 0 endormi, 1 courant qui monte, 2 la vitre s'ouvre et les yeux s'allument, 3 la réplique s'écrit, 4 la récompense.
function Awakening({ e, onClose }: { e: Extract<FxEvent, { type: "awaken" }>; onClose: () => void }) {
  const r = getRoom(e.roomId);
  const reduce = useReduceMotion();
  const [phase, setPhase] = useState(reduce ? 4 : 0);
  const [typed, setTyped] = useState(0);
  const line = crewLines(e.roomId)?.reveil ?? "";

  useEffect(() => {
    if (reduce) return;
    const t = [
      window.setTimeout(() => { setPhase(1); sfx("power"); }, 500),
      window.setTimeout(() => { setPhase(2); sfx("levelup"); fx({ type: "burst", color: `hsl(${r?.hue ?? 190} 100% 62%)` }); }, 2000),
      window.setTimeout(() => setPhase(3), 3000),
    ];
    return () => t.forEach((x) => window.clearTimeout(x));
  }, [reduce, r?.hue]);

  useEffect(() => {
    if (phase !== 3) return;
    if (typed >= line.length) { const t = window.setTimeout(() => setPhase(4), 400); return () => window.clearTimeout(t); }
    const t = window.setTimeout(() => { setTyped((n) => Math.min(line.length, n + 2)); if (typed % 8 === 0) sfx("type"); }, 26);
    return () => window.clearTimeout(t);
  }, [phase, typed, line]);

  if (!r) return null;
  const hue = r.hue;
  const skip = () => { if (phase < 4) { setPhase(4); setTyped(line.length); } };
  const shown = phase >= 4 ? line : line.slice(0, typed);

  return (
    <motion.div role="dialog" aria-modal="true" aria-label={`Réveil : ${r.member}`} onClick={skip}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}
      style={{ position: "fixed", inset: 0, zIndex: 111, overflowY: "auto", background: `radial-gradient(circle at 50% 38%, hsl(${hue} 90% 45% / ${phase >= 2 ? 0.32 : 0.1}), rgba(4,6,12,.97) 64%)`, transition: "background 1s" }}>
      <div style={{ minHeight: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "calc(var(--safe-top) + 24px) 20px calc(var(--safe-bottom) + 24px)", textAlign: "center" }}>
        <div className="mono" style={{ fontSize: 11, letterSpacing: ".16em", color: `hsl(${hue} 100% 70%)` }}>{r.code} · SÉQUENCE DE RÉVEIL</div>
        <div style={{ width: 240, margin: "8px 0 0" }}>
          <div className="progress" style={{ height: 5 }}>
            <motion.i initial={{ width: "62%" }} animate={{ width: phase >= 1 ? "100%" : "62%" }} transition={{ duration: 1.3, ease: "easeInOut" }} style={{ background: `hsl(${hue} 100% 62%)`, boxShadow: `0 0 10px hsl(${hue} 100% 62%)` }} />
          </div>
        </div>
        <motion.div animate={phase === 1 ? { x: [0, -2, 2, -1, 1, 0] } : { x: 0 }} transition={{ duration: 0.4, repeat: phase === 1 ? 3 : 0 }} style={{ margin: "14px 0 4px" }}>
          <motion.div animate={{ scale: phase >= 2 ? 1.06 : 1 }} transition={{ type: "spring", stiffness: 140, damping: 12 }}>
            <CrewCapsule id={r.id} state={phase >= 2 ? "awake" : "asleep"} power={phase >= 1 ? 100 : 62} size={190} mood={phase >= 3 ? "happy" : "neutral"} />
          </motion.div>
        </motion.div>
        <AnimatePresence>
          {phase === 2 && <motion.div key="flash" aria-hidden="true" initial={{ opacity: 0.7 }} animate={{ opacity: 0 }} transition={{ duration: 0.8 }} style={{ position: "fixed", inset: 0, background: `hsl(${hue} 100% 80%)`, pointerEvents: "none" }} />}
        </AnimatePresence>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: phase >= 2 ? 1 : 0, y: phase >= 2 ? 0 : 10 }} transition={{ duration: 0.5 }}>
          <div style={{ fontSize: 30, fontWeight: 700, lineHeight: 1.1 }}>{r.member}</div>
          <div className="kicker" style={{ color: "var(--led)", marginTop: 4 }}>{e.replay ? "Souvenir du réveil" : "Membre de l'équipe réveillé"}</div>
        </motion.div>
        <div style={{ minHeight: 96, maxWidth: 360, marginTop: 14 }}>
          {phase >= 3 && (
            <div style={{ textAlign: "left", padding: "12px 14px", borderRadius: "4px 16px 16px 16px", background: `linear-gradient(135deg, hsl(${hue} 90% 55% / .14), rgba(12,19,34,.6))`, border: `1px solid hsl(${hue} 90% 60% / .35)` }}>
              <div className="mono" style={{ fontSize: 10.5, letterSpacing: ".14em", color: `hsl(${hue} 100% 70%)`, marginBottom: 4 }}>{r.member.toUpperCase()}</div>
              <span>{shown}</span>{phase === 3 && <span className="caret" />}
            </div>
          )}
        </div>
        <AnimatePresence>
          {phase >= 4 && (
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} style={{ width: "100%", maxWidth: 360, marginTop: 10 }}>
              {!e.replay && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
                  <div className="panel" style={{ margin: 0, padding: 10 }}><div className="mono" style={{ color: "var(--cyan)", fontSize: 20 }}>+{REWARD.incident}</div><div className="small muted">kW pour la panne réparée</div></div>
                  <div className="panel" style={{ margin: 0, padding: 10 }}><div className="mono" style={{ color: `hsl(${hue} 100% 70%)`, fontSize: 20 }}>{r.version}</div><div className="small muted">version de ton produit à livrer</div></div>
                </div>
              )}
              <button className="btn block led" onClick={(x) => { x.stopPropagation(); sfx("tap"); onClose(); }}>{e.replay ? "Fermer" : "Accueillir dans l'équipe"}</button>
              {!e.replay && <button className="btn ghost block" style={{ marginTop: 8 }} onClick={(x) => { x.stopPropagation(); onClose(); go("equipe"); }}><Icon name="team" size={18} /> Voir ton équipe</button>}
            </motion.div>
          )}
        </AnimatePresence>
        {phase < 4 && <div className="small dim" style={{ marginTop: 16 }}>Touche l'écran pour passer</div>}
      </div>
    </motion.div>
  );
}
