import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { sfx } from "../../lib/sound";
import { Icon, type IconId } from "../Icon";

// « La boucle de l'agent » : pour chaque tâche, Claude Code enchaîne trois
// phases (rassembler le contexte, agir, vérifier les résultats) et recommence
// jusqu'à ce que la vérification réussisse. On peut l'interrompre à tout moment
// pour le réorienter. Source : code.claude.com/docs/fr/how-claude-code-works
// (vérifiée le 14/11/2026).

type Phase = "contexte" | "agir" | "verifier";
interface Act { phase: Phase; icon: IconId; t: string; fail?: boolean }

const PHASES: { id: Phase; label: string; color: string }[] = [
  { id: "contexte", label: "Rassembler le contexte", color: "var(--cyan)" },
  { id: "agir", label: "Agir", color: "var(--amber)" },
  { id: "verifier", label: "Vérifier", color: "var(--led)" },
];
const SCRIPT: Act[] = [
  { phase: "contexte", icon: "search", t: "Cherche les fichiers qui parlent du bouton « Contact »" },
  { phase: "contexte", icon: "file-lines", t: "Lit la page d'accueil et son code" },
  { phase: "agir", icon: "pencil", t: "Modifie le code du bouton" },
  { phase: "verifier", icon: "flask", t: "Lance la vérification : le bouton ne réagit toujours pas", fail: true },
  { phase: "contexte", icon: "search", t: "Relit le message d'erreur et cherche la cause" },
  { phase: "agir", icon: "pencil", t: "Corrige le nom de l'action reliée au bouton" },
  { phase: "verifier", icon: "flask", t: "Relance la vérification : le bouton ouvre bien le mail" },
];

export default function AgentCycle() {
  const [k, setK] = useState(-1);
  const [stopped, setStopped] = useState(false);
  const act = k >= 0 ? SCRIPT[k] : null;
  const done = k === SCRIPT.length - 1;
  const ph = act ? PHASES.findIndex((p) => p.id === act.phase) : -1;
  const turns = SCRIPT.slice(0, k + 1).filter((a) => a.phase === "verifier").length;

  const step = () => { if (done || stopped) return; const n = k + 1; setK(n); sfx(SCRIPT[n].fail ? "ko" : SCRIPT[n].phase === "verifier" ? "ok" : "relay"); };
  const reset = () => { setK(-1); setStopped(false); sfx("tap"); };

  return (
    <div>
      <div style={{ position: "relative", width: 220, height: 220, margin: "0 auto" }}>
        <svg width="220" height="220" viewBox="0 0 220 220" aria-hidden="true">
          {PHASES.map((p, i) => {
            const a0 = (i * 120 - 90) * (Math.PI / 180), a1 = ((i + 1) * 120 - 96) * (Math.PI / 180);
            const R = 92;
            const d = `M${110 + R * Math.cos(a0)} ${110 + R * Math.sin(a0)} A${R} ${R} 0 0 1 ${110 + R * Math.cos(a1)} ${110 + R * Math.sin(a1)}`;
            const on = i === ph;
            return <path key={p.id} d={d} fill="none" stroke={on ? p.color : "#1f2b40"} strokeWidth={on ? 10 : 8} strokeLinecap="round" style={on ? { filter: `drop-shadow(0 0 8px ${p.color})` } : undefined} />;
          })}
        </svg>
        {PHASES.map((p, i) => {
          const a = (i * 120 - 30) * (Math.PI / 180);
          return <div key={p.id} className="mono" style={{ position: "absolute", left: 110 + 112 * Math.cos(a) - 50, top: 110 + 112 * Math.sin(a) - 10, width: 100, textAlign: "center", fontSize: 9.5, color: i === ph ? p.color : "var(--text-3)" }}>{p.label.toUpperCase()}</div>;
        })}
        <div style={{ position: "absolute", inset: 60, borderRadius: "50%", display: "grid", placeItems: "center", textAlign: "center", background: "#050912", border: "1px solid var(--line)" }}>
          <div>
            <Icon name={act ? act.icon : "bot"} size={30} style={{ color: act ? PHASES[ph].color : "var(--text-3)" }} />
            <div className="mono" style={{ fontSize: 10, marginTop: 4, color: "var(--text-3)" }}>{done ? "TERMINÉ" : stopped ? "EN PAUSE" : `TOUR ${Math.max(1, turns + (act?.phase === "verifier" ? 0 : 1))}`}</div>
          </div>
        </div>
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={`${k}-${stopped}`} className={`feedback ${stopped ? "info" : act?.fail ? "ko" : done ? "ok" : "info"}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          {stopped ? <>Tu as interrompu Claude. Dans une vraie séance, tu peux à tout moment le réorienter : donner une précision, demander une autre approche. Il reprend avec ta consigne.</>
            : act ? <><span className="tag">{PHASES[ph].label}</span>{act.t}{act.fail ? ". La vérification a échoué : Claude ne s'arrête pas là, il repart chercher la cause." : done ? ". La vérification réussit : la tâche est terminée." : "."}</>
            : <>Tâche confiée à Claude : « Le bouton Contact ne réagit pas, corrige-le. » Suis la boucle étape par étape.</>}
        </motion.div>
      </AnimatePresence>
      <div className="row" style={{ marginTop: 12 }}>
        <button className="btn grow" onClick={step} disabled={done || stopped}>{k < 0 ? "Lancer la tâche" : done ? "Tâche terminée" : "Étape suivante"}</button>
        <button className="btn subtle" onClick={() => { setStopped(true); sfx("alarm"); }} disabled={k < 0 || done || stopped}>Interrompre</button>
        <button className="btn subtle" onClick={reset} aria-label="Recommencer"><Icon name="refresh" size={18} /></button>
      </div>
      {stopped && <button className="btn ghost small block" style={{ marginTop: 8 }} onClick={() => { setStopped(false); sfx("open"); }}>Reprendre avec une précision</button>}
    </div>
  );
}
