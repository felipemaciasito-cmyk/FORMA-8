import { useSyncExternalStore } from "react";

// La batterie d'un protocole.
// Pendant un protocole, chaque bonne réponse charge une cellule de la batterie (un éclair part du doigt) ; la
// dernière cellule se charge quand on termine le protocole. Les kW gagnés attendent dans la batterie et n'arrivent
// dans le compteur du haut qu'au moment où le joueur branche la batterie sur la capsule du membre.
// C'est une affaire de présentation : la progression, elle, enregistre chaque kW tout de suite (rien n'est perdu
// si l'on quitte en route).
//  - held   : kW gagnés et pas encore montrés dans le compteur (le compteur affiche énergie - held) ;
//  - landed : kW déjà arrivés dans la batterie ;
//  - max    : kW qu'on peut gagner dans ce protocole (0 : pas de batterie) ;
//  - cells  : nombre de cellules (une par vérification, plus une pour la fin du protocole) ;
//  - lit    : cellules allumées (les vérifications déjà réussies comptent, même lors d'une reprise).

export interface EnergyBar { held: number; landed: number; max: number; cells: number; lit: number }

const EMPTY: EnergyBar = { held: 0, landed: 0, max: 0, cells: 0, lit: 0 };
let state: EnergyBar = EMPTY;
const subs = new Set<() => void>();
const set = (s: EnergyBar) => { state = s; subs.forEach((f) => f()); };

export const getEnergyBar = () => state;
export function startEnergyBar(max: number, cells = 0, lit = 0) { set({ held: 0, landed: 0, max, cells, lit: Math.min(lit, Math.max(0, cells - 1)) }); }
/** Des kW gagnés partent vers la batterie (le compteur du haut ne bouge pas encore). */
export function holdEnergy(n: number) { set({ ...state, held: state.held + n }); }
/** Les kW en vol arrivent dans la batterie : une cellule de vérification s'allume (jamais la dernière). */
export function landEnergy(n: number, charge = true) {
  set({ ...state, landed: Math.min(state.held, state.landed + n), lit: charge ? Math.min(Math.max(0, state.cells - 1), state.lit + 1) : state.lit });
}
/** Fin du protocole : le grand éclair charge la dernière cellule. La batterie est pleine. */
export function fillBattery() { set({ ...state, landed: state.held, lit: state.cells }); }
/** Branchement sur la capsule : la batterie se vide dans le compteur, qui affiche alors tout. Renvoie les kW versés. */
export function releaseEnergy() { const n = state.held; set({ ...state, held: 0, landed: 0 }); return n; }
/** On quitte le protocole : plus de batterie, et le compteur reprend sa vraie valeur. */
export function stopEnergyBar() { set(EMPTY); }

export function useEnergyBar() {
  return useSyncExternalStore((f) => { subs.add(f); return () => { subs.delete(f); }; }, () => state, () => state);
}
