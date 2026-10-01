/**
 * Fix 01: a stored record that could not be read (bad JSON / unknown version /
 * migration failure) must never be overwritten, not even by a later ordinary
 * save. Readable v1 / v2 / v3 records stay writable.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createBrowserStore } from "../src/adapter/browser-store.js";
import { getActiveLearner, withActiveLearner } from "../src/core/store.js";

const here = dirname(fileURLToPath(import.meta.url));
const fixtureRaw = (name) => readFileSync(join(here, "fixtures", name), "utf8");
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

function counter(prefix) {
  let n = 0;
  return () => `${prefix}-${++n}`;
}

/** read → change something → write (twice) → clear: primary key byte-for-byte unchanged. */
function assertProtected(raw, expectedProblem) {
  const storage = memoryStorage([[KEY, raw]]);
  const store = createBrowserStore(storage, KEY, { createId: counter("tmp"), today: () => "2026-09-29" });
  const root = store.read();
  assert.equal(store.lastReadProblem, expectedProblem);
  assert.equal(store.writeProtected, true);
  assert.equal(root.version, 3, "app still gets a usable temporary record");
  assert.equal(storage.raw(KEY), raw, "read did not overwrite");

  const learner = getActiveLearner(root);
  learner.prefs.sound = false;
  learner.relations["square-15"] = {
    status: "learning",
    attempts: [{ correct: false, day: "2026-09-29", slow: false }],
    schedule: { due_day: "2026-09-29", bucket: "same-day", reason: "wrong" },
  };
  const next = withActiveLearner(root, learner);
  assert.equal(store.write(next), false, "write refused");
  assert.equal(store.write(next), false, "still refused on a second save");
  assert.equal(store.clear(), false, "clear refused");
  assert.equal(storage.raw(KEY), raw, "primary key byte-for-byte unchanged");
  assert.deepEqual(storage.keys(), [KEY], "nothing else written either");

  // A fresh page load sees the same original and is protected again.
  const again = createBrowserStore(storage, KEY, { createId: counter("tmp2") });
  again.read();
  assert.equal(again.writeProtected, true);
  assert.equal(storage.raw(KEY), raw);
}

test("write-protect: bad JSON → read → write(newState) leaves primary key unchanged", () => {
  assertProtected("{not-json", "unreadable");
  assertProtected('{"version":2,"relations":{"square-15":', "unreadable");
});

test("write-protect: unknown future version 4 → read → write leaves primary key unchanged", () => {
  const v4 = JSON.stringify({
    version: 4,
    active_learner_id: "future-1",
    learners: { "future-1": { profile: { learner_id: "future-1" }, relations: {}, extra: true } },
  });
  assertProtected(v4, "unknown-version");
});

test("write-protect: migration failure (malformed v2) → read → write leaves primary key unchanged", () => {
  // attempts: [null] makes the v2 → v2 schedule projection throw.
  const badV2 = JSON.stringify({
    version: 2,
    relations: { "square-15": { status: "learning", attempts: [null] } },
    sessions: [],
    activeSession: null,
    prefs: { sound: true },
  });
  assertProtected(badV2, "migration-failed");
  // An illegal v3 (no learners for the active id) is also a migration failure.
  assertProtected(JSON.stringify({ version: 3, active_learner_id: "a", learners: {} }), "migration-failed");
});

test("write-protect: storage getItem throwing also protects the primary key", () => {
  const writes = [];
  const storage = {
    getItem: () => {
      throw new Error("denied");
    },
    setItem: (k, v) => writes.push([k, v]),
    removeItem: (k) => writes.push([k, null]),
  };
  const store = createBrowserStore(storage, KEY, { createId: () => "tmp" });
  assert.equal(store.read().version, 3);
  assert.equal(store.lastReadProblem, "unreadable");
  assert.equal(store.write(store.read()), false);
  assert.equal(store.clear(), false);
  assert.deepEqual(writes, []);
});

test("write-protect: readable v1 / v2 / v3 records stay writable", () => {
  for (const name of ["state-v1.json", "state-v2.json"]) {
    const storage = memoryStorage([[KEY, fixtureRaw(name)]]);
    const store = createBrowserStore(storage, KEY, { createId: counter("u"), today: () => "2026-09-29" });
    const root = store.read();
    assert.equal(store.lastReadProblem, null, name);
    assert.equal(store.writeProtected, false, name);
    const learner = getActiveLearner(root);
    learner.prefs.sound = false;
    assert.equal(store.write(withActiveLearner(root, learner)), true, name);
    const saved = JSON.parse(storage.raw(KEY));
    assert.equal(saved.version, 3, name);
    assert.equal(saved.learners[saved.active_learner_id].prefs.sound, false, name);

    // The v3 just written is itself readable and writable, with the same id.
    const reload = createBrowserStore(storage, KEY, { createId: () => "never" });
    const root3 = reload.read();
    assert.equal(reload.writeProtected, false, name);
    assert.equal(root3.active_learner_id, saved.active_learner_id, name);
    const l3 = getActiveLearner(root3);
    l3.prefs.sound = true;
    assert.equal(reload.write(withActiveLearner(root3, l3)), true, name);
    assert.equal(JSON.parse(storage.raw(KEY)).learners[saved.active_learner_id].prefs.sound, true, name);
  }
  // Brand-new device: writable too.
  const fresh = createBrowserStore(memoryStorage(), KEY, { createId: () => "fresh-1", today: () => "2026-09-29" });
  const root = fresh.read();
  assert.equal(fresh.writeProtected, false);
  assert.equal(fresh.write(root), true);
});
