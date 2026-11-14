import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { sfx } from "../../lib/sound";
import { Icon } from "../Icon";

// Les branches de versions : une ligne principale (main), une branche d'essai,
// des commits (photos du projet) et une fusion. Tout se joue sans risque.
const MAIN_MSGS = ["Ajoute le titre", "Corrige une faute", "Ajoute le pied de page", "Change le texte d'accueil"];
const BRANCH_MSGS = ["Essaie un fond sombre", "Ajuste les couleurs", "Ajoute un bouton"];

interface Commit { id: number; lane: 0 | 1; msg: string; parent?: number; parent2?: number; merge?: boolean }
interface State { commits: Commit[]; main: number; branch: number | null }

const STEP = 40, Y = [34, 92];
const START: State = { commits: [{ id: 0, lane: 0, msg: "Crée la page d'accueil" }], main: 0, branch: null };

export default function GitBranches() {
  const [s, setS] = useState<State>(START);
  const [say, setSay] = useState("Chaque rond est un commit : une photo de ton projet, avec un message qui dit ce qui a changé.");
  const onBranch = s.branch !== null;
  const next = s.commits.length;
  const branchHasWork = onBranch && s.commits[s.branch!].lane === 1;

  const commit = () => {
    sfx("relay");
    if (onBranch) {
      const n = s.commits.filter((c) => c.lane === 1).length;
      setS({ ...s, commits: [...s.commits, { id: next, lane: 1, msg: BRANCH_MSGS[n % BRANCH_MSGS.length], parent: s.branch! }], branch: next });
      setSay("Ce commit vit sur la branche d'essai : la version principale n'a pas bougé. Si l'essai rate, rien n'est cassé.");
    } else {
      const n = s.commits.filter((c) => c.lane === 0 && !c.merge).length;
      setS({ ...s, commits: [...s.commits, { id: next, lane: 0, msg: MAIN_MSGS[(n - 1) % MAIN_MSGS.length], parent: s.main }], main: next });
      setSay("Nouveau commit sur main, la version principale. Chaque photo est gardée : on peut toujours revenir en arrière.");
    }
  };
  const openBranch = () => {
    sfx("open");
    setS({ ...s, branch: s.main });
    setSay("Tu crées une branche : une copie de travail, à côté de main. Idéal pour essayer une idée sans risque.");
  };
  const merge = () => {
    if (!branchHasWork) return;
    sfx("power");
    setS({ commits: [...s.commits, { id: next, lane: 0, msg: "Fusionne l'essai dans main", parent: s.main, parent2: s.branch!, merge: true }], main: next, branch: null });
    setSay("Fusion : les changements de la branche rejoignent main. Sur GitHub, on passe par une pull request pour relire avant de fusionner.");
  };
  const undo = () => {
    if (s.commits.length < 2) return;
    sfx("ko");
    const lane: 0 | 1 = branchHasWork ? 1 : 0;
    const head = lane === 1 ? s.branch! : s.main;
    setS({ ...s, commits: [...s.commits, { id: next, lane, msg: "Annule le dernier changement", parent: head }], ...(lane === 1 ? { branch: next } : { main: next }) });
    setSay("Revenir en arrière ne détruit rien : Git ajoute un nouveau commit qui annule le précédent. L'histoire reste complète.");
  };
  const reset = () => { setS(START); setSay("On repart d'un projet tout neuf."); };

  const W = Math.max(320, s.commits.length * STEP + 40);
  const pos = (id: number) => ({ x: 34 + id * STEP, y: Y[s.commits[id].lane] });
  const edge = (a: number, b: number, color: string, key: string) => {
    const p = pos(a), q = pos(b);
    const d = p.y === q.y ? `M${p.x} ${p.y}H${q.x}` : `M${p.x} ${p.y}C${p.x + 22} ${p.y} ${q.x - 22} ${q.y} ${q.x} ${q.y}`;
    return <motion.path key={key} d={d} fill="none" stroke={color} strokeWidth="2.4" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.45 }} />;
  };
  const head = s.commits[s.commits.length - 1];

  return (
    <div>
      <div className="row" style={{ justifyContent: "space-between", marginBottom: 8 }}>
        <span className="mono small">HISTORIQUE · {s.commits.length} commit{s.commits.length > 1 ? "s" : ""}</span>
        <span className={`pill ${onBranch ? "amber" : "cyan"}`}>{onBranch ? "Sur la branche d'essai" : "Sur main"}</span>
      </div>
      <div style={{ overflowX: "auto", borderRadius: 12, background: "#050912", border: "1px solid var(--line)" }}>
        <svg width={W} height="124" viewBox={`0 0 ${W} 124`} aria-label="Graphe des commits">
          <text x="6" y="16" fill="var(--cyan)" style={{ font: "600 9px var(--mono)" }}>main</text>
          <text x="6" y="118" fill="var(--violet)" style={{ font: "600 9px var(--mono)" }}>essai</text>
          {s.commits.map((c) => [
            c.parent !== undefined ? edge(c.parent, c.id, c.lane === 1 ? "var(--violet)" : "var(--cyan)", `e${c.id}`) : null,
            c.parent2 !== undefined ? edge(c.parent2, c.id, "var(--violet)", `m${c.id}`) : null,
          ])}
          <AnimatePresence>
            {s.commits.map((c) => {
              const { x, y } = pos(c.id);
              return (
                <motion.g key={c.id} initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ transformOrigin: `${x}px ${y}px` }}>
                  <circle cx={x} cy={y} r={c.merge ? 9 : 7} fill="#0b1222" stroke={c.merge ? "var(--led)" : c.lane === 1 ? "var(--violet)" : "var(--cyan)"} strokeWidth="2.6" />
                  {c.merge && <circle cx={x} cy={y} r="3" fill="var(--led)" />}
                </motion.g>
              );
            })}
          </AnimatePresence>
        </svg>
      </div>
      <div className="small" style={{ marginTop: 8, color: "var(--text-2)" }}>Dernier commit : <b>« {head.msg} »</b></div>
      <motion.div key={say} className="feedback info" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginTop: 10 }}>{say}</motion.div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 12 }}>
        <button className="btn small" onClick={commit}><Icon name="check" size={16} /> Commit</button>
        <button className="btn small subtle" onClick={openBranch} disabled={onBranch}><Icon name="branch" size={16} /> Créer une branche</button>
        <button className="btn small subtle" onClick={merge} disabled={!branchHasWork}><Icon name="plus" size={16} /> Fusionner</button>
        <button className="btn small subtle" onClick={undo} disabled={s.commits.length < 2}><Icon name="back" size={16} /> Revenir en arrière</button>
      </div>
      <button className="btn ghost small block" style={{ marginTop: 8 }} onClick={reset}><Icon name="refresh" size={16} /> Recommencer</button>
    </div>
  );
}
