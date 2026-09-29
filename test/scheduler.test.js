import assert from "node:assert/strict";
import test from "node:test";
import { MASTERY, emptyRelation } from "../src/core/mastery.js";
import { migrateState, scheduleAfterAttempt } from "../src/core/scheduler.js";
import { buildSessionQueue } from "../src/core/schedule.js";
import { loadCoreCatalog, filterByDomain } from "../src/core/content.js";
import { startSession, submitAnswer } from "../src/core/session.js";
import { createBrowserStore } from "../src/adapter/browser-store.js";
import { emptyState } from "../src/core/store.js";

const catalog = loadCoreCatalog();

function memoryStorage(initial) {
  const map = new Map(initial || []);
  return {
    getItem: (key) => (map.has(key) ? map.get(key) : null),
    setItem: (key, value) => map.set(key, String(value)),
    removeItem: (key) => map.delete(key),
    raw: (key) => map.get(key),
  };
}

function answer(relation, correct, day, { slow = false } = {}) {
  return scheduleAfterAttempt(
    relation,
    {
      status: relation.status,
      attempts: (relation.attempts || []).concat({
        correct,
        day,
        slow,
        inputMode: "onscreen_keypad",
        elapsedMs: slow ? 9000 : 800,
      }),
    },
    day,
  );
}

function withStatus(relation, status, schedule) {
  return { ...relation, status, schedule };
}

test("v1 local state migrates without dropping history or mastery", () => {
  const activeSession = { id: "s-1", queue: ["square-15"], answered: 2, cursor: 2 };
  const v1 = {
    version: 1,
    prefs: { sound: false },
    sessions: [{ id: "old", day: "2026-09-01", correct: 1, total: 2 }],
    activeSession,
    lastResult: { day: "2026-09-01", completed: false },
    relations: {
      "square-15": {
        status: MASTERY.STABLE,
        attempts: [
          { correct: true, day: "2026-09-01", slow: false },
          { correct: true, day: "2026-09-02", slow: false },
          { correct: true, day: "2026-09-03", slow: false },
        ],
      },
      "fraction-1-8": {
        status: MASTERY.SHAKY,
        attempts: [{ correct: false, day: "2026-09-20", slow: false }],
      },
      "square-6": { status: MASTERY.UNPRACTICED, attempts: [] },
    },
  };
  const next = migrateState(v1);
  assert.equal(next.version, 2);
  assert.equal(next.relations["square-15"].status, MASTERY.STABLE);
  assert.equal(next.relations["square-15"].attempts.length, 3);
  assert.equal(next.relations["fraction-1-8"].status, MASTERY.SHAKY);
  assert.deepEqual(next.relations["fraction-1-8"].schedule, {
    due_day: "2026-09-20",
    bucket: "1d",
    reason: "stable-wrong",
  });
  assert.equal(next.relations["square-6"].schedule, null);
  assert.equal(next.activeSession, activeSession);
  assert.equal(next.prefs.sound, false);
  assert.equal(next.sessions.length, 1);
  assert.equal(next.lastResult.day, "2026-09-01");
  assert.deepEqual(next.relations["square-15"].schedule, {
    due_day: "2026-09-10",
    bucket: "maintenance",
    reason: "stable-maintenance",
  });
});

test("browser adapter upgrades the same key and keeps a readable v1 blob", () => {
  const storage = memoryStorage();
  const key = "nsl-v01-state";
  storage.setItem(
    key,
    JSON.stringify({
      version: 1,
      relations: {
        "square-10": {
          status: MASTERY.LEARNING,
          attempts: [{ correct: false, day: "2026-09-28", slow: false }],
        },
      },
      sessions: [],
      activeSession: { id: "keep", answered: 1 },
      prefs: { sound: true },
    }),
  );
  const store = createBrowserStore(storage, key);
  const loaded = store.read();
  assert.equal(store.key, key);
  assert.equal(loaded.version, 2);
  assert.equal(loaded.relations["square-10"].status, MASTERY.LEARNING);
  assert.equal(loaded.relations["square-10"].attempts.length, 1);
  assert.equal(loaded.activeSession.id, "keep");
  assert.equal(loaded.relations["square-10"].schedule.reason, "wrong");
  assert.equal(loaded.relations["square-10"].schedule.due_day, "2026-09-29");
  const saved = JSON.parse(storage.raw(key));
  assert.equal(saved.version, 2);
  assert.equal(saved.relations["square-10"].attempts.length, 1);
});

test("unreadable storage is not replaced with an empty record", () => {
  const storage = memoryStorage([["nsl-v01-state", "{not-json"]]);
  const store = createBrowserStore(storage, "nsl-v01-state");
  const loaded = store.read();
  assert.equal(loaded.version, emptyState().version);
  assert.equal(storage.raw("nsl-v01-state"), "{not-json");
});

test("first correct is due tomorrow at 1d", () => {
  let rel = emptyRelation();
  const schedule = answer(rel, true, "2026-10-01");
  rel = withStatus(rel, MASTERY.LEARNING, schedule);
  rel.attempts = [{ correct: true, day: "2026-10-01", slow: false }];
  assert.deepEqual(schedule, {
    due_day: "2026-10-02",
    bucket: "1d",
    reason: "first-correct",
  });
  const again = answer(rel, true, "2026-10-01");
  assert.equal(again.due_day, "2026-10-02");
  assert.equal(again.bucket, "1d");
  assert.equal(again.reason, "same-day-correct");
});

test("same-day correction after a wrong stays at 1d", () => {
  let rel = {
    status: MASTERY.LEARNING,
    attempts: [{ correct: false, day: "2026-10-01", slow: false }],
    schedule: { due_day: "2026-10-02", bucket: "1d", reason: "wrong" },
  };
  const schedule = answer(rel, true, "2026-10-01");
  assert.deepEqual(schedule, {
    due_day: "2026-10-02",
    bucket: "1d",
    reason: "correct-after-wrong",
  });
});

test("a new day steps the ladder, and the third day becomes stable at 5d", () => {
  const item = catalog.find((entry) => entry.id === "square-15");
  let state = emptyState();
  let schedule;
  for (const day of ["2026-10-01", "2026-10-02", "2026-10-04"]) {
    const result = submitAnswer({
      item,
      state,
      session: startSession({
        mode: "focused",
        domain: "squares",
        day,
        size: 1,
        catalog,
        relations: state.relations,
      }),
      raw: "225",
      meta: { day, inputMode: "onscreen_keypad", elapsedMs: 800 },
    });
    state = result.state;
    schedule = state.relations["square-15"].schedule;
  }
  assert.equal(state.relations["square-15"].status, MASTERY.STABLE);
  assert.deepEqual(schedule, {
    due_day: "2026-10-09",
    bucket: "5-7d",
    reason: "became-stable",
  });
  const maintained = submitAnswer({
    item,
    state,
    session: startSession({
      mode: "focused",
      domain: "squares",
      day: "2026-10-09",
      size: 1,
      catalog,
      relations: state.relations,
    }),
    raw: "225",
    meta: { day: "2026-10-09", inputMode: "onscreen_keypad", elapsedMs: 800 },
  });
  assert.equal(maintained.state.relations["square-15"].status, MASTERY.STABLE);
  assert.deepEqual(maintained.state.relations["square-15"].schedule, {
    due_day: "2026-10-16",
    bucket: "maintenance",
    reason: "stable-maintenance",
  });
});

test("cross-day correct before stable moves from 1d to 2-3d", () => {
  const rel = {
    status: MASTERY.LEARNING,
    attempts: [{ correct: true, day: "2026-10-01", slow: false }],
    schedule: { due_day: "2026-10-02", bucket: "1d", reason: "first-correct" },
  };
  const schedule = answer(rel, true, "2026-10-02");
  assert.deepEqual(schedule, {
    due_day: "2026-10-04",
    bucket: "2-3d",
    reason: "correct-new-day",
  });
});

test("stable wrong is due today and does not become shaky from absence", () => {
  const rel = {
    status: MASTERY.STABLE,
    attempts: [{ correct: true, day: "2026-09-01", slow: false }],
    schedule: { due_day: "2026-09-08", bucket: "maintenance", reason: "stable-maintenance" },
  };
  const overdue = buildSessionQueue(
    catalog.filter((item) => item.id === "square-15"),
    { "square-15": rel },
    { size: 1, day: "2026-09-22", interleave: false },
  );
  assert.deepEqual(overdue, ["square-15"]);
  assert.equal(rel.status, MASTERY.STABLE);
  const schedule = answer(rel, false, "2026-09-22");
  assert.deepEqual(schedule, {
    due_day: "2026-09-22",
    bucket: "1d",
    reason: "stable-wrong",
  });
});

test("same-day correct after stable wrong does not restore stable", () => {
  const rel = {
    status: MASTERY.SHAKY,
    attempts: [{ correct: false, day: "2026-09-22", slow: false }],
    schedule: { due_day: "2026-09-22", bucket: "1d", reason: "stable-wrong" },
  };
  const schedule = answer(rel, true, "2026-09-22");
  assert.deepEqual(schedule, {
    due_day: "2026-09-23",
    bucket: "1d",
    reason: "correct-after-wrong",
  });
});

test("slow correct does not lengthen a future due date", () => {
  const rel = {
    status: MASTERY.STABLE,
    attempts: [{ correct: true, day: "2026-10-01", slow: false }],
    schedule: { due_day: "2026-10-08", bucket: "maintenance", reason: "stable-maintenance" },
  };
  const schedule = answer(rel, true, "2026-10-03", { slow: true });
  assert.equal(schedule.due_day, "2026-10-08");
  assert.equal(schedule.bucket, "maintenance");
  assert.equal(schedule.reason, "slow-correct");
});

test("daily practice still mixes three domains", () => {
  const session = startSession({
    mode: "daily",
    day: "2026-10-01",
    size: 9,
    catalog,
    relations: {},
  });
  const domains = new Set(session.queue.map((id) => catalog.find((item) => item.id === id).domain));
  assert.equal(domains.size, 3);
});

test("stable due yields while unpracticed relations can fill the session", () => {
  const relations = {
    "square-15": {
      status: MASTERY.STABLE,
      attempts: [{ correct: true, day: "2026-09-01", slow: false }],
      schedule: { due_day: "2026-09-08", bucket: "maintenance", reason: "stable-maintenance" },
    },
  };
  const queue = buildSessionQueue(catalog, relations, {
    size: 6,
    day: "2026-10-01",
    interleave: true,
  });
  assert.equal(queue.includes("square-15"), false);
});

test("a not-yet-due relation stays out, and focused practice stays in one domain", () => {
  const relations = {
    "square-15": {
      status: MASTERY.LEARNING,
      attempts: [{ correct: true, day: "2026-10-01", slow: false }],
      schedule: { due_day: "2026-10-04", bucket: "2-3d", reason: "correct-new-day" },
    },
  };
  const focused = startSession({
    mode: "focused",
    domain: "squares",
    day: "2026-10-02",
    size: 5,
    catalog,
    relations,
  });
  assert.equal(focused.queue.includes("square-15"), false);
  assert.ok(focused.queue.every((id) => filterByDomain("squares", catalog).some((item) => item.id === id)));
});
