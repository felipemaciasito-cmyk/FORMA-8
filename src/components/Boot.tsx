import { AnimatePresence, motion, useMotionValue, useTransform, animate } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { sfx } from "../lib/sound";
import { updateProgress, useProgress } from "../lib/store";
import { OraSays } from "./Ora";

const BIOS = [
  "FORMA-8 · BIOS v8.0.26",
  "Contrôle mémoire ............ OK",
  "Datacenter FORMA-7 .......... EN LIGNE",
  "Caissons détectés ........... 11",
  "Équipe réveillée ............ 0 %",
  "[ALERTE] Équipe en sommeil.",
];

export function Boot({ power, onDone }: { power: number; onDone: () => void }) {
  const progress = useProgress();
  const returning = progress.bootedOnce;
  const [phase, setPhase] = useState<"bios" | "ora" | "lever" | "flash">(returning ? "bios" : "bios");
  const [lines, setLines] = useState<string[]>([]);
  const [name, setName] = useState(progress.name);
  const skip = useRef(false);

  // Frappe des lignes BIOS
  useEffect(() => {
    if (phase !== "bios") return;
    const script = returning
      ? ["FORMA-8 · reprise de session", `Équipe réveillée ............ ${power} %`, "Bon retour" + (progress.name ? `, ${progress.name}` : "") + "."]
      : BIOS;
    let li = 0, ci = 0, cancelled = false;
    const out: string[] = [];
    const tick = () => {
      if (cancelled) return;
      if (skip.current) { setLines(script); return finish(); }
      if (li >= script.length) return finish();
      ci++;
      out[li] = script[li].slice(0, ci);
      setLines([...out]);
      if (ci % 3 === 0) sfx("type");
      if (ci >= script[li].length) { li++; ci = 0; setTimeout(tick, returning ? 120 : 260); }
      else setTimeout(tick, returning ? 10 : 16);
    };
    const finish = () => setTimeout(() => {
      if (cancelled) return;
      if (returning) { setPhase("flash"); setTimeout(onDone, 380); }
      else setPhase("ora");
    }, returning ? 350 : 700);
    const t = setTimeout(tick, 300);
    return () => { cancelled = true; clearTimeout(t); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const confirmName = () => {
    updateProgress((p) => { p.name = name.trim().slice(0, 24); });
    sfx("open");
    setPhase("lever");
  };

  const pull = () => {
    sfx("power");
    setPhase("flash");
    updateProgress((p) => { p.bootedOnce = true; });
    setTimeout(onDone, 1100);
  };

  return (
    <div className="boot" onClick={() => { if (phase === "bios") skip.current = true; }}
      style={{ position: "fixed", inset: 0, zIndex: 100, background: "#020308", display: "flex", flexDirection: "column", padding: "calc(var(--safe-top) + 28px) 22px calc(var(--safe-bottom) + 28px)" }}>
      <div className="scanlines" style={{ opacity: 0.08 }} />
      <div style={{ maxWidth: 560, width: "100%", margin: "0 auto", flex: 1, display: "flex", flexDirection: "column" }}>
        <pre className="mono" style={{ margin: 0, fontSize: 13.5, lineHeight: 1.8, color: "#7fe9ff", whiteSpace: "pre-wrap", textShadow: "0 0 8px rgba(59,232,255,.5)" }}>
          {lines.map((l, i) => (
            <div key={i} style={{ color: l.startsWith("[ALERTE]") ? "var(--amber)" : undefined }} className={i === lines.length - 1 && phase === "bios" ? "caret" : ""}>{l}</div>
          ))}
        </pre>

        <AnimatePresence>
          {phase === "ora" && (
            <motion.div key="ora" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ marginTop: 28 }}>
              <OraSays md={"Bonjour. Je suis **ORA**, Opérateur de Relance Automatique.\n\nLe datacenter est rallumé. Dans sa réserve dorment **11 membres d'équipe** : chacun maîtrise une partie du métier de créateur d'applications. Réveille-les un par un, et ensemble vous construirez **ton propre produit**, jusqu'à son lancement. Je t'accompagnerai.\n\nComment dois-je t'appeler ?"} />
              <form onSubmit={(e) => { e.preventDefault(); confirmName(); }} style={{ marginTop: 18 }}>
                <input className="input" autoFocus placeholder="Ton prénom (facultatif)" value={name} onChange={(e) => setName(e.target.value)} maxLength={24} aria-label="Ton prénom" />
                <button className="btn block" style={{ marginTop: 12 }} type="submit">Prendre mon poste</button>
              </form>
            </motion.div>
          )}
          {phase === "lever" && (
            <motion.div key="lever" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 18 }}>
              <OraSays compact md={`Parfait${progress.name ? `, ${progress.name}` : ""}. Abaisse le **levier principal** pour envoyer le courant dans la réserve.`} />
              <Lever onPulled={pull} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <AnimatePresence>
        {phase === "flash" && (
          <motion.div key="flash" initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 0.2, 0.9, 0] }} transition={{ duration: returning ? 0.4 : 1.1, times: [0, 0.1, 0.3, 0.45, 1] }}
            style={{ position: "fixed", inset: 0, background: "radial-gradient(circle, #e9fdff, #3be8ff 40%, #020308 75%)", pointerEvents: "none" }} />
        )}
      </AnimatePresence>
      {phase === "bios" && <div className="mono dim small" style={{ textAlign: "center" }}>Touchez l'écran pour accélérer</div>}
    </div>
  );
}

function Lever({ onPulled }: { onPulled: () => void }) {
  const TRACK = 190;
  const y = useMotionValue(0);
  const glow = useTransform(y, [0, TRACK], [0.15, 1]);
  const done = useRef(false);
  const fire = () => {
    if (done.current) return;
    done.current = true;
    animate(y, TRACK, { duration: 0.15 });
    onPulled();
  };
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
      <div style={{ position: "relative", width: 86, height: TRACK + 86, borderRadius: 22, background: "linear-gradient(#0d1628, #070c18)", border: "1px solid var(--line-strong)", boxShadow: "inset 0 0 30px rgba(0,0,0,.8)" }}>
        <motion.div style={{ position: "absolute", left: 38, top: 30, width: 10, height: TRACK + 26, borderRadius: 5, background: "#02050b", boxShadow: "inset 0 0 6px #000" }} />
        <motion.div style={{ position: "absolute", left: 40, top: 32, width: 6, borderRadius: 3, background: "var(--cyan)", height: y, opacity: glow, boxShadow: "0 0 14px var(--cyan)" }} />
        <motion.button aria-label="Abaisser le levier principal" drag="y" dragConstraints={{ top: 0, bottom: TRACK }} dragElastic={0.05} dragMomentum={false}
          style={{ y, position: "absolute", left: 9, top: 10, width: 68, height: 54, borderRadius: 16, touchAction: "none",
            background: "linear-gradient(180deg, #ff8a5c, #e2452f)", boxShadow: "0 8px 0 #8a2414, 0 14px 30px rgba(226,69,47,.45)", color: "#fff", font: "700 12px var(--mono)", letterSpacing: ".1em" }}
          onDragEnd={() => { if (y.get() > TRACK * 0.7) fire(); else animate(y, 0, { type: "spring", stiffness: 300, damping: 20 }); }}
          onTap={() => { if (y.get() < 5) { animate(y, TRACK, { duration: 0.4, ease: "easeIn" }); setTimeout(fire, 380); } }}
          whileTap={{ scale: 0.96 }}>
          ON
        </motion.button>
      </div>
      <div className="mono small" style={{ color: "var(--text-3)", lineHeight: 2.4 }}>
        <div>ARRÊT</div>
        <div style={{ height: TRACK - 40 }} />
        <motion.div style={{ color: "var(--cyan)", opacity: glow }}>MARCHE</motion.div>
      </div>
    </div>
  );
}
