import { emptyState } from "../core/store.js";

const KEY = "nsl-v01-state";

export function createBrowserStore(storage = globalThis.localStorage, key = KEY) {
  return {
    key,
    read() {
      try {
        const raw = storage.getItem(key);
        if (!raw) return emptyState();
        const parsed = JSON.parse(raw);
        if (!parsed || parsed.version !== 1) return emptyState();
        return {
          ...emptyState(),
          ...parsed,
          relations: parsed.relations || {},
          sessions: parsed.sessions || [],
          prefs: { sound: true, ...(parsed.prefs || {}) },
        };
      } catch {
        return emptyState();
      }
    },
    write(state) {
      storage.setItem(key, JSON.stringify(state));
    },
    clear() {
      storage.removeItem(key);
    },
  };
}
