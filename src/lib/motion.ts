import { useSettings } from "./store";

/** Vrai si l'utilisateur veut des animations réduites (réglage de l'appli ou du système). */
export function useReduceMotion() {
  const s = useSettings();
  return s.reduceMotion === "on" || (s.reduceMotion === "auto" && typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);
}
