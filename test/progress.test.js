import assert from "node:assert/strict";
import test from "node:test";
import { listLatestOutcomes } from "../src/core/progress.js";
import { loadCoreCatalog, getRelationById } from "../src/core/content.js";
import { MASTERY } from "../src/core/mastery.js";
import { startSession, submitAnswer } from "../src/core/session.js";
import { emptyLearner } from "../src/core/store.js";

const catalog = loadCoreCatalog();
const att = (correct, day, extra = {}) => ({ correct, day, slow: false, inputMode: "onscreen_keypad", elapsedMs: 900, ...extra });

test("progress: latest correct → right, latest wrong → wrong, unpracticed omitted", () => {
  const relations = {
    "square-17": { status: MASTERY.SHAKY, attempts: [att(true, "2026-09-20"), att(false, "2026-09-29")] },
    "product-12-7": { status: MASTERY.LEARNING, attempts: [att(false, "2026-09-28"), att(true, "2026-09-29", { slow: true, elapsedMs: 9000 })] },
    "square-10": { status: MASTERY.STABLE, attempts: [att(true, "2026-09-01")] },
    "square-6": { status: MASTERY.UNPRACTICED, attempts: [] },
  };
  const before = JSON.stringify(relations);
  const rows = listLatestOutcomes(catalog, relations);
  const byId = Object.fromEntries(rows.map((r) => [r.id, r]));
  assert.equal(byId["square-17"].latestCorrect, false, "latest wrong even though an earlier one was right");
  assert.equal(byId["product-12-7"].latestCorrect, true, "latest right even though it is still a current mistake");
  assert.equal(byId["square-10"].latestCorrect, true);
  assert.equal("square-6" in byId, false);
  assert.equal("square-15" in byId, false);
  assert.equal(rows.length, 3);
  // most recent first
  assert.equal(rows[rows.length - 1].id, "square-10");
  // row carries no mastery label, time, slow flag, counts or due date
  for (const row of rows) {
    assert.deepEqual(Object.keys(row).sort(), ["day", "domain", "id", "latestCorrect", "prompt"]);
  }
  assert.equal(JSON.stringify(relations), before, "mastery / attempts untouched");
});

test("progress follows real submissions and never changes mastery", () => {
  let state = emptyLearner();
  const item = getRelationById("square-15", catalog);
  const run = (raw, day) => {
    const session = startSession({ mode: "focused", domain: "squares", day, size: 1, catalog, relations: state.relations, seed: 1 });
    state = submitAnswer({ item, state, session, raw, meta: { day, inputMode: "onscreen_keypad", elapsedMs: 800 } }).state;
  };
  run("1", "2026-09-29");
  assert.equal(listLatestOutcomes(catalog, state.relations)[0].latestCorrect, false);
  run("225", "2026-09-30");
  const status = state.relations["square-15"].status;
  const snapshot = JSON.stringify(state);
  const rows = listLatestOutcomes(catalog, state.relations);
  assert.equal(rows[0].latestCorrect, true);
  assert.equal(JSON.stringify(state), snapshot);
  assert.equal(state.relations["square-15"].status, status);
});
