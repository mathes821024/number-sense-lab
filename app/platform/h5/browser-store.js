/**
 * H5 storage implementation: the browser's localStorage behind the shared
 * storage contract. Moved from src/adapter/browser-store.js unchanged in
 * behaviour (docs/architecture/02: 切片开工时整段搬到 app/platform/h5/).
 * The current h5/ shell and the Taro H5 build both use this file.
 */
import { createStateStore, STATE_KEY } from "../../../src/adapter/storage-contract.js";

export function createBrowserStore(storage = globalThis.localStorage, key = STATE_KEY) {
  return createStateStore(storage, key);
}
