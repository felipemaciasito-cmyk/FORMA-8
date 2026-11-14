// Puces de module (notions) et emblèmes de badges : le vocabulaire visuel
// « matériel de datacenter » qui remplace les emoji.
import { useId } from "react";
import { notionOrigin } from "../content";
import { dueNotions } from "../lib/game";
import { useReduceMotion } from "../lib/motion";
import { useProgress } from "../lib/store";
import { GLYPHS } from "./glyphs";
import { GlyphLayers, glyphOf } from "./Icon";

// ---------- Géométrie ----------
const n = (v: number) => +v.toFixed(2);
function poly(sides: number, r: number, rotDeg: number, cx = 32, cy = 32) {
  const pts = Array.from({ length: sides }, (_, i) => {
    const a = ((rotDeg + (i * 360) / sides) * Math.PI) / 180;
    return `${n(cx + r * Math.cos(a))} ${n(cy + r * Math.sin(a))}`;
  });
  return `M${pts.join("L")}Z`;
}
const HEX_OUT = poly(6, 26, 0);
const HEX_IN = poly(6, 21, 0);
const PINS = "M25 9.5V5.6M32 9.5V5.6M39 9.5V5.6M25 54.5v3.9M32 54.5v3.9M39 54.5v3.9";
const OCT_OUT = poly(8, 29, 22.5);
const OCT_IN = poly(8, 22.5, 22.5);
// Reflet métallique sur le bord haut-gauche de la plaque.
const SHEEN = (() => {
  const r = 27.4, pts = [157.5, 202.5, 247.5, 292.5].map((d) => {
    const a = (d * Math.PI) / 180;
    return `${n(32 + r * Math.cos(a))} ${n(32 + r * Math.sin(a))}`;
  });
  return `M${pts.join("L")}`;
})();

// ---------- Couleurs ----------
/** Couleur du voyant selon la boîte Leitner (1 = fraîche, 5 = ancrée). */
export const LEITNER_COLORS = ["#ffb547", "#ffd27a", "#3be8ff", "#45f5cf", "#4dffa0"];
export const LEITNER_LABELS = ["fraîche", "en rodage", "stable", "solide", "ancrée"];

/** Teinte d'une notion : celle de sa salle, ambre pour une notion venue d'un Signal. */
export function notionHue(id: string) {
  const o = notionOrigin(id);
  if (o.room) return o.room.hue;
  if (o.missionId) return 38;
  return 190;
}

export type ChipState = "locked" | "idle" | "learned" | "due";

// ---------- Puce de module ----------
/**
 * Puce hexagonale façon composant matériel : cadre teinté selon la salle, glyphe
 * de la notion, voyant et réglette indiquant la boîte Leitner.
 * trace : le tracé se dessine (notion qui vient d'être débloquée), sauf animations réduites.
 */
export function ModuleChip({ icon, hue, state, box = 0, size = 56, trace, label }: {
  icon?: string; hue: number; state: ChipState; box?: number; size?: number; trace?: boolean; label?: string;
}) {
  const reduce = useReduceMotion();
  const anim = !!trace && !reduce;
  const on = state === "learned" || state === "due";
  const frame = state === "locked" ? "#2c3956" : `hsl(${hue} 100% 64%)`;
  const glyphColor = state === "locked" ? "#3a4766" : state === "idle" ? `hsl(${hue} 85% 74%)` : `hsl(${hue} 100% 72%)`;
  const led = state === "due" ? "#ff4d6d" : on ? LEITNER_COLORS[Math.max(0, Math.min(4, box - 1))] : "#1c2740";
  const glow = state === "locked" ? "none"
    : state === "due" ? "drop-shadow(0 0 6px rgba(255,77,109,.55))"
    : `drop-shadow(0 0 ${state === "idle" ? 4 : 7}px hsl(${hue} 100% 60% / ${state === "idle" ? 0.28 : 0.5}))`;
  const tr = anim ? { pathLength: 1, className: "tr" } : {};
  const aria = label ?? (state === "locked" ? "Notion verrouillée" : on ? `Boîte ${box} sur 5${state === "due" ? ", à réviser" : ""}` : undefined);
  return (
    <svg className={`mchip ${anim ? "mc-trace" : ""}`} width={size} height={size} viewBox="0 0 64 64" style={{ filter: glow }}
      {...(aria ? { role: "img", "aria-label": aria } : { "aria-hidden": true })}>
      <path d={HEX_OUT} fill="#0a1120" stroke={frame} strokeWidth={2} strokeLinejoin="round" strokeDasharray={state === "locked" ? "3 3" : undefined} {...(state === "locked" ? {} : tr)} />
      <path d={HEX_IN} fill={`hsl(${hue} 90% 55% / ${state === "locked" ? 0.02 : 0.09})`} stroke={frame} strokeOpacity={0.32} strokeWidth={1} strokeLinejoin="round" {...tr} />
      <path d={PINS} stroke={frame} strokeWidth={2} strokeLinecap="round" opacity={0.7} {...tr} />
      <svg x={18} y={14} width={28} height={28} viewBox="0 0 24 24" fill="none" stroke={glyphColor} strokeWidth={1.8}
        strokeLinecap="round" strokeLinejoin="round" style={{ color: glyphColor }} className="mc-glyph">
        <GlyphLayers glyph={state === "locked" ? GLYPHS.lock : glyphOf(icon)} trace={anim} />
      </svg>
      <g className={anim ? "fi" : undefined}>
        {[0, 1, 2, 3, 4].map((k) => (
          <rect key={k} x={20.7 + k * 4.8} y={45} width={3.4} height={1.8} rx={0.9} fill={on && k < box ? led : "#18223a"} />
        ))}
        {on && <circle cx={47} cy={15.5} r={4.2} fill={led} opacity={0.22} />}
        <circle cx={47} cy={15.5} r={1.9} fill={led} className={state === "due" ? "mc-blink" : undefined} />
      </g>
    </svg>
  );
}

/** Puce d'une notion du glossaire, état calculé depuis la progression. */
export function NotionChip({ id, icon, size = 56, trace, locked }: { id: string; icon?: string; size?: number; trace?: boolean; locked?: boolean }) {
  const p = useProgress();
  const st = p.notions[id];
  const state: ChipState = locked ? "locked" : !st ? "idle" : dueNotions(p).includes(id) ? "due" : "learned";
  return <ModuleChip icon={icon} hue={notionHue(id)} state={state} box={st?.box ?? 0} size={size} trace={trace} />;
}

// ---------- Emblème de badge ----------
/** Plaque octogonale métallique gravée d'un glyphe ; éteinte tant que le badge n'est pas obtenu. */
export function BadgeEmblem({ icon, got, size = 56, label }: { icon: string; got: boolean; size?: number; label?: string }) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const metal = `bm${uid}`, core = `bc${uid}`;
  const ink = got ? "#ffb547" : "#34415e";
  return (
    <svg className="emblem" width={size} height={size} viewBox="0 0 64 64"
      style={{ filter: got ? "drop-shadow(0 0 8px rgba(255,181,71,.42))" : "none" }}
      {...(label ? { role: "img", "aria-label": label } : { "aria-hidden": true })}>
      <defs>
        <linearGradient id={metal} x1="0" y1="0" x2="0" y2="1">
          {got
            ? <><stop offset="0" stopColor="#64779f" /><stop offset=".46" stopColor="#26324f" /><stop offset=".54" stopColor="#141c2e" /><stop offset="1" stopColor="#3a4b72" /></>
            : <><stop offset="0" stopColor="#253049" /><stop offset=".5" stopColor="#131a2a" /><stop offset=".54" stopColor="#0c121e" /><stop offset="1" stopColor="#1b2438" /></>}
        </linearGradient>
        <radialGradient id={core} cx=".5" cy=".38" r=".75">
          <stop offset="0" stopColor={got ? "#22314f" : "#101828"} />
          <stop offset="1" stopColor={got ? "#0a1020" : "#070b14"} />
        </radialGradient>
      </defs>
      <path d={OCT_OUT} fill={`url(#${metal})`} stroke={got ? "#ffb547" : "#27324a"} strokeOpacity={got ? 0.9 : 1} strokeWidth={1.6} strokeLinejoin="round" />
      <path d={SHEEN} fill="none" stroke="#fff" strokeOpacity={got ? 0.32 : 0.08} strokeWidth={1} strokeLinecap="round" strokeLinejoin="round" />
      <path d={OCT_IN} fill={`url(#${core})`} stroke={got ? "#ffb547" : "#1c2639"} strokeOpacity={got ? 0.45 : 1} strokeWidth={1} strokeLinejoin="round" />
      {got && <circle cx={32} cy={32} r={16.5} fill="none" stroke="#ffb547" strokeOpacity={0.16} strokeWidth={1} />}
      {[0, 90, 180, 270].map((d) => {
        const a = (d * Math.PI) / 180, x = n(32 + 25.6 * Math.cos(a)), y = n(32 + 25.6 * Math.sin(a));
        return (
          <g key={d}>
            <circle cx={x} cy={y} r={1.55} fill={got ? "#8e9dbd" : "#2b3650"} />
            <path d={`M${n(x - 0.9)} ${n(y + 0.9)}L${n(x + 0.9)} ${n(y - 0.9)}`} stroke={got ? "#2a3550" : "#161e30"} strokeWidth={0.6} />
          </g>
        );
      })}
      <svg x={19} y={19} width={26} height={26} viewBox="0 0 24 24" fill="none" stroke={ink} strokeWidth={1.8}
        strokeLinecap="round" strokeLinejoin="round" style={{ color: ink }}>
        <GlyphLayers glyph={glyphOf(icon)} secondaryOpacity={got ? 0.55 : 0.45} />
      </svg>
    </svg>
  );
}
