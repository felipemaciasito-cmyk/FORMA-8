import { motion } from "motion/react";
import { useState } from "react";
import { sfx } from "../../lib/sound";

// Anatomie interactive d'un fichier SKILL.md.
const ZONES = [
  { id: "fm", lines: ["---", "name: relance-impayes", "description: Rédige une relance d'impayé en 3 niveaux de", "  fermeté. À utiliser quand l'utilisateur parle de facture", "  en retard, de relance ou de client qui ne paie pas.", "---"], color: "#ffb547",
    title: "L'en-tête", text: "Entre les deux lignes « --- ». Le **name** identifie le Skill (minuscules et tirets). La **description** dit quoi ET quand : c'est la seule partie que l'IA lit en permanence pour décider de l'ouvrir." },
  { id: "title", lines: ["# Relance d'impayé"], color: "#3be8ff", title: "Le titre", text: "Un titre Markdown (#) qui annonce la tâche. Il aide à la lecture humaine." },
  { id: "steps", lines: ["## Étapes", "1. Demander : client, montant, numéro, jours de retard.", "2. Choisir le niveau : 1 (< 15 j), 2 (15-45 j), 3 (> 45 j).", "3. Rédiger avec le ton du niveau choisi."], color: "#4dffa0",
    title: "Les étapes", text: "Ta méthode, numérotée. C'est le cœur du Skill : ce que tu ferais toi-même, dans l'ordre." },
  { id: "fmt", lines: ["## Format de sortie", "Objet + mail de 150 mots max, vouvoiement."], color: "#ff7ab6", title: "Le format de sortie", text: "La forme exacte du résultat, pour qu'il soit utilisable sans retouche." },
  { id: "avoid", lines: ["## À éviter", "- Menacer de poursuites au niveau 1 ou 2.", "- Inventer un montant ou une date."], color: "#ff4d6d", title: "Les garde-fous", text: "Ce qui ne doit jamais arriver. Ils évitent les dérapages et les inventions." },
];

export default function SkillAnatomy() {
  const [sel, setSel] = useState("fm");
  const z = ZONES.find((x) => x.id === sel)!;
  return (
    <div>
      <div className="code-block" style={{ padding: 8 }}>
        <div className="mono small dim" style={{ padding: "2px 6px 8px" }}>relance-impayes/SKILL.md</div>
        {ZONES.map((zone) => (
          <motion.button key={zone.id} onClick={() => { sfx("tap"); setSel(zone.id); }} whileTap={{ scale: 0.99 }}
            style={{ display: "block", width: "100%", textAlign: "left", padding: "6px 8px", borderRadius: 8, marginBottom: 4, font: "12.5px/1.55 var(--mono)",
              borderLeft: `3px solid ${zone.color}`, background: sel === zone.id ? `${zone.color}22` : "transparent", color: sel === zone.id ? "#fff" : "#9fb4d6" }}>
            {zone.lines.map((l, i) => <div key={i} style={{ whiteSpace: "pre-wrap" }}>{l}</div>)}
          </motion.button>
        ))}
      </div>
      <motion.div key={sel} className="feedback info" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} style={{ borderColor: z.color, background: `${z.color}14` }}>
        <span className="tag" style={{ color: z.color }}>{z.title}</span>
        <span dangerouslySetInnerHTML={{ __html: z.text.replace(/\*\*(.+?)\*\*/g, "<b>$1</b>") }} />
      </motion.div>
    </div>
  );
}
