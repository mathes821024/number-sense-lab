/** In-memory learning state. Core must not touch platform storage APIs. */

export function emptyState() {
  return {
    version: 2,
    relations: {},
    sessions: [],
    activeSession: null,
    prefs: { sound: true },
  };
}

export function createMemoryStore(initial = emptyState()) {
  let state = structuredClone(initial);
  return {
    read() {
      return structuredClone(state);
    },
    write(next) {
      state = structuredClone(next);
    },
  };
}
