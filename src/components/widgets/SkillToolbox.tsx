import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { sfx } from "../../lib/sound";
import { Icon } from "../Icon";

// « La boîte à outils de l'équipe » : au début d'une séance, Claude ne voit que
// la DESCRIPTION de chaque Skill (quelques mots). Le contenu complet n'est chargé
// que lorsqu'une demande correspond à une description. Une description vague
// fait que le Skill n'est jamais choisi.
// Source : code.claude.com/docs/fr/skills et how-claude-code-works (vérifiées le 14/11/2026).

interface Skill { id: string; name: string; desc: string; vague: string; steps: string[]; keywords: string[] }

const SKILLS: Skill[] = [
  { id: "versions", name: "journal-des-versions", desc: "Rédige l'entrée du journal des versions quand on prépare une nouvelle version ou une mise en ligne.", vague: "Aide pour les textes.", steps: ["Lire les changements depuis la dernière version", "Les classer : ajouts, corrections", "Écrire l'entrée datée, en phrases courtes"], keywords: ["version", "mise en ligne"] },
  { id: "accessibilite", name: "verif-accessibilite", desc: "Vérifie qu'une page reste lisible et utilisable sur petit écran et avec un lecteur d'écran.", vague: "Vérifications diverses.", steps: ["Ouvrir la page en largeur de téléphone", "Contrôler contrastes et tailles de texte", "Signaler chaque problème avec sa correction"], keywords: ["iphone", "lisible", "écran"] },
  { id: "ton", name: "ton-de-la-marque", desc: "Réécrit les textes visibles par l'utilisateur dans le ton du produit : simple, chaleureux, tutoiement.", vague: "Style.", steps: ["Relire le texte d'origine", "Appliquer les règles de ton", "Proposer la version réécrite"], keywords: ["texte", "accueil", "ton"] },
];
const REQUESTS = [
  { id: "r1", t: "Prépare la mise en ligne de la version 0.4", match: "versions" },
  { id: "r2", t: "Mon texte d'accueil est trop froid, réécris-le", match: "ton" },
  { id: "r3", t: "Sur iPhone, la page est-elle lisible ?", match: "accessibilite" },
  { id: "r4", t: "Corrige la faute dans le titre", match: "" },
];

export default function SkillToolbox() {
  const [vague, setVague] = useState<string | null>(null);
  const [req, setReq] = useState<string | null>(null);
  const r = REQUESTS.find((x) => x.id === req);
  const chosen = r && r.match && r.match !== vague ? SKILLS.find((s) => s.id === r.match) : undefined;
  const missed = r && r.match && r.match === vague;
  const cost = SKILLS.length * 2 + (chosen ? 12 : 0);

  return (
    <div>
      <div className="row" style={{ justifyContent: "space-between", marginBottom: 8 }}>
        <span className="mono small">CONTEXTE OCCUPÉ PAR LES SKILLS · {cost} unités</span>
        <span className="pill cyan">{chosen ? "1 Skill chargé" : "Descriptions seules"}</span>
      </div>
      <div className="stack">
        {SKILLS.map((s) => {
          const loaded = chosen?.id === s.id;
          return (
            <motion.div key={s.id} layout className="choice" style={{ cursor: "default", flexDirection: "column", alignItems: "stretch", borderColor: loaded ? "var(--led)" : undefined }}>
              <div className="row">
                <Icon name="toolbox" size={18} style={{ color: loaded ? "var(--led)" : "var(--cyan)" }} />
                <span className="grow"><b className="mono" style={{ fontSize: 13 }}>{s.name}</b><br /><span className="small muted">{vague === s.id ? s.vague : s.desc}</span></span>
                <button className="pill" onClick={() => { sfx("tap"); setVague(vague === s.id ? null : s.id); }}>{vague === s.id ? "Description vague" : "Description claire"}</button>
              </div>
              <AnimatePresence>
                {loaded && (
                  <motion.ol initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="small" style={{ margin: "8px 0 0", paddingLeft: 22, overflow: "hidden" }}>
                    {s.steps.map((x) => <li key={x}>{x}</li>)}
                  </motion.ol>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
      <div className="panel-title" style={{ marginTop: 14 }}>Envoie une demande à Claude</div>
      <div className="stack">
        {REQUESTS.map((x) => (
          <button key={x.id} className={`choice ${req === x.id ? "sel" : ""}`} onClick={() => { setReq(x.id); sfx(x.match && x.match !== vague ? "power" : "relay"); }}>
            <Icon name="chat" size={16} /><span>{x.t}</span>
          </button>
        ))}
      </div>
      {r && (
        <motion.div key={`${req}-${vague}`} className={`feedback ${missed ? "ko" : "ok"}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {chosen ? <>La demande correspond à la description de <b>{chosen.name}</b> : Claude charge son contenu complet, et suit ses étapes. Les autres Skills restent réduits à leur description.</>
            : missed ? <>Le bon Skill existe, mais sa description est trop vague : Claude ne sait pas qu'il sert ici, et ne le charge pas. Une description claire dit <b>ce que fait</b> le Skill et <b>quand</b> l'utiliser.</>
            : <>Aucun Skill ne correspond : Claude fait la tâche avec ses outils habituels, sans rien charger de plus.</>}
        </motion.div>
      )}
    </div>
  );
}
