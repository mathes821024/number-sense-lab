/**
 * Shared print selector + A4 renderer (v0.3 Owner Feedback 01).
 * Candidates = practiced relations only; default = current mistakes; the
 * sheet holds exactly the selected practiced ids; selection never mutates
 * learner state.
 */
import assert from "node:assert/strict";
import test from "node:test";
import {
  buildA4Sheet,
  buildPrintSelector,
  listPrintCandidates,
  defaultPrintSelection,
  sanitizePrintSelection,
  selectCurrentMistakes,
  clearPrintSelection,
  togglePrintSelection,
} from "../src/core/a4.js";
import { loadCoreCatalog } from "../src/core/content.js";
import { MASTERY } from "../src/core/mastery.js";
import { listCurrentMistakeIds } from "../src/core/mistakes.js";

const catalog = loadCoreCatalog();
const att = (correct, day) => ({ correct, day, slow: false, inputMode: "onscreen_keypad", elapsedMs: 900 });

function fixture() {
  return {
    // current mistake, latest wrong
    "square-17": { status: MASTERY.SHAKY, attempts: [att(true, "2026-09-20"), att(false, "2026-09-29")], schedule: { due_day: "2026-09-29", bucket: "same-day", reason: "stable-wrong" } },
    // current mistake, wrong earlier → latest correct → not stable yet
    "product-12-7": { status: MASTERY.LEARNING, attempts: [att(false, "2026-09-28"), att(true, "2026-09-29")], schedule: { due_day: "2026-09-30", bucket: "1d", reason: "correct-after-wrong" } },
    // practiced learning, never wrong
    "fraction-3-8": { status: MASTERY.LEARNING, attempts: [att(true, "2026-09-29")], schedule: { due_day: "2026-09-30", bucket: "1d", reason: "first-correct" } },
    // stable practiced (recovered mistake)
    "square-12": { status: MASTERY.STABLE, attempts: [att(false, "2026-09-01"), att(true, "2026-09-02"), att(true, "2026-09-03"), att(true, "2026-09-05")], schedule: { due_day: "2026-10-05", bucket: "5-7d", reason: "became-stable" } },
    // stable practiced, never wrong
    "square-10": { status: MASTERY.STABLE, attempts: [att(true, "2026-09-01"), att(true, "2026-09-02"), att(true, "2026-09-04")], schedule: { due_day: "2026-10-05", bucket: "5-7d", reason: "became-stable" } },
    // a relation record without attempts is NOT practiced
    "square-6": { status: MASTERY.UNPRACTICED, attempts: [] },
  };
}
const snapshot = (value) => JSON.stringify(value);

test("only practiced relations are candidates; unpracticed excluded", () => {
  const relations = fixture();
  const ids = listPrintCandidates(catalog, relations).map((c) => c.id);
  assert.deepEqual(new Set(ids), new Set(["square-17", "product-12-7", "fraction-3-8", "square-12", "square-10"]));
  assert.equal(ids.includes("square-6"), false, "no attempts → not a candidate");
  assert.equal(ids.includes("square-15"), false, "absent → not a candidate");
  assert.deepEqual(listPrintCandidates(catalog, {}), []);
  assert.equal(buildPrintSelector(catalog, {}).empty, true);
  assert.equal(buildPrintSelector(catalog, {}).noCandidates, "先练一小段，之后才能选题打印。");
});

test("current mistakes are selected by default, using the Mistake Book predicate", () => {
  const relations = fixture();
  const selected = defaultPrintSelection(catalog, relations);
  assert.deepEqual(selected, listCurrentMistakeIds(catalog, relations));
  assert.deepEqual(new Set(selected), new Set(["square-17", "product-12-7"]));
  // wrong earlier → latest correct → not stable: still a current mistake, still default-selected
  assert.ok(selected.includes("product-12-7"));
  const selector = buildPrintSelector(catalog, relations, { selectedIds: selected });
  const byId = Object.fromEntries([...selector.currentMistakes, ...selector.others].map((c) => [c.id, c]));
  assert.equal(byId["product-12-7"].selected, true);
  assert.equal(byId["product-12-7"].label, "当前错题");
  // stable practiced and practiced never-mistakes: candidates but unselected
  for (const id of ["square-12", "square-10", "fraction-3-8"]) {
    assert.equal(byId[id].selected, false, id);
    assert.equal(byId[id].label, "最近答对", id);
  }
  assert.equal(selector.selectedLabel, "已选 2 题");
  assert.deepEqual(selector.currentMistakes.map((c) => c.id), selected, "current mistakes listed first, checked");
});

test("manual selectedIds alone determine the A4 sheet; answers stay separate", () => {
  const relations = fixture();
  let selected = defaultPrintSelection(catalog, relations);
  selected = togglePrintSelection(catalog, relations, selected, "square-17"); // uncheck a default mistake
  selected = togglePrintSelection(catalog, relations, selected, "square-10"); // add a stable practiced one
  const sheet = buildA4Sheet(catalog, relations, { selectedIds: selected, day: "9月30日" });
  assert.deepEqual(new Set(sheet.prompts.map((p) => p.id)), new Set(["product-12-7", "square-10"]));
  assert.equal(sheet.prompts.length, 2);
  assert.equal(sheet.prompts.every((p) => !("answer" in p) && !("statusLabel" in p)), true);
  assert.equal(sheet.answerKey.length, 2);
  assert.equal(sheet.day, "9月30日");
  const paper = JSON.stringify({ t: sheet.title, s: sheet.subtitle, d: sheet.domain, p: sheet.prompts });
  for (const banned of ["错题", "正确率", "错了", "错过"]) assert.equal(paper.includes(banned), false, banned);
  assert.equal(/\d+\s*次/.test(paper), false, "no mistake counts");
  assert.ok(sheet.subtitle.includes("没有答案"));
});

test("zero selected gives no paper page", () => {
  const relations = fixture();
  const sheet = buildA4Sheet(catalog, relations, { selectedIds: [] });
  assert.equal(sheet.empty, true);
  assert.deepEqual(sheet.prompts, []);
  assert.equal(sheet.emptyMessage, "选出要印的题。纸上没有答案。");
  assert.equal(buildA4Sheet(catalog, relations).empty, true, "no selectedIds → nothing, never a whole pool");
});

test("unknown and unpracticed ids cannot be injected into the sheet", () => {
  const relations = fixture();
  const sheet = buildA4Sheet(catalog, relations, {
    selectedIds: ["square-17", "not-a-relation", "square-6", "square-15", "square-17", 42, null, "__proto__"],
  });
  assert.deepEqual(sheet.prompts.map((p) => p.id), ["square-17"]);
  assert.deepEqual(sanitizePrintSelection(catalog, relations, ["nope", "square-15"]), []);
  assert.deepEqual(togglePrintSelection(catalog, relations, [], "square-15"), [], "toggle ignores unpracticed");
  assert.deepEqual(togglePrintSelection(catalog, relations, [], "bogus"), []);
});

test("selection never mutates relations, mastery, attempts or schedule", () => {
  const relations = fixture();
  const before = snapshot(relations);
  let selected = defaultPrintSelection(catalog, relations);
  selected = togglePrintSelection(catalog, relations, selected, "square-10");
  selected = selectCurrentMistakes(catalog, relations, selected, "squares");
  selected = clearPrintSelection(catalog, relations, selected, "products");
  buildPrintSelector(catalog, relations, { selectedIds: selected, domain: "fraction_decimal" });
  buildA4Sheet(catalog, relations, { selectedIds: selected, day: "9月30日" });
  assert.equal(snapshot(relations), before);
  assert.deepEqual(new Set(listCurrentMistakeIds(catalog, relations)), new Set(["square-17", "product-12-7"]), "mistake book unchanged");
  assert.equal(relations["product-12-7"].status, MASTERY.LEARNING);
});

test("domain filter narrows the view only; selections in other domains survive", () => {
  const relations = fixture();
  const selected = [...defaultPrintSelection(catalog, relations), "fraction-3-8"];
  const frozen = [...selected];
  const view = buildPrintSelector(catalog, relations, { selectedIds: selected, domain: "fraction_decimal" });
  assert.deepEqual([...view.currentMistakes, ...view.others].map((c) => c.id), ["fraction-3-8"]);
  assert.equal(view.selectedCount, 3, "count still covers every domain");
  assert.deepEqual(selected, frozen, "the filter did not touch the selection");
  // clearing inside a filtered domain keeps the others
  const cleared = clearPrintSelection(catalog, relations, selected, "fraction_decimal");
  assert.deepEqual(new Set(cleared), new Set(["square-17", "product-12-7"]));
  // 错题全选 inside a filter adds only that domain's current mistakes
  const onlySquares = selectCurrentMistakes(catalog, relations, [], "squares");
  assert.deepEqual(onlySquares, ["square-17"]);
  const all = selectCurrentMistakes(catalog, relations, ["square-10"]);
  assert.deepEqual(new Set(all), new Set(["square-10", "square-17", "product-12-7"]));
  assert.deepEqual(clearPrintSelection(catalog, relations, all), [], "清空 with no filter clears all");
  const sheet = buildA4Sheet(catalog, relations, { selectedIds: selected });
  assert.deepEqual(new Set(sheet.prompts.map((p) => p.id)), new Set(frozen));
});
