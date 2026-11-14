// Bus minimal pour ouvrir la fiche d'une notion depuis n'importe quel texte.
type L = (id: string) => void;
const ls = new Set<L>();
export function onTerm(l: L) { ls.add(l); return () => { ls.delete(l); }; }
export function openTerm(id: string) { ls.forEach((l) => l(id)); }
