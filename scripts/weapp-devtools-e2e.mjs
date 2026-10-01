// WeChat DevTools runtime check of dist/weapp via miniprogram-automator:
// Home → Training → Correct (short pause) → Wrong (relation, 下一题), with screenshots.
// Needs WeChat DevTools (logged in, 设置 → 安全设置 → 服务端口 on) and
// miniprogram-automator, which is not a project dependency:
//
//   npm run build:weapp
//   npm i --no-save miniprogram-automator
//   node scripts/weapp-devtools-e2e.mjs        # SHOTS=… WECHAT_CLI=… optional
//
// Clears this project's wx storage in the simulator. Never uploads or previews.
import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
const require = createRequire(import.meta.url);
const automator = require("miniprogram-automator");
const REPO = fileURLToPath(new URL("..", import.meta.url)).replace(/\/$/, "");
const SHOTS = process.env.SHOTS || `${REPO}/dist/weapp-shots`;
mkdirSync(SHOTS, { recursive: true });
const { loadCoreCatalog } = await import(`${REPO}/src/core/content.js`);
const byPrompt = new Map(loadCoreCatalog().map((i) => [i.prompt, i]));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const out = [];
let failed = 0;
const check = (c, m) => { if (!c) throw new Error(m); };
async function step(name, fn) { try { out.push(`PASS ${name} — ${await fn()}`); } catch (e) { failed++; out.push(`FAIL ${name} — ${e.message}`); } }

const mp = await automator.launch({
  cliPath: process.env.WECHAT_CLI || "/Applications/wechatwebdevtools.app/Contents/MacOS/cli",
  projectPath: `${REPO}/dist/weapp`,
});
const logs = [];
mp.on("console", (m) => logs.push(`${m.type}: ${(m.args || []).map((a) => (typeof a === "string" ? a : JSON.stringify(a))).join(" ").slice(0, 300)}`));
mp.on("exception", (e) => logs.push(`EXCEPTION ${e.message}`));
// wait for the first compile and the first page
for (let i = 0; i < 60; i++) {
  try { const p = await mp.currentPage(); if (p && p.path) break; } catch {}
  await sleep(500);
}
await sleep(1500);
const shot = (n) => mp.screenshot({ path: `${SHOTS}/weapp-${n}.png` });

async function promptText(page) {
  const q = await page.$(".question");
  const fr = await q.$$(".frac");
  if (fr.length) {
    const num = await (await fr[0].$(".frac-num")).text();
    const den = await (await fr[0].$(".frac-den")).text();
    const all = await q.text();
    return all.replace(`${num}${den}`, `${num}/${den}`).trim();
  }
  return (await q.text()).trim();
}
async function key(page, label) {
  for (const k of await page.$$(".key")) if ((await k.text()).trim() === label) return k;
  throw new Error(`no key ${label}`);
}

let page;
await step("Home", async () => {
  await mp.callWxMethod("clearStorageSync");
  page = await mp.reLaunch("/pages/home/index");
  await page.waitFor(1500);
  const cta = (await (await page.$(".home-cta")).text()).replace(/\s+/g, " ").trim();
  const nav = await Promise.all((await page.$$(".nav-label")).map((n) => n.text()));
  check(cta.includes("开始今天的练习"), `cta ${cta}`);
  await shot("01-home");
  return `${page.path}; CTA 「${cta}」; nav ${nav.join("/")}`;
});

let first;
await step("Home → Training", async () => {
  await (await page.$(".home-cta")).tap();
  await sleep(1500);
  page = await mp.currentPage();
  check(page.path === "pages/train/index", `path ${page.path}`);
  const count = await (await page.$(".set-count")).text();
  check(count.trim() === "1 / 10", `count ${count}`);
  check((await page.$$(".bottom-nav")).length === 0 && (await page.$$(".mascot")).length === 0, "focus");
  first = byPrompt.get(await promptText(page));
  check(first, "prompt in catalog");
  await shot("02-training");
  return `${page.path}; 「${count.trim()}」; 「${first.prompt}」; no nav, no mascot`;
});

await step("Correct → short pause → next", async () => {
  for (const ch of first.canonical_answer) { await (await key(page, ch)).tap(); await sleep(350); }
  const ans = (await (await page.$(".answer")).text()).trim();
  check(ans === first.canonical_answer, `answer ${ans}`);
  await (await key(page, "提交")).tap();
  await sleep(150);
  const card = await page.$(".feedback-card");
  check(card, "correct card");
  const cardText = (await card.text()).replace(/\s+/g, "");
  await shot("03-correct");
  const t0 = Date.now();
  let count = "";
  while (Date.now() - t0 < 4000) { const c = await page.$(".set-count"); if (c) { count = (await c.text()).trim(); break; } await sleep(50); }
  check(count === "2 / 10", `after ${count}`);
  const st = JSON.parse(await mp.callWxMethod("getStorageSync", "nsl-v01-state"));
  check(st.relations[first.id].attempts[0].correct === true, "stored");
  return `${first.prompt} → ${first.canonical_answer}; 「${cardText}」 (screenshot taken during the pause); then ${count} without any tap; wx storage has the correct attempt`;
});

await step("Wrong → relation stays → 下一题", async () => {
  const item = byPrompt.get(await promptText(page));
  check(item, "prompt");
  const typed = item.canonical_answer === "1" ? "2" : "1";
  await (await key(page, typed)).tap();
  await sleep(350);
  await (await key(page, "提交")).tap();
  await sleep(1500);
  const eq = (await (await page.$(".eq")).text()).trim();
  check(eq === item.relation, `eq ${eq}`);
  check((await page.$$(".key")).length === 0, "no keypad");
  await shot("04-wrong");
  let next = null;
  for (const b of await page.$$(".btn-primary")) if ((await b.text()).includes("下一题")) next = b;
  check(next, "下一题");
  await next.tap();
  await sleep(800);
  const count = (await (await page.$(".set-count")).text()).trim();
  const after = byPrompt.get(await promptText(page));
  check(count === "3 / 10" && after && after.id !== item.id, `after ${count}`);
  await shot("05-next");
  const st = JSON.parse(await mp.callWxMethod("getStorageSync", "nsl-v01-state"));
  check(st.activeSession.answered === 2 && st.relations[item.id].attempts[0].correct === false, "stored wrong");
  return `${item.prompt} typed ${typed}; stays 1.5s on 「${eq}」; no keypad; 下一题 → ${count}, different item ${after.id}; wx storage answered 2`;
});

await step("Correct pause timing (no screenshot)", async () => {
  const item = byPrompt.get(await promptText(page));
  check(item, "prompt");
  const fracs = (await (await page.$(".question")).$$(".frac")).length;
  for (const ch of item.canonical_answer) { await (await key(page, ch)).tap(); await sleep(350); }
  const t0 = Date.now();
  await (await key(page, "提交")).tap();
  let sawCard = 0, count = "";
  while (Date.now() - t0 < 4000) {
    if (!sawCard && (await page.$(".feedback-card"))) sawCard = Date.now() - t0;
    const c = await page.$(".set-count");
    if (c) { count = (await c.text()).trim(); if (count === "4 / 10") break; }
    await sleep(40);
  }
  const total = Date.now() - t0;
  check(sawCard && count === "4 / 10", `card ${sawCard} count ${count}`);
  check(total >= 600 && total < 1600, `pause ${total}`);
  return `${item.prompt} (fraction bars: ${fracs}) → ${item.canonical_answer}; correct card seen at ${sawCard}ms; 4 / 10 at ${total}ms after 提交 (700ms pause + automation polling)`;
});

await mp.close();
console.log(out.join("\n"));
console.log("LOGS", logs.filter((l) => /error|EXCEPTION/i.test(l)).slice(0, 10));
console.log(`\n${out.length - failed}/${out.length} passed`);
process.exit(failed ? 1 : 0);
