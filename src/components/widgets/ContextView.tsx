import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { sfx } from "../../lib/sound";
import { Icon } from "../Icon";

// « Ce que Claude voit » : la fenêtre de contexte d'une séance Claude Code se
// remplit (règles, demande, fichiers lus, résultats de commandes, échanges).
// Près de la limite, la conversation est résumée (compaction) : le fichier de
// règles est relu, mais une consigne donnée seulement dans la conversation peut
// se perdre. Source : code.claude.com/docs/fr/how-claude-code-works et context-window (vérifiées le 17/11/2026).
// Le nom « CLAUDE.md » n'apparaît pas ici : il n'est défini qu'au protocole suivant (règle zéro zone de flou).

type Kind = "regles" | "demande" | "fichier" | "commande" | "echange" | "resume";
interface Item { id: number; label: string; size: number; kind: Kind; pinned?: boolean }

const CAP = 100;
const COLORS: Record<Kind, string> = { regles: "var(--violet)", demande: "var(--cyan)", fichier: "#45f5cf", commande: "var(--amber)", echange: "#7aa7ff", resume: "#9fb3d1" };
const ADDS: { label: string; size: number; kind: Kind }[] = [
  { label: "Fichier lu : la page d'accueil", size: 14, kind: "fichier" },
  { label: "Fichier lu : la feuille de style", size: 12, kind: "fichier" },
  { label: "Résultat d'une commande : les tests", size: 16, kind: "commande" },
  { label: "Un échange avec toi", size: 8, kind: "echange" },
];

export default function ContextView() {
  const [inRules, setInRules] = useState(false);
  const start = (): Item[] => [
    { id: 1, label: "Règles du projet (fichier de règles)", size: 6, kind: "regles", pinned: true },
    ...(inRules ? [] : [{ id: 2, label: "Consigne dite au début : « réponds toujours en français »", size: 3, kind: "echange" as Kind }]),
    { id: 3, label: "Ta demande : « ajoute un bouton Contact »", size: 4, kind: "demande" },
  ];
  const [items, setItems] = useState<Item[]>(start);
  const [next, setNext] = useState(10);
  const [compacted, setCompacted] = useState(0);
  const [say, setSay] = useState("Ajoute ce que Claude lit pendant sa tâche, et regarde la fenêtre se remplir.");
  const used = items.reduce((a, b) => a + b.size, 0);
  const lostRule = compacted > 0 && !inRules;

  const add = (a: (typeof ADDS)[number]) => {
    sfx("relay");
    let list = [...items, { ...a, id: next }];
    setNext(next + 1);
    if (list.reduce((s, b) => s + b.size, 0) > CAP * 0.85) {
      // Compaction : tout ce qui n'est pas épinglé devient un court résumé.
      const kept = list.filter((b) => b.pinned);
      const summarized = list.filter((b) => !b.pinned).reduce((s, b) => s + b.size, 0);
      list = [...kept, { id: next + 1, label: "Résumé de la conversation jusqu'ici", size: Math.max(8, Math.round(summarized * 0.2)), kind: "resume" }];
      setNext(next + 2);
      setCompacted((c) => c + 1);
      sfx("power");
      setSay(inRules
        ? "Compaction : la conversation a été résumée pour faire de la place. Ta consigne était dans le fichier de règles : il est relu après le résumé, elle est toujours là."
        : "Compaction : la conversation a été résumée pour faire de la place. Ta consigne « réponds en français » n'était que dans la conversation : elle a pu se perdre dans le résumé.");
    } else setSay(`${a.label} : ${a.size} unités de plus dans la fenêtre.`);
    setItems(list);
  };
  const reset = (rules = inRules) => { setInRules(rules); setItems(() => { const s: Item[] = [{ id: 1, label: "Règles du projet (fichier de règles)", size: rules ? 7 : 6, kind: "regles", pinned: true }]; if (!rules) s.push({ id: 2, label: "Consigne dite au début : « réponds toujours en français »", size: 3, kind: "echange" }); s.push({ id: 3, label: "Ta demande : « ajoute un bouton Contact »", size: 4, kind: "demande" }); return s; }); setCompacted(0); setSay(rules ? "La consigne est maintenant écrite dans le fichier de règles. Remplis la fenêtre pour voir la différence." : "Remplis la fenêtre pour voir ce qui se passe près de la limite."); };

  return (
    <div>
      <div className="row" style={{ justifyContent: "space-between", marginBottom: 8 }}>
        <span className="mono small">FENÊTRE DE CONTEXTE · {used}/{CAP}</span>
        <span className={`pill ${used > CAP * 0.7 ? "amber" : "cyan"}`}>{compacted ? `${compacted} compaction${compacted > 1 ? "s" : ""}` : used > CAP * 0.7 ? "Bientôt pleine" : "Place libre"}</span>
      </div>
      <div style={{ borderRadius: 12, background: "#050912", border: "1px solid var(--line)", padding: 8, minHeight: 210, display: "flex", flexDirection: "column", gap: 4 }}>
        <AnimatePresence initial={false}>
          {items.map((b) => (
            <motion.div key={b.id} layout initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ type: "spring", stiffness: 300, damping: 26 }}
              style={{ flexBasis: b.size * 2, minHeight: 22, borderRadius: 8, padding: "3px 8px", background: `color-mix(in srgb, ${COLORS[b.kind]} 22%, #0b1222)`, border: `1px solid ${COLORS[b.kind]}`, fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}>
              {b.pinned && <Icon name="lock" size={12} />}<span className="grow">{b.label}</span><span className="mono" style={{ fontSize: 10, color: "var(--text-3)" }}>{b.size}</span>
            </motion.div>
          ))}
        </AnimatePresence>
        <div style={{ flex: 1, borderRadius: 8, border: "1px dashed var(--line-strong)", minHeight: 16, display: "grid", placeItems: "center", fontSize: 11, color: "var(--text-3)" }}>{CAP - used} unités libres</div>
      </div>
      <motion.div key={say} className={`feedback ${lostRule ? "ko" : compacted ? "ok" : "info"}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginTop: 10 }}>{say}</motion.div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 10 }}>
        {ADDS.map((a) => <button key={a.label} className="btn small subtle" onClick={() => add(a)}>{a.label.replace("Fichier lu : ", "Lire ").replace("Résultat d'une commande : ", "Lancer ")}</button>)}
      </div>
      <label className="row" style={{ marginTop: 12, gap: 10, cursor: "pointer" }}>
        <input type="checkbox" checked={inRules} onChange={(e) => { sfx("tap"); reset(e.target.checked); }} style={{ width: 20, height: 20, accentColor: "#a78bfa" }} />
        <span className="small">Écrire « réponds toujours en français » dans le fichier de règles, plutôt que dans la conversation</span>
      </label>
      <button className="btn ghost small block" style={{ marginTop: 8 }} onClick={() => { sfx("tap"); reset(); }}><Icon name="refresh" size={16} /> Recommencer</button>
    </div>
  );
}
