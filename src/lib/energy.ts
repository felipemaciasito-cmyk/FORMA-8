import { useSyncExternalStore } from "react";

// La barre d'énergie d'un protocole.
// Pendant un protocole, les kW gagnés s'accumulent dans une barre, en bas de l'écran, et n'arrivent
// dans le compteur du haut qu'à la fin, d'un seul jaillissement. C'est une affaire de présentation :
// la progression, elle, enregistre chaque kW tout de suite (rien n'est perdu si l'on quitte en route).
//  - held   : kW gagnés et pas encore montrés dans le compteur (le compteur affiche énergie - held) ;
//  - landed : kW déjà arrivés dans la barre (ce que la barre affiche) ;
//  - max    : kW qu'on peut gagner dans ce protocole (0 : pas de barre).

export interface EnergyBar { held: number; landed: number; max: number }

let state: EnergyBar = { held: 0, landed: 0, max: 0 };
const subs = new Set<() => void>();
const set = (s: EnergyBar) => { state = s; subs.forEach((f) => f()); };

export const getEnergyBar = () => state;
export function startEnergyBar(max: number) { set({ held: 0, landed: 0, max }); }
/** Des kW gagnés partent vers la barre (le compteur du haut ne bouge pas encore). */
export function holdEnergy(n: number) { set({ ...state, held: state.held + n }); }
/** Les kW en vol arrivent dans la barre. */
export function landEnergy(n: number) { set({ ...state, landed: Math.min(state.held, state.landed + n) }); }
/** Fin du protocole : la barre se vide dans le compteur, qui affiche alors tout. */
export function releaseEnergy() { const n = state.held; set({ ...state, held: 0, landed: 0 }); return n; }
/** On quitte le protocole : plus de barre, et le compteur reprend sa vraie valeur. */
export function stopEnergyBar() { set({ held: 0, landed: 0, max: 0 }); }

export function useEnergyBar() {
  return useSyncExternalStore((f) => { subs.add(f); return () => { subs.delete(f); }; }, () => state, () => state);
}
