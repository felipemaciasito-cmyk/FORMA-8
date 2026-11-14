// Tests de la fusion sans perte entre appareils (src/lib/merge.ts).
import { test } from "node:test";
import assert from "node:assert/strict";
import { canonical, mergeProgress } from "../../src/lib/merge.ts";

const base = () => ({
  version: 1, epoch: "0", name: "", bootedOnce: true, energy: 0,
  counters: {}, steps: {}, lessons: {}, exercises: {}, incidents: {}, notions: {},
  days: [], badges: {}, feynman: {}, skills: [], deletedSkills: {},
  stats: { answers: 0, correct: 0, reviews: 0 }, orientationSeen: [], checks: {}, checksAt: {},
});

test("additionne l'énergie gagnée sur deux appareils sans rien perdre", () => {
  const iphone = { ...base(), counters: { iphone: { energy: 120, answers: 4, correct: 3, reviews: 0 } } };
  const ipad = { ...base(), counters: { ipad: { energy: 80, answers: 2, correct: 2, reviews: 1 } } };
  const m = mergeProgress(iphone, ipad);
  assert.equal(m.energy, 200);
  assert.equal(m.stats.answers, 6);
  assert.equal(m.stats.reviews, 1);
});

test("réunit les protocoles terminés et garde la date la plus ancienne", () => {
  const a = { ...base(), steps: { "c00/p1": "2026-11-15" } };
  const b = { ...base(), steps: { "c00/p1": "2026-11-14", "c00/p2": "2026-11-16" } };
  const m = mergeProgress(a, b);
  assert.deepEqual(m.steps, { "c00/p1": "2026-11-14", "c00/p2": "2026-11-16" });
});

test("garde la position la plus avancée dans un protocole en cours", () => {
  const m = mergeProgress({ ...base(), lessons: { "c01/p1": 3 } }, { ...base(), lessons: { "c01/p1": 7 } });
  assert.equal(m.lessons["c01/p1"], 7);
});

test("une réinitialisation (nouvelle époque) l'emporte partout", () => {
  const old = { ...base(), epoch: "0", counters: { iphone: { energy: 500, answers: 0, correct: 0, reviews: 0 } } };
  const reset = { ...base(), epoch: "2026-11-14T10:00:00.000Z" };
  const m = mergeProgress(old, reset);
  assert.equal(m.energy, 0);
  assert.equal(m.epoch, reset.epoch);
});

test("la fusion est symétrique (même résultat dans les deux sens)", () => {
  const a = { ...base(), name: "Alex", nameAt: "2026-11-14T08:00:00Z", badges: { boot: "2026-11-14" }, days: ["2026-11-14"] };
  const b = { ...base(), name: "", badges: { room1: "2026-11-15" }, days: ["2026-11-15"] };
  assert.equal(canonical(mergeProgress(a, b)), canonical(mergeProgress(b, a)));
});
