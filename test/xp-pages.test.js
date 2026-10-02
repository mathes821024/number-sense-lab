/**
 * The pages migrated from h5/ into the shared Taro app — 专项练习, 错题本,
 * 最近练得怎么样 and the print selector + A4 — over the real core. Pure page
 * models and the training intent are checked here; the page files are
 * checked statically (they render through Taro). Nothing in these pages may
 * change learning: the models only read the learner record.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { listPromptHtml, printPromptHtml, formatMath } from "../h5/math-text.js";
import { listPromptText, printPrompt, mathTokens } from "../app/components/math/tokens.js";
import {
  exploreView,
  focusView,
  mistakesView,
  progressView,
  printSelectView,
  printSource,
  a4View,
  formatDay,
  SOON_DIRECTIONS,
  SOON_EXTRAS,
  DOMAIN_GLYPHS,
  DOMAIN_SLOTS,
  PRINT_NOTE,
  NO_PRINT_NOTE,
} from "../app/pages/models.js";
import { trainingIntent } from "../app/pages/train/intent.js";
import { createTrainingFlow } from "../app/pages/train/flow.js";
import { createBrowserStore } from "../app/platform/h5/browser-store.js";
import { STATE_KEY } from "../src/adapter/storage-contract.js";
import { STATE_VERSION } from "../src/core/store.js";
import { DOMAIN_ORDER, loadCoreCatalog, getRelationById } from "../src/core/content.js";
import { MASTERY } from "../src/core/mastery.js";
import { MISTAKE_BOOK_SOURCE } from "../src/core/schedule.js";
import { defaultPrintSelection } from "../src/core/a4.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => readFileSync(join(root, p), "utf8");
const catalog = loadCoreCatalog();
const DAY = "2026-10-02";
const byId = (id) => getRelationById(id, catalog);

const LABELS = ["平方", "常用乘积", "分数到小数", "半数与翻倍", "补数", "立方", "常见幂", "凑整乘积家族"];

function memStore() {
  const map = new Map();
  const storage = {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k),
  };
  return createBrowserStore(storage, STATE_KEY, { createId: () => "L-pages", today: () => DAY });
}

const wrongOnce = (status = MASTERY.LEARNING) => ({
  status,
  attempts: [{ correct: false, day: "2026-09-30", slow: false }],
});
const rightOnce = () => ({ status: MASTERY.LEARNING, attempts: [{ correct: true, day: "2026-09-30", slow: false }] });

/** One wrong relation in each released domain (first item of the domain), and one practiced right. */
function seededRelations() {
  const relations = {};
  for (const d of DOMAIN_ORDER) relations[catalog.find((i) => i.domain === d).id] = wrongOnce();
  relations[catalog.find((i) => i.answer_type === "fraction_fields").id] = wrongOnce(MASTERY.SHAKY);
  relations["square-7"] = rightOnce();
  return relations;
}

// ---------- 专项练习 ----------

test("专项练习: one card per released domain, in DOMAIN_ORDER, with the exact names", () => {
  const cards = exploreView({ relations: {} }, catalog);
  assert.deepEqual(cards.map((c) => c.domain), DOMAIN_ORDER);
  assert.deepEqual(cards.map((c) => c.label), LABELS);
  assert.equal(DOMAIN_ORDER.length, 8);
  for (const c of cards) {
    assert.ok(typeof c.summary === "string" && c.summary.length > 0, `${c.domain} summary`);
    assert.ok(c.slot || c.glyph, `${c.domain} has a picture slot or a glyph`);
  }
  // v0.3 domains keep their pictures; v0.4 domains use a glyph in the same tile.
  assert.deepEqual(Object.keys(DOMAIN_SLOTS), ["squares", "products", "fraction_decimal"]);
  assert.deepEqual(Object.keys(DOMAIN_GLYPHS), DOMAIN_ORDER, "every domain has a fallback glyph: never an empty tile");
});

test("专项练习: only 规律探索 / 概念 / 例题 / 动画 stay 敬请期待", () => {
  assert.deepEqual([...SOON_DIRECTIONS, ...SOON_EXTRAS].map((s) => s.name), ["规律探索", "概念", "例题", "动画"]);
  const page = read("app/pages/explore/index.jsx");
  for (const label of LABELS) assert.equal(page.includes(label), false, `${label} is not hard-coded as a placeholder`);
});

test("专项练习: every icon the pages name is in the embedded subset", () => {
  const glyphs = read("app/components/icon/glyphs.js");
  const names = [...Object.values(DOMAIN_GLYPHS), ...[...SOON_DIRECTIONS, ...SOON_EXTRAS].map((s) => s.icon), "arrow-left", "printer", "plus"];
  for (const n of names) assert.ok(glyphs.includes(`"${n}"`), `glyph ${n}`);
});

test("domain tiles: H5 and the Mini Program fill the same domain.* slots; WeChat uses PNG files, never SVG", () => {
  const slotsOf = (f) => [...read(f).matchAll(/"(domain\.\w+)": \{ src: \w+, manifestKey: "([\w.]+)" \}/g)].map((m) => [m[1], m[2]]);
  const h5 = slotsOf("app/platform/h5/theme-assets.js");
  const wx = slotsOf("app/platform/wechat/theme-assets.js");
  const want = Object.values(DOMAIN_SLOTS);
  assert.deepEqual(h5.map(([s]) => s), want);
  assert.deepEqual(wx.map(([s]) => s), want);
  for (const [, key] of wx) assert.match(key, /Png$/, key);
  assert.match(read("app/platform/wechat/theme-assets.js"), /domain-squares-192\.png/);
  // A tile draws the picture when the client has the slot, else the glyph: never empty.
  const tile = read("app/components/DomainTile.jsx");
  assert.match(tile, /hasArt \? \(/);
  assert.match(tile, /<Icon name=\{glyph\} \/>/);
  for (const c of exploreView({ relations: {} }, catalog)) assert.ok(c.glyph, `${c.domain} glyph`);
});

test("focus confirm: a released domain only; anything else is null", () => {
  for (const [i, d] of DOMAIN_ORDER.entries()) {
    const v = focusView(d, { relations: {} }, catalog);
    assert.equal(v.domain, d);
    assert.equal(v.label, LABELS[i]);
    assert.equal(v.lede, "只练这一块，同样是一小段，不是一直刷。");
  }
  for (const bad of ["", "nope", undefined, "__proto__"]) assert.equal(focusView(bad, {}, catalog), null);
});

test("training intent: the same actions as h5/ — focus only for released domains, unknown starts today", () => {
  assert.deepEqual(trainingIntent({}), { kind: "begin", mode: "daily", domain: null });
  assert.deepEqual(trainingIntent({ intent: "start-daily" }), { kind: "begin", mode: "daily", domain: null });
  assert.deepEqual(trainingIntent({ intent: "restart-daily" }), { kind: "restart", mode: "daily", domain: null });
  assert.deepEqual(trainingIntent({ intent: "resume" }), { kind: "resume" });
  assert.deepEqual(trainingIntent({ intent: "see-last" }), { kind: "last" });
  assert.deepEqual(trainingIntent({ intent: "start-mistakes" }), { kind: "begin", mode: MISTAKE_BOOK_SOURCE, domain: null });
  for (const d of DOMAIN_ORDER) {
    assert.deepEqual(trainingIntent({ intent: "start-focus", domain: d }), { kind: "begin", mode: "focused", domain: d });
  }
  assert.deepEqual(trainingIntent({ intent: "start-focus", domain: "nope" }), { kind: "begin", mode: "daily", domain: null });
  assert.deepEqual(trainingIntent({ intent: "whatever" }), { kind: "begin", mode: "daily", domain: null });
});

test("each specialist card starts a focused set from its own domain only — the new domains never mix", () => {
  for (const d of DOMAIN_ORDER) {
    const intent = trainingIntent({ intent: "start-focus", domain: d });
    const flow = createTrainingFlow({ store: memStore(), catalog, today: () => DAY });
    flow.begin(intent.mode, intent.domain);
    assert.equal(flow.view().screen, "train", d);
    assert.equal(flow.session.mode, "focused", d);
    assert.ok(flow.session.queue.length > 0, `${d} has a set`);
    for (const id of flow.session.queue) assert.equal(byId(id).domain, d, `${d}: ${id}`);
    assert.equal(flow.view().item.domain, d);
  }
});

// ---------- 错题本 ----------

test("错题本: grouped by domain in DOMAIN_ORDER (new domains included), empty groups hidden, no counts", () => {
  const relations = seededRelations();
  const v = mistakesView({ relations }, catalog);
  assert.deepEqual(v.groups.map((g) => g.domain), DOMAIN_ORDER);
  assert.deepEqual(v.groups.map((g) => g.label), LABELS);
  for (const g of v.groups) for (const it of g.items) assert.equal(byId(it.id).domain, g.domain);
  assert.ok(!v.groups.flatMap((g) => g.items).some((it) => it.id === "square-7"), "a right answer is not a mistake");
  // Only two domains with mistakes → only those two groups.
  const two = {
    [catalog.find((i) => i.domain === "cubes").id]: wrongOnce(),
    [catalog.find((i) => i.domain === "halves").id]: wrongOnce(),
  };
  assert.deepEqual(mistakesView({ relations: two }, catalog).groups.map((g) => g.domain), ["halves", "cubes"]);
  // Recovered (stable) mistakes leave the book.
  const recovered = { [catalog.find((i) => i.domain === "powers").id]: wrongOnce(MASTERY.STABLE) };
  assert.equal(mistakesView({ relations: recovered }, catalog).groups.length, 0);
  assert.equal(mistakesView({ relations: {} }, catalog).groups.length, 0);
  const page = read("app/pages/mistakes/index.jsx");
  assert.doesNotMatch(page, /className="[^"]*badge|items\.length\}|\.length\} 题/);
});

test("错题本: a fraction_fields mistake is listed as 0.125 = an empty fraction bar (stacked, no slash)", () => {
  const ff = catalog.find((i) => i.answer_type === "fraction_fields");
  const v = mistakesView({ relations: { [ff.id]: wrongOnce() } }, catalog);
  const row = v.groups[0].items[0];
  assert.equal(row.id, ff.id);
  const tokens = mathTokens(listPromptText(row.prompt));
  assert.equal(tokens.at(-1).type, "blank_fraction");
  assert.equal(tokens.some((t) => t.type === "text" && /[/?]/.test(t.text)), false);
});

test("list and A4 prompts read exactly as h5/ listPromptHtml / printPromptHtml for all 173 items", () => {
  for (const item of catalog) {
    assert.equal(formatMath(listPromptText(item.prompt)), listPromptHtml(item.prompt), item.id);
    const p = printPrompt(item.prompt);
    const html = `<span>${formatMath(p.text)}</span>${p.line ? '<span class="blank"></span>' : ""}`;
    assert.equal(html, printPromptHtml(item.prompt), item.id);
  }
});

// ---------- 最近练得怎么样 ----------

test("最近练得怎么样: last 8 sets newest first, the h5/ words, latest outcome per practiced relation", () => {
  const sessions = Array.from({ length: 10 }, (_, i) => ({
    day: `2026-09-${String(20 + i).padStart(2, "0")}`,
    completed: i % 3 !== 0,
    earlyStop: i % 3 === 0,
    correct: 7,
    total: 10,
  }));
  const relations = seededRelations();
  const v = progressView({ sessions, relations }, catalog);
  assert.equal(v.sessions.length, 8);
  assert.equal(v.sessions[0].day, "9月29日");
  assert.equal(v.sessions.at(-1).day, "9月22日");
  assert.equal(v.sessions[0].status, "先停了");
  assert.equal(v.sessions[1].status, "做完了");
  assert.equal(v.sessions[0].score, "对了 7/10");
  assert.equal(formatDay("2026-10-02"), "10月2日");
  assert.equal(v.outcomes.length, Object.keys(relations).length);
  assert.equal(v.outcomes.find((o) => o.id === "square-7").right, true);
  assert.equal(progressView({}, catalog).sessions.length, 0);
});

// ---------- 印到纸上 ----------

test("print selector: current mistakes pre-selected, filters are 全部 + the eight domains, filter narrows view only", () => {
  const relations = seededRelations();
  const selectedIds = defaultPrintSelection(catalog, relations);
  const all = printSelectView({ relations }, catalog, { selectedIds, domain: "", showOthers: false });
  assert.deepEqual(all.filters.map((f) => f.label), ["全部", ...LABELS]);
  assert.equal(all.selectedCount, DOMAIN_ORDER.length + 1);
  assert.equal(all.selectedLabel, `已选 ${DOMAIN_ORDER.length + 1} 题`);
  assert.equal(all.hiddenOthers, true, "practiced-right items wait behind 也看看其他练过的题");
  assert.ok(all.rows.every((r) => r.currentMistake));
  const shown = printSelectView({ relations }, catalog, { selectedIds, domain: "", showOthers: true });
  assert.ok(shown.rows.some((r) => r.id === "square-7" && !r.selected));
  const cubes = printSelectView({ relations }, catalog, { selectedIds, domain: "cubes", showOthers: true });
  assert.ok(cubes.rows.every((r) => byId(r.id).domain === "cubes"));
  assert.equal(cubes.selectedCount, all.selectedCount, "the count covers every domain");
  assert.equal(printSelectView({ relations: {} }, catalog, { selectedIds: [], domain: "", showOthers: false }).nothingHere, true);
  for (const s of ["home", "progress", "mistakes"]) assert.equal(printSource(s), s);
  assert.equal(printSource("evil"), "home");
});

test("A4: exactly the selected relations, numbered; answers separate; date and one-domain name", () => {
  const relations = seededRelations();
  const cubeId = catalog.find((i) => i.domain === "cubes").id;
  const one = a4View({ relations }, catalog, { selectedIds: [cubeId], day: DAY });
  assert.equal(one.title, "数感训练场 · 纸上再写一次");
  assert.equal(one.sub, "10月2日 · 立方");
  assert.deepEqual(one.prompts.map((p) => [p.n, p.id]), [[1, cubeId]]);
  assert.equal(one.answerKey[0].answer, byId(cubeId).canonical_answer);
  const many = a4View({ relations }, catalog, { selectedIds: defaultPrintSelection(catalog, relations), day: DAY });
  assert.equal(many.sub, "10月2日", "mixed domains: date only");
  assert.equal(many.prompts.length, DOMAIN_ORDER.length + 1);
  assert.equal(a4View({ relations }, catalog, { selectedIds: ["unknown", "square-99"], day: DAY }).empty, true);
});

test("print: H5 prints, the Mini Program shows the page as a preview with its own note", () => {
  assert.match(read("app/platform/h5/index.js"), /printing = \{\s*available: true/);
  assert.match(read("app/platform/wechat/index.js"), /printing = \{\s*available: false/);
  const page = read("app/pages/print/index.jsx");
  assert.match(page, /printing\.available \? \(/, "the print button exists only where printing is available");
  assert.match(page, /printing\.available \? PRINT_NOTE : NO_PRINT_NOTE/);
  assert.equal(PRINT_NOTE, "若当前环境打不开打印，可用浏览器的「打印」或「存储为 PDF」把题目带出去。");
  assert.ok(NO_PRINT_NOTE.startsWith("小程序里不能直接打印"));
  const shell = read("app/platform/h5/page-shell.css");
  assert.match(shell, /@media print/);
  assert.match(shell, /size: A4/);
  assert.match(shell, /\.no-print, \.tabbar, \.toast \{ display: none !important; \}/);
});

test("print selection is page state: the pages never write the learner record", () => {
  for (const p of ["explore", "mistakes", "progress", "print"]) {
    const src = read(`app/pages/${p}/index.jsx`);
    assert.doesNotMatch(src, /\.write\(|withActiveLearner|recordAttempt|setStorage|localStorage/, p);
  }
  // State version and key are untouched by the migration.
  assert.equal(STATE_KEY, "nsl-v01-state");
  assert.equal(STATE_VERSION, 3);
});

test("ordinary pages keep the bottom nav (no badges); tab switches go through the platform", () => {
  for (const p of ["explore", "mistakes", "progress", "print"]) {
    const src = read(`app/pages/${p}/index.jsx`);
    assert.match(src, /<BottomNav/, p);
    assert.match(src, /className=\{`page has-nav/, p);
    assert.match(src, /style=\{navPageStyle\(\)\}/, `${p} reserves the nav + bottom safe-area inset`);
  }
  assert.doesNotMatch(read("app/components/BottomNav.jsx"), /className="[^"]*(badge|dot|count)|Count\b/);
  const tabs = read("app/pages/tabs.js");
  assert.match(tabs, /paddingBottom: `calc\(92px \+ \$\{safeArea\.bottom\}\)`/);
  assert.match(tabs, /home: "home", explore: "explore", mistakes: "mistakes"/);
  for (const f of ["app/platform/h5/index.js", "app/platform/wechat/index.js"]) {
    const src = read(f);
    for (const k of ["toTraining", "toHome", "toTab", "toPage", "back"]) assert.match(src, new RegExp(`${k}\\(`), `${f} ${k}`);
  }
});
