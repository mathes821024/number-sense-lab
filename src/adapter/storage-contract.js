/**
 * Storage contract for the learner state (docs/architecture/02 §平台实现只放一处).
 *
 * This file holds the rules only. It never names a platform API: each client
 * hands in a backend with three synchronous calls
 *
 *   getItem(key)        → stored text, or null / "" when nothing is stored
 *   setItem(key, text)  → store text
 *   removeItem(key)
 *
 * and, optionally, how to make a learner_id and what the local day is. The
 * implementations live in app/platform/h5/ (browser storage) and
 * app/platform/wechat/ (Mini Program sync storage).
 *
 * Rules (unchanged from the V0.3 browser store):
 * - one key, `nsl-v01-state`
 * - nothing stored → a v3 record is written directly, with one learner_id
 * - v1 → v2 → v3 migration runs in Core; the result is written back only after
 *   it succeeded, so a failed migration leaves the old record in place
 * - unreadable text / unknown (future) version / failed migration: the stored
 *   record is never overwritten. read() hands back a temporary empty v3 and
 *   the store becomes write-protected: later write() and clear() leave the key
 *   untouched and return false. The app keeps working in memory only.
 */
import { upgradeState, MigrationError } from "../core/migrate.js";
import { emptyState } from "../core/store.js";

export const STATE_KEY = "nsl-v01-state";

function hex(bytes) {
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * RFC 4122 v4 id from whatever randomness the platform passes in: prefers
 * randomUUID, then getRandomValues, then Math.random.
 * @param {{ randomUUID?: () => string, getRandomValues?: (b: Uint8Array) => Uint8Array } | null} cryptoObj
 */
export function createLearnerId(cryptoObj) {
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

/** The learner's local calendar day, YYYY-MM-DD. */
export function localDay(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * @param {{ getItem(k: string): string|null, setItem(k: string, v: string): void, removeItem(k: string): void }} backend
 * @param {string} key
 * @param {{ createId?: () => string, today?: () => string }} deps
 */
export function createStateStore(backend, key = STATE_KEY, deps = {}) {
  const createId = deps.createId || (() => createLearnerId(null));
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
        raw = backend.getItem(key);
      } catch {
        return failRead("unreadable");
      }
      if (raw === null || raw === undefined || raw === "") {
        // New device: write v3 directly, with its one learner_id.
        const fresh = upgradeState(null, { createLearnerId: createId, today: today() }).state;
        backend.setItem(key, JSON.stringify(fresh));
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
        if (result.changed) backend.setItem(key, JSON.stringify(result.state));
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
      backend.setItem(key, JSON.stringify(state));
      return true;
    },
    /** @returns {boolean} true if removed; false if refused (write-protected). */
    clear() {
      if (writeProtected) return false;
      backend.removeItem(key);
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
