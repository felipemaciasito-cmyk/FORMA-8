import { notion } from "../content";
import type { Room } from "../content/types";
import { stripEmoji } from "./emoji-rules";
import { plain } from "./richtext";
import { saveFile } from "./share";
import { fx } from "./game";
import type { Progress } from "./store";

// Fiches de révision exportables (Markdown), une par caisson.

export function roomFicheMarkdown(r: Room, p: Progress) {
  const lines: string[] = [];
  lines.push(`# FORMA-8 · ${r.code} — ${r.member}`, "", `*${r.name} · ${r.version}* · ${r.tagline}`, "");
  const ids = r.steps.flatMap((s) => s.introduces);
  if (ids.length) {
    lines.push("## Notions", "");
    for (const id of ids) {
      const n = notion(id); if (!n) continue;
      const box = p.notions[id]?.box;
      lines.push(`### ${n.term}${box ? ` (boîte ${box}/5)` : ""}`, "", plain(n.def.standard), "", `- **En simple :** ${plain(n.def.simple)}`, `- **Analogie :** ${plain(n.analogy)}`, `- **Exemple :** ${plain(n.example).replace(/\n/g, " ")}`);
      if (n.checked) lines.push(`- *Info vérifiée en ${n.checked} : à revérifier.*`);
      lines.push("");
    }
  }
  const recaps = r.steps.flatMap((s) => s.blocks.filter((b) => b.type === "recap").flatMap((b) => (b.type === "recap" ? b.points : [])));
  if (recaps.length) lines.push("## À retenir", "", ...recaps.map((x) => `- ${plain(x)}`), "");
  if (r.project) lines.push(`## Livraison ${r.version} : ${r.project.title}`, "", r.project.goal, "", ...r.project.steps.map((s, i) => `${i + 1}. ${s}`), "", `**Réussi si :** ${r.project.success.join(" ")}`, "");
  lines.push("---", `Fiche générée le ${new Date().toLocaleDateString("fr-FR")} par FORMA-8.`);
  return lines.join("\n");
}

async function save(name: string, md: string) {
  const r = await saveFile(name, md);
  if (r === "copied") fx({ type: "toast", icon: "clipboard", text: "Fiche copiée dans le presse-papiers", tone: "cyan" });
  if (r === "downloaded") fx({ type: "toast", icon: "download", text: "Fiche téléchargée", tone: "cyan" });
}

export const exportRoomFiche = (r: Room, p: Progress) => save(`FORMA-8-${r.code.replace(/\s+/g, "-")}.md`, stripEmoji(roomFicheMarkdown(r, p)));
