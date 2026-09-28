import { emptyState } from "../src/core/memory-store.js";

export function createBrowserStore(storage, key) {
  return {
    read() {
      const raw = storage.getItem(key);
      if (!raw) return emptyState();
      return JSON.parse(raw);
    },
    write(state) {
      storage.setItem(key, JSON.stringify(state));
    },
  };
}
