/**
 * H5 Storage Adapter (localStorage). Platform APIs live here, never in Core.
 * - storage key stays `nsl-v01-state`
 * - learner_id is created here (crypto.randomUUID with fallbacks) and handed to Core
 * - migration v1 → v2 → v3 runs in Core; written back only after it succeeds
 * - unreadable JSON / unknown version / failed migration: the original text is
 *   never overwritten by the read. If the learner later saves, the original is
 *   first copied to `<key>.unreadable` (once) so it is still recoverable.
 */
import { upgradeState, MigrationError } from "../core/migrate.js";
import { emptyState } from "../core/store.js";

const KEY = "nsl-v01-state";

function hex(bytes) {
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** RFC 4122 v4 id. Prefers crypto.randomUUID, then getRandomValues, then Math.random. */
export function createLearnerId(cryptoObj = globalThis.crypto) {
  if (cryptoObj && typeof cryptoObj.randomUUID === "function") {
    return cryptoObj.randomUUID();
  }
  const bytes = new Uint8Array(16);
  if (cryptoObj && typeof cryptoObj.getRandomValues === "function") {
    cryptoObj.getRandomValues(bytes);
  } else {
    for (let i = 0; i < 16; i += 1) bytes[i] = Math.floor(Math.random() * 256);
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const h = hex(bytes);
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

export function localDay(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * @param {Storage} storage
 * @param {string} key
 * @param {{ createId?: () => string, today?: () => string }} deps
 */
export function createBrowserStore(storage = globalThis.localStorage, key = KEY, deps = {}) {
  const createId = deps.createId || (() => createLearnerId());
  const today = deps.today || (() => localDay());
  const backupKey = `${key}.unreadable`;
  /** Raw text we could not read; kept so a later save cannot erase it. */
  let unreadableRaw = null;

  const store = {
    key,
    backupKey,
    /** "unreadable" | "unknown-version" | "migration-failed" | null */
    lastReadProblem: null,
    read() {
      store.lastReadProblem = null;
      let raw = null;
      try {
        raw = storage.getItem(key);
      } catch {
        store.lastReadProblem = "unreadable";
        return emptyState({ learnerId: createId(), createdOn: today() });
      }
      if (raw === null || raw === undefined || raw === "") {
        // New device: write v3 directly, with its one learner_id.
        const fresh = upgradeState(null, { createLearnerId: createId, today: today() }).state;
        storage.setItem(key, JSON.stringify(fresh));
        return fresh;
      }
      let parsed;
      try {
        parsed = JSON.parse(raw);
      } catch {
        return failRead(raw, "unreadable");
      }
      try {
        const result = upgradeState(parsed, { createLearnerId: createId, today: today() });
        if (result.changed) storage.setItem(key, JSON.stringify(result.state));
        return result.state;
      } catch (error) {
        const reason =
          error instanceof MigrationError && /unknown version/.test(error.message)
            ? "unknown-version"
            : "migration-failed";
        return failRead(raw, reason);
      }
    },
    write(state) {
      if (unreadableRaw !== null) {
        try {
          if (storage.getItem(backupKey) === null) storage.setItem(backupKey, unreadableRaw);
        } catch {
          // If we cannot keep the original, do not overwrite it either.
          return;
        }
        unreadableRaw = null;
      }
      storage.setItem(key, JSON.stringify(state));
    },
    clear() {
      storage.removeItem(key);
    },
  };

  function failRead(raw, reason) {
    unreadableRaw = raw;
    store.lastReadProblem = reason;
    // Same failure mode as before: hand back an empty record, write nothing.
    return emptyState({ learnerId: createId(), createdOn: today() });
  }

  return store;
}
