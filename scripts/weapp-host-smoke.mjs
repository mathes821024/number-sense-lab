// Runs the built dist/weapp bundle in Node under a mocked Mini Program host
// (App / Page / wx). This is NOT the WeChat runtime and does not replace a
// WeChat DevTools check. It shows that the compiled weapp JS boots, renders
// Home / Training / Correct / Wrong through Taro's setData tree, handles taps
// through the generated event handler, and stores through wx.*StorageSync.
//
//   npm run build:weapp && npm run smoke:weapp
import vm from "node:vm";
import { readFileSync, existsSync } from "node:fs";
import { join, dirname, normalize } from "node:path";
import { fileURLToPath } from "node:url";
const REPO = fileURLToPath(new URL("..", import.meta.url));
const DIST = process.env.DIST || join(REPO, "dist/weapp");
const { loadCoreCatalog } = await import(join(REPO, "src/core/content.js"));
const byId = new Map(loadCoreCatalog().map((i) => [i.id, i]));
const learner = () => { const r = JSON.parse(storage.get("nsl-v01-state")); return r.learners[r.active_learner_id]; };

const storage = new Map();
const calls = [];
let appOptions = null;
const pageDefs = {};
let loadingRoute = null;
const stack = [];
const errors = [];

const wx = {
  getStorageSync: (k) => (calls.push(["getStorageSync", k]), storage.has(k) ? storage.get(k) : ""),
  setStorageSync: (k, v) => (calls.push(["setStorageSync", k]), storage.set(k, v)),
  removeStorageSync: (k) => (calls.push(["removeStorageSync", k]), storage.delete(k)),
  getSystemInfoSync: () => ({ platform: "devtools", windowWidth: 375, windowHeight: 812, screenWidth: 375, screenHeight: 812, pixelRatio: 2, safeArea: { bottom: 778, top: 44 }, SDKVersion: "3.6.0", version: "8.0.50" }),
  getWindowInfo: () => ({ windowWidth: 375, windowHeight: 812, screenWidth: 375, screenHeight: 812, pixelRatio: 2, safeArea: { bottom: 778, top: 44 } }),
  getDeviceInfo: () => ({ platform: "devtools" }),
  getAppBaseInfo: () => ({ SDKVersion: "3.6.0" }),
  canIUse: () => true,
  nextTick: (fn) => Promise.resolve().then(fn),
  navigateTo: ({ url, success }) => { setTimeout(() => { openPage(url); success?.(); }, 0); },
  redirectTo: ({ url, success }) => { setTimeout(() => { closeTop(); openPage(url); success?.(); }, 0); },
  reLaunch: ({ url, success }) => { setTimeout(() => { while (stack.length) closeTop(); openPage(url); success?.(); }, 0); },
  navigateBack: () => { setTimeout(() => { closeTop(); stack.at(-1)?.onShow?.(); }, 0); },
  createWebAudioContext: undefined,
  getMenuButtonBoundingClientRect: () => ({ top: 48, bottom: 80, height: 32, width: 87, left: 281, right: 368 }),
  onAppShow() {}, onAppHide() {}, offAppShow() {}, offAppHide() {},
  createSelectorQuery: () => ({ select: () => ({ boundingClientRect: () => ({ exec: (cb) => cb?.([]) }) }), selectAll() { return this; }, exec: (cb) => cb?.([]) }),
};

const context = vm.createContext({
  wx, console, setTimeout, clearTimeout, setInterval, clearInterval, Promise, Date, Math, JSON,
  App: (o) => { appOptions = o; },
  Page: (o) => { pageDefs[loadingRoute] = o; },
  Component: (o) => { pageDefs[`component:${loadingRoute}`] = o; },
  Behavior: (o) => o,
  getApp: () => appOptions,
  getCurrentPages: () => stack,
  requirePlugin: () => ({}),
});
context.globalThis = context;
const cache = new Map();
function requireFrom(file) {
  const abs = normalize(file.endsWith(".js") ? file : `${file}.js`);
  if (cache.has(abs)) return cache.get(abs).exports;
  const module = { exports: {} };
  cache.set(abs, module);
  const code = readFileSync(abs, "utf8");
  const fn = vm.runInContext(`(function (require, module, exports) {${code}\n})`, context, { filename: abs });
  fn((p) => requireFrom(join(dirname(abs), p)), module, module.exports);
  return module.exports;
}

function setPath(obj, path, value) {
  const keys = [];
  path.replace(/\[(\d+)\]|([^.[\]]+)/g, (_, i, k) => keys.push(i !== undefined ? Number(i) : k));
  let o = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    const k = keys[i];
    if (o[k] == null) o[k] = typeof keys[i + 1] === "number" ? [] : {};
    o = o[k];
  }
  o[keys.at(-1)] = value;
}

function openPage(url) {
  const [path, qs = ""] = url.replace(/^\//, "").split("?");
  const query = Object.fromEntries(new URLSearchParams(qs));
  loadingRoute = path;
  if (!pageDefs[path]) requireFrom(join(DIST, path));
  const def = pageDefs[path];
  const inst = Object.create(null);
  Object.assign(inst, def);
  inst.data = JSON.parse(JSON.stringify(def.data || {}));
  inst.route = path;
  inst.__route__ = path;
  inst.options = query;
  inst.setData = (patch, cb) => { for (const [k, v] of Object.entries(patch)) setPath(inst.data, k, v); cb && setTimeout(cb, 0); };
  inst.selectComponent = () => null;
  inst.createSelectorQuery = wx.createSelectorQuery;
  stack.push(inst);
  inst.onLoad?.call(inst, query);
  inst.onShow?.call(inst);
  inst.onReady?.call(inst);
  return inst;
}
function closeTop() {
  const p = stack.pop();
  p?.onUnload?.call(p);
}

// tree helpers over the setData tree
function walk(node, fn) { if (!node) return; fn(node); for (const c of node.cn || []) walk(c, fn); }
function text(node) {
  if (!node) return "";
  if ((` ${node.cl || ""} `).includes(" frac ")) return `${text(node.cn[0])}/${text(node.cn[1])}`;
  return (typeof node.v === "string" ? node.v : "") + (node.cn || []).map(text).join("");
}
function byClass(cls) { const out = []; walk(stack.at(-1).data.root, (n) => { if ((` ${n.cl || ""} `).includes(` ${cls} `)) out.push(n); }); return out; }
function tap(node) {
  const page = stack.at(-1);
  const ev = { type: "tap", timeStamp: Date.now(), detail: {}, target: { id: node.uid || node.sid, dataset: { sid: node.sid } }, currentTarget: { id: node.uid || node.sid, dataset: { sid: node.sid } }, mark: {} };
  page.eh.call(page, ev);
}
const tick = (ms = 30) => new Promise((r) => setTimeout(r, ms));
const results = [];
let failed = 0;
const check = (c, m) => { if (!c) throw new Error(m); };
async function step(name, fn) { try { results.push(`PASS ${name} — ${await fn()}`); } catch (e) { failed++; results.push(`FAIL ${name} — ${e.stack.split("\n").slice(0, 2).join(" ")}`); } }

const keyNode = (label) => byClass("key").find((k) => text(k) === label);
const prompt = () => byClass("question")[0];
// the item on screen = the v3 active session cursor (the same thing the page renders)
const itemNow = () => { const s = learner().activeSession; const it = byId.get(s.queue[s.cursor]); check(it && byClass("screen-train").length === 1, `item ${s.queue[s.cursor]}`); return it; };
const blockOf = (item) => (item.answer_type === "decimal_repeating" ? item.canonical_answer.replace(/^\d+\.\((\d+)\)$/, "$1") : item.canonical_answer);

// SMOKE_PART=fraction: a second app launch over a stored set whose next item
// is ifraction-1-2 (the main run starts it and reports its result).
const PART = process.env.SMOKE_PART || "main";
if (PART === "fraction") {
  const { seededRaw } = await import(join(REPO, "scripts/viewport-cases.mjs"));
  storage.set("nsl-v01-state", seededRaw("ifraction-1-2"));
}
const mainOnly = (name, fn) => (PART === "main" ? step(name, fn) : null);

await step("weapp boot", async () => {
  check(existsSync(join(DIST, "app.json")) && existsSync(join(DIST, "pages/home/index.wxml")) && existsSync(join(DIST, "pages/train/index.wxml")), "dist files");
  loadingRoute = "app";
  requireFrom(join(DIST, "app"));
  check(appOptions, "App() registered");
  appOptions.onLaunch?.call(appOptions, { path: "pages/home/index", query: {} });
  appOptions.onShow?.call(appOptions, { path: "pages/home/index", query: {} });
  openPage("pages/home/index");
  await tick(80);
  const cta = byClass("home-cta")[0];
  check(cta && text(cta).includes(PART === "fraction" ? "继续刚才的练习" : "开始今天的练习"), `home cta ${cta && text(cta)}`);
  const nav = byClass("tab-label").map(text);
  const img = byClass("theme-img")[0];
  return `App() + Page(home) ran; setData tree shows 「${text(cta)}」; nav ${nav.join("/")}; mascot image node ${JSON.stringify(Object.fromEntries(Object.entries(img || {}).filter(([k]) => k !== "cn")))}`;
});

await mainOnly("Home → Training", async () => {
  tap(byClass("home-cta")[0]);
  await tick(100);
  check(stack.at(-1).route === "pages/train/index", `route ${stack.at(-1).route}`);
  const count = text(byClass("set-count")[0]);
  check(count === "1 / 10", `count ${count}`);
  check(byClass("tabbar").length === 0 && byClass("mascot").length === 0, "focus: no nav, no mascot");
  return `navigateTo pages/train/index?intent=start-daily; 「${count}」; prompt 「${text(prompt())}」; no nav/mascot`;
});

let first;
await mainOnly("Correct (keypad tap → short pause → next)", async () => {
  first = itemNow();
  for (const ch of blockOf(first)) { tap(keyNode(ch)); await tick(5); }
  const shown = text(byClass("answer-box")[0] || byClass("answer-text")[0]);
  tap(keyNode("提交"));
  await tick(30);
  const card = byClass("screen-correct")[0];
  check(card && text(card).includes("太棒了") && text(card).includes("对"), `correct card ${card && text(card)}`);
  const t0 = Date.now();
  while (!byClass("set-count")[0] && Date.now() - t0 < 3000) await tick(20);
  const adv = Date.now() - t0;
  check(text(byClass("set-count")[0]) === "2 / 10", "2 / 10");
  check(adv > 550 && adv < 1500, `pause ${adv}ms`);
  const root = JSON.parse(storage.get("nsl-v01-state"));
  check(root.version === 3, `version ${root.version}`);
  check(learner().relations[first.id].attempts[0].correct === true, "stored");
  return `${first.id} → ${first.canonical_answer}; card 「${text(card)}」; auto-advanced after ~${adv}ms to 2 / 10; wx storage (v3) has the correct attempt; typed 「${shown}」`;
});

await mainOnly("Wrong (relation stays, 下一题, no retry)", async () => {
  const item = itemNow();
  const typed = item.canonical_answer === "1" ? "2" : "1";
  tap(keyNode(typed));
  tap(keyNode("提交"));
  await tick(1200);
  const eq = byClass("eq")[0];
  check(eq && text(eq).replace(/\s/g, "").length > 0, `relation ${eq && text(eq)}`);
  check(byClass("key").length === 0, "no keypad on wrong");
  const next = byClass("cta").find((b) => text(b) === "下一题");
  check(next, "下一题");
  tap(next);
  await tick(50);
  const count = text(byClass("set-count")[0]);
  const after = itemNow();
  check(count === "3 / 10" && after.id !== item.id, `after ${count} ${after.id}`);
  const st = learner();
  check(st.relations[item.id].attempts.at(-1).correct === false && st.activeSession.answered === 2, "stored wrong");
  return `${item.id} typed ${typed}; stays 1.2s on 「${text(eq)}」; no keypad; 下一题 → ${count}, different item ${after.id}; wx storage answered 2`;
});

if (PART === "fraction") await step("Fraction fields (two boxes, no 「/」 key, not-an-attempt, needs_simplification, correct)", async () => {
  // This part runs as its own app launch over a stored unfinished set (the
  // record is read once per launch): see SMOKE_PART below.
  tap(byClass("home-cta")[0]);
  await tick(100);
  check(stack.at(-1).route === "pages/train/index", `route ${stack.at(-1).route}`);
  await tick(80);
  check(itemNow().id === "ifraction-1-2", "seeded ifraction-1-2");
  const box = (w) => byClass(`ff-${w}`)[0];
  const focusOf = () => (` ${box("numerator")?.cl} `.includes(" is-focus ") ? "numerator" : ` ${box("denominator")?.cl} `.includes(" is-focus ") ? "denominator" : null);
  check(byClass("fraction-fields").length === 1 && box("numerator") && box("denominator") && byClass("ff-bar").length === 1, "two boxes and a bar");
  check(!byClass("key").some((k) => text(k) === "/"), "no 「/」 key");
  check(text(byClass("question")[0]).trim() === "0.5 =" && byClass("answer").length === 0, `stem 「${text(byClass("question")[0])}」, no single answer box`);
  check(focusOf() === "numerator", "focus starts on the numerator");
  const nudge = () => text(byClass("nudge")[0]);
  tap(keyNode("提交")); await tick(20);
  check(nudge() === "先写一个分数", `empty → ${nudge()}`);
  tap(keyNode("1")); tap(box("denominator")); await tick(10);
  check(focusOf() === "denominator", "tap moves the focus");
  tap(keyNode("0")); tap(keyNode("提交")); await tick(20);
  check(nudge() === "先写一个分数" && !learner().relations["ifraction-1-2"], "1 over 0 → not an attempt");
  tap(keyNode("删除")); tap(keyNode("删除")); await tick(10);
  check(focusOf() === "denominator" && text(box("denominator")).trim() === "" && text(box("numerator")).trim() === "1", "backspace stays in the empty box");
  tap(box("numerator")); tap(keyNode("删除")); tap(keyNode("2")); tap(box("denominator")); tap(keyNode("4")); tap(keyNode("提交")); await tick(20);
  check(/一样大，再约到最简/.test(nudge()) && !learner().relations["ifraction-1-2"], `2 over 4 → ${nudge()}`);
  tap(keyNode("删除")); tap(keyNode("2")); tap(box("numerator")); tap(keyNode("删除")); tap(keyNode("1")); tap(keyNode("提交")); await tick(30);
  check(byClass("screen-correct").length === 1, "1 over 2 → correct");
  const a = learner().relations["ifraction-1-2"].attempts;
  check(a.length === 1 && a[0].correct === true, "recorded once, correct");
  return "0.5 = [分子] over [分母] (focus 分子, no 「/」 key); empty and 1 over 0 → 「先写一个分数」 (0 records); backspace stays; 2 over 4 → needs_simplification (0 records); 1 over 2 → correct (1 record)";
});

await step("storage went through wx.*StorageSync", async () => {
  const ops = new Set(calls.map(([op]) => op));
  check(ops.has("getStorageSync") && ops.has("setStorageSync"), [...ops].join());
  check(calls.every(([, k]) => k === "nsl-v01-state" || !k.startsWith("nsl")), "only the contract key");
  return `${calls.length} calls (${[...ops].join(", ")}) on key nsl-v01-state`;
});

if (PART === "main") {
  const { spawnSync } = await import("node:child_process");
  const child = spawnSync(process.execPath, [fileURLToPath(import.meta.url)], { env: { ...process.env, SMOKE_PART: "fraction" }, encoding: "utf8" });
  const lines = (child.stdout || "").split("\n").filter((l) => /^(PASS|FAIL) /.test(l) && !/weapp boot|storage went through/.test(l));
  if (child.status !== 0 || lines.length === 0) failed++;
  results.push(...(lines.length ? lines.map((l) => l.replace(/^(PASS|FAIL) /, "$1 [2nd launch] ")) : [`FAIL [2nd launch] fraction part did not run: ${child.stderr}`]));
}
console.log(results.join("\n"));
console.log(`\n${results.length - failed}/${results.length} passed`);
process.exit(failed ? 1 : 0);
