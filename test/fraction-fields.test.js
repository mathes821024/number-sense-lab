/**
 * docs/curriculum/09_fraction_fields_contract.md — decimal → fraction is two
 * boxes (numerator over a bar over denominator), no 「/」 anywhere a student
 * looks. Acceptance 1–8 over the shared model, Core judging and the shared
 * training flow (the same steps h5/ and the app/ pages run).
 */
import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  emptyFields,
  focusField,
  typeDigit,
  eraseDigit,
  fieldsAnswer,
  promptStem,
  hasBlankFraction,
  FIELD_DIGITS,
  normalizeField,
  fieldSize,
} from "../src/core/fraction-fields.js";
import { setPositionLabel } from "../src/core/progress-label.js";
import { composeFractionFields, judgeAnswer } from "../src/core/answer.js";
import { feedbackFor } from "../src/core/feedback.js";
import { loadCoreCatalog, getRelationById, verifyContentCounts } from "../src/core/content.js";
import { buildA4Sheet } from "../src/core/a4.js";
import { getActiveLearner, withActiveLearner } from "../src/core/store.js";
import { startSession } from "../src/core/session.js";
import { STATE_KEY } from "../src/adapter/storage-contract.js";
import { createBrowserStore } from "../app/platform/h5/browser-store.js";
import { createTrainingFlow, extraKeyFor } from "../app/pages/train/flow.js";
import { mathTokens } from "../app/components/math/tokens.js";
import { formatMath, listPromptHtml, printPromptHtml } from "../h5/math-text.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const catalog = loadCoreCatalog();
const byId = (id) => getRelationById(id, catalog);
const DAY = "2026-10-02";
const FIELDS_IDS = catalog.filter((r) => r.answer_type === "fraction_fields").map((r) => r.id);

function memStore() {
  const map = new Map();
  const storage = {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k),
  };
  return createBrowserStore(storage, STATE_KEY, { createId: () => "L-ff", today: () => DAY });
}

/** A stored set over chosen items, entered through 「继续」 — the student is on the first. */
function flowOver(ids) {
  const store = memStore();
  const rootState = store.read();
  const learner = getActiveLearner(rootState);
  const session = { ...startSession({ mode: "daily", day: DAY, catalog, relations: {}, size: ids.length, seed: 1 }), queue: ids, targetCount: ids.length };
  store.write(withActiveLearner(rootState, { ...learner, activeSession: session }));
  let clock = 0;
  const flow = createTrainingFlow({ store, catalog, today: () => DAY, now: () => (clock += 1500) });
  flow.resume();
  return { flow, store };
}

/** Numerator box, tap the denominator box, denominator box — on-screen keys only. */
function enter(flow, numerator, denominator) {
  flow.focus("numerator");
  for (const ch of numerator) flow.input(ch);
  flow.focus("denominator");
  for (const ch of denominator) flow.input(ch);
}

const recorded = (flow, id) => flow.state.relations[id]?.attempts?.length || 0;

// ---------- the content ----------

test("content: exactly the 27 ifraction-* items are fraction_fields, prompt 「<decimal> = ?/?」", () => {
  assert.equal(FIELDS_IDS.length, 27);
  assert.ok(FIELDS_IDS.every((id) => /^ifraction-\d+-\d+$/.test(id)));
  assert.deepEqual(FIELDS_IDS, catalog.filter((r) => r.id.startsWith("ifraction-")).map((r) => r.id));
  for (const id of FIELDS_IDS) {
    const r = byId(id);
    const decimal = r.relation.split(" = ")[0];
    assert.equal(r.prompt, `${decimal} = ?/?`, id);
    assert.equal(r.relation, `${decimal} = ${r.canonical_answer}`, id);
    assert.equal(r.fractionFields, true, id);
    assert.equal(r.direction, "inverse", id);
    assert.equal(extraKeyFor(r), null, `${id}: no 「/」 key`);
  }
  assert.equal(byId("ifraction-1-8").prompt, "0.125 = ?/?");
  assert.equal(byId("ifraction-1-8").canonical_answer, "1/8");
  // fraction → decimal is unchanged: decimal keypad, 「1/8 = ?」.
  assert.equal(byId("fraction-1-8").answer_type, "decimal");
  assert.equal(byId("fraction-1-8").prompt, "1/8 = ?");
  assert.equal(byId("fraction-1-7").answer_type, "decimal_repeating");
  assert.equal(catalog.filter((r) => r.domain === "fraction_decimal").length, 58);
  assert.equal(catalog.length, 173);
  assert.equal(byId("pow-5-3"), null);
  const counts = verifyContentCounts(catalog);
  assert.equal(counts.decimalToFraction, 27);
  assert.equal(counts.total, 173);
});

// ---------- the shared input model ----------

test("model: focus starts on the numerator; a tap moves it; digits go only into the focused box", () => {
  let f = emptyFields();
  assert.deepEqual(f, { numerator: "", denominator: "", focus: "numerator" });
  f = typeDigit(f, "3");
  assert.deepEqual(f, { numerator: "3", denominator: "", focus: "numerator" });
  f = focusField(f, "denominator");
  f = typeDigit(f, "5");
  assert.deepEqual(f, { numerator: "3", denominator: "5", focus: "denominator" });
  assert.equal(focusField(f, "denominator"), null, "already there");
  assert.equal(focusField(f, "other"), null);
  f = focusField(f, "numerator");
  f = typeDigit(f, "1");
  assert.deepEqual(f, { numerator: "31", denominator: "5", focus: "numerator" });
});

test("model: only digits — no 「.」, 「-」 or 「/」", () => {
  const f = emptyFields();
  for (const key of [".", "-", "/", "e", "+", " ", "", "12"]) assert.equal(typeDigit(f, key), null, JSON.stringify(key));
});

test("regression 6: no 4-digit cap — long entries are accepted up to the technical guard only", () => {
  let f = emptyFields();
  for (const ch of "12345") f = typeDigit(f, ch);
  assert.equal(f.numerator, "12345", "a 5th digit is accepted (no 4-digit cap)");
  for (const ch of "6789") f = typeDigit(f, ch);
  assert.equal(f.numerator, "123456789");
  // The only limit is technical: 15 significant digits stay an exact JS integer.
  assert.equal(FIELD_DIGITS, 15);
  assert.ok(Number.isSafeInteger(Number("9".repeat(FIELD_DIGITS))));
  let full = emptyFields();
  for (let i = 0; i < FIELD_DIGITS; i += 1) full = typeDigit(full, "9");
  assert.equal(full.numerator.length, FIELD_DIGITS);
  assert.equal(typeDigit(full, "9"), null, "16th significant digit: guard");
  // Leading zeros never count against it: they are not kept.
  let z = emptyFields();
  for (let i = 0; i < 40; i += 1) z = typeDigit(z, "0");
  assert.equal(z.numerator, "0");
  // Sizing: 1–4 digits normal; longer input takes ONE moderate step, no further tier.
  for (const v of ["", "1", "12", "100", "1000"]) assert.equal(fieldSize(v), "", v);
  for (const v of ["12345", "1234567890", "9".repeat(FIELD_DIGITS)]) assert.equal(fieldSize(v), "long", v);
});

test("technical guard: a blocked 16th digit is a quiet no-op in the shared flow — no crash, nothing changes", () => {
  const { flow } = flowOver(["ifraction-1-2"]);
  flow.focus("numerator");
  for (const ch of "9".repeat(FIELD_DIGITS)) assert.equal(flow.input(ch), true);
  const before = flow.view().fields;
  assert.equal(flow.input("9"), false, "16th digit ignored");
  assert.deepEqual(flow.view().fields, before);
  assert.equal(flow.view().fields.numerator.length, FIELD_DIGITS);
  // Still fully usable afterwards: erase works, the other box works, submit judges.
  assert.equal(flow.erase(), true);
  assert.equal(flow.view().fields.numerator.length, FIELD_DIGITS - 1);
  flow.focus("denominator");
  assert.equal(flow.input("2"), true);
  assert.doesNotThrow(() => flow.submit());
});

/**
 * fraction_fields targets common middle-school fractions. Every fraction in the
 * catalog — every canonical answer, and every 「a/b」 anywhere in an item
 * (prompt, relation, hook, pattern, frames) — uses short integers: at most 3
 * digits, far below the FIELD_DIGITS technical guard. Today: canonical answers
 * max 2 digits (12/25), anywhere max 3 digits (48/100).
 */
test("catalog: every fraction numerator/denominator is a short integer (≤ 3 digits), far below the technical guard", () => {
  const re = /(\d+)\/(\d+)/g;
  const digitsIn = (text) => [...String(text).matchAll(re)].flatMap((m) => [m[1].length, m[2].length]);
  const fieldsAnswers = catalog.filter((r) => r.answer_type === "fraction_fields").map((r) => r.canonical_answer);
  assert.equal(fieldsAnswers.length, 27);
  for (const a of fieldsAnswers) assert.match(a, /^[1-9]\d{0,2}\/[1-9]\d{0,2}$/, a);
  const canonical = catalog.flatMap((r) => digitsIn(r.canonical_answer));
  const anywhere = catalog.flatMap((r) => digitsIn(JSON.stringify(r)));
  assert.ok(canonical.length >= 54 && anywhere.length > canonical.length);
  const maxCanonical = Math.max(...canonical);
  const maxAnywhere = Math.max(...anywhere);
  assert.ok(maxCanonical <= 3 && maxAnywhere <= 3, `max digits: canonical ${maxCanonical}, anywhere ${maxAnywhere}`);
  assert.ok(maxAnywhere * 5 <= FIELD_DIGITS, "far below the guard");
  assert.equal(maxCanonical, 2, "canonical fraction answers today: ≤ 2 digits (12/25)");
  assert.equal(maxAnywhere, 3, "fractions anywhere in an item today: ≤ 3 digits (48/100)");
});

test("regression 1: leading zeros are dropped from what a box shows (02 → 2, 004 → 4); a lone 0 may stay", () => {
  assert.equal(normalizeField("02"), "2");
  assert.equal(normalizeField("004"), "4");
  assert.equal(normalizeField("0"), "0");
  assert.equal(normalizeField("00"), "0");
  assert.equal(normalizeField("10"), "10", "a zero after a digit is a digit");
  assert.equal(normalizeField("100"), "100");
  let f = emptyFields();
  f = typeDigit(f, "0");
  assert.equal(f.numerator, "0", "a single 0 stays while editing");
  f = typeDigit(f, "2");
  assert.equal(f.numerator, "2", "0 then 2 shows 2");
  f = focusField(f, "denominator");
  for (const ch of "004") f = typeDigit(f, ch);
  assert.deepEqual(f, { numerator: "2", denominator: "4", focus: "denominator" }, "02 over 004 shows 2 over 4");
  assert.equal(fieldsAnswer(f), "2/4", "never reduced");
});

test("model: backspace deletes only in the focused box; an empty box keeps the focus (no jump)", () => {
  let f = { numerator: "12", denominator: "34", focus: "denominator" };
  f = eraseDigit(f);
  assert.deepEqual(f, { numerator: "12", denominator: "3", focus: "denominator" });
  f = eraseDigit(f);
  assert.deepEqual(f, { numerator: "12", denominator: "", focus: "denominator" });
  assert.equal(eraseDigit(f), null, "empty: nothing happens");
  assert.equal(f.focus, "denominator");
  assert.equal(f.numerator, "12", "the other box is untouched");
});

test("model: both boxes become ONE judging string 「n/d」 by integer value, or \"\" (not an attempt)", () => {
  assert.equal(fieldsAnswer({ numerator: "1", denominator: "2" }), "1/2");
  assert.equal(fieldsAnswer({ numerator: "01", denominator: "02" }), "1/2");
  assert.equal(fieldsAnswer({ numerator: "002", denominator: "0004" }), "2/4");
  assert.equal(fieldsAnswer({ numerator: "", denominator: "2" }), "");
  assert.equal(fieldsAnswer({ numerator: "1", denominator: "" }), "");
  assert.equal(fieldsAnswer({ numerator: "1", denominator: "0" }), "");
  assert.equal(fieldsAnswer({ numerator: "1", denominator: "00" }), "");
  assert.equal(fieldsAnswer({ numerator: "0", denominator: "2" }), "", "0 is not a positive integer");
  assert.equal(composeFractionFields("1.5", "2"), "");
  assert.equal(composeFractionFields("-1", "2"), "");
  assert.equal(composeFractionFields("1/2", "3"), "");
});

test("prompt: the training stem drops 「?/?」 (the boxes follow it)", () => {
  assert.equal(promptStem("0.125 = ?/?"), "0.125 =");
  assert.equal(hasBlankFraction("0.125 = ?/?"), true);
  assert.equal(hasBlankFraction("1/8 = ?"), false);
  assert.equal(promptStem("1/8 = ?"), "1/8 = ?");
});

// ---------- acceptance 1–7 through the shared training flow (real Core) ----------

test("acceptance 1: 0.5 → 1/2 is correct (recorded once)", () => {
  const { flow } = flowOver(["ifraction-1-2", "square-6"]);
  assert.equal(flow.view().item.prompt, "0.5 = ?/?");
  enter(flow, "1", "2");
  assert.equal(flow.submit(), "correct");
  assert.equal(flow.view().feedback.relation, "0.5 = 1/2");
  assert.equal(recorded(flow, "ifraction-1-2"), 1);
  assert.equal(flow.state.relations["ifraction-1-2"].attempts[0].correct, true);
  assert.equal(judgeAnswer(byId("ifraction-1-2"), composeFractionFields("1", "2")).kind, "correct");
});

test("acceptance 2: 0.5 → 2/4 is needs_simplification (no record, no mistake, boxes stay editable)", () => {
  const { flow } = flowOver(["ifraction-1-2", "square-6"]);
  enter(flow, "2", "4");
  assert.equal(flow.submit(), "nudge");
  const v = flow.view();
  assert.equal(v.screen, "train", "stays on the question");
  assert.equal(v.nudge, "2/4 和 1/2 一样大，再约到最简：1/2。");
  assert.equal(recorded(flow, "ifraction-1-2"), 0);
  assert.equal(flow.session.answered, 0);
  assert.equal(judgeAnswer(byId("ifraction-1-2"), "2/4").kind, "needs_simplification");
  // Still editable: fix both boxes and resubmit.
  flow.erase();
  flow.input("2");
  flow.focus("numerator");
  flow.erase();
  flow.input("1");
  assert.deepEqual(flow.view().fields, { numerator: "1", denominator: "2", focus: "numerator" });
  assert.equal(flow.submit(), "correct");
  assert.equal(recorded(flow, "ifraction-1-2"), 1);
});

test("acceptance 3: 0.5 → 3/5 is incorrect (recorded; Wrong shows the relation)", () => {
  const { flow } = flowOver(["ifraction-1-2", "square-6"]);
  enter(flow, "3", "5");
  assert.equal(flow.submit(), "wrong");
  assert.equal(flow.view().feedback.relation, "0.5 = 1/2");
  assert.equal(recorded(flow, "ifraction-1-2"), 1);
  assert.equal(flow.state.relations["ifraction-1-2"].attempts[0].correct, false);
  assert.equal(judgeAnswer(byId("ifraction-1-2"), "3/5").outcome, "incorrect");
});

for (const [n, label, num, den] of [
  [4, "numerator empty", "", "2"],
  [5, "denominator empty", "1", ""],
  [6, "denominator 0", "1", "0"],
]) {
  test(`acceptance ${n}: ${label} → no attempt recorded, stay with 「先写一个分数」`, () => {
    const { flow, store } = flowOver(["ifraction-1-2", "square-6"]);
    enter(flow, num, den);
    assert.equal(flow.submit(), "nudge");
    const v = flow.view();
    assert.equal(v.screen, "train");
    assert.equal(v.nudge, "先写一个分数");
    assert.equal(flow.state.relations["ifraction-1-2"], undefined, "nothing recorded");
    assert.equal(getActiveLearner(store.read()).relations["ifraction-1-2"], undefined, "nothing stored");
    assert.equal(flow.session.answered, 0);
    assert.equal(feedbackFor(byId("ifraction-1-2"), judgeAnswer(byId("ifraction-1-2"), composeFractionFields(num, den)).kind).record, false);
  });
}

test("acceptance 4–6 also: numerator 0 and both empty are not attempts", () => {
  for (const [num, den] of [["0", "2"], ["", ""], ["00", "5"]]) {
    const { flow } = flowOver(["ifraction-1-2"]);
    enter(flow, num, den);
    assert.equal(flow.submit(), "nudge", `${num}|${den}`);
    assert.equal(recorded(flow, "ifraction-1-2"), 0);
  }
});

test("acceptance 7: leading zeros are read by integer value (01/02 = 1/2, 02/04 = 2/4)", () => {
  const a = flowOver(["ifraction-1-2", "square-6"]).flow;
  enter(a, "01", "02");
  assert.deepEqual(a.view().fields, { numerator: "1", denominator: "2", focus: "denominator" }, "regression 3: 01 over 02 shows 1 over 2");
  assert.equal(a.submit(), "correct");
  assert.equal(recorded(a, "ifraction-1-2"), 1);
  const b = flowOver(["ifraction-1-2", "square-6"]).flow;
  enter(b, "02", "04");
  assert.deepEqual(b.view().fields, { numerator: "2", denominator: "4", focus: "denominator" }, "regression 1: 02 over 04 shows 2 over 4, not reduced");
  assert.equal(b.submit(), "nudge", "regression 2: needs_simplification");
  assert.deepEqual(b.view().fields, { numerator: "2", denominator: "4", focus: "denominator" }, "regression 5: no auto-simplify after the hint");
  assert.equal(recorded(b, "ifraction-1-2"), 0);
  assert.equal(b.view().nudge, "2/4 和 1/2 一样大，再约到最简：1/2。");
  const c = flowOver(["ifraction-3-8"]).flow;
  enter(c, "003", "008");
  assert.equal(c.submit(), "correct");
});

test("physical keyboard: a 「/」 or 「.」 key does nothing in the boxes", () => {
  const { flow } = flowOver(["ifraction-1-2"]);
  assert.equal(flow.input("1", "physical_keyboard"), true);
  assert.equal(flow.input("/", "physical_keyboard"), false);
  assert.equal(flow.input(".", "physical_keyboard"), false);
  assert.equal(flow.input("-", "physical_keyboard"), false);
  assert.deepEqual(flow.view().fields, { numerator: "1", denominator: "", focus: "numerator" });
});

// ---------- acceptance 8: no slash fraction a student can see ----------

/** Visible text of rendered markup: tags and attributes (aria-label) removed. */
const visible = (html) => html.replace(/<[^>]*>/g, "").replaceAll("&amp;", "&").replaceAll("&quot;", '"').replaceAll("&lt;", "<").replaceAll("&gt;", ">");
const SLASH_FRACTION = /[\d?]\s*\/\s*[\d?]/;

function studentStrings(item) {
  const out = [item.prompt, item.relation, item.hook, item.pattern?.check, ...(item.pattern?.family || [])];
  for (const f of item.frames || []) out.push(f.title, f.detail);
  out.push(feedbackFor(item, "empty").message);
  if (item.fractionFields) {
    const [n, d] = item.canonical_answer.split("/").map(Number);
    const judged = judgeAnswer(item, `${n * 2}/${d * 2}`);
    out.push(feedbackFor(item, judged.kind, judged).message);
    out.push(promptStem(item.prompt));
  }
  return out.filter((t) => typeof t === "string");
}

test("acceptance 8: every student string of all 173 items renders with no slash fraction (h5/ and app/ renderers)", () => {
  let checked = 0;
  for (const item of catalog) {
    for (const text of studentStrings(item)) {
      const html = formatMath(text);
      assert.equal(SLASH_FRACTION.test(visible(html)), false, `h5/ ${item.id}: ${text} → ${visible(html)}`);
      for (const t of mathTokens(text)) {
        if (t.type === "text") assert.equal(SLASH_FRACTION.test(t.text), false, `app/ ${item.id}: ${text}`);
      }
      checked += 1;
    }
    // Lists (progress, mistake book, print picker) and the A4 question page.
    for (const html of [listPromptHtml(item.prompt), printPromptHtml(item.prompt)]) {
      assert.equal(SLASH_FRACTION.test(visible(html)), false, `list/print ${item.id}`);
      assert.equal(visible(html).includes("?/?"), false, `no 「?/?」 left in ${item.id}`);
      if (item.fractionFields) assert.equal(visible(html).includes("?"), false, `no 「?」 in ${item.id}`);
    }
  }
  assert.ok(checked > 900, `checked ${checked}`);
});

test("acceptance 8: a fraction_fields prompt is 「0.125 =」 + an empty bar in lists and on the A4 question page", () => {
  assert.equal(visible(listPromptHtml("0.125 = ?/?")).trim(), "0.125 =");
  assert.match(listPromptHtml("0.125 = ?/?"), /class="frac frac-blank"/);
  assert.match(printPromptHtml("0.125 = ?/?"), /class="frac frac-blank"/);
  assert.equal(printPromptHtml("0.125 = ?/?").includes('class="blank"'), false, "the bar is the blank");
  // fraction → decimal: 1/8 is a stacked fraction, then the blank line.
  assert.match(printPromptHtml("1/8 = ?"), /class="frac"[^>]*><span class="num">1<\/span><span class="den">8<\/span>/);
  assert.match(printPromptHtml("1/8 = ?"), /class="blank"/);
  // A4 answer page: the simplest fraction, stacked.
  const practiced = Object.fromEntries(FIELDS_IDS.map((id) => [id, { status: "learning", attempts: [{ correct: false, day: DAY, slow: false }] }]));
  const sheet = buildA4Sheet(catalog, practiced, { day: DAY, selectedIds: FIELDS_IDS });
  assert.equal(sheet.prompts.length, 27);
  for (const p of sheet.prompts) assert.equal(SLASH_FRACTION.test(visible(printPromptHtml(p.prompt))), false, p.id);
  const answers = sheet.answerKey || [];
  assert.equal(answers.length, 27);
  for (const a of answers) {
    const html = formatMath(a.relation);
    assert.equal(SLASH_FRACTION.test(visible(html)), false, a.id);
    assert.match(html, /class="frac"/, a.id);
  }
});

test("acceptance 8: no 「/」 key and no single-line fraction input in either shell", () => {
  const h5 = readFileSync(join(root, "h5/app.js"), "utf8");
  const keypad = readFileSync(join(root, "app/components/Keypad.jsx"), "utf8");
  const flow = readFileSync(join(root, "app/pages/train/flow.js"), "utf8");
  assert.equal(/data-digit="\/"/.test(h5), false);
  assert.equal(/"\/"/.test(keypad), false);
  assert.equal(/needsSlash/.test(h5 + keypad + flow), false);
  for (const item of catalog) assert.notEqual(extraKeyFor(item), "/", item.id);
  // ONE shared input component on H5 and WeChat, ONE shared model under it.
  const page = readFileSync(join(root, "app/pages/train/index.jsx"), "utf8");
  assert.match(page, /import FractionFields from "\.\.\/\.\.\/components\/FractionFields"/);
  assert.match(h5, /from "\.\.\/src\/core\/fraction-fields\.js"/);
  assert.match(flow, /from "\.\.\/\.\.\/\.\.\/src\/core\/fraction-fields\.js"/);
});

test("regression 4: denominator 0 (also typed 00 / 000) stays not an attempt; numerator 0 too", () => {
  for (const [num, den] of [["1", "0"], ["1", "000"], ["0", "2"], ["000", "5"]]) {
    const { flow } = flowOver(["ifraction-1-2"]);
    enter(flow, num, den);
    assert.equal(flow.submit(), "nudge", `${num}|${den}`);
    assert.equal(flow.view().nudge, "先写一个分数");
    assert.equal(recorded(flow, "ifraction-1-2"), 0);
  }
});

test("regression 5: no auto-simplify anywhere — 4 over 8 for 0.5 stays 4 over 8 and is needs_simplification", () => {
  const { flow } = flowOver(["ifraction-1-2"]);
  enter(flow, "04", "008");
  assert.deepEqual(flow.view().fields, { numerator: "4", denominator: "8", focus: "denominator" });
  assert.equal(flow.submit(), "nudge");
  assert.equal(flow.view().nudge, "4/8 和 1/2 一样大，再约到最简：1/2。");
  assert.deepEqual(flow.view().fields, { numerator: "4", denominator: "8", focus: "denominator" });
});

test("regression 7: the set position reads 「第 k 题 · 共 N 题」 — no 「2/10」-like fraction", () => {
  assert.equal(setPositionLabel(2, 10), "第 2 题 · 共 10 题");
  assert.equal(SLASH_FRACTION.test(setPositionLabel(2, 10)), false);
  assert.equal(setPositionLabel(10, 10).includes("/"), false);
  const h5 = readFileSync(join(root, "h5/app.js"), "utf8");
  const bar = readFileSync(join(root, "app/components/SetProgress.jsx"), "utf8");
  assert.match(h5, /id="set-count">\$\{setPositionLabel\(position, total\)\}</);
  assert.match(bar, /\{setPositionLabel\(position, total\)\}/);
  assert.equal(/\$\{position\} \/ \$\{total\}/.test(h5 + bar), false, "the old 「k / N」 is gone");
});
