import { motion } from "motion/react";
import { useState } from "react";
import { sfx } from "../../lib/sound";
import { Icon } from "../Icon";

// L'atelier des conflits : un vrai conflit de fusion, en miniature. Le joueur lit les
// trois marqueurs, choisit la version finale, puis valide avec les mêmes boutons que
// l'éditeur de conflits de GitHub (Mark as resolved, Commit merge).
// D'après la documentation GitHub « Résolution d'un conflit de fusion sur GitHub »
// (vérifiée le 14/11/2026). Écrit à neuf pour FORMA-8.

const MINE = "  <h1>Carnet de chantier</h1>";
const THEIRS = "  <h1>Carnet : toutes tes photos</h1>";
const BOTH = "  <h1>Carnet de chantier, en photos</h1>";

type Pick = "mine" | "theirs" | "both";
const MARKERS = [
  { id: "start", line: "<<<<<<< titre-court", say: "Début du conflit. Ce qui suit vient de ta branche, « titre-court » : son nom est écrit après les chevrons." },
  { id: "mid", line: "=======", say: "La séparation : au-dessus, la version de ta branche ; en dessous, celle de l'autre branche." },
  { id: "end", line: ">>>>>>> main", say: "Fin du conflit. Ce qui précède vient de main, la branche principale." },
] as const;

const RESULT: Record<Pick, { line: string; label: string; say: string }> = {
  mine: { line: MINE, label: "Garder la version de ma branche", say: "Tu gardes ton titre court. Le changement fait sur main pour cette ligne est écarté, mais il reste dans l'historique." },
  theirs: { line: THEIRS, label: "Garder la version de main", say: "Tu gardes le titre de main. Ton titre court est écarté pour cette ligne, mais il reste dans l'historique." },
  both: { line: BOTH, label: "Écrire une version qui combine les deux", say: "Tu écris une troisième version, qui reprend l'idée des deux. C'est souvent le meilleur choix quand les deux changements sont utiles." },
};

export default function ConflictLab() {
  const [seen, setSeen] = useState<string[]>([]);
  const [focus, setFocus] = useState<string | null>(null);
  const [stage, setStage] = useState<"lire" | "choisir" | "resolu" | "fini">("lire");
  const [pick, setPick] = useState<Pick | null>(null);
  const [trap, setTrap] = useState(false);
  const allSeen = seen.length === MARKERS.length;

  const tapMarker = (id: string) => { sfx("tap"); setFocus(id); if (!seen.includes(id)) setSeen([...seen, id]); };
  const choose = (p: Pick) => { sfx("relay"); setPick(p); setTrap(false); };
  const reset = () => { sfx("tap"); setSeen([]); setFocus(null); setStage("lire"); setPick(null); setTrap(false); };

  const mono = { fontSize: 12.5, lineHeight: 1.8, whiteSpace: "pre" as const };
  const row = (t: string, tone?: "mine" | "theirs" | "ok") => (
    <div className="mono" style={{ ...mono, padding: "0 10px", color: tone === "mine" ? "#d9ccff" : tone === "theirs" ? "#cfefff" : tone === "ok" ? "#b8ffd9" : "var(--text-2)",
      background: tone === "mine" ? "rgba(167,139,250,.12)" : tone === "theirs" ? "rgba(59,232,255,.10)" : tone === "ok" ? "rgba(77,255,160,.10)" : undefined }}>{t}</div>
  );
  const showMarkers = stage === "lire" || (stage === "choisir" && !pick);

  return (
    <div>
      <div className="row" style={{ justifyContent: "space-between", marginBottom: 8 }}>
        <span className="mono small">INDEX.HTML</span>
        <span className={`pill ${stage === "fini" ? "led" : showMarkers ? "red" : "amber"}`} style={{ whiteSpace: "nowrap" }}>{stage === "fini" ? "Résolu" : showMarkers ? "1 conflit" : "À valider"}</span>
      </div>
      <div className="small muted" style={{ marginBottom: 8 }}>
        Sur ta branche <b>titre-court</b>, tu as raccourci le titre. Entre-temps, sur <b>main</b>, la même ligne a été changée autrement. Git ne peut pas deviner laquelle garder.
      </div>

      <div style={{ borderRadius: 12, background: "#050912", border: "1px solid var(--line)", overflowX: "auto", padding: "6px 0" }}>
        <div style={{ width: "max-content", minWidth: "100%" }}>
          {row("<body>")}
          {showMarkers ? (
            <>
              <MarkerLine m={MARKERS[0]} on={focus === "start"} seen={seen.includes("start")} tap={tapMarker} live={stage === "lire"} />
              {row(MINE, "mine")}
              <MarkerLine m={MARKERS[1]} on={focus === "mid"} seen={seen.includes("mid")} tap={tapMarker} live={stage === "lire"} />
              {row(THEIRS, "theirs")}
              <MarkerLine m={MARKERS[2]} on={focus === "end"} seen={seen.includes("end")} tap={tapMarker} live={stage === "lire"} />
            </>
          ) : row(RESULT[pick!].line, "ok")}
          {row("  <p>Tes chantiers, dans ta poche.</p>")}
          {row("</body>")}
        </div>
      </div>

      {stage === "lire" && (
        <>
          <motion.div key={focus ?? "intro"} className="feedback info" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <span className="tag">Étape 1 sur 3 · lire les marqueurs · {seen.length}/3</span>
            {focus ? MARKERS.find((m) => m.id === focus)!.say : "Git a écrit les deux versions dans le fichier, entre trois lignes spéciales : les marqueurs. Touche chaque ligne orange pour savoir ce qu'elle veut dire."}
          </motion.div>
          <button className="btn block" style={{ marginTop: 10 }} disabled={!allSeen} onClick={() => { sfx("open"); setStage("choisir"); }}>
            {allSeen ? <>Choisir la version finale <Icon name="chevron-right" size={18} stroke={2.2} /></> : "Touche les 3 marqueurs pour continuer"}
          </button>
        </>
      )}

      {stage === "choisir" && (
        <>
          <div className="mono small" style={{ margin: "12px 0 8px", color: "var(--text-3)" }}>ÉTAPE 2 SUR 3 · QUE DOIT CONTENIR LE FICHIER ?</div>
          {(Object.keys(RESULT) as Pick[]).map((p) => (
            <button key={p} className={`choice ${pick === p ? "ok" : ""}`} onClick={() => choose(p)}>
              <span className="key">{pick === p ? <Icon name="check" size={14} stroke={2.4} /> : <Icon name="pencil" size={13} />}</span><span>{RESULT[p].label}</span>
            </button>
          ))}
          <button className={`choice ${trap ? "ko" : ""}`} onClick={() => { sfx("ko"); setTrap(true); setPick(null); }}>
            <span className="key">{trap ? <Icon name="close" size={13} stroke={2.4} /> : <Icon name="pencil" size={13} />}</span><span>Tout laisser tel quel, marqueurs compris</span>
          </button>
          {trap && <div className="feedback ko"><span className="tag">Piège</span>Les marqueurs ne sont pas du HTML : s'ils restent, ils s'afficheront en clair au milieu de ta page. Résoudre un conflit, c'est toujours choisir le contenu final, puis supprimer les trois marqueurs.</div>}
          {pick && (
            <motion.div className="feedback ok" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <span className="tag">Les marqueurs ont disparu</span>{RESULT[pick].say}
            </motion.div>
          )}
          <button className="btn block" style={{ marginTop: 10 }} disabled={!pick} onClick={() => { sfx("ok"); setStage("resolu"); }}>Mark as resolved</button>
          <div className="small dim" style={{ marginTop: 6 }}>Sur GitHub, ce bouton veut dire « marquer comme résolu ».</div>
        </>
      )}

      {stage === "resolu" && (
        <>
          <div className="feedback info"><span className="tag">Étape 3 sur 3 · enregistrer</span>Le fichier est propre. Il reste à enregistrer ta décision dans l'historique : c'est un commit, comme les autres.</div>
          <button className="btn block led" style={{ marginTop: 10 }} onClick={() => { sfx("badge"); setStage("fini"); }}>Commit merge</button>
          <div className="small dim" style={{ marginTop: 6 }}>Sur GitHub, ce bouton veut dire « valider la fusion ».</div>
        </>
      )}

      {stage === "fini" && (
        <motion.div className="feedback ok" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}>
          <span className="tag">Conflit résolu</span>
          Ta décision est enregistrée, et la pull request peut de nouveau être fusionnée. Un conflit n'est pas une panne : c'est une question que Git te pose, parce que lui ne peut pas choisir à ta place.
        </motion.div>
      )}
      <button className="btn ghost small block" style={{ marginTop: 8 }} onClick={reset}><Icon name="refresh" size={16} /> Recommencer</button>
    </div>
  );
}

function MarkerLine({ m, on, seen, tap, live }: { m: { id: string; line: string }; on: boolean; seen: boolean; tap: (id: string) => void; live: boolean }) {
  return (
    <button disabled={!live} onClick={() => tap(m.id)} aria-label={`Marqueur ${m.line}`} className="mono"
      style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", minHeight: 36, padding: "0 10px", fontSize: 12.5, whiteSpace: "pre", textAlign: "left", cursor: live ? "pointer" : "default",
        color: "var(--amber)", background: on ? "rgba(255,181,71,.22)" : "rgba(255,181,71,.10)", border: "none", borderLeft: `3px solid ${on ? "var(--amber)" : "transparent"}` }}>
      <span>{m.line}</span>
      {live && <span aria-hidden="true" style={{ marginLeft: "auto", color: seen ? "var(--led)" : "var(--text-3)" }}><Icon name={seen ? "check" : "help"} size={14} /></span>}
    </button>
  );
}
