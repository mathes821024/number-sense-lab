import assert from "node:assert/strict";
import test from "node:test";
import {
  startSession,
  submitAnswer,
  peekCurrent,
  finishSession,
} from "../src/core/session.js";
import { loadCoreCatalog, getRelationById } from "../src/core/content.js";
import { emptyLearner, createMemoryStore } from "../src/core/store.js";
import { feedbackFor } from "../src/core/feedback.js";
import { MASTERY } from "../src/core/mastery.js";

const catalog = loadCoreCatalog();

test("full submit path records mastery and session counts", () => {
  let state = emptyLearner();
  let session = startSession({
    mode: "daily",
    day: "2026-09-29",
    size: 4,
    catalog,
    relations: state.relations,
  });
  assert.ok(session.queue.length >= 1);

  const peeked = peekCurrent(session, catalog);
  session = peeked.session;
  const item = peeked.item;

  const result = submitAnswer({
    item,
    state,
    session,
    raw: item.canonical_answer,
    meta: {
      day: "2026-09-29",
      inputMode: "physical_keyboard",
      elapsedMs: 1200,
    },
  });
  assert.equal(result.judged.kind, "correct");
  assert.equal(result.feedback.word, "对");
  assert.equal(result.state.relations[item.id].status, MASTERY.LEARNING);
  assert.equal(result.session.correctCount, 1);

  const finished = finishSession(result.state, result.session);
  assert.equal(finished.summary.correct, 1);
  assert.equal(finished.state.sessions.length, 1);
});

test("empty submit does not change mastery", () => {
  const item = getRelationById("square-15", catalog);
  const state = emptyLearner();
  const session = startSession({
    mode: "focused",
    domain: "squares",
    day: "2026-09-29",
    catalog,
    relations: {},
  });
  const result = submitAnswer({
    item,
    state,
    session,
    raw: "   ",
    meta: { day: "2026-09-29", inputMode: "onscreen_keypad", elapsedMs: 10 },
  });
  assert.equal(result.judged.kind, "empty");
  assert.equal(result.feedback.record, false);
  assert.deepEqual(result.state.relations, {});
});

test("memory store round-trips without browser APIs", () => {
  const store = createMemoryStore();
  const state = emptyLearner();
  state.relations["square-15"] = {
    status: MASTERY.LEARNING,
    attempts: [{ correct: true, day: "2026-09-29", slow: false }],
  };
  store.write(state);
  assert.equal(store.read().relations["square-15"].status, MASTERY.LEARNING);
});

test("wrong feedback defaults to L1 relation + L2 hook; L3 available", () => {
  const item = getRelationById("square-15", catalog);
  const fb = feedbackFor(item, "wrong");
  assert.equal(fb.relation, item.relation);
  assert.equal(fb.hook, item.hook);
  assert.ok(fb.level3.check);
  assert.ok(fb.level3.frames.length >= 1);
  assert.equal(JSON.stringify(fb).includes("你错了"), false);
  assert.equal(JSON.stringify(fb).includes("动摇"), false);
});
