/**
 * WeChat Mini Program storage implementation: wx.*StorageSync behind the
 * shared storage contract. wx returns "" for a missing key; the contract
 * treats that the same as null.
 */
import { createStateStore, STATE_KEY } from "../../../src/adapter/storage-contract.js";

export function wxBackend(api) {
  return {
    getItem(key) {
      const value = api.getStorageSync(key);
      return typeof value === "string" && value !== "" ? value : null;
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

export function createWechatStore(api = runtimeWx(), key = STATE_KEY) {
  return createStateStore(wxBackend(api), key);
}
