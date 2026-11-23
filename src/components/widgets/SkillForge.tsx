import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { addEnergy, fx, REWARD } from "../../lib/game";
import { copyText } from "../../lib/share";
import { sfx } from "../../lib/sound";
import { getState, updateProgress } from "../../lib/store";
import { Icon } from "../Icon";

// « La Forge de Skills » (caisson 02, protocole 5) : forger le fichier SKILL.md d'un savoir-faire de ton équipe,
// puis l'essayer. Écrite d'après la documentation officielle d'Anthropic, « Étendre Claude avec des skills »
// (code.claude.com/docs/fr/skills, vérifiée le 17/11/2026) :
// - un skill est un dossier .claude/skills/<nom>/ avec un fichier SKILL.md : un en-tête entre deux lignes « --- »,
//   puis les instructions en Markdown ;
// - seul le champ « description » est recommandé : ce que fait le skill ET quand l'utiliser, avec les mots que
//   l'utilisateur dirait naturellement ; Claude ne lit que les descriptions tant que le skill ne sert pas ;
// - le nom ne doit contenir ni espace en trop, ni « < » ou « > » (en pratique : minuscules et tirets) ;
// - mettre les instructions les plus importantes en haut : après une compaction, seul le début peut être gardé.

interface Choice { t: string; ok: boolean; why: string }
interface Theme {
  id: string; label: string; name: string; title: string;
  what: Choice[]; when: Choice[];
  steps: { t: string; key?: boolean }[];
  requests: { t: string; hit: boolean }[];
}

const THEMES: Theme[] = [
  {
    id: "nouveautes", label: "Annoncer une nouveauté", name: "journal-des-nouveautes", title: "Journal des nouveautés",
    what: [
      { t: "Ajoute une ligne datée à la section « Dernières nouveautés » de la page d'accueil.", ok: true, why: "Précis : on sait exactement ce que fait le skill." },
      { t: "Aide pour les textes.", ok: false, why: "Trop vague : Claude ne saura jamais quand ce skill sert, plutôt qu'un autre." },
    ],
    when: [
      { t: "À utiliser quand on livre une nouvelle version ou qu'on annonce une nouveauté.", ok: true, why: "Les mots « version » et « nouveauté » sont ceux que tu diras : Claude fera le lien." },
      { t: "À utiliser quand c'est utile.", ok: false, why: "Ça ne dit rien : quand est-ce utile ? Claude ne peut pas deviner." },
    ],
    steps: [
      { t: "Ne jamais effacer les anciennes lignes : on ajoute en haut.", key: true },
      { t: "Écrire la date du jour, puis la nouveauté en une phrase simple, avec le tutoiement." },
      { t: "Vérifier que la page reste lisible sur un écran d'iPhone." },
      { t: "Écrire un message de commit qui dit ce qui change." },
    ],
    requests: [
      { t: "La version 0.3 est prête, annonce-la sur la page", hit: true },
      { t: "Ajoute une nouveauté : le formulaire de contact marche", hit: true },
      { t: "Change la couleur du titre en bleu", hit: false },
    ],
  },
  {
    id: "iphone", label: "Vérifier sur iPhone", name: "verif-iphone", title: "Vérification sur iPhone",
    what: [
      { t: "Vérifie qu'une page reste lisible et utilisable sur un écran d'iPhone : textes, boutons, marges.", ok: true, why: "Précis : l'objet (une page) et le critère (lisible sur iPhone)." },
      { t: "Vérifications diverses.", ok: false, why: "Lesquelles ? Une description vague, et le skill n'est jamais choisi." },
    ],
    when: [
      { t: "À utiliser quand on modifie une page, ou qu'on demande si elle s'affiche bien sur téléphone.", ok: true, why: "« page », « téléphone » : ce sont tes mots, Claude les reconnaîtra." },
      { t: "À utiliser parfois.", ok: false, why: "Parfois, c'est quand ? Claude ne peut pas décider à ta place." },
    ],
    steps: [
      { t: "Ne jamais valider une page sans l'avoir vue en largeur de téléphone.", key: true },
      { t: "Contrôler la taille des textes et des boutons : assez grands pour un doigt." },
      { t: "Signaler chaque problème avec sa correction proposée." },
      { t: "Résumer en trois phrases simples, sans jargon." },
    ],
    requests: [
      { t: "Ma page s'affiche bien sur téléphone ?", hit: true },
      { t: "J'ai modifié la page d'accueil, vérifie-la", hit: true },
      { t: "Écris le message de commit", hit: false },
    ],
  },
];

const NAME_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

type Phase = "forge" | "essai" | "fini";

export default function SkillForge() {
  const [theme, setTheme] = useState<Theme>(THEMES[0]);
  const [name, setName] = useState(THEMES[0].name);
  const [what, setWhat] = useState<number | null>(null);
  const [when, setWhen] = useState<number | null>(null);
  const [order, setOrder] = useState<number[]>(() => shuffled(THEMES[0].steps.length));
  const [phase, setPhase] = useState<Phase>("forge");
  const [tried, setTried] = useState<Record<number, boolean>>({});
  const [copied, setCopied] = useState(false);

  const pick = (t: Theme) => { sfx("tap"); setTheme(t); setName(t.name); setWhat(null); setWhen(null); setOrder(shuffled(t.steps.length)); setPhase("forge"); setTried({}); setCopied(false); };
  const w = what === null ? null : theme.what[what];
  const q = when === null ? null : theme.when[when];
  const nameOk = NAME_RE.test(name);
  const keyFirst = !!theme.steps[order[0]]?.key;
  const checks = [
    { ok: nameOk, label: "Un nom en minuscules, avec des tirets, sans espace", tip: "Le nom devient le dossier .claude/skills/<nom>/ et la commande /<nom>." },
    { ok: !!w?.ok, label: "La description dit ce que fait le skill", tip: w && !w.ok ? w.why : "Choisis la phrase la plus précise." },
    { ok: !!q?.ok, label: "Elle dit quand l'utiliser, avec tes mots", tip: q && !q.ok ? q.why : "Choisis la phrase qui contient les mots que tu diras." },
    { ok: keyFirst, label: "La règle la plus importante est en premier", tip: "Après une compaction, seul le début du skill peut être gardé : la règle à ne jamais oublier va en haut." },
  ];
  const ready = checks.every((c) => c.ok);
  const description = `${w?.t ?? "…"} ${q?.t ?? "…"}`;
  const file = `---\nname: ${name || "…"}\ndescription: ${description}\n---\n\n# ${theme.title}\n\n${order.map((i, k) => `${k + 1}. ${theme.steps[i].t}`).join("\n")}\n`;
  const allTried = theme.requests.every((_, i) => tried[i] !== undefined);

  const move = (k: number, d: -1 | 1) => {
    const j = k + d;
    if (j < 0 || j >= order.length) return;
    sfx("tap");
    const o = [...order]; [o[k], o[j]] = [o[j], o[k]]; setOrder(o);
  };
  const tryReq = (i: number) => { const hit = theme.requests[i].hit; sfx(hit ? "power" : "relay"); setTried((t) => ({ ...t, [i]: hit })); };
  const finish = () => {
    sfx("ok");
    const now = new Date().toISOString();
    const first = !getState().progress.skills.some((s) => s.finalized);
    updateProgress((p) => {
      p.skills = p.skills.filter((s) => s.id !== `forge:${theme.id}`);
      p.skills.push({ id: `forge:${theme.id}`, name, description, title: theme.title, when: q?.t ?? "", steps: order.map((i) => theme.steps[i].t), output: "", examples: [], avoid: [], updatedAt: now, finalized: true });
    });
    if (first) { fx({ type: "burst", color: "#a78bfa" }); addEnergy(REWARD.skill, "Skill forgé"); }
    setPhase("fini");
  };

  return (
    <div>
      <div className="row" style={{ justifyContent: "space-between", marginBottom: 8 }}>
        <span className="mono small">FORGE DE SKILLS · .claude/skills/{name || "…"}/SKILL.md</span>
        <span className={`pill ${ready ? "cyan" : "amber"}`}>{checks.filter((c) => c.ok).length}/4</span>
      </div>
      <div className="row" style={{ gap: 6, flexWrap: "wrap" }}>
        {THEMES.map((t) => <button key={t.id} className={`pill ${t.id === theme.id ? "cyan" : ""}`} onClick={() => pick(t)}>{t.label}</button>)}
      </div>

      {phase === "forge" && (
        <div className="stack" style={{ marginTop: 12 }}>
          <label className="field"><span>1. Le nom</span>
            <input className="input mono" value={name} onChange={(e) => setName(e.target.value)} autoCapitalize="off" autoCorrect="off" spellCheck={false} aria-label="Nom du skill" />
          </label>
          <div className="small muted">2. Ce que fait le skill</div>
          {theme.what.map((c, i) => <button key={c.t} className={`choice ${what === i ? (c.ok ? "ok" : "ko") : ""}`} onClick={() => { sfx(c.ok ? "ok" : "ko"); setWhat(i); }}><span>{c.t}</span></button>)}
          <div className="small muted">3. Quand l'utiliser</div>
          {theme.when.map((c, i) => <button key={c.t} className={`choice ${when === i ? (c.ok ? "ok" : "ko") : ""}`} onClick={() => { sfx(c.ok ? "ok" : "ko"); setWhen(i); }}><span>{c.t}</span></button>)}
          <div className="small muted">4. Les instructions, dans l'ordre</div>
          <ol style={{ margin: 0, paddingLeft: 0, listStyle: "none" }} className="stack">
            {order.map((i, k) => (
              <motion.li key={i} layout className="choice" style={{ cursor: "default", alignItems: "center" }}>
                <span className="mono" style={{ color: "var(--text-3)" }}>{k + 1}</span>
                <span className="grow small">{theme.steps[i].t}</span>
                <button className="icon-btn" aria-label="Monter" disabled={k === 0} onClick={() => move(k, -1)}><Icon name="chevron-up" size={16} /></button>
                <button className="icon-btn" aria-label="Descendre" disabled={k === order.length - 1} onClick={() => move(k, 1)}><Icon name="chevron-down" size={16} /></button>
              </motion.li>
            ))}
          </ol>
          <div className="panel-title" style={{ marginTop: 6 }}>Contrôles</div>
          {checks.map((c) => (
            <div key={c.label} className={`feedback ${c.ok ? "ok" : "info"}`} style={{ margin: 0 }}>
              <b>{c.ok ? "OK" : "À faire"} · </b>{c.label}{!c.ok && <div className="small" style={{ marginTop: 2 }}>{c.tip}</div>}
            </div>
          ))}
          <pre className="mono small" style={{ whiteSpace: "pre-wrap", background: "#050912", border: "1px solid var(--line)", borderRadius: 10, padding: 10, margin: 0 }}>{file}</pre>
          <button className="btn block" disabled={!ready} onClick={() => { sfx("power"); setPhase("essai"); }}>{ready ? "Essayer le skill" : "Termine les contrôles"}</button>
        </div>
      )}

      {phase !== "forge" && (
        <div className="stack" style={{ marginTop: 12 }}>
          <div className="small muted">Envoie des demandes : Claude ne lit que la description, et charge le skill seulement s'il correspond.</div>
          {theme.requests.map((r, i) => (
            <button key={r.t} className={`choice ${tried[i] === undefined ? "" : tried[i] ? "ok" : ""}`} onClick={() => tryReq(i)}>
              <Icon name="chat" size={16} /><span className="grow">{r.t}</span>
              {tried[i] !== undefined && <span className={`pill ${tried[i] ? "cyan" : ""}`}>{tried[i] ? "Skill chargé" : "Pas chargé"}</span>}
            </button>
          ))}
          <AnimatePresence>
            {allTried && phase === "essai" && (
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="stack">
                <div className="feedback ok" style={{ margin: 0 }}>Le skill se charge pour les demandes qui lui correspondent, et reste rangé pour les autres : sa description fait son travail.</div>
                <button className="btn block" onClick={finish}><Icon name="check" size={18} /> Finaliser ce skill</button>
              </motion.div>
            )}
          </AnimatePresence>
          {phase === "fini" && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="stack">
              <div className="feedback ok" style={{ margin: 0 }}><b>Skill forgé.</b> Copie son fichier : tu en auras besoin pour l'ordre de mission plus bas.</div>
              <button className="btn subtle block" onClick={async () => { setCopied(await copyText(file)); sfx("tap"); }}><Icon name="copy" size={16} /> {copied ? "Copié" : "Copier le SKILL.md"}</button>
              <button className="btn ghost small block" onClick={() => { sfx("tap"); setPhase("forge"); setTried({}); setCopied(false); }}><Icon name="refresh" size={16} /> Retoucher</button>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}

/** Ordre de départ mélangé, jamais avec la règle importante déjà en tête (sinon rien à apprendre). */
function shuffled(n: number) {
  const a = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  if (a[0] === 0) [a[0], a[n - 1]] = [a[n - 1], a[0]];
  return a;
}
