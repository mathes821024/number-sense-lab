// WeChat DevTools simulator check of 专项练习 · 主题训练 (docs/ux/05_specialist_grouped_grid.md)
// on whichever simulator device is selected in DevTools (375 / 390 / 430 wide …):
// three headings in order, two columns per group (an odd 3rd card under the 1st,
// same width), every card a tile (PNG file or glyph, never 平方's old cube) with
// its group tint and a status word, ≥ 44 targets, and the last card clear of the
// nav at full scroll. Two screenshots (top, end) named after the simulator window.
// Never uploads, previews or publishes. The full flow (each card → its own domain)
// is step 14 of scripts/weapp-devtools-e2e.mjs.
//
//   npm run build:weapp && npm i --no-save miniprogram-automator
//   SHOTS=… node scripts/weapp-practice-grid-check.mjs     # WECHAT_CLI=… optional
import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
const require = createRequire(import.meta.url);
const automator = require("miniprogram-automator");
const REPO = fileURLToPath(new URL("..", import.meta.url)).replace(/\/$/, "");
const SHOTS = process.env.SHOTS || `${REPO}/dist/weapp-practice-grid`;
const CLI = process.env.WECHAT_CLI || "/Applications/wechatwebdevtools.app/Contents/MacOS/cli";
const GRID = [["幂与乘方", "sky", ["平方", "立方", "常见幂"]], ["乘法与凑整", "amber", ["常用乘积", "凑整乘积家族"]], ["数与分数", "mint", ["分数到小数", "半数与翻倍", "补数"]]];
const STATUS = ["还没怎么练", "正在熟悉", "有几题要再巩固", "大多已经很稳"];
mkdirSync(SHOTS, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const mp = await automator.launch({ cliPath: CLI, projectPath: `${REPO}/dist/weapp` });
const fails = [];
const check = (c, m) => { if (!c) fails.push(m); };
let report = {};
try {
  for (let i = 0; i < 60; i++) { try { const p = await mp.currentPage(); if (p && p.path) break; } catch {} await sleep(500); }
  await sleep(1500);
  let page = null;
  for (let i = 0; i < 4 && !page; i++) {
    await mp.reLaunch("/pages/explore/index");
    await sleep(1500);
    const p = await mp.currentPage();
    if (p && p.path === "pages/explore/index" && (await p.$$(".practice-card")).length === 8) page = p;
  }
  if (!page) throw new Error("专项练习 did not settle");
  await sleep(800);
  const sys = await mp.systemInfo();
  const box = async (el) => { const o = await el.offset(); const s = await el.size(); return { l: Math.round(o.left), t: Math.round(o.top), w: Math.round(s.width), h: Math.round(s.height) }; };
  const heads = [];
  for (const h of await page.$$(".practice-group-title")) heads.push((await h.text()).trim());
  check(heads.join("/") === GRID.map(([g]) => g).join("/"), `headings ${heads}`);
  const groups = [];
  let lastBottom = 0;
  for (const [gi, g] of (await page.$$(".practice-group")).entries()) {
    const cards = [];
    for (const c of await g.$$(".practice-card")) {
      const t = await c.$(".tile");
      const img = await t.$(".theme-img");
      const src = img ? (await img.attribute("src")) || "" : "";
      const gl = await t.$(".tile-glyph .icon");
      const b = await box(c);
      lastBottom = b.t + b.h;
      cards.push({
        name: (await (await c.$(".practice-name")).text()).trim(),
        status: (await (await c.$(".practice-status")).text()).trim(),
        tile: src ? `png:${src.split("/").pop()}` : gl && (await gl.text()).trim() ? "glyph" : "EMPTY",
        tone: (((await t.attribute("class")) || "").match(/tone-(\w+)/) || [])[1] || "",
        ...b,
      });
    }
    const [a, b2, c3] = cards;
    check(cards.map((c) => c.name).join("/") === GRID[gi][2].join("/"), `${heads[gi]} cards ${cards.map((c) => c.name)}`);
    check(cards.every((c) => c.tone === GRID[gi][1] && STATUS.includes(c.status) && c.tile !== "EMPTY" && !/domain-squares|\.svg/.test(c.tile) && c.w >= 44 && c.h >= 44), `${heads[gi]} tiles ${JSON.stringify(cards)}`);
    check(b2.l >= a.l + a.w - 1 && Math.abs(b2.t - a.t) <= 1 && Math.abs(b2.w - a.w) <= 1, `${heads[gi]} two columns`);
    if (c3) check(Math.abs(c3.l - a.l) <= 1 && Math.abs(c3.w - a.w) <= 1 && c3.t >= a.t + a.h - 1, `${heads[gi]} 3rd card left, not stretched`);
    check(a.l >= 0 && b2.l + b2.w <= sys.windowWidth, `${heads[gi]} inside the window`);
    groups.push(`${heads[gi]}: ${cards.map((c) => `${c.name}[${c.tile}] ${c.l},${c.t} ${c.w}×${c.h}`).join(" | ")}`);
  }
  await mp.screenshot({ path: `${SHOTS}/weapp-explore-${sys.windowWidth}x${sys.windowHeight}-top.png` });
  await mp.pageScrollTo(3000);
  await sleep(700);
  const navH = (await (await page.$(".tabbar")).size()).height;
  const end = Math.round(lastBottom - (await page.scrollTop()));
  const navTop = Math.round(sys.windowHeight - navH);
  check(end <= navTop + 1, `last card ${end} under the nav ${navTop}`);
  await mp.screenshot({ path: `${SHOTS}/weapp-explore-${sys.windowWidth}x${sys.windowHeight}-end.png` });
  await mp.pageScrollTo(0);
  report = { model: sys.model, window: `${sys.windowWidth}x${sys.windowHeight}`, groups, end: `${end} ≤ nav ${navTop}` };
} catch (e) {
  fails.push(e.message);
}
await mp.close();
console.log(`${fails.length ? "FAIL" : "PASS"} WeChat 主题训练 grid ${JSON.stringify(report)}${fails.length ? ` ${JSON.stringify(fails)}` : ""}`);
process.exit(fails.length ? 1 : 0);
