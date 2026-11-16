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
    for (let i = 0; i < d.length; i++) {
      const k = i % n, from = n - cut;
      if (k < from) continue;
      // Rampe de 2 ms à l'entrée et à la sortie du trou : pas de clic.
      const edge = Math.min(k - from, n - 1 - k), g = edge < ramp ? edge / ramp : 1;
      d[i] *= 1 - Math.min(1, f.hache.prof * k) * g;
    }
  }
  let peak = 0; for (let i = 0; i < d.length; i++) peak = Math.max(peak, Math.abs(d[i]));
  if (peak > 0) { const k = 0.9 / peak; for (let i = 0; i < d.length; i++) d[i] *= k; }
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

