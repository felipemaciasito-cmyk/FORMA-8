// Garde-fous du projet : ce que FORMA-8 ne doit jamais faire.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const files = (dir) => readdirSync(dir).flatMap((f) => {
  const p = join(dir, f);
  return statSync(p).isDirectory() ? files(p) : [p];
});
const src = files(join(root, "src")).filter((p) => /\.(ts|tsx|js)$/.test(p));

test("aucune clé de stockage « forma7: » en dehors de la lecture seule du clin d'oeil", () => {
  for (const p of src) {
    const t = readFileSync(p, "utf8");
    // Seules comptent les clés écrites dans le code (entre guillemets), pas les commentaires.
    if (!/["'`]forma7:/.test(t)) continue;
    assert.ok(p.endsWith(join("lib", "forma7.ts")), `${p} utilise une clé « forma7: »`);
    // Dans forma7.ts : uniquement des lectures (get), jamais set/del/update sur une clé forma7.
    assert.doesNotMatch(t, /\b(set|del|update|setMany|delMany|clear)\(\s*["'`]forma7:/, "écriture interdite sous forma7:");
  }
});

test("le fichier de progression de FORMA-7 n'est jamais écrit", () => {
  for (const p of src) {
    const t = readFileSync(p, "utf8");
    if (!t.includes("progress/progress.json")) continue;
    assert.ok(p.endsWith(join("lib", "forma7.ts")) || p.endsWith(join("lib", "sync.ts")), `${p} mentionne progress/progress.json`);
  }
  const sync = readFileSync(join(root, "src", "lib", "sync.ts"), "utf8");
  assert.match(sync, /const PATH = "progress\/forma-8\.json";/);
  const f7 = readFileSync(join(root, "src", "lib", "forma7.ts"), "utf8");
  assert.doesNotMatch(f7, /method:\s*"(PUT|POST|PATCH|DELETE)"/, "le clin d'oeil FORMA-7 doit rester en lecture seule");
});

test("les clés de stockage de FORMA-8 commencent par « forma8: »", () => {
  const store = readFileSync(join(root, "src", "lib", "store.ts"), "utf8");
  assert.match(store, /const KEY_P = "forma8:progress";/);
  assert.match(store, /const KEY_S = "forma8:settings";/);
});

test("le validateur « zéro zone de flou » accepte le contenu", () => {
  execFileSync(process.execPath, [join(root, "scripts", "validate-content.mjs")], { stdio: "pipe" });
});

test("le contrôle « zéro emoji » accepte le code", () => {
  execFileSync(process.execPath, [join(root, "scripts", "check-no-emoji.mjs")], { stdio: "pipe" });
});

test("chaque substitution de parité visuelle est documentée", () => {
  const cfg = JSON.parse(readFileSync(join(root, "scripts", "design-parity.json"), "utf8"));
  for (const [file, subs] of Object.entries(cfg.substitutions)) {
    assert.ok(cfg.exact.includes(file), `${file} a des substitutions mais n'est pas contrôlé`);
    for (const s of subs) assert.ok(s.from && s.to && s.raison, `${file} : substitution incomplète`);
  }
});
