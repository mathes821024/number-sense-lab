/**
 * H5 storage implementation: the browser's localStorage behind the shared
 * storage contract (src/adapter/storage-contract.js).
 *
 * This is main's src/adapter/browser-store.js moved here unchanged in
 * behaviour (docs/architecture/02: 切片开工时整段搬到 app/platform/h5/，不在两边各留一份).
 * The rules now live in the contract; this file only supplies localStorage
 * and the browser's crypto for learner ids. The current h5/ shell and the
 * Taro H5 build both use it.
 */
import {
  STATE_KEY,
  createStateStore,
  createLearnerId as contractLearnerId,
  localDay,
} from "../../../src/adapter/storage-contract.js";

export { localDay };

/** RFC 4122 v4 id. Prefers crypto.randomUUID, then getRandomValues, then Math.random. */
export function createLearnerId(cryptoObj = globalThis.crypto) {
  return contractLearnerId(cryptoObj);
}

/**
 * @param {Storage} storage
 * @param {string} key
 * @param {{ createId?: () => string, today?: () => string }} deps
 */
export function createBrowserStore(storage = globalThis.localStorage, key = STATE_KEY, deps = {}) {
  return createStateStore(storage, key, {
    createId: deps.createId || (() => createLearnerId()),
    today: deps.today || (() => localDay()),
  });
}
