// WeChat DevTools simulator check of dist/weapp (the shared Taro pages) via
// miniprogram-automator: Home → Training → Correct (auto next) → Wrong
// (relation, 下一题) → pause / stop / end → Home, fraction / needs_simplification /
// repeating / decimal input, a full set of 10, v1 → v3 migration in wx storage,
// write protection (bad JSON, future version), and the migrated pages: 错题本
// (grouped by domain) → 印到纸上 (selector → A4 preview; no print button in the
// Mini Program), 最近练得怎么样, and 专项练习 (every domain → a focused set from
// that domain only). Screenshots of each screen.
//
// Needs WeChat DevTools (logged in, 设置 → 安全设置 → 服务端口 on) and
// miniprogram-automator, which is not a project dependency:
//
//   npm run build:weapp
//   npm i --no-save miniprogram-automator
//   node scripts/weapp-devtools-e2e.mjs        # SHOTS=… WECHAT_CLI=… optional
//
// Rewrites this project's wx storage key in the simulator (touristappid).
// Never uploads, previews or publishes. Every console error / exception the
// automator reports is printed in full (unknown DevTools errors included).
import { createRequire } from "node:module";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
const require = createRequire(import.meta.url);
const automator = require("miniprogram-automator");
const REPO = fileURLToPath(new URL("..", import.meta.url)).replace(/\/$/, "");
const SHOTS = process.env.SHOTS || `${REPO}/dist/weapp-shots`;
const CLI = process.env.WECHAT_CLI || "/Applications/wechatwebdevtools.app/Contents/MacOS/cli";
const KEY = "nsl-v01-state";
mkdirSync(SHOTS, { recursive: true });
const { loadCoreCatalog } = await import(`${REPO}/src/core/content.js`);
const { VIEWPORT_CASES, seededRaw } = await import(`${REPO}/scripts/viewport-cases.mjs`);
const { startSession } = await import(`${REPO}/src/core/session.js`);
const { DOMAIN_ORDER } = await import(`${REPO}/src/core/content.js`);
const { pagesSeed } = await import(`${REPO}/scripts/pages-seed.mjs`);
const LABELS = ["平方", "常用乘积", "分数到小数", "半数与翻倍", "补数", "立方", "常见幂", "凑整乘积家族"];
const catalog = loadCoreCatalog();
const byId = new Map(catalog.map((i) => [i.id, i]));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const out = [];
const events = []; // every console / exception event, in order, with the phase it happened in
let phase = "launch";
let failed = 0;
const check = (c, m) => { if (!c) throw new Error(m); };
async function step(name, fn) {
  phase = name;
  try { out.push(`PASS ${name} — ${await fn()}`); } catch (e) { failed++; out.push(`FAIL ${name} — ${e.message}`); }
}
const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
const blockOf = (item) => (item.answer_type === "decimal_repeating" ? item.canonical_answer.replace(/^\d+\.\((\d+)\)$/, "$1") : item.canonical_answer);
const wrongFor = (item) => (item.canonical_answer === "1" ? "2" : "1");

function seededRoot(ids) {
  const s = startSession({ mode: "daily", day: today(), relations: {}, catalog, seed: "e2e" });
  const session = { ...s, queue: ["square-6", ...ids], targetCount: ids.length + 1, cursor: 1, answered: 1, correctCount: 1, outcomes: [{ id: "square-6", correct: true, elapsedMs: 1500, inputMode: "onscreen_keypad" }] };
  return {
    version: 3,
    active_learner_id: "e2e-learner",
    learners: {
      "e2e-learner": {
        profile: { learner_id: "e2e-learner", created_on: today() },
        relations: { "square-6": { status: "learning", attempts: [{ correct: true, day: today(), slow: false, inputMode: "onscreen_keypad", elapsedMs: 1500 }], schedule: { due_day: today(), bucket: "1d", reason: "first-correct" } } },
        sessions: [],
        activeSession: session,
        prefs: { sound: false },
      },
    },
  };
}

// ---- DevTools session -------------------------------------------------------
let mp = null;
const hooked = []; // errors caught inside the app service, across launches
/** Serialise whatever the automator hands us, keeping the shape of "empty" objects visible. */
function describe(v) {
  if (v === null || v === undefined) return String(v);
  if (typeof v === "string") return JSON.stringify(v);
  if (typeof v !== "object") return String(v);
  const keys = Object.getOwnPropertyNames(v);
  let json;
  try { json = JSON.stringify(v, keys.length ? keys : undefined); } catch { json = "[unserialisable]"; }
  return `${Object.prototype.toString.call(v)} keys=[${keys.join(",")}] ${json}`;
}
/** In the app service: wrap console.error / wx.onError / unhandled rejections so Error objects keep message + stack. */
function hookAppErrors() {
  const g = typeof globalThis !== "undefined" ? globalThis : getApp();
  if (g.__nslErrs) return;
  g.__nslErrs = [];
  const fmt = (a) => {
    try {
      if (a && typeof a === "object" && (a.stack || a.message)) return `${a.name || "Error"}: ${a.message}\n${a.stack || ""}`;
      if (a && typeof a === "object") { const k = Object.getOwnPropertyNames(a); return `${Object.prototype.toString.call(a)} keys=[${k.join(",")}] ${JSON.stringify(a, k)}`; }
      return String(a);
    } catch (e) { return "[unserialisable]"; }
  };
  const orig = console.error;
  console.error = function (...args) { g.__nslErrs.push({ kind: "console.error", text: args.map(fmt).join(" "), page: (getCurrentPages().slice(-1)[0] || {}).route }); return orig.apply(this, args); };
  if (wx.onError) wx.onError((m) => g.__nslErrs.push({ kind: "wx.onError", text: String(m) }));
  if (wx.onUnhandledRejection) wx.onUnhandledRejection((r) => g.__nslErrs.push({ kind: "unhandledRejection", text: fmt(r && r.reason) }));
}
async function waitForPage() {
  for (let i = 0; i < 60; i++) {
    try { const p = await mp.currentPage(); if (p && p.path) break; } catch {}
    await sleep(500);
  }
  await sleep(1200);
}
async function hook() {
  try { await mp.evaluate(hookAppErrors); } catch (e) { events.push({ phase, src: "hook", message: `could not hook app errors: ${e.message}` }); }
}
/**
 * The record is read once per app launch (app/pages/record.js), so a new
 * stored state needs a fresh launch: write it, then wx.restartMiniProgram
 * (same DevTools session; closing and relaunching the project did not reliably
 * restart the app service).
 */
async function boot(raw) {
  if (!mp) {
    mp = await automator.launch({ cliPath: CLI, projectPath: `${REPO}/dist/weapp` });
    mp.on("console", (m) => events.push({ phase, src: "automator.console", type: m.type, args: (m.args || []).map(describe), ...(m.type === "error" ? { event: describe(m) } : {}) }));
    mp.on("exception", (e) => events.push({ phase, src: "automator.exception", message: e.message, stack: e.stack, raw: describe(e) }));
    await waitForPage();
    await hook();
    // Calibrate the capture: an Error logged from the app service on purpose.
    // Shows how the automator serialises an Error, and that the hook sees app-service errors.
    phase = "probe";
    try { await mp.evaluate(() => console.error(new Error("nsl-e2e-probe"))); } catch {}
    await sleep(500);
    phase = "launch";
  }
  if (raw === undefined) return;
  // let a pending auto-advance from the previous step write first, so it cannot overwrite the new state
  await sleep(1500);
  if (raw === null) await mp.callWxMethod("removeStorageSync", KEY);
  else await mp.callWxMethod("setStorageSync", KEY, raw);
  hooked.push(...(await appErrors()));
  await mp.callWxMethod("restartMiniProgram", { path: "/pages/home/index" });
  await sleep(3000);
  await waitForPage();
  await sleep(1000);
  await hook();
}
async function appErrors() {
  try { return await mp.evaluate(() => { const g = typeof globalThis !== "undefined" ? globalThis : getApp(); const e = g.__nslErrs || []; g.__nslErrs = []; return e; }); } catch { return []; }
}
const shot = (n) => mp.screenshot({ path: `${SHOTS}/weapp-${n}.png` });
const stored = async () => mp.callWxMethod("getStorageSync", KEY);
const learner = async () => { const r = JSON.parse(await stored()); return r.learners[r.active_learner_id]; };
async function currentItem() {
  const s = (await learner()).activeSession;
  return byId.get(s.queue[s.cursor]);
}
const has = async (page, sel) => (await page.$$(sel)).length > 0;
const textOf = async (page, sel) => { const e = await page.$(sel); return e ? (await e.text()).replace(/\s+/g, " ").trim() : null; };
async function waitFor(page, sel, ms = 4000) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) { if (await has(page, sel)) return Date.now() - t0; await sleep(40); }
  throw new Error(`timeout waiting for ${sel}`);
}
async function key(page, label) {
  for (const k of await page.$$(".key")) if ((await k.text()).trim() === label) return k;
  throw new Error(`no key ${label}`);
}
/** On-screen keys. In a fraction_fields answer 「/」 or 「|」 means "tap the denominator box" (there is no 「/」 key). */
async function press(page, text) {
  for (const ch of text) {
    if (ch === "/" || ch === "|") await (await page.$(".ff-denominator")).tap();
    else await (await key(page, ch)).tap();
    await sleep(250);
  }
}
async function fieldsOf(page) {
  const ff = await page.$(".fraction-fields");
  if (!ff) return null;
  const n = await page.$(".ff-numerator");
  const d = await page.$(".ff-denominator");
  const focus = /\bis-focus\b/.test((await n.attribute("class")) || "") ? "numerator" : /\bis-focus\b/.test((await d.attribute("class")) || "") ? "denominator" : null;
  return { focus, n: (await n.text()).trim(), d: (await d.text()).trim() };
}
async function tapText(page, sel, label) {
  for (const b of await page.$$(sel)) if ((await b.text()).includes(label)) { await b.tap(); return; }
  throw new Error(`no ${sel} 「${label}」`);
}
async function count(page) { return textOf(page, ".set-count"); }
async function waitCount(page, want, ms = 4000) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) { if ((await count(page)) === want) return Date.now() - t0; await sleep(40); }
  throw new Error(`count never ${want} (now ${await count(page)})`);
}
/** reLaunch Home and return the page that is really on top (a restart may still be settling). */
async function freshHome() {
  for (let i = 0; i < 3; i++) {
    await mp.reLaunch("/pages/home/index");
    await sleep(1500);
    const p = await mp.currentPage();
    if (p && p.path === "pages/home/index" && (await has(p, ".home-cta"))) return p;
  }
  throw new Error("Home did not settle");
}
async function startFromHome(page, label = "开始今天的练习") {
  await tapText(page, ".entry", label);
  await sleep(1200);
  const p = await mp.currentPage();
  await waitFor(p, ".screen-train");
  return p;
}

// ---- run --------------------------------------------------------------------
await boot();
await boot(null); // fresh launch with no record

let page;
await step("1 Home", async () => {
  page = await freshHome();
  const cta = await textOf(page, ".home-cta .entry-name");
  const sub = await textOf(page, ".home-cta .entry-sub");
  const title = await textOf(page, ".bubble-title");
  const cards = await Promise.all((await page.$$(".entry .entry-name")).map((e) => e.text()));
  const nav = await Promise.all((await page.$$(".tab-label")).map((e) => e.text()));
  const navOn = await textOf(page, ".tab.is-on .tab-label");
  const imgs = await Promise.all((await page.$$(".theme-img")).map((e) => e.attribute("src")));
  check(cta === "开始今天的练习" && /5～10/.test(sub || "") && title === "和数字做朋友", `home ${cta} ${sub} ${title}`);
  check(nav.join("/") === "首页/练习/错题本/我的" && navOn === "首页", `nav ${nav} ${navOn}`);
  check(imgs.some((s) => /mascot-welcome-512.*\.png$/.test(s || "")), `mascot src ${imgs}`);
  check(!imgs.some((s) => /\.(webp|svg)$/.test(s || "")), "no webp / svg");
  check(!(await has(page, ".logo .theme-img")), "logo slot empty in the Mini Program");
  await shot("01-home");
  // 专项练习 is a page now (no longer 敬请期待).
  await tapText(page, ".entry", "专项练习");
  await sleep(1500);
  const ex = await mp.currentPage();
  check(ex.path === "pages/explore/index", `专项练习 → ${ex.path}`);
  const domains = (await ex.$$(".domain-name")).length;
  check(domains === 8, `domains ${domains}`);
  await shot("01b-home-explore");
  page = await freshHome();
  return `${page.path}; 「${title}」; CTA 「${cta}」/${sub}; cards ${cards.join("/")}; nav ${nav.join("/")} (首页 on); mascot ${imgs.find((s) => /mascot/.test(s))}; no logo image (word mark only); 专项练习 → ${ex.path} (${domains} domain cards)`;
});

let first;
let homeFold = null;
let ledeLayout = null;
let endClear = "";
await step("2 Home → Training (FOCUS)", async () => {
  await sleep(1900);
  page = await startFromHome(page);
  check(page.path === "pages/train/index", `path ${page.path}`);
  check((await count(page)) === "第 1 题 · 共 10 题", `count ${await count(page)}`);
  check(!(await has(page, ".tabbar")) && !(await has(page, ".mascot")) && !(await has(page, ".page-decor")), "focus: no nav / mascot / decor");
  const label = await textOf(page, ".practice-label");
  const root = JSON.parse(await stored());
  check(root.version === 3, `stored version ${root.version}`);
  first = await currentItem();
  await tapText(page, ".key", "提交");
  await sleep(300);
  const nudge = await textOf(page, ".nudge");
  check(nudge === "先写一个数", `nudge ${nudge}`);
  check((await learner()).relations[first.id] === undefined, "empty submit stored nothing");
  await shot("02-training");
  return `${page.path} (query ${JSON.stringify(page.query)}); 「第 1 题 · 共 10 题」, 「${label}」, no nav / mascot / decor; wx storage version 3; empty 提交 → 「${nudge}」, nothing stored`;
});

await step("3 Correct → auto next", async () => {
  await press(page, blockOf(first));
  await tapText(page, ".key", "提交");
  const t0 = Date.now();
  await waitFor(page, ".screen-correct");
  const title = await textOf(page, ".feedback-title");
  const word = await textOf(page, ".word");
  const keys = (await page.$$(".key")).length;
  const imgs = await Promise.all((await page.$$(".theme-img")).map((e) => e.attribute("src")));
  await shot("03-correct");
  await waitCount(page, "第 2 题 · 共 10 题");
  const ms = Date.now() - t0;
  const att = (await learner()).relations[first.id].attempts.at(-1);
  check(title === "太棒了！" && word === "对" && keys === 0 && !(await has(page, ".tabbar")), `correct ${title} ${word} keys ${keys}`);
  check(imgs.some((s) => /mascot-correct-512.*\.png$/.test(s || "")), `mascot ${imgs}`);
  check(ms >= 600 && ms < 2000, `advanced after ${ms}ms`);
  check(att.correct === true && att.inputMode === "onscreen_keypad", JSON.stringify(att));
  return `${first.id} 「${blockOf(first)}」 → 「${title}」 「${word}」, correct mascot PNG, no keypad / nav / button; 「第 2 题 · 共 10 题」 after ${ms}ms with no tap (700ms + automation polling); wx attempt correct, onscreen_keypad`;
});

await step("4 Wrong → 下一题", async () => {
  const item = await currentItem();
  await press(page, wrongFor(item));
  await tapText(page, ".key", "提交");
  await waitFor(page, ".screen-wrong");
  await sleep(1300);
  const w = {
    still: await has(page, ".screen-wrong"),
    keys: (await page.$$(".key")).length,
    nav: await has(page, ".tabbar"),
    eq: await textOf(page, ".panel .eq"),
    hint: (await textOf(page, ".hint-label"))?.replace(/[\ue000-\uf8ff]/g, "").trim(),
    see: await textOf(page, ".see"),
    more: await Promise.all((await page.$$(".more")).map((e) => e.text())),
    next: await textOf(page, ".screen-wrong .cta"),
    thinking: (await Promise.all((await page.$$(".theme-img")).map((e) => e.attribute("src")))).some((s) => /mascot-thinking-512.*\.png$/.test(s || "")),
  };
  check(w.still && w.keys === 0 && !w.nav && w.thinking, JSON.stringify(w));
  check(w.hint === "小提示" && /看这里/.test(w.see) && w.more.join("/") === "看看这个规律/看看这几步" && w.next === "下一题", JSON.stringify(w));
  await shot("04-wrong");
  await tapText(page, ".more", "看看这个规律");
  await waitFor(page, ".pattern");
  await shot("04b-wrong-pattern");
  const l = await learner();
  check(l.relations[item.id].attempts.at(-1).correct === false, "wrong stored");
  check(Object.keys(l.activeSession.reappearPlan || {}).includes(item.id), "reappearance planned");
  await tapText(page, ".screen-wrong .cta", "下一题");
  await waitCount(page, "第 3 题 · 共 10 题");
  const next = await currentItem();
  check(next.id !== item.id, "different item");
  return `${item.id} typed 「${wrongFor(item)}」 → stays >1.3s on 「${w.eq}」; 小提示 / 看这里 / 看看这个规律 / 看看这几步; thinking mascot PNG; no keypad / nav / retry; pattern expands; wx: wrong attempt + reappearPlan; 下一题 → 「第 3 题 · 共 10 题」 (${next.id})`;
});

await step("5 Pause → 继续做 / 先停 → end → Home", async () => {
  await press(page, "1");
  await tapText(page, ".pill-quiet", "先停一下");
  await waitFor(page, ".screen-pause");
  const ask = await textOf(page, ".ask");
  const restartHere = await textOf(page, ".pause-restart");
  check(restartHere === "重新开始一小段", `pause restart ${restartHere}`);
  await shot("05-pause");
  await tapText(page, ".screen-pause .cta", "继续做");
  await waitFor(page, ".screen-train");
  const kept = await textOf(page, ".answer-text");
  await tapText(page, ".pill-quiet", "先停一下");
  await waitFor(page, ".screen-pause");
  await tapText(page, ".screen-pause .cta", "先停");
  await waitFor(page, ".screen-end");
  const e = { title: await textOf(page, ".end-title"), body: await textOf(page, ".end-card .body"), nav: await has(page, ".tabbar") };
  await sleep(300);
  await shot("06-end-stopped");
  check(/先停在这里/.test(ask || "") && kept === "1", `ask ${ask} kept ${kept}`);
  check(e.title === "先停在这里了" && e.body === "对了 1 题，做了 2 题。" && e.nav, JSON.stringify(e));
  const l = await learner();
  check(!l.activeSession && l.sessions.at(-1).earlyStop === true, "stored earlyStop");
  await tapText(page, ".screen-end .cta", "先到这里");
  await sleep(1200);
  page = await mp.currentPage();
  check(page.path === "pages/home/index", `back at ${page.path}`);
  const title = await textOf(page, ".bubble-title");
  await shot("07-home-after-stop");
  return `「${ask}」 → 继续做 keeps 「${kept}」 → 先停 → 「${e.title}」 「${e.body}」 (nav back) → 先到这里 → Home 「${title}」; wx sessions[-1].earlyStop`;
});

await step("6 Full set of 10 → end → Home done", async () => {
  page = await startFromHome(page, "开始今天的练习").catch(async () => startFromHome(page, "再练一小段"));
  for (let i = 0; i < 10; i += 1) {
    await waitFor(page, ".screen-train");
    const item = await currentItem();
    await press(page, blockOf(item));
    await tapText(page, ".key", "提交");
    await waitFor(page, ".screen-correct");
    if (i < 9) await waitFor(page, ".screen-train");
  }
  await waitFor(page, ".screen-end", 4000);
  const e = { title: await textOf(page, ".end-title"), body: await textOf(page, ".end-card .body") };
  await sleep(300);
  await shot("08-end-finished");
  check(e.title === "先到这里" && e.body === "对了 10 题，做了 10 题。", JSON.stringify(e));
  await tapText(page, ".screen-end .cta", "先到这里");
  await sleep(1200);
  page = await mp.currentPage();
  const h = { title: await textOf(page, ".bubble-title"), cta: await textOf(page, ".home-cta .entry-name"), sec: await textOf(page, ".home-secondary") };
  await shot("09-home-done");
  check(h.title === "今天这段练完了" && h.cta === "看看这次" && h.sec === "再练一小段", JSON.stringify(h));
  return `10 answers → 「${e.title}」 「${e.body}」 → Home 「${h.title}」 / 「${h.cta}」 / 「${h.sec}」`;
});

await step("7 Fraction · needs_simplification · repeating · decimal", async () => {
  await boot(JSON.stringify(seededRoot(["ifraction-1-2", "fraction-1-3", "fraction-1-2", "fraction-1-7"])));
  page = await freshHome();
  const h = { t: await textOf(page, ".bubble-title"), cta: await textOf(page, ".home-cta .entry-name"), sec: await textOf(page, ".home-secondary") };
  check(h.t === "还有一小段" && h.cta === "继续刚才的练习" && !h.sec, JSON.stringify(h));
  // Resume lede: exactly two lines 「刚才练到一半，」 / 「继续就好。」, each a single rendered line inside the bubble.
  const ledeLines = [];
  for (const l of await page.$$(".bubble-line")) {
    const o = await l.offset();
    const s = await l.size();
    ledeLines.push({ text: (await l.text()).trim(), top: Math.round(o.top), left: Math.round(o.left), w: Math.round(s.width), h: Math.round(s.height) });
  }
  const bubble = { o: await (await page.$(".bubble")).offset(), s: await (await page.$(".bubble")).size() };
  const bubbleRight = Math.round(bubble.o.left + bubble.s.width);
  check(
    ledeLines.length === 2 && ledeLines[0].text === "刚才练到一半，" && ledeLines[1].text === "继续就好。" &&
      ledeLines.every((l) => l.h > 0 && l.h <= 26 && l.left + l.w <= bubbleRight - 8) && ledeLines[1].top > ledeLines[0].top,
    `resume lede lines ${JSON.stringify(ledeLines)} bubble right ${bubbleRight}`,
  );
  ledeLayout = { lines: ledeLines, bubbleRight };
  // Above the fold on the 390×753 window: the resume hero and all four cards, fully.
  const sysH = (await mp.systemInfo()).windowHeight;
  const nav = await (await page.$(".tabbar")).offset();
  const fold = [];
  for (const e of await page.$$(".entry")) {
    const o = await e.offset();
    const s = await e.size();
    fold.push({ name: (await (await e.$(".entry-name")).text()).trim(), top: Math.round(o.top), bottom: Math.round(o.top + s.height) });
  }
  const navTop = Math.round(nav.top);
  const vis = (n) => fold.find((f) => f.name === n);
  check(vis("继续刚才的练习").bottom <= navTop && vis("专项练习").bottom <= navTop && vis("错题本").bottom <= navTop, `fold ${JSON.stringify(fold)} nav ${navTop}`);
  check(vis("最近练得怎么样").bottom <= navTop, `最近练得怎么样 not fully above the nav ${JSON.stringify(vis("最近练得怎么样"))}`);
  homeFold = { window: sysH, navTop, cards: fold, progressFull: vis("最近练得怎么样").bottom <= navTop };
  await shot("07-home-resume");
  page = await startFromHome(page, "继续刚才的练习");
  check((await currentItem()).id === "ifraction-1-2" && (await count(page)) === "第 2 题 · 共 5 题", "resumed at item 2");
  for (const k of await page.$$(".key")) check((await k.text()).trim() !== "/", "no 「/」 key");
  let ff = await fieldsOf(page);
  check(ff && ff.focus === "numerator" && ff.n === "" && ff.d === "", `fields ${JSON.stringify(ff)}`);
  check((await textOf(page, ".question-fields .question")) === "0.5 =", "stem 0.5 =");
  await shot("10a-fraction-fields-empty");
  await tapText(page, ".key", "提交");
  await sleep(300);
  check((await textOf(page, ".nudge")) === "先写一个分数", "empty → 先写一个分数");
  await press(page, "1|0");
  await tapText(page, ".key", "提交");
  await sleep(300);
  check((await textOf(page, ".nudge")) === "先写一个分数", "1 over 0 → 先写一个分数");
  check((await learner()).relations["ifraction-1-2"] === undefined, "empty / zero stored nothing");
  await tapText(page, ".key", "删除");
  await sleep(200);
  await tapText(page, ".key", "删除");
  await sleep(200);
  ff = await fieldsOf(page);
  check(ff.focus === "denominator" && ff.d === "" && ff.n === "1", `backspace stays ${JSON.stringify(ff)}`);
  await (await page.$(".ff-numerator")).tap();
  await sleep(200);
  await tapText(page, ".key", "删除");
  await sleep(200);
  await press(page, "02|04");
  ff = await fieldsOf(page);
  check(ff.n === "2" && ff.d === "4", `typed 02 over 04 shows 2 over 4 ${JSON.stringify(ff)}`);
  await shot("10b-typed-02-04-shows-2-4");
  await tapText(page, ".key", "提交");
  await sleep(400);
  const nudge = await textOf(page, ".nudge");
  const nudgeFracs = (await page.$$(".nudge .frac")).length;
  check(nudge === "24 和 12 一样大，再约到最简：12。" && nudgeFracs === 3, `nudge ${nudge} fracs ${nudgeFracs}`); // text() joins each fraction's numerator and denominator
  check((await learner()).relations["ifraction-1-2"] === undefined, "needs_simplification stored nothing");
  ff = await fieldsOf(page);
  check(ff.n === "2" && ff.d === "4", `no auto-simplify ${JSON.stringify(ff)}`);
  await shot("10-needs-simplification");
  for (let i = 0; i < 2; i++) { await tapText(page, ".key", "删除"); await sleep(200); }
  await press(page, "2");
  await (await page.$(".ff-numerator")).tap();
  await sleep(200);
  for (let i = 0; i < 2; i++) { await tapText(page, ".key", "删除"); await sleep(200); }
  await press(page, "01");
  await tapText(page, ".key", "提交");
  await waitFor(page, ".screen-correct");
  await waitFor(page, ".screen-train");
  check((await currentItem()).id === "fraction-1-3", "repeating item");
  const repInt = await textOf(page, ".rep-int");
  check(repInt === "0." && (await has(page, ".rep-slot")), `rep ${repInt}`);
  for (const k of await page.$$(".key")) { const t = (await k.text()).trim(); check(t !== "/" && t !== ".", `extra key ${t}`); }
  await press(page, "3");
  await shot("11-repeating");
  check(await has(page, ".rd"), "dotted digit");
  await tapText(page, ".key", "提交");
  await waitFor(page, ".screen-correct");
  const rel = await textOf(page, ".correct-eq");
  const repFound = await has(page, ".correct-eq .rep"); // read before the screenshot: the correct screen lasts 700ms
  await shot("12-repeating-correct");
  check(rel === "13 = 0.3" && !/[()]/.test(rel || "") && repFound, `relation ${rel}`);
  await waitFor(page, ".screen-train");
  check((await currentItem()).id === "fraction-1-2", "decimal item");
  await press(page, ".5");
  await tapText(page, ".key", "提交");
  await waitFor(page, ".screen-correct");
  const l = await learner();
  check(l.relations["ifraction-1-2"].attempts.length === 1 && l.relations["fraction-1-3"].attempts[0].correct && l.relations["fraction-1-2"].attempts[0].correct, "recorded once each");
  return `seeded v3 paused set → 「还有一小段」/继续刚才的练习 → 「第 2 题 · 共 5 题」; 0.5 = [分子]/[分母] (no 「/」 key) → empty and 1 over 0 → 「先写一个分数」 (0 records); typed 02 over 04 shows 2 over 4 → 「2/4 和 1/2 一样大，再约到最简：1/2。」 (${nudgeFracs} drawn fractions, 0 records) → 01 over 02 ✓; 0.( slot ) → 3 dotted (.rd) → correct relation 「1/3 = 0.3̇」 with no brackets ✓; 「.5」 ✓`;
});

await step("7b Complements: 「37 + ? = 100」", async () => {
  await boot(JSON.stringify(seededRoot(["comp-37"])));
  page = await freshHome();
  page = await startFromHome(page, "继续刚才的练习");
  check((await currentItem()).id === "comp-37", "comp-37 on screen");
  const q = await textOf(page, ".question");
  const c = await count(page);
  check(q === "37 + ? = 100", `prompt 「${q}」`);
  check(c === "第 2 题 · 共 2 题" && !/\//.test(c), `count 「${c}」`);
  await press(page, "63");
  await shot("13a-complement-37");
  await tapText(page, ".key", "提交");
  await waitFor(page, ".screen-correct");
  const rel = await textOf(page, ".correct-eq");
  await shot("13b-complement-37-correct");
  check(rel === "37 和 63 凑成 100", `relation ${rel}`);
  return `「${q}」, 「${c}」 → 63 → correct 「${rel}」`;
});

await step("8 v1 → v2 → v3 migration in wx storage", async () => {
  const v1 = JSON.parse(readFileSync(`${REPO}/test/fixtures/state-v1.json`, "utf8"));
  await boot(JSON.stringify(v1));
  page = await freshHome();
  const root = JSON.parse(await stored());
  const l = root.learners[root.active_learner_id];
  check(root.version === 3, `version ${root.version}`);
  for (const id of Object.keys(v1.relations)) check(JSON.stringify(l.relations[id].attempts) === JSON.stringify(v1.relations[id].attempts), `history ${id}`);
  const title = await textOf(page, ".bubble-title");
  return `stored v1 (${Object.keys(v1.relations).length} relations) → app launch → wx storage version 3, learner ${root.active_learner_id}, attempts kept; Home 「${title}」`;
});

for (const [name, raw] of [["bad JSON", "{not-json"], ["future version", JSON.stringify({ version: 4, learners: {} })]]) {
  await step(`9 Write protection (${name})`, async () => {
    await boot(raw);
    page = await freshHome();
    page = await startFromHome(page);
    const item = await currentItem().catch(() => null);
    check(item === null, "nothing readable in storage");
    // answer whatever is shown: try the catalog answers by prompt text is not needed — type one digit and stop
    await press(page, "1");
    await tapText(page, ".key", "提交");
    await sleep(1500);
    if (await has(page, ".screen-wrong")) await tapText(page, ".screen-wrong .cta", "下一题");
    await sleep(900);
    await tapText(page, ".pill-quiet", "先停一下");
    await waitFor(page, ".screen-pause");
    await tapText(page, ".screen-pause .cta", "先停");
    await waitFor(page, ".screen-end");
    const body = await textOf(page, ".end-card .body");
    const after = await stored();
    check(after === raw, `stored text changed: ${String(after).slice(0, 60)}`);
    return `${raw.slice(0, 14)} → practice works in memory (end 「${body}」), wx stored text byte-for-byte unchanged`;
  });
}

// Worst-case prompts (scripts/viewport-cases.mjs): 提交 fully inside the window
// (under the native nav bar) with nothing scrolled; keys >= 44px.
const viewportRows = [];
for (const c of VIEWPORT_CASES) {
  await step(`10 Viewport: 提交 on screen — ${c.name} (${c.item.id})`, async () => {
    await boot(seededRaw(c.item.id));
    page = await freshHome();
    page = await startFromHome(page, "继续刚才的练习");
    check((await currentItem()).id === c.item.id, "seeded item on screen");
    await press(page, c.type);
    if (c.submit) { await tapText(page, ".key", "提交"); await sleep(400); }
    await mp.pageScrollTo(0);
    await sleep(300);
    const sys = await mp.systemInfo();
    let submit = null;
    const heights = [];
    for (const k of await page.$$(".key")) {
      const t = (await k.text()).trim();
      if (!t) continue; // the empty slot left of 0
      const size = await k.size();
      heights.push(size.height);
      if (t === "提交") submit = { ...(await k.offset()), ...size };
    }
    check(submit, "提交 found");
    const bottom = Math.round(submit.top + submit.height);
    const nudge = c.submit ? await textOf(page, ".nudge") : "";
    await shot(`13-viewport-${c.name}`);
    const row = { case: c.name, item: c.item.id, model: sys.model, windowHeight: sys.windowHeight, windowWidth: sys.windowWidth, submitTop: Math.round(submit.top), submitBottom: bottom, minKey: Math.round(Math.min(...heights)) };
    viewportRows.push(row);
    check(bottom <= sys.windowHeight, `提交 bottom ${bottom} > window ${sys.windowHeight}`);
    check(row.minKey >= 44, `key ${row.minKey}px`);
    if (c.submit) check(/一样大/.test(nudge || ""), `nudge ${nudge}`);
    return `${sys.model} window ${sys.windowWidth}×${sys.windowHeight}: 「${c.item.prompt}」 typed ${c.type}${c.submit ? " + 提交 (nudge showing)" : ""} → 提交 ${row.submitTop}–${bottom} ≤ ${sys.windowHeight}; keys ≥ ${row.minKey}px`;
  });
}

// ---- migrated pages: 错题本 / 印到纸上 / 最近练得怎么样 / 专项练习 ---------------
const seedP = pagesSeed(catalog);
const RAWP = JSON.stringify(seedP.root);
const rowTexts = async (p, sel) => Promise.all((await p.$$(sel)).map(async (e) => (await e.text()).replace(/\s+/g, " ").trim()));
async function relaunch(path) {
  await mp.reLaunch(path);
  await sleep(1500);
  return mp.currentPage();
}

await step("11 错题本 → 印到纸上 (selector → A4 preview, no print button)", async () => {
  await boot(RAWP);
  page = await relaunch("/pages/mistakes/index");
  check(page.path === "pages/mistakes/index", `path ${page.path}`);
  const groups = await rowTexts(page, ".group-label");
  check(groups.join("/") === LABELS.join("/"), `groups ${groups}`);
  const rows = await rowTexts(page, ".mistake-group .list-row");
  check(rows.length === seedP.mistakes.length, `rows ${rows.length}`);
  // No slash fraction and no 「?/?」 in any row (a complement's own 「55 + ? = 100」 is the prompt itself).
  check(!rows.some((t) => /\//.test(t)), `a slash in a row: ${rows.find((t) => /\//.test(t))}`);
  const fb = await page.$(".mistake-group .frac-blank");
  check(fb, "fraction_fields row has the empty bar");
  const num = await (await fb.$(".num")).offset();
  const den = await (await fb.$(".den")).offset();
  check(num.top < den.top && Math.abs(num.left - den.left) < 3, `stacked ${JSON.stringify(num)} ${JSON.stringify(den)}`);
  check(!(await has(page, ".badge")) && (await has(page, ".tabbar")), "nav, no badges");
  check((await textOf(page, ".tab.is-on .tab-label")) === "错题本", "nav 错题本 on");
  await shot("20-mistakes");
  await tapText(page, ".cta", "印这些题");
  await sleep(1500);
  page = await mp.currentPage();
  check(page.path === "pages/print/index", `print path ${page.path}`);
  const cnt = await textOf(page, ".pick-count");
  check(cnt === `已选 ${seedP.mistakes.length} 题`, `count ${cnt}`);
  check((await page.$$(".pick")).length === seedP.mistakes.length && (await has(page, ".tabbar")), "rows + nav");
  await shot("21-print-select");
  await tapText(page, ".cta", "预览题目");
  await sleep(800);
  const items = (await page.$$(".sheet-item")).length;
  check(items === seedP.mistakes.length, `sheet items ${items}`);
  const buttons = await rowTexts(page, ".cta");
  check(!buttons.some((t) => /打印/.test(t)), `no print button in the Mini Program: ${buttons}`);
  const note = await textOf(page, ".print-note");
  check(/^小程序里不能直接打印/.test(note || ""), `note ${note}`);
  check(await has(page, ".sheet .frac-blank"), "A4 fraction_fields drawn as a bar");
  await shot("22-a4-preview");
  await tapText(page, ".cta", "答案单独一页");
  await sleep(600);
  check((await page.$$(".sheet-answers .sheet-item")).length === items && !(await has(page, ".sheet-list .blank")), "answers separate");
  await shot("23-a4-answers");
  return `groups ${groups.join("/")}; ${rows.length} rows, 0.5 = stacked empty bar, no slash; 印这些题 → 「${cnt}」 → A4 preview ${items} items, buttons ${buttons.join("/")}, note 「${note}」; answers on their own page`;
});

await step("12 最近练得怎么样 → 选题打印", async () => {
  page = await relaunch("/pages/home/index");
  await tapText(page, ".entry", "最近练得怎么样");
  await sleep(1500);
  page = await mp.currentPage();
  check(page.path === "pages/progress/index", `path ${page.path}`);
  const sessions = await rowTexts(page, ".sessions .list-row");
  check(sessions.length === 2 && /先停了/.test(sessions[0]) && /做完了/.test(sessions[1]), `sessions ${sessions}`);
  const outcomes = (await page.$$(".outcomes .list-row")).length;
  check(outcomes === seedP.practiced, `outcomes ${outcomes}`);
  check(await has(page, ".tabbar"), "nav");
  await shot("24-progress");
  await tapText(page, ".cta", "选题打印");
  await sleep(1500);
  page = await mp.currentPage();
  const cnt = await textOf(page, ".pick-count");
  check(page.path === "pages/print/index" && cnt === `已选 ${seedP.mistakes.length} 题`, `print from progress ${page.path} ${cnt}`);
  return `${sessions.join(" | ")}; ${outcomes} outcomes; 选题打印 → ${page.path} 「${cnt}」`;
});

await step("13 viewing pages leaves the record untouched", async () => {
  const raw = await stored();
  check(raw === RAWP, "stored record changed");
  return "nsl-v01-state byte-identical after 错题本 / 印到纸上 / 最近练得怎么样";
});

await step("14 专项练习: every domain card → confirm → focused set from that domain only", async () => {
  page = await relaunch("/pages/mistakes/index");
  await tapText(page, ".tab", "练习");
  await sleep(1500);
  page = await mp.currentPage();
  check(page.path === "pages/explore/index", `tab 练习 → ${page.path}`);
  const names = await rowTexts(page, ".domain-name");
  check(names.join("/") === LABELS.join("/"), `names ${names}`);
  const soon = await rowTexts(page, ".soon-name");
  check(soon.join("/") === "规律探索/概念/例题/动画", `soon ${soon}`);
  check((await textOf(page, ".tab.is-on .tab-label")) === "练习", "nav 练习 on");
  // Every tile shows something: the domain picture (PNG file) or the interface glyph — never an empty circle.
  const tiles = [];
  for (const t of await page.$$(".domain .tile")) {
    const img = await t.$(".theme-img");
    const src = img ? await img.attribute("src") : "";
    const glyph = (await t.$(".tile-glyph .icon")) ? (await (await t.$(".tile-glyph .icon")).text()).trim() : "";
    tiles.push(src ? `png:${src.split("/").pop()}` : glyph ? "glyph" : "EMPTY");
  }
  check(tiles.length === 8 && !tiles.includes("EMPTY"), `tiles ${tiles}`);
  check(tiles.slice(0, 3).every((t) => /^png:domain-(squares|products|fractions)-192.*\.png$/.test(t)), `v0.3 tiles ${tiles.slice(0, 3)}`);
  await shot("25-explore");
  const chips0 = await page.$$(".soon-chip");
  const last0 = chips0[chips0.length - 1];
  const lastPageBottom = (await last0.offset()).top + (await last0.size()).height; // at scroll 0: page = viewport coordinates
  await mp.pageScrollTo(400);
  await sleep(600);
  await shot("25b-explore-more");
  await mp.pageScrollTo(2000);
  await sleep(600);
  await shot("25c-explore-end");
  // At full scroll the last row clears the fixed nav (the page reserves the bottom safe-area inset too).
  const winH = (await mp.systemInfo()).windowHeight;
  const navH = (await (await page.$(".tabbar")).size()).height;
  const scrollTop = await page.scrollTop();
  check(scrollTop > 0, `page did not scroll (${scrollTop})`);
  const lastBottom = Math.round(lastPageBottom - scrollTop);
  check(lastBottom <= Math.round(winH - navH) + 1, `last row ${lastBottom} under the nav (top ${Math.round(winH - navH)})`);
  endClear = `${lastBottom} ≤ ${Math.round(winH - navH)}`;
  await mp.pageScrollTo(0);
  await sleep(300);
  const sets = [];
  for (const [n, domain] of DOMAIN_ORDER.entries()) {
    if (n) page = await relaunch("/pages/explore/index");
    await (await page.$$(".domain"))[n].tap();
    await sleep(700);
    const t = await textOf(page, ".focus-card .title");
    check(t === LABELS[n], `confirm ${t}`);
    if (n === 0 || n >= 3) await shot(`26-${n + 1}-focus-${domain}`);
    await tapText(page, ".cta", "开始这一小段");
    await sleep(1500);
    const tp = await mp.currentPage();
    await waitFor(tp, ".screen-train");
    const s = (await learner()).activeSession;
    check(s.mode === "focused" && s.domain === domain, `session ${s.mode}/${s.domain}`);
    const off = s.queue.filter((id) => byId.get(id).domain !== domain);
    check(off.length === 0, `${domain} set mixes ${off}`);
    if (n >= 3) await shot(`27-${n + 1}-train-${domain}`);
    sets.push(`${LABELS[n]} ${s.queue.length}`);
  }
  return `${names.join("/")}; tiles ${tiles.join(",")}; list end clears the nav (${endClear}); 敬请期待 only ${soon.join("/")}; focused sets ${sets.join(", ")} — each from its own domain`;
});

phase = "teardown";
hooked.push(...(await appErrors()));
await mp.callWxMethod("removeStorageSync", KEY);
await mp.close();

const errorEvents = events.filter((e) => e.src !== "automator.console" || e.type === "error" || e.type === "warn");
const report = { results: out, homeFold, viewport: viewportRows, appHookedErrors: hooked, automatorErrorEvents: errorEvents, allConsoleCount: events.length };
writeFileSync(`${SHOTS}/weapp-e2e-events.json`, JSON.stringify({ ...report, allEvents: events }, null, 2));
console.log(out.join("\n"));
console.log("\nAPP-HOOKED ERRORS", JSON.stringify(hooked, null, 1));
console.log("AUTOMATOR ERROR/WARN EVENTS", JSON.stringify(errorEvents, null, 1));
console.log("HOME FOLD", JSON.stringify(homeFold));
console.log("RESUME LEDE", JSON.stringify(ledeLayout));
console.log(`\n${out.length - failed}/${out.length} passed`);
process.exit(failed ? 1 : 0);
