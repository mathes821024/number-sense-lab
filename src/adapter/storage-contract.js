/**
 * Storage contract for learning state (docs/architecture/02 §平台实现只放一处).
 *
 * - One key: `nsl-v01-state`.
 * - read(): missing → empty state; unreadable JSON or an unknown version →
 *   empty state, and the stored text is NOT overwritten.
 * - read() migrates v1 / incomplete v2 state and writes the migrated copy back.
 * - write(state) stores JSON text; clear() removes the key.
 *
 * This file names no platform. Each client hands in a backend from
 * `app/platform/<client>/` that offers three synchronous calls over strings:
 *   getItem(key) → string | null | undefined
 *   setItem(key, text)
 *   removeItem(key)
 */
import { emptyState } from "../core/store.js";
import { migrateState } from "../core/scheduler.js";

export const STATE_KEY = "nsl-v01-state";

export function createStateStore(backend, key = STATE_KEY) {
  if (!backend || typeof backend.getItem !== "function") {
    throw new TypeError("createStateStore needs a backend with getItem/setItem/removeItem");
  }
  return {
    key,
    read() {
      try {
        const raw = backend.getItem(key);
        if (!raw) return emptyState();
        const parsed = JSON.parse(raw);
        if (!parsed || (parsed.version !== 1 && parsed.version !== 2)) return emptyState();
        const migrated = migrateState(parsed);
        const practiced = Object.values(parsed.relations || {});
        const incomplete = practiced.some(
          (relation) => (relation?.attempts || []).length > 0 && !relation.schedule,
        );
        if (parsed.version !== 2 || incomplete) {
          backend.setItem(key, JSON.stringify(migrated));
        }
        return migrated;
      } catch {
        return emptyState();
      }
    },
    write(state) {
      backend.setItem(key, JSON.stringify(state));
    },
    clear() {
      backend.removeItem(key);
    },
  };
}
