// The storage contract (src/adapter/storage-contract.js) run against both
// platform implementations: H5 localStorage and WeChat wx.*StorageSync.
import assert from "node:assert/strict";
import test from "node:test";
import { STATE_KEY } from "../src/adapter/storage-contract.js";
import { createBrowserStore } from "../app/platform/h5/browser-store.js";
import { createWechatStore } from "../app/platform/wechat/wx-store.js";
import { emptyState } from "../src/core/store.js";
import { MASTERY } from "../src/core/mastery.js";

/** Browser-shaped storage: getItem → null when missing. */
function fakeLocalStorage() {
  const map = new Map();
  return {
    raw: map,
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k),
  };
}

/** wx-shaped storage: getStorageSync → "" when missing, keeps any type. */
function mockWx() {
  const map = new Map();
  const calls = [];
  return {
    raw: map,
    calls,
    getStorageSync: (k) => (calls.push(["get", k]), map.has(k) ? map.get(k) : ""),
    setStorageSync: (k, v) => (calls.push(["set", k]), map.set(k, v)),
    removeStorageSync: (k) => (calls.push(["remove", k]), map.delete(k)),
  };
}

const targets = [
  { name: "h5 localStorage", make: () => { const s = fakeLocalStorage(); return { store: createBrowserStore(s), raw: s.raw }; } },
  { name: "wechat wx storage", make: () => { const w = mockWx(); return { store: createWechatStore(w), raw: w.raw, wx: w }; } },
];

function practicedState() {
  const state = emptyState();
  state.relations["fraction-1-2"] = {
    status: MASTERY.LEARNING,
    attempts: [{ correct: true, day: "2026-09-29", slow: false, inputMode: "onscreen_keypad", elapsedMs: 1400 }],
    schedule: { dueDay: "2026-09-30", intervalDays: 1, reviewCount: 1 },
  };
  return state;
}

for (const { name, make } of targets) {
  test(`${name}: uses the one contract key nsl-v01-state`, () => {
    const { store, raw } = make();
    assert.equal(store.key, STATE_KEY);
    assert.equal(STATE_KEY, "nsl-v01-state");
    store.write(emptyState());
    assert.deepEqual([...raw.keys()], ["nsl-v01-state"]);
  });

  test(`${name}: nothing stored → empty state`, () => {
    const { store } = make();
    assert.deepEqual(store.read(), emptyState());
  });

  test(`${name}: write then read restores learning state`, () => {
    const { store, raw } = make();
    const state = practicedState();
    store.write(state);
    assert.equal(typeof raw.get(STATE_KEY), "string");
    const loaded = store.read();
    assert.equal(loaded.relations["fraction-1-2"].status, MASTERY.LEARNING);
    assert.equal(loaded.relations["fraction-1-2"].attempts[0].inputMode, "onscreen_keypad");
    assert.equal(loaded.version, 2);
  });

  test(`${name}: bad JSON reads as empty and is not overwritten`, () => {
    const { store, raw } = make();
    raw.set(STATE_KEY, "{not json");
    assert.deepEqual(store.read(), emptyState());
    assert.equal(raw.get(STATE_KEY), "{not json");
  });

  test(`${name}: unknown version reads as empty and is not overwritten`, () => {
    const { store, raw } = make();
    const text = JSON.stringify({ version: 99, relations: {} });
    raw.set(STATE_KEY, text);
    assert.deepEqual(store.read(), emptyState());
    assert.equal(raw.get(STATE_KEY), text);
  });

  test(`${name}: v1 state is migrated and written back`, () => {
    const { store, raw } = make();
    raw.set(STATE_KEY, JSON.stringify({
      version: 1,
      relations: { "square-6": { status: MASTERY.LEARNING, attempts: [{ correct: true, day: "2026-09-28", slow: false, inputMode: "onscreen_keypad", elapsedMs: 900 }] } },
      sessions: [],
      activeSession: null,
      prefs: { sound: false },
    }));
    const loaded = store.read();
    assert.equal(loaded.version, 2);
    assert.ok(loaded.relations["square-6"].schedule, "schedule projected");
    assert.equal(JSON.parse(raw.get(STATE_KEY)).version, 2);
    assert.equal(loaded.prefs.sound, false);
  });

  test(`${name}: clear removes the key`, () => {
    const { store, raw } = make();
    store.write(practicedState());
    store.clear();
    assert.equal(raw.has(STATE_KEY), false);
    assert.deepEqual(store.read(), emptyState());
  });
}

test("wechat implementation goes through wx.*StorageSync only", () => {
  const w = mockWx();
  const store = createWechatStore(w);
  store.write(emptyState());
  store.read();
  store.clear();
  assert.deepEqual(w.calls.map(([op]) => op), ["set", "get", "remove"]);
});

test("h5 and wechat read each other's stored text identically", () => {
  const ls = fakeLocalStorage();
  const w = mockWx();
  createBrowserStore(ls).write(practicedState());
  w.raw.set(STATE_KEY, ls.raw.get(STATE_KEY));
  assert.deepEqual(createWechatStore(w).read(), createBrowserStore(ls).read());
});
