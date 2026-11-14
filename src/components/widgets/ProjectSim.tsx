import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { sfx } from "../../lib/sound";
import { Icon } from "../Icon";

// Simulateur de Projet : ce que reçoit automatiquement chaque nouvelle conversation.
const FILES = [
  { id: "tarifs", name: "tarifs-2026.pdf", icon: "file-lines" },
  { id: "charte", name: "charte-graphique.pdf", icon: "palette" },
  { id: "devis", name: "modele-devis.docx", icon: "receipt" },
] as const;
const INSTR = "Tu assistes le cabinet Dupont. Vouvoiement. Toujours citer le document source.";

export default function ProjectSim() {
  const [files, setFiles] = useState<string[]>([]);
  const [instr, setInstr] = useState(false);
  const [convs, setConvs] = useState<{ id: number; inProject: boolean; snapshot: string[]; instr: boolean }[]>([]);
  const add = (id: string) => { sfx("relay"); setFiles((f) => (f.includes(id) ? f.filter((x) => x !== id) : [...f, id])); };
  const open = (inProject: boolean) => { sfx("open"); setConvs((c) => [{ id: Date.now(), inProject, snapshot: inProject ? files : [], instr: inProject && instr }, ...c].slice(0, 3)); };
  return (
    <div>
      <div className="panel" style={{ background: "rgba(59,232,255,.05)", borderStyle: "dashed" }}>
        <div className="panel-title" style={{ color: "var(--cyan)" }}><Icon name="folder-stack" size={16} /> Projet « Cabinet Dupont »</div>
        <button className={`choice ${instr ? "ok" : ""}`} onClick={() => { sfx("tap"); setInstr(!instr); }}>
          <span className="key">{instr ? <Icon name="check" size={14} stroke={2.4} /> : <Icon name="plus" size={14} stroke={2.2} />}</span>
          <span><b>Instructions</b><br /><span className="small muted">{INSTR}</span></span>
        </button>
        <div className="small muted" style={{ margin: "12px 0 6px" }}>Fichiers (touche pour les déposer) :</div>
        <div className="row wrap-row" style={{ gap: 8 }}>
          {FILES.map((f) => <button key={f.id} className={`chip ${files.includes(f.id) ? "on" : ""}`} onClick={() => add(f.id)}><Icon name={f.icon} size={17} /> {f.name}</button>)}
        </div>
      </div>
      <div className="row" style={{ marginTop: 12 }}>
        <button className="btn grow small" onClick={() => open(true)}>+ Conversation DANS le projet</button>
        <button className="btn ghost grow small" onClick={() => open(false)}>+ Conversation hors projet</button>
      </div>
      <div className="stack" style={{ marginTop: 12 }}>
        <AnimatePresence initial={false}>
          {convs.map((c) => (
            <motion.div key={c.id} layout initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="panel" style={{ padding: 12 }}>
              <div className="row small"><Icon name="chat" size={16} style={{ color: c.inProject ? "var(--cyan)" : "var(--text-3)" }} /><b className="grow">{c.inProject ? "Nouvelle conversation (projet)" : "Nouvelle conversation (hors projet)"}</b></div>
              <div className="mono small" style={{ marginTop: 8, color: "var(--text-3)" }}>CONTEXTE CHARGÉ AUTOMATIQUEMENT :</div>
              {!c.instr && c.snapshot.length === 0 ? (
                <div className="small" style={{ color: "var(--red)", marginTop: 4 }}>Rien. Il faudra tout réexpliquer : qui tu es, le client, les tarifs…</div>
              ) : (
                <div className="row wrap-row" style={{ gap: 6, marginTop: 6 }}>
                  {c.instr && <span className="pill led">Instructions</span>}
                  {c.snapshot.map((id) => <span key={id} className="pill cyan">{FILES.find((f) => f.id === id)?.name}</span>)}
                </div>
              )}
              {c.inProject && (c.instr || c.snapshot.length > 0) && <div className="small" style={{ marginTop: 8 }}>Tu peux écrire directement : « Prépare le devis de la boulangerie Martin. »</div>}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
