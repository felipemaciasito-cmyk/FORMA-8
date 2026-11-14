import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { sfx } from "../../lib/sound";
import { Icon } from "../Icon";

// Une barrette de mémoire = la fenêtre de contexte. Les messages s'y empilent, les plus anciens tombent.
const CAP = 12;
const SCRIPT = [
  { who: "toi", t: "Je m'appelle Léa, je suis fleuriste.", size: 2, key: true },
  { who: "ia", t: "Enchanté Léa ! Comment puis-je t'aider ?", size: 2 },
  { who: "toi", t: "Écris un post pour la fête des mères.", size: 2 },
  { who: "ia", t: "Voici un post : « Offrez des fleurs… »", size: 3 },
  { who: "toi", t: "Plus court, et plus tendre.", size: 1 },
  { who: "ia", t: "« Pour maman, des fleurs et tout notre amour… »", size: 2 },
  { who: "toi", t: "Maintenant, une idée de promo.", size: 2 },
  { who: "ia", t: "-10 % sur les bouquets du jeudi.", size: 2 },
];

type Blk = { id: number; who: string; t: string; size: number; key?: boolean };

export default function ContextRam() {
  const [i, setI] = useState(0);
  const [blocks, setBlocks] = useState<Blk[]>([]);
  const [fallen, setFallen] = useState<Blk[]>([]);
  const [memory, setMemory] = useState(false);
  const [asked, setAsked] = useState(false);
  const used = blocks.reduce((a, b) => a + b.size, 0) + (memory ? 1 : 0);

  const send = () => {
    if (i >= SCRIPT.length) return;
    sfx("relay");
    const m = { ...SCRIPT[i], id: i };
    let next = [...blocks, m];
    const out: Blk[] = [];
    const cap = CAP - (memory ? 1 : 0);
    while (next.reduce((a, b) => a + b.size, 0) > cap) { out.push(next[0]); next = next.slice(1); }
    setBlocks(next); if (out.length) { setFallen((f) => [...f, ...out]); sfx("ko"); }
    setI(i + 1);
  };
  const reset = () => { setI(0); setBlocks([]); setFallen([]); setAsked(false); };
  const nameLost = fallen.some((f) => f.key);
  const nameKnown = blocks.some((b) => b.key) || memory;

  return (
    <div>
      <div className="row" style={{ justifyContent: "space-between", marginBottom: 8 }}>
        <span className="mono small">CONTEXTE · {used}/{CAP} unités</span>
        <span className={`pill ${used >= CAP - 1 ? "red" : "cyan"}`}>{used >= CAP - 1 ? "Saturé" : "OK"}</span>
      </div>
      {/* barrette */}
      <div style={{ position: "relative", padding: "12px 10px 18px", borderRadius: 12, background: "linear-gradient(#0d3b2e, #08251d)", border: "1px solid #1e6b52" }}>
        <div style={{ display: "flex", gap: 4, minHeight: 74, alignItems: "stretch" }}>
          {memory && (
            <div title="Mémoire persistante" style={{ flex: 1, borderRadius: 6, background: "var(--violet)", color: "#160b33", font: "700 10px var(--mono)", display: "grid", placeItems: "center", textAlign: "center", padding: 4 }}>MÉMO<br />Léa</div>
          )}
          <AnimatePresence initial={false}>
            {blocks.map((b) => (
              <motion.div key={b.id} layout initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 60, rotate: -12 }} transition={{ type: "spring", stiffness: 300, damping: 24 }}
                style={{ flex: b.size, borderRadius: 6, padding: 4, overflow: "hidden", background: b.who === "toi" ? "var(--cyan)" : "#bff7ff", color: "#03202a", font: "600 10px/1.25 var(--font)", border: b.key ? "2px solid var(--amber)" : "none" }}>
                {b.t}
              </motion.div>
            ))}
          </AnimatePresence>
          {Array.from({ length: Math.max(0, CAP - used) }).map((_, k) => <div key={`e${k}`} style={{ flex: 1, borderRadius: 6, border: "1px dashed #1e6b52" }} />)}
        </div>
        <div style={{ position: "absolute", left: 10, right: 10, bottom: 4, display: "flex", gap: 3 }}>
          {Array.from({ length: 24 }).map((_, k) => <span key={k} style={{ flex: 1, height: 6, background: "#c9a227", borderRadius: 1, opacity: 0.8 }} />)}
        </div>
      </div>
      {fallen.length > 0 && (
        <div className="small" style={{ marginTop: 8, color: "var(--red)" }}>
          Sorti du contexte : {fallen.map((f) => `« ${f.t.slice(0, 26)}${f.t.length > 26 ? "…" : ""} »`).join(", ")}
        </div>
      )}
      <div className="row" style={{ marginTop: 12 }}>
        <button className="btn grow" onClick={send} disabled={i >= SCRIPT.length}>{i === 0 ? "Envoyer le 1er message" : i >= SCRIPT.length ? "Conversation terminée" : "Message suivant"}</button>
        <button className="btn subtle" onClick={reset} aria-label="Recommencer"><Icon name="refresh" size={18} /></button>
      </div>
      <label className="row" style={{ marginTop: 12, gap: 10, cursor: "pointer" }}>
        <input type="checkbox" checked={memory} onChange={(e) => { setMemory(e.target.checked); sfx("tap"); }} style={{ width: 20, height: 20, accentColor: "#a78bfa" }} />
        <span className="small">Activer une note de <b style={{ color: "var(--violet)" }}>mémoire</b> « Léa, fleuriste » (tu verras ce mécanisme à l'étape suivante)</span>
      </label>
      {i >= 5 && (
        <div style={{ marginTop: 12 }}>
          <button className="btn ghost block" onClick={() => { setAsked(true); sfx(nameKnown ? "ok" : "ko"); }}>Demander : « Au fait, comment je m'appelle ? »</button>
          {asked && (
            <motion.div className={`feedback ${nameKnown ? "ok" : "ko"}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <span className="tag">Réponse de l'IA</span>
              {nameKnown ? "« Tu t'appelles Léa, et tu es fleuriste ! »" : "« Je ne sais pas… tu ne me l'as pas dit ? » Le premier message est sorti du contexte : l'IA ne le voit plus."}
              {nameLost && memory && <div className="small" style={{ marginTop: 6 }}>Même si le message est sorti, la note de mémoire a été réinjectée : l'info est toujours là.</div>}
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}
