import assert from "node:assert/strict";
import test from "node:test";
import { loadCoreCatalog, verifyContentCounts } from "../src/core/content.js";
import { emptyState } from "../src/core/store.js";
import {
  startSession,
  submitAnswer,
  peekCurrent,
  finishSession,
} from "../src/core/session.js";
import { buildA4Sheet } from "../src/core/a4.js";
import { createBrowserStore } from "../src/adapter/browser-store.js";
import { MASTERY } from "../src/core/mastery.js";

function memoryStorage() {
  const map = new Map();
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k),
  };
}

test("owner+child continuous flow: practice → wrong reappear → persist → progress → A4", () => {
  verifyContentCounts();
  const catalog = loadCoreCatalog();
  const browser = createBrowserStore(memoryStorage());
  let state = browser.read();

  let session = startSession({
    mode: "daily",
    day: "2026-09-29",
    size: 6,
    catalog,
    relations: state.relations,
  });

  let wrongId = null;
  let sawReappear = false;

  while (session.answered < session.targetCount) {
    const peeked = peekCurrent(session, catalog);
    session = peeked.session;
    const item = peeked.item;
    assert.ok(item, "expected an item before session end");

    if (peeked.revisit && wrongId && item.id === wrongId) {
      sawReappear = true;
    }

    const raw =
      session.answered === 0 ? "999999" : item.canonical_answer;
    if (session.answered === 0) wrongId = item.id;

    const result = submitAnswer({
      item,
      state,
      session,
      raw,
      meta: {
        day: "2026-09-29",
        inputMode: "onscreen_keypad",
        elapsedMs: 1100 + session.answered * 50,
      },
    });
    assert.equal(result.feedback.record, true);
    state = result.state;
    session = result.session;
    browser.write(state);
  }

  assert.equal(sawReappear, true, "wrong item should reappear later in session");

  const finished = finishSession(state, session);
  state = finished.state;
  browser.write(state);

  const reloaded = browser.read();
  assert.equal(reloaded.sessions.length, 1);
  assert.equal(reloaded.sessions[0].completed, true);
  assert.ok(reloaded.sessions[0].total >= 5);
  assert.ok(Object.keys(reloaded.relations).length >= 2);

  const unstable = Object.values(reloaded.relations).some(
    (r) => r.status === MASTERY.LEARNING || r.status === MASTERY.SHAKY,
  );
  assert.equal(unstable, true);

  const sheet = buildA4Sheet(catalog, reloaded.relations, { day: "9月29日" });
  assert.equal(sheet.empty, false);
  assert.ok(sheet.prompts.length >= 1);
  assert.ok(sheet.answerKey.length === sheet.prompts.length);
});
