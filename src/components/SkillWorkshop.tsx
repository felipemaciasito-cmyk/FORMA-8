import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { addEnergy, checkBadges, fx, REWARD } from "../lib/game";
import { loadClaude } from "../lib/models";
import { copyText, saveFile } from "../lib/share";
import { sfx } from "../lib/sound";
import { getState, nowIso, updateProgress, useProgress, useSettings, type SavedSkill } from "../lib/store";
import type { SkillTest } from "../lib/claude";
import { Icon } from "./Icon";

// ---------------------------------------------------------------
// L'Atelier : forger de vrais Skills (fichier SKILL.md).
// ---------------------------------------------------------------

const TEMPLATES: Omit<SavedSkill, "id" | "updatedAt">[] = [
  {
    name: "relance-impayes", title: "Relance d'impayé",
    description: "Rédige une relance de facture impayée avec le bon niveau de fermeté. À utiliser quand l'utilisateur parle de facture en retard, de relance client ou de paiement non reçu.",
    when: "Quand une facture n'est pas réglée à l'échéance.",
    steps: ["Demander le client, le montant, le numéro de facture et le nombre de jours de retard si ces infos manquent.", "Choisir le niveau : 1 (moins de 15 jours), 2 (15 à 45 jours), 3 (plus de 45 jours).", "Rédiger le mail avec le ton du niveau : cordial, puis ferme, puis formel.", "Proposer un échéancier au niveau 2 et 3."],
    output: "Un objet de mail, puis le corps du mail (150 mots maximum), en vouvoyant.",
    examples: [{ input: "Relance Dupont, facture 2026-041, 1 200 €, 20 jours de retard", output: "Objet : Facture 2026-041 — rappel\n\nBonjour Monsieur Dupont, …" }],
    avoid: ["Menacer de poursuites aux niveaux 1 et 2.", "Inventer un montant, une date ou un numéro de facture."],
  },
  {
    name: "compte-rendu-reunion", title: "Compte-rendu de réunion",
    description: "Transforme des notes de réunion brutes en compte-rendu clair avec décisions et actions. À utiliser quand l'utilisateur colle des notes de réunion ou demande une synthèse, un CR ou un résumé de réunion.",
    when: "Après une réunion, à partir de notes ou d'une transcription.",
    steps: ["Identifier la date, les participants et l'objet.", "Extraire les décisions prises.", "Lister les actions : qui, quoi, pour quand.", "Résumer les points de discussion en 3 à 5 puces."],
    output: "Titre, participants, puis 3 sections : Décisions, Actions (tableau qui/quoi/quand), Points discutés.",
    examples: [{ input: "Notes : réunion lundi avec Paul et Inès, on valide le devis, Paul envoie le contrat vendredi…", output: "# Réunion du lundi\n**Décisions** : devis validé…" }],
    avoid: ["Inventer une échéance non mentionnée.", "Dépasser une page."],
  },
  {
    name: "reponse-mail-client", title: "Réponse à un mail client",
    description: "Rédige une réponse professionnelle à un mail client dans le ton de l'entreprise. À utiliser quand l'utilisateur colle un mail de client et demande une réponse, un brouillon ou de l'aide pour répondre.",
    when: "Quand un client écrit et qu'il faut lui répondre vite et bien.",
    steps: ["Identifier la demande principale et le ton du client.", "Répondre d'abord à la question posée.", "Proposer la suite concrète (rendez-vous, devis, délai).", "Terminer par une formule chaleureuse."],
    output: "Un mail prêt à envoyer, 120 mots maximum, vouvoiement.",
    examples: [{ input: "Mail : « Bonjour, pouvez-vous me dire quand le site sera en ligne ? »", output: "Bonjour Madame Leroy,\n\nMerci pour votre message. Le site sera en ligne le…" }],
    avoid: ["Promettre une date sans la connaître : poser la question à l'utilisateur.", "Le jargon technique."],
  },
];

const blank = (): SavedSkill => ({ id: crypto.randomUUID?.() ?? String(Date.now()), name: "", title: "", description: "", when: "", steps: ["", "", ""], output: "", examples: [{ input: "", output: "" }], avoid: [""], updatedAt: nowIso() });

const yamlStr = (s: string) => (/[:#"'\n]/.test(s) ? JSON.stringify(s) : s);

export function skillToMarkdown(s: SavedSkill) {
  const steps = s.steps.filter((x) => x.trim());
  const ex = s.examples.filter((e) => e.input.trim() || e.output.trim());
  const avoid = s.avoid.filter((x) => x.trim());
  return [
    "---", `name: ${s.name || "mon-skill"}`, `description: ${yamlStr(s.description.trim())}`, "---", "",
    `# ${s.title || s.name || "Mon Skill"}`, "",
    ...(s.when.trim() ? ["## Quand l'utiliser", s.when.trim(), ""] : []),
    "## Étapes", ...steps.map((x, i) => `${i + 1}. ${x.trim()}`), "",
    "## Format de sortie", s.output.trim(), "",
    ...(ex.length ? ["## Exemples", ...ex.flatMap((e, i) => [`### Exemple ${i + 1}`, `**Demande :** ${e.input.trim()}`, "", "**Résultat attendu :**", e.output.trim(), ""])] : []),
    ...(avoid.length ? ["## À éviter", ...avoid.map((a) => `- ${a.trim()}`), ""] : []),
  ].join("\n");
}

export function skillChecks(s: SavedSkill) {
  return [
    { ok: /^[a-z0-9]+(-[a-z0-9]+)*$/.test(s.name) && s.name.length >= 3 && s.name.length <= 64, label: "Nom en minuscules avec tirets (ex. relance-impayes)" },
    { ok: s.description.trim().length >= 60, label: "Description d'au moins 60 caractères (ce que fait le Skill)" },
    { ok: /(quand|lorsque|à utiliser|si l'utilisateur|dès que)/i.test(s.description), label: "La description dit QUAND l'utiliser (« À utiliser quand… »)" },
    { ok: s.steps.filter((x) => x.trim().length > 5).length >= 3, label: "Au moins 3 étapes concrètes" },
    { ok: s.output.trim().length >= 10, label: "Un format de sortie précis" },
    { ok: s.examples.some((e) => e.input.trim() && e.output.trim()), label: "Au moins un exemple (demande + résultat)" },
    { ok: s.avoid.some((a) => a.trim().length > 5), label: "Au moins un point à éviter (garde-fou)" },
  ];
}

export default function SkillWorkshop() {
  const p = useProgress();
  const [editing, setEditing] = useState<SavedSkill | null>(null);
  return (
    <AnimatePresence mode="wait">
      {editing ? (
        <motion.div key="ed" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
          <Editor skill={editing} onClose={() => setEditing(null)} />
        </motion.div>
      ) : (
        <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="stack">
          {p.skills.length > 0 && <div className="panel-title">Tes Skills ({p.skills.length})</div>}
          {p.skills.map((s) => {
            const ok = skillChecks(s).every((c) => c.ok);
            return (
              <button key={s.id} className="choice" onClick={() => setEditing(s)} style={{ alignItems: "center" }}>
                <Icon name={s.finalized ? "expansion-card" : "pencil"} size={24} style={{ color: s.finalized ? "#ff7ab6" : "var(--text-2)" }} />
                <span className="grow"><b className="mono" style={{ fontSize: 14 }}>{s.name || "(sans nom)"}</b><br /><span className="small muted">{s.title}</span></span>
                <span className={`pill ${s.finalized ? "led" : ok ? "cyan" : "amber"}`}>{s.finalized ? "En service" : ok ? "Prêt" : "Brouillon"}</span>
              </button>
            );
          })}
          <button className="btn block" onClick={() => { sfx("open"); setEditing(blank()); }}><Icon name="plus" size={18} /> Forger un nouveau Skill</button>
          <div className="panel-title" style={{ marginTop: 14 }}>Ou partir d'un modèle</div>
          {TEMPLATES.map((t) => (
            <button key={t.name} className="choice" onClick={() => { sfx("open"); setEditing({ ...t, steps: [...t.steps], examples: t.examples.map((e) => ({ ...e })), avoid: [...t.avoid], id: crypto.randomUUID?.() ?? String(Date.now()), updatedAt: nowIso() }); }}>
              <Icon name="set-square" size={22} style={{ color: "var(--cyan)" }} />
              <span className="grow"><b className="mono" style={{ fontSize: 14 }}>{t.name}</b><br /><span className="small muted">{t.title}</span></span>
            </button>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Editor({ skill, onClose }: { skill: SavedSkill; onClose: () => void }) {
  const settings = useSettings();
  const [s, setS] = useState<SavedSkill>(skill);
  const [tab, setTab] = useState<"form" | "preview" | "test">("form");
  const [msg, setMsg] = useState("");
  const [testIn, setTestIn] = useState("");
  const [test, setTest] = useState<{ loading: boolean; res?: SkillTest; error?: string }>({ loading: false });
  const checks = skillChecks(s);
  const allOk = checks.every((c) => c.ok);
  const md = skillToMarkdown(s);
  const set = (patch: Partial<SavedSkill>) => setS((x) => ({ ...x, ...patch }));

  const save = (extra?: Partial<SavedSkill>) => {
    const next = { ...s, ...extra, updatedAt: nowIso() };
    setS(next);
    updateProgress((p) => {
      const i = p.skills.findIndex((k) => k.id === next.id);
      if (i >= 0) p.skills[i] = next; else p.skills.push(next);
    });
    return next;
  };
  const finalize = (e: React.MouseEvent) => {
    const wasFinal = getState().progress.skills.find((k) => k.id === s.id)?.finalized;
    save({ finalized: true });
    sfx("power"); fx({ type: "burst", x: e.clientX, y: e.clientY, color: "#ff7ab6" });
    if (!wasFinal) addEnergy(REWARD.skill, "Skill mis en service");
    checkBadges();
    setMsg("Skill mis en service. Enregistre le fichier pour l'installer dans ton assistant.");
  };
  const exportMd = async () => {
    save();
    const r = await saveFile(`SKILL-${s.name || "mon-skill"}.md`, md);
    setMsg(r === "shared" ? "Fichier partagé. Sur iPhone : « Enregistrer dans Fichiers », puis renomme-le SKILL.md dans un dossier au nom du Skill." : r === "downloaded" ? "Fichier téléchargé. Renomme-le SKILL.md dans un dossier au nom du Skill." : r === "copied" ? "Contenu copié dans le presse-papiers." : "");
  };
  const remove = () => {
    if (!confirm("Supprimer ce Skill de l'Atelier ?")) return;
    updateProgress((p) => { p.skills = p.skills.filter((k) => k.id !== s.id); p.deletedSkills[s.id] = nowIso(); });
    onClose();
  };
  const runTest = async () => {
    setTest({ loading: true });
    try { const { testSkill } = await loadClaude(); setTest({ loading: false, res: await testSkill(md, testIn) }); }
    catch (e) { setTest({ loading: false, error: e instanceof Error ? e.message : String(e) }); }
  };
  const list = (key: "steps" | "avoid", label: string, ph: string) => (
    <div className="field">
      <span>{label}</span>
      {s[key].map((v, i) => (
        <div key={i} className="row" style={{ marginBottom: 6 }}>
          {key === "steps" && <span className="mono dim" style={{ width: 18 }}>{i + 1}.</span>}
          <input className="input" value={v} placeholder={ph} onChange={(e) => set({ [key]: s[key].map((x, k) => (k === i ? e.target.value : x)) } as Partial<SavedSkill>)} />
          <button className="icon-btn" style={{ flex: "none" }} aria-label="Retirer" onClick={() => set({ [key]: s[key].filter((_x, k) => k !== i) } as Partial<SavedSkill>)}><Icon name="close" size={16} /></button>
        </div>
      ))}
      <button className="btn subtle small" onClick={() => set({ [key]: [...s[key], ""] } as Partial<SavedSkill>)}>+ Ajouter</button>
    </div>
  );

  return (
    <div>
      <div className="row" style={{ marginBottom: 12 }}>
        <button className="icon-btn" onClick={() => { save(); onClose(); }} aria-label="Retour à la liste"><Icon name="back" /></button>
        <div className="grow"><div className="kicker">Atelier · SKILL.md</div><div className="h3 mono" style={{ margin: 0 }}>{s.name || "nouveau-skill"}</div></div>
        <span className="mono" style={{ color: allOk ? "var(--led)" : "var(--amber)" }}>{checks.filter((c) => c.ok).length}/{checks.length}</span>
      </div>
      <div className="seg" style={{ marginBottom: 14 }}>
        {(["form", "preview", "test"] as const).map((t) => (
          <button key={t} className={tab === t ? "on" : ""} style={{ background: tab === t ? "#ff7ab6" : undefined }} onClick={() => { sfx("tap"); setTab(t); }}>
            <span>{t === "form" ? "Forger" : t === "preview" ? "Aperçu" : "Tester"}</span>
          </button>
        ))}
      </div>

      {tab === "form" && (
        <div>
          <label className="field"><span>Nom (identifiant)</span>
            <input className="input mono" value={s.name} placeholder="relance-impayes" onChange={(e) => set({ name: e.target.value.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9-]+/g, "-").replace(/^-+/, "").slice(0, 64) })} />
          </label>
          <label className="field"><span>Titre lisible</span><input className="input" value={s.title} placeholder="Relance d'impayé" onChange={(e) => set({ title: e.target.value })} /></label>
          <label className="field"><span>Description (QUOI + QUAND)</span>
            <textarea className="input" value={s.description} placeholder="Rédige… À utiliser quand l'utilisateur parle de…" onChange={(e) => set({ description: e.target.value })} />
          </label>
          <label className="field"><span>Quand l'utiliser (détail)</span><input className="input" value={s.when} placeholder="Quand une facture n'est pas réglée à l'échéance." onChange={(e) => set({ when: e.target.value })} /></label>
          {list("steps", "Étapes de ta méthode", "Ce que tu ferais toi-même…")}
          <label className="field"><span>Format de sortie</span><textarea className="input" style={{ minHeight: 70 }} value={s.output} placeholder="Un objet + un mail de 150 mots max." onChange={(e) => set({ output: e.target.value })} /></label>
          <div className="field"><span>Exemples</span>
            {s.examples.map((ex, i) => (
              <div key={i} className="panel" style={{ padding: 10, marginBottom: 8 }}>
                <input className="input" style={{ marginBottom: 6 }} value={ex.input} placeholder="Demande type" onChange={(e) => set({ examples: s.examples.map((x, k) => (k === i ? { ...x, input: e.target.value } : x)) })} />
                <textarea className="input" style={{ minHeight: 64 }} value={ex.output} placeholder="Résultat attendu" onChange={(e) => set({ examples: s.examples.map((x, k) => (k === i ? { ...x, output: e.target.value } : x)) })} />
              </div>
            ))}
            <button className="btn subtle small" onClick={() => set({ examples: [...s.examples, { input: "", output: "" }] })}>+ Ajouter un exemple</button>
          </div>
          {list("avoid", "À éviter (garde-fous)", "Ne jamais…")}
        </div>
      )}

      {tab === "preview" && <pre className="code-block" style={{ maxHeight: 420, overflow: "auto" }}>{md}</pre>}

      {tab === "test" && (
        <div>
          {settings.apiKey ? (
            <>
              <label className="field"><span>Une demande naturelle pour tester</span>
                <textarea className="input" value={testIn} onChange={(e) => setTestIn(e.target.value)} placeholder="Ex. : « Mon client Martin ne m'a pas payé depuis 3 semaines, 800 €, facture 112. »" />
              </label>
              <button className="btn block" disabled={testIn.trim().length < 10 || test.loading} onClick={runTest}>{test.loading ? "Claude applique ton Skill…" : "Tester avec Claude"}</button>
              {test.res && (
                <>
                  <div className="feedback info"><span className="tag">Résultat produit</span><pre style={{ margin: 0, whiteSpace: "pre-wrap", font: "14px/1.5 var(--font)" }}>{test.res.output}</pre></div>
                  <div className={`feedback ${test.res.followed ? "ok" : "ko"}`}><span className="tag">{test.res.followed ? "Skill respecté" : "Skill pas entièrement respecté"}</span>
                    <ul style={{ margin: 0, paddingLeft: 18 }}>{test.res.notes.map((n, i) => <li key={i}>{n}</li>)}</ul></div>
                </>
              )}
              {test.error && <div className="feedback ko"><span className="tag">Erreur</span>{test.error}</div>}
            </>
          ) : (
            <div className="feedback info"><span className="tag">Test hors ligne</span>Ajoute une clé API Claude dans Réglages pour tester ton Skill en direct. Sinon : enregistre le fichier, installe-le dans ton assistant et teste-le avec une demande naturelle.</div>
          )}
        </div>
      )}

      <div className="panel" style={{ marginTop: 16 }}>
        <div className="panel-title">Contrôle qualité</div>
        {checks.map((c, i) => (
          <div key={i} className="row small" style={{ margin: "6px 0", color: c.ok ? "var(--text)" : "var(--text-2)" }}>
            <span style={{ color: c.ok ? "var(--led)" : "var(--amber)", fontFamily: "var(--mono)" }}>{c.ok ? "[OK]" : "[..]"}</span>{c.label}
          </div>
        ))}
      </div>
      {msg && <div className="feedback ok">{msg}</div>}
      <div className="stack" style={{ marginTop: 14 }}>
        <button className="btn block" style={{ background: "#ff7ab6", boxShadow: "0 8px 30px -10px #ff7ab6" }} disabled={!allOk} onClick={finalize}><Icon name="power" size={18} /> Mettre en service</button>
        <div className="row">
          <button className="btn subtle grow" onClick={exportMd}><Icon name="share" size={18} /> Enregistrer le fichier</button>
          <button className="btn subtle" onClick={async () => { save(); setMsg((await copyText(md)) ? "Copié dans le presse-papiers." : "Copie impossible."); }} aria-label="Copier"><Icon name="copy" size={18} /></button>
        </div>
        <button className="btn ghost small" onClick={remove}><Icon name="trash" size={16} /> Supprimer</button>
      </div>
    </div>
  );
}
