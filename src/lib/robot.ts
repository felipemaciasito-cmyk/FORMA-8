// Touche robotique des voix de l'équipe (lot du 16/11/2026). Fabrique, hors temps réel, la version robotique d'une
// réplique enregistrée, selon le filtre de son personnage (src/content/voix.json). Module sans dépendance : il sert
// aussi tel quel à la page d'audition des voix.

export interface Filtre {
  hp?: number; lp?: number; sature?: number; crepite?: number; souffle?: number;
  anneau?: { f: number; mix: number };
  peigne?: { ms: number; retour: number; mix: number };
  tourne?: { ms: number; prof: number; vitesse: number; mix: number };
  choeur?: { voix: number; ms: number; prof: number; mix: number };
  salle?: { s: number; mix: number };
  grain?: { pas: number; bits: number };
  /** Élocution hachée : le son est coupé brièvement à intervalles réguliers (ms : longueur d'un morceau ; trou : part
   *  coupée, de 0 à 1 ; prof : profondeur de la coupure, de 0 à 1). */
  hache?: { ms: number; trou: number; prof: number };
  /** Petites répétitions de robot : de temps en temps, un court morceau est rejoué (prob : chance par morceau). */
  glitch?: { ms: number; prob: number };
}

export const SR = 24000; // suffisant pour une voix, et deux fois moins de mémoire qu'en 48 kHz
export const FRAME = 0.04; // une valeur de niveau toutes les 40 ms, pour animer le personnage
export interface Ready { buffer: AudioBuffer; levels: Float32Array }

function impulse(oc: BaseAudioContext, sec: number) {
  const len = Math.max(1, Math.floor(sec * SR)), ir = oc.createBuffer(1, len, SR), d = ir.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.8);
  return ir;
}

type OfflineCtor = new (channels: number, length: number, rate: number) => OfflineAudioContext;

/** Applique le filtre d'un personnage, hors temps réel. */
/**
 * `dose` règle la densité de tous les effets à la fois (1 = réglage du personnage, 0,5 = moitié moins, 0 = voix brute
 * filtrée) : le propriétaire peut ainsi doser la touche robotique sans tout réécrire.
 */
export async function robotize(src: AudioBuffer, f: Filtre, dose = 1): Promise<Ready> {
  const k = Math.max(0, dose);
  const C = (window.OfflineAudioContext || (window as unknown as { webkitOfflineAudioContext?: OfflineCtor }).webkitOfflineAudioContext) as OfflineCtor | undefined;
  if (!C) throw new Error("OfflineAudioContext indisponible");
  const tail = (f.salle?.s ?? 0) + 0.1;
  const oc = new C(1, Math.ceil((src.duration + tail) * SR), SR);
  const s = oc.createBufferSource(); s.buffer = src;
  let head: AudioNode = s;
  const chain = (n: AudioNode) => { head.connect(n); head = n; };
  if (f.hp) { const b = oc.createBiquadFilter(); b.type = "highpass"; b.frequency.value = f.hp; b.Q.value = 0.7; chain(b); }
  if (f.lp) { const b = oc.createBiquadFilter(); b.type = "lowpass"; b.frequency.value = f.lp; b.Q.value = 0.7; chain(b); }
  if (f.sature && k > 0) {
    const sat = f.sature * k, drive = 2 + sat * 30, n = 1024, c = new Float32Array(n);
    for (let i = 0; i < n; i++) { const x = (i * 2) / n - 1; c[i] = ((1 + drive) * x) / (1 + drive * Math.abs(x)); }
    const w = oc.createWaveShaper(); w.curve = c; chain(w);
    const g = oc.createGain(); g.gain.value = 1 / (1 + sat); chain(g);
  }
  const sum = oc.createGain(); sum.connect(oc.destination);
  let wet = 0;
  const send = (raw: number, build: (input: AudioNode) => AudioNode) => {
    const mix = raw * k; if (mix <= 0) return;
    const g = oc.createGain(); g.gain.value = mix; build(head).connect(g); g.connect(sum); wet += mix;
  };
  if (f.anneau) send(f.anneau.mix, (input) => {
    // Modulation en anneau : la voix multipliée par une onde lente, le timbre classique d'un robot.
    const ring = oc.createGain(); ring.gain.value = 0; const o = oc.createOscillator(); o.frequency.value = f.anneau!.f;
    o.connect(ring.gain); o.start(); input.connect(ring); return ring;
  });
  if (f.peigne) send(f.peigne.mix, (input) => {
    // Filtre en peigne : un écho très court qui se répète, timbre métallique.
    const d = oc.createDelay(0.05); d.delayTime.value = f.peigne!.ms / 1000; const fb = oc.createGain(); fb.gain.value = f.peigne!.retour;
    input.connect(d); d.connect(fb); fb.connect(d); return d;
  });
  if (f.tourne) send(f.tourne.mix, (input) => {
    // Écho court dont la longueur ondule : la voix « tourne ».
    const d = oc.createDelay(0.05); d.delayTime.value = f.tourne!.ms / 1000;
    const lfo = oc.createOscillator(); lfo.frequency.value = f.tourne!.vitesse; const depth = oc.createGain(); depth.gain.value = f.tourne!.prof / 1000;
    lfo.connect(depth); depth.connect(d.delayTime); lfo.start(); input.connect(d); return d;
  });
  if (f.choeur) send(f.choeur.mix, (input) => {
    // Plusieurs copies légèrement décalées : les drones répètent avec la meneuse.
    const m = oc.createGain(); m.gain.value = 1 / f.choeur!.voix;
    for (let v = 0; v < f.choeur!.voix; v++) {
      const d = oc.createDelay(0.1); d.delayTime.value = (f.choeur!.ms * (v + 1)) / 1000;
      const lfo = oc.createOscillator(); lfo.frequency.value = 0.3 + v * 0.17; const depth = oc.createGain(); depth.gain.value = f.choeur!.prof / 1000;
      lfo.connect(depth); depth.connect(d.delayTime); lfo.start(); input.connect(d); d.connect(m);
    }
    return m;
  });
  if (f.salle) send(f.salle.mix, (input) => { const r = oc.createConvolver(); r.buffer = impulse(oc, f.salle!.s); input.connect(r); return r; });
  const dry = oc.createGain(); dry.gain.value = Math.max(0.35, 1 - wet * 0.6); head.connect(dry); dry.connect(sum);
  s.start();
  const out = await new Promise<AudioBuffer>((resolve, reject) => {
    oc.oncomplete = (e) => resolve(e.renderedBuffer);
    try { const p = oc.startRendering() as Promise<AudioBuffer> | undefined; if (p && typeof p.then === "function") p.then(resolve, reject); } catch (e) { reject(e); }
  });
  // Retouches échantillon par échantillon : grain numérique, crépitement, souffle ; puis volume réglé.
  const d = out.getChannelData(0);
  if (f.grain) {
    const q = Math.pow(2, f.grain.bits - 1); let held = 0;
    for (let i = 0; i < d.length; i++) { if (i % f.grain.pas === 0) held = Math.round(d[i] * q) / q; d[i] = d[i] * (1 - 0.45 * Math.min(1, k)) + held * 0.45 * Math.min(1, k); }
  }
  if (f.crepite) for (let i = 0; i < d.length; i++) if (Math.random() < f.crepite * 0.02 * k) d[i] += (Math.random() * 2 - 1) * 0.25;
  if (f.souffle) for (let i = 0; i < d.length; i++) d[i] += (Math.random() * 2 - 1) * f.souffle * k;
  if (f.glitch) {
    // Un tirage fixe (pseudo-aléatoire) : la même réplique sonne toujours pareil.
    let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const n = Math.max(32, Math.floor((f.glitch.ms / 1000) * SR));
    for (let start = n * 4; start + 2 * n < d.length; start += n) {
      if (rnd() >= f.glitch.prob * k) continue;
      for (let i = 0; i < n; i++) d[start + n + i] = d[start + i];
      start += n * 3;
    }
  }
  if (f.hache) {
    const n = Math.max(64, Math.floor((f.hache.ms / 1000) * SR)), cut = Math.floor(n * f.hache.trou), ramp = Math.floor(0.002 * SR);
    const depth = Math.min(1, f.hache.prof * k);
    for (let i = 0; i < d.length; i++) {
      const pos = i % n, from = n - cut;
      if (pos < from) continue;
      // Rampe de 2 ms à l'entrée et à la sortie du trou : pas de clic.
      const edge = Math.min(pos - from, n - 1 - pos), g = edge < ramp ? edge / ramp : 1;
      d[i] *= 1 - depth * g;
    }
  }
  return finish(out);
}

/** Volume réglé (crête à 0,9) et niveaux pour animer le personnage. */
function finish(out: AudioBuffer): Ready {
  const d = out.getChannelData(0);
  let peak = 0; for (let i = 0; i < d.length; i++) peak = Math.max(peak, Math.abs(d[i]));
  if (peak > 0) { const g = 0.9 / peak; for (let i = 0; i < d.length; i++) d[i] *= g; }
  const step = Math.floor(FRAME * SR), levels = new Float32Array(Math.ceil(d.length / step));
  let top = 0;
  for (let j = 0; j < levels.length; j++) {
    let acc = 0; const end = Math.min(d.length, (j + 1) * step);
    for (let i = j * step; i < end; i++) acc += d[i] * d[i];
    levels[j] = Math.sqrt(acc / Math.max(1, end - j * step)); top = Math.max(top, levels[j]);
  }
  if (top > 0) for (let j = 0; j < levels.length; j++) levels[j] = Math.min(1, levels[j] / top);
  return { buffer: out, levels };
}

/**
 * Superpose plusieurs versions déjà préparées (deux effets sur une même voix, ou deux voix qui disent la même
 * réplique) en une seule, puis règle le volume.
 */
export function mixReady(parts: Ready[]): Ready {
  if (parts.length === 1) return parts[0];
  const len = Math.max(...parts.map((p) => p.buffer.length));
  // Un contexte hors temps réel sert juste à fabriquer le tampon (plus sûr qu'« new AudioBuffer » sur les vieux Safari).
  const C = (window.OfflineAudioContext || (window as unknown as { webkitOfflineAudioContext?: OfflineCtor }).webkitOfflineAudioContext) as OfflineCtor;
  const out = new C(1, len, SR).createBuffer(1, len, SR);
  const d = out.getChannelData(0);
  for (const p of parts) { const s = p.buffer.getChannelData(0); for (let i = 0; i < s.length; i++) d[i] += s[i]; }
  return finish(out);
}


function offline(): OfflineCtor {
  return (window.OfflineAudioContext || (window as unknown as { webkitOfflineAudioContext?: OfflineCtor }).webkitOfflineAudioContext) as OfflineCtor;
}

/**
 * Grésillement de radio mal réglée, ajouté sous la voix d'un personnage endormi (lot du 17/11/2026, choix du
 * propriétaire : 35 % au plus profond du sommeil, moins à mesure qu'il se réveille) : souffle discret et petits
 * craquements. k = 0 : aucun. Les niveaux d'animation restent ceux de la voix.
 */
export function gresille(r: Ready, k: number): Ready {
  if (k <= 0) return r;
  const src = r.buffer.getChannelData(0), C = offline();
  const out = new C(1, src.length, r.buffer.sampleRate).createBuffer(1, src.length, r.buffer.sampleRate), d = out.getChannelData(0);
  let lp = 0, pop = 0, seed = 11;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const hiss = 0.05 * k, pops = 0.32 * k, prob = 0.0009 * Math.min(1, k * 2.5);
  for (let i = 0; i < src.length; i++) {
    lp = lp * 0.82 + (rnd() * 2 - 1) * 0.18; // souffle adouci
    if (rnd() < prob) pop = (rnd() * 2 - 1) * pops; else pop *= 0.86; // craquement qui s'éteint vite
    d[i] = src[i] + lp * hiss + pop;
  }
  return { buffer: out, levels: r.levels };
}

/** Sorte de babillage : la voix vive de Forma Trisse, celle d'un membre réveillé, ou celle d'un dormeur. */
export type Babil = "vif" | "grave" | "dort";

/**
 * Babillage robotique : un petit son électronique par syllabe, des silences aux ponctuations. Il « dit » les textes
 * écrits sur le moment par Claude (personne ne peut les enregistrer à l'avance), au rythme de leur écriture.
 * Fabriqué hors temps réel, comme les voix.
 */
export async function babil(text: string, kind: Babil): Promise<Ready> {
  const step = kind === "dort" ? 0.085 : 0.06;
  const base = kind === "vif" ? [560, 920] : kind === "grave" ? [300, 470] : [190, 300];
  const events: { t: number; f: number }[] = [];
  let t = 0.05, n = 0, seed = text.length * 7919 + 1;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (const ch of text.slice(0, 900)) {
    if ("…".includes(ch)) { t += 0.32; continue; }
    if (".!?".includes(ch)) { t += 0.28; continue; }
    if (",:;".includes(ch)) { t += 0.14; continue; }
    if (/\s/.test(ch)) { t += step * 0.4; continue; }
    if (/[*_#[\]|()]/.test(ch)) continue;
    if (n++ % 2 === 0) events.push({ t, f: base[0] + rnd() * (base[1] - base[0]) });
    t += step;
  }
  const C = offline();
  const oc = new C(1, Math.ceil((t + 0.3) * SR), SR);
  const lp = oc.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = kind === "vif" ? 3200 : 1800; lp.connect(oc.destination);
  for (const e of events) {
    const o = oc.createOscillator(); o.type = kind === "vif" ? "square" : "triangle";
    o.frequency.setValueAtTime(e.f, e.t); o.frequency.linearRampToValueAtTime(e.f * (kind === "dort" ? 0.8 : 1.15), e.t + 0.05);
    const g = oc.createGain(); g.gain.setValueAtTime(0, e.t); g.gain.linearRampToValueAtTime(kind === "dort" ? 0.18 : 0.22, e.t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.001, e.t + (kind === "dort" ? 0.09 : 0.055));
    o.connect(g); g.connect(lp); o.start(e.t); o.stop(e.t + 0.12);
  }
  const buf = await new Promise<AudioBuffer>((res) => { oc.oncomplete = (ev) => res(ev.renderedBuffer); void oc.startRendering(); });
  const r = finish(buf);
  const d = r.buffer.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] *= 0.45; // discret, sous une vraie voix
  return r;
}
