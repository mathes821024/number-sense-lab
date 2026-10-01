// Worst-case Training screens for the viewport checks (H5 Playwright and the
// WeChat DevTools automator use the same list). Found by scanning content:
// the longest prompt per answer_type (CJK counts a full em, Latin / digits
// ~0.6em), plus the tallest states — a fraction answer with the
// needs_simplification nudge showing, and the longest repeating block; plus
// the longest prompt of each v0.4 domain.
import { loadCoreCatalog } from "../src/core/content.js";
import { startSession } from "../src/core/session.js";

const catalog = loadCoreCatalog();
const width = (s) => [...s].reduce((a, ch) => a + (/[\u3000-\u9fff\uff00-\uffef]/.test(ch) ? 1 : 0.6), 0);
const longest = {};
for (const item of catalog) {
  const best = longest[item.answer_type];
  if (!best || width(item.prompt) > width(best.prompt) || (width(item.prompt) === width(best.prompt) && item.canonical_answer.length > best.canonical_answer.length)) longest[item.answer_type] = item;
}
const repeatingLongest = catalog.filter((i) => i.answer_type === "decimal_repeating").sort((a, b) => b.canonical_answer.length - a.canonical_answer.length)[0];
export const blockOf = (item) => (item.answer_type === "decimal_repeating" ? item.canonical_answer.replace(/^\d+\.\((\d+)\)$/, "$1") : item.canonical_answer);
const unsimplified = (item) => { const [n, d] = item.canonical_answer.split("/").map(Number); return `${n * 2}/${d * 2}`; };

/** { name, item, type: keys to press, submit: press 提交 first (shows the nudge) } */
export const VIEWPORT_CASES = [
  { name: "integer-longest", item: longest.integer, type: blockOf(longest.integer) },
  { name: "fraction-longest+nudge", item: longest.fraction, type: unsimplified(longest.fraction), submit: true },
  { name: "decimal-longest", item: longest.decimal, type: blockOf(longest.decimal) },
  { name: "repeating-longest", item: repeatingLongest, type: blockOf(repeatingLongest) },
  // v0.4: the longest prompt of each new domain (all integer answers).
  ...["halves", "complements", "cubes", "powers", "special_products"].map((domain) => {
    const item = catalog
      .filter((i) => i.domain === domain)
      .reduce((best, i) => (!best || width(i.prompt) > width(best.prompt) || (width(i.prompt) === width(best.prompt) && i.canonical_answer.length > best.canonical_answer.length) ? i : best), null);
    return { name: `${domain}-longest`, item, type: item.canonical_answer };
  }),
];

export function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
/** A stored v3 record with an unfinished two-question set whose second question is `id`. */
export function seededRaw(id) {
  const s = startSession({ mode: "daily", day: today(), relations: {}, catalog, seed: "vp" });
  const session = { ...s, queue: ["square-6", id], targetCount: 2, cursor: 1, answered: 1, correctCount: 1, outcomes: [{ id: "square-6", correct: true, elapsedMs: 1500, inputMode: "onscreen_keypad" }] };
  return JSON.stringify({
    version: 3,
    active_learner_id: "vp",
    learners: { vp: { profile: { learner_id: "vp", created_on: today() }, relations: {}, sessions: [], activeSession: session, prefs: { sound: false } } },
  });
}
