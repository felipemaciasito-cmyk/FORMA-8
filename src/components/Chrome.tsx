import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { dueNotions, levelOf, onFx, uptime, type FxEvent } from "../lib/game";
import { go } from "../lib/router";
import { sfx } from "../lib/sound";
import { stopVoice, syncVoiceVolume } from "../lib/voice";
import { useEnergyBar } from "../lib/energy";
import { updateSettings, useProgress, useSettings } from "../lib/store";
import { BadgeEmblem } from "./Emblems";
import { Icon, type IconId } from "./Icon";

// ---------------- Notifications (badge débloqué, reprise…) ----------------
// Depuis le 24/11/2026 (demande du propriétaire : rien ne doit cacher un texte ou un bouton), une notification ne
// flotte plus sous la barre du haut, par-dessus la page : elle prend quelques secondes la place du grade, dans la barre
// du haut elle-même, une à la fois et dans l'ordre. Les kW, l'uptime et le son restent visibles.
interface Toast { id: number; icon: IconId; text: string; tone?: string; badge?: string }
const NOTE_MS = 2600;
let notes: Toast[] = [];
const noteSubs = new Set<(t: Toast | null) => void>();
let noteTimer = 0;
const emitNote = () => noteSubs.forEach((f) => f(notes[0] ?? null));
function nextNote() {
  window.clearTimeout(noteTimer);
  if (!notes.length) { emitNote(); return; }
  emitNote();
  noteTimer = window.setTimeout(() => { notes = notes.slice(1); nextNote(); }, NOTE_MS);
}
if (typeof window !== "undefined") onFx((e: FxEvent) => {
  if (e.type !== "toast") return;
  const t = { id: Date.now() + Math.random(), icon: e.icon, text: e.text, tone: e.tone, badge: e.badge };
  const idle = !notes.length;
  notes = [...notes, t].slice(-4);
  if (idle) nextNote(); else emitNote();
});
function useNote() {
  const [n, setN] = useState<Toast | null>(notes[0] ?? null);
  useEffect(() => { noteSubs.add(setN); return () => { noteSubs.delete(setN); }; }, []);
  return n;
}

// ---------------- HUD (barre du haut) ----------------
export function Hud() {
  const note = useNote();
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
        <AnimatePresence mode="wait" initial={false}>
          {note ? (
            <motion.div key={note.id} className="hud-note toast" role="status" aria-live="polite"
              initial={{ opacity: 0, y: -10, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.22 }}
              style={{ borderColor: note.tone === "led" ? "rgba(77,255,160,.5)" : note.tone === "amber" ? "rgba(255,181,71,.5)" : note.tone === "red" ? "rgba(255,77,109,.5)" : undefined }}>
              <span className="ic" style={{ color: TONE[note.tone ?? "cyan"] }}>{note.badge ? <BadgeEmblem icon={note.icon} got size={26} /> : <Icon name={note.icon} size={18} />}</span>
              <span className="hud-note-txt">{note.text}</span>
            </motion.div>
          ) : (
            <motion.div key="grade" className="hud-left" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
              <button className="hud-level" onClick={() => go("base/badges")} aria-label={`Niveau ${lv.index} : ${lv.title}`}>
                <span className="badge" data-l={lv.index} style={{ ["--p" as string]: lv.pct }} />
                <span className="lbl">Accréditation<b>{lv.title}</b></span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
        <span className="hud-spacer" />
        <motion.span className="hud-stat kw" aria-label={`${p.energy} kilowatts d'énergie`} animate={glow ? { scale: [1, 1.22, 1] } : { scale: 1 }} transition={{ duration: 0.45 }}
          style={{ transition: "box-shadow .3s, border-color .3s", ...(glow ? { borderColor: "var(--cyan)", boxShadow: "0 0 0 3px rgba(59,232,255,.18), 0 0 22px rgba(59,232,255,.8)" } : {}) }}>
          <Icon name="bolt" size={14} /> <Rolling value={shown} />
        </motion.span>
        <span className="hud-stat up" aria-label={`Uptime ${up} jours`}>
          <motion.span style={{ display: "inline-flex" }} animate={up > 0 ? { scale: [1, 1.18, 1], rotate: [0, -6, 0] } : {}} transition={{ duration: 1.4, repeat: Infinity, repeatDelay: 1.2 }}><Icon name="flame" size={14} /></motion.span> {up}j
        </span>
        {due > 0 && <button className="hud-stat hot" onClick={() => go("maintenance")} aria-label={`${due} notions à réviser`}><Icon name="thermo" size={14} /> {due}</button>}
        <SoundButton />
      </div>
      {/* Variante B : jauge vers le prochain grade, sous la barre du haut. */}
      <div aria-hidden="true" style={{ maxWidth: 640, margin: "6px auto 0", height: 3, borderRadius: 2, background: "rgba(255,255,255,.06)", overflow: "hidden" }}>
        <motion.div initial={false} animate={{ width: `${lv.pct}%` }} transition={{ duration: 0.9, ease: "easeOut" }}
          style={{ height: "100%", background: "linear-gradient(90deg, var(--cyan), var(--led))", boxShadow: "0 0 8px var(--led)" }} />
      </div>
    </header>
  );
}

// ---------------- Son : bouton de la barre du haut (demande du propriétaire, 15/11/2026) ----------------
/**
 * Haut-parleur toujours visible : un toucher déroule juste dessous un petit menu discret (effets et fond sonore,
 * chacun avec son interrupteur et son volume). Un toucher ailleurs le referme (souhait du propriétaire, 15/11/2026).
 */
function SoundButton() {
  const s = useSettings();
  const [open, setOpen] = useState(false);
  const on = s.sound || s.ambience || (s.voices ?? true);
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [open]);
  return (
    <>
      <button className={`hud-stat snd ${on ? "" : "off"}`} onClick={() => { sfx("tap"); setOpen((o) => !o); }} aria-expanded={open} aria-label={`Son ${on ? "activé" : "coupé"} : régler le son`}>
        <Icon name={on ? "speaker" : "speaker-off"} size={16} />
      </button>
      <AnimatePresence>
        {open && (<>
          <div key="away" className="snd-away" onClick={() => setOpen(false)} />
          <motion.div key="menu" className="snd-menu" role="dialog" aria-label="Réglage du son"
            initial={{ opacity: 0, y: -6, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6, scale: 0.97 }} transition={{ duration: 0.16 }}>
            <SoundRow label="Effets" on={s.sound} volume={s.sfxVolume ?? 1}
              onToggle={(v) => { updateSettings({ sound: v }); if (v) window.setTimeout(() => sfx("ok"), 60); }}
              onVolume={(v) => { updateSettings({ sfxVolume: v }); window.setTimeout(() => sfx("cell"), 30); }} />
            <SoundRow label="Fond sonore" on={s.ambience} volume={s.ambienceVolume ?? 0.6}
              onToggle={(v) => updateSettings({ ambience: v })} onVolume={(v) => updateSettings({ ambienceVolume: v })} />
            <SoundRow label="Voix" on={s.voices ?? true} volume={s.voiceVolume ?? 1}
              onToggle={(v) => { updateSettings({ voices: v }); if (!v) stopVoice(); }}
              onVolume={(v) => { updateSettings({ voiceVolume: v }); syncVoiceVolume(); }} />
          </motion.div>
        </>)}
      </AnimatePresence>
    </>
  );
}

/** Une ligne du petit menu du son : interrupteur, nom, curseur de volume. */
function SoundRow({ label, on, volume, onToggle, onVolume }: { label: string; on: boolean; volume: number; onToggle: (v: boolean) => void; onVolume: (v: number) => void }) {
  return (
    <div className="snd-row">
      <button className={`snd-switch ${on ? "on" : ""}`} role="switch" aria-checked={on} aria-label={label} onClick={() => onToggle(!on)}><i /></button>
      <span className="snd-lbl">{label}</span>
      <input type="range" min={0} max={100} step={5} value={Math.round(volume * 100)} disabled={!on} aria-label={`Volume : ${label.toLowerCase()}`}
        onChange={(e) => onVolume(Number(e.target.value) / 100)} />
    </div>
  );
}

/** Interrupteurs et volumes du son, partagés par le bouton de la barre du haut et l'écran Réglages. */
export function SoundControls() {
  const s = useSettings();
  return (
    <div className="stack" style={{ gap: 4 }}>
      <Toggle label="Effets sonores" on={s.sound} onChange={(v) => { updateSettings({ sound: v }); if (v) window.setTimeout(() => sfx("ok"), 60); }} />
      {s.sound && <Volume label="Volume des effets" value={s.sfxVolume ?? 1} onChange={(v) => { updateSettings({ sfxVolume: v }); window.setTimeout(() => sfx("cell"), 30); }} />}
      <Toggle label="Fond sonore de la réserve" on={s.ambience} onChange={(v) => updateSettings({ ambience: v })} />
      {s.ambience && <Volume label="Volume du fond sonore" value={s.ambienceVolume ?? 0.6} onChange={(v) => updateSettings({ ambienceVolume: v })} />}
      <Toggle label="Voix de l'équipe" on={s.voices ?? true} onChange={(v) => { updateSettings({ voices: v }); if (!v) stopVoice(); }} />
      {(s.voices ?? true) && <Volume label="Volume des voix" value={s.voiceVolume ?? 1} onChange={(v) => { updateSettings({ voiceVolume: v }); syncVoiceVolume(); }} />}
    </div>
  );
}

function Volume({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  const pct = Math.round(value * 100);
  return (
    <label className="field" style={{ margin: "2px 0 8px" }}>
      <span className="row"><span className="grow">{label}</span><span className="mono" style={{ color: "var(--cyan)" }}>{pct} %</span></span>
      <input type="range" min={0} max={100} step={5} value={pct} onChange={(e) => onChange(Number(e.target.value) / 100)} aria-label={label} style={{ width: "100%", accentColor: "var(--cyan)" }} />
    </label>
  );
}

/** Interrupteur (réglages). */
export function Toggle({ label, on, onChange }: { label: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button className="row" style={{ width: "100%", padding: "6px 0" }} onClick={() => onChange(!on)} role="switch" aria-checked={on}>
      <span className="grow" style={{ textAlign: "left" }}>{label}</span>
      <span style={{ width: 50, height: 30, borderRadius: 15, padding: 3, background: on ? "var(--cyan)" : "#253250", transition: "background .2s" }}>
        <span style={{ display: "block", width: 24, height: 24, borderRadius: "50%", background: "#fff", transform: `translateX(${on ? 20 : 0}px)`, transition: "transform .2s" }} />
      </span>
    </button>
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
export function FxLayer() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const settings = useSettings();
  const reduce = settings.reduceMotion === "on" || (settings.reduceMotion === "auto" && window.matchMedia("(prefers-reduced-motion: reduce)").matches);

  useEffect(() => onFx((e: FxEvent) => {
    if (e.type === "burst" && !reduce) burst(canvas.current, e.x, e.y, e.color);
  }), [reduce]);

  return (
    <>
      <canvas ref={canvas} style={{ position: "fixed", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 95 }} />
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
  // Blanc et bleu de l'appli seulement (choix du propriétaire, 15/11/2026) : la couleur demandée n'est plus utilisée
  // que si c'est déjà le cyan de l'appli.
  const colors = color === "#3be8ff" ? ["#3be8ff", "#ffffff", "#ffffff", "#bdf6ff"] : ["#ffffff", "#ffffff", "#3be8ff", "#bdf6ff"];
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
