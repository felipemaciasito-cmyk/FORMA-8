// Labo des personnages (page d'essai privée, jamais dans l'appli) : aperçus des règles de parole et des interactions.
import { StrictMode, useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { AnimatePresence, motion } from "motion/react";
import "@fontsource/space-grotesk/400.css";
import "@fontsource/space-grotesk/700.css";
import "@fontsource/jetbrains-mono/400.css";
import "@fontsource/jetbrains-mono/600.css";
import "../../src/styles/app.css";
import { OraDrone } from "../../src/components/Ora";
import { CrewFigure } from "../../src/components/Crew";
import { mixReady, robotize, FRAME, type Filtre, type Ready } from "../../src/lib/robot";

// ---------- Son ----------
let rt: AudioContext | null = null;
function ctx() {
  if (!rt) { const C = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext; rt = new C(); }
  if (rt.state === "suspended") void rt.resume();
  return rt;
}
const decode = (b: ArrayBuffer) => new Promise<AudioBuffer>((res, rej) => ctx().decodeAudioData(b, res, rej));
const VOC: Filtre = { hp: 160, lp: 8000, anneau: { f: 140, mix: 0.25 }, peigne: { ms: 2.2, retour: 0.45, mix: 0.25 }, hache: { ms: 100, trou: 0.15, prof: 0.55 }, salle: { s: 0.5, mix: 0.04 } };
const MACHINE: Filtre = { hp: 200, lp: 6500, peigne: { ms: 4.5, retour: 0.7, mix: 0.5 }, tourne: { ms: 3, prof: 1.5, vitesse: 1.2, mix: 0.35 }, anneau: { f: 45, mix: 0.3 } };
// « veille » : 0 = profondément endormi, 1 = complètement réveillé. Le grésillement (le même pour tous les endormis)
// baisse à mesure que le personnage se réveille ; réglage choisi : 35 %.
type Src = { rec: string; layers: [Filtre, number][]; veille: number } | { babble: "ora" | "dort" | "arch" };
const ORA = (rec: string, veille = 1, d = 1.35): Src => ({ rec, layers: [[VOC, d], [MACHINE, d]], veille });
const ARCH = (rec: string, veille = 1): Src => ({ rec, layers: [[{ hp: 60 }, 0]], veille });
const GRESILLEMENT = 0.35;
const cache = new Map<string, Promise<Ready>>();

function babbleBuffer(text: string, kind: "ora" | "dort" | "arch"): Promise<Ready> {
  // Babillage : un petit son électronique par syllabe, des silences aux ponctuations. Fabriqué hors temps réel.
  const SR = 24000, step = kind === "dort" ? 0.085 : 0.06;
  const events: { t: number; f: number }[] = []; let t = 0.05, n = 0;
  const base = kind === "ora" ? [560, 920] : kind === "arch" ? [300, 470] : [190, 300];
  for (const ch of text) {
    if ("…".includes(ch)) { t += 0.32; continue; }
    if (".!?".includes(ch)) { t += 0.28; continue; }
    if (",:;".includes(ch)) { t += 0.14; continue; }
    if (/\s/.test(ch)) { t += step * 0.4; continue; }
    if (n++ % 2 === 0) events.push({ t, f: base[0] + Math.random() * (base[1] - base[0]) });
    t += step;
  }
  const C = window.OfflineAudioContext || (window as unknown as { webkitOfflineAudioContext: typeof OfflineAudioContext }).webkitOfflineAudioContext;
  const oc = new C(1, Math.ceil((t + 0.3) * SR), SR);
  const lp = oc.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = kind === "ora" ? 3200 : 1800; lp.connect(oc.destination);
  for (const e of events) {
    const o = oc.createOscillator(); o.type = kind === "ora" ? "square" : "triangle"; o.frequency.setValueAtTime(e.f, e.t);
    o.frequency.linearRampToValueAtTime(e.f * (kind === "dort" ? 0.8 : 1.15), e.t + 0.05);
    const g = oc.createGain(); g.gain.setValueAtTime(0, e.t); g.gain.linearRampToValueAtTime(kind === "dort" ? 0.18 : 0.22, e.t + 0.008); g.gain.exponentialRampToValueAtTime(0.001, e.t + (kind === "dort" ? 0.09 : 0.055));
    o.connect(g); g.connect(lp); o.start(e.t); o.stop(e.t + 0.12);
  }
  return new Promise<AudioBuffer>((res) => { oc.oncomplete = (ev) => res(ev.renderedBuffer); void oc.startRendering(); })
    .then((buf) => mixReady([{ buffer: buf, levels: levelsOf(buf) }, { buffer: buf, levels: levelsOf(buf) }].slice(0, 1)));
}
function levelsOf(buf: AudioBuffer) {
  const d = buf.getChannelData(0), step = Math.floor(FRAME * buf.sampleRate), out = new Float32Array(Math.ceil(d.length / step));
  let top = 0; for (let j = 0; j < out.length; j++) { let a = 0; for (let i = j * step; i < Math.min(d.length, (j + 1) * step); i++) a += d[i] * d[i]; out[j] = Math.sqrt(a / step); top = Math.max(top, out[j]); }
  if (top) for (let j = 0; j < out.length; j++) out[j] /= top; return out;
}
function prepare(text: string, src: Src): Promise<Ready> {
  const key = "rec" in src ? `${src.rec}|${src.layers.map((l) => l[1]).join(",")}|${src.layers.length}|${src.veille}` : `b|${src.babble}|${text}`;
  if (!cache.has(key)) cache.set(key, "rec" in src
    ? fetch(`voix/${src.rec}`).then((r) => r.arrayBuffer()).then(decode).then(async (raw) => gresille(mixReady(await Promise.all(src.layers.map(([f, d]) => robotize(raw, f, d)))), GRESILLEMENT * (1 - src.veille)))
    : babbleBuffer(text, src.babble));
  return cache.get(key)!;
}
/** Grésillement de radio mal réglée, ajouté sous la voix : souffle discret et petits craquements. 0 = aucun. */
function gresille(r: Ready, k: number): Ready {
  if (k <= 0) return r;
  const C = window.OfflineAudioContext || (window as unknown as { webkitOfflineAudioContext: typeof OfflineAudioContext }).webkitOfflineAudioContext;
  const src = r.buffer.getChannelData(0), out = new C(1, src.length, r.buffer.sampleRate).createBuffer(1, src.length, r.buffer.sampleRate), d = out.getChannelData(0);
  let lp = 0, pop = 0, seed = 11; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const hiss = 0.05 * k, pops = 0.32 * k, prob = 0.0009 * Math.min(1, k * 2.5);
  for (let i = 0; i < src.length; i++) {
    lp = lp * 0.82 + (rnd() * 2 - 1) * 0.18; // souffle adouci
    if (rnd() < prob) pop = (rnd() * 2 - 1) * pops; else pop *= 0.86; // craquement qui s'éteint vite
    d[i] = src[i] + lp * hiss + pop;
  }
  return { buffer: out, levels: r.levels };
}
let playing: { s: AudioBufferSourceNode; stop: () => void } | null = null;
function stopAll() { playing?.stop(); playing = null; }

// ---------- Une scène : des personnages qui parlent chacun à leur tour ----------
type Who = "ora" | "arch";
interface Line { who: Who; text: string; src: Src; dort?: boolean; choices?: { label: string; value: string }[] }
const NAME: Record<Who, string> = { ora: "ORA", arch: "MME LARCHIVE" };
const HUE: Record<Who, number> = { ora: 190, arch: 150 };

function Portrait({ who, talk, awake, happy, onTap, jump }: { who: Who; talk: number; awake: boolean; happy?: boolean; onTap?: () => void; jump?: number }) {
  return (
    <motion.button key={jump} onClick={onTap} aria-label={`Toucher ${NAME[who]}`} animate={jump ? { y: [0, -14, 0, -5, 0], rotate: [0, -10, 8, 0] } : { y: [0, -1.5, 0] }}
      transition={jump ? { duration: 0.6 } : { duration: 3, repeat: Infinity }}
      style={{ all: "unset", cursor: "pointer", width: 64, height: 64, borderRadius: "50%", display: "grid", placeItems: "center", overflow: "hidden", position: "relative",
        background: "radial-gradient(circle at 50% 40%, #13203a, #070c17 70%)", border: `1.5px solid hsl(${HUE[who]} 90% 60% / ${0.35 + talk * 0.6})`,
        boxShadow: `0 0 ${6 + talk * 20}px hsl(${HUE[who]} 100% 60% / ${0.2 + talk * 0.5})` }}>
      {who === "ora" ? <OraDrone size={60} mood={happy ? "happy" : awake ? "neutral" : "think"} talk={talk || undefined} />
        : <CrewFigure id="c01" state={awake || happy ? "awake" : "asleep"} mood={happy ? "happy" : "neutral"} crop="head" size={64} label="Mme Larchive" />}
      {!awake && !happy && <span className="mono" style={{ position: "absolute", right: 8, top: 4, fontSize: 11, color: "var(--text-3)" }}>z</span>}
    </motion.button>
  );
}

function Scene({ cast, lines, run, awake = {}, onDone, happy, onChoice }: { cast: Who[]; lines: Line[]; run: number; awake?: Partial<Record<Who, boolean>>; onDone?: () => void; happy?: Who; onChoice?: (v: string) => void }) {
  const [i, setI] = useState(-1);
  const [shown, setShown] = useState(0);
  const [level, setLevel] = useState(0);
  const [open, setOpen] = useState(false);
  const last = useRef<number>(-1);
  const alive = useRef(0);
  const say = async (k: number, list: Line[]) => {
    const id = ++alive.current; stopAll();
    if (k >= list.length) { setI(-1); onDone?.(); return; }
    const l = list[k]; setI(k); setShown(0); setOpen(true); last.current = k;
    const ready = await prepare(l.text, l.src); if (id !== alive.current) return;
    const c = ctx(), s = c.createBufferSource(); s.buffer = ready.buffer; s.connect(c.destination);
    const t0 = c.currentTime, dur = ready.buffer.duration; let raf = 0;
    const tick = () => {
      const p = Math.min(1, (c.currentTime - t0) / (dur * 0.95));
      setShown(Math.ceil(p * l.text.length)); setLevel(ready.levels[Math.min(ready.levels.length - 1, Math.floor((c.currentTime - t0) / FRAME))] ?? 0);
      raf = requestAnimationFrame(tick);
    };
    const end = () => { cancelAnimationFrame(raf); setLevel(0); setShown(l.text.length); if (id !== alive.current) return;
      // Une question reste ouverte : ses réponses sont dans la bulle.
      if (l.choices) return;
      // La bulle lue se ferme ; la suivante s'ouvre aussitôt après (un échange entre personnages s'enchaîne vite).
      const more = k + 1 < list.length;
      window.setTimeout(() => { if (id !== alive.current) return; setOpen(false); window.setTimeout(() => { if (id === alive.current) void say(k + 1, list); }, more ? 120 : 400); }, more ? 350 : 1300); };
    s.onended = end; playing = { s, stop: () => { s.onended = null; try { s.stop(); } catch { /* */ } cancelAnimationFrame(raf); setLevel(0); } };
    s.start(); tick();
  };
  useEffect(() => { if (run > 0) void say(0, lines); return () => { alive.current++; stopAll(); }; }, [run]); // eslint-disable-line react-hooks/exhaustive-deps
  const cur = i >= 0 ? lines[i] : null;
  const replay = (w: Who) => { const k = [...lines.keys()].reverse().find((n) => lines[n].who === w && n <= Math.max(last.current, 0)); if (k !== undefined) { alive.current++; void (async () => { await say(k, [lines[k]]); })(); } };
  return (
    <div style={{ position: "relative", marginTop: 12 }}>
      <AnimatePresence>
        {cur && open && (
          <motion.div key={i} onClick={() => { alive.current++; stopAll(); setOpen(false); }}
            initial={{ opacity: 0, y: 10, scale: 0.94 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 6 }}
            style={{ position: "relative", marginBottom: 10, zIndex: 5, padding: "10px 12px 12px", borderRadius: 16, cursor: "pointer",
              background: `linear-gradient(135deg, hsl(${HUE[cur.who]} 55% 15%), #080d19 60%)`, border: `1px solid hsl(${HUE[cur.who]} 90% 60% / ${0.45 + level * 0.4})`, boxShadow: "0 10px 30px rgba(0,0,0,.55)" }}>
            <div className="mono" style={{ fontSize: 10.5, letterSpacing: ".14em", color: `hsl(${HUE[cur.who]} 100% 72%)`, marginBottom: 4 }}>
              {NAME[cur.who]}{cur.dort && <span style={{ color: "var(--text-3)", letterSpacing: ".08em" }}>{"  ·  "}<i>parle en dormant</i></span>}
            </div>
            <div style={{ fontSize: 15.5, lineHeight: 1.45, fontStyle: cur.dort ? "italic" : undefined, color: cur.dort ? "var(--text-2)" : undefined, minHeight: 22 }}>
              {cur.text.slice(0, shown)}<span style={{ opacity: 0 }}>{cur.text.slice(shown)}</span>
            </div>
            {cur.choices && shown >= cur.text.length && (
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
                {cur.choices.map((c) => (
                  <button key={c.value} className="btn" onClick={(e) => { e.stopPropagation(); ctx(); alive.current++; stopAll(); setOpen(false); onChoice?.(c.value); }}
                    style={{ padding: "8px 12px", fontSize: 14, background: "rgba(255,255,255,.04)", color: "var(--text)", border: `1px solid hsl(${HUE[cur.who]} 90% 60% / .45)` }}>{c.label}</button>
                ))}
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      <div style={{ display: "flex", gap: 14, justifyContent: cast.length > 1 ? "space-between" : "flex-start" }}>
        {cast.map((w) => <Portrait key={w} who={w} talk={cur?.who === w ? level : 0} awake={!!awake[w]} happy={happy === w} onTap={() => replay(w)} />)}
      </div>
    </div>
  );
}

// ---------- Mise en page ----------
const card: React.CSSProperties = { background: "#0b1222", border: "1px solid var(--line)", borderRadius: 18, padding: 14, marginTop: 16 };
function Section({ n, title, children, note }: { n: string; title: string; children: React.ReactNode; note?: string }) {
  return <section style={card}><div className="mono" style={{ fontSize: 11, letterSpacing: ".14em", color: "var(--cyan)" }}>{n}</div>
    <div style={{ fontWeight: 700, fontSize: 18, margin: "2px 0 6px" }}>{title}</div>{note && <p className="small muted" style={{ margin: "0 0 8px" }}>{note}</p>}{children}</section>;
}
function Btn({ on, children, onClick }: { on?: boolean; children: React.ReactNode; onClick: () => void }) {
  return <button className="btn" onClick={() => { ctx(); onClick(); }} style={{ padding: "9px 12px", fontSize: 14, marginRight: 8, marginTop: 8, opacity: on === false ? 0.55 : 1, background: on ? undefined : "transparent", color: on ? undefined : "var(--text)", border: "1px solid var(--line)" }}>{children}</button>;
}

function OraDebut() {
  const [opt, setOpt] = useState<"A" | "B" | "C">("C");
  const [run, setRun] = useState(0);
  const [stepN, setStepN] = useState(1);
  const T = {
    a1: "Courant… rétabli. Je suis ORA. Mes circuits sont faibles, mais je t'entends. Comment dois-je t'appeler ?",
    a2: "Premier protocole. Chaque bonne réponse me rend un peu de puissance.",
    b1: "… mmh… qui a allumé la lune ?… je… je suis ORA… je crois… et toi… tu t'appelles comment ?…",
    b2: "… les serveurs ronflent en si bémol… pardon… premier protocole… vas-y, je te suis…",
    c2: "Mmh… premier protocole. Je me réveille à peine… Chaque bonne réponse me rend un peu de puissance.",
  };
  const ALL: Record<"A" | "B" | "C", Line[][]> = {
    A: [[{ who: "ora", text: T.a1, src: ORA("lab-a1.mp3", 0.2) }], [{ who: "ora", text: T.a2, src: ORA("lab-a2.mp3", 0.5) }]],
    B: [[{ who: "ora", dort: true, text: T.b1, src: ORA("lab-b1.mp3", 0, 0.9) }], [{ who: "ora", dort: true, text: T.b2, src: ORA("lab-b2.mp3", 0.2, 0.9) }]],
    // Mélange : à l'accueil, ORA émerge du sommeil (elle bafouille) ; au protocole 1, elle est réveillée mais encore
    // ensommeillée et faible. Le grésillement baisse à chaque protocole et disparaît à son réveil complet.
    C: [[{ who: "ora", dort: true, text: T.b1, src: ORA("lab-b1.mp3", 0.05, 1.1) }], [{ who: "ora", text: T.c2, src: ORA("c2.mp3", 0.45) }]],
  };
  const lines = ALL[opt][stepN - 1];
  const go = (o: "A" | "B" | "C", s: number) => { setOpt(o); setStepN(s); setRun((r) => r + 1); };
  const label = opt === "B" ? (stepN === 1 ? "ORA · EN SOMMEIL" : "ORA · RÉVEIL 20 %") : opt === "A" ? (stepN === 1 ? "PUISSANCE D'ORA · 20 %" : "PUISSANCE D'ORA · 50 %") : (stepN === 1 ? "ORA · ELLE ÉMERGE · 5 %" : "ORA · ÉVEILLÉE À MOITIÉ · 45 %");
  return (
    <Section n="1 · CONFLIT ORA" title="ORA au tout début : trois propositions"
      note="Étape 1 : juste après le levier (l'accueil). Étape 2 : l'ouverture du protocole 1. A : rallumée mais faible. B : endormie. C : le mélange, elle émerge du sommeil en bafouillant, puis elle est réveillée mais encore ensommeillée. Grésillement réglé à 35 %, plus discret qu'avant, et qui baisse quand elle se réveille.">
      <div><Btn on={opt === "C"} onClick={() => go("C", stepN)}>C · Mélange</Btn><Btn on={opt === "A"} onClick={() => go("A", stepN)}>A · Faible puissance</Btn><Btn on={opt === "B"} onClick={() => go("B", stepN)}>B · Endormie</Btn></div>
      <div><Btn on={stepN === 1} onClick={() => go(opt, 1)}>Étape 1 · Accueil</Btn><Btn on={stepN === 2} onClick={() => go(opt, 2)}>Étape 2 · Protocole 1</Btn></div>
      <div className="mono small" style={{ margin: "12px 0 0", color: "var(--text-3)" }}>{label}</div>
      <Scene cast={["ora"]} lines={lines} run={run} awake={{ ora: opt !== "B" && !(opt === "C" && stepN === 1) }} />
      <p className="small dim">Touche la bulle pour couper la parole. Touche ORA pour la réentendre.</p>
    </Section>
  );
}

function Lucide() {
  const [run, setRun] = useState(0); const [k, setK] = useState(0);
  const SETS: { label: string; lines: Line[] }[] = [
    { label: "Protocole 1", lines: [{ who: "arch", dort: true, text: "… mmh… qui a rangé la girafe dans le tiroir B ?…", src: ARCH("l1.mp3", 0) }] },
    { label: "Protocole 1 · piste", lines: [{ who: "arch", dort: true, text: "… les chaussettes… mmh… relis la définition… juste au-dessus… zzz…", src: ARCH("l2b.mp3", 0) }] },
    { label: "Protocole 3", lines: [{ who: "arch", dort: true, text: "… les photos… elles se rangent toutes seules… non ?… si…", src: ARCH("l3.mp3", 0.4) }] },
    { label: "Protocole 5", lines: [{ who: "arch", dort: true, text: "… presque réveillée. Encore la panne, et j'ouvre les yeux.", src: ARCH("l4.mp3", 0.75) }] },
  ];
  return (
    <Section n="2 · ENDORMIS" title="Mme Larchive se réveille peu à peu"
      note="Ton choix : au début, elle dit n'importe quoi ; quand tu bloques, une piste glisse dans son demi-sommeil, sans qu'elle se réveille. Plus la centrale se charge, plus elle est claire et moins elle grésille.">
      <div>{SETS.map((s, n) => <Btn key={s.label} on={k === n} onClick={() => { setK(n); setRun((r) => r + 1); }}>{s.label}</Btn>)}</div>
      <Scene cast={["arch"]} lines={SETS[k].lines} run={run} />
    </Section>
  );
}

function Toucher() {
  const R = ["… hein ?… qui me chatouille ?…", "… encore cinq minutes…", "… non… les mardis se classent par taille…", "… arrête… je rêve d'un historique tout propre…"];
  const F = ["t1.mp3", "t2.mp3", "t3.mp3", "t4.mp3"];
  const [n, setN] = useState(0); const [run, setRun] = useState(0); const [jump, setJump] = useState(0);
  return (
    <Section n="3 · INTERACTION" title="Toucher un personnage" note="Touche Mme Larchive dans sa capsule : elle sursaute et grommelle. Chaque toucher, une autre réaction.">
      <button onClick={() => { ctx(); setJump((j) => j + 1); setN((x) => (x + 1) % R.length); setRun((r) => r + 1); }} style={{ all: "unset", cursor: "pointer", display: "block" }}>
        <motion.div key={jump} animate={jump ? { x: [0, -6, 6, -3, 0] } : {}} transition={{ duration: 0.4 }} className="mono small" style={{ color: "var(--text-3)" }}>CAPSULE 01 · TOUCHE-LA</motion.div>
      </button>
      <Scene cast={["arch"]} lines={[{ who: "arch", dort: true, text: R[n], src: ARCH(F[n], 0) }]} run={run} />
      <Btn onClick={() => { setJump((j) => j + 1); setN((x) => (x + 1) % R.length); setRun((r) => r + 1); }}>Toucher Mme Larchive</Btn>
    </Section>
  );
}

function Equipe() {
  const [run, setRun] = useState(0);
  const lines: Line[] = [
    { who: "ora", text: "Bienvenue parmi nous, Mme Larchive. Bien dormi ?", src: ORA("e1.mp3") },
    { who: "arch", text: "Comme une bûche… merci, ORA.", src: ARCH("r0.mp3") },
    { who: "arch", text: "Bonjour, chef. Me voilà réveillée. À partir d'aujourd'hui, aucune version de ton produit ne se perdra. Et si quelque chose casse, nous reviendrons en arrière ensemble, sans rien effacer.", src: ARCH("lab-reveil.mp3") },
    { who: "ora", text: "Tu es entre de bonnes mains. Allons réveiller la suite.", src: ORA("e2.mp3") },
  ];
  return (
    <Section n="4 · INTERACTION" title="L'équipe qui se parle" note="Au réveil, ORA accueille le nouveau membre. Chacun ouvre sa bulle à son tour, jamais deux à la fois.">
      <Btn on onClick={() => setRun((r) => r + 1)}>Lancer la scène</Btn>
      <Scene cast={["ora", "arch"]} lines={lines} run={run} awake={{ ora: true, arch: true }} />
    </Section>
  );
}

function Reformule() {
  const [run, setRun] = useState(0);
  return (
    <Section n="5 · BABILLAGE" title="« ORA reformule » dans une bulle" note="À quoi ça sert : certains textes sont écrits sur le moment par Claude (« ORA reformule », « Demander à ORA », les réponses aux questions posées aux membres). Ils n'existent pas à l'avance, donc personne ne peut les enregistrer. Plutôt qu'une bulle muette, le personnage les « dit » en babillage robotique, au rythme de l'écriture.">
      <Btn on onClick={() => setRun((r) => r + 1)}>Je n'ai toujours pas compris</Btn>
      <Scene cast={["ora"]} lines={[{ who: "ora", text: "Autrement dit : un commit, c'est une photo de ton chantier, avec une légende au dos. On peut toujours revenir à une photo.", src: { babble: "ora" } }]} run={run} awake={{ ora: true }} />
    </Section>
  );
}

function Dialogue() {
  const [run, setRun] = useState(0); const [lines, setLines] = useState<Line[]>([]);
  const Q: Line = { who: "ora", text: "Avant la suite : tu préfères une image, ou un exemple concret ?", src: ORA("d1.mp3"),
    choices: [{ label: "Une image", value: "d2" }, { label: "Un exemple", value: "d3" }, { label: "J'ai compris", value: "d4" }] };
  const A: Record<string, string> = { d2: "Une image, alors : le navigateur commande, le serveur livre. Comme au restaurant.", d3: "Un exemple : tu tapes l'adresse de ta page, et ton iPhone reçoit ses fichiers.", d4: "Parfait, on continue." };
  return (
    <Section n="6 · INTERACTION" title="Dialogue à choix" note="Les réponses sont dans la bulle. La bulle reste ouverte tant qu'il y a une question, puis se ferme après la réponse d'ORA.">
      <Btn on onClick={() => { setLines([Q]); setRun((r) => r + 1); }}>Démarrer</Btn>
      <Scene cast={["ora"]} lines={lines} run={run} awake={{ ora: true }} onChoice={(v) => { setLines([{ who: "ora", text: A[v], src: ORA(`${v}.mp3`) }]); setRun((r) => r + 1); }} />
    </Section>
  );
}

function Defi() {
  const [run, setRun] = useState(0); const [lines, setLines] = useState<Line[]>([]); const [win, setWin] = useState(false);
  const Q: Line = { who: "arch", text: "Défi du jour ! À quoi sert le message d'un commit ?", src: ARCH("f1b.mp3"),
    choices: [{ label: "À nommer le dépôt", value: "non" }, { label: "À dire ce qui a changé", value: "oui" }, { label: "À publier la page", value: "non" }] };
  const pick = (v: string) => {
    const ok = v === "oui"; setWin(ok);
    setLines(ok ? [{ who: "arch", text: "Exact ! Quinze kilowatts pour toi. À demain.", src: ARCH("f2.mp3") }]
      : [{ who: "arch", text: "Pas tout à fait. Pense à la légende au dos de la photo.", src: ARCH("f3.mp3"), choices: Q.choices }]);
    setRun((r) => r + 1);
  };
  return (
    <Section n="7 · INTERACTION" title="Défi du jour (sur la carte)" note="Chaque jour, le dernier membre réveillé te pose une question sur ses notions. Les réponses sont dans la bulle ; elle se ferme une fois le défi réussi.">
      <Btn on onClick={() => { setWin(false); setLines([Q]); setRun((r) => r + 1); }}>Ouvrir le défi</Btn>
      <Scene cast={["arch"]} lines={lines} run={run} awake={{ arch: true }} happy={win ? "arch" : undefined} onChoice={pick} />
      {win && <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="mono" style={{ color: "var(--led)", fontSize: 20, marginTop: 8 }}>+15 kW</motion.div>}
    </Section>
  );
}

function Question() {
  const [who, setWho] = useState<Who>("arch"); const [run, setRun] = useState(0); const [lines, setLines] = useState<Line[]>([]);
  const ANS: Record<string, Record<Who, string>> = {
    "Pourquoi garder chaque version ?": { arch: "Parce qu'un jour, quelque chose cassera. Avec l'historique, tu reviens à la dernière version qui marchait, en deux touchers.", ora: "Pour pouvoir revenir en arrière sans peur. Mme Larchive t'expliquera ça en détail au caisson 01." },
    "C'est quoi un serveur ?": { arch: "Ce n'est pas mon domaine… Demande à ORA. Moi, je garde les versions.", ora: "Un ordinateur toujours allumé, qui garde les fichiers d'un site et les envoie à qui les demande." },
  };
  const FILES: Record<string, Record<Who, string>> = { "Pourquoi garder chaque version ?": { arch: "q1.mp3", ora: "q3.mp3" }, "C'est quoi un serveur ?": { arch: "q2.mp3", ora: "q4.mp3" } };
  const [asked, setAsked] = useState("");
  const ask = (q: string) => { setAsked(q); const f = FILES[q][who]; setLines([{ who, text: ANS[q][who], src: who === "ora" ? ORA(f) : ARCH(f) }]); setRun((r) => r + 1); };
  return (
    <Section n="8 · INTERACTION" title="Poser une question à un membre" note="Dans l'appli, c'est Claude qui répondra (il faudra ta clé API), dans le domaine et avec la personnalité du membre. Ici, réponses d'exemple écrites d'avance.">
      <div><Btn on={who === "ora"} onClick={() => setWho("ora")}>ORA</Btn><Btn on={who === "arch"} onClick={() => setWho("arch")}>Mme Larchive</Btn></div>
      <div>{Object.keys(ANS).map((q) => <Btn key={q} onClick={() => ask(q)}>{q}</Btn>)}</div>
      {asked && <div className="small" style={{ marginTop: 10, color: "var(--text-2)" }}>Tu demandes à {who === "ora" ? "ORA" : "Mme Larchive"} : « {asked} »</div>}
      <Scene cast={[who]} lines={lines} run={run} awake={{ ora: true, arch: true }} />
      <p className="small dim">Dans l'appli, ces réponses seront écrites par Claude sur le moment : elles seront dites en babillage (section 5), pas avec la vraie voix.</p>
    </Section>
  );
}

function App() {
  return (
    <div style={{ maxWidth: 560, margin: "0 auto", padding: "22px 16px 60px", fontFamily: "var(--sans)" }}>
      <div className="mono" style={{ fontSize: 11, letterSpacing: ".14em", color: "var(--cyan)" }}>FORMA-8 · LABO DES PERSONNAGES</div>
      <h1 style={{ fontSize: 24, margin: "6px 0 8px" }}>Règles de parole et interactions</h1>
      <p className="muted small">Coupe le bouton silencieux. Chaque exemple applique tes règles : un seul exemplaire de chaque personnage, bulles l'une après l'autre, texte écrit au rythme de la voix, bulle fermée une fois lue, toucher le personnage pour le réentendre.</p>
      <OraDebut /><Lucide /><Toucher /><Equipe /><Reformule /><Dialogue /><Defi /><Question />
      <section style={card}><div className="mono" style={{ fontSize: 11, letterSpacing: ".14em", color: "var(--cyan)" }}>9 · RÈGLE</div>
        <div style={{ fontWeight: 700, fontSize: 18, margin: "2px 0 6px" }}>Quand reparler ?</div>
        <p className="small muted" style={{ margin: 0 }}>Ton choix : à chaque retour sur une page, une phrase très courte et différente à chaque fois (« Te revoilà. », « On reprend ? »…). La réplique complète seulement s'il y a du nouveau. Un toucher sur le personnage pour tout réentendre.</p>
      </section>
    </div>
  );
}
createRoot(document.getElementById("root")!).render(<StrictMode><App /></StrictMode>);
