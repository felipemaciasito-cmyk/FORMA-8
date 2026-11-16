import { motion } from "motion/react";
import { useEffect, useId, useState, type ReactNode } from "react";
import { room as getRoom } from "../content";
import { OraDrone } from "./Ora";
import { speakerOf } from "../lib/voice";
import { ReplayButton, useVoiceLine } from "./VoiceButton";

// L'équipe de FORMA-8 : un personnage par caisson, dessiné pour FORMA-8 dans le style d'ORA
// (corps sombre, écran-visage, yeux lumineux, teinte du caisson). Chacun porte l'outil de son métier.
// États : verrouillé (silhouette), endormi (yeux fermés, respiration, « z »), éveillé (yeux allumés, clignements).

export type CrewState = "locked" | "asleep" | "awake";
export type CrewMood = "neutral" | "happy";

interface Palette {
  h: number; accent: string; grad: string; line: string; detail: string; dim: string; metal: string; inner: string; lit: boolean; locked: boolean;
}

type EyeFn = (x: number, y: number, r: number) => ReactNode;
type Draw = (c: Palette, eye: EyeFn) => ReactNode;

// ---------------------------------------------------------------------------------------------
// Les dessins (repère 120 x 140, personnage centré sur x = 60, pieds vers y = 130).
// ---------------------------------------------------------------------------------------------
const feet = (c: Palette, y = 124) => (
  <g fill={c.metal}><rect x="40" y={y} width="14" height="6" rx="3" /><rect x="66" y={y} width="14" height="6" rx="3" /></g>
);
const arm = (d: string, c: Palette) => <path d={d} fill="none" stroke={c.metal} strokeWidth="5" strokeLinecap="round" />;

const DRAW: Record<string, Draw> = {
  // L'Archiviste : un meuble à tiroirs, un œil-objectif, une bande de photos.
  c01: (c, eye) => (
    <>
      <rect x="54" y="8" width="12" height="8" rx="3" fill={c.detail} />
      <line x1="60" y1="16" x2="60" y2="20" stroke={c.metal} strokeWidth="3" />
      <rect x="30" y="20" width="60" height="40" rx="14" fill={c.grad} stroke={c.line} />
      <rect x="37" y="28" width="46" height="24" rx="9" fill="#03070f" />
      {eye(49, 40, 4)}
      <circle cx="71" cy="40" r="8" fill="none" stroke={c.lit ? c.accent : c.dim} strokeWidth="2" opacity={c.locked ? 0 : 1} />
      {eye(71, 40, 3.2)}
      <rect x="52" y="60" width="16" height="6" fill={c.metal} />
      {arm("M34 82 Q24 90 26 102", c)}
      {arm("M86 82 Q98 86 100 96", c)}
      <rect x="34" y="66" width="52" height="58" rx="10" fill={c.grad} stroke={c.line} />
      {[0, 1, 2].map((i) => (
        <g key={i}><rect x="40" y={72 + i * 17} width="40" height="13" rx="3" fill={c.inner} stroke={c.line} strokeWidth=".6" />
          <rect x="55" y={77 + i * 17} width="10" height="3" rx="1.5" fill={c.detail} /></g>
      ))}
      <g transform="rotate(-8 104 104)">
        <rect x="95" y="86" width="19" height="36" rx="2" fill={c.inner} stroke={c.detail} strokeWidth="1.4" />
        {[0, 1, 2].map((i) => <rect key={i} x="98.5" y={89.5 + i * 10.6} width="12" height="8" rx="1" fill={c.lit ? `hsl(${c.h} 45% 32%)` : c.metal} />)}
      </g>
      {feet(c)}
    </>
  ),
  // Le Règlement de bord : casquette d'officier, carrure solide, le registre des règles.
  c02: (c, eye) => (
    <>
      <path d="M36 30 Q38 11 60 9 Q82 11 84 30 Z" fill={c.grad} stroke={c.line} />
      <circle cx="60" cy="20" r="4" fill={c.detail} />
      <path d="M28 33 Q60 24 92 33 L93 37 Q60 29 27 37 Z" fill={c.metal} />
      <rect x="32" y="34" width="56" height="32" rx="12" fill={c.grad} stroke={c.line} />
      <rect x="39" y="41" width="42" height="18" rx="8" fill="#03070f" />
      {eye(51, 50, 4)}{eye(69, 50, 4)}
      {arm("M28 84 Q18 94 22 106", c)}
      <rect x="28" y="70" width="64" height="54" rx="14" fill={c.grad} stroke={c.line} />
      <path d="M46 78 l6 3.5 v7 l-6 3.5 l-6 -3.5 v-7 Z" fill="none" stroke={c.detail} strokeWidth="1.8" />
      <rect x="66" y="82" width="32" height="40" rx="3" fill={c.inner} stroke={c.detail} strokeWidth="1.4" />
      <rect x="76" y="78" width="12" height="7" rx="2" fill={c.metal} />
      {[0, 1, 2, 3].map((i) => <line key={i} x1="71" y1={94 + i * 7} x2={i === 3 ? 84 : 93} y2={94 + i * 7} stroke={c.detail} strokeWidth="1.6" strokeLinecap="round" opacity=".75" />)}
      {feet(c)}
    </>
  ),
  // Le Scribe : silhouette fine, une plume en antenne, un rouleau à écrire.
  c03: (c, eye) => (
    <>
      <path d="M66 24 C72 8 90 0 102 1 C93 8 84 15 70 27 Z" fill={c.detail} opacity=".85" />
      <line x1="70" y1="27" x2="64" y2="30" stroke={c.metal} strokeWidth="2" />
      <rect x="38" y="22" width="44" height="38" rx="18" fill={c.grad} stroke={c.line} />
      <rect x="44" y="32" width="32" height="18" rx="9" fill="#03070f" />
      {eye(54, 41, 3.6)}{eye(66, 41, 3.6)}
      {arm("M46 76 Q38 80 37 88", c)}
      <path d="M46 62 L74 62 L80 120 Q60 126 40 120 Z" fill={c.grad} stroke={c.line} />
      <line x1="44" y1="92" x2="76" y2="92" stroke={c.line} />
      {arm("M74 76 Q86 84 88 96", c)}
      <line x1="87" y1="96" x2="94" y2="106" stroke={c.detail} strokeWidth="2.2" strokeLinecap="round" />
      <rect x="13" y="80" width="26" height="32" rx="2" fill={c.inner} stroke={c.detail} strokeWidth="1.4" />
      <rect x="10" y="76" width="32" height="6" rx="3" fill={c.metal} /><rect x="10" y="110" width="32" height="6" rx="3" fill={c.metal} />
      {[0, 1, 2].map((i) => <line key={i} x1="18" y1={89 + i * 7} x2={i === 2 ? 28 : 34} y2={89 + i * 7} stroke={c.detail} strokeWidth="1.5" opacity=".75" />)}
      {feet(c)}
    </>
  ),
  // La Boucle : une sphère, et un anneau qui tourne autour d'elle.
  c04: (c, eye) => (
    <>
      <g transform="rotate(-14 60 80)">
        <motion.g animate={c.lit ? { rotate: 360 } : undefined} transition={{ duration: 7, repeat: Infinity, ease: "linear" }} style={{ transformOrigin: "60px 80px", transformBox: "view-box" }}>
          <ellipse cx="60" cy="80" rx="52" ry="15" fill="none" stroke={c.detail} strokeWidth="2.6" strokeDasharray="70 20" opacity=".85" />
        </motion.g>
      </g>
      <line x1="60" y1="47" x2="60" y2="37" stroke={c.metal} strokeWidth="3" />
      <circle cx="60" cy="35" r="3.5" fill={c.detail} />
      <circle cx="60" cy="80" r="34" fill={c.grad} stroke={c.line} />
      <rect x="40" y="66" width="40" height="22" rx="11" fill="#03070f" />
      {eye(52, 77, 4)}{eye(68, 77, 4)}
      {[0, 1, 2].map((i) => <circle key={i} cx={52 + i * 8} cy="100" r="2" fill={c.detail} opacity={c.lit ? 0.9 : 0.4} />)}
      <path d="M8 80 A52 15 0 0 0 112 80" transform="rotate(-14 60 80)" fill="none" stroke={c.detail} strokeWidth="2.6" opacity=".55" />
      <g fill={c.metal}><ellipse cx="48" cy="118" rx="8" ry="4" /><ellipse cx="72" cy="118" rx="8" ry="4" /></g>
    </>
  ),
  // L'Inspecteur : une loupe devant l'œil, une liste de contrôle sur la poitrine.
  c05: (c, eye) => (
    <>
      <path d="M33 30 Q60 10 87 30 Z" fill={c.metal} />
      <rect x="32" y="28" width="56" height="36" rx="14" fill={c.grad} stroke={c.line} />
      <rect x="39" y="36" width="42" height="20" rx="9" fill="#03070f" />
      {eye(51, 46, 4)}{eye(71, 46, 5.4)}
      {arm("M36 84 Q26 92 28 104", c)}
      <rect x="36" y="68" width="48" height="54" rx="12" fill={c.grad} stroke={c.line} />
      <rect x="44" y="76" width="32" height="32" rx="4" fill={c.inner} />
      {[0, 1, 2].map((i) => (
        <g key={i}><path d={`M48 ${84 + i * 9} l2.5 2.5 l4.5 -5`} fill="none" stroke={c.detail} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <line x1="58" y1={83 + i * 9} x2="71" y2={83 + i * 9} stroke={c.line} strokeWidth="1.6" /></g>
      ))}
      {arm("M84 84 Q95 82 96 74", c)}
      <line x1="81" y1="56" x2="96" y2="74" stroke={c.metal} strokeWidth="5" strokeLinecap="round" />
      <circle cx="72" cy="46" r="13" fill={c.lit ? `hsl(${c.h} 100% 70% / .08)` : "none"} stroke={c.locked ? c.metal : c.detail} strokeWidth="3" />
      {feet(c)}
    </>
  ),
  // Le Messager : profilé, des ailerons, une sacoche, et une antenne qui émet.
  c06: (c, eye) => (
    <>
      <line x1="60" y1="18" x2="60" y2="9" stroke={c.metal} strokeWidth="3" />
      <circle cx="60" cy="8" r="3" fill={c.detail} />
      {c.lit && [0, 1].map((i) => (
        <motion.path key={i} d={i ? "M46 6 Q60 -10 74 6" : "M52 7 Q60 -2 68 7"} fill="none" stroke={c.accent} strokeWidth="2" strokeLinecap="round"
          animate={{ opacity: [0, 1, 0] }} transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.4 }} />
      ))}
      <rect x="36" y="18" width="48" height="34" rx="17" fill={c.grad} stroke={c.line} />
      <rect x="42" y="27" width="36" height="16" rx="8" fill="#03070f" />
      {eye(54, 35, 3.6)}{eye(66, 35, 3.6)}
      <path d="M42 72 L12 60 L21 80 L41 86 Z" fill={c.metal} stroke={c.detail} strokeOpacity=".5" />
      <path d="M78 72 L108 60 L99 80 L79 86 Z" fill={c.metal} stroke={c.detail} strokeOpacity=".5" />
      <path d="M42 56 Q60 50 78 56 L74 116 Q60 122 46 116 Z" fill={c.grad} stroke={c.line} />
      <line x1="46" y1="58" x2="76" y2="96" stroke={c.detail} strokeWidth="2.4" />
      <rect x="66" y="92" width="22" height="16" rx="3" fill={c.inner} stroke={c.detail} strokeWidth="1.4" />
      <path d="M66 92 L77 101 L88 92" fill="none" stroke={c.detail} strokeWidth="1.4" />
      <motion.ellipse cx="60" cy="123" rx="8" ry="3" fill={c.lit ? c.accent : c.metal} animate={c.lit ? { opacity: [0.35, 0.9, 0.35] } : undefined} transition={{ duration: 0.9, repeat: Infinity }} />
    </>
  ),
  // La Mémoire : un corps de disques empilés, comme une base de données.
  c07: (c, eye) => (
    <>
      <path d="M40 46 Q40 18 60 18 Q80 18 80 46 Z" fill={c.grad} stroke={c.line} />
      <rect x="46" y="28" width="28" height="15" rx="7" fill="#03070f" />
      {eye(55, 35.5, 3.2)}{eye(65, 35.5, 3.2)}
      {arm("M28 86 Q18 92 20 104", c)}{arm("M92 86 Q102 92 100 104", c)}
      {[0, 1, 2].map((i) => {
        const y = 50 + i * 24;
        return (
          <g key={i}>
            <rect x="28" y={y} width="64" height="22" fill={c.grad} stroke={c.line} />
            <ellipse cx="60" cy={y + 22} rx="32" ry="8" fill={c.grad} stroke={c.line} />
            <ellipse cx="60" cy={y} rx="32" ry="8" fill={c.inner} stroke={c.line} />
            <circle cx="40" cy={y + 14} r="2.2" fill={c.detail} opacity={c.lit ? 1 : 0.5} />
            <circle cx="48" cy={y + 15} r="2.2" fill={c.detail} opacity={c.lit ? 0.6 : 0.3} />
          </g>
        );
      })}
      {feet(c, 126)}
    </>
  ),
  // La Sentinelle : casque à visière fente, bouclier frappé d'un cadenas.
  c08: (c, eye) => (
    <>
      <path d="M58 14 L60 5 L62 14 Z" fill={c.detail} />
      <path d="M34 46 Q34 16 60 14 Q86 16 86 46 L86 50 Q60 57 34 50 Z" fill={c.grad} stroke={c.line} />
      <rect x="40" y="31" width="40" height="10" rx="5" fill="#03070f" />
      {!c.locked && (
        <motion.g animate={c.lit ? { x: [0, 25, 0] } : undefined} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
          <rect x={c.lit ? 42 : 54.5} y="33.5" width="11" height="5" rx="2.5" fill={c.lit ? c.accent : c.dim} opacity={c.lit ? 1 : 0.6}
            style={c.lit ? { filter: `drop-shadow(0 0 3px ${c.accent})` } : undefined} />
        </motion.g>
      )}
      {void eye}
      <ellipse cx="31" cy="64" rx="12" ry="8" fill={c.metal} /><ellipse cx="89" cy="64" rx="12" ry="8" fill={c.metal} />
      <path d="M34 58 H86 V90 Q86 112 60 124 Q34 112 34 90 Z" fill={c.grad} stroke={c.line} />
      <rect x="52" y="84" width="16" height="13" rx="2" fill="none" stroke={c.detail} strokeWidth="2.2" />
      <path d="M55 84 V79 a5 5 0 0 1 10 0 V84" fill="none" stroke={c.detail} strokeWidth="2.2" />
      <g fill={c.metal}><rect x="44" y="124" width="12" height="6" rx="3" /><rect x="64" y="124" width="12" height="6" rx="3" /></g>
    </>
  ),
  // Les Escouades et les Réflexes : un meneur et deux petits drones, un éclair sur la poitrine.
  c09: (c, eye) => (
    <>
      {[[22, 30, 0], [98, 30, 0.6]].map(([x, y, d]) => (
        <motion.g key={x} animate={c.lit ? { y: [0, -5, 0] } : undefined} transition={{ duration: 1.8, repeat: Infinity, delay: d, ease: "easeInOut" }}>
          <line x1={x - 9} y1={y - 14} x2={x + 9} y2={y - 14} stroke={c.detail} strokeWidth="2" opacity=".6" />
          <line x1={x} y1={y - 14} x2={x} y2={y - 9} stroke={c.metal} strokeWidth="2" />
          <circle cx={x} cy={y} r="11" fill={c.grad} stroke={c.line} />
          <rect x={x - 7} y={y - 4} width="14" height="8" rx="4" fill="#03070f" />
          {eye(x - 3, y, 1.8)}{eye(x + 3, y, 1.8)}
        </motion.g>
      ))}
      <rect x="40" y="40" width="40" height="32" rx="12" fill={c.grad} stroke={c.line} />
      <rect x="45" y="47" width="30" height="16" rx="7" fill="#03070f" />
      {eye(55, 55, 3.4)}{eye(65, 55, 3.4)}
      {arm("M42 84 Q32 92 34 104", c)}{arm("M78 84 Q88 92 86 104", c)}
      <rect x="42" y="76" width="36" height="46" rx="10" fill={c.grad} stroke={c.line} />
      <path d="M63 82 L54 98 H60 L57 112 L68 94 H62 L65 82 Z" fill={c.detail} />
      {feet(c)}
    </>
  ),
  // Le Lancement : une fusée, un hublot pour visage, une flamme qui s'allume au réveil.
  c10: (c, eye) => (
    <>
      {c.lit && (
        <motion.path d="M49 112 Q60 140 71 112 Z" fill="hsl(35 100% 60%)" style={{ transformOrigin: "60px 112px", transformBox: "view-box", filter: "drop-shadow(0 0 6px hsl(35 100% 60%))" }}
          animate={{ scaleY: [1, 0.7, 1.1, 0.85, 1] }} transition={{ duration: 0.6, repeat: Infinity }} />
      )}
      <path d="M38 88 L20 114 L38 106 Z" fill={c.metal} stroke={c.line} />
      <path d="M82 88 L100 114 L82 106 Z" fill={c.metal} stroke={c.line} />
      <path d="M60 6 C80 22 84 50 82 80 L82 108 Q60 116 38 108 L38 80 C36 50 40 22 60 6 Z" fill={c.grad} stroke={c.line} />
      <rect x="38" y="78" width="44" height="6" fill={c.detail} opacity={c.lit ? 0.7 : 0.3} />
      <circle cx="60" cy="52" r="16" fill="#03070f" stroke={c.locked ? c.metal : c.detail} strokeWidth="2.5" />
      {eye(54, 52, 3.6)}{eye(66, 52, 3.6)}
      <rect x="52" y="108" width="16" height="6" rx="2" fill={c.metal} />
    </>
  ),
};

/** Les métiers de l'équipe, au cas où un caisson n'aurait pas encore de dessin. */
function palette(h: number, st: CrewState, gradId: string): Palette {
  const lit = st === "awake";
  const locked = st === "locked";
  return {
    h, lit, locked,
    accent: `hsl(${h} 100% 64%)`,
    grad: locked ? "#0e1627" : `url(#${gradId})`,
    line: locked ? "#1c2740" : lit ? `hsl(${h} 90% 70% / .55)` : `hsl(${h} 30% 60% / .3)`,
    detail: locked ? "#18233a" : lit ? `hsl(${h} 100% 64%)` : `hsl(${h} 25% 42%)`,
    dim: `hsl(${h} 35% 55%)`,
    metal: locked ? "#131c2e" : lit ? "#2a3a5c" : "#1d2940",
    inner: locked ? "#0c1322" : "#0a1220",
  };
}

// ---------------------------------------------------------------------------------------------
// Le personnage, dans son propre SVG (ou imbriqué dans un autre SVG grâce à x, y, width, height).
// ---------------------------------------------------------------------------------------------
export function CrewFigure({ id, state, mood = "neutral", size = 120, crop, x, y, width, height, label }: {
  id: string; state: CrewState; mood?: CrewMood; size?: number; crop?: "head"; x?: number; y?: number; width?: number; height?: number; label?: string;
}) {
  const uid = useId().replace(/:/g, "");
  const room = getRoom(id);
  const h = room?.hue ?? 190;
  const [blink, setBlink] = useState(false);
  useEffect(() => {
    if (state !== "awake") return;
    let t2 = 0;
    const t = window.setInterval(() => { setBlink(true); t2 = window.setTimeout(() => setBlink(false), 150); }, 3400 + Math.random() * 1800);
    return () => { window.clearInterval(t); window.clearTimeout(t2); };
  }, [state]);

  const viewBox = crop === "head" ? "16 -2 88 88" : "0 0 120 140";
  const w = width ?? size;
  const hgt = height ?? (crop === "head" ? size : size * (140 / 120));
  const common = { x, y, width: w, height: hgt, viewBox, role: label ? ("img" as const) : undefined, "aria-label": label, "aria-hidden": label ? undefined : true, style: { overflow: "visible" as const } };

  // ORA a déjà son propre dessin : elle est en veille tant que son caisson n'est pas terminé.
  if (id === "c00" || !DRAW[id]) {
    return (
      <svg {...common} viewBox={crop === "head" ? "6 4 52 52" : "2 -6 60 70"}>
        <g opacity={state === "locked" ? 0.25 : 1} style={state === "asleep" ? { filter: "saturate(.4) brightness(.8)" } : undefined}>
          <OraDrone mood={state === "awake" ? (mood === "happy" ? "happy" : "neutral") : "think"} size={64} />
        </g>
      </svg>
    );
  }

  const c = palette(h, state, `crew-${uid}`);
  const eyeColor = c.accent;
  const eye: EyeFn = (ex, ey, r) => {
    if (state === "locked") return null;
    if (state === "asleep") return <path d={`M${ex - r} ${ey - 0.5} Q${ex} ${ey + r * 0.9} ${ex + r} ${ey - 0.5}`} fill="none" stroke={c.dim} strokeWidth={Math.max(1.4, r * 0.45)} strokeLinecap="round" />;
    if (blink) return <line x1={ex - r} y1={ey} x2={ex + r} y2={ey} stroke={eyeColor} strokeWidth={Math.max(1.4, r * 0.5)} strokeLinecap="round" />;
    if (mood === "happy") return <path d={`M${ex - r} ${ey + r * 0.4} Q${ex} ${ey - r * 1.1} ${ex + r} ${ey + r * 0.4}`} fill="none" stroke={eyeColor} strokeWidth={Math.max(1.4, r * 0.55)} strokeLinecap="round" />;
    return <circle cx={ex} cy={ey} r={r} fill={eyeColor} style={{ filter: `drop-shadow(0 0 ${r * 0.9}px ${eyeColor})` }} />;
  };

  const body = (
    <>
      <defs>
        <linearGradient id={`crew-${uid}`} x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0" stopColor={state === "awake" ? `hsl(${h} 30% 30%)` : `hsl(${h} 14% 21%)`} />
          <stop offset="1" stopColor="#0a111f" />
        </linearGradient>
      </defs>
      {state === "awake" && <ellipse cx="60" cy="132" rx="34" ry="5" fill={`hsl(${h} 100% 60%)`} opacity=".22" style={{ filter: "blur(3px)" }} />}
      {DRAW[id](c, eye)}
    </>
  );

  return (
    <svg {...common}>
      {state === "awake" ? (
        <motion.g animate={{ y: [0, -2.5, 0] }} transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}>{body}</motion.g>
      ) : state === "asleep" ? (
        <>
          <motion.g animate={{ scaleY: [1, 1.018, 1] }} transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut" }} style={{ transformOrigin: "60px 130px", transformBox: "view-box" }}>{body}</motion.g>
          <Snore hue={h} />
        </>
      ) : body}
    </svg>
  );
}

/** Les « z » d'un membre endormi (des lettres, pas des emoji). */
function Snore({ hue }: { hue: number }) {
  return (
    <g style={{ font: "700 13px var(--mono)" }} fill={`hsl(${hue} 60% 72%)`} aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <motion.text key={i} x={92 + i * 7} y={30 - i * 9} fontSize={10 + i * 2}
          animate={{ opacity: [0, 0.9, 0], y: [0, -10, -18] }} transition={{ duration: 3, repeat: Infinity, delay: i * 0.9, ease: "easeOut" }}>z</motion.text>
      ))}
    </g>
  );
}

// ---------------------------------------------------------------------------------------------
// La capsule : le membre dans son caisson, vitre givrée tant qu'il dort, ouverte quand il est réveillé.
// ---------------------------------------------------------------------------------------------
export function CrewCapsule({ id, state, power = 0, size = 200, mood }: { id: string; state: CrewState; power?: number; size?: number; mood?: CrewMood }) {
  const h = getRoom(id)?.hue ?? 190;
  const accent = `hsl(${h} 100% 64%)`;
  const open = state === "awake";
  const lights = Math.round((power / 100) * 6);
  return (
    <div style={{ position: "relative", width: size, height: size * 1.2 }} aria-hidden="true">
      <svg width={size} height={size * 1.2} viewBox="0 0 200 240" style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        <defs>
          <radialGradient id={`cap-floor-${id}`} cx="50%" cy="50%" r="50%">
            <stop offset="0" stopColor={accent} stopOpacity={state === "locked" ? 0 : open ? 0.55 : 0.18} /><stop offset="1" stopColor={accent} stopOpacity="0" />
          </radialGradient>
          <linearGradient id={`cap-glass-${id}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor={`hsl(${h} 60% 70%)`} stopOpacity=".22" /><stop offset=".45" stopColor={`hsl(${h} 60% 80%)`} stopOpacity=".06" /><stop offset="1" stopColor={`hsl(${h} 60% 70%)`} stopOpacity=".18" />
          </linearGradient>
        </defs>
        <ellipse cx="100" cy="214" rx="92" ry="22" fill={`url(#cap-floor-${id})`} />
        {/* socle */}
        <ellipse cx="100" cy="206" rx="70" ry="16" fill="#0b1322" stroke={state === "locked" ? "#1c2740" : accent} strokeOpacity=".55" />
        <path d="M30 206 v10 a70 16 0 0 0 140 0 v-10" fill="#070c17" />
        {Array.from({ length: 6 }, (_, i) => (
          <rect key={i} x={58 + i * 15} y="214" width="8" height="3" rx="1.5" fill={i < lights ? (open ? "var(--led)" : accent) : "#1f2b40"}
            style={i < lights ? { animation: `blink ${0.9 + (i % 3) * 0.45}s steps(1) infinite` } : undefined} />
        ))}
        {/* arceau arrière */}
        <path d="M40 204 V64 A60 40 0 0 1 160 64 V204" fill="#060b16" stroke={state === "locked" ? "#1c2740" : accent} strokeOpacity=".35" strokeWidth="2" />
      </svg>
      {/* le membre */}
      <div style={{ position: "absolute", left: size * 0.2, top: size * 0.27, width: size * 0.6 }}>
        <CrewFigure id={id} state={state} mood={mood} size={size * 0.6} />
      </div>
      <svg width={size} height={size * 1.2} viewBox="0 0 200 240" style={{ position: "absolute", inset: 0, overflow: "visible", pointerEvents: "none" }}>
        {/* vitre : givrée et fermée tant qu'il dort, remontée quand il est réveillé */}
        <motion.g initial={false} animate={{ y: open ? -150 : 0, opacity: open ? 0 : 1 }} transition={{ duration: 1.1, ease: [0.6, 0, 0.2, 1] }}>
          <path d="M44 202 V66 A56 37 0 0 1 156 66 V202 Z" fill={`url(#cap-glass-${id})`} stroke={state === "locked" ? "#1c2740" : accent} strokeOpacity=".5" />
          {state !== "locked" && <path d="M58 80 Q60 70 70 64" fill="none" stroke="#fff" strokeOpacity=".35" strokeWidth="3" strokeLinecap="round" />}
          {state === "asleep" && (
            <rect x="44" y="150" width="112" height="52" fill={`hsl(${h} 40% 80%)`} opacity=".08" />
          )}
        </motion.g>
        {/* bague du haut */}
        <path d="M36 70 A64 42 0 0 1 164 70" fill="none" stroke={state === "locked" ? "#1c2740" : accent} strokeWidth="5" strokeOpacity={open ? 0.9 : 0.45} strokeLinecap="round"
          style={open ? { filter: `drop-shadow(0 0 6px ${accent})` } : undefined} />
      </svg>
    </div>
  );
}

/**
 * La capsule qui se charge : plus le courant arrive (lux de 0 à 1), plus l'intérieur s'éclaire et plus le membre
 * sort de l'ombre (batterie branchée après chaque protocole, réveil).
 */
export function ChargedCapsule({ id, state, lux, size = 132, mood }: { id: string; state: CrewState; lux: number; size?: number; mood?: CrewMood }) {
  const x = Math.max(0, Math.min(1, lux));
  return (
    <div style={{ position: "relative", width: size, height: size * 1.2 }}>
      <div aria-hidden="true" style={{ position: "absolute", left: -size * 0.25, right: -size * 0.25, bottom: -size * 0.06, height: size * 0.4, borderRadius: "50%",
        background: "radial-gradient(ellipse, rgba(59,232,255,.55), transparent 70%)", opacity: x, transition: "opacity .8s" }} />
      <div style={{ filter: `brightness(${(0.3 + 1.1 * x).toFixed(2)}) saturate(${(0.5 + 0.7 * x).toFixed(2)}) drop-shadow(0 0 ${(4 + 22 * x).toFixed(0)}px rgba(59,232,255,${(0.1 + 0.6 * x).toFixed(2)}))`, transition: "filter .8s" }}>
        <CrewCapsule id={id} state={state} power={Math.round(x * 100)} size={size} mood={mood} />
      </div>
      <div aria-hidden="true" style={{ position: "absolute", left: "22%", right: "22%", top: "26%", bottom: "14%", borderRadius: "40% 40% 8px 8px", pointerEvents: "none", mixBlendMode: "screen",
        background: "radial-gradient(ellipse at 50% 35%, rgba(240,253,255,.95), rgba(59,232,255,.5) 45%, transparent 75%)", opacity: state === "awake" ? 0.25 : 0.85 * x, transition: "opacity .8s" }} />
    </div>
  );
}

/** État d'un membre selon la progression : verrouillé, endormi, ou réveillé. */
export function crewState(unlocked: boolean, complete: boolean): CrewState {
  return complete ? "awake" : unlocked ? "asleep" : "locked";
}

/**
 * Ce que dit un membre de l'équipe (en italique et en sourdine tant qu'il dort). Avec `room` (identifiant du caisson),
 * le membre lit sa réplique de sa propre voix, si elle est enregistrée ; `also` : réplique dite juste avant (par
 * exemple sa présentation, dans sa fiche).
 */
export function MemberSays({ member, hue, md, asleep, room, also }: { member: string; hue: number; md: string; asleep?: boolean; room?: string; also?: string }) {
  const speaker = room ? speakerOf(room) : undefined;
  const intro = useVoiceLine(speaker, also);
  const voice = useVoiceLine(speaker, md);
  const lit = voice.speaking ? voice.level : intro.speaking ? intro.level : 0;
  return (
    <motion.div key={md} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
      style={{ marginTop: 12, padding: "10px 12px", borderRadius: "16px 16px 16px 4px", background: `linear-gradient(135deg, hsl(${hue} 90% 55% / ${asleep ? 0.06 : 0.14}), rgba(12,19,34,.5))`, border: `1px solid hsl(${hue} 90% 60% / ${asleep ? 0.2 : 0.4 + lit * 0.5})`, boxShadow: lit ? `0 0 ${8 + lit * 14}px hsl(${hue} 100% 60% / ${0.15 + lit * 0.3})` : undefined, transition: "box-shadow .08s linear, border-color .08s linear" }}>
      <div className="mono" style={{ fontSize: 10.5, letterSpacing: ".14em", color: `hsl(${hue} 100% 70%)`, marginBottom: 2, display: "flex", alignItems: "center", gap: 6 }}><span className="grow">{member.toUpperCase()}{asleep ? " · PARLE EN DORMANT" : ""}</span><ReplayButton voice={voice} who={member} color={`hsl(${hue} 100% 70%)`} /></div>
      <div style={{ fontStyle: asleep ? "italic" : undefined, color: asleep ? "var(--text-2)" : undefined }}>{md}</div>
    </motion.div>
  );
}
