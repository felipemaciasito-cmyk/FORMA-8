import { motion } from "motion/react";
import { useRef, useState } from "react";
import { sfx } from "../../lib/sound";
import { Icon, type IconId } from "../Icon";

// La chaîne d'intégration continue : à chaque envoi, des robots vérifient le
// projet étape par étape. Au premier voyant rouge, la mise en ligne est bloquée
// et le site déjà en ligne reste intact.

interface Stage { id: string; label: string; icon: IconId; ok: string; ko?: string }

const STAGES: Stage[] = [
  { id: "push", label: "Envoi", icon: "share", ok: "Ton commit arrive sur GitHub." },
  { id: "checks", label: "Contrôles", icon: "shield", ok: "Règles du projet respectées (zéro emoji, zéro zone de flou)." },
  { id: "tests", label: "Tests", icon: "flask", ok: "Tous les tests automatiques passent.", ko: "Un test échoue : le bouton « Valider » ne fait plus rien." },
  { id: "build", label: "Construction", icon: "toolbox", ok: "L'appli est assemblée en fichiers prêts à publier." },
  { id: "deploy", label: "Mise en ligne", icon: "rocket", ok: "La nouvelle version est en ligne." },
];

type Light = "off" | "run" | "ok" | "ko";

export default function PipelineLights() {
  const [bug, setBug] = useState(false);
  const [lights, setLights] = useState<Light[]>(STAGES.map(() => "off"));
  const [msg, setMsg] = useState("Lance la chaîne pour voir les robots vérifier ton envoi, étape par étape.");
  const running = useRef(false);

  const run = async () => {
    if (running.current) return;
    running.current = true;
    const l: Light[] = STAGES.map(() => "off");
    setLights([...l]);
    for (let i = 0; i < STAGES.length; i++) {
      l[i] = "run"; setLights([...l]); setMsg(`${STAGES[i].label} en cours…`); sfx("type");
      await new Promise((r) => setTimeout(r, 750));
      const fails = bug && STAGES[i].id === "tests";
      l[i] = fails ? "ko" : "ok"; setLights([...l]);
      if (fails) {
        sfx("alarm");
        setMsg(`${STAGES[i].ko} La chaîne s'arrête : rien n'est mis en ligne, et la version actuelle de ton site reste intacte. Tu corriges, puis tu renvoies.`);
        running.current = false;
        return;
      }
      sfx("relay");
      setMsg(STAGES[i].ok);
    }
    sfx("power");
    setMsg("Chaîne entièrement verte : la nouvelle version est en ligne, et tu sais qu'elle a passé toutes les vérifications.");
    running.current = false;
  };

  const color = (s: Light) => (s === "ok" ? "var(--led)" : s === "ko" ? "var(--red)" : s === "run" ? "var(--amber)" : "#1f2b40");

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "14px 8px", borderRadius: 12, background: "#050912", border: "1px solid var(--line)", overflowX: "auto" }}>
        {STAGES.map((s, i) => (
          <div key={s.id} style={{ display: "flex", alignItems: "center", flex: 1, minWidth: 56 }}>
            <div style={{ textAlign: "center", flex: 1 }}>
              <motion.div animate={{ boxShadow: lights[i] === "off" ? "none" : `0 0 14px ${color(lights[i])}` }}
                style={{ width: 40, height: 40, margin: "0 auto", borderRadius: 12, display: "grid", placeItems: "center", background: "#0b1222", border: `1.5px solid ${color(lights[i])}`, color: lights[i] === "off" ? "var(--text-3)" : color(lights[i]),
                  animation: lights[i] === "run" ? "blink .5s steps(1) infinite" : undefined }}>
                <Icon name={lights[i] === "ok" ? "check" : lights[i] === "ko" ? "close" : s.icon} size={20} />
              </motion.div>
              <div className="mono" style={{ fontSize: 9.5, marginTop: 6, color: "var(--text-2)" }}>{s.label.toUpperCase()}</div>
            </div>
            {i < STAGES.length - 1 && <div style={{ width: 10, height: 2, background: lights[i] === "ok" ? "var(--led)" : "#1f2b40" }} />}
          </div>
        ))}
      </div>
      <motion.div key={msg} className={`feedback ${lights.includes("ko") ? "ko" : lights.every((l) => l === "ok") ? "ok" : "info"}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginTop: 12 }}>{msg}</motion.div>
      <label className="row" style={{ marginTop: 12, gap: 10, cursor: "pointer" }}>
        <input type="checkbox" checked={bug} onChange={(e) => { setBug(e.target.checked); sfx("tap"); }} style={{ width: 20, height: 20, accentColor: "#ff4d6d" }} />
        <span className="small">Glisser un bug dans l'envoi (le bouton « Valider » ne réagit plus)</span>
      </label>
      <button className="btn block" style={{ marginTop: 12 }} onClick={run}><Icon name="play" size={18} /> Lancer la chaîne</button>
    </div>
  );
}
