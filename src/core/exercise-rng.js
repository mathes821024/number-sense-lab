function hashText(text) {
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function checksumText(text) {
  return hashText(text).toString(16).padStart(8, "0");
}

export function createExerciseRng(coordinates) {
  let state = hashText(String(coordinates)) || 0x9e3779b9;
  const nextUint32 = () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return state >>> 0;
  };
  return Object.freeze({
    integer(minimum, maximum) {
      if (!Number.isSafeInteger(minimum) || !Number.isSafeInteger(maximum) || maximum < minimum) {
        throw new Error("invalid integer range");
      }
      const width = maximum - minimum + 1;
      if (!Number.isSafeInteger(width) || width <= 0) throw new Error("invalid integer range");
      return minimum + (nextUint32() % width);
    },
    boolean() {
      return (nextUint32() & 1) === 1;
    },
    pick(values) {
      if (!Array.isArray(values) || values.length === 0) throw new Error("cannot pick from empty values");
      return values[nextUint32() % values.length];
    }
  });
}
