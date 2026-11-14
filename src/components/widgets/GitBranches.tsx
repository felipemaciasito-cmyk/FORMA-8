import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { sfx } from "../../lib/sound";
import { Icon } from "../Icon";

// Les branches de versions : une ligne principale (main), une branche d'essai,
// des commits (photos du projet) et une fusion. Tout se joue sans risque.
//
// Le simulateur grandit avec le joueur (règle « zéro zone de flou ») :
//  - mode « commits »  : seulement enregistrer des commits et relire leurs messages ;
//  - mode « branches » : en plus, créer une branche et la fusionner ;
//  - sans mode         : tout, y compris revenir en arrière.
// Chaque mode propose de petits défis, cochés automatiquement.
const MAIN_MSGS = ["Ajoute le titre", "Corrige une faute", "Ajoute le pied de page", "Change le texte d'accueil"];
const BRANCH_MSGS = ["Essaie un fond sombre", "Ajuste les couleurs", "Ajoute un bouton"];

type Mode = "commits" | "branches" | "full";
interface Commit { id: number; lane: 0 | 1; msg: string; parent?: number; parent2?: number; merge?: boolean; undo?: boolean }
interface State { commits: Commit[]; main: number; branch: number | null; branched: boolean; read: boolean }

const STEP = 40, Y = [34, 92];
const START: State = { commits: [{ id: 0, lane: 0, msg: "Crée la page d'accueil" }], main: 0, branch: null, branched: false, read: false };

const INTRO: Record<Mode, string> = {
  commits: "Chaque rond est un commit : une photo de ton projet, avec un message qui dit ce qui a changé.",
  branches: "La ligne du haut est main, la version principale. Crée une branche pour essayer une idée sans y toucher.",
  full: "Tout est permis ici : commits, branche, fusion, et retour en arrière. Rien n'est jamais effacé.",
};

function challenges(mode: Mode, s: State): { t: string; ok: boolean }[] {
  const onLane1 = s.commits.filter((c) => c.lane === 1).length;
  const merged = s.commits.some((c) => c.merge);
  if (mode === "commits") return [
    { t: "Enregistre 3 nouveaux commits", ok: s.commits.length >= 4 },
    { t: "Touche un rond pour relire son message", ok: s.read },
  ];
  if (mode === "branches") return [
    { t: "Crée une branche", ok: s.branched },
    { t: "Fais 2 commits sur la branche", ok: onLane1 >= 2 },
    { t: "Fusionne la branche dans main", ok: merged },
  ];
  return [
    { t: "Fusionne une branche dans main", ok: merged },
    { t: "Annule le dernier changement", ok: s.commits.some((c) => c.undo) },
    { t: "Relis un message : l'histoire est complète", ok: s.read },
  ];
}

export default function GitBranches({ mode: rawMode }: { mode?: string }) {
  const mode: Mode = rawMode === "commits" || rawMode === "branches" ? rawMode : "full";
  const [s, setS] = useState<State>(START);
  const [say, setSay] = useState(INTRO[mode]);
  const [sel, setSel] = useState<number | null>(null);
  const onBranch = s.branch !== null;
  const next = s.commits.length;
  const branchHasWork = onBranch && s.commits[s.branch!].lane === 1;
  const list = challenges(mode, s);
  const allDone = list.every((c) => c.ok);

  /** Applique un nouvel état, et salue le moment où tous les défis sont réussis. */
  const apply = (n: State, text: string) => {
    const wasDone = allDone;
    setS(n); setSay(text);
    if (!wasDone && challenges(mode, n).every((c) => c.ok)) sfx("badge");
  };

  const commit = () => {
    sfx("relay");
    setSel(null);
    if (onBranch) {
      const n = s.commits.filter((c) => c.lane === 1).length;
      apply({ ...s, commits: [...s.commits, { id: next, lane: 1, msg: BRANCH_MSGS[n % BRANCH_MSGS.length], parent: s.branch! }], branch: next },
        "Ce commit vit sur la branche d'essai : la version principale n'a pas bougé. Si l'essai rate, rien n'est cassé.");
    } else {
      const n = s.commits.filter((c) => c.lane === 0 && !c.merge).length;
      apply({ ...s, commits: [...s.commits, { id: next, lane: 0, msg: MAIN_MSGS[(n - 1) % MAIN_MSGS.length], parent: s.main }], main: next },
        mode === "commits" ? "Nouveau commit : une photo de plus dans l'historique. Chaque photo est gardée, avec son message."
          : "Nouveau commit sur main, la version principale. Chaque photo est gardée : on peut toujours revenir en arrière.");
    }
  };
  const openBranch = () => {
    sfx("open");
    setSel(null);
    apply({ ...s, branch: s.main, branched: true }, "Tu crées une branche : une copie de travail, à côté de main. Idéal pour essayer une idée sans risque.");
  };
  const merge = () => {
    if (!branchHasWork) return;
    sfx("power");
    setSel(null);
    apply({ ...s, commits: [...s.commits, { id: next, lane: 0, msg: "Fusionne l'essai dans main", parent: s.main, parent2: s.branch!, merge: true }], main: next, branch: null },
      "Fusion : les changements de la branche rejoignent main. Sur GitHub, on passe par une pull request pour relire avant de fusionner.");
  };
  const undo = () => {
    if (s.commits.length < 2) return;
    sfx("ko");
    setSel(null);
    const lane: 0 | 1 = branchHasWork ? 1 : 0;
    const head = lane === 1 ? s.branch! : s.main;
    apply({ ...s, commits: [...s.commits, { id: next, lane, msg: "Annule le dernier changement", parent: head, undo: true }], ...(lane === 1 ? { branch: next } : { main: next }) },
      "Revenir en arrière ne détruit rien : Git ajoute un nouveau commit qui annule le précédent. L'histoire reste complète.");
  };
  const read = (id: number) => {
    sfx("tap");
    setSel(id);
    const c = s.commits[id];
    apply({ ...s, read: true }, `Commit ${id + 1} sur ${s.commits.length} : « ${c.msg} ». ${c.merge ? "C'est un commit de fusion : il réunit deux lignes." : c.undo ? "Il annule le changement précédent, sans l'effacer de l'historique." : "Un bon message dit ce qui change, en quelques mots."}`);
  };
  const reset = () => { setS(START); setSel(null); setSay("On repart d'un projet tout neuf."); };

  const W = Math.max(320, s.commits.length * STEP + 40);
  const H = mode === "commits" ? 64 : 124; // une seule ligne en mode « commits »
  const pos = (id: number) => ({ x: 34 + id * STEP, y: Y[s.commits[id].lane] });
  const edge = (a: number, b: number, color: string, key: string) => {
    const p = pos(a), q = pos(b);
    const d = p.y === q.y ? `M${p.x} ${p.y}H${q.x}` : `M${p.x} ${p.y}C${p.x + 22} ${p.y} ${q.x - 22} ${q.y} ${q.x} ${q.y}`;
    return <motion.path key={key} d={d} fill="none" stroke={color} strokeWidth="2.4" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.45 }} />;
  };
  const head = s.commits[sel ?? s.commits.length - 1];

  return (
    <div>
      <div className="row" style={{ justifyContent: "space-between", marginBottom: 8 }}>
        <span className="mono small">HISTORIQUE · {s.commits.length} commit{s.commits.length > 1 ? "s" : ""}</span>
        {mode !== "commits" && <span className={`pill ${onBranch ? "amber" : "cyan"}`} style={{ whiteSpace: "nowrap" }}>{onBranch ? "Sur l'essai" : "Sur main"}</span>}
      </div>
      <div style={{ overflowX: "auto", borderRadius: 12, background: "#050912", border: "1px solid var(--line)" }}>
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-label="Graphe des commits">
          <text x="6" y="16" fill="var(--cyan)" style={{ font: "600 9px var(--mono)" }}>{mode === "commits" ? "ton projet" : "main"}</text>
          {mode !== "commits" && <text x="6" y="118" fill="var(--violet)" style={{ font: "600 9px var(--mono)" }}>essai</text>}
          {s.commits.map((c) => [
            c.parent !== undefined ? edge(c.parent, c.id, c.lane === 1 ? "var(--violet)" : "var(--cyan)", `e${c.id}`) : null,
            c.parent2 !== undefined ? edge(c.parent2, c.id, "var(--violet)", `m${c.id}`) : null,
          ])}
          <AnimatePresence>
            {s.commits.map((c) => {
              const { x, y } = pos(c.id);
              const color = c.merge ? "var(--led)" : c.undo ? "var(--amber)" : c.lane === 1 ? "var(--violet)" : "var(--cyan)";
              return (
                <motion.g key={c.id} initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ transformOrigin: `${x}px ${y}px` }}>
                  {sel === c.id && <circle cx={x} cy={y} r="13" fill="none" stroke="#fff" strokeWidth="1.2" strokeDasharray="3 3" />}
                  <circle cx={x} cy={y} r={c.merge ? 9 : 7} fill="#0b1222" stroke={color} strokeWidth="2.6" />
                  {c.merge && <circle cx={x} cy={y} r="3" fill="var(--led)" />}
                  {/* Zone de toucher large (40 px), pour le doigt. */}
                  <circle cx={x} cy={y} r="20" fill="transparent" role="button" tabIndex={0} aria-label={`Commit ${c.id + 1} : ${c.msg}`} style={{ cursor: "pointer", outline: "none" }}
                    onClick={() => read(c.id)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); read(c.id); } }} />
                </motion.g>
              );
            })}
          </AnimatePresence>
        </svg>
      </div>
      <div className="small" style={{ marginTop: 8, color: "var(--text-2)" }}>{sel === null ? "Dernier commit" : `Commit ${sel + 1}`} : <b>« {head.msg} »</b></div>
      <motion.div key={say} className="feedback info" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginTop: 10 }}>{say}</motion.div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 12 }}>
        <button className="btn small" style={mode === "commits" ? { gridColumn: "1 / -1" } : undefined} onClick={commit}><Icon name="check" size={16} /> Commit</button>
        {mode !== "commits" && <button className="btn small subtle" onClick={openBranch} disabled={onBranch}><Icon name="branch" size={16} /> Créer une branche</button>}
        {mode !== "commits" && <button className="btn small subtle" style={mode === "branches" ? { gridColumn: "1 / -1" } : undefined} onClick={merge} disabled={!branchHasWork}><Icon name="plus" size={16} /> Fusionner</button>}
        {mode === "full" && <button className="btn small subtle" onClick={undo} disabled={s.commits.length < 2}><Icon name="back" size={16} /> Revenir en arrière</button>}
      </div>
      <div style={{ marginTop: 12, padding: "10px 12px", borderRadius: 12, background: "#050912", border: "1px solid var(--line)" }}>
        <div className="mono small" style={{ color: allDone ? "var(--led)" : "var(--text-3)", marginBottom: 4 }}>{allDone ? "DÉFIS RÉUSSIS" : `DÉFIS · ${list.filter((c) => c.ok).length}/${list.length}`}</div>
        {list.map((c) => (
          <div key={c.t} className="small" style={{ display: "flex", gap: 8, alignItems: "center", margin: "5px 0", color: c.ok ? "var(--text)" : "var(--text-2)" }}>
            <span aria-hidden="true" style={{ flex: "none", width: 18, height: 18, borderRadius: 6, display: "grid", placeItems: "center", border: `1px solid ${c.ok ? "var(--led)" : "var(--line-strong)"}`, background: c.ok ? "var(--led)" : "transparent", color: "#002010" }}>{c.ok && <Icon name="check" size={12} stroke={2.6} />}</span>
            <span>{c.t}{c.ok ? " : fait" : ""}</span>
          </div>
        ))}
      </div>
      <button className="btn ghost small block" style={{ marginTop: 8 }} onClick={reset}><Icon name="refresh" size={16} /> Recommencer</button>
    </div>
  );
}
