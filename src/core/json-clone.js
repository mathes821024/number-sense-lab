/**
 * Deep copy of a JSON-safe value (the learner state is plain JSON: it is
 * stored as JSON text). Pure ECMAScript, so it runs in every client's JS
 * engine; structuredClone is a browser / Node host API that the Mini Program
 * engine does not provide. null / undefined are returned as is.
 */
export function cloneJson(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}
