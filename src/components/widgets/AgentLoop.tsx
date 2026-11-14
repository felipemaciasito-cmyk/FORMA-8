import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { sfx } from "../../lib/sound";
import { Icon } from "../Icon";

// La boucle d'agent, rejouée sur l'exemple des factures du mois.
const STAGES = ["Objectif", "Plan", "Action", "Observation", "Vérification"];
const TAGS = ["BUT", "PLAN", "ACTION", "OBS", "VÉRIF"];
type LogKind = "note" | "tool" | "ok";
const RUN: { stage: number; kind: LogKind; log: string; needsHuman?: boolean }[] = [
  { stage: 0, kind: "note", log: "Objectif : envoyer au comptable le récap des factures du mois." },
  { stage: 1, kind: "note", log: "Plan : 1) trouver les factures 2) les classer 3) faire le récap 4) envoyer." },
  { stage: 2, kind: "tool", log: "rechercher_mails(\"facture\", ce mois-ci)" },
  { stage: 3, kind: "ok", log: "Lu les 12 factures du mois" },
  { stage: 2, kind: "tool", log: "drive.ranger(12 fichiers, \"Factures › Novembre\")" },
  { stage: 3, kind: "ok", log: "Classé dans Drive › Factures" },
  { stage: 2, kind: "tool", log: "créer_document(\"Récapitulatif novembre\")" },
  { stage: 3, kind: "ok", log: "Préparé le récapitulatif (total, TVA, fournisseurs)" },
  { stage: 4, kind: "note", log: "Vérification : 12 factures = 12 lignes. Total cohérent." },
  { stage: 2, kind: "tool", log: "envoyer_mail(comptable, récap + 12 pièces jointes)", needsHuman: true },
  { stage: 3, kind: "ok", log: "Envoyé au comptable" },
  { stage: 4, kind: "note", log: "Objectif atteint. Fin de la boucle." },
];

export default function AgentLoop() {
  const [i, setI] = useState(-1);
  const [human, setHuman] = useState(true);
  const [waiting, setWaiting] = useState(false);
  const [running, setRunning] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  const stage = i >= 0 ? RUN[Math.min(i, RUN.length - 1)].stage : -1;

  useEffect(() => {
    if (!running || waiting) return;
    if (i >= RUN.length - 1) { setRunning(false); sfx("ok"); return; }
    timer.current = window.setTimeout(() => {
      const next = RUN[i + 1];
      if (next.needsHuman && human) { setWaiting(true); sfx("alarm"); return; }
      setI(i + 1); sfx("relay");
    }, 900);
    return () => clearTimeout(timer.current);
  }, [i, running, waiting, human]);

  const start = () => { setI(0); setWaiting(false); setRunning(true); sfx("power"); };
  const approve = () => { setWaiting(false); setI((x) => x + 1); sfx("ok"); };
  const R = 82, cx = 110, cy = 110;
  return (
    <div>
      <div style={{ display: "grid", placeItems: "center" }}>
        <svg width="240" height="250" viewBox="-10 -24 240 250" aria-label="Boucle d'agent">
          <circle cx={cx} cy={cy} r={R} fill="none" stroke="rgba(125,200,255,.15)" strokeWidth="2" strokeDasharray="4 6" />
          {running && <circle cx={cx} cy={cy} r={R} fill="none" stroke="var(--cyan)" strokeWidth="2" strokeDasharray="20 500" style={{ transformOrigin: "110px 110px", animation: "spin 2.4s linear infinite" }} />}
          {STAGES.map((s, k) => {
            const a = (k / STAGES.length) * Math.PI * 2 - Math.PI / 2;
            const x = cx + R * Math.cos(a), y = cy + R * Math.sin(a);
            const on = k === stage;
            return (
              <g key={s}>
                <motion.circle cx={x} cy={y} r={on ? 22 : 17} fill={on ? "var(--cyan)" : "#0e1729"} stroke={on ? "#fff" : "rgba(125,200,255,.3)"} animate={{ r: on ? 22 : 17 }} style={{ filter: on ? "drop-shadow(0 0 10px var(--cyan))" : undefined }} />
                <text x={x} y={y + 4} textAnchor="middle" fill={on ? "#00141c" : "#a9b8d3"} style={{ font: "700 9px var(--mono)" }}>{k + 1}</text>
                <text x={x} y={y + (y > cy ? 36 : -28)} textAnchor="middle" fill={on ? "var(--cyan)" : "#6b7a96"} style={{ font: "600 10px var(--font)" }}>{s}</text>
              </g>
            );
          })}
          <text x={cx} y={cy - 4} textAnchor="middle" fill="#e7f0ff" style={{ font: "700 13px var(--font)" }}>AGENT</text>
          <text x={cx} y={cy + 12} textAnchor="middle" fill="#6b7a96" style={{ font: "600 9px var(--mono)" }}>{i >= 0 ? `tour ${Math.max(1, RUN.slice(0, i + 1).filter((r) => r.stage === 2).length)}` : "en attente"}</text>
        </svg>
      </div>
      <label className="row" style={{ gap: 10, margin: "4px 0 12px", cursor: "pointer" }}>
        <input type="checkbox" checked={human} onChange={(e) => setHuman(e.target.checked)} style={{ width: 20, height: 20, accentColor: "#ffb547" }} disabled={running} />
        <span className="small">Exiger ma <b style={{ color: "var(--amber)" }}>validation</b> avant tout envoi à l'extérieur</span>
      </label>
      <button className="btn block" onClick={start} disabled={running}>{i < 0 ? <><Icon name="play" size={16} /> Lancer l'agent</> : running ? "Agent en cours…" : <><Icon name="refresh" size={18} /> Relancer</>}</button>
      <div className="code-block" style={{ marginTop: 12, minHeight: 120, maxHeight: 260, overflowY: "auto" }}>
        <AnimatePresence initial={false}>
          {RUN.slice(0, i + 1).map((r, k) => (
            <motion.div key={k} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} style={{ color: r.kind === "ok" ? "var(--led)" : r.kind === "tool" ? "var(--amber)" : undefined }}>
              <span style={{ color: "var(--text-3)" }}>[{TAGS[r.stage]}]</span>{" "}
              {r.kind !== "note" && <Icon name={r.kind === "ok" ? "check" : "wrench"} size={13} stroke={2} className="ico" style={{ marginRight: 5 }} />}
              {r.log}
            </motion.div>
          ))}
        </AnimatePresence>
        {i < 0 && <span className="dim">Journal vide. Lance l'agent.</span>}
      </div>
      <AnimatePresence>
        {waiting && (
          <motion.div className="panel" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ marginTop: 12, borderColor: "var(--amber)", background: "rgba(255,181,71,.08)" }}>
            <div className="panel-title" style={{ color: "var(--amber)" }}><Icon name="user-check" size={16} /> Validation humaine requise</div>
            « J'ai préparé le mail au comptable avec le récapitulatif et les 12 factures. Je l'envoie ? »
            <div className="row" style={{ marginTop: 10 }}>
              <button className="btn small led grow" onClick={approve}>Oui, envoyer</button>
              <button className="btn small ghost grow" onClick={() => { setWaiting(false); setRunning(false); sfx("ko"); }}>Non, j'ajuste</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
