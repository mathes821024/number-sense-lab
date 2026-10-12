/**
 * Alipay Mini Program storage implementation: my.*StorageSync behind the
 * shared storage contract (src/adapter/storage-contract.js). Same key, same
 * v1 → v2 → v3 → v4 migration, same write protection as H5 and WeChat.
 *
 * Alipay's storage API uses object parameters instead of positional:
 *   my.getStorageSync({ key }) returns { data } (undefined for missing)
 *   my.setStorageSync({ key, data })
 *   my.removeStorageSync({ key })
 */
import { STATE_KEY, createStateStore, createLearnerId, localDay } from "../../../src/adapter/storage-contract.js";

export function myBackend(api) {
  return {
    getItem(key) {
      const result = api.getStorageSync({ key });
      const value = result && result.data;
      if (value === undefined || value === null || value === "") return null;
      if (typeof value !== "string") throw new TypeError("stored value is not text");
      return value;
    },
    setItem(key, text) {
      api.setStorageSync({ key, data: String(text) });
    },
    removeItem(key) {
      api.removeStorageSync({ key });
    },
  };
}

const runtimeMy = () => (typeof my !== "undefined" ? my : undefined);

/**
 * The Mini Program has no synchronous crypto source in the app service, so
 * learner ids use the contract's Math.random v4 fallback.
 * @param {object} api the my object
 * @param {string} key
 * @param {{ createId?: () => string, today?: () => string }} deps
 */
export function createAlipayStore(api = runtimeMy(), key = STATE_KEY, deps = {}) {
  return createStateStore(myBackend(api), key, {
    createId: deps.createId || (() => createLearnerId(null)),
    today: deps.today || (() => localDay()),
  });
}
