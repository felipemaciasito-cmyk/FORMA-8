// Enregistrer un fichier depuis la PWA : feuille de partage iOS en priorité
// (« Enregistrer dans Fichiers »), sinon téléchargement, sinon copie.
export async function saveFile(filename: string, content: string, mime = "text/markdown"): Promise<"shared" | "downloaded" | "copied" | "cancelled"> {
  const file = new File([content], filename, { type: mime });
  const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
  if (nav.canShare?.({ files: [file] })) {
    try { await nav.share({ files: [file], title: filename }); return "shared"; }
    catch (e) { if ((e as DOMException).name === "AbortError") return "cancelled"; }
  }
  try {
    const url = URL.createObjectURL(file);
    const a = document.createElement("a");
    a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    return "downloaded";
  } catch {
    await navigator.clipboard.writeText(content);
    return "copied";
  }
}

export async function copyText(text: string) {
  try { await navigator.clipboard.writeText(text); return true; } catch { return false; }
}
