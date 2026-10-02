// fraction_fields on the h5/ shell (served by scripts/serve.mjs) —
// docs/curriculum/09_fraction_fields_contract.md:
// - 0.125 = [numerator box] over a bar over [denominator box]; no 「/」 key;
//   focus, tap, backspace; acceptance 1–7 through the real page;
// - the two boxes, the keypad and 提交 fit at 375×667 and 390×753;
// - no slash fraction on any student surface: training, correct, wrong,
//   mistake book, progress, print picker, A4 question page, A4 answer page
//   (also under print media), including the set position 「第 k 题 · 共 N 题」
//   (no exemption: it has no slash).
//
//   node scripts/serve.mjs --port 4173 &
//   BASE=http://localhost:4173/ CHROME=/usr/bin/google-chrome node scripts/h5-fraction-check.mjs
import { mkdirSync, writeFileSync } from "node:fs";
import { chromium } from "playwright-core";
import { loadCoreCatalog } from "../src/core/content.js";
import { peekCurrent, startSession, submitAnswer } from "../src/core/session.js";
import { emptyLearner } from "../src/core/store.js";
import { seededRaw, today } from "./viewport-cases.mjs";

const BASE = process.env.BASE || "http://localhost:4173/";
const SHOTS = process.env.SHOTS || "dist/h5-fraction";
const CHROME = process.env.CHROME || "/usr/bin/google-chrome";
const KEY = "nsl-v01-state";
const catalog = loadCoreCatalog();
mkdirSync(SHOTS, { recursive: true });

const results = [];
const check = (name, ok, detail = "") => {
  results.push({ name, ok: !!ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${detail ? `  ${detail}` : ""}`);
};

const browser = await chromium.launch({ executablePath: CHROME, args: ["--no-sandbox"] });
async function freshPage(w, h, raw = null) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, reducedMotion: "reduce" });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.goto(`${BASE}h5/index.html`);
  await page.evaluate(([k, v]) => (v ? localStorage.setItem(k, v) : localStorage.removeItem(k)), [KEY, raw]);
  await page.reload();
  await page.waitForSelector("#home");
  return { ctx, page, errors };
}
const learnerOf = async (page) => {
  const r = JSON.parse(await page.evaluate((k) => localStorage.getItem(k), KEY));
  return r.learners[r.active_learner_id];
};
const fields = (page) =>
  page.evaluate(() => {
    const ff = document.querySelector("#answer.fraction-fields");
    if (!ff) return null;
    const n = ff.querySelector('[data-field="numerator"]');
    const d = ff.querySelector('[data-field="denominator"]');
    return { focus: ff.getAttribute("data-focus"), n: n.getAttribute("data-value"), d: d.getAttribute("data-value"), q: document.querySelector("#train .question").textContent.trim() };
  });
const key = (page, k) => page.click(`.keys .key[data-digit="${k}"]`);
const del = (page) => page.click('.keys [data-action="del"]');
const submit = (page) => page.click('.keys [data-action="submit"]');
const tap = (page, which) => page.click(`#answer [data-field="${which}"]`);
const typeKeys = async (page, s) => { for (const ch of s) await key(page, ch); };
const nudge = (page) => page.evaluate(() => document.getElementById("nudge").textContent.trim());
const nudgeLabel = (page) => page.evaluate(() => document.querySelector("#nudge .frac") ? [...document.querySelectorAll("#nudge .frac")].length : 0);

/** Visible text nodes with a slash fraction (「1/2」, 「?/?」); the set count is skipped. */
const slashScan = (page) =>
  page.evaluate(() => {
    const hits = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      const el = n.parentElement;
      if (!el || !el.checkVisibility()) continue;
      if (/[\d?]\s*\/\s*[\d?]/.test(n.textContent)) hits.push(n.textContent.trim());
    }
    // Rendered text as a whole (innerText joins a stacked fraction's digits with a line break, never a 「/」).
    return { hits, bodySlash: /\d\s*\/\s*\d/.test(document.body.innerText), slashKey: Boolean(document.querySelector('[data-digit="/"]')), qmark: /\?\/\?/.test(document.body.innerText) };
  });
const clean = (s) => s.hits.length === 0 && !s.slashKey && !s.qmark;

async function resumeOn(id, w = 375, h = 667) {
  const r = await freshPage(w, h, seededRaw(id));
  await r.page.click('#home [data-action="resume"]');
  await r.page.waitForSelector("#train");
  return r;
}

// 1. The training screen and acceptance 1–7.
{
  const { ctx, page, errors } = await resumeOn("ifraction-1-2");
  let f = await fields(page);
  check("train: 0.5 = two boxes, focus on the numerator, no 「/」 key", f && f.q === "0.5 =" && f.focus === "numerator" && f.n === "" && f.d === "", JSON.stringify(f));
  const count = await page.evaluate(() => document.getElementById("set-count").textContent.trim());
  check("polish 01: set position reads 「第 2 题 · 共 2 题」 (no slash)", count === "第 2 题 · 共 2 题", count);
  let s = await slashScan(page);
  check("train: no slash text (set position included), no 「?/?」, no 「/」 key", clean(s) && !s.bodySlash, JSON.stringify(s));
  await page.screenshot({ path: `${SHOTS}/h5-01-train-empty-375x667.png` });
  await submit(page);
  check("4: both empty → 「先写一个分数」, nothing recorded", (await nudge(page)) === "先写一个分数" && !(await learnerOf(page)).relations["ifraction-1-2"]);
  await key(page, "1");
  await submit(page);
  check("5: denominator empty → 「先写一个分数」, nothing recorded", (await nudge(page)) === "先写一个分数" && !(await learnerOf(page)).relations["ifraction-1-2"]);
  await tap(page, "denominator");
  await key(page, "0");
  await submit(page);
  check("6: denominator 0 → 「先写一个分数」, nothing recorded", (await nudge(page)) === "先写一个分数" && !(await learnerOf(page)).relations["ifraction-1-2"]);
  await page.screenshot({ path: `${SHOTS}/h5-02-denominator-zero-375x667.png` });
  await del(page);
  await del(page);
  f = await fields(page);
  check("backspace: only the focused box; an empty box keeps the focus", f.focus === "denominator" && f.d === "" && f.n === "1", JSON.stringify(f));
  await key(page, "2");
  await tap(page, "numerator");
  await del(page);
  await submit(page);
  check("4: numerator empty → 「先写一个分数」, nothing recorded", (await nudge(page)) === "先写一个分数" && !(await learnerOf(page)).relations["ifraction-1-2"]);
  // 2 (with leading zeros): 02 over 04.
  await typeKeys(page, "02");
  await tap(page, "denominator");
  await del(page);
  await typeKeys(page, "04");
  f = await fields(page);
  const shown = await page.evaluate(() => [...document.querySelectorAll("#answer .ff-digits")].map((e) => e.textContent));
  check("polish 01: typed 02 over 04 shows 2 over 4 (leading zeros dropped, not reduced)", f.n === "2" && f.d === "4" && shown.join("|") === "2|4", JSON.stringify({ ...f, shown }));
  await page.screenshot({ path: `${SHOTS}/h5-02b-typed-02-04-shows-2-4-375x667.png` });
  await submit(page);
  const n2 = await nudge(page);
  check("2: 0.5 → 2/4 (typed 02 over 04) is needs_simplification, nothing recorded", /一样大，再约到最简/.test(n2) && (await nudgeLabel(page)) === 3 && !(await learnerOf(page)).relations["ifraction-1-2"], `${n2} (${await nudgeLabel(page)} bars)`);
  s = await slashScan(page);
  check("needs_simplification: the hint draws bars, no slash", clean(s), JSON.stringify(s));
  f = await fields(page);
  check("polish 01: no auto-simplify — boxes still 2 over 4 after the hint", f.n === "2" && f.d === "4", JSON.stringify(f));
  await page.screenshot({ path: `${SHOTS}/h5-03-needs-simplification-375x667.png` });
  // 1: 1 over 2.
  await del(page); await del(page); await key(page, "2");
  await tap(page, "numerator");
  await del(page); await del(page); await key(page, "1");
  await submit(page);
  await page.waitForSelector("#correct");
  s = await slashScan(page);
  const l1 = await learnerOf(page);
  check("1: 0.5 → 1/2 is correct, recorded once", l1.relations["ifraction-1-2"]?.attempts.length === 1 && l1.relations["ifraction-1-2"].attempts[0].correct === true);
  check("correct screen: 0.5 = 1/2 drawn with a bar", clean(s), JSON.stringify(s));
  await page.screenshot({ path: `${SHOTS}/h5-04-correct-375x667.png` });
  check("train: no page errors", errors.length === 0, errors.join(" | "));
  await ctx.close();
}
{
  const { ctx, page } = await resumeOn("ifraction-1-2");
  await key(page, "3"); await tap(page, "denominator"); await key(page, "5");
  await submit(page);
  await page.waitForSelector("#wrong");
  const l = await learnerOf(page);
  const w = await page.evaluate(() => ({ blank: Boolean(document.querySelector("#wrong .frac-blank")), eq: document.querySelector("#wrong .eq .frac")?.getAttribute("aria-label") }));
  check("3: 0.5 → 3/5 is incorrect, recorded once", l.relations["ifraction-1-2"]?.attempts.length === 1 && l.relations["ifraction-1-2"].attempts[0].correct === false);
  const s = await slashScan(page);
  check("wrong screen: prompt with an empty bar, relation 0.5 = 1/2 with a bar, no slash", w.blank && w.eq === "1/2" && clean(s), JSON.stringify({ ...w, ...s }));
  await page.screenshot({ path: `${SHOTS}/h5-05-wrong-375x667.png`, fullPage: true });
  await ctx.close();
}
{
  const { ctx, page } = await resumeOn("ifraction-1-2", 1366, 768);
  await page.keyboard.press("0"); await page.keyboard.press("1");
  await page.keyboard.press("/"); await page.keyboard.press("."); await page.keyboard.press("-");
  await tap(page, "denominator");
  await page.keyboard.press("0"); await page.keyboard.press("2");
  const f = await fields(page);
  check("physical keyboard: digits into the focused box; 「/」 「.」 「-」 ignored; 01 over 02 shows 1 over 2", f.n === "1" && f.d === "2", JSON.stringify(f));
  await page.screenshot({ path: `${SHOTS}/h5-06-leading-zeros-1366x768.png` });
  await page.keyboard.press("Enter");
  await page.waitForSelector("#correct");
  const l = await learnerOf(page);
  check("7: 01 over 02 is read as 1/2 → correct (Enter submits on desktop)", l.relations["ifraction-1-2"]?.attempts[0]?.correct === true && l.relations["ifraction-1-2"].attempts.length === 1);
  await ctx.close();
}

// 2. Both boxes, the keypad and 提交 fit at 375×667 and 390×753 (and the needs_simplification hint showing).
const vpRows = [];
for (const [vp, w, h] of [["375x667", 375, 667], ["390x753", 390, 753], ["390x844", 390, 844], ["1366x768", 1366, 768]]) {
  for (const id of ["ifraction-1-8", "ifraction-12-25"]) {
    const { ctx, page } = await resumeOn(id, w, h);
    const [n, d] = catalog.find((i) => i.id === id).canonical_answer.split("/").map(Number);
    await typeKeys(page, String(n * 2)); await tap(page, "denominator"); await typeKeys(page, String(d * 2));
    await submit(page);
    await page.waitForTimeout(120);
    const m = await page.evaluate(() => {
      window.scrollTo(0, 0);
      const r = (sel) => document.querySelector(sel).getBoundingClientRect();
      const keys = [...document.querySelectorAll(".keys .key:not(.ghost)")].map((k) => k.getBoundingClientRect().height);
      return {
        num: Math.round(r('#answer [data-field="numerator"]').bottom),
        den: Math.round(r('#answer [data-field="denominator"]').bottom),
        go: Math.round(r('.keys [data-action="submit"]').bottom),
        vh: window.innerHeight,
        scrollable: document.scrollingElement.scrollHeight > window.innerHeight + 1,
        minKey: Math.round(Math.min(...keys)),
        hOverflow: document.scrollingElement.scrollWidth > window.innerWidth + 0.5,
        nudge: document.getElementById("nudge").textContent.trim(),
      };
    });
    const ok = m.go <= m.vh && m.den <= m.vh && m.minKey >= 44 && !m.hOverflow;
    vpRows.push({ vp, id, ...m, ok });
    check(`viewport ${vp} ${id}: boxes + keypad + 提交 on screen (hint showing)`, ok, `numerator ${m.num}, denominator ${m.den}, 提交 bottom ${m.go} / vh ${m.vh}, minKey ${m.minKey}`);
    await page.screenshot({ path: `${SHOTS}/h5-train-${vp}-${id}-nudge.png` });
    await ctx.close();
  }
}

// 2b. No curriculum digit cap: 15 digits a box (the technical guard) still fit at 375 and 390 wide; the 16th is ignored.
for (const [vp, w, h] of [["375x667", 375, 667], ["390x753", 390, 753]]) {
  const { ctx, page } = await resumeOn("ifraction-1-8", w, h);
  await typeKeys(page, "1234567890123456");
  await tap(page, "denominator");
  await typeKeys(page, "98765");
  const m = await page.evaluate(() => {
    const r = (sel) => document.querySelector(sel).getBoundingClientRect();
    const zone = r(".practice-zone");
    const boxes = [...document.querySelectorAll("#answer .ff-box")].map((b) => ({ left: b.getBoundingClientRect().left, right: b.getBoundingClientRect().right, clipped: b.scrollWidth > b.clientWidth + 1 }));
    return { n: document.querySelector('#answer [data-field="numerator"]').getAttribute("data-value"), d: document.querySelector('#answer [data-field="denominator"]').getAttribute("data-value"), inside: boxes.every((b) => b.left >= zone.left && b.right <= zone.right), clipped: boxes.some((b) => b.clipped), hOverflow: document.scrollingElement.scrollWidth > window.innerWidth + 0.5, go: Math.round(r('.keys [data-action="submit"]').bottom), vh: window.innerHeight };
  });
  check(`no 4-digit cap ${vp}: 5+ digits accepted, 15-digit guard, boxes fit, 提交 on screen`, m.n === "123456789012345" && m.d === "98765" && m.inside && !m.clipped && !m.hOverflow && m.go <= m.vh, JSON.stringify(m));
  await page.screenshot({ path: `${SHOTS}/h5-07-long-digits-${vp}.png` });
  await ctx.close();
}

// 3. Mistake book, progress, print picker, A4 question and answer pages.
{
  let learner = emptyLearner();
  const meta = { day: today(), inputMode: "onscreen_keypad", elapsedMs: 900 };
  const wrongs = [["ifraction-1-8", "1/4"], ["ifraction-12-25", "1/2"], ["ifraction-1-2", "3/5"], ["fraction-1-8", "0.25"], ["fraction-1-7", "3"], ["fraction-3-4", "0.5"]];
  for (const [id, raw] of wrongs) {
    let s = startSession({ mode: "daily", day: today(), catalog, relations: learner.relations, seed: 1 });
    s = { ...s, queue: [id, ...s.queue.filter((q) => q !== id)] };
    const p = peekCurrent(s, catalog);
    learner = submitAnswer({ item: p.item, state: learner, session: p.session, raw, catalog, meta }).state;
  }
  const raw = JSON.stringify({ version: 3, active_learner_id: "ff", learners: { ff: { ...learner, profile: { learner_id: "ff", created_on: today() }, activeSession: null, prefs: { sound: false } } } });
  const { ctx, page, errors } = await freshPage(375, 667, raw);
  const surfaces = [];
  const scanAs = async (name, shot, fullPage = true) => {
    const s = await slashScan(page);
    surfaces.push({ name, ...s });
    check(`${name}: no slash fraction, no 「?/?」`, clean(s) && !s.bodySlash, JSON.stringify(s));
    await page.screenshot({ path: `${SHOTS}/${shot}`, fullPage });
  };
  await page.click('[data-action="mistakes"]');
  await page.waitForSelector("#mistakes .list");
  const mb = await page.evaluate(() => ({
    rows: [...document.querySelectorAll("#mistakes .list li")].map((li) => ({ id: li.dataset.id, blank: Boolean(li.querySelector(".frac-blank")), text: li.querySelector("span").textContent.trim() })),
  }));
  const fr = mb.rows.filter((r) => r.id.startsWith("ifraction-"));
  check("mistake book: decimal → fraction rows are 「0.125 =」 + an empty bar (no answer, no 「是哪个分数」)", fr.length === 3 && fr.every((r) => r.blank && /^\d\.\d+ =$/.test(r.text)), JSON.stringify(fr));
  await scanAs("mistake book", "h5-10-mistakes-375x667.png");
  await page.click('[data-action="a4-mistakes"]');
  await page.waitForSelector("#print-select");
  await scanAs("print picker", "h5-11-print-select-375x667.png");
  await page.click('[data-action="print-preview"]');
  await page.waitForSelector("#a4-sheet");
  const q = await page.evaluate(() => [...document.querySelectorAll("#a4-sheet li")].map((li) => ({ id: li.dataset.id, blank: Boolean(li.querySelector(".frac-blank")), line: Boolean(li.querySelector(".blank")), fracs: li.querySelectorAll(".frac:not(.frac-blank)").length })));
  check("A4 question page: decimal = an empty bar; 1/8 = ? drawn with a bar + a blank line", q.filter((r) => r.id.startsWith("ifraction-")).every((r) => r.blank && !r.line) && q.filter((r) => /^fraction-\d+-\d+$/.test(r.id)).every((r) => r.fracs === 1 && r.line), JSON.stringify(q));
  await scanAs("A4 question page", "h5-12-a4-questions-375x667.png");
  await page.emulateMedia({ media: "print" });
  await scanAs("A4 question page (print media)", "h5-13-a4-questions-print.png");
  await page.pdf({ path: `${SHOTS}/h5-a4-questions.pdf`, format: "A4" }).catch(() => {});
  await page.emulateMedia({ media: "screen" });
  await page.click('[data-action="toggle-answers"]');
  await page.waitForSelector("#a4-answers");
  const a = await page.evaluate(() => [...document.querySelectorAll("#a4-answers li")].map((li) => ({ id: li.dataset.id, fracs: [...li.querySelectorAll(".frac")].map((f) => f.getAttribute("aria-label")) })));
  check("A4 answer page: the simplest fraction drawn with a bar", a.filter((r) => r.id.startsWith("ifraction-")).every((r) => r.fracs.length === 1), JSON.stringify(a));
  await scanAs("A4 answer page", "h5-14-a4-answers-375x667.png");
  await page.emulateMedia({ media: "print" });
  await scanAs("A4 answer page (print media)", "h5-15-a4-answers-print.png");
  await page.pdf({ path: `${SHOTS}/h5-a4-answers.pdf`, format: "A4" }).catch(() => {});
  await page.emulateMedia({ media: "screen" });
  // Progress (recent outcomes) and its picker.
  await page.goto(`${BASE}h5/index.html`);
  await page.waitForSelector("#home");
  await page.click('[data-action="progress"]');
  await page.waitForSelector("#progress");
  const pr = await page.evaluate(() => [...document.querySelectorAll("#recent-outcomes li")].filter((li) => li.dataset.id.startsWith("ifraction-")).map((li) => ({ id: li.dataset.id, blank: Boolean(li.querySelector(".frac-blank")) })));
  check("progress: decimal → fraction rows are the prompt with an empty bar", pr.length === 3 && pr.every((r) => r.blank), JSON.stringify(pr));
  await scanAs("progress", "h5-16-progress-375x667.png");
  await page.click('[data-action="a4-progress"]');
  await page.waitForSelector("#print-select");
  await scanAs("progress print picker", "h5-17-progress-print-select-375x667.png");
  check("lists / print: no page errors", errors.length === 0, errors.join(" | "));
  await ctx.close();
}

await browser.close();
const failed = results.filter((r) => !r.ok).length;
writeFileSync(`${SHOTS}/h5-fraction-check.json`, JSON.stringify({ results, viewport: vpRows }, null, 2));
console.log(`\n${results.length - failed}/${results.length} passed`);
process.exit(failed ? 1 : 0);
