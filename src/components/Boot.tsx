import { AnimatePresence, motion, useMotionValue, useTransform, animate } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { key, LEVER_HIT, LEVER_LAST, LEVER_LIGHTS, sfx, STORM_STRIKES, unlockAudio } from "../lib/sound";
import { flash, skyStrike } from "./Bolts";
import { Icon } from "./Icon";
import { updateProgress, updateSettings, useProgress } from "../lib/store";
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
  // Lu une seule fois : le levier marque bootedOnce pendant la séquence, qui doit rester celle du premier lancement.
  const [returning] = useState(progress.bootedOnce);
  // Premier lancement : l'écran est éteint ; le joueur le met sous tension d'un toucher. Ce geste débloque aussi le
  // son (Safari sur iPhone refuse tout son avant un toucher) : on entend alors le BIOS s'écrire.
  const [phase, setPhase] = useState<"off" | "bios" | "ora" | "ambience" | "lever" | "flash">(returning ? "bios" : "off");
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
      const ch = script[li][ci - 1], nx = script[li][ci];
      // Premier lancement : une vraie frappe, touche par touche, avec un rythme humain. Reprise : rapide et discrète.
      if (!returning) key(ch === " " ? "space" : "char");
      else if (ci % 3 === 0) key("char");
      if (ci >= script[li].length) {
        li++; ci = 0;
        if (!returning) setTimeout(() => key("enter"), 120);
        setTimeout(tick, returning ? 120 : 260 + Math.random() * 200);
      } else if (returning) setTimeout(tick, 10);
      else {
        let d = 30 + Math.random() * 40;
        if (ch === "." && nx === ".") d = 24 + Math.random() * 8;
        if (ch === " ") d += 15 + Math.random() * 35;
        if (Math.random() < 0.05) d += 90 + Math.random() * 120;
        setTimeout(tick, d);
      }
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
    setPhase("ambience");
  };
  const chooseAmbience = (on: boolean) => {
    updateSettings({ ambience: on });
    sfx("open");
    setPhase("lever");
  };

  // Le levier : la lame entre en force (impact), puis les rangées de lumières s'allument jusqu'au joueur.
  const [lights, setLights] = useState(0);
  const pull = () => {
    sfx("lever");
    updateProgress((p) => { p.bootedOnce = true; });
    setTimeout(() => setPhase("flash"), LEVER_HIT * 1000);
    LEVER_LIGHTS.forEach((d, i) => setTimeout(() => setLights(i + 1), (LEVER_HIT + d) * 1000));
    // Toute la salle est allumée : un orage électrique éclate, et l'accueil apparaît dans le flash du dernier éclair.
    const storm = LEVER_LAST + 0.15;
    setTimeout(() => sfx("storm"), storm * 1000);
    const W = window.innerWidth, H = window.innerHeight;
    const bolts: [number, number, number][] = [[0.3, 0.6, 0.78], [0.82, 0.42, 0.62], [0.55, 0.5, 0.95]];
    STORM_STRIKES.forEach((d, i) => setTimeout(() => {
      const [fx0, tx, ty] = bolts[i];
      skyStrike(W * fx0, W * tx, H * ty);
      flash(i === STORM_STRIKES.length - 1 ? 0.95 : 0.55, i === STORM_STRIKES.length - 1 ? 1100 : 450);
    }, (storm + d) * 1000));
    setTimeout(onDone, (storm + STORM_STRIKES[STORM_STRIKES.length - 1] + 0.12) * 1000);
  };

  return (
    <div className="boot" onClick={() => { if (phase === "bios") skip.current = true; }}
      style={{ position: "fixed", inset: 0, zIndex: 100, background: "#020308", display: "flex", flexDirection: "column", padding: "calc(var(--safe-top) + 28px) 22px calc(var(--safe-bottom) + 28px)" }}>
      <div className="scanlines" style={{ opacity: 0.08 }} />
      {phase === "off" && (
        <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", textAlign: "center", padding: 24 }}>
          <div>
            <motion.button aria-label="Mettre sous tension" onClick={(e) => { e.stopPropagation(); unlockAudio(); sfx("relay"); setPhase("bios"); }}
              animate={{ boxShadow: ["0 0 0 0 rgba(59,232,255,.5)", "0 0 0 18px rgba(59,232,255,0)"] }} transition={{ duration: 1.6, repeat: Infinity }}
              whileTap={{ scale: 0.94 }}
              style={{ width: 96, height: 96, margin: "0 auto", borderRadius: "50%", display: "grid", placeItems: "center", color: "var(--cyan)", background: "#070c17", border: "2px solid rgba(59,232,255,.6)" }}>
              <Icon name="power" size={40} />
            </motion.button>
            <div className="mono" style={{ marginTop: 22, fontSize: 12, letterSpacing: ".16em", color: "#7fe9ff" }}>FORMA-8 · HORS TENSION</div>
            <div className="small muted" style={{ marginTop: 6 }}>Touche le bouton pour mettre la réserve sous tension.<br />Active le son de ton iPhone.</div>
          </div>
        </div>
      )}
      <div style={{ maxWidth: 560, width: "100%", margin: "0 auto", flex: 1, display: "flex", flexDirection: "column", opacity: phase === "flash" && !returning ? 0 : 1, transition: "opacity .25s" }}>
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
          {phase === "ambience" && (
            <motion.div key="amb" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ marginTop: 28 }}>
              <OraSays md={`Une question avant d'envoyer le courant${progress.name ? `, ${progress.name}` : ""} : veux-tu entendre la réserve ? Un **fond sonore** discret : le ronronnement des transformateurs, la ventilation, quelques grésillements au loin. Avec des écouteurs, c'est encore mieux. Tu pourras le changer à tout moment dans **Réglages**.`} />
              <div className="stack" style={{ marginTop: 18, gap: 10 }}>
                <button className="btn block" onClick={() => chooseAmbience(true)}>Oui, allume le fond sonore</button>
                <button className="btn ghost block" onClick={() => chooseAmbience(false)}>Non merci</button>
              </div>
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
        {phase === "flash" && returning && (
          <motion.div key="flash" initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 0.2, 0.9, 0] }} transition={{ duration: 0.4, times: [0, 0.1, 0.3, 0.45, 1] }}
            style={{ position: "fixed", inset: 0, background: "radial-gradient(circle, #e9fdff, #3be8ff 40%, #020308 75%)", pointerEvents: "none" }} />
        )}
        {phase === "flash" && !returning && (
          <motion.div key="power" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ position: "fixed", inset: 0, pointerEvents: "none" }}>
            {/* l'impact du levier : un éclair blanc, l'écran tremble */}
            <motion.div initial={{ opacity: 1 }} animate={{ opacity: 0 }} transition={{ duration: 0.5 }} style={{ position: "absolute", inset: 0, background: "#fff" }} />
            {/* La salle des machines en perspective : les rangées de lumières du plafond s'allument une à une,
                du fond de la salle (petites, au loin) jusqu'au joueur (grandes, au-dessus de lui), avec leur reflet au sol. */}
            {LEVER_LIGHTS.map((_, i) => {
              const k = (i + 1) / LEVER_LIGHTS.length, on = lights > i;
              const y = 50 - 42 * Math.pow(k, 1.25), w = 10 + 115 * Math.pow(k, 1.5), h = 2 + 9 * k;
              return (
                <div key={i}>
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: on ? [0, 1, 0.25, 1] : 0.05 }} transition={{ duration: 0.35 }}
                    style={{ position: "absolute", left: `${50 - w / 2}%`, width: `${w}%`, top: `${y}%`, height: h, borderRadius: h, background: "#f4feff",
                      boxShadow: `0 0 ${8 + 18 * k}px #fff, 0 0 ${20 + 50 * k}px rgba(59,232,255,.8)` }} />
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: on ? 0.35 : 0 }} transition={{ duration: 0.35 }}
                    style={{ position: "absolute", left: `${50 - w / 2}%`, width: `${w}%`, top: `${100 - y}%`, height: h * 2, borderRadius: h, filter: "blur(6px)", background: "rgba(190,245,255,.8)" }} />
                </div>
              );
            })}
            <motion.div animate={{ opacity: lights / LEVER_LIGHTS.length * 0.6 }} transition={{ duration: 0.3 }}
              style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 50%, rgba(190,245,255,.55), rgba(59,232,255,.18) 40%, transparent 75%)" }} />
            {lights >= LEVER_LIGHTS.length && <motion.div initial={{ opacity: 0.9 }} animate={{ opacity: 0 }} transition={{ duration: 0.6, delay: (LEVER_LAST - LEVER_HIT - LEVER_LIGHTS[LEVER_LIGHTS.length - 1]) }} style={{ position: "absolute", inset: 0, background: "radial-gradient(circle, #ffffff, #bdf6ff 45%, rgba(4,6,12,0) 85%)" }} />}
          </motion.div>
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
