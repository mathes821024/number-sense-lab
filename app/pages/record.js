/**
 * The learner record as the running app holds it — h5/app.js keeps the full
 * v3 root in memory (createMemoryStore) and writes it through the storage
 * implementation on every change. Same here, shared by Home and Training:
 * the platform store is read once per app launch; later reads come from
 * memory. When that one read hit a record it must not overwrite, the store is
 * write-protected and the app keeps working in memory only, across pages,
 * without ever touching the stored text.
 */

// One snapshot semantics for every client: core's createMemoryStore (JSON copy, src/core/json-clone.js).
import { createMemoryStore } from "../../src/core/store.js";

export function createRecordKeeper(store) {
  const memory = createMemoryStore();
  memory.write(store.read());
  return {
    read() {
      return memory.read();
    },
    write(root) {
      memory.write(root);
      return store.write(root);
    },
    get writeProtected() {
      return Boolean(store.writeProtected);
    },
    get lastReadProblem() {
      return store.lastReadProblem || null;
    },
  };
}

let keeper = null;
/** One keeper per app launch. getStore comes from app/platform/current. */
export function getRecord(getStore) {
  if (!keeper) keeper = createRecordKeeper(getStore());
  return keeper;
}
