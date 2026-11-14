import { motion } from "motion/react";
import { lazy, Suspense } from "react";
import type { Block, WidgetId } from "../content/types";
import { RichText } from "../lib/richtext";
import { Art } from "./Art";
import { Icon, type IconId } from "./Icon";
import { ExerciseView } from "./Exercises";
import { OraSays } from "./Ora";
import { TermCard } from "./TermSheet";

const Widgets = {
  NextWord: lazy(() => import("./widgets/NextWord")),
  CoreCompare: lazy(() => import("./widgets/CoreCompare")),
  ContextRam: lazy(() => import("./widgets/ContextRam")),
  PromptLab: lazy(() => import("./widgets/PromptLab")),
  ProjectSim: lazy(() => import("./widgets/ProjectSim")),
  SkillAnatomy: lazy(() => import("./widgets/SkillAnatomy")),
  PatchBay: lazy(() => import("./widgets/PatchBay")),
  AgentLoop: lazy(() => import("./widgets/AgentLoop")),
  SkillWorkshop: lazy(() => import("./SkillWorkshop")),
} satisfies Record<WidgetId, unknown>;

export function BlockView({ block, exKey, solvedBefore, onSolved }: { block: Block; exKey: string; solvedBefore: boolean; onSolved: (attempts: number) => void }) {
  switch (block.type) {
    case "text":
      return <div style={{ fontSize: 17 }}><RichText md={block.md} /></div>;
    case "definition":
      return (
        <div className="panel glow" style={{ borderColor: "rgba(59,232,255,.35)", background: "linear-gradient(160deg, rgba(59,232,255,.08), rgba(12,19,34,.85) 40%)" }}>
          <div className="panel-title" style={{ color: "var(--cyan)" }}><span className="led" style={{ background: "var(--cyan)", boxShadow: "0 0 8px var(--cyan)" }} />Nouvelle notion</div>
          <TermCard id={block.notion} inline />
        </div>
      );
    case "analogy":
      return (
        <div className="panel" style={{ background: "rgba(167,139,250,.07)", borderColor: "rgba(167,139,250,.3)" }}>
          <div className="panel-title" style={{ color: "var(--violet)" }}><Icon name="frame" size={16} /> Analogie</div>
          {block.art && <div style={{ margin: "-4px 0 8px" }}><Art name={block.art} /></div>}
          <div className="h3">{block.title}</div>
          <RichText md={block.md} />
        </div>
      );
    case "interactive": {
      const W = Widgets[block.widget];
      return (
        <div className="panel" style={{ borderColor: "rgba(77,255,160,.3)", background: "linear-gradient(160deg, rgba(77,255,160,.06), rgba(12,19,34,.85) 45%)" }}>
          <div className="panel-title" style={{ color: "var(--led)" }}><span className="led" />Simulateur</div>
          {block.caption && <div className="small muted" style={{ marginBottom: 12 }}>{block.caption}</div>}
          <Suspense fallback={<div className="mono small dim">Chargement du module…</div>}><W /></Suspense>
        </div>
      );
    }
    case "example":
      return (
        <div>
          <div className="panel-title"><Icon name="flask" size={16} /> {block.title}</div>
          <div style={{ display: "grid", gap: 10 }}>
            {block.before && (
              <div className="panel" style={{ borderColor: "rgba(255,77,109,.3)", background: "rgba(255,77,109,.06)" }}>
                <span className="pill red" style={{ marginBottom: 8 }}>{block.before.label}</span>
                <RichText md={block.before.md} />
              </div>
            )}
            <div className="panel" style={{ borderColor: "rgba(77,255,160,.35)", background: "rgba(77,255,160,.06)", marginTop: 0 }}>
              <span className="pill led" style={{ marginBottom: 8 }}>{block.after.label}</span>
              <RichText md={block.after.md} />
            </div>
          </div>
          {block.note && <div className="small muted" style={{ marginTop: 10 }}><RichText md={block.note} /></div>}
        </div>
      );
    case "callout": {
      if (block.tone === "ora") return <OraSays md={block.md} />;
      const tone = ({ info: ["var(--cyan)", "info", "À retenir"], warn: ["var(--amber)", "warn", "Attention"], volatile: ["var(--amber)", "clock", "Info qui évolue"] } as Record<string, [string, IconId, string]>)[block.tone];
      return (
        <div className="panel" style={{ borderColor: `color-mix(in srgb, ${tone[0]} 40%, transparent)`, background: `color-mix(in srgb, ${tone[0]} 8%, transparent)` }}>
          <div className="panel-title" style={{ color: tone[0] }}><Icon name={tone[1]} size={16} /> {tone[2]}</div>
          <RichText md={block.md} />
        </div>
      );
    }
    case "exercise":
      return <ExerciseView ex={block.ex} exKey={exKey} solvedBefore={solvedBefore} onSolved={onSolved} />;
    case "recap":
      return (
        <motion.div className="panel" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ background: "#050912", fontFamily: "var(--mono)" }}>
          <div className="panel-title"><span className="led" />Journal système · récapitulatif</div>
          {block.points.map((pt, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 * i }} style={{ display: "flex", gap: 10, fontSize: 14.5, margin: "8px 0", fontFamily: "var(--font)" }}>
              <span style={{ color: "var(--led)", fontFamily: "var(--mono)" }}>[OK]</span>
              <RichText md={pt} />
            </motion.div>
          ))}
        </motion.div>
      );
  }
}
