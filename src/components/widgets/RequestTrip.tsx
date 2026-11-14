import { motion } from "motion/react";
import { useState } from "react";
import { sfx } from "../../lib/sound";
import { Icon, type IconId } from "../Icon";

// Le trajet d'une demande : du navigateur au serveur, et retour.
// Deux cas : un site statique (des fichiers déjà prêts) et une appli avec
// serveur et base de données (la page est fabriquée à la demande).

interface Node { id: string; label: string; icon: IconId }
interface Hop { from: number; to: number; say: string; color: string }

const MODES: Record<"static" | "dynamic", { title: string; nodes: Node[]; hops: Hop[] }> = {
  static: {
    title: "Site statique (comme FORMA-8 sur GitHub Pages)",
    nodes: [
      { id: "nav", label: "Ton navigateur", icon: "phone" },
      { id: "net", label: "Internet", icon: "globe" },
      { id: "srv", label: "Serveur de fichiers", icon: "server" },
    ],
    hops: [
      { from: 0, to: 1, say: "Tu tapes l'adresse. Le navigateur envoie une demande : « donne-moi la page d'accueil ».", color: "var(--cyan)" },
      { from: 1, to: 2, say: "Internet achemine la demande jusqu'au serveur qui héberge le site.", color: "var(--cyan)" },
      { from: 2, to: 1, say: "Le serveur renvoie des fichiers déjà prêts : HTML (le contenu), CSS (l'apparence), JavaScript (le comportement).", color: "var(--led)" },
      { from: 1, to: 0, say: "Le navigateur assemble les fichiers et affiche la page. Tout le reste se passe sur ton téléphone.", color: "var(--led)" },
    ],
  },
  dynamic: {
    title: "Appli avec serveur et base de données",
    nodes: [
      { id: "nav", label: "Ton navigateur", icon: "phone" },
      { id: "srv", label: "Serveur de l'appli", icon: "server" },
      { id: "db", label: "Base de données", icon: "db-lock" },
    ],
    hops: [
      { from: 0, to: 1, say: "Tu te connectes. Le navigateur envoie ton identifiant au serveur de l'appli.", color: "var(--cyan)" },
      { from: 1, to: 2, say: "Le serveur demande à la base de données : « quelles sont les données de ce compte ? »", color: "var(--violet)" },
      { from: 2, to: 1, say: "La base de données répond avec tes informations, et seulement les tiennes.", color: "var(--violet)" },
      { from: 1, to: 0, say: "Le serveur fabrique la réponse et la renvoie. Les secrets (clés, mots de passe) ne quittent jamais le serveur.", color: "var(--led)" },
    ],
  },
};

export default function RequestTrip() {
  const [mode, setMode] = useState<"static" | "dynamic">("static");
  const [k, setK] = useState(-1);
  const m = MODES[mode];
  const hop = k >= 0 ? m.hops[k] : null;
  const x = (i: number) => 14 + i * 36; // pourcentage horizontal de chaque étape

  const step = () => { sfx(k + 1 >= m.hops.length - 1 ? "ok" : "relay"); setK((v) => Math.min(m.hops.length - 1, v + 1)); };
  const switchMode = (v: "static" | "dynamic") => { sfx("tap"); setMode(v); setK(-1); };

  return (
    <div>
      <div className="row wrap-row" style={{ gap: 8, marginBottom: 12 }}>
        <button className={`chip ${mode === "static" ? "on" : ""}`} onClick={() => switchMode("static")}>Site statique</button>
        <button className={`chip ${mode === "dynamic" ? "on" : ""}`} onClick={() => switchMode("dynamic")}>Appli avec serveur</button>
      </div>
      <div className="mono small" style={{ marginBottom: 8 }}>{m.title.toUpperCase()}</div>
      <div style={{ position: "relative", height: 120, borderRadius: 12, background: "#050912", border: "1px solid var(--line)" }}>
        <div style={{ position: "absolute", left: "14%", right: "14%", top: 44, height: 2, background: "rgba(125,200,255,.15)" }} />
        {m.nodes.map((n, i) => {
          const active = hop && (hop.from === i || hop.to === i);
          return (
            <div key={n.id} style={{ position: "absolute", left: `${x(i)}%`, top: 20, width: 92, marginLeft: -46, textAlign: "center" }}>
              <motion.div animate={{ scale: active ? 1.08 : 1 }} style={{ width: 48, height: 48, margin: "0 auto", borderRadius: 14, display: "grid", placeItems: "center",
                background: "#0b1222", border: `1.5px solid ${active ? hop!.color : "var(--line-strong)"}`, color: active ? hop!.color : "var(--text-2)", boxShadow: active ? `0 0 16px ${hop!.color}` : "none" }}>
                <Icon name={n.icon} size={24} />
              </motion.div>
              <div className="small" style={{ marginTop: 6, fontSize: 12, lineHeight: 1.2 }}>{n.label}</div>
            </div>
          );
        })}
        {hop && (
          <motion.span key={`${mode}-${k}`} initial={{ left: `${x(hop.from)}%` }} animate={{ left: `${x(hop.to)}%` }} transition={{ duration: 0.9, ease: "easeInOut" }}
            style={{ position: "absolute", top: 38, width: 14, height: 14, marginLeft: -7, borderRadius: "50%", background: hop.color, boxShadow: `0 0 14px ${hop.color}` }} />
        )}
      </div>
      <motion.div key={`${mode}-${k}`} className={`feedback ${k === m.hops.length - 1 ? "ok" : "info"}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginTop: 12 }}>
        {hop ? <><span className="tag">Étape {k + 1} / {m.hops.length}</span>{hop.say}</> : "Touche « Envoyer la demande » pour suivre son trajet, étape par étape."}
      </motion.div>
      <div className="row" style={{ marginTop: 12 }}>
        <button className="btn grow" onClick={step} disabled={k >= m.hops.length - 1}>{k < 0 ? "Envoyer la demande" : k >= m.hops.length - 1 ? "Trajet terminé" : "Étape suivante"}</button>
        <button className="btn subtle" onClick={() => setK(-1)} aria-label="Recommencer"><Icon name="refresh" size={18} /></button>
      </div>
    </div>
  );
}
