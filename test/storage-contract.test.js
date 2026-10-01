/**
 * One storage contract, two implementations. The SAME cases run against
 * app/platform/h5/browser-store.js (a fake localStorage) and
 * app/platform/wechat/wx-store.js (a fake wx with *StorageSync, which returns
 * "" for a missing key). V0.3 semantics: v3 state, v1 → v2 → v3 migration,
 * write protection for unreadable / future / failed-migration records.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { STATE_KEY } from "../src/adapter/storage-contract.js";
import { createBrowserStore } from "../app/platform/h5/browser-store.js";
import { createWechatStore, wxBackend } from "../app/platform/wechat/wx-store.js";
import { getActiveLearner, withActiveLearner, isValidV3 } from "../src/core/store.js";
import { loadCoreCatalog } from "../src/core/content.js";
import { startSession, submitAnswer, peekCurrent } from "../src/core/session.js";

const here = dirname(fileURLToPath(import.meta.url));
const fixtureRaw = (name) => readFileSync(join(here, "fixtures", name), "utf8");
const DAY = "2026-09-29";

function counter(prefix) {
  let n = 0;
  const fn = () => `${prefix}-${++n}`;
  fn.calls = () => n;
  return fn;
}

/** Browser-shaped storage. */
function fakeLocalStorage(initial) {
  const map = new Map(initial || []);
  const log = [];
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => (log.push(["set", k]), map.set(k, String(v))),
    removeItem: (k) => (log.push(["remove", k]), map.delete(k)),
    raw: (k) => map.get(k),
    keys: () => [...map.keys()],
    log,
  };
}

/** wx-shaped storage: "" for missing keys, stores any value. */
function fakeWx(initial) {
  const map = new Map(initial || []);
  const log = [];
  return {
    getStorageSync: (k) => (log.push(["get", k]), map.has(k) ? map.get(k) : ""),
    setStorageSync: (k, v) => (log.push(["set", k]), map.set(k, v)),
    removeStorageSync: (k) => (log.push(["remove", k]), map.delete(k)),
    raw: (k) => map.get(k),
    keys: () => [...map.keys()],
    log,
  };
}

/** Both targets behind one shape: { make(initial, deps), raw(key), keys(), writes() }. */
const TARGETS = {
  h5: (initial) => {
    const storage = fakeLocalStorage(initial);
    return {
      storage,
      store: (deps) => createBrowserStore(storage, STATE_KEY, deps),
      raw: () => storage.raw(STATE_KEY),
      keys: () => storage.keys(),
      writes: () => storage.log.length,
      throwing: () => {
        const writes = [];
        const s = {
          getItem: () => {
            throw new Error("denied");
          },
          setItem: (k, v) => writes.push([k, v]),
          removeItem: (k) => writes.push([k, null]),
        };
        return { store: createBrowserStore(s, STATE_KEY, { createId: () => "tmp" }), writes };
      },
    };
  },
  wechat: (initial) => {
    const api = fakeWx(initial);
    return {
      storage: api,
      store: (deps) => createWechatStore(api, STATE_KEY, deps),
      raw: () => api.raw(STATE_KEY),
      keys: () => api.keys(),
      writes: () => api.log.filter(([op]) => op !== "get").length,
      throwing: () => {
        const writes = [];
        const a = {
          getStorageSync: () => {
            throw new Error("denied");
          },
          setStorageSync: (k, v) => writes.push([k, v]),
          removeStorageSync: (k) => writes.push([k, null]),
        };
        return { store: createWechatStore(a, STATE_KEY, { createId: () => "tmp" }), writes };
      },
    };
  },
};

function assertProtected(target, raw, problem) {
  const t = TARGETS[target]([[STATE_KEY, raw]]);
  const store = t.store({ createId: counter("tmp"), today: () => DAY });
  const root = store.read();
  assert.equal(store.lastReadProblem, problem, `${target}: problem`);
  assert.equal(store.writeProtected, true, `${target}: protected`);
  assert.equal(isValidV3(root), true, `${target}: a usable temporary v3`);
  assert.equal(t.raw(), raw, `${target}: read did not overwrite`);
  const learner = getActiveLearner(root);
  learner.prefs.sound = false;
  learner.relations["square-15"] = { status: "learning", attempts: [{ correct: false, day: DAY, slow: false }] };
  const next = withActiveLearner(root, learner);
  assert.equal(store.write(next), false, `${target}: write refused`);
  assert.equal(store.write(next), false, `${target}: refused again`);
  assert.equal(store.clear(), false, `${target}: clear refused`);
  assert.equal(t.raw(), raw, `${target}: stored text byte-for-byte unchanged`);
  assert.deepEqual(t.keys(), [STATE_KEY], `${target}: nothing else written`);
  assert.equal(t.writes(), 0, `${target}: no set/remove call at all`);
  // The next launch sees the same original and is protected again.
  const again = t.store({ createId: counter("tmp2") });
  again.read();
  assert.equal(again.writeProtected, true);
  assert.equal(t.raw(), raw);
}

for (const target of Object.keys(TARGETS)) {
  test(`[${target}] new device: v3 written directly with one learner_id`, () => {
    const t = TARGETS[target]();
    const ids = counter("L");
    const store = t.store({ createId: ids, today: () => DAY });
    const root = store.read();
    assert.equal(root.version, 3);
    assert.equal(ids.calls(), 1);
    assert.equal(store.writeProtected, false);
    const saved = JSON.parse(t.raw());
    assert.equal(saved.version, 3);
    assert.equal(saved.active_learner_id, "L-1");
    assert.deepEqual(saved.learners["L-1"].profile, { learner_id: "L-1", created_on: DAY });
    assert.equal(typeof t.raw(), "string", "stored as text");
  });

  test(`[${target}] v1 → v2 → v3: migrated, written back once, history kept, id stable`, () => {
    const v1 = JSON.parse(fixtureRaw("state-v1.json"));
    const t = TARGETS[target]([[STATE_KEY, fixtureRaw("state-v1.json")]]);
    const ids = counter("L");
    const root = t.store({ createId: ids, today: () => DAY }).read();
    assert.equal(root.version, 3);
    assert.equal(ids.calls(), 1, "exactly one new learner_id");
    const learner = getActiveLearner(root);
    for (const [id, rel] of Object.entries(v1.relations)) {
      assert.equal(learner.relations[id].status, rel.status, `${id} status kept`);
      assert.deepEqual(learner.relations[id].attempts, rel.attempts, `${id} attempts kept`);
    }
    assert.deepEqual(learner.activeSession, v1.activeSession, "activeSession not rebuilt");
    assert.deepEqual(learner.sessions, v1.sessions);
    assert.equal(learner.prefs.sound, false);
    const saved = JSON.parse(t.raw());
    assert.equal(saved.version, 3);
    assert.equal("relations" in saved, false, "no parallel top-level relations");
    // Second launch: same id, no new id, no rewrite.
    const before = t.raw();
    const again = t.store({ createId: () => "never" }).read();
    assert.equal(again.active_learner_id, root.active_learner_id);
    assert.equal(t.raw(), before);
  });

  test(`[${target}] v2 → v3 keeps the v2 record under one learner`, () => {
    const v2 = JSON.parse(fixtureRaw("state-v2.json"));
    const t = TARGETS[target]([[STATE_KEY, fixtureRaw("state-v2.json")]]);
    const root = t.store({ createId: () => "L-2", today: () => DAY }).read();
    assert.equal(root.active_learner_id, "L-2");
    const learner = getActiveLearner(root);
    assert.deepEqual(Object.keys(learner.relations).sort(), Object.keys(v2.relations).sort());
    assert.deepEqual(learner.sessions, v2.sessions);
    assert.deepEqual(learner.lastResult, v2.lastResult);
    assert.equal(JSON.parse(t.raw()).version, 3);
  });

  test(`[${target}] a legal v3 is read as is and not rewritten`, () => {
    const seed = TARGETS[target]();
    seed.store({ createId: () => "L-3", today: () => DAY }).read();
    const raw = seed.raw();
    const t = TARGETS[target]([[STATE_KEY, raw]]);
    const root = t.store({ createId: () => "never" }).read();
    assert.equal(root.active_learner_id, "L-3");
    assert.equal(t.raw(), raw);
    assert.equal(t.writes(), 0);
  });

  test(`[${target}] write-protect: bad JSON is never overwritten`, () => {
    assertProtected(target, "{not-json", "unreadable");
    assertProtected(target, '{"version":2,"relations":{"square-15":', "unreadable");
  });

  test(`[${target}] write-protect: a future version is never overwritten`, () => {
    const v4 = JSON.stringify({ version: 4, active_learner_id: "f", learners: { f: { profile: { learner_id: "f" }, extra: true } } });
    assertProtected(target, v4, "unknown-version");
    assertProtected(target, JSON.stringify({ relations: {} }), "unknown-version");
  });

  test(`[${target}] write-protect: a failed migration does not destroy old data`, () => {
    const badV2 = JSON.stringify({
      version: 2,
      relations: { "square-15": { status: "learning", attempts: [null] } },
      sessions: [],
      activeSession: null,
      prefs: { sound: true },
    });
    assertProtected(target, badV2, "migration-failed");
    assertProtected(target, JSON.stringify({ version: 3, active_learner_id: "a", learners: {} }), "migration-failed");
    const badV1 = JSON.stringify({ version: 1, relations: { "square-15": { status: "learning", attempts: [null] } } });
    assertProtected(target, badV1, "migration-failed");
  });

  test(`[${target}] write-protect: a storage read that throws protects the key`, () => {
    const { store, writes } = TARGETS[target]().throwing();
    assert.equal(store.read().version, 3);
    assert.equal(store.lastReadProblem, "unreadable");
    assert.equal(store.write(store.read()), false);
    assert.equal(store.clear(), false);
    assert.deepEqual(writes, []);
  });

  test(`[${target}] readable records stay writable; clear removes the key`, () => {
    for (const name of ["state-v1.json", "state-v2.json"]) {
      const t = TARGETS[target]([[STATE_KEY, fixtureRaw(name)]]);
      const store = t.store({ createId: counter("u"), today: () => DAY });
      const root = store.read();
      assert.equal(store.writeProtected, false, name);
      const learner = getActiveLearner(root);
      learner.prefs.sound = true;
      assert.equal(store.write(withActiveLearner(root, learner)), true, name);
      assert.equal(JSON.parse(t.raw()).learners[root.active_learner_id].prefs.sound, true, name);
      assert.equal(store.clear(), true, name);
      assert.equal(t.raw(), undefined, `${name}: removed`);
    }
  });

  test(`[${target}] a recorded attempt round-trips through the store`, () => {
    const t = TARGETS[target]();
    const store = t.store({ createId: () => "L-r", today: () => DAY });
    const root = store.read();
    const catalog = loadCoreCatalog();
    let learner = getActiveLearner(root);
    const session = startSession({ mode: "daily", day: DAY, relations: learner.relations, catalog, seed: "rt" });
    const { item, session: s } = peekCurrent(session, catalog);
    const result = submitAnswer({
      item,
      state: { ...learner, activeSession: s },
      session: s,
      raw: item.answer_type === "decimal_repeating" ? item.canonical_answer.replace(/^0\.\((\d+)\)$/, "$1") : item.canonical_answer,
      catalog,
      meta: { day: DAY, inputMode: "onscreen_keypad", mixedInput: false, elapsedMs: 1500 },
    });
    assert.equal(result.judged.kind, "correct");
    assert.equal(store.write(withActiveLearner(root, result.state)), true);
    const back = getActiveLearner(t.store({ createId: () => "never" }).read());
    assert.equal(back.relations[item.id].attempts.length, 1);
    assert.equal(back.relations[item.id].attempts[0].inputMode, "onscreen_keypad");
    assert.ok(back.relations[item.id].schedule?.due_day);
    assert.equal(back.activeSession.answered, 1);
  });
}

test("[wechat] goes through wx.*StorageSync only and stores text", () => {
  const api = fakeWx();
  const store = createWechatStore(api, STATE_KEY, { createId: () => "L-w", today: () => DAY });
  store.read();
  store.write(store.read());
  store.clear();
  assert.equal(typeof api.raw(STATE_KEY), "undefined");
  // read (nothing → write v3), read (legal v3, no rewrite), write, clear
  assert.deepEqual(api.log.map(([op]) => op), ["get", "set", "get", "set", "remove"]);
  assert.ok(api.log.every(([, k]) => k === STATE_KEY));
});

test("[wechat] a non-text value under the key is not mistaken for an empty device", () => {
  const foreign = { version: 3, written: "by something else" };
  const api = fakeWx([[STATE_KEY, foreign]]);
  const store = createWechatStore(api, STATE_KEY, { createId: () => "tmp", today: () => DAY });
  store.read();
  assert.equal(store.lastReadProblem, "unreadable");
  assert.equal(store.writeProtected, true);
  assert.equal(store.write(store.read()), false);
  assert.equal(api.raw(STATE_KEY), foreign, "left exactly as it was");
});

test("[wechat] wx's empty string means nothing stored", () => {
  const backend = wxBackend(fakeWx([["other", "x"]]));
  assert.equal(backend.getItem(STATE_KEY), null);
  assert.equal(backend.getItem("other"), "x");
});

test("h5 and wechat write the same text and read each other's records identically", () => {
  for (const name of ["state-v1.json", "state-v2.json"]) {
    const h5 = TARGETS.h5([[STATE_KEY, fixtureRaw(name)]]);
    const wx = TARGETS.wechat([[STATE_KEY, fixtureRaw(name)]]);
    h5.store({ createId: () => "same", today: () => DAY }).read();
    wx.store({ createId: () => "same", today: () => DAY }).read();
    assert.equal(h5.raw(), wx.raw(), `${name}: same migrated text`);
    const crossA = TARGETS.wechat([[STATE_KEY, h5.raw()]]).store({ createId: () => "never" }).read();
    const crossB = TARGETS.h5([[STATE_KEY, wx.raw()]]).store({ createId: () => "never" }).read();
    assert.deepEqual(crossA, crossB);
  }
});
