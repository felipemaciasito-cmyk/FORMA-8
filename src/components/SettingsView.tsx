import { useRef, useState } from "react";
import { MODELS, loadClaude } from "../lib/models";
import { testGithub } from "../lib/github";
import { refreshHeritage, useHeritage } from "../lib/forma7";
import { deviceLabel, syncNow, useSyncState } from "../lib/sync";
import { saveFile } from "../lib/share";
import { sfx } from "../lib/sound";
import { DEFAULT_PROGRESS, getState, replaceProgress, updateProgress, updateSettings, useProgress, useSettings, type Progress } from "../lib/store";
import { TopBar } from "./Chrome";
import { go } from "../lib/router";
import { Icon, type IconId } from "./Icon";

export function SettingsView() {
  const s = useSettings();
  const p = useProgress();
  const heritage = useHeritage();
  const sync = useSyncState();
  const [showTok, setShowTok] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [gh, setGh] = useState<{ loading?: boolean; ok?: string; err?: string }>({});
  const [cl, setCl] = useState<{ loading?: boolean; ok?: string; err?: string }>({});
  const file = useRef<HTMLInputElement>(null);

  const testGh = async () => {
    setGh({ loading: true });
    try { const msg = await testGithub(); setGh({ ok: msg }); sfx("ok"); refreshHeritage(); }
    catch (e) { setGh({ err: e instanceof Error ? e.message : String(e) }); sfx("ko"); }
  };
  const testCl = async () => {
    setCl({ loading: true });
    try { const { testKey } = await loadClaude(); setCl({ ok: await testKey() }); sfx("ok"); }
    catch (e) { setCl({ err: e instanceof Error ? e.message : String(e) }); sfx("ko"); }
  };
  const exportBackup = async () => {
    await saveFile(`forma-8-sauvegarde-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(getState().progress, null, 2), "application/json");
  };
  const importBackup = async (f: File) => {
    try {
      const json = JSON.parse(await f.text()) as Progress;
      if (json.version !== 1 || typeof json.energy !== "number") throw new Error("Fichier non reconnu");
      if (!confirm("Remplacer ta progression actuelle par cette sauvegarde ?")) return;
      replaceProgress(json); sfx("power");
      alert(getState().settings.syncEnabled ? "Sauvegarde restaurée. Elle sera aussi appliquée à tes autres appareils synchronisés." : "Sauvegarde restaurée.");
    } catch (e) { alert(`Import impossible : ${e instanceof Error ? e.message : e}`); }
  };

  return (
    <div className="wrap">
      <TopBar title="Réglages" kicker="Poste de commandement" />

      <Section icon="sliders" title="Profil & confort">
        <label className="field"><span>Ton prénom</span><input className="input" value={p.name} maxLength={24} onChange={(e) => updateProgress((d) => { d.name = e.target.value; })} /></label>
        <Toggle label="Effets sonores" on={s.sound} onChange={(v) => { updateSettings({ sound: v }); if (v) setTimeout(() => sfx("ok"), 50); }} />
        <Toggle label="Fond sonore de la réserve" on={s.ambience} onChange={(v) => updateSettings({ ambience: v })} />
        <p className="small muted" style={{ margin: "4px 0 0" }}>Ronronnement des transformateurs, ventilation, grésillements au loin. Plus ton équipe se réveille, plus la salle s'anime. Avec des écouteurs, c'est encore mieux.</p>
        {s.ambience && (
          <label className="field" style={{ marginTop: 10 }}><span>Volume du fond sonore</span>
            <input type="range" min={0} max={100} step={5} value={Math.round((s.ambienceVolume ?? 0.6) * 100)} onChange={(e) => updateSettings({ ambienceVolume: Number(e.target.value) / 100 })} aria-label="Volume du fond sonore" style={{ width: "100%", accentColor: "var(--cyan)" }} />
          </label>
        )}
        <label className="field" style={{ marginTop: 12 }}><span>Animations</span>
          <select className="input" value={s.reduceMotion} onChange={(e) => updateSettings({ reduceMotion: e.target.value as typeof s.reduceMotion })}>
            <option value="auto">Selon le réglage de l'iPhone</option>
            <option value="off">Complètes</option>
            <option value="on">Réduites</option>
          </select>
        </label>
      </Section>

      <Section icon="spark" title="Claude dans l'appli (indispensable)">
        <p className="small muted">FORMA-8 utilise Claude pour corriger tes réponses libres, noter tes consignes et réexpliquer une notion autrement. Il lui faut ta propre <b>clé API</b>, stockée uniquement sur cet appareil et envoyée seulement à l'API d'Anthropic. L'API est payée à l'usage, séparément de ton abonnement claude.ai.</p>
        <label className="field"><span>Clé API Claude</span>
          <div className="row">
            <input className="input mono" type={showKey ? "text" : "password"} value={s.apiKey} placeholder="sk-ant-…" onChange={(e) => updateSettings({ apiKey: e.target.value.trim() })} autoCapitalize="off" autoCorrect="off" spellCheck={false} />
            <button className="icon-btn" style={{ flex: "none" }} onClick={() => setShowKey(!showKey)} aria-label="Afficher la clé"><Icon name="eye" size={18} /></button>
          </div>
        </label>
        <label className="field"><span>Modèle</span>
          <select className="input" value={s.model} onChange={(e) => updateSettings({ model: e.target.value })}>
            {MODELS.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
          </select>
        </label>
        <button className="btn small block" disabled={!s.apiKey || cl.loading} onClick={testCl}>{cl.loading ? "Test…" : "Tester la clé"}</button>
        {cl.ok && <div className="feedback ok"><span className="tag">Claude répond</span>{cl.ok}</div>}
        {cl.err && <div className="feedback ko">{cl.err}</div>}
        <details style={{ marginTop: 12 }}>
          <summary className="small" style={{ color: "var(--cyan)", cursor: "pointer" }}>Obtenir une clé et maîtriser le coût</summary>
          <ol className="small" style={{ paddingLeft: 18, lineHeight: 1.6 }}>
            <li>Ouvre la <b>Console Claude</b> (platform.claude.com) et connecte-toi.</li>
            <li>Dans les réglages de facturation (<b>Billing</b>), achète un petit crédit : c'est un solde prépayé.</li>
            <li>Crée un <b>espace de travail</b> (Workspaces) nommé « FORMA-8 » et fixe-lui une <b>limite de dépense mensuelle</b> basse (par exemple 10 $). La limite ne peut pas s'appliquer à l'espace par défaut.</li>
            <li>Dans cet espace, crée une <b>clé API</b> « FORMA-8 », copie-la ici, puis « Tester la clé ».</li>
          </ol>
          <p className="small muted">Les menus de la Console peuvent changer de nom. Coût estimé (vérifié en novembre 2026, à confirmer sur ta Console) : environ 8 $ par mois avec Opus 5.5, 4 $ avec Sonnet 5.5, moins de 0,50 $ avec Haiku 5.5, pour une séance quotidienne. Ne colle jamais cette clé ailleurs que dans ce champ.</p>
        </details>
      </Section>

      <Section icon="dish" title="GitHub et dépôt de données">
        <p className="small muted">Un <b>jeton d'accès</b> GitHub permet à FORMA-8 de synchroniser ta progression dans ton dépôt <b>privé</b> de données. Il est stocké uniquement sur cet appareil. Plus tard, le même jeton servira à vérifier tes livraisons.</p>
        <div className="row">
          <label className="field grow"><span>Compte GitHub</span><input className="input mono" value={s.ghOwner} onChange={(e) => updateSettings({ ghOwner: e.target.value.trim() })} autoCapitalize="off" autoCorrect="off" /></label>
          <label className="field grow"><span>Dépôt de données</span><input className="input mono" value={s.ghRepo} onChange={(e) => updateSettings({ ghRepo: e.target.value.trim() })} autoCapitalize="off" autoCorrect="off" /></label>
        </div>
        <label className="field"><span>Jeton d'accès GitHub</span>
          <div className="row">
            <input className="input mono" type={showTok ? "text" : "password"} value={s.ghToken} placeholder="github_pat_…" onChange={(e) => updateSettings({ ghToken: e.target.value.trim() })} autoCapitalize="off" autoCorrect="off" spellCheck={false} />
            <button className="icon-btn" style={{ flex: "none" }} onClick={() => setShowTok(!showTok)} aria-label="Afficher le jeton"><Icon name="eye" size={18} /></button>
          </div>
        </label>
        <button className="btn small block" disabled={!s.ghToken || gh.loading} onClick={testGh}>{gh.loading ? "Test…" : "Tester la connexion"}</button>
        {gh.ok && <div className="feedback ok">{gh.ok}</div>}
        {gh.err && <div className="feedback ko">{gh.err}</div>}
        <details style={{ marginTop: 12 }}>
          <summary className="small" style={{ color: "var(--cyan)", cursor: "pointer" }}>Créer le jeton, pas à pas</summary>
          <ol className="small" style={{ paddingLeft: 18, lineHeight: 1.6 }}>
            <li>Sur github.com : photo de profil › <b>Settings</b> › <b>Developer settings</b> › <b>Personal access tokens</b> › <b>Fine-grained tokens</b> › <b>Generate new token</b>.</li>
            <li>Nom : « FORMA-8 ». Expiration : 90 jours (tu le renouvelleras). Le même jeton sert sur l'iPhone et l'iPad.</li>
            <li><b>Repository access</b> : « Only select repositories » › <b>FORMA-7-data</b>.</li>
            <li><b>Permissions › Repository permissions › Contents</b> : <b>Read and write</b>. Rien d'autre pour l'instant.</li>
            <li>Génère, copie le jeton, colle-le ici, puis « Tester la connexion ».</li>
          </ol>
          <p className="small muted">Les menus de GitHub peuvent changer légèrement de nom. Ne colle jamais ce jeton ailleurs que dans ce champ.</p>
        </details>
      </Section>

      <Section icon="refresh" title="Synchronisation entre appareils">
        <p className="small muted">Retrouve ta progression sur ton iPhone et ton iPad, dans Safari comme depuis l'écran d'accueil (sur iOS, chacun a son propre stockage). Elle est enregistrée dans ton dépôt privé (fichier <code>progress/forma-8.json</code>, séparé de celui de FORMA-7), à l'ouverture de l'appli, environ 30 secondes après chaque progrès, et quand tu la quittes. Si tu avances sur deux appareils sans connexion, tout est fusionné : rien n'est perdu.</p>
        <Toggle label="Synchroniser ma progression" on={s.syncEnabled} onChange={(v) => { if (v && !s.ghToken) { alert("Colle d'abord ton jeton GitHub dans « GitHub et dépôt de données » ci-dessus (droits Contents : Read and write)."); return; } updateSettings({ syncEnabled: v }); }} />
        <div className="small" style={{ marginTop: 8, color: sync.status === "error" ? "var(--red)" : "var(--text-2)" }}>
          {!s.syncEnabled ? "Désactivée sur cet appareil." : sync.status === "syncing" ? "Synchronisation en cours…" : sync.status === "error" ? sync.error : sync.lastSyncAt ? `Synchronisé le ${new Date(sync.lastSyncAt).toLocaleString("fr-FR")}.` : "En attente de la première synchronisation."}
        </div>
        {s.syncEnabled && <button className="btn small subtle block" style={{ marginTop: 10 }} disabled={sync.status === "syncing"} onClick={() => syncNow()}><Icon name="refresh" size={16} /> Synchroniser maintenant</button>}
        <div className="small dim" style={{ marginTop: 8 }}>Cet appareil : {deviceLabel()} · {s.deviceId.slice(0, 8)}. Active la synchronisation sur chaque appareil, avec le même jeton.</div>
      </Section>

      <Section icon="rack" title="Héritage FORMA-7">
        <p className="small muted">Si tu as utilisé FORMA-7, FORMA-8 peut afficher ton grade et tes badges du datacenter, en lecture seule : rien n'est jamais modifié dans FORMA-7. Sources : FORMA-7 ouverte dans ce même navigateur, ou sa progression synchronisée dans ton dépôt de données.</p>
        <div className="small" style={{ color: "var(--text-2)" }}>{heritage.heritage ? `Trouvé : ${heritage.heritage.grade}, ${heritage.heritage.badges.length} badge(s).` : heritage.status === "loading" ? "Recherche en cours…" : "Aucune progression FORMA-7 trouvée pour l'instant."}</div>
        <button className="btn small subtle block" style={{ marginTop: 10 }} disabled={heritage.status === "loading"} onClick={() => refreshHeritage()}><Icon name="refresh" size={16} /> Relire FORMA-7</button>
      </Section>

      <Section icon="hdd" title="Sauvegarde">
        <p className="small muted">Ta progression est stockée sur cet appareil{s.syncEnabled ? " et synchronisée dans ton dépôt privé" : ""}. Le fichier de sauvegarde contient ta progression, mais jamais ton jeton ni ta clé API.{s.syncEnabled ? "" : " iOS peut, rarement, effacer les données d'un site : exporte une sauvegarde de temps en temps, ou active la synchronisation."}</p>
        <div className="row">
          <button className="btn small subtle grow" onClick={exportBackup}><Icon name="share" size={16} /> Exporter</button>
          <button className="btn small subtle grow" onClick={() => file.current?.click()}>Importer</button>
          <input ref={file} type="file" accept="application/json,.json" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) importBackup(f); e.target.value = ""; }} />
        </div>
        <button className="btn small ghost block" style={{ marginTop: 10, color: "var(--red)" }} onClick={() => { if (confirm(s.syncEnabled ? "Tout réinitialiser ? Ta progression sera effacée sur CET appareil ET sur tes autres appareils synchronisés (pense à exporter avant)." : "Tout réinitialiser ? Ta progression sera effacée (pense à exporter avant).")) { replaceProgress(DEFAULT_PROGRESS); setTimeout(async () => { await syncNow(); location.hash = "#/"; location.reload(); }, 400); } }}>Réinitialiser la progression</button>
      </Section>

      <Section icon="phone" title="Installer sur l'iPhone ou l'iPad">
        <ol className="small" style={{ paddingLeft: 18, lineHeight: 1.7, margin: 0 }}>
          <li>Ouvre ce site dans <b>Safari</b>.</li>
          <li>Touche le bouton <b>Partager</b> (carré avec une flèche).</li>
          <li>Choisis <b>« Sur l'écran d'accueil »</b>, puis <b>Ajouter</b>.</li>
          <li>Lance FORMA-8 depuis son icône : plein écran, et utilisable hors ligne.</li>
        </ol>
      </Section>

      <Section icon="info" title="À propos">
        <p className="small muted" style={{ margin: 0 }}>
          FORMA-8 · Réveille l'équipe, suite de FORMA-7 : un parcours pour apprendre à créer des applications avec l'IA, de débutant à expert. Application personnelle et indépendante, non affiliée à Anthropic, GitHub ou Humains Augmentés.
          Le contenu est original et s'appuie sur la documentation officielle, citée dans chaque leçon ; les informations sur les produits (prix, fonctions) ont été vérifiées en novembre 2026 et peuvent avoir changé.
          Claude, Claude Code et GitHub sont des marques de leurs propriétaires respectifs.
        </p>
        <button className="btn subtle block small" style={{ marginTop: 12 }} onClick={() => { sfx("open"); go("icones"); }}>
          <Icon name="neural-chip" size={18} /> Bibliothèque d'icônes de l'appli
        </button>
      </Section>
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: IconId; children: React.ReactNode }) {
  return <section className="panel" style={{ marginTop: 14 }}><div className="panel-title"><Icon name={icon} size={16} /> {title}</div>{children}</section>;
}

function Toggle({ label, on, onChange }: { label: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button className="row" style={{ width: "100%", padding: "6px 0" }} onClick={() => onChange(!on)} role="switch" aria-checked={on}>
      <span className="grow" style={{ textAlign: "left" }}>{label}</span>
      <span style={{ width: 50, height: 30, borderRadius: 15, padding: 3, background: on ? "var(--cyan)" : "#253250", transition: "background .2s" }}>
        <span style={{ display: "block", width: 24, height: 24, borderRadius: "50%", background: "#fff", transform: `translateX(${on ? 20 : 0}px)`, transition: "transform .2s" }} />
      </span>
    </button>
  );
}
