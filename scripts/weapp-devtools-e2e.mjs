// WeChat DevTools simulator check of dist/weapp (the shared Taro pages) via
// miniprogram-automator: Home → Training → Correct (auto next) → Wrong
// (relation, 下一题) → pause / stop / end → Home, fraction / needs_simplification /
// repeating / decimal input, a full set of 10, v1 → v3 migration in wx storage,
// and write protection (bad JSON, future version). Screenshots of each screen.
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
async function press(page, text) { for (const ch of text) { await (await key(page, ch)).tap(); await sleep(250); } }
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
  await tapText(page, ".entry", "专项练习");
  await sleep(300);
  const toast = await textOf(page, ".toast");
  check(toast === "专项练习 · 敬请期待", `toast ${toast}`);
  await shot("01b-home-soon");
  return `${page.path}; 「${title}」; CTA 「${cta}」/${sub}; cards ${cards.join("/")}; nav ${nav.join("/")} (首页 on); mascot ${imgs.find((s) => /mascot/.test(s))}; no logo image (word mark only); 专项练习 → 「${toast}」`;
});

let first;
await step("2 Home → Training (FOCUS)", async () => {
  await sleep(1900);
  page = await startFromHome(page);
  check(page.path === "pages/train/index", `path ${page.path}`);
  check((await count(page)) === "1 / 10", `count ${await count(page)}`);
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
  return `${page.path} (query ${JSON.stringify(page.query)}); 「1 / 10」, 「${label}」, no nav / mascot / decor; wx storage version 3; empty 提交 → 「${nudge}」, nothing stored`;
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
  await waitCount(page, "2 / 10");
  const ms = Date.now() - t0;
  const att = (await learner()).relations[first.id].attempts.at(-1);
  check(title === "太棒了！" && word === "对" && keys === 0 && !(await has(page, ".tabbar")), `correct ${title} ${word} keys ${keys}`);
  check(imgs.some((s) => /mascot-correct-512.*\.png$/.test(s || "")), `mascot ${imgs}`);
  check(ms >= 600 && ms < 2000, `advanced after ${ms}ms`);
  check(att.correct === true && att.inputMode === "onscreen_keypad", JSON.stringify(att));
  return `${first.id} 「${blockOf(first)}」 → 「${title}」 「${word}」, correct mascot PNG, no keypad / nav / button; 2 / 10 after ${ms}ms with no tap (700ms + automation polling); wx attempt correct, onscreen_keypad`;
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
  await waitCount(page, "3 / 10");
  const next = await currentItem();
  check(next.id !== item.id, "different item");
  return `${item.id} typed 「${wrongFor(item)}」 → stays >1.3s on 「${w.eq}」; 小提示 / 看这里 / 看看这个规律 / 看看这几步; thinking mascot PNG; no keypad / nav / retry; pattern expands; wx: wrong attempt + reappearPlan; 下一题 → 3 / 10 (${next.id})`;
});

await step("5 Pause → 继续做 / 先停 → end → Home", async () => {
  await press(page, "1");
  await tapText(page, ".pill-quiet", "先停一下");
  await waitFor(page, ".screen-pause");
  const ask = await textOf(page, ".ask");
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
  check(h.t === "还有一小段" && h.cta === "继续刚才的练习" && h.sec === "重新开始一小段", JSON.stringify(h));
  page = await startFromHome(page, "继续刚才的练习");
  check((await currentItem()).id === "ifraction-1-2" && (await count(page)) === "2 / 5", "resumed at item 2");
  await press(page, "2/4");
  const den = await textOf(page, ".answer-frac .den");
  check(den === "4", `answer fraction den ${den}`);
  await tapText(page, ".key", "提交");
  await sleep(400);
  const nudge = await textOf(page, ".nudge");
  const nudgeFracs = (await page.$$(".nudge .frac")).length;
  check(nudge === "24 和 12 一样大，再约到最简：12。" && nudgeFracs === 3, `nudge ${nudge} fracs ${nudgeFracs}`); // text() joins each fraction's numerator and denominator
  check((await learner()).relations["ifraction-1-2"] === undefined, "needs_simplification stored nothing");
  await shot("10-needs-simplification");
  for (let i = 0; i < 3; i++) { await tapText(page, ".key", "删除"); await sleep(200); }
  await press(page, "1/2");
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
  return `seeded v3 paused set → 「还有一小段」/继续刚才的练习 → 2 / 5; 2/4 drawn as a fraction → 「2/4 和 1/2 一样大，再约到最简：1/2。」 (${nudgeFracs} drawn fractions, 0 records) → 1/2 ✓; 0.( slot ) → 3 dotted (.rd) → correct relation 「1/3 = 0.3̇」 with no brackets ✓; 「.5」 ✓`;
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

phase = "teardown";
hooked.push(...(await appErrors()));
await mp.callWxMethod("removeStorageSync", KEY);
await mp.close();

const errorEvents = events.filter((e) => e.src !== "automator.console" || e.type === "error" || e.type === "warn");
const report = { results: out, viewport: viewportRows, appHookedErrors: hooked, automatorErrorEvents: errorEvents, allConsoleCount: events.length };
writeFileSync(`${SHOTS}/weapp-e2e-events.json`, JSON.stringify({ ...report, allEvents: events }, null, 2));
console.log(out.join("\n"));
console.log("\nAPP-HOOKED ERRORS", JSON.stringify(hooked, null, 1));
console.log("AUTOMATOR ERROR/WARN EVENTS", JSON.stringify(errorEvents, null, 1));
console.log(`\n${out.length - failed}/${out.length} passed`);
process.exit(failed ? 1 : 0);
