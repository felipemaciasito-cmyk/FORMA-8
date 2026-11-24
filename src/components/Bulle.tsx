// Bulles de l'équipe (lot « compagnon et règles de parole », 17/11/2026, règles choisies par le propriétaire) :
// - une seule bulle à la fois, dans l'ordre (la file de src/lib/voice.ts) ;
// - le texte s'écrit lettre par lettre, au rythme de la voix ; toute bulle est lue à voix haute ;
// - la bulle est au premier plan, et se ferme une fois lue ;
// - toucher le personnage rouvre sa bulle et relit sa réplique ; le toucher encore le fait réagir ;
// - au retour sur une page, une réplique déjà entendue laisse la place à une phrase très courte.
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { room } from "../content/index";
import { RichText } from "../lib/richtext";
import { useReduceMotion } from "../lib/motion";
import { entendu, enCours, forget, getVoiceState, lineKey, nomDe, onVoice, speak, stopVoice, type Speaker } from "../lib/voice";
import { eveille, phraseRetour, reactionToucher, roomOfSpeaker } from "../lib/eveil";
import { useProgress, useSettings } from "../lib/store";
import type { Babil } from "../lib/robot";
import { CrewFigure } from "./Crew";
import { OraDrone, type OraMood } from "./Ora";

/** Texte sans balises, pour l'écriture lettre à lettre. */
export const plain = (md: string) => md.replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, "$2").replace(/\[\[([^\]]+)\]\]/g, "$1").replace(/\*\*|__|`/g, "");

export interface BulleOptions {
  /** Lecture à l'apparition (sinon seulement au toucher). */
  auto?: boolean;
  /** Au retour sur la page, une réplique déjà entendue laisse la place à une phrase courte. */
  retour?: boolean;
  /** Texte écrit sur le moment (par Claude) : babillage au lieu d'une voix enregistrée. */
  babble?: Babil;
  /** La bulle reste ouverte après la lecture (question en attente de réponse). */
  garder?: boolean;
  /** Délai avant la première parole (ms). */
  delai?: number;
}

/**
 * La parole d'un personnage : quelle réplique s'affiche, si sa bulle est ouverte, et combien de lettres sont écrites.
 * `md` peut changer (réponse à un choix, réplique suivante) : la nouvelle réplique prend sa place dans la file.
 */
export function useBulle(speaker: Speaker | undefined, md: string | undefined, o: BulleOptions = {}) {
  const { auto = true, retour = false, babble, garder = false, delai = 350 } = o;
  const reduce = useReduceMotion();
  const [affiche, setAffiche] = useState<string>("");
  const [open, setOpen] = useState(false);
  const [progress, setProgress] = useState(1);
  const [level, setLevel] = useState(0);
  const [speaking, setSpeaking] = useState(false);
  // Premier toucher : il relit sa réplique (en entier, même après une phrase de retour) ; les suivants : il réagit.
  const relu = useRef(false);
  const key = speaker && affiche ? lineKey(speaker, affiche, babble) : "";
  const keyRef = useRef(key); keyRef.current = key;

  // Une nouvelle réplique : la phrase de retour si elle a déjà été entendue, sinon la réplique elle-même.
  useEffect(() => {
    if (!speaker || !md) { setAffiche(""); setOpen(false); return; }
    relu.current = false;
    const k = lineKey(speaker, md, babble);
    const short = retour && !babble && entendu(k) ? phraseRetour(speaker) : undefined;
    const text = short ?? md;
    setAffiche(text);
    if (!auto) { setOpen(false); return; }
    setOpen(false); setProgress(reduce ? 1 : 0);
    const t = window.setTimeout(() => { void speak(speaker, text, { auto: true, babble }); }, delai);
    return () => { window.clearTimeout(t); forget(lineKey(speaker, text, babble)); };
  }, [speaker, md, babble]); // eslint-disable-line react-hooks/exhaustive-deps

  // Suivre la file de parole : la bulle s'ouvre quand son tour arrive, s'écrit, puis se ferme.
  useEffect(() => {
    if (!key) return;
    let raf = 0, closeT = 0;
    const apply = () => {
      const s = getVoiceState();
      if (s.key === key && s.speaking) {
        window.clearTimeout(closeT);
        setOpen(true); setSpeaking(true); setLevel(s.level);
        const p = reduce ? 1 : Math.min(1, (performance.now() - s.start) / 1000 / Math.max(0.3, s.duration * 0.92));
        setProgress(p);
        cancelAnimationFrame(raf);
        if (p < 1) raf = requestAnimationFrame(apply);
      } else if (s.key === key && !s.speaking) {
        setSpeaking(false); setLevel(0); setProgress(1);
        if (!garder) closeT = window.setTimeout(() => { if (keyRef.current === key && !enCours(key)) setOpen(false); }, 450);
      }
    };
    apply();
    const off = onVoice(apply);
    return () => { off(); cancelAnimationFrame(raf); window.clearTimeout(closeT); };
  }, [key, garder, reduce]);

  // Une question reste ouverte même si le joueur coupe la parole.
  useEffect(() => { if (garder && affiche) { const t = window.setTimeout(() => setOpen(true), auto ? delai + 50 : 0); return () => window.clearTimeout(t); } }, [garder, affiche]); // eslint-disable-line react-hooks/exhaustive-deps

  const dire = (text: string) => { setAffiche(text); setProgress(reduce ? 1 : 0); void speak(speaker!, text, { babble }); };
  /** Toucher le personnage : il relit sa réplique ; ensuite, chaque toucher le fait réagir. */
  const toucher = () => {
    if (!speaker) return;
    if (!md) { const r = reactionToucher(speaker); if (r) dire(r); return; }
    if (!relu.current || babble) { relu.current = true; dire(md); return; }
    const r = reactionToucher(speaker);
    dire(r ?? md);
  };
  /** Toucher la bulle : la voix se tait et la bulle se range (une question reste ouverte). */
  const fermer = () => { if (speaking) stopVoice(); setProgress(1); if (!garder) setOpen(false); };
  const total = plain(affiche).length;
  const typed = Math.ceil(progress * total);
  return { affiche, open, typed, total, done: typed >= total, speaking, level, toucher, fermer, dire };
}

/** Le personnage dans son petit hublot rond : il respire, s'anime quand il parle, et réagit au toucher. */
export function Portrait({ speaker, size = 52, talk = 0, happy, mood, onTap, label }: { speaker: Speaker; size?: number; talk?: number; happy?: boolean; mood?: OraMood; onTap?: () => void; label?: string }) {
  const room = roomOfSpeaker(speaker);
  useProgress(); // l'état de réveil suit la progression
  const awake = eveille(speaker);
  const [jump, setJump] = useState(0);
  const hue = hueDe(speaker);
  const inner = speaker === "ora"
    ? <OraDrone size={size - 4} mood={mood ?? (happy ? "happy" : awake ? "neutral" : "sleep")} talk={talk || undefined} />
    : <CrewFigure id={room} state={awake || happy ? "awake" : "asleep"} mood={happy ? "happy" : "neutral"} crop="head" size={size} label={nomDe(speaker)} />;
  return (
    <motion.button type="button" className="portrait" aria-label={label ?? `Toucher ${nomDe(speaker)}`}
      onClick={(e) => { e.stopPropagation(); setJump((j) => j + 1); onTap?.(); }}
      key={jump} animate={jump ? { y: [0, -8, 0, -3, 0], rotate: [0, -8, 6, 0] } : undefined} transition={{ duration: 0.5 }}
      style={{ width: size, height: size, borderColor: `hsl(${hue} 90% 60% / ${0.35 + talk * 0.6})`, boxShadow: `0 0 ${6 + talk * 18}px hsl(${hue} 100% 60% / ${0.2 + talk * 0.5})` }}>
      {inner}
      {!awake && !happy && <span className="portrait-z mono" aria-hidden="true">z</span>}
    </motion.button>
  );
}

/** Teinte du personnage : celle de son caisson. */
export const hueDe = (speaker: Speaker) => room(roomOfSpeaker(speaker))?.hue ?? 190;

/** Le contenu d'une bulle : nom du personnage, texte écrit au rythme de la voix, choix éventuels. */
export function BulleCorps({ speaker, b, choix, onChoix, extra }: { speaker: Speaker; b: ReturnType<typeof useBulle>; choix?: string[]; onChoix?: (i: number) => void; extra?: ReactNode }) {
  const settings = useSettings();
  useProgress();
  const asleep = !eveille(speaker);
  const hue = hueDe(speaker);
  const txt = plain(b.affiche);
  return (
    <>
      <div className="mono bulle-nom" style={{ color: `hsl(${hue} 100% 72%)` }}>
        {nomDe(speaker).toUpperCase()}{asleep && <span className="bulle-dort"> · parle en dormant</span>}
        {b.speaking && settings.voices && <span className="voice-bars" aria-hidden="true">{[0, 1, 2].map((i) => <i key={i} style={{ transform: `scaleY(${0.3 + b.level * (0.7 - i * 0.12)})` }} />)}</span>}
      </div>
      <div className="bulle-texte" style={{ fontStyle: asleep ? "italic" : undefined, color: asleep ? "var(--text-2)" : undefined }}>
        {b.done ? <RichText md={b.affiche} /> : <span>{txt.slice(0, b.typed)}<span style={{ opacity: 0 }}>{txt.slice(b.typed)}</span></span>}
      </div>
      {choix && b.done && (
        <motion.div className="bulle-choix" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
          {choix.map((c, i) => (
            <button key={c} type="button" className="btn" onClick={(e) => { e.stopPropagation(); stopVoice(); onChoix?.(i); }}
              style={{ borderColor: `hsl(${hue} 90% 60% / .45)` }}>{c}</button>
          ))}
        </motion.div>
      )}
      {extra}
    </>
  );
}

/**
 * La bulle seule, pour un personnage déjà dessiné ailleurs (sa capsule) : elle ne s'affiche que pendant qu'il parle
 * (ou tant qu'une question attend sa réponse). Fermée, une petite mention invite à toucher le personnage.
 */
export function BulleBoite({ speaker, b, choix, onChoix, extra, indice = true, vers }: { speaker: Speaker; b: ReturnType<typeof useBulle>; choix?: string[]; onChoix?: (i: number) => void; extra?: ReactNode; indice?: boolean; vers?: "bas" | "gauche" }) {
  const hue = hueDe(speaker);
  return (
    <>
      <AnimatePresence>
        {b.open && b.affiche && (
          <motion.div key={b.affiche} className={`bulle ${vers ? `vers-${vers}` : ""}`} role="status" aria-live="polite" onClick={b.fermer}
            initial={{ opacity: 0, y: 6, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 420, damping: 30 }}
            style={{ borderColor: `hsl(${hue} 90% 60% / ${0.4 + (b.speaking ? b.level : 0) * 0.45})`, background: `linear-gradient(135deg, hsl(${hue} 55% 15%), #080d19 62%)` }}>
            <BulleCorps speaker={speaker} b={b} choix={choix} onChoix={onChoix} extra={extra} />
          </motion.div>
        )}
      </AnimatePresence>
      {indice && !(b.open && b.affiche) && b.affiche && <button type="button" className="bulle-indice mono" onClick={b.toucher}>Touche {nomDe(speaker)} pour l'entendre</button>}
    </>
  );
}

/**
 * Un personnage et sa bulle, côte à côte (Forma Trisse sur la carte, un membre sur une page annexe…). Le personnage
 * reste visible ; le toucher le fait reparler.
 */
export function Bulle({ speaker, md, choix, onChoix, compact, mood, options, extra }: {
  speaker: Speaker; md?: string; choix?: string[]; onChoix?: (i: number) => void; compact?: boolean; mood?: OraMood; options?: BulleOptions; extra?: ReactNode;
}) {
  const b = useBulle(speaker, md, { retour: true, ...options, garder: options?.garder ?? !!choix });
  return (
    <div className="bulle-ligne">
      <Portrait speaker={speaker} size={compact ? 46 : 54} talk={b.speaking ? b.level : 0} mood={mood} onTap={b.toucher} />
      <div className="bulle-col"><BulleBoite speaker={speaker} b={b} choix={choix} onChoix={onChoix} extra={extra} /></div>
    </div>
  );
}

/** Bulle de Forma Trisse (identifiant de voix « ora »). */
export function OraSays({ md, mood, compact, choix, onChoix, options }: { md: string; mood?: OraMood; compact?: boolean; choix?: string[]; onChoix?: (i: number) => void; options?: BulleOptions }) {
  return <Bulle speaker="ora" md={md} mood={mood} compact={compact} choix={choix} onChoix={onChoix} options={options} />;
}

/** Bulle d'un membre de l'équipe, dans son caisson ou sur sa fiche. */
export function MemberSays({ md, room, choix, onChoix, options }: { md: string; room: string; choix?: string[]; onChoix?: (i: number) => void; options?: BulleOptions }) {
  return <Bulle speaker={room === "c00" ? "ora" : room} md={md} choix={choix} onChoix={onChoix} options={options} />;
}

/**
 * La bulle d'un personnage déjà dessiné ailleurs (sa capsule, sur l'écran de fin de protocole…), sans second portrait.
 * `vers="bas"` : la bulle est posée au-dessus du personnage, sa pointe vers lui ; `vers="gauche"` : à sa droite.
 */
export function BulleSeule({ speaker, md, options, vers }: { speaker: Speaker; md?: string; options?: BulleOptions; vers?: "bas" | "gauche" }) {
  const b = useBulle(speaker, md, { retour: true, ...options });
  return <div className={`bulle-col ${vers ? `vers-${vers}` : ""}`}><BulleBoite speaker={speaker} b={b} vers={vers} /></div>;
}

/** Une réponse écrite sur le moment par Claude : le personnage la « dit » en babillage, au rythme de l'écriture. */
export function ReponseBabil({ speaker, md }: { speaker: Speaker; md: string }) {
  const kind: Babil = speaker === "ora" ? "vif" : eveille(speaker) ? "grave" : "dort";
  const b = useBulle(speaker, md, { babble: kind, garder: true, retour: false, delai: 80 });
  return <div className="bulle-col"><BulleBoite speaker={speaker} b={b} indice={false} /></div>;
}
