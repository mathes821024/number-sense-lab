import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  migrateV1toV2,
  migrateV2toV3,
  upgradeState,
  MigrationError,
} from "../src/core/migrate.js";
import { createBrowserStore, createLearnerId } from "../src/adapter/browser-store.js";
import {
  emptyState,
  getActiveLearner,
  withActiveLearner,
  isValidV3,
} from "../src/core/store.js";
import { loadCoreCatalog } from "../src/core/content.js";
import { startSession, submitAnswer, peekCurrent } from "../src/core/session.js";

const here = dirname(fileURLToPath(import.meta.url));
const fixture = (name) => JSON.parse(readFileSync(join(here, "fixtures", name), "utf8"));
const KEY = "nsl-v01-state";

function memoryStorage(initial) {
  const map = new Map(initial || []);
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k),
    raw: (k) => map.get(k),
    keys: () => [...map.keys()],
  };
}

function counter(prefix = "learner") {
  let n = 0;
  const fn = () => `${prefix}-${++n}`;
  fn.calls = () => n;
  return fn;
}

test("v1 → v2 → v3 hops one version at a time and keeps all history", () => {
  const v1 = fixture("state-v1.json");
  const v2 = migrateV1toV2(v1);
  assert.equal(v2.version, 2);
  assert.throws(() => migrateV1toV2(v2), MigrationError);
  const v3 = migrateV2toV3(v2, { learnerId: "L-abc", createdOn: "2026-09-29" });
  assert.throws(() => migrateV2toV3(v1, { learnerId: "x" }), MigrationError);
  assert.equal(v3.version, 3);
  assert.equal(v3.active_learner_id, "L-abc");
  assert.equal("relations" in v3, false, "no parallel top-level relations");
  const learner = v3.learners["L-abc"];
  assert.deepEqual(learner.profile, { learner_id: "L-abc", created_on: "2026-09-29" });
  for (const [id, rel] of Object.entries(v1.relations)) {
    assert.equal(learner.relations[id].status, rel.status, `${id} status kept`);
    assert.deepEqual(learner.relations[id].attempts, rel.attempts, `${id} attempts kept`);
  }
  assert.deepEqual(learner.relations["fraction-1-8"].schedule, {
    due_day: "2026-09-27",
    bucket: "1d",
    reason: "stable-wrong",
  });
  assert.equal(learner.relations["fraction-1-2"].schedule, null);
  assert.deepEqual(learner.activeSession, v1.activeSession, "activeSession not rebuilt");
  assert.deepEqual(learner.activeSession.queue, v1.activeSession.queue);
  assert.deepEqual(learner.sessions, v1.sessions);
  assert.deepEqual(learner.lastResult, v1.lastResult);
  assert.equal(learner.prefs.sound, false);
});

test("upgradeState: v1 fixture becomes v3 with exactly one new learner_id", () => {
  const ids = counter();
  const { state, changed, from } = upgradeState(fixture("state-v1.json"), {
    createLearnerId: ids,
    today: "2026-09-29",
  });
  assert.equal(from, 1);
  assert.equal(changed, true);
  assert.equal(ids.calls(), 1);
  assert.ok(isValidV3(state));
  assert.equal(getActiveLearner(state).relations["square-12"].attempts.length, 4);
});

test("v2 → v3 keeps legal schedules as-is (no re-projection) and lastResult", () => {
  const v2 = fixture("state-v2.json");
  const { state, from } = upgradeState(v2, { createLearnerId: () => "L-2", today: "2026-09-29" });
  assert.equal(from, 2);
  const learner = getActiveLearner(state);
  for (const [id, rel] of Object.entries(v2.relations)) {
    assert.deepEqual(learner.relations[id], rel, `${id} unchanged`);
  }
  assert.deepEqual(learner.sessions, v2.sessions);
  assert.deepEqual(learner.lastResult, v2.lastResult);
  assert.equal(learner.activeSession, null);
});

test("a legal v3 never regenerates learner_id and round-trips stably", () => {
  const ids = counter();
  const original = upgradeState(fixture("state-v2.json"), { createLearnerId: () => "keep-me", today: "2026-09-29" }).state;
  const again = upgradeState(JSON.parse(JSON.stringify(original)), { createLearnerId: ids, today: "2026-10-05" });
  assert.equal(ids.calls(), 0, "no new id for a v3 record");
  assert.equal(again.changed, false);
  assert.deepEqual(again.state, original);
  assert.equal(again.state.learners["keep-me"].profile.created_on, "2026-09-29");
});

test("a v3 relation missing schedule is repaired without changing the learner", () => {
  const state = emptyState({ learnerId: "same", createdOn: "2026-09-01" });
  state.learners.same.relations["square-7"] = {
    status: "learning",
    attempts: [{ correct: false, day: "2026-09-28", slow: false }],
  };
  const ids = counter();
  const out = upgradeState(state, { createLearnerId: ids, today: "2026-09-29" });
  assert.equal(ids.calls(), 0);
  assert.equal(out.state.active_learner_id, "same");
  assert.equal(out.state.learners.same.relations["square-7"].schedule.reason, "wrong");
  assert.equal(out.state.learners.same.relations["square-7"].attempts.length, 1);
});

test("unknown version and unusable v3 throw instead of guessing", () => {
  assert.throws(() => upgradeState({ version: 4 }, { createLearnerId: () => "x" }), MigrationError);
  assert.throws(() => upgradeState({ relations: {} }, { createLearnerId: () => "x" }), MigrationError);
  assert.throws(
    () => upgradeState({ version: 3, active_learner_id: "a", learners: {} }, { createLearnerId: () => "x" }),
    MigrationError,
  );
});

test("adapter: v1 in storage → v3 written back under the same key, id stable across reloads", () => {
  const raw = JSON.stringify(fixture("state-v1.json"));
  const storage = memoryStorage([[KEY, raw]]);
  const ids = counter("uuid");
  const store = createBrowserStore(storage, KEY, { createId: ids, today: () => "2026-09-29" });
  const first = store.read();
  assert.equal(first.version, 3);
  assert.equal(first.active_learner_id, "uuid-1");
  const saved = JSON.parse(storage.raw(KEY));
  assert.equal(saved.version, 3);
  assert.equal(saved.learners["uuid-1"].relations["fraction-1-8"].attempts.length, 4);
  const second = createBrowserStore(storage, KEY, { createId: ids, today: () => "2026-09-30" }).read();
  assert.equal(second.active_learner_id, "uuid-1");
  assert.equal(ids.calls(), 1, "learner_id created exactly once");
  assert.deepEqual(storage.keys(), [KEY], "no second key");
});

test("adapter: v2 in storage → v3, then write/read keeps the learner and history", () => {
  const storage = memoryStorage([[KEY, JSON.stringify(fixture("state-v2.json"))]]);
  const store = createBrowserStore(storage, KEY, { createId: counter("u"), today: () => "2026-09-29" });
  const root = store.read();
  const learner = getActiveLearner(root);
  learner.prefs.sound = false;
  store.write(withActiveLearner(root, learner));
  const back = createBrowserStore(storage, KEY, { createId: () => "never" }).read();
  assert.equal(back.active_learner_id, "u-1");
  assert.equal(getActiveLearner(back).prefs.sound, false);
  assert.equal(getActiveLearner(back).relations["product-13-7"].attempts.length, 3);
});

test("adapter: bad JSON is not overwritten by read, nor by a later save", () => {
  const storage = memoryStorage([[KEY, "{not-json"]]);
  const store = createBrowserStore(storage, KEY, { createId: () => "tmp" });
  const loaded = store.read();
  assert.equal(loaded.version, 3);
  assert.equal(store.lastReadProblem, "unreadable");
  assert.equal(storage.raw(KEY), "{not-json", "read never overwrites");
  assert.equal(store.write(loaded), false, "write refused");
  assert.equal(storage.raw(KEY), "{not-json", "save never overwrites either");
  assert.deepEqual(storage.keys(), [KEY], "no second key");
});

test("adapter: unknown future version is not overwritten", () => {
  const raw = JSON.stringify({ version: 9, learners: {} });
  const storage = memoryStorage([[KEY, raw]]);
  const store = createBrowserStore(storage, KEY, { createId: () => "tmp" });
  store.read();
  assert.equal(store.lastReadProblem, "unknown-version");
  assert.equal(storage.raw(KEY), raw);
});

test("adapter: a brand-new device writes v3 directly with one learner_id", () => {
  const storage = memoryStorage();
  const ids = counter("fresh");
  const root = createBrowserStore(storage, KEY, { createId: ids, today: () => "2026-09-29" }).read();
  assert.equal(root.version, 3);
  assert.equal(JSON.parse(storage.raw(KEY)).version, 3);
  assert.equal(root.learners["fresh-1"].profile.created_on, "2026-09-29");
  createBrowserStore(storage, KEY, { createId: ids }).read();
  assert.equal(ids.calls(), 1);
});

test("createLearnerId prefers randomUUID and falls back to a v4 shape", () => {
  assert.equal(createLearnerId({ randomUUID: () => "from-crypto" }), "from-crypto");
  const v4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
  assert.match(createLearnerId({ getRandomValues: (b) => b.fill(7) }), v4);
  assert.match(createLearnerId(null), v4);
});

test("migrated activeSession resumes on its original queue; new 47 stay unpracticed", () => {
  const catalog = loadCoreCatalog();
  const { state } = upgradeState(fixture("state-v1.json"), { createLearnerId: () => "L", today: "2026-09-29" });
  const learner = getActiveLearner(state);
  const peeked = peekCurrent(learner.activeSession, catalog);
  assert.equal(peeked.item.id, "fraction-1-4", "cursor 2 of the preserved queue");
  const newIds = catalog.slice(75).map((item) => item.id);
  assert.equal(newIds.length, 47);
  for (const id of newIds) assert.equal(learner.relations[id], undefined);
  const result = submitAnswer({
    item: peeked.item,
    state: learner,
    session: peeked.session,
    raw: "0.25",
    meta: { day: "2026-09-29", inputMode: "onscreen_keypad", elapsedMs: 900 },
  });
  assert.equal(result.state.relations["square-15"].attempts.length, 3);
  assert.equal(result.state.relations["fraction-1-4"].attempts.length, 1);
});

test("fresh sessions after migration still build from the migrated relations", () => {
  const { state } = upgradeState(fixture("state-v2.json"), { createLearnerId: () => "L", today: "2026-09-29" });
  const learner = getActiveLearner(state);
  const session = startSession({ mode: "daily", day: "2026-09-29", relations: learner.relations, seed: 1 });
  assert.ok(session.queue.includes("fraction-1-8"), "due shaky relation is drawn");
});
