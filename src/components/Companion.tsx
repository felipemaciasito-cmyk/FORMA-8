import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import type { Room } from "../content/types";
import { currentCompanion, hideCompanion, onCompanion, type CompanionLine } from "../lib/companion";
import { speakerOf } from "../lib/voice";
import { eveille } from "../lib/eveil";
import { CrewFigure, type CrewState } from "./Crew";
import { OraDrone } from "./Ora";
import { BulleCorps, MemberSays, useBulle } from "./Bulle";

/**
 * Le compagnon du protocole : le membre du caisson, dans un petit hublot posé à gauche de la batterie, toujours
 * visible et animé (il respire, cligne, rebondit quand tu réussis). Quand il parle, sa bulle sort au-dessus de la
 * batterie ; sa voix part seulement quand la bulle est à l'écran (voir src/lib/voice.ts).
 */
export function CompanionPort({ r, state }: { r: Room; state: CrewState }) {
  const [line, setLine] = useState<CompanionLine | null>(currentCompanion());
  useEffect(() => onCompanion(setLine), []);
  const speaker = speakerOf(r.id);
  // La dernière réplique reste en mémoire après la fermeture de la bulle : toucher le compagnon la relit.
  const [dernier, setDernier] = useState<string | undefined>(line?.md);
  useEffect(() => { if (line?.md) setDernier(line.md); }, [line]);
  const b = useBulle(speaker, line?.md ?? dernier, { retour: false });
  const happy = !!line && (line.kind === "premier" || line.kind === "serie" || line.kind === "perseverance");
  const asleep = state !== "awake" && r.id !== "c00";
  const talk = b.speaking ? b.level : 0;

  // La bulle lue se ferme : le compagnon redevient disponible pour la suite (réaction, passage clé).
  const wasOpen = useRef(false);
  useEffect(() => {
    if (b.open) wasOpen.current = true;
    else if (wasOpen.current && line) { wasOpen.current = false; hideCompanion(); }
  }, [b.open]); // eslint-disable-line react-hooks/exhaustive-deps

  const hue = r.hue;
  return (
    <>
      <motion.button type="button" className="companion-port" aria-label={`Toucher ${r.member}`} onClick={() => { b.toucher(); }}
        animate={happy ? { y: [0, -7, 0, -3, 0], rotate: [0, -8, 6, 0] } : { y: [0, -1.5, 0] }}
        transition={happy ? { duration: 0.8 } : { duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
        style={{ borderColor: `hsl(${hue} 90% 60% / ${0.35 + talk * 0.6})`, boxShadow: `0 0 ${6 + talk * 18}px hsl(${hue} 100% 60% / ${0.2 + talk * 0.5}), inset 0 0 12px hsl(${hue} 100% 60% / .15)` }}>
        {r.id === "c00"
          ? <OraDrone mood={happy ? "happy" : eveille("ora") ? "neutral" : "sleep"} size={44} talk={b.speaking ? b.level : undefined} />
          : <CrewFigure id={r.id} state={happy ? "awake" : state} mood={happy ? "happy" : "neutral"} crop="head" size={46} label={r.member} />}
        {(asleep || (r.id === "c00" && !eveille("ora"))) && !happy && <span className="companion-z mono">z</span>}
      </motion.button>
      <AnimatePresence>
        {b.open && b.affiche && (
          <motion.div key={b.affiche} className="companion-bubble" role="status" aria-live="polite"
            initial={{ opacity: 0, y: 10, scale: 0.92 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 6, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 420, damping: 30 }}
            onClick={b.fermer}
            style={{ borderColor: `hsl(${hue} 90% 60% / ${0.45 + talk * 0.4})`, background: `linear-gradient(135deg, hsl(${hue} 55% 15%), #080d19 60%)` }}>
            <BulleCorps speaker={speaker} b={b} />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/** Une réplique du compagnon hors protocole (carte, panne, livraison) : Forma Trisse au caisson 00, sinon le membre. */
export function CompanionSays({ r, md }: { r: Room; md?: string; asleep?: boolean }) {
  if (!md) return null;
  return <MemberSays room={r.id} md={md} options={{ retour: false }} />;
}
