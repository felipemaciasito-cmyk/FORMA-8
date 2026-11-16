import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import type { Room } from "../content/types";
import { currentCompanion, hideCompanion, onCompanion, type CompanionLine } from "../lib/companion";
import { RichText } from "../lib/richtext";
import { speakerOf, stopVoice } from "../lib/voice";
import { CrewFigure, type CrewState } from "./Crew";
import { OraDrone } from "./Ora";
import { ReplayButton, useVoiceLine } from "./VoiceButton";

/**
 * Le compagnon du protocole : le membre du caisson, dans un petit hublot posé à gauche de la batterie, toujours
 * visible et animé (il respire, cligne, rebondit quand tu réussis). Quand il parle, sa bulle sort au-dessus de la
 * batterie ; sa voix part seulement quand la bulle est à l'écran (voir src/lib/voice.ts).
 */
export function CompanionPort({ r, state }: { r: Room; state: CrewState }) {
  const [line, setLine] = useState<CompanionLine | null>(currentCompanion());
  useEffect(() => onCompanion(setLine), []);
  const voice = useVoiceLine(line ? speakerOf(r.id) : undefined, line?.md);
  const happy = !!line && (line.kind === "premier" || line.kind === "serie" || line.kind === "perseverance");
  const asleep = state !== "awake" && r.id !== "c00";
  const talk = voice.speaking ? voice.level : line ? 0.35 : 0;

  // La bulle reste le temps de la lire (ou de l'entendre), puis se range toute seule.
  useEffect(() => {
    if (!line || voice.speaking) return;
    const t = window.setTimeout(() => hideCompanion(), Math.max(4200, line.md.length * 62));
    return () => window.clearTimeout(t);
  }, [line, voice.speaking]);

  const hue = r.hue;
  return (
    <>
      <motion.span className="companion-port" aria-hidden="true"
        animate={happy ? { y: [0, -7, 0, -3, 0], rotate: [0, -8, 6, 0] } : { y: [0, -1.5, 0] }}
        transition={happy ? { duration: 0.8 } : { duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
        style={{ borderColor: `hsl(${hue} 90% 60% / ${0.35 + talk * 0.6})`, boxShadow: `0 0 ${6 + talk * 18}px hsl(${hue} 100% 60% / ${0.2 + talk * 0.5}), inset 0 0 12px hsl(${hue} 100% 60% / .15)` }}>
        {r.id === "c00"
          ? <OraDrone mood={happy ? "happy" : "neutral"} size={44} talk={voice.speaking ? voice.level : undefined} />
          : <CrewFigure id={r.id} state={happy ? "awake" : state} mood={happy ? "happy" : "neutral"} crop="head" size={46} label={r.member} />}
        {asleep && !happy && <span className="companion-z mono">z</span>}
      </motion.span>
      <AnimatePresence>
        {line && (
          <motion.div key={line.id} className="companion-bubble" role="status" aria-live="polite"
            initial={{ opacity: 0, y: 10, scale: 0.92 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 6, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 420, damping: 30 }}
            onClick={() => { if (voice.speaking) stopVoice(); hideCompanion(); }}
            style={{ borderColor: `hsl(${hue} 90% 60% / ${0.45 + talk * 0.4})`, background: `linear-gradient(135deg, hsl(${hue} 55% 15%), #080d19 60%)` }}>
            <div className="mono companion-name" style={{ color: `hsl(${hue} 100% 72%)` }}>
              <span className="grow">{r.member.toUpperCase()}{asleep ? " · PARLE EN DORMANT" : ""}</span>
              <span onClick={(e) => e.stopPropagation()}><ReplayButton voice={voice} who={r.member} color={`hsl(${hue} 100% 72%)`} /></span>
            </div>
            <div style={{ fontStyle: asleep ? "italic" : undefined, color: asleep ? "var(--text-2)" : undefined, fontSize: 15, lineHeight: 1.4 }}><RichText md={line.md} /></div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
