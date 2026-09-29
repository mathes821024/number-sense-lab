import { emptyState } from "../core/store.js";
import { migrateState } from "../core/scheduler.js";

const KEY = "nsl-v01-state";

export function createBrowserStore(storage = globalThis.localStorage, key = KEY) {
  return {
    key,
    read() {
      try {
        const raw = storage.getItem(key);
        if (!raw) return emptyState();
        const parsed = JSON.parse(raw);
        if (!parsed || (parsed.version !== 1 && parsed.version !== 2)) return emptyState();
        const migrated = migrateState(parsed);
        const practiced = Object.values(parsed.relations || {});
        const incomplete = practiced.some(
          (relation) => (relation?.attempts || []).length > 0 && !relation.schedule,
        );
        if (parsed.version !== 2 || incomplete) {
          storage.setItem(key, JSON.stringify(migrated));
        }
        return migrated;
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
