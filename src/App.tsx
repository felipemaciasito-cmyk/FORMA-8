import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { useEffect, useState } from "react";
import { notion, ROOMS } from "./content";
import { checkBadges, setBadgeCtx } from "./lib/game";
import { roomsDoneCount, totalPower } from "./lib/progress";
import { setLabelResolver } from "./lib/richtext";
import { installAudioUnlock, setAmbienceLevel, syncAmbience, syncSfxVolume } from "./lib/sound";
import { useRoute } from "./lib/router";
import { stopVoice } from "./lib/voice";
import { useProgress, useSettings, useStore } from "./lib/store";
import { useProgressSync } from "./lib/sync";
import { useHeritageLoader } from "./lib/forma7";
import { Boot } from "./components/Boot";
import { FxLayer, Hud, TabBar } from "./components/Chrome";
import { RewardLayer } from "./components/Rewards";
import { MapView } from "./components/MapView";
import { IncidentView, RoomView, StepView } from "./components/RoomView";
import { SettingsView } from "./components/SettingsView";
import { IconLibraryView } from "./components/IconLibrary";
import { TermSheetHost } from "./components/TermSheet";
import { AtelierView, BaseView, MaintenanceView, TeamView } from "./components/Views";

// Le libellé par défaut d'un [[terme]] est le nom de la notion, sans la parenthèse.
setLabelResolver((id) => (notion(id)?.term ?? id).replace(/\s*\(.+\)$/, "").replace(/^./, (c) => c.toLowerCase()));

export function App() {
  const ready = useStore((s) => s.ready);
  const p = useProgress();
  const settings = useSettings();
  const route = useRoute();
  const [booted, setBooted] = useState(false);
  useProgressSync(ready);
  useHeritageLoader(ready);

  useEffect(() => {
    setBadgeCtx({ roomsDone: roomsDoneCount(p), roomsTotal: ROOMS.length });
  }, [p]);
  useEffect(() => { if (ready && booted) checkBadges(); }, [ready, booted]);
  // Son : déblocage au premier toucher (Safari), fond sonore selon les réglages, salle plus animée quand l'équipe se réveille.
  useEffect(() => { installAudioUnlock(); }, []);
  useEffect(() => { if (ready) syncAmbience(); }, [ready, settings.ambience, settings.ambienceVolume]);
  useEffect(() => { if (ready) syncSfxVolume(); }, [ready, settings.sfxVolume]);
  // Voix de l'équipe : un membre se tait quand le joueur change d'écran.
  const routeKey = route.join("/");
  useEffect(() => { stopVoice(); }, [routeKey]);
  const power = totalPower(p);
  useEffect(() => { setAmbienceLevel(0.15 + 0.85 * power / 100); }, [power]);

  const reduce = settings.reduceMotion === "on" || (settings.reduceMotion === "auto" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);
  useEffect(() => { document.documentElement.classList.toggle("reduce-motion", reduce); }, [reduce]);

  if (!ready) return <div className="app-bg" />;

  // Routes : #/caisson/c01, #/caisson/c01/p2 (protocole de réveil), #/panne/c01, #/equipe, #/base, #/maintenance, #/atelier, #/reglages.
  const [a, b, c] = route;
  const tab = a === "base" ? "base" : a === "maintenance" ? "maintenance" : a === "atelier" ? "atelier" : a === "reglages" || a === "icones" ? "reglages" : "";
  let screen: React.ReactNode;
  let key = route.join("/") || "map";
  if (a === "caisson" && b && c) screen = <StepView key={`${b}/${c}`} roomId={b} stepId={c} />;
  else if (a === "caisson" && b) screen = <RoomView id={b} />;
  else if (a === "panne" && b) screen = <IncidentView roomId={b} />;
  else if (a === "base") { screen = <BaseView focus={b} />; key = "base"; }
  else if (a === "maintenance") screen = <MaintenanceView />;
  else if (a === "atelier") screen = <AtelierView />;
  else if (a === "reglages") screen = <SettingsView />;
  else if (a === "icones") screen = <IconLibraryView />;
  else if (a === "equipe") screen = <TeamView />;
  else screen = <MapView />;

  return (
    <MotionConfig reducedMotion={reduce ? "always" : "never"}>
      <div className="app-bg" />
      <div className="scanlines" />
      {!booted && <Boot power={totalPower(p)} onDone={() => setBooted(true)} />}
      {booted && (
        <div className="shell">
          <Hud />
          <AnimatePresence mode="wait" initial={false}>
            <motion.main key={key} className="screen" id="screen"
              initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.25, ease: "easeOut" }}
              onAnimationStart={() => document.getElementById("screen")?.scrollTo({ top: 0 })}>
              {screen}
            </motion.main>
          </AnimatePresence>
          <TabBar active={tab} />
        </div>
      )}
      <TermSheetHost />
      <FxLayer />
      {booted && <RewardLayer />}
    </MotionConfig>
  );
}
