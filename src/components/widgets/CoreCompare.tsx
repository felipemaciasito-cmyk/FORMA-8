import { motion } from "motion/react";
import { useState } from "react";
import { sfx } from "../../lib/sound";
import { Icon } from "../Icon";

// Comparateur des trois cœurs. Infos vérifiées en novembre 2026 : tendances, pas classements.
// Monogrammes neutres dans des puces : aucun logo de marque.
const CORES = [
  { id: "claude", name: "Claude", by: "Anthropic", mono: "mono-cl", hue: 22 },
  { id: "chatgpt", name: "ChatGPT", by: "OpenAI", mono: "mono-gpt", hue: 160 },
  { id: "gemini", name: "Gemini", by: "Google", mono: "mono-gem", hue: 220 },
];

const NEEDS: { label: string; fit: string[]; note: string }[] = [
  { label: "Rédiger un long document soigné", fit: ["claude", "chatgpt", "gemini"], note: "Les trois savent faire. Claude est souvent cité pour la qualité et la nuance de ses textes longs." },
  { label: "Analyser un gros PDF", fit: ["claude", "chatgpt", "gemini"], note: "Les trois lisent les PDF. Les limites de taille varient selon la formule." },
  { label: "Créer une image", fit: ["chatgpt", "gemini"], note: "ChatGPT et Gemini génèrent des images. Claude non (il fait des schémas et graphiques)." },
  { label: "Travailler dans Gmail / Docs", fit: ["gemini"], note: "Gemini est intégré nativement à Google Workspace. Les autres s'y branchent par connecteur (Salle 06)." },
  { label: "Écrire du code", fit: ["claude", "chatgpt"], note: "Claude (Claude Code) et ChatGPT (Codex) proposent des agents de programmation dédiés. Gemini code aussi." },
  { label: "Discuter à voix haute", fit: ["chatgpt", "gemini", "claude"], note: "Les trois ont un mode vocal ; ChatGPT et Gemini sont souvent jugés plus avancés sur ce point." },
  { label: "Automatiser des tâches de bureau", fit: ["claude", "chatgpt", "gemini"], note: "Tous ont des agents. Claude propose Cowork pour agir sur tes fichiers (Salle 07)." },
];

export default function CoreCompare() {
  const [need, setNeed] = useState<number | null>(null);
  const n = need !== null ? NEEDS[need] : null;
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
        {CORES.map((c) => {
          const on = !n || n.fit.includes(c.id);
          const first = n?.fit[0] === c.id;
          return (
            <motion.div key={c.id} animate={{ opacity: on ? 1 : 0.28, scale: first ? 1.04 : 1 }} transition={{ type: "spring", stiffness: 300, damping: 22 }}
              style={{ borderRadius: 14, padding: "14px 8px", textAlign: "center", border: `1px solid hsl(${c.hue} 90% 60% / ${on ? 0.6 : 0.15})`, background: `linear-gradient(180deg, hsl(${c.hue} 80% 50% / ${on ? 0.18 : 0.04}), transparent)`, boxShadow: on && n ? `0 0 24px hsl(${c.hue} 90% 55% / .35)` : "none" }}>
              <div style={{ display: "grid", placeItems: "center" }}>
                <span style={{ width: 46, height: 46, borderRadius: 13, display: "grid", placeItems: "center", color: `hsl(${c.hue} 90% 70%)`,
                  background: `linear-gradient(160deg, hsl(${c.hue} 80% 50% / .22), rgba(8,13,24,.9))`, border: `1.5px solid hsl(${c.hue} 90% 62% / ${on ? 0.75 : 0.25})`,
                  boxShadow: on ? `inset 0 0 10px hsl(${c.hue} 90% 60% / .25)` : "none" }}>
                  <Icon name={c.mono} size={34} />
                </span>
              </div>
              <div style={{ fontWeight: 700, marginTop: 6 }}>{c.name}</div>
              <div className="mono" style={{ fontSize: 10, color: "var(--text-3)" }}>{c.by}</div>
              <div className="row" style={{ justifyContent: "center", gap: 3, marginTop: 8 }}>
                {[0, 1, 2, 3].map((k) => <span key={k} style={{ width: 6, height: 6, borderRadius: 2, background: on ? `hsl(${c.hue} 90% 60%)` : "#1f2b40", animation: on ? `blink ${0.7 + k * 0.3}s steps(1) infinite` : undefined }} />)}
              </div>
            </motion.div>
          );
        })}
      </div>
      <div className="row wrap-row" style={{ gap: 8, marginTop: 14 }}>
        {NEEDS.map((x, i) => (
          <button key={x.label} className={`chip ${need === i ? "on" : ""}`} style={{ fontSize: 13.5 }} onClick={() => { sfx("relay"); setNeed(need === i ? null : i); }}>{x.label}</button>
        ))}
      </div>
      {n && <motion.div key={need} className="feedback info" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}><span className="tag">Diagnostic</span>{n.note}</motion.div>}
      <div className="small dim" style={{ marginTop: 10 }}>Tendances relevées en novembre 2026, pas un classement officiel. À revérifier.</div>
    </div>
  );
}
