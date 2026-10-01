/**
 * WeChat Mini Program storage implementation: wx.*StorageSync behind the
 * shared storage contract (src/adapter/storage-contract.js). Same key, same
 * v1 → v2 → v3 migration, same write protection as H5.
 *
 * wx returns "" for a key that is not there; the contract treats "" like
 * null. The contract stores text. Anything else under the key was not written
 * by this app, so it is reported as unreadable (and therefore never
 * overwritten) instead of being taken for an empty device.
 */
import { STATE_KEY, createStateStore, createLearnerId, localDay } from "../../../src/adapter/storage-contract.js";

export function wxBackend(api) {
  return {
    getItem(key) {
      const value = api.getStorageSync(key);
      if (value === "" || value === null || value === undefined) return null;
      if (typeof value !== "string") throw new TypeError("stored value is not text");
      return value;
    },
    setItem(key, text) {
      api.setStorageSync(key, String(text));
    },
    removeItem(key) {
      api.removeStorageSync(key);
    },
  };
}

// eslint-disable-next-line no-undef
const runtimeWx = () => (typeof wx !== "undefined" ? wx : undefined);

/**
 * The Mini Program has no synchronous crypto source in the app service, so
 * learner ids use the contract's Math.random v4 fallback (the same fallback
 * the browser store uses when crypto is missing).
 * @param {object} api the wx object
 * @param {string} key
 * @param {{ createId?: () => string, today?: () => string }} deps
 */
export function createWechatStore(api = runtimeWx(), key = STATE_KEY, deps = {}) {
  return createStateStore(wxBackend(api), key, {
    createId: deps.createId || (() => createLearnerId(null)),
    today: deps.today || (() => localDay()),
  });
}
