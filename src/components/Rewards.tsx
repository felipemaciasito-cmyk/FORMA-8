import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { crewLines, room as getRoom } from "../content";
import { fx, LEVELS, onFx, REWARD, type FxEvent } from "../lib/game";
import { getEnergyBar, holdEnergy, landEnergy, releaseEnergy } from "../lib/energy";
import { useReduceMotion } from "../lib/motion";
import { go } from "../lib/router";
import { sfx } from "../lib/sound";
import { CrewCapsule } from "./Crew";
import { Icon } from "./Icon";

// Couche des récompenses de FORMA-8, posée au-dessus de l'appli :
// - les kW jaillissent de l'endroit touché. Pendant un protocole, ils filent discrètement dans la barre
//   d'énergie du bas ; en fin de protocole, le total jaillit en grand et rejoint le compteur du haut ;
//   ailleurs (maintenance, atelier, livraisons), ils rejoignent directement le compteur ;
// - une montée de grade ouvre une cérémonie plein écran ;
// - un caisson terminé joue la scène de réveil de son membre.
// Les cérémonies passent l'une après l'autre (file d'attente) et se ferment d'un toucher.
// Un même langage visuel les relie : onde de choc, éclats lumineux, rayons (voir plus bas).

type Ceremony = Extract<FxEvent, { type: "levelup" } | { type: "awaken" }>;
interface Jet { id: number; amount: number; big: boolean; x: number; y: number; tx: number; ty: number; onLand: () => void }

const center = (el: Element | null, fallback: { x: number; y: number }) => {
  const r = el?.getBoundingClientRect();
  return r && r.width ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : fallback;
};

export function RewardLayer() {
  const [jets, setJets] = useState<Jet[]>([]);
  const [queue, setQueue] = useState<Ceremony[]>([]);
  const last = useRef({ x: window.innerWidth / 2, y: window.innerHeight * 0.6 });
  const held = useRef<Ceremony[]>([]);
  const release = () => {
    const h = held.current; held.current = [];
    if (h.length) setQueue((q) => [...q.filter((x, i) => i === 0 || x.type !== "levelup"), ...h]);
  };
  const reduce = useReduceMotion();

  useEffect(() => {
    const down = (e: PointerEvent) => { last.current = { x: e.clientX, y: e.clientY }; };
    window.addEventListener("pointerdown", down, true);
    return () => window.removeEventListener("pointerdown", down, true);
  }, []);

  useEffect(() => onFx((e) => {
    const launch = (j: Omit<Jet, "id">) => {
      if (reduce) { j.onLand(); return; }
      const id = Date.now() + Math.random();
      setJets((l) => [...l.slice(-5), { ...j, id }]);
    };
    const hud = () => center(document.querySelector(".hud-stat.kw"), { x: window.innerWidth - 70, y: 30 });
    if (e.type === "gain" && e.amount > 0) {
      const from = { x: e.x ?? last.current.x, y: e.y ?? last.current.y };
      if (getEnergyBar().max > 0) {
        // Pendant un protocole : vers la barre d'énergie, sans toucher au compteur du haut.
        holdEnergy(e.amount);
        if (e.quiet) { landEnergy(e.amount); return; }
        const t = center(document.querySelector(".energy-pill"), { x: window.innerWidth - 50, y: window.innerHeight - 90 });
        launch({ amount: e.amount, big: false, ...from, tx: t.x, ty: t.y, onLand: () => landEnergy(e.amount) });
      } else {
        const t = hud();
        launch({ amount: e.amount, big: false, ...from, tx: t.x, ty: t.y, onLand: () => {} });
      }
    }
    if (e.type === "payout") {
      const t = hud();
      launch({ amount: e.amount, big: true, x: e.x, y: e.y, tx: t.x, ty: t.y, onLand: () => { releaseEnergy(); sfx("ok"); } });
    }
    // Une montée de grade pendant une leçon ou une panne attend la fin : elle n'interrompt pas la lecture.
    // Plusieurs grades d'un coup : une seule cérémonie, pour le plus récent.
    if (e.type === "levelup") {
      if (busyRoute()) held.current = [...held.current.filter((x) => x.type !== "levelup"), e];
      else setQueue((q) => [...q.filter((x, i) => i === 0 || x.type !== "levelup"), e]);
    }
    // Le réveil passe en premier : c'est le moment fort. Les grades retenus suivent.
    if (e.type === "awaken") { const h = held.current; held.current = []; setQueue((q) => [e, ...q, ...h]); }
    // Fin de protocole : sa cérémonie annonce elle-même le nouveau grade, on n'en ouvre pas une seconde.
    if (e.type === "stepdone") held.current = held.current.filter((x) => x.type !== "levelup");
  }), [reduce]);

  useEffect(() => {
    const onHash = () => { if (!busyRoute()) release(); };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const current = queue[0];
  const close = () => setQueue((q) => q.slice(1));

  return (
    <>
      <div aria-hidden="true" style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 112 }}>
        {jets.map((j) => <JetView key={j.id} j={j} onDone={() => setJets((l) => l.filter((x) => x.id !== j.id))} />)}
      </div>
      <AnimatePresence mode="wait">
        {current?.type === "levelup" && <LevelUp key={`lv-${current.index}`} e={current} onClose={close} />}
        {current?.type === "awaken" && <Awakening key={`aw-${current.roomId}`} e={current} onClose={close} />}
      </AnimatePresence>
    </>
  );
}

/**
 * Un jaillissement de kW : le nombre surgit de son point de départ, marque un temps, puis file vers sa cible
 * en laissant une traînée. Petit et rapide pour une bonne réponse ; grand, avec éclats, pour le total d'un protocole.
 */
function JetView({ j, onDone }: { j: Jet; onDone: () => void }) {
  const rise = j.big ? 0 : 26;
  const dur = j.big ? 1.15 : 0.95;
  const w = j.big ? 150 : 76;
  const xs = [j.x - w / 2, j.x - w / 2, j.x - w / 2, j.tx - w / 2];
  const ys = [j.y - 14, j.y - 14 - rise, j.y - 16 - rise, j.ty - 14];
  const times = [0, 0.3, 0.45, 1];
  const ease = [0.5, 0, 0.2, 1] as const;
  useEffect(() => {
    const t = window.setTimeout(() => { j.onLand(); onDone(); }, dur * 1000);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const dots = j.big ? 9 : 4;
  return (
    <>
      {j.big && <div style={{ position: "absolute", left: j.x, top: j.y }}><Sparks color="var(--cyan)" count={16} radius={90} /></div>}
      {Array.from({ length: dots }, (_, i) => {
        const s = (j.big ? 9 : 6) * (1 - i / (dots + 2));
        return (
          <motion.span key={i} initial={{ x: j.x, y: j.y - 14, opacity: 0 }}
            animate={{ x: [j.x, j.x, j.x, j.tx], y: [j.y - 14, j.y - 14 - rise, j.y - 16 - rise, j.ty], opacity: [0, 0.75 - i * 0.07, 0.6 - i * 0.06, 0] }}
            transition={{ duration: dur, times, ease, delay: 0.03 * (i + 1) }}
            style={{ position: "absolute", left: -s / 2, top: -s / 2, width: s, height: s, borderRadius: "50%", background: i % 2 ? "var(--led)" : "var(--cyan)", boxShadow: `0 0 ${s * 1.6}px var(--cyan)` }} />
        );
      })}
      <motion.div initial={{ x: xs[0], y: ys[0], scale: j.big ? 1 : 0.5, opacity: 0 }}
        animate={{ x: xs, y: ys, scale: j.big ? [1, 1.12, 1, 0.42] : [0.5, 1, 1, 0.55], opacity: [0, 1, 1, j.big ? 0.9 : 0.6] }}
        transition={{ duration: dur, times, ease }}
        style={{ position: "absolute", left: 0, top: 0, width: w, textAlign: "center", whiteSpace: "nowrap", font: `700 ${j.big ? 34 : 15}px var(--mono)`,
          color: "#dffbff", textShadow: `0 0 ${j.big ? 18 : 10}px rgba(59,232,255,.95), 0 0 ${j.big ? 36 : 18}px rgba(77,255,160,.5)` }}>
        +{j.amount}<span style={{ fontSize: j.big ? 16 : 10, marginLeft: 3, color: "var(--cyan)" }}>kW</span>
      </motion.div>
    </>
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

/** Une leçon (protocole), une panne ou une maintenance est en cours : on n'interrompt pas. */
function busyRoute() {
  return /^#\/(caisson\/[^/]+\/[^/]+|panne\/[^/]+|maintenance)$/.test(window.location.hash);
}

// ======================= Montée de grade =======================
function LevelUp({ e, onClose }: { e: Extract<FxEvent, { type: "levelup" }>; onClose: () => void }) {
  return (
    <motion.div role="dialog" aria-modal="true" aria-label={`Nouvelle accréditation : ${e.title}`} onClick={onClose}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: "fixed", inset: 0, zIndex: 110, display: "grid", placeItems: "center", padding: 24, background: "radial-gradient(circle at 50% 40%, rgba(77,255,160,.2), transparent 62%), rgba(4,6,12,.96)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}>
      <div style={{ textAlign: "center", maxWidth: 340 }} onClick={(x) => x.stopPropagation()}>
        <div style={{ position: "relative", width: 200, height: 200, margin: "0 auto" }}>
          <motion.div aria-hidden="true" animate={{ rotate: 360 }} transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
            style={{ position: "absolute", inset: -40, borderRadius: "50%", background: "repeating-conic-gradient(from 0deg, rgba(77,255,160,.16) 0deg 8deg, transparent 8deg 22deg)", maskImage: "radial-gradient(circle, #000 30%, transparent 70%)", WebkitMaskImage: "radial-gradient(circle, #000 30%, transparent 70%)" }} />
          <Shockwave color="var(--led)" delay={0.35} size={210} />
          <Shockwave color="var(--cyan)" delay={0.6} size={260} />
          <Sparks color="var(--led)" count={24} radius={150} delay={0.4} />
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
      style={{ position: "fixed", inset: 0, zIndex: 111, overflowY: "auto", background: `radial-gradient(circle at 50% 34%, hsl(${hue} 90% 45% / ${phase >= 2 ? 0.34 : 0.12}), transparent 64%), #04060c`, transition: "background 1s" }}>
      <div style={{ minHeight: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "calc(var(--safe-top) + 18px) 20px calc(var(--safe-bottom) + 18px)", textAlign: "center" }}>
        <div className="mono" style={{ fontSize: 11, letterSpacing: ".16em", color: `hsl(${hue} 100% 70%)` }}>{r.code} · SÉQUENCE DE RÉVEIL</div>
        <div style={{ width: 240, margin: "8px 0 0" }}>
          <div className="progress" style={{ height: 5 }}>
            <motion.i initial={{ width: "62%" }} animate={{ width: phase >= 1 ? "100%" : "62%" }} transition={{ duration: 1.3, ease: "easeInOut" }} style={{ background: `hsl(${hue} 100% 62%)`, boxShadow: `0 0 10px hsl(${hue} 100% 62%)` }} />
          </div>
        </div>
        <motion.div animate={phase === 1 ? { x: [0, -2, 2, -1, 1, 0] } : { x: 0 }} transition={{ duration: 0.4, repeat: phase === 1 ? 3 : 0 }} style={{ margin: "14px 0 4px", position: "relative" }}>
          {phase >= 2 && <Rays color={`hsl(${hue} 100% 62% / .3)`} size={460} opacity={0.7} />}
          {phase >= 2 && <Shockwave key="sw1" color={`hsl(${hue} 100% 66%)`} size={240} />}
          {phase >= 2 && <Shockwave key="sw2" color="#ffffff" delay={0.18} size={320} />}
          {phase >= 2 && <Sparks key="sp" color={`hsl(${hue} 100% 66%)`} count={30} radius={190} />}
          <motion.div animate={{ scale: phase >= 2 ? 1.06 : 1 }} transition={{ type: "spring", stiffness: 140, damping: 12 }}>
            <CrewCapsule id={r.id} state={phase >= 2 ? "awake" : "asleep"} power={phase >= 1 ? 100 : 62} size={156} mood={phase >= 3 ? "happy" : "neutral"} />
          </motion.div>
        </motion.div>
        <AnimatePresence>
          {phase === 2 && <motion.div key="flash" aria-hidden="true" initial={{ opacity: 0.7 }} animate={{ opacity: 0 }} transition={{ duration: 0.8 }} style={{ position: "fixed", inset: 0, background: `hsl(${hue} 100% 80%)`, pointerEvents: "none" }} />}
        </AnimatePresence>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: phase >= 2 ? 1 : 0, y: phase >= 2 ? 0 : 10 }} transition={{ duration: 0.5 }}>
          <div style={{ fontSize: 30, fontWeight: 700, lineHeight: 1.1 }}>{r.member}</div>
          <div className="kicker" style={{ color: "var(--led)", marginTop: 4 }}>{e.replay ? "Souvenir du réveil" : "Membre de l'équipe réveillé"}</div>
        </motion.div>
        <div style={{ minHeight: 96, maxWidth: 360, marginTop: 10 }}>
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
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
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
