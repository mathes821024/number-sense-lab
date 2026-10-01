/**
 * src/core copies state with cloneJson, not structuredClone (a browser / Node
 * host API the Mini Program engine lacks). These tests remove
 * globalThis.structuredClone and run core's store and a recorded answer.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { cloneJson } from "../src/core/json-clone.js";
import { emptyLearner, emptyState, createMemoryStore, getActiveLearner, withActiveLearner } from "../src/core/store.js";
import { loadCoreCatalog } from "../src/core/content.js";
import { startSession, submitAnswer, peekCurrent } from "../src/core/session.js";

const DAY = "2026-09-29";

function withoutStructuredClone(fn) {
  const saved = Object.getOwnPropertyDescriptor(globalThis, "structuredClone");
  delete globalThis.structuredClone;
  try {
    assert.equal(typeof globalThis.structuredClone, "undefined");
    return fn();
  } finally {
    if (saved) Object.defineProperty(globalThis, "structuredClone", saved);
  }
}

test("cloneJson: deep, detached copy; null / undefined pass through", () => {
  const v = { a: [1, { b: "x" }], c: null, d: true };
  const c = cloneJson(v);
  assert.deepEqual(c, v);
  assert.notEqual(c, v);
  assert.notEqual(c.a[1], v.a[1]);
  assert.equal(cloneJson(null), null);
  assert.equal(cloneJson(undefined), undefined);
  assert.equal(cloneJson(3), 3);
  assert.equal(cloneJson("s"), "s");
});

test("createMemoryStore works and never shares objects when structuredClone is undefined", () => {
  withoutStructuredClone(() => {
    assert.equal(createMemoryStore().read(), null);
    const initial = emptyState({ learnerId: "L1", createdOn: DAY });
    const store = createMemoryStore(initial);
    const r1 = store.read();
    assert.deepEqual(r1, initial);
    assert.notEqual(r1, initial, "initial is copied in");
    r1.learners = {};
    assert.deepEqual(store.read(), initial, "a read is a copy");
    const next = withActiveLearner(initial, { ...getActiveLearner(initial), prefs: { sound: true } });
    store.write(next);
    next.learners.L1.prefs.sound = false;
    assert.equal(getActiveLearner(store.read()).prefs.sound, true, "a write is a copy");
    store.write(null);
    assert.equal(store.read(), null);
  });
});

test("core records an answer through createMemoryStore without structuredClone", () => {
  withoutStructuredClone(() => {
    const catalog = loadCoreCatalog();
    const store = createMemoryStore();
    const learner = emptyLearner();
    store.write(learner);
    const started = startSession({ mode: "daily", day: DAY, relations: {}, catalog, seed: "clone" });
    const { item, session } = peekCurrent(started, catalog);
    const result = submitAnswer({ item, state: store.read(), session, raw: item.canonical_answer, meta: { day: DAY, inputMode: "onscreen_keypad", elapsedMs: 900 }, catalog });
    assert.equal(result.judged.kind, "correct");
    store.write(result.state);
    assert.equal(store.read().relations[item.id].attempts.at(-1).correct, true);
  });
});
