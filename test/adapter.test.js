import assert from "node:assert/strict";
import test from "node:test";
import { createBrowserStore } from "../app/platform/h5/browser-store.js";
import { emptyState } from "../src/core/store.js";
import { MASTERY } from "../src/core/mastery.js";

function memoryStorage() {
  const map = new Map();
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k),
  };
}

test("browser adapter persists and restores learning state", () => {
  const store = createBrowserStore(memoryStorage(), "test-key");
  const state = emptyState();
  state.relations["fraction-1-2"] = {
    status: MASTERY.LEARNING,
    attempts: [
      {
        correct: true,
        day: "2026-09-29",
        slow: false,
        inputMode: "onscreen_keypad",
        elapsedMs: 1400,
      },
    ],
  };
  store.write(state);
  const loaded = store.read();
  assert.equal(loaded.relations["fraction-1-2"].status, MASTERY.LEARNING);
  assert.equal(loaded.relations["fraction-1-2"].attempts[0].inputMode, "onscreen_keypad");
});
