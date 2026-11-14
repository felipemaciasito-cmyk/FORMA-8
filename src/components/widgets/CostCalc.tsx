import { motion } from "motion/react";
import { useState } from "react";
import { sfx } from "../../lib/sound";

// Calculateur de coût de l'API Claude : combien coûte une fonctionnalité d'IA
// pour toi seul, puis pour tous les utilisateurs de ton produit.
// Tarifs officiels vérifiés le 14/11/2026 (en dollars par million de tokens) :
// https://platform.claude.com/docs/en/about-claude/pricing
const MODELS = [
  { id: "opus", label: "Opus 5.5", input: 4, output: 20 },
  { id: "sonnet", label: "Sonnet 5.5", input: 2, output: 10 },
  { id: "haiku", label: "Haiku 5.5", input: 0.1, output: 0.5 },
];
const CHECKED = "14/11/2026";

const fmt = (v: number) => (v < 0.01 ? "< 0,01 $" : `${v.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} $`);

/** Curseur défini hors du composant : il n'est pas recréé à chaque mouvement du doigt. */
function Slider({ label, value, min, max, step, onChange, unit }: { label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void; unit: string }) {
  return (
    <label className="field" style={{ marginTop: 10 }}>
      <span className="row" style={{ justifyContent: "space-between" }}><span>{label}</span><span className="mono" style={{ color: "var(--cyan)" }}>{value.toLocaleString("fr-FR")} {unit}</span></span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} style={{ width: "100%", accentColor: "#3be8ff" }} />
    </label>
  );
}

export default function CostCalc() {
  const [model, setModel] = useState(MODELS[0]);
  const [calls, setCalls] = useState(6);
  const [days, setDays] = useState(30);
  const [inTok, setInTok] = useState(3000);
  const [outTok, setOutTok] = useState(1500);
  const [users, setUsers] = useState(1);
  const [cap, setCap] = useState(10);

  const perCall = (inTok * model.input + outTok * model.output) / 1_000_000;
  const monthly = perCall * calls * days * users;
  const over = monthly > cap;

  return (
    <div>
      <div className="row wrap-row" style={{ gap: 6 }}>
        {MODELS.map((m) => <button key={m.id} className={`chip ${model.id === m.id ? "on" : ""}`} onClick={() => { sfx("tap"); setModel(m); }}>{m.label}</button>)}
      </div>
      <div className="small dim" style={{ marginTop: 6 }}>{model.label} : {model.input.toLocaleString("fr-FR")} $ par million de tokens envoyés, {model.output.toLocaleString("fr-FR")} $ par million reçus (tarifs vérifiés le {CHECKED}, à revérifier).</div>
      <Slider label="Appels à Claude par séance" value={calls} min={1} max={30} step={1} onChange={setCalls} unit="" />
      <Slider label="Séances par mois" value={days} min={1} max={60} step={1} onChange={setDays} unit="" />
      <Slider label="Tokens envoyés par appel" value={inTok} min={500} max={20000} step={500} onChange={setInTok} unit="" />
      <Slider label="Tokens reçus par appel" value={outTok} min={200} max={8000} step={100} onChange={setOutTok} unit="" />
      <Slider label="Nombre d'utilisateurs" value={users} min={1} max={1000} step={users < 20 ? 1 : 10} onChange={setUsers} unit="" />
      <Slider label="Ton plafond de dépense mensuel" value={cap} min={1} max={200} step={1} onChange={setCap} unit="$" />

      <div className="panel" style={{ marginTop: 14, background: "#050912", textAlign: "center" }}>
        <div className="mono small">COÛT ESTIMÉ PAR MOIS</div>
        <motion.div key={monthly.toFixed(2)} initial={{ scale: 1.08 }} animate={{ scale: 1 }} className="mono" style={{ fontSize: 30, margin: "6px 0", color: over ? "var(--red)" : "var(--led)" }}>{fmt(monthly)}</motion.div>
        <div className="small muted">soit {fmt(perCall)} par appel{users > 1 ? `, pour ${users.toLocaleString("fr-FR")} utilisateurs` : ""}</div>
      </div>
      <div className={`feedback ${over ? "ko" : "ok"}`}>
        {over
          ? `Au-delà de ton plafond de ${cap} $ : l'API serait coupée en cours de mois. Choisis un modèle moins cher, réduis la taille des demandes, ou relève le plafond en connaissance de cause.`
          : "Sous ton plafond. Rappel : c'est une estimation ; la Console Claude affiche la consommation réelle."}
      </div>
    </div>
  );
}
