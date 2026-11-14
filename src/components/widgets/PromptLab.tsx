import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { sfx } from "../../lib/sound";
import { Icon } from "../Icon";
import { useSettings } from "../../lib/store";
import { loadClaude } from "../../lib/models";

// Prompt Lab : assemble un prompt par blocs et observe la qualité de la réponse simulée.
const PIECES = [
  { id: "role", label: "Rôle", color: "#a78bfa", text: "Tu es un assistant administratif pour freelances." },
  { id: "ctx", label: "Contexte", color: "#3be8ff", text: "Mon client Dubois a 30 jours de retard sur une facture de 1 200 €. C'est un bon client depuis 2 ans." },
  { id: "task", label: "Tâche", color: "#4dffa0", text: "Rédige un mail de relance." },
  { id: "cons", label: "Contraintes", color: "#ffb547", text: "Courtois mais ferme, vouvoiement, sans menace juridique." },
  { id: "fmt", label: "Format", color: "#ff7ab6", text: "Un objet + un mail de 120 mots maximum." },
  { id: "ex", label: "Exemple", color: "#7aa2ff", text: "Exemple de ton que j'aime : « Je me permets de revenir vers vous au sujet de… »" },
];

const OUTPUTS = [
  { min: 0, label: "Réponse générique", text: "Bonjour,\n\nJe vous écris concernant votre facture. Merci de bien vouloir la régler.\n\nCordialement" },
  { min: 35, label: "Réponse correcte", text: "Objet : Relance facture\n\nBonjour,\n\nSauf erreur de notre part, la facture de 1 200 € reste impayée. Pourriez-vous procéder au règlement ?\n\nCordialement" },
  { min: 70, label: "Réponse pro, prête à envoyer", text: "Objet : Facture n° 2026-041 — petit rappel\n\nBonjour Monsieur Dubois,\n\nJe me permets de revenir vers vous au sujet de la facture de 1 200 €, arrivée à échéance il y a 30 jours. Je sais que ce n'est pas dans vos habitudes après deux ans de collaboration : un simple oubli, sans doute.\n\nPourriez-vous m'indiquer la date de règlement prévue ? Je reste disponible si un échéancier vous arrange.\n\nBien cordialement" },
];

export default function PromptLab() {
  const settings = useSettings();
  const [on, setOn] = useState<string[]>(["task"]);
  const [live, setLive] = useState<{ loading: boolean; text?: string; error?: string }>({ loading: false });
  const toggle = (id: string) => { sfx("relay"); setOn((o) => (o.includes(id) ? o.filter((x) => x !== id) : [...o, id])); setLive({ loading: false }); };
  const weights: Record<string, number> = { role: 15, ctx: 25, task: 15, cons: 15, fmt: 15, ex: 15 };
  const score = Math.min(100, on.reduce((a, id) => a + weights[id], 0));
  const out = [...OUTPUTS].reverse().find((o) => score >= o.min)!;
  const prompt = PIECES.filter((p) => on.includes(p.id)).map((p) => p.text).join(" ");
  const tryLive = async () => {
    setLive({ loading: true });
    try { const { runPrompt } = await loadClaude(); setLive({ loading: false, text: await runPrompt(prompt) }); }
    catch (e) { setLive({ loading: false, error: e instanceof Error ? e.message : String(e) }); }
  };
  return (
    <div>
      <div className="row wrap-row" style={{ gap: 8 }}>
        {PIECES.map((p) => {
          const active = on.includes(p.id);
          return (
            <motion.button key={p.id} whileTap={{ scale: 0.94 }} onClick={() => toggle(p.id)} className="chip"
              style={{ borderColor: p.color, background: active ? p.color : "transparent", color: active ? "#05070d" : p.color }}>
              <Icon name={active ? "check" : "plus"} size={14} stroke={2.2} />{p.label}
            </motion.button>
          );
        })}
      </div>
      <div className="code-block" style={{ marginTop: 12, fontFamily: "var(--font)", fontSize: 14.5, minHeight: 60 }}>
        <AnimatePresence initial={false}>
          {PIECES.filter((p) => on.includes(p.id)).map((p) => (
            <motion.span key={p.id} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              style={{ display: "inline", marginRight: 4, padding: "1px 4px", borderRadius: 4, background: `${p.color}22`, borderBottom: `2px solid ${p.color}` }}>
              {p.text}
            </motion.span>
          ))}
        </AnimatePresence>
      </div>
      <div style={{ margin: "14px 0 6px" }} className="row">
        <span className="mono small grow">QUALITÉ DU PROMPT</span>
        <span className="mono" style={{ color: score >= 70 ? "var(--led)" : score >= 35 ? "var(--amber)" : "var(--red)" }}>{score} %</span>
      </div>
      <div className="progress" style={{ height: 10 }}>
        <motion.i animate={{ width: `${score}%` }} style={{ background: score >= 70 ? "var(--led)" : score >= 35 ? "var(--amber)" : "var(--red)" }} />
      </div>
      <div className="panel" style={{ marginTop: 14, background: "#050912" }}>
        <div className="panel-title">Réponse simulée · {out.label}</div>
        <AnimatePresence mode="wait">
          <motion.pre key={out.label} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ margin: 0, whiteSpace: "pre-wrap", font: "14px/1.5 var(--font)" }}>{out.text}</motion.pre>
        </AnimatePresence>
      </div>
      {settings.apiKey && (
        <div style={{ marginTop: 12 }}>
          <button className="btn ghost block" onClick={tryLive} disabled={live.loading || !on.includes("task")}>{live.loading ? "Claude rédige…" : <><Icon name="spark" size={18} /> Tester ce prompt avec Claude, pour de vrai</>}</button>
          {live.text && <div className="feedback info"><span className="tag">Réponse réelle de Claude</span><pre style={{ margin: 0, whiteSpace: "pre-wrap", font: "14px/1.5 var(--font)" }}>{live.text}</pre></div>}
          {live.error && <div className="feedback ko"><span className="tag">Erreur</span>{live.error}</div>}
        </div>
      )}
    </div>
  );
}
