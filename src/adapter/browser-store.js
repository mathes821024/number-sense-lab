/**
 * H5 Storage Adapter (localStorage). Platform APIs live here, never in Core.
 * - storage key stays `nsl-v01-state`
 * - learner_id is created here (crypto.randomUUID with fallbacks) and handed to Core
 * - migration v1 → v2 → v3 runs in Core; written back only after it succeeds
 * - unreadable JSON / unknown version / failed migration: the stored learning
 *   record is never overwritten. read() hands back a temporary empty v3 and the
 *   store instance becomes write-protected: later write()/clear() calls leave
 *   the primary key untouched (write() returns false), so the original record
 *   stays exactly as it was. The app keeps working in memory only.
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
  /**
   * Set when read() could not use what is stored. From then on this instance
   * never replaces or removes the primary key.
   */
  let writeProtected = false;

  const store = {
    key,
    /** "unreadable" | "unknown-version" | "migration-failed" | null */
    lastReadProblem: null,
    /** True once read() hit a record it must not overwrite. */
    get writeProtected() {
      return writeProtected;
    },
    read() {
      store.lastReadProblem = null;
      let raw = null;
      try {
        raw = storage.getItem(key);
      } catch {
        return failRead("unreadable");
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
        return failRead("unreadable");
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
        return failRead(reason);
      }
    },
    /** @returns {boolean} true if saved; false if refused (write-protected). */
    write(state) {
      if (writeProtected) return false;
      storage.setItem(key, JSON.stringify(state));
      return true;
    },
    /** @returns {boolean} true if removed; false if refused (write-protected). */
    clear() {
      if (writeProtected) return false;
      storage.removeItem(key);
      return true;
    },
  };

  function failRead(reason) {
    writeProtected = true;
    store.lastReadProblem = reason;
    // Hand back a temporary empty record; the stored one is left untouched.
    return emptyState({ learnerId: createId(), createdOn: today() });
  }

  return store;
}
