import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { dueNotions, levelOf, onFx, uptime, type FxEvent } from "../lib/game";
import { go } from "../lib/router";
import { sfx } from "../lib/sound";
import { useEnergyBar } from "../lib/energy";
import { useProgress, useSettings } from "../lib/store";
import { BadgeEmblem } from "./Emblems";
import { Icon, type IconId } from "./Icon";

// ---------------- HUD (barre du haut) ----------------
export function Hud() {
  const p = useProgress();
  // Pendant un protocole, les kW gagnés attendent dans la barre d'énergie : le compteur les reçoit à la fin.
  const bar = useEnergyBar();
  const shown = Math.max(0, p.energy - bar.held);
  const [glow, setGlow] = useState(false);
  const prevHeld = useRef(bar.held);
  useEffect(() => {
    const was = prevHeld.current;
    prevHeld.current = bar.held;
    if (was > 0 && bar.held === 0) { setGlow(true); const t = window.setTimeout(() => setGlow(false), 900); return () => window.clearTimeout(t); }
  }, [bar.held]);
  const lv = levelOf(p.energy);
  const up = uptime(p.days);
  const due = dueNotions(p).length;
  return (
    <header className="hud no-print">
      <div className="hud-row">
        <button className="hud-level" onClick={() => go("base/badges")} aria-label={`Niveau ${lv.index} : ${lv.title}`}>
          <span className="badge" data-l={lv.index} style={{ ["--p" as string]: lv.pct }} />
          <span className="lbl">Accréditation<b>{lv.title}</b></span>
        </button>
        <span className="hud-spacer" />
        <motion.span className="hud-stat kw" aria-label={`${p.energy} kilowatts d'énergie`} animate={glow ? { scale: [1, 1.22, 1] } : { scale: 1 }} transition={{ duration: 0.45 }}
          style={{ transition: "box-shadow .3s, border-color .3s", ...(glow ? { borderColor: "var(--cyan)", boxShadow: "0 0 0 3px rgba(59,232,255,.18), 0 0 22px rgba(59,232,255,.8)" } : {}) }}>
          <Icon name="bolt" size={14} /> <Rolling value={shown} />
        </motion.span>
        <span className="hud-stat up" aria-label={`Uptime ${up} jours`}>
          <motion.span style={{ display: "inline-flex" }} animate={up > 0 ? { scale: [1, 1.18, 1], rotate: [0, -6, 0] } : {}} transition={{ duration: 1.4, repeat: Infinity, repeatDelay: 1.2 }}><Icon name="flame" size={14} /></motion.span> {up}j
        </span>
        {due > 0 && <button className="hud-stat hot" onClick={() => go("maintenance")} aria-label={`${due} notions à réviser`}><Icon name="thermo" size={14} /> {due}</button>}
      </div>
      {/* Variante B : jauge vers le prochain grade, sous la barre du haut. */}
      <div aria-hidden="true" style={{ maxWidth: 640, margin: "6px auto 0", height: 3, borderRadius: 2, background: "rgba(255,255,255,.06)", overflow: "hidden" }}>
        <motion.div initial={false} animate={{ width: `${lv.pct}%` }} transition={{ duration: 0.9, ease: "easeOut" }}
          style={{ height: "100%", background: "linear-gradient(90deg, var(--cyan), var(--led))", boxShadow: "0 0 8px var(--led)" }} />
      </div>
    </header>
  );
}

/** Compteur qui défile jusqu'à sa nouvelle valeur (variante B). */
function Rolling({ value }: { value: number }) {
  const [v, setV] = useState(value);
  const from = useRef(value);
  useEffect(() => {
    let raf = 0;
    const a = from.current, t0 = performance.now();
    const tick = (t: number) => {
      const k = Math.min(1, (t - t0) / 900);
      setV(Math.round(a + (value - a) * (1 - Math.pow(1 - k, 3))));
      if (k < 1) raf = requestAnimationFrame(tick); else from.current = value;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <>{v}</>;
}

// ---------------- Barre d'onglets ----------------
const TABS = [
  { id: "", label: "Carte", icon: "map" },
  { id: "base", label: "Base", icon: "base" },
  { id: "maintenance", label: "Maint.", icon: "maint" },
  { id: "atelier", label: "Atelier", icon: "forge" },
  { id: "reglages", label: "Réglages", icon: "gear" },
];

export function TabBar({ active }: { active: string }) {
  const p = useProgress();
  const due = dueNotions(p).length;
  return (
    <nav className="tabbar no-print" aria-label="Navigation principale">
      <div className="tabbar-row">
        {TABS.map((t) => {
          const on = t.id === active;
          return (
            <button key={t.id} className={`tab ${on ? "on" : ""}`} onClick={() => { sfx("tap"); go(t.id); }} aria-current={on ? "page" : undefined}>
              {on && <motion.span layoutId="tab-glow" className="tab-glow" />}
              <Icon name={t.icon} />
              {t.label}
              {t.id === "maintenance" && due > 0 && <span className="pip">{due}</span>}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

// ---------------- Effets : toasts + éclats de particules ----------------
const TONE: Record<string, string> = { led: "var(--led)", cyan: "var(--cyan)", amber: "var(--amber)", red: "var(--red)" };
interface Toast { id: number; icon: IconId; text: string; tone?: string; badge?: string }

export function FxLayer() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const canvas = useRef<HTMLCanvasElement>(null);
  const settings = useSettings();
  const reduce = settings.reduceMotion === "on" || (settings.reduceMotion === "auto" && window.matchMedia("(prefers-reduced-motion: reduce)").matches);

  useEffect(() => onFx((e: FxEvent) => {
    if (e.type === "toast") {
      const id = Date.now() + Math.random();
      setToasts((t) => [...t.slice(-2), { id, icon: e.icon, text: e.text, tone: e.tone, badge: e.badge }]);
      setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2600);
    }
    if (e.type === "burst" && !reduce) burst(canvas.current, e.x, e.y, e.color);
  }), [reduce]);

  return (
    <>
      <canvas ref={canvas} style={{ position: "fixed", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 95 }} />
      <div className="toast-zone" aria-live="polite">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div key={t.id} layout className="toast" initial={{ opacity: 0, y: -16, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10 }}
              style={{ borderColor: t.tone === "led" ? "rgba(77,255,160,.5)" : t.tone === "amber" ? "rgba(255,181,71,.5)" : t.tone === "red" ? "rgba(255,77,109,.5)" : undefined }}>
              <span className="ic" style={{ color: TONE[t.tone ?? "cyan"] }}>{t.badge ? <BadgeEmblem icon={t.icon} got size={30} /> : <Icon name={t.icon} size={20} />}</span>{t.text}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </>
  );
}

function burst(c: HTMLCanvasElement | null, x?: number, y?: number, color = "#3be8ff") {
  if (!c) return;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  c.width = window.innerWidth * dpr; c.height = window.innerHeight * dpr;
  const ctx = c.getContext("2d"); if (!ctx) return;
  ctx.scale(dpr, dpr);
  const cx = x ?? window.innerWidth / 2, cy = y ?? window.innerHeight * 0.45;
  // Blanc et cyan seulement pour l'énergie (choix du 15/11/2026), plus la couleur demandée.
  const colors = [color, "#ffffff", "#ffffff", "#3be8ff"];
  const parts = Array.from({ length: 70 }, () => {
    const a = Math.random() * Math.PI * 2, s = 2 + Math.random() * 7;
    return { x: cx, y: cy, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 2, life: 1, r: 1.5 + Math.random() * 2.5, c: colors[Math.floor(Math.random() * colors.length)] };
  });
  let raf = 0;
  const step = () => {
    ctx.clearRect(0, 0, c.width, c.height);
    let alive = 0;
    for (const p of parts) {
      if (p.life <= 0) continue;
      alive++;
      p.x += p.vx; p.y += p.vy; p.vy += 0.18; p.vx *= 0.985; p.life -= 0.016;
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.c;
      ctx.shadowColor = p.c; ctx.shadowBlur = 8;
      ctx.fillRect(p.x, p.y, p.r * 2, p.r * 2);
    }
    if (alive) raf = requestAnimationFrame(step); else ctx.clearRect(0, 0, c.width, c.height);
  };
  cancelAnimationFrame(raf);
  step();
}

// ---------------- Feuille du bas ----------------
export function Sheet({ open, onClose, children, label }: { open: boolean; onClose: () => void; children: ReactNode; label: string }) {
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [open, onClose]);
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div key="bd" className="sheet-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div key="sh" className="sheet" role="dialog" aria-modal="true" aria-label={label}
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", stiffness: 380, damping: 36 }}
            drag="y" dragConstraints={{ top: 0, bottom: 0 }} dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_e, info) => { if (info.offset.y > 120 || info.velocity.y > 600) onClose(); }}>
            <div className="sheet-inner">
              <div className="grabber" />
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export function TopBar({ title, kicker, onBack, right }: { title: string; kicker?: string; onBack?: () => void; right?: ReactNode }) {
  return (
    <div className="row" style={{ marginBottom: 14 }}>
      {onBack && <button className="icon-btn" onClick={() => { sfx("tap"); onBack(); }} aria-label="Retour"><Icon name="back" /></button>}
      <div className="grow" style={{ minWidth: 0 }}>
        {kicker && <div className="kicker">{kicker}</div>}
        <div className="h2" style={{ margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{title}</div>
      </div>
      {right}
    </div>
  );
}
