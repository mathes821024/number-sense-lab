// Home resume hero (还有一小段) above the fold, for h5/ and the Taro H5 build:
// with an unfinished set, the hero, 继续刚才的练习, 专项练习 and 错题本 sit above
// the bottom nav, and 最近练得怎么样 is at least partly visible — with no
// standalone 重新开始一小段 on Home. Also shows the restart on the pause screen.
//
//   APP=taro BASE=http://localhost:4180/ SHOTS=… node scripts/home-fold-check.mjs
//   APP=h5   BASE=http://localhost:4173/ SHOTS=… node scripts/home-fold-check.mjs
import { mkdirSync } from "node:fs";
import { chromium } from "playwright-core";
import { seededRaw } from "./viewport-cases.mjs";

const APP = process.env.APP || "taro";
const BASE = process.env.BASE || "http://localhost:4180/";
const SHOTS = process.env.SHOTS || `dist/home-fold-${APP}`;
const CHROME = process.env.CHROME || "/usr/bin/google-chrome";
const KEY = "nsl-v01-state";
const HOME = APP === "taro" ? `${BASE}#/pages/home/index` : BASE;
mkdirSync(SHOTS, { recursive: true });

const VIEWPORTS = [["375x667", 375, 667], ["390x844", 390, 844], ["390x753-wechat-window", 390, 753], ["1366x768-pc", 1366, 768]];
const browser = await chromium.launch({ executablePath: CHROME, args: ["--no-sandbox"] });
const out = [];
let failed = 0;
for (const [name, width, height] of VIEWPORTS) {
  const ctx = await browser.newContext({ viewport: { width, height }, reducedMotion: "reduce" });
  const page = await ctx.newPage();
  try {
    await page.goto(HOME);
    await page.evaluate(([k, v]) => localStorage.setItem(k, v), [KEY, seededRaw("square-7")]);
    await page.reload();
    await page.waitForSelector(".home-cta >> visible=true");
    await page.waitForFunction(() => {
      const i = [...document.querySelectorAll(".mascot-hero img")].find((e) => e.checkVisibility());
      return i && i.complete && i.naturalWidth > 0;
    });
    await page.waitForTimeout(250);
    const m = await page.evaluate(() => {
      const vis = (s) => [...document.querySelectorAll(s)].find((e) => e.checkVisibility());
      const r = (e) => e && e.getBoundingClientRect();
      const nav = r(vis(".tabbar"));
      const cards = [...document.querySelectorAll(".entry")].filter((e) => e.checkVisibility()).map((e) => {
        const b = e.getBoundingClientRect();
        return { name: e.querySelector(".entry-name").textContent.trim(), top: Math.round(b.top), bottom: Math.round(b.bottom) };
      });
      return {
        navTop: Math.round(nav.top),
        hero: Math.round(r(vis(".home-hero")).bottom),
        mascotW: Math.round(r(vis(".mascot-hero")).width),
        title: vis(".bubble-title").textContent.trim(),
        lede: vis(".bubble-text").textContent.trim(),
        secondary: Boolean(vis(".home-secondary")),
        restartOnHome: [...document.querySelectorAll('[data-action="restart-daily"]')].some((e) => e.checkVisibility()),
        cards,
      };
    });
    const c = (n) => m.cards.find((x) => x.name === n);
    const ok =
      m.title === "还有一小段" && m.lede === "刚才练到一半，继续就好。" && !m.secondary && !m.restartOnHome &&
      m.hero <= m.navTop && c("继续刚才的练习").bottom <= m.navTop && c("专项练习").bottom <= m.navTop &&
      c("错题本").bottom <= m.navTop && c("最近练得怎么样").top < m.navTop;
    const progress = c("最近练得怎么样").bottom <= m.navTop ? "fully" : `partly (${m.navTop - c("最近练得怎么样").top}px of ${c("最近练得怎么样").bottom - c("最近练得怎么样").top}px)`;
    await page.screenshot({ path: `${SHOTS}/${APP}-home-resume-${name}.png` });
    if (!ok) failed += 1;
    out.push(`${ok ? "PASS" : "FAIL"} ${APP} ${name}: mascot ${m.mascotW}px; hero ≤ ${m.hero}; ${m.cards.map((x) => `${x.name} ${x.top}–${x.bottom}`).join(", ")}; nav top ${m.navTop}; 最近练得怎么样 ${progress}; no standalone restart`);
    if (name === "375x667") {
      await page.click(".home-cta >> visible=true");
      await page.waitForSelector('[data-action="pause"] >> visible=true');
      await page.click('[data-action="pause"] >> visible=true');
      const t = await page.textContent('[data-action="restart-daily"] >> visible=true');
      await page.waitForTimeout(200);
      await page.screenshot({ path: `${SHOTS}/${APP}-pause-restart-${name}.png` });
      const pass = t.trim() === "重新开始一小段";
      if (!pass) failed += 1;
      out.push(`${pass ? "PASS" : "FAIL"} ${APP} pause screen keeps the restart 「${t.trim()}」`);
    }
  } catch (e) {
    failed += 1;
    out.push(`FAIL ${APP} ${name}: ${e.message.split("\n")[0]}`);
  }
  await ctx.close();
}
await browser.close();
console.log(out.join("\n"));
console.log(`\n${out.length - failed}/${out.length} passed`);
process.exit(failed ? 1 : 0);
