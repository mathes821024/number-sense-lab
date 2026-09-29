import assert from "node:assert/strict";
import test from "node:test";
import {
  buildSessionQueue,
  planWrongReappear,
  nextItem,
  WRONG_REAPPEAR_GAP,
} from "../src/core/schedule.js";
import { loadCoreCatalog } from "../src/core/content.js";
import { MASTERY } from "../src/core/mastery.js";
import { startSession, submitAnswer, peekCurrent } from "../src/core/session.js";
import { emptyState } from "../src/core/store.js";

const catalog = loadCoreCatalog();

test("tier is not used as review interval: shaky beats lower-tier unpracticed", () => {
  const relations = {
    "square-17": { status: MASTERY.SHAKY, attempts: [{ correct: false, day: "2026-09-28" }] },
  };
  const queue = buildSessionQueue(catalog, relations, {
    size: 5,
    day: "2026-09-29",
    interleave: false,
  });
  assert.equal(queue[0], "square-17");
});

test("wrong item reappears later, not immediately", () => {
  let session = startSession({
    mode: "focused",
    domain: "squares",
    day: "2026-09-29",
    size: 8,
    catalog,
    relations: {},
  });
  const firstId = session.queue[0];
  const item = catalog.find((r) => r.id === firstId);
  let state = emptyState();

  const wrong = submitAnswer({
    item,
    state,
    session,
    raw: "0",
    meta: {
      day: "2026-09-29",
      inputMode: "onscreen_keypad",
      elapsedMs: 1000,
    },
  });
  session = wrong.session;
  assert.ok(session.reappearPlan[firstId] >= session.answered + WRONG_REAPPEAR_GAP);

  const peeked = peekCurrent(session, catalog);
  assert.notEqual(peeked.item.id, firstId);
});

test("stable items yield to unstable when drawing a daily session", () => {
  const relations = Object.fromEntries(
    catalog.map((item) => [
      item.id,
      {
        status: item.id === "square-15" ? MASTERY.LEARNING : MASTERY.STABLE,
        attempts: [],
      },
    ]),
  );
  const queue = buildSessionQueue(catalog, relations, {
    size: 3,
    day: "2026-09-29",
  });
  assert.ok(queue.includes("square-15"));
});
