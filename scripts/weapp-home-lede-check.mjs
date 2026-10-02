// WeChat DevTools simulator check of the Home resume hero on whichever
// simulator device is selected in DevTools (375 / 390 / 430 wide …):
// the lede is exactly two lines 「刚才练到一半，」 / 「继续就好。」, each one
// rendered line inside the bubble; the title stays 「还有一小段」; there is no
// standalone 重新开始一小段; the cards sit above the nav. One screenshot,
// named after the simulator window. Never uploads, previews or publishes.
//
//   npm run build:weapp && npm i --no-save miniprogram-automator
//   SHOTS=… node scripts/weapp-home-lede-check.mjs       # WECHAT_CLI=… optional
import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
const require = createRequire(import.meta.url);
const automator = require("miniprogram-automator");
const REPO = fileURLToPath(new URL("..", import.meta.url)).replace(/\/$/, "");
const SHOTS = process.env.SHOTS || `${REPO}/dist/weapp-home-lede`;
const CLI = process.env.WECHAT_CLI || "/Applications/wechatwebdevtools.app/Contents/MacOS/cli";
const KEY = "nsl-v01-state";
mkdirSync(SHOTS, { recursive: true });
const { seededRaw } = await import(`${REPO}/scripts/viewport-cases.mjs`);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const mp = await automator.launch({ cliPath: CLI, projectPath: `${REPO}/dist/weapp` });
let ok = false;
let report = {};
try {
  for (let i = 0; i < 60; i++) { try { const p = await mp.currentPage(); if (p && p.path) break; } catch {} await sleep(500); }
  await sleep(1500);
  await mp.callWxMethod("setStorageSync", KEY, seededRaw("square-7"));
  await mp.callWxMethod("restartMiniProgram", { path: "/pages/home/index" });
  await sleep(4000);
  let page = null;
  for (let i = 0; i < 4 && !page; i++) {
    await mp.reLaunch("/pages/home/index");
    await sleep(1500);
    const p = await mp.currentPage();
    if (p && p.path === "pages/home/index" && (await p.$$(".home-cta")).length) page = p;
  }
  if (!page) throw new Error("Home did not settle");
  await sleep(800);
  const sys = await mp.systemInfo();
  const box = async (el) => { const o = await el.offset(); const s = await el.size(); return { top: Math.round(o.top), left: Math.round(o.left), w: Math.round(s.width), h: Math.round(s.height) }; };
  const lines = [];
  for (const l of await page.$$(".bubble-line")) lines.push({ text: (await l.text()).trim(), ...(await box(l)) });
  const bubble = await box(await page.$(".bubble"));
  const title = (await (await page.$(".bubble-title")).text()).trim();
  const navTop = (await box(await page.$(".tabbar"))).top;
  const cards = [];
  for (const e of await page.$$(".entry")) { const b = await box(e); cards.push({ name: (await (await e.$(".entry-name")).text()).trim(), top: b.top, bottom: b.top + b.h }); }
  const secondary = (await page.$$(".home-secondary")).length > 0;
  const right = bubble.left + bubble.w;
  const c = (n) => cards.find((x) => x.name === n);
  ok =
    title === "还有一小段" && !secondary && lines.length === 2 &&
    lines[0].text === "刚才练到一半，" && lines[1].text === "继续就好。" &&
    lines.every((l) => l.h > 0 && l.h <= 26 && l.left + l.w <= right - 8) && lines[1].top > lines[0].top &&
    ["继续刚才的练习", "专项练习", "错题本"].every((n) => c(n) && c(n).bottom <= navTop) && c("最近练得怎么样").top < navTop;
  report = { model: sys.model, window: `${sys.windowWidth}x${sys.windowHeight}`, title, lines, bubble, navTop, cards, progressFull: c("最近练得怎么样").bottom <= navTop };
  await mp.screenshot({ path: `${SHOTS}/weapp-home-resume-${sys.windowWidth}w.png` });
  await mp.callWxMethod("removeStorageSync", KEY);
} catch (e) {
  report.error = e.message;
}
await mp.close();
console.log(`${ok ? "PASS" : "FAIL"} WeChat home resume lede ${JSON.stringify(report)}`);
process.exit(ok ? 0 : 1);
