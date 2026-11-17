import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { notion, notionOrigin } from "../content";
import type { Level } from "../content/types";
import { RichText } from "../lib/richtext";
import { onTerm } from "../lib/termBus";
import { sfx } from "../lib/sound";
import { useProgress, useSettings } from "../lib/store";
import { loadClaude } from "../lib/models";
import { Sheet } from "./Chrome";
import { NotionChip } from "./Emblems";
import { Icon } from "./Icon";

const LEVELS: { id: Level; label: string; color: string }[] = [
  { id: "simple", label: "Simple", color: "var(--led)" },
  { id: "standard", label: "Standard", color: "var(--cyan)" },
  { id: "expert", label: "Expert", color: "var(--violet)" },
];

export function TermSheetHost() {
  const [stack, setStack] = useState<string[]>([]);
  useEffect(() => onTerm((id) => { sfx("open"); setStack((s) => (s[s.length - 1] === id ? s : [...s, id])); }), []);
  const id = stack[stack.length - 1];
  return (
    <Sheet open={!!id} onClose={() => setStack([])} label="Fiche de notion">
      {id && <TermCard key={id} id={id} onBack={stack.length > 1 ? () => setStack((s) => s.slice(0, -1)) : undefined} />}
    </Sheet>
  );
}

export function TermCard({ id, onBack, inline }: { id: string; onBack?: () => void; inline?: boolean }) {
  const n = notion(id);
  const p = useProgress();
  const settings = useSettings();
  const [level, setLevel] = useState<Level>("simple");
  const [alt, setAlt] = useState<{ loading: boolean; text?: string; error?: string }>({ loading: false });
  if (!n) return <p className="muted">Notion introuvable : {id}</p>;
  const origin = notionOrigin(id);
  const st = p.notions[id];

  const reexplain = async () => {
    if (!settings.apiKey) {
      const next = level === "expert" ? "simple" : level === "simple" ? "standard" : "expert";
      setAlt({ loading: false, text: `Essaie le niveau **${LEVELS.find((l) => l.id === next)?.label}** ci-dessus, relis l'analogie, puis l'exemple. Pour une réexplication personnalisée par Claude, ajoute une clé API dans Réglages.` });
      return;
    }
    setAlt({ loading: true });
    try {
      const { reexplain } = await loadClaude();
      const text = await reexplain(n.term, n.def[level], n.analogy, level);
      setAlt({ loading: false, text });
    } catch (e) {
      setAlt({ loading: false, error: e instanceof Error ? e.message : String(e) });
    }
  };

  return (
    <div>
      <div className="row" style={{ alignItems: "flex-start" }}>
        {onBack && <button className="icon-btn" onClick={onBack} aria-label="Notion précédente"><Icon name="back" /></button>}
        <NotionChip id={id} icon={n.icon} size={58} trace={inline && !st} />
        <div className="grow">
          <div className="kicker" style={{ color: "var(--cyan)" }}>Base de connaissances</div>
          <div className="h2" style={{ margin: "2px 0 0" }}>{n.term}</div>
        </div>
      </div>
      <div className="row wrap-row" style={{ gap: 6, margin: "10px 0 14px" }}>
        {origin.room && <span className="pill cyan">{origin.room.code}</span>}
        {origin.missionId && <span className="pill amber">Signal du jour</span>}
        {st ? <span className="pill led">Assimilée · boîte {st.box}/5</span> : <span className="pill">Pas encore assimilée</span>}
        {n.checked && <span className="pill amber">Vérifié {n.checked.split("-").reverse().join("/")} · à revérifier</span>}
      </div>

      <div className="seg" role="tablist" aria-label="Niveau d'explication" style={{ isolation: "isolate" }}>
        {LEVELS.map((l) => (
          <button key={l.id} role="tab" aria-selected={level === l.id} className={level === l.id ? "on" : ""} onClick={() => { sfx("tap"); setLevel(l.id); }}>
            {level === l.id && <motion.span layoutId={inline ? `seg-${id}` : "seg-bg"} className="seg-bg" style={{ background: l.color }} transition={{ type: "spring", stiffness: 500, damping: 36 }} />}
            <span>{l.label}</span>
          </button>
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={level} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }} style={{ margin: "14px 0", fontSize: 17 }}>
          <RichText md={n.def[level]} />
        </motion.div>
      </AnimatePresence>

      <div className="panel" style={{ background: "rgba(167,139,250,.08)", borderColor: "rgba(167,139,250,.3)" }}>
        <div className="panel-title" style={{ color: "var(--violet)" }}><Icon name="frame" size={16} /> Analogie</div>
        <RichText md={n.analogy} />
      </div>
      <div className="panel">
        <div className="panel-title"><Icon name="flask" size={16} /> Exemple</div>
        {n.example.includes("\n") ? <pre className="code-block" style={{ margin: 0 }}>{n.example}</pre> : <RichText md={n.example} />}
      </div>

      {n.prereq.length > 0 && (
        <div style={{ marginTop: 14 }}>
          <div className="panel-title">Repose sur</div>
          <div className="row wrap-row" style={{ gap: 8 }}>
            {n.prereq.map((pid) => <RichText key={pid} md={`[[${pid}]]`} />)}
          </div>
        </div>
      )}

      <div style={{ marginTop: 16 }}>
        <button className="btn subtle block" onClick={reexplain} disabled={alt.loading}>
          {alt.loading ? "Forma Trisse reformule…" : <><Icon name="help" size={18} /> Je n'ai toujours pas compris</>}
        </button>
        {alt.text && <div className="feedback info"><span className="tag">Forma Trisse reformule</span><RichText md={alt.text} /></div>}
        {alt.error && <div className="feedback ko"><span className="tag">Erreur</span>{alt.error}</div>}
      </div>
    </div>
  );
}
