export function emptyState() {
  return { relations: {}, sessions: [] };
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
