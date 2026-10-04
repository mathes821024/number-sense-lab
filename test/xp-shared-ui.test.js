/**
 * Shared UI over the full V0.3 core: math rendering (same reading as h5/'s
 * formatMath), integer / decimal / fraction / repeating input, the
 * needs_simplification and empty "no record" rules, correct, wrong, the
 * 10-question set, stop / resume, entry_after, inverse items, Home modes and
 * write-protected memory-only mode. Pure modules only; the pages render these.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { formatMath, repeatingHtml, BLANK_FRACTION_HTML } from "../h5/math-text.js";
import { mathTokens, mathLabel, answerDisplay, repeatingToken } from "../app/components/math/tokens.js";
import { createTrainingFlow, CORRECT_PAUSE_MS, appendKey, extraKeyFor, resolveInputMode } from "../app/pages/train/flow.js";
import { homeMode, homeView } from "../app/pages/home/model.js";
import { createRecordKeeper } from "../app/pages/record.js";
import { createBrowserStore } from "../app/platform/h5/browser-store.js";
import { createWechatStore } from "../app/platform/wechat/wx-store.js";
import { STATE_KEY } from "../src/adapter/storage-contract.js";
import { loadCoreCatalog, getRelationById, isEntryUnlocked } from "../src/core/content.js";
import { getActiveLearner, withActiveLearner, emptyState } from "../src/core/store.js";
import { startSession } from "../src/core/session.js";
import { MASTERY } from "../src/core/mastery.js";
import { setPositionLabel } from "../src/core/progress-label.js";

const catalog = loadCoreCatalog();
const DAY = "2026-10-01";
const byId = (id) => getRelationById(id, catalog);

// ---------- math rendering: same tokens as h5/math-text.js ----------

function esc(v) {
  return String(v ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}
/** Our tokens written as h5/'s markup, so the two readings can be compared exactly. */
function tokensAsH5Html(value) {
  return mathTokens(value)
    .map((t) => {
      if (t.type === "text") return esc(t.text);
      if (t.type === "blank_fraction") return BLANK_FRACTION_HTML;
      if (t.type === "fraction")
        return `<span class="frac" aria-label="${t.numerator}/${t.denominator}"><span class="num">${t.numerator}</span><span class="den">${t.denominator}</span></span>`;
      const inner = t.digits.map((d) => (d.dot ? `<span class="rd">${esc(d.ch)}</span>` : esc(d.ch))).join("");
      return `<span class="rep" role="math" aria-label="${esc(t.label)}"><span aria-hidden="true">${esc(t.intPart)}.${inner}</span></span>`;
    })
    .join("");
}

test("math: every student-facing string in the 173 items reads exactly as h5/ formatMath", () => {
  let checked = 0;
  for (const item of catalog) {
    const texts = [item.prompt, item.relation, item.hook, item.canonical_answer, item.pattern?.check, ...(item.pattern?.family || [])];
    for (const f of item.frames || []) texts.push(f.title, f.detail);
    for (const text of texts.filter((t) => typeof t === "string")) {
      assert.equal(tokensAsH5Html(text), formatMath(text), `${item.id}: ${text}`);
      checked += 1;
    }
  }
  assert.equal(catalog.length, 173);
  assert.ok(checked > 600, `checked ${checked} strings`);
});

test("math: fraction tokens carry a bar (numerator over denominator), stored text unchanged", () => {
  const t = mathTokens("3/4 = ?");
  assert.deepEqual(t[0], { type: "fraction", numerator: "3", denominator: "4", label: "3/4" });
  assert.equal(mathLabel("1/8 = 0.125"), "1/8 = 0.125");
});

test("math: a fraction_fields prompt 「0.125 = ?/?」 reads as 0.125 = an empty fraction bar, never 「?/?」", () => {
  const t = mathTokens("0.125 = ?/?");
  assert.deepEqual(t, [{ type: "text", text: "0.125 = " }, { type: "blank_fraction", label: "分数" }]);
  const html = formatMath("0.125 = ?/?");
  assert.equal(html, `0.125 = ${BLANK_FRACTION_HTML}`);
  assert.equal(html.includes("?"), false);
  assert.match(BLANK_FRACTION_HTML, /class="frac frac-blank"[^>]*><span class="num"><\/span><span class="den"><\/span>/);
});

test("math: repeating decimals dot the first and last digit, no brackets shown", () => {
  const [one] = mathTokens("0.(6)");
  assert.deepEqual(one.digits, [{ ch: "6", dot: true }]);
  assert.equal(one.label, "0.6，6 循环");
  const [six] = mathTokens("1/7 = 0.(142857)").filter((t) => t.type === "repeating");
  assert.deepEqual(six.digits.map((d) => d.dot), [true, false, false, false, false, true]);
  assert.equal(six.label, "0.142857，142857 循环");
  assert.equal(mathTokens("0.(142857)").some((t) => t.type === "text" && /[()]/.test(t.text)), false);
});

test("answer box: plain digits, 0.( dotted block ) for repeating; fractions have no single answer box", () => {
  assert.deepEqual(answerDisplay(byId("square-6"), "36"), { kind: "plain", text: "36" });
  assert.deepEqual(answerDisplay(byId("fraction-1-3"), ""), { kind: "repeating", intPart: "0", token: null });
  const rep = answerDisplay(byId("fraction-1-3"), "3");
  assert.deepEqual(rep.token, repeatingToken("0", "3"));
  // Same markup h5/ shows in its answer box for the typed block.
  const t = rep.token;
  const inner = t.digits.map((d) => (d.dot ? `<span class="rd">${d.ch}</span>` : d.ch)).join("");
  assert.equal(`<span class="rep" role="math" aria-label="${t.label}"><span aria-hidden="true">0.${inner}</span></span>`, repeatingHtml("0", "3"));
});

// ---------- input rules (h5/app.js appendDigit) ----------

test("input: integer takes digits only (max 8); decimal takes one 「.」; no answer type takes 「/」", () => {
  const int = byId("square-6");
  const dec = byId("fraction-1-2");
  const frac = byId("ifraction-1-2");
  const rep = byId("fraction-1-3");
  assert.equal(extraKeyFor(int), null);
  assert.equal(extraKeyFor(dec), ".");
  assert.equal(extraKeyFor(frac), null, "fraction_fields: no 「/」 key");
  assert.equal(extraKeyFor(rep), null, "repeating: no new key");
  assert.equal(appendKey("3", ".", int), null);
  assert.equal(appendKey("3", "/", int), null);
  assert.equal(appendKey("12345678", "9", int), null);
  assert.equal(appendKey("0", ".", dec), "0.");
  assert.equal(appendKey("0.5", ".", dec), null);
  assert.equal(appendKey("0.5", "/", dec), null);
  assert.equal(appendKey("1", "/", frac), null);
  assert.equal(appendKey("1", ".", frac), null);
  assert.deepEqual(resolveInputMode(new Set(["physical_keyboard", "onscreen_keypad"])), { inputMode: "onscreen_keypad", mixedInput: true });
  assert.deepEqual(resolveInputMode(new Set(["physical_keyboard"])), { inputMode: "physical_keyboard", mixedInput: false });
});

// ---------- the flow over the real core ----------

function memStore(initialRoot) {
  const map = new Map(initialRoot ? [[STATE_KEY, JSON.stringify(initialRoot)]] : []);
  const storage = {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k),
  };
  const store = createBrowserStore(storage, STATE_KEY, { createId: () => "L-ui", today: () => DAY });
  return { store, storage, raw: () => map.get(STATE_KEY) };
}

/** A stored unfinished set over chosen items, entered through Home's 「继续」. */
function flowOver(ids, { relations = {}, store } = {}) {
  const base = store || memStore().store;
  const root = base.read();
  const learner = getActiveLearner(root);
  const s = startSession({ mode: "daily", day: DAY, relations, catalog, seed: "fixed" });
  const session = { ...s, queue: ids.slice(), targetCount: ids.length, finished: false };
  base.write(withActiveLearner(root, { ...learner, relations, activeSession: session }));
  let clock = 0;
  const flow = createTrainingFlow({ store: base, catalog, today: () => DAY, now: () => (clock += 1500) });
  flow.resume();
  return { flow, store: base };
}

/** Type an answer as a student would. A fraction_fields 「n/d」 is: numerator box, tap the denominator box, denominator. */
const typeAll = (flow, text, mode) => {
  if (flow.view().item?.fractionFields && text.includes("/")) {
    const [n, d] = text.split("/");
    flow.focus("numerator");
    [...n].forEach((ch) => flow.input(ch, mode));
    flow.focus("denominator");
    [...d].forEach((ch) => flow.input(ch, mode));
    return;
  }
  [...text].forEach((ch) => flow.input(ch, mode));
};
const answerFor = (item) => (item.answer_type === "decimal_repeating" ? item.canonical_answer.replace(/^\d+\.\((\d+)\)$/, "$1") : item.canonical_answer);

test("pause length is inside the 400–700ms contract", () => {
  assert.ok(CORRECT_PAUSE_MS >= 400 && CORRECT_PAUSE_MS <= 700);
});

test("training: 第 1 题 · 共 10 题, empty submit → 先写一个数 (no record), fraction → 先写一个分数", () => {
  const { store } = memStore();
  const flow = createTrainingFlow({ store, catalog, today: () => DAY });
  flow.begin("daily", null);
  const v = flow.view();
  assert.equal(v.screen, "train");
  assert.equal(setPositionLabel(v.position, v.total), "第 1 题 · 共 10 题");
  assert.equal(flow.submit(), "nudge");
  assert.equal(flow.view().nudge, v.item.answer_type === "fraction_fields" ? "先写一个分数" : "先写一个数");
  assert.equal(flow.view().screen, "train");
  assert.equal(flow.state.relations[v.item.id], undefined, "nothing recorded");
  const f = flowOver(["ifraction-1-2"]).flow;
  assert.equal(f.submit(), "nudge");
  assert.equal(f.view().nudge, "先写一个分数");
});

test("correct: recorded once through core, 「对」 feedback, next item after advance", () => {
  const { flow } = flowOver(["square-6", "square-7"]);
  typeAll(flow, "36");
  assert.equal(flow.submit(), "correct");
  const v = flow.view();
  assert.equal(v.screen, "correct");
  assert.equal(v.feedback.word, "对");
  assert.equal(v.feedback.relation, byId("square-6").relation);
  assert.equal(flow.input("1"), false, "input locked during the pause");
  assert.equal(flow.submit(), null, "no second judgement");
  assert.equal(flow.state.relations["square-6"].attempts.length, 1);
  assert.equal(flow.state.relations["square-6"].attempts[0].correct, true);
  assert.equal(flow.advance(), "train");
  assert.equal(flow.view().item.id, "square-7");
  assert.equal(flow.view().position, 2);
});

test("wrong: relation + hook, input locked, no retry, reappearance planned, next is a different item", () => {
  const { flow } = flowOver(["square-6", "square-7", "square-8", "square-9"]);
  typeAll(flow, "35");
  assert.equal(flow.submit(), "wrong");
  const v = flow.view();
  assert.equal(v.screen, "wrong");
  assert.equal(v.feedback.relation, byId("square-6").relation);
  assert.equal(v.feedback.hook, byId("square-6").hook);
  assert.equal(flow.input("6"), false);
  assert.equal(flow.submit(), null);
  const rel = flow.state.relations["square-6"];
  assert.equal(rel.attempts.length, 1);
  assert.equal(rel.attempts[0].correct, false);
  assert.ok(rel.schedule?.due_day, "core scheduled it");
  assert.ok(Object.keys(flow.session.reappearPlan).includes("square-6"), "reappearance planned by core");
  flow.advance();
  assert.notEqual(flow.view().item.id, "square-6");
});

test("needs_simplification: no record, sticky hint until resubmit, then the simplest form is correct", () => {
  const { flow } = flowOver(["ifraction-1-2", "square-6"]);
  typeAll(flow, "2/4");
  assert.deepEqual(flow.view().fields, { numerator: "2", denominator: "4", focus: "denominator" });
  assert.equal(flow.submit(), "nudge");
  const v = flow.view();
  assert.equal(v.screen, "train");
  assert.equal(v.nudge, "2/4 和 1/2 一样大，再约到最简：1/2。");
  assert.equal(v.nudgeSticky, true);
  assert.equal(flow.state.relations["ifraction-1-2"], undefined, "zero records");
  assert.equal(flow.session.answered, 0);
  // The boxes stay editable: clear the denominator, then the numerator.
  flow.erase();
  flow.erase();
  assert.equal(flow.view().fields.denominator, "");
  assert.equal(flow.view().fields.focus, "denominator", "an empty box keeps the focus");
  flow.focus("numerator");
  flow.erase();
  assert.equal(flow.view().nudge, "2/4 和 1/2 一样大，再约到最简：1/2。", "hint stays while editing");
  typeAll(flow, "1/2");
  assert.equal(flow.submit(), "correct");
  assert.equal(flow.state.relations["ifraction-1-2"].attempts.length, 1);
});

test("decimal and repeating answers go through core judging", () => {
  const { flow } = flowOver(["fraction-1-2", "fraction-1-3", "fraction-1-7"]);
  typeAll(flow, ".5");
  assert.equal(flow.view().answer, ".5");
  assert.equal(flow.submit(), "correct", ".5 = 0.5");
  flow.advance();
  typeAll(flow, "3");
  assert.equal(flow.submit(), "correct", "block 3 for 0.(3)");
  flow.advance();
  typeAll(flow, "142856");
  assert.equal(flow.submit(), "wrong");
  assert.equal(flow.view().feedback.canonical_answer, "0.(142857)");
});

test("inverse relation (decimal → fraction) is a fraction answer with its own record", () => {
  const item = byId("ifraction-1-4");
  assert.equal(item.direction, "inverse");
  assert.equal(item.answer_type, "fraction_fields");
  const { flow } = flowOver(["ifraction-1-4"]);
  assert.equal(flow.view().extraKey, null, "no 「/」 key");
  typeAll(flow, "1/4");
  assert.equal(flow.submit(), "correct");
  assert.ok(flow.state.relations["ifraction-1-4"]);
  assert.equal(flow.state.relations["fraction-1-4"], undefined, "forward relation untouched");
});

test("entry_after: a fresh daily set never starts a locked inverse item; core unlocks it once the counterpart is stable", () => {
  for (let i = 0; i < 5; i += 1) {
    const { store } = memStore();
    let t = i * 1000;
    const flow = createTrainingFlow({ store, catalog, today: () => DAY, clock: () => (t += 1) });
    flow.begin("daily", null);
    for (const id of flow.session.queue) assert.ok(isEntryUnlocked(byId(id), {}), `${id} unlocked`);
  }
  const relations = { "square-6": { status: MASTERY.STABLE, attempts: [{ correct: true, day: "2026-09-01", slow: false }] } };
  assert.equal(isEntryUnlocked(byId("isquare-6"), relations), true);
  assert.equal(isEntryUnlocked(byId("isquare-6"), {}), false);
});

test("a full set of 10 ends on the end page; Home then says 今天这段练完了 / 看看这次", () => {
  const { store } = memStore();
  const flow = createTrainingFlow({ store, catalog, today: () => DAY });
  flow.begin("daily", null);
  let n = 0;
  while (flow.view().screen === "train") {
    const item = flow.view().item;
    typeAll(flow, answerFor(item));
    assert.equal(flow.submit(), "correct", item.id);
    flow.advance();
    n += 1;
  }
  assert.equal(n, 10);
  const v = flow.view();
  assert.equal(v.screen, "end");
  assert.equal(v.result.total, 10);
  assert.equal(v.result.correct, 10);
  assert.equal(v.result.completed, true);
  assert.equal(flow.state.activeSession, null);
  assert.equal(homeMode(flow.state, DAY), "done");
  const home = homeView(flow.state, DAY);
  assert.equal(home.title, "今天这段练完了");
  assert.equal(home.cta.label, "看看这次");
  assert.equal(home.secondary.label, "再练一小段");
});

test("stop / resume: 先停一下 → 继续做 keeps the answer; leaving mid-set resumes at the next item; 先停 ends early", () => {
  const { store } = memStore();
  const flow = createTrainingFlow({ store, catalog, today: () => DAY });
  flow.begin("daily", null);
  const first = flow.view().item;
  typeAll(flow, answerFor(first));
  flow.submit();
  flow.advance();
  typeAll(flow, "1");
  assert.equal(flow.pause(), true);
  assert.equal(flow.view().screen, "pause");
  assert.equal(flow.input("2"), false, "no input under the dialog");
  flow.unpause();
  assert.equal(flow.view().screen, "train");
  assert.equal(flow.view().answer, "1", "answer kept");
  // App closed here. Home shows 还有一小段 / 继续刚才的练习.
  const learner = getActiveLearner(store.read());
  assert.equal(homeMode(learner, DAY), "paused");
  assert.equal(homeView(learner, DAY).cta.label, "继续刚才的练习");
  assert.equal(homeView(learner, DAY).lede, "刚才练到一半，继续就好。");
  assert.deepEqual(homeView(learner, DAY).ledeLines, ["刚才练到一半，", "继续就好。"], "two fixed lede lines");
  assert.equal(homeView(learner, DAY).ledeLines.join(""), homeView(learner, DAY).lede);
  assert.equal(homeView(learner, DAY).secondary, null, "one clear action on the resume hero");
  const again = createTrainingFlow({ store, catalog, today: () => DAY });
  again.resume();
  assert.equal(again.view().position, 2);
  assert.deepEqual(again.session.queue, flow.session.queue, "same set, not rebuilt");
  // Pause from the wrong feedback returns to the same wrong feedback.
  const item = again.view().item;
  typeAll(again, item.canonical_answer === "1" ? "2" : "1");
  assert.equal(again.submit(), "wrong");
  again.pause();
  again.unpause();
  assert.equal(again.view().screen, "wrong");
  again.pause();
  again.stop();
  const end = again.view();
  assert.equal(end.screen, "end");
  assert.equal(end.result.earlyStop, true);
  assert.equal(end.result.total, 2);
  assert.equal(getActiveLearner(store.read()).activeSession, null);
  assert.equal(homeMode(getActiveLearner(store.read()), DAY), "default", "an early stop is not 'done'");
});

test("restart from the pause screen (重新开始一小段, moved from Home) uses the same flow.restart", () => {
  const { store } = memStore();
  const flow = createTrainingFlow({ store, catalog, today: () => DAY, clock: () => 1 });
  flow.begin("daily", null);
  const first = flow.session.id;
  typeAll(flow, answerFor(flow.view().item));
  flow.submit();
  flow.advance();
  assert.equal(flow.pause(), true);
  flow.restart("daily", null);
  assert.equal(flow.view().screen, "train");
  assert.equal(flow.view().position, 1);
  assert.equal(flow.session.answered, 0);
  assert.ok(first, "a set was running before the restart");
  const learner = getActiveLearner(store.read());
  assert.equal(learner.sessions.length, 0, "the dropped set is not summarised (same as Home's restart was)");
  assert.equal(Object.keys(learner.relations).length, 1, "the answered attempt stays");
});

test("restart (重新开始一小段) drops the unfinished set and starts a new one", () => {
  const { store } = memStore();
  const flow = createTrainingFlow({ store, catalog, today: () => DAY, clock: () => 1 });
  flow.begin("daily", null);
  const firstId = flow.session.id;
  typeAll(flow, answerFor(flow.view().item));
  flow.submit();
  const again = createTrainingFlow({ store, catalog, today: () => DAY, clock: () => 2 });
  again.restart("daily", null);
  assert.equal(again.view().position, 1);
  assert.equal(again.session.answered, 0);
  assert.equal(getActiveLearner(store.read()).sessions.length, 0, "the dropped set is not summarised");
  assert.ok(firstId);
});

test("write-protected: a corrupt record is never touched; the app keeps working in memory across pages", () => {
  for (const make of [
    (raw) => {
      const map = new Map([[STATE_KEY, raw]]);
      const storage = { getItem: (k) => map.get(k) ?? null, setItem: (k, v) => map.set(k, v), removeItem: (k) => map.delete(k) };
      return { store: createBrowserStore(storage, STATE_KEY, { createId: () => "tmp" }), raw: () => map.get(STATE_KEY) };
    },
    (raw) => {
      const map = new Map([[STATE_KEY, raw]]);
      const api = { getStorageSync: (k) => map.get(k) ?? "", setStorageSync: (k, v) => map.set(k, v), removeStorageSync: (k) => map.delete(k) };
      return { store: createWechatStore(api, STATE_KEY, { createId: () => "tmp" }), raw: () => map.get(STATE_KEY) };
    },
  ]) {
    const original = '{"version":9,"learners":{}}';
    const t = make(original);
    const record = createRecordKeeper(t.store);
    assert.equal(record.writeProtected, true);
    const flow = createTrainingFlow({ store: record, catalog, today: () => DAY });
    flow.begin("daily", null);
    typeAll(flow, answerFor(flow.view().item));
    assert.equal(flow.submit(), "correct");
    // Home (another page) reads the same in-memory progress.
    assert.equal(homeMode(getActiveLearner(record.read()), DAY), "paused");
    assert.equal(t.raw(), original, "stored text unchanged");
  }
});

test("home: default copy and the three secondary cards match h5/", () => {
  const learner = getActiveLearner(emptyState({ learnerId: "x", createdOn: DAY }));
  const v = homeView(learner, DAY);
  assert.equal(v.title, "和数字做朋友");
  assert.equal(v.lede, "把常会用到的数字关系，练到能直接想起来。");
  assert.deepEqual(v.cta, { label: "开始今天的练习", sub: "大约 5～10 分钟", action: "start-daily" });
  // A Mistake Book session does not count as today's practice.
  const mb = { ...learner, sessions: [{ mode: "mistake_book", day: DAY, completed: true }] };
  assert.equal(homeMode(mb, DAY), "default");
});

test("record keeper works without structuredClone (absent in the Mini Program JS engine) and never shares objects", () => {
  const saved = globalThis.structuredClone;
  globalThis.structuredClone = undefined;
  try {
    const map = new Map();
    const api = { getStorageSync: (k) => map.get(k) ?? "", setStorageSync: (k, v) => map.set(k, v), removeStorageSync: (k) => map.delete(k) };
    const record = createRecordKeeper(createWechatStore(api, STATE_KEY, { createId: () => "wx-1", today: () => DAY }));
    const flow = createTrainingFlow({ store: record, catalog, today: () => DAY });
    flow.begin("daily", null);
    typeAll(flow, answerFor(flow.view().item));
    assert.equal(flow.submit(), "correct");
    const a = record.read();
    a.learners = {};
    assert.notDeepEqual(record.read().learners, {}, "a read copy is not the kept state");
    assert.equal(JSON.parse(map.get(STATE_KEY)).version, 3);
  } finally {
    globalThis.structuredClone = saved;
  }
});

test("pause preserves the feedback context: pause from Wrong → 继续做 returns to the same Wrong feedback", () => {
  const { store } = memStore();
  const flow = createTrainingFlow({ store, catalog, today: () => DAY });
  flow.begin("daily", null);
  const item = flow.view().item;
  typeAll(flow, answerFor(item) === "1" ? "2" : "1");
  assert.equal(flow.submit(), "wrong");
  const before = flow.view();
  const attempts = getActiveLearner(store.read()).relations[item.id].attempts.length;
  assert.equal(flow.pause(), true);
  assert.equal(flow.view().screen, "pause");
  assert.equal(flow.unpause(), true);
  const after = flow.view();
  assert.equal(after.screen, "wrong", "back on the Wrong feedback, not a dead training screen");
  assert.equal(after.item.id, item.id);
  assert.equal(after.position, before.position);
  assert.deepEqual(after.feedback, before.feedback, "same relation / hook / frames");
  assert.equal(flow.input("5"), false, "still no typing on the Wrong feedback");
  assert.equal(getActiveLearner(store.read()).relations[item.id].attempts.length, attempts, "pause records nothing");
  flow.advance();
  assert.equal(flow.view().screen, "train");
  assert.equal(flow.view().position, 2, "下一题 still moves on to question 2");
});
