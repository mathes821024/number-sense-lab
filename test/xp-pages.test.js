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
  DOMAIN_GLYPHS,
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
import { summarizeDomain } from "../src/core/mastery.js";
import { filterByDomain } from "../src/core/content.js";
import { CARD_STATUS_WORDS, PRACTICE_GROUPS, SOON_STATUS, domainSlot, practiceCard, practiceGroups } from "../src/core/practice-groups.js";

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

// ---------- 专项练习 · 主题训练: grouped two-column grid (docs/ux/05_specialist_grouped_grid.md) ----------

const GROUPS_05 = [
  ["幂与乘方", "sky", ["平方", "立方", "常见幂"]],
  ["乘法与凑整", "amber", ["常用乘积", "凑整乘积家族"]],
  ["数与分数", "mint", ["分数到小数", "半数与翻倍", "补数"]],
];

test("主题训练: exactly the three navigation groups of 05 §2, in order, each card one released domain", () => {
  const groups = exploreView({ relations: {} }, catalog);
  assert.deepEqual(
    groups.map((g) => [g.label, g.tone, g.cards.map((c) => c.label)]),
    GROUPS_05,
  );
  const domains = groups.flatMap((g) => g.cards.map((c) => c.domain));
  assert.deepEqual([...domains].sort(), [...DOMAIN_ORDER].sort(), "all eight domains, each exactly once");
  assert.equal(new Set(domains).size, 8);
  // Group ids are navigation only: never a domain id.
  for (const g of PRACTICE_GROUPS) assert.equal(DOMAIN_ORDER.includes(g.id), false, `${g.id} is not a domain`);
  for (const c of groups.flatMap((g) => g.cards)) {
    assert.equal(c.label, LABELS[DOMAIN_ORDER.indexOf(c.domain)]);
    assert.equal(c.released, true, `${c.domain} is released`);
  }
});

test("主题训练: the groups never reach learning — scheduler, mastery, mistakes and content do not know them", () => {
  for (const f of ["src/core/schedule.js", "src/core/session.js", "src/core/mastery.js", "src/core/mistakes.js", "src/core/content.js", "src/core/store.js", "src/core/a4.js", "src/core/progress.js"]) {
    assert.doesNotMatch(read(f), /practice-groups|PRACTICE_GROUPS|幂与乘方|乘法与凑整|数与分数/, f);
  }
  // 错题本 still groups by domain.
  const book = mistakesView({ relations: seededRelations() }, catalog);
  assert.deepEqual(book.groups.map((g) => g.domain), DOMAIN_ORDER);
});

test("主题训练 cards: icon + name + one of the four status words; aria reads 「名，状态」; the real band of the domain", () => {
  const relations = seededRelations();
  for (const g of practiceGroups(catalog, relations)) {
    for (const c of g.cards) {
      assert.ok(CARD_STATUS_WORDS.includes(c.status), `${c.domain}: ${c.status}`);
      assert.equal(c.status, summarizeDomain(filterByDomain(c.domain, catalog), relations), `${c.domain}: real status`);
      assert.equal(c.aria, `${c.label}，${c.status}`);
      assert.equal(c.slot, `domain.${c.domain}`);
      assert.equal(c.slot, domainSlot(c.domain));
      assert.ok(c.glyph, `${c.domain} glyph: never an empty tile`);
      assert.equal(c.tone, g.tone, `${c.domain} tint follows its group`);
    }
  }
  assert.deepEqual(CARD_STATUS_WORDS, ["还没怎么练", "正在熟悉", "有几题要再巩固", "大多已经很稳"]);
});

test("主题训练: a card without released content only answers 敬请期待 and never opens a focused set", () => {
  const c = practiceCard("factors", catalog, {});
  assert.equal(c.released, false);
  assert.equal(c.status, SOON_STATUS);
  assert.equal(SOON_STATUS, "敬请期待");
  assert.equal(focusView("factors", { relations: {} }, catalog), null);
  for (const g of exploreView({ relations: {} }, catalog)) for (const card of g.cards) assert.notEqual(card.status, "敬请期待", `${card.domain} released: no 敬请期待`);
});

test("fallback glyphs (only when an F-B file is missing or fails): one distinct symbol per domain, never an empty tile", () => {
  assert.deepEqual(Object.keys(DOMAIN_GLYPHS).sort(), [...DOMAIN_ORDER].sort());
  assert.equal(new Set(Object.values(DOMAIN_GLYPHS)).size, 8, "no two domains share a symbol");
  assert.equal(DOMAIN_GLYPHS.cubes, "cube");
  assert.notEqual(DOMAIN_GLYPHS.squares, "cube");
  assert.equal(DOMAIN_GLYPHS.squares, "grid-four", "平方: 2×2 grid");
  assert.equal(DOMAIN_GLYPHS.products, "dots-nine", "常用乘积: dot array");
  assert.notEqual(DOMAIN_GLYPHS.special_products, DOMAIN_GLYPHS.products);
  assert.equal(DOMAIN_GLYPHS.powers, "text-superscript", "常见幂: xⁿ");
  assert.equal(DOMAIN_GLYPHS.halves, "intersect", "半数与翻倍: two joined circles");
  assert.equal(DOMAIN_GLYPHS.complements, "chart-donut", "补数: a ring made whole");
  const glyphs = read("app/components/icon/glyphs.js");
  for (const n of [...Object.values(DOMAIN_GLYPHS), "arrow-left", "printer", "plus"]) assert.ok(glyphs.includes(`"${n}"`), `glyph ${n} in the embedded subset`);
});

test("domain icon tile: the slot's F-B file when it loads, else the glyph on the group chip — never empty", () => {
  const tile = read("app/components/DomainTile.jsx");
  assert.match(tile, /const hasArt = Boolean\(src\) && !broken;/);
  assert.match(tile, /onError=\{\(\) => setBroken\(true\)\}/, "a failed file falls back to the glyph");
  assert.match(tile, /<Icon name=\{glyph\} \/>/);
  assert.match(tile, /tone-\$\{tone\}/);
  assert.match(tile, /mode="aspectFit"/, "never stretched or cropped");
  const h5 = read("h5/app.js");
  const art = h5.slice(h5.indexOf("function domainArt"), h5.indexOf("function mascot("));
  assert.match(art, /domainIconUrl\(domain\)/);
  assert.match(art, /tile-glyph/);
  assert.match(art, /classList\.replace\("has-art", "is-broken"\)/);
  assert.match(read("h5/styles.css"), /\.tile:not\(\.has-art\) \.tile-glyph, \.tile\.is-broken \.tile-glyph \{ display: inline-flex; \}/);
});

test("主题训练 pages (Taro + h5/): the same shared model, F-B header and group zones, whole-tile buttons; no 敬请期待 cards, 知识地图 only says 敬请期待", () => {
  const page = read("app/pages/explore/index.jsx");
  const h5 = read("h5/app.js");
  assert.match(page, /exploreView\(state, catalog\)\.map\(\(g\) =>/);
  assert.match(h5, /practiceGroups\(catalog, state\.relations\)/);
  assert.match(page, /className="practice-group-title" role="heading" aria-level="2"/);
  assert.match(h5, /<h2 class="practice-group-title"/);
  assert.match(page, /role="button"\s+aria-label=\{c\.aria\}/);
  assert.match(h5, /<button class="practice-card[\s\S]{0,300}aria-label="\$\{c\.aria\}"/);
  const code = (src) => src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
  for (const src of [code(page), code(h5.slice(h5.indexOf("function renderExplore"), h5.indexOf("function renderFocusConfirm")))]) {
    for (const gone of ["规律探索", "概念", "例题", "动画", "更多方向", "soon-chip", "soon-tile", "SoonButton", "caret-right", "<svg"]) assert.equal(src.includes(gone), false, `${gone} is not on the practice page`);
    for (const label of LABELS) assert.equal(src.includes(label), false, `${label} comes from the model, not hard-coded`);
    assert.match(src, /data-soon="知识地图"/);
    // F-B header (08 §2; 05 §1): kicker, title, subtitle, the two tabs, a quiet helper line.
    for (const text of ["EXPLORE MATH", "探索数学世界", "从一个主题开始，走更远的路", "主题训练", "知识地图", "今天想练哪个？"]) assert.ok(src.includes(text), text);
    assert.match(src, /fb-hint/);
    assert.match(src, /fb-mascot/);
    assert.match(src, /practice-group-en/);
    assert.match(src, /is-long/);
  }
  for (const css of [read("app/app.css"), read("h5/styles.css")]) {
    assert.match(css, /\.practice-grid \{ display: grid; grid-template-columns: repeat\(2, minmax\(0, 1fr\)\);/);
    const card = css.match(/\n\.practice-card \{[\s\S]*?\n\}/)[0];
    assert.match(card, /background: var\(--fb-tile-bg\);/, "white tiles on the group zone");
    assert.match(card, /box-shadow: var\(--fb-tile-shadow\);/, "a very light shadow, not a floating card");
    assert.match(card, /border-radius: 16px;/);
    assert.match(card, /min-height: 76px;/, "compact tile, still well above 44×44");
    for (const tone of ["sky", "amber"]) {
      assert.match(css, new RegExp(`\\.practice-group\\.tone-${tone} \\{ background: var\\(--fb-group-bg-${tone}\\); \\}`), `${tone} zone in CSS`);
      assert.match(css, new RegExp(`\\.tile\\.tone-${tone} \\{ background: var\\(--fb-chip-${tone}\\); \\}`), `${tone} chip`);
    }
    assert.match(css, /\.practice-group \{[^}]*border-radius: 20px; background: var\(--fb-group-bg-mint\);/);
    assert.doesNotMatch(css.slice(css.indexOf("主题训练 as F-B"), css.indexOf("Safe fallback")), /url\(/, "no picture for a colour zone");
    assert.match(css, /\.practice-status \{[^}]*font-size: 12px;[^}]*color: var\(--fb-status-color\);/);
    assert.match(css, /\.practice-name \{[^}]*font-size: 15px;[^}]*white-space: nowrap;[^}]*color: var\(--text-primary\);/);
    assert.match(css, /\.practice-group-title \{[^}]*font-size: 16px; font-weight: 800;/);
    assert.match(css, /\.fb-hint \{[^}]*font-size: 13px; font-weight: 400;[^}]*color: var\(--text-secondary\);/, "helper line weaker than the group titles");
    assert.match(css, /\.fb-mascot \{[^}]*width: 74px; height: 74px;/, "mascot (≤ 80 token) no taller than the title block, even after rpx rounding at 430");
    assert.match(css, /width: 64px;\n  height: 64px;\n  flex: none;\n  border-radius: 14px;/, "64px icon chip");
  }
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

test("home short-height mode (≤ 650px usable height): same blocks, a little less vertical room, text and nav unchanged (h5/ and Taro)", () => {
  for (const [name, css] of [["app/app.css", read("app/app.css")], ["h5/styles.css", read("h5/styles.css")]]) {
    const m = css.match(/@media \(max-height: 650px\) \{([\s\S]*?)\n\}/);
    assert.ok(m, `${name}: short-height block`);
    const block = m[1];
    assert.match(block, /\.home-hero\.is-resume \.mascot-hero \{ width: 118px; \}/, `${name}: smaller resume mascot`);
    assert.match(block, /\.home-hero\.is-resume \{ min-height: 122px; margin-top: 4px; \}/, `${name}: tighter resume hero`);
    assert.match(block, /\.home \.bubble \{ padding: 10px 14px; \}/, `${name}: bubble padding`);
    assert.match(block, /\.home \.entry-start \{ min-height: 68px;/, `${name}: CTA height`);
    assert.match(block, /\.home \.entr(y \{ margin-bottom|ies \{ gap): 8px;/, `${name}: card gaps`);
    // Readable text and a normal nav: no font sizes, no tab bar, nothing outside Home.
    assert.doesNotMatch(block, /font-size|\.tab|\.tabbar|\.page\b|\.key|\.train/, `${name}: short mode touches only Home layout`);
    for (const sel of block.match(/^\s*[^{}\n]+(?=\{)/gm)) assert.match(sel.trim(), /^\.(home|mascot-hero)/, `${name}: ${sel.trim()} is a Home selector`);
  }
});

test("home resume hero: one action, no standalone restart; restart lives on the pause screen (h5/ and Taro)", () => {
  const home = read("app/pages/home/model.js");
  assert.doesNotMatch(home, /重新开始一小段"/);
  const h5 = read("h5/app.js");
  assert.match(h5, /lede = "刚才练到一半，继续就好。";/);
  // The resume lede is two fixed lines in both apps (Owner Plan B): no spaces or <br> to force the break.
  assert.match(h5, /ledeLines = \["刚才练到一半，", "继续就好。"\];/);
  assert.match(h5, /<span class="bubble-line">/);
  const homePage = read("app/pages/home/index.jsx");
  assert.match(homePage, /className="bubble-line"/);
  assert.doesNotMatch(read("app/pages/home/model.js") + h5, /刚才练到一半，\s+继续/);
  assert.doesNotMatch(homePage + h5, /bubble-(text|line)[^\n]*<br/);
  for (const css of [read("app/app.css"), read("h5/styles.css")]) {
    assert.match(css, /\.bubble-text \.bubble-line \{ display: block; \}/);
    assert.match(css, /\.bubble-text\.is-split \.bubble-line \{ white-space: nowrap; \}/);
  }
  assert.doesNotMatch(h5, /home-secondary[^`]*restart-daily/);
  assert.match(h5, /data-action="stop-session">先停<\/button>\s*<button class="quiet pause-restart" type="button" data-action="restart-daily">重新开始一小段<\/button>/);
  const dialog = read("app/components/PauseDialog.jsx");
  assert.match(dialog, /data-action="restart-daily"/);
  assert.match(read("app/pages/train/index.jsx"), /<PauseDialog onResume=\{unpause\} onStop=\{stop\} onRestart=\{restart\} \/>/);
  assert.match(read("app/pages/home/index.jsx"), /is-resume/);
  assert.match(read("app/app.css"), /\.home-hero\.is-resume \.mascot-hero \{ width: 144px; \}/);
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
