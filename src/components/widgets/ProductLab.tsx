import { motion } from "motion/react";
import { useState } from "react";
import type { ProductIdea } from "../../lib/claude";
import { addEnergy, fx } from "../../lib/game";
import { loadClaude } from "../../lib/models";
import { sfx } from "../../lib/sound";
import { getState, updateProgress, useProgress, useSettings } from "../../lib/store";
import { Icon } from "../Icon";

// Laboratoire produit : noter trois idées sur cinq critères, puis choisir son
// produit fil rouge (enregistré dans la progression, synchronisé).

const CRITERIA = [
  { id: "utile", label: "Utile", hint: "Le problème est réel, et il revient souvent." },
  { id: "faisable", label: "Faisable", hint: "Ça peut commencer par un simple site, construit depuis ton iPhone." },
  { id: "cout", label: "Peu coûteux", hint: "Pas besoin de matériel ni de services chers pour démarrer." },
  { id: "metier", label: "Potentiel", hint: "Des gens l'utiliseraient, voire paieraient pour." },
  { id: "envie", label: "Envie", hint: "Tu as vraiment envie d'y passer des mois." },
];
interface Idea { name: string; pitch: string; scores: Record<string, number> }
const EMPTY: Idea = { name: "", pitch: "", scores: {} };
const DRAFT = "forma8:brouillon:laboratoire-produit";

function load(): Idea[] {
  try { const v = JSON.parse(localStorage.getItem(DRAFT) ?? "null"); if (Array.isArray(v) && v.length === 3) return v; } catch { /* brouillon illisible */ }
  return [{ ...EMPTY }, { ...EMPTY }, { ...EMPTY }];
}

export default function ProductLab() {
  const p = useProgress();
  const s = useSettings();
  const [ideas, setIdeasState] = useState<Idea[]>(load);
  const setIdeas = (v: Idea[]) => { setIdeasState(v); try { localStorage.setItem(DRAFT, JSON.stringify(v)); } catch { /* stockage indisponible */ } };
  const [interests, setInterests] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const total = (i: Idea) => CRITERIA.reduce((a, c) => a + (i.scores[c.id] ?? 0), 0);
  const complete = (i: Idea) => i.name.trim() && i.pitch.trim() && CRITERIA.every((c) => i.scores[c.id]);
  const best = ideas.map((i, k) => ({ k, t: total(i), ok: complete(i) })).filter((x) => x.ok).sort((a, b) => b.t - a.t)[0];

  const patch = (k: number, v: Partial<Idea>) => setIdeas(ideas.map((x, i) => (i === k ? { ...x, ...v, scores: { ...x.scores, ...(v.scores ?? {}) } } : x)));
  const suggest = async () => {
    setLoading(true); setError("");
    try {
      const { suggestIdeas } = await loadClaude();
      const out: ProductIdea[] = await suggestIdeas(interests);
      setIdeas(ideas.map((x, i) => (out[i] && !x.name.trim() ? { name: out[i].name, pitch: out[i].pitch, scores: {} } : x)));
      sfx("ok");
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setLoading(false); }
  };
  const choose = (k: number) => {
    const i = ideas[k];
    const first = !getState().progress.product.name;
    updateProgress((d) => { d.product = { ...d.product, name: i.name.trim(), pitch: i.pitch.trim() }; });
    sfx("power"); fx({ type: "burst", color: "#3be8ff" });
    if (first) addEnergy(30, "produit choisi");
  };

  return (
    <div>
      {p.product.name && (
        <div className="feedback ok" style={{ marginTop: 0, marginBottom: 12 }}><span className="tag">Ton produit</span><b>{p.product.name}</b>{p.product.pitch ? ` : ${p.product.pitch}` : ""}<div className="small muted" style={{ marginTop: 4 }}>Tu peux encore en changer ici, ou dans l'écran de l'équipe.</div></div>
      )}
      <details style={{ marginBottom: 12 }}>
        <summary className="small" style={{ color: "var(--cyan)", cursor: "pointer" }}>Besoin d'idées ? Demande à Claude</summary>
        <textarea className="input" rows={3} style={{ marginTop: 8 }} value={interests} onChange={(e) => setInterests(e.target.value)} placeholder="Ce qui t'intéresse, ton métier, les problèmes que tu vois autour de toi…" />
        {s.apiKey
          ? <button className="btn small block" style={{ marginTop: 8 }} disabled={interests.trim().length < 15 || loading} onClick={suggest}>{loading ? "Claude réfléchit…" : "Proposer 3 idées dans les cases vides"}</button>
          : <div className="small dim" style={{ marginTop: 6 }}>Ajoute ta clé API dans les Réglages pour cette aide. Tu peux aussi remplir les idées toi-même.</div>}
        {error && <div className="feedback ko">{error}</div>}
      </details>
      <div className="stack">
        {ideas.map((i, k) => (
          <motion.div key={k} className="panel" style={{ marginTop: 0, borderColor: best?.k === k ? "rgba(77,255,160,.5)" : undefined }} layout>
            <div className="row"><span className="mono small grow">IDÉE {k + 1}</span><span className="mono" style={{ color: "var(--cyan)" }}>{total(i)} / 25</span></div>
            <input className="input" style={{ marginTop: 8 }} value={i.name} maxLength={40} onChange={(e) => patch(k, { name: e.target.value })} placeholder="Nom de l'idée" aria-label={`Nom de l'idée ${k + 1}`} />
            <input className="input" style={{ marginTop: 8 }} value={i.pitch} maxLength={140} onChange={(e) => patch(k, { pitch: e.target.value })} placeholder="Pour qui, pour quoi ?" aria-label={`Pour qui, pour quoi, idée ${k + 1}`} />
            {CRITERIA.map((c) => (
              <div key={c.id} style={{ marginTop: 10 }}>
                <div className="small"><b>{c.label}</b> <span className="dim">{c.hint}</span></div>
                <div className="row" style={{ gap: 6, marginTop: 4 }}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button key={n} className={`chip ${i.scores[c.id] === n ? "on" : ""}`} style={{ flex: 1, padding: "6px 0" }} aria-label={`${c.label} : ${n} sur 5, idée ${k + 1}`}
                      onClick={() => { sfx("tap"); patch(k, { scores: { [c.id]: n } }); }}>{n}</button>
                  ))}
                </div>
              </div>
            ))}
            <button className="btn small block" style={{ marginTop: 12 }} disabled={!complete(i)} onClick={() => choose(k)}>
              <Icon name="rocket" size={16} /> {p.product.name === i.name.trim() && i.name.trim() ? "Produit choisi" : "Choisir ce produit"}
            </button>
          </motion.div>
        ))}
      </div>
      {best && <div className="small dim" style={{ marginTop: 10 }}>L'idée la mieux notée est l'idée {best.k + 1}. La note aide à décider : c'est toi qui choisis.</div>}
    </div>
  );
}
