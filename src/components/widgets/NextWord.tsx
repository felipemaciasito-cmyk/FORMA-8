import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { sfx } from "../../lib/sound";

// Joue le rôle du modèle : choisis la suite la plus probable, mot après mot.
type Node = { options: { w: string; p: number; next?: Node }[] };

const END: Node = { options: [] };
const TREE: Node = {
  options: [
    { w: "facture", p: 46, next: { options: [
      { w: "est", p: 52, next: { options: [{ w: "en retard", p: 61, next: END }, { w: "payée", p: 27, next: END }, { w: "bleue", p: 2, next: END }] } },
      { w: "du", p: 31, next: { options: [{ w: "mois", p: 58, next: END }, { w: "client", p: 33, next: END }, { w: "dragon", p: 1, next: END }] } },
      { w: "chante", p: 1, next: END },
    ] } },
    { w: "réunion", p: 29, next: { options: [
      { w: "commence", p: 44, next: { options: [{ w: "à 9 h", p: 63, next: END }, { w: "bientôt", p: 30, next: END }, { w: "en volant", p: 1, next: END }] } },
      { w: "est", p: 38, next: { options: [{ w: "annulée", p: 55, next: END }, { w: "reportée", p: 39, next: END }, { w: "verte", p: 1, next: END }] } },
      { w: "mange", p: 1, next: END },
    ] } },
    { w: "girafe", p: 2, next: { options: [{ w: "comptable", p: 40, next: END }, { w: "est", p: 50, next: END }, { w: "(?)", p: 10, next: END }] } },
  ],
};

export default function NextWord() {
  const [words, setWords] = useState<string[]>(["La"]);
  const [node, setNode] = useState<Node>(TREE);
  const [mode, setMode] = useState<"toi" | "auto">("toi");
  const pick = (i: number) => {
    const o = node.options[i];
    sfx("tap");
    setWords((w) => [...w, o.w]);
    setNode(o.next ?? END);
  };
  const auto = () => {
    // Tirage pondéré, comme un modèle qui n'est pas obligé de prendre toujours le premier choix.
    const total = node.options.reduce((a, o) => a + o.p, 0);
    let r = Math.random() * total;
    const i = node.options.findIndex((o) => (r -= o.p) <= 0);
    pick(i < 0 ? 0 : i);
  };
  const reset = () => { setWords(["La"]); setNode(TREE); };
  const ended = node.options.length === 0;
  return (
    <div>
      <div className="code-block" style={{ fontSize: 18, minHeight: 58, fontFamily: "var(--font)" }}>
        {words.map((w, i) => (
          <motion.span key={i + w} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} style={{ marginRight: 6, color: i === words.length - 1 && i > 0 ? "var(--cyan)" : undefined }}>{w}</motion.span>
        ))}
        {!ended && <span className="caret" />}
        {ended && <span style={{ color: "var(--text-3)" }}>.</span>}
      </div>
      <div className="seg" style={{ margin: "12px 0" }}>
        <button className={mode === "toi" ? "on" : ""} style={{ background: mode === "toi" ? "var(--cyan)" : undefined }} onClick={() => setMode("toi")}><span>Tu choisis</span></button>
        <button className={mode === "auto" ? "on" : ""} style={{ background: mode === "auto" ? "var(--cyan)" : undefined }} onClick={() => setMode("auto")}><span>Le modèle tire au sort</span></button>
      </div>
      <AnimatePresence mode="wait">
        {!ended ? (
          <motion.div key={words.length} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="stack">
            <div className="mono small dim">Suites possibles et leur probabilité :</div>
            {node.options.map((o, i) => (
              <button key={o.w} className="choice" onClick={() => mode === "toi" ? pick(i) : undefined} style={{ alignItems: "center", opacity: mode === "auto" ? 0.85 : 1 }} disabled={mode === "auto"}>
                <span style={{ width: 92, fontWeight: 700 }}>{o.w}</span>
                <span className="grow progress" style={{ height: 10 }}><motion.i initial={{ width: 0 }} animate={{ width: `${o.p}%` }} transition={{ duration: 0.6, delay: i * 0.08 }} style={{ background: o.p > 20 ? "var(--cyan)" : "var(--red)" }} /></span>
                <span className="mono" style={{ width: 46, textAlign: "right" }}>{o.p} %</span>
              </button>
            ))}
            {mode === "auto" && <button className="btn block" onClick={auto}>Prédire le mot suivant</button>}
          </motion.div>
        ) : (
          <motion.div key="end" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="feedback info"><span className="tag">Ce qui vient de se passer</span>
              Tu as écrit une phrase en choisissant, à chaque étape, parmi des suites plus ou moins probables. C'est exactement ce que fait un modèle de langage, des milliers de fois par réponse. Les suites absurdes existent, mais leur probabilité est si faible qu'elles sortent rarement.
            </div>
            <button className="btn subtle block" style={{ marginTop: 10 }} onClick={reset}>Recommencer</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
