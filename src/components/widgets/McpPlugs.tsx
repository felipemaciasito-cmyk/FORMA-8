import { motion } from "motion/react";
import { useState } from "react";
import { sfx } from "../../lib/sound";
import { Icon, type IconId } from "../Icon";

// « Les prises MCP » : brancher un serveur MCP donne à Claude de nouveaux outils.
// Chaque outil reçoit une règle de permission : autoriser, demander, ou refuser
// (la règle « refuser » l'emporte toujours). Source : code.claude.com/docs/fr/mcp,
// permissions et glossary (vérifiées le 14/11/2026).

type Rule = "allow" | "ask" | "deny";
interface Tool { id: string; label: string; risky?: boolean }
interface Server { id: string; label: string; icon: IconId; tools: Tool[] }

const SERVERS: Server[] = [
  { id: "github", label: "GitHub", icon: "branch", tools: [{ id: "lire-ticket", label: "Lire un ticket" }, { id: "fermer-ticket", label: "Fermer un ticket", risky: true }] },
  { id: "agenda", label: "Agenda", icon: "calendar", tools: [{ id: "lire-agenda", label: "Lire l'agenda" }, { id: "creer-rdv", label: "Créer un rendez-vous", risky: true }] },
  { id: "donnees", label: "Base de données", icon: "server", tools: [{ id: "lire-donnees", label: "Lire des données" }, { id: "effacer-donnees", label: "Effacer des données", risky: true }] },
];
const TASK = [
  { tool: "lire-ticket", say: "Claude lit le ticket « bouton Contact inactif »." },
  { tool: "lire-donnees", say: "Claude consulte les données des messages reçus." },
  { tool: "effacer-donnees", say: "Claude veut effacer les anciens messages de test." },
  { tool: "fermer-ticket", say: "Claude veut fermer le ticket, la correction étant faite." },
];
const RULE_LABEL: Record<Rule, string> = { allow: "Autoriser", ask: "Demander", deny: "Refuser" };

export default function McpPlugs() {
  const [plugged, setPlugged] = useState<Record<string, boolean>>({});
  const [rules, setRules] = useState<Record<string, Rule>>({});
  const [log, setLog] = useState<{ say: string; res: string; tone: "ok" | "info" | "ko" }[]>([]);
  const tools = SERVERS.filter((s) => plugged[s.id]).flatMap((s) => s.tools);
  const ruleOf = (t: Tool): Rule => rules[t.id] ?? (t.risky ? "ask" : "allow");

  const run = () => {
    sfx("power");
    setLog(TASK.map((st) => {
      const t = tools.find((x) => x.id === st.tool);
      if (!t) return { say: st.say, res: "Outil absent : ce serveur n'est pas branché, Claude ne peut pas le faire.", tone: "info" as const };
      const r = ruleOf(t);
      return r === "allow" ? { say: st.say, res: "Autorisé : l'action se fait sans te demander.", tone: "ok" as const }
        : r === "ask" ? { say: st.say, res: "Claude s'arrête et te demande ton accord avant d'agir.", tone: "info" as const }
        : { say: st.say, res: "Refusé : la règle interdit cette action, quoi que Claude en pense.", tone: "ko" as const };
    }));
  };

  return (
    <div>
      <div className="small muted" style={{ marginBottom: 10 }}>Branche des serveurs MCP : chacun apporte des outils. Puis règle ce que Claude a le droit de faire.</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", gap: 10 }}>
        <div className="stack">
          {SERVERS.map((s) => (
            <button key={s.id} className={`choice ${plugged[s.id] ? "ok" : ""}`} onClick={() => { sfx(plugged[s.id] ? "tap" : "relay"); setPlugged({ ...plugged, [s.id]: !plugged[s.id] }); setLog([]); }} style={{ padding: "10px 12px" }}>
              <Icon name={s.icon} size={18} /><span className="grow">{s.label}</span><span className="mono" style={{ fontSize: 10 }}>{plugged[s.id] ? "BRANCHÉ" : "LIBRE"}</span>
            </button>
          ))}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {SERVERS.map((s) => <motion.span key={s.id} animate={{ background: plugged[s.id] ? "#4dffa0" : "#1f2b40", boxShadow: plugged[s.id] ? "0 0 10px #4dffa0" : "none" }} style={{ width: 26, height: 4, borderRadius: 2 }} />)}
        </div>
        <div className="panel" style={{ marginTop: 0, textAlign: "center", padding: 12 }}>
          <Icon name="bot" size={30} style={{ color: "var(--cyan)" }} />
          <div className="small" style={{ marginTop: 4 }}><b>Claude</b></div>
          <div className="mono" style={{ fontSize: 10, color: "var(--text-3)" }}>{tools.length} outil{tools.length > 1 ? "s" : ""} en plus</div>
        </div>
      </div>
      {tools.length > 0 && (
        <>
          <div className="panel-title" style={{ marginTop: 14 }}>Règles de permission</div>
          <div className="stack">
            {tools.map((t) => (
              <div key={t.id} className="choice" style={{ cursor: "default", flexDirection: "column", alignItems: "stretch", gap: 8 }}>
                <span>{t.label}{t.risky && <span className="pill amber" style={{ marginLeft: 8 }}>Sensible</span>}</span>
                <div className="row" style={{ gap: 6 }}>
                  {(["allow", "ask", "deny"] as Rule[]).map((r) => (
                    <button key={r} className={`chip ${ruleOf(t) === r ? "on" : ""}`} onClick={() => { sfx("tap"); setRules({ ...rules, [t.id]: r }); setLog([]); }}>{RULE_LABEL[r]}</button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
      <button className="btn block" style={{ marginTop: 12 }} onClick={run}><Icon name="play" size={18} /> Lancer la tâche « corrige le bouton Contact »</button>
      {log.map((l, i) => (
        <motion.div key={i} className={`feedback ${l.tone}`} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.35 }}>
          <span className="tag">Étape {i + 1}</span>{l.say} <b>{l.res}</b>
        </motion.div>
      ))}
    </div>
  );
}
