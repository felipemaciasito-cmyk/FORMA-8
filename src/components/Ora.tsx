import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { RichText } from "../lib/richtext";
import { Icon } from "./Icon";

// ORA — Opérateur de Relance Automatique. Petit drone à visage LED.
export type OraMood = "neutral" | "happy" | "alert" | "think";

export function OraDrone({ mood = "neutral", size = 64 }: { mood?: OraMood; size?: number }) {
  const [blink, setBlink] = useState(false);
  useEffect(() => {
    const id = setInterval(() => { setBlink(true); setTimeout(() => setBlink(false), 140); }, 3200 + Math.random() * 1500);
    return () => clearInterval(id);
  }, []);
  const eye = mood === "alert" ? "#ff4d6d" : mood === "happy" ? "#4dffa0" : "#3be8ff";
  return (
    <motion.svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true"
      animate={{ y: [0, -4, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
      <defs>
        <radialGradient id="ora-body" cx="40%" cy="30%" r="80%">
          <stop offset="0" stopColor="#2a3a5c" /><stop offset="1" stopColor="#0c1424" />
        </radialGradient>
        <filter id="ora-glow"><feGaussianBlur stdDeviation="1.6" /></filter>
      </defs>
      {/* antenne */}
      <line x1="32" y1="10" x2="32" y2="4" stroke="#6b7a96" strokeWidth="2" strokeLinecap="round" />
      <motion.circle cx="32" cy="4" r="2.6" fill={eye} animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.6, repeat: Infinity }} />
      {/* hélices */}
      <motion.ellipse cx="10" cy="22" rx="8" ry="1.6" fill="#3be8ff" opacity=".35" animate={{ scaleX: [1, 0.3, 1] }} transition={{ duration: 0.18, repeat: Infinity }} />
      <motion.ellipse cx="54" cy="22" rx="8" ry="1.6" fill="#3be8ff" opacity=".35" animate={{ scaleX: [0.3, 1, 0.3] }} transition={{ duration: 0.18, repeat: Infinity }} />
      <line x1="10" y1="22" x2="18" y2="28" stroke="#2a3a5c" strokeWidth="3" strokeLinecap="round" />
      <line x1="54" y1="22" x2="46" y2="28" stroke="#2a3a5c" strokeWidth="3" strokeLinecap="round" />
      {/* corps */}
      <rect x="14" y="12" width="36" height="34" rx="14" fill="url(#ora-body)" stroke="rgba(125,200,255,.35)" strokeWidth="1.2" />
      {/* écran */}
      <rect x="19" y="19" width="26" height="17" rx="7" fill="#03070f" />
      <g filter="url(#ora-glow)" opacity=".8">
        <Eyes mood={mood} blink={blink} color={eye} />
      </g>
      <Eyes mood={mood} blink={blink} color={eye} />
      {/* réacteur */}
      <motion.ellipse cx="32" cy="52" rx="7" ry="2.4" fill={eye} opacity=".5" animate={{ opacity: [0.2, 0.6, 0.2], rx: [5, 8, 5] }} transition={{ duration: 1.2, repeat: Infinity }} />
    </motion.svg>
  );
}

function Eyes({ mood, blink, color }: { mood: OraMood; blink: boolean; color: string }) {
  if (blink) return <g stroke={color} strokeWidth="2.4" strokeLinecap="round"><line x1="24" y1="28" x2="29" y2="28" /><line x1="35" y1="28" x2="40" y2="28" /></g>;
  if (mood === "happy") return <g stroke={color} strokeWidth="2.4" fill="none" strokeLinecap="round"><path d="M23.5 29.5q3-4 6 0" /><path d="M34.5 29.5q3-4 6 0" /></g>;
  if (mood === "alert") return <g fill={color}><rect x="24" y="24" width="5" height="7" rx="1.5" /><rect x="35" y="24" width="5" height="7" rx="1.5" /></g>;
  if (mood === "think") return <g fill={color}><circle cx="26.5" cy="26" r="2.6" /><circle cx="37.5" cy="26" r="2.6" /></g>;
  return <g fill={color}><circle cx="26.5" cy="27.5" r="3" /><circle cx="37.5" cy="27.5" r="3" /></g>;
}

export function OraSays({ md, mood = "neutral", compact }: { md: string; mood?: OraMood; compact?: boolean }) {
  return (
    <div className="ora-says" style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
      <div style={{ flex: "none", marginTop: compact ? -4 : -8 }}><OraDrone mood={mood} size={compact ? 46 : 58} /></div>
      <motion.div className="ora-bubble" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.35 }}
        style={{ flex: 1, position: "relative", padding: "12px 14px", borderRadius: "4px 16px 16px 16px", background: "linear-gradient(135deg, rgba(59,232,255,.12), rgba(167,139,250,.08))", border: "1px solid rgba(59,232,255,.25)" }}>
        <div className="mono" style={{ fontSize: 10.5, letterSpacing: ".14em", color: "var(--cyan)", marginBottom: 4, display: "flex", alignItems: "center", gap: 2 }}>ORA <Icon name="chevron-right" size={11} stroke={2.6} /></div>
        <RichText md={md} />
      </motion.div>
    </div>
  );
}
