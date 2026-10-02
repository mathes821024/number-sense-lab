// Training viewport check (H5, Taro build in dist/h5): for the worst-case prompts
// of each answer_type, the Submit key must sit fully inside the viewport with no
// scrolling, no horizontal overflow, keys >= 44px tall and no text under 12px.
// Worst cases: scripts/viewport-cases.mjs (scan of content, printed at start).
//
//   npm run build:h5 && (cd dist/h5 && python3 -m http.server 4180) &
//   BASE=http://localhost:4180/ CHROME=/usr/bin/google-chrome node scripts/h5-viewport-check.mjs
import { mkdirSync, writeFileSync } from "node:fs";
import { chromium } from "playwright-core";
import { VIEWPORT_CASES as CASES, seededRaw as seeded } from "./viewport-cases.mjs";

const BASE = process.env.BASE || "http://localhost:4180/";
const SHOTS = process.env.SHOTS || "dist/h5-viewport";
const LABEL = process.env.LABEL || "check";
const CHROME = process.env.CHROME || "/usr/bin/google-chrome";
const KEY = "nsl-v01-state";
mkdirSync(SHOTS, { recursive: true });

const VIEWPORTS = [
  ["375x667", 375, 667],
  ["375x812", 375, 812],
  ["390x844", 390, 844],
  ["393x852", 393, 852],
  ["375x603-wechat-se-window", 375, 603], // iPhone SE screen minus status bar and the Mini Program nav bar
  ["390x753-wechat-12-window", 390, 753], // iPhone 12/13 minus status bar and nav bar
  ["1366x768", 1366, 768],
  ["1366x900", 1366, 900],
];

console.log("worst cases:", CASES.map((c) => `${c.name}=${c.item.id} 「${c.item.prompt}」`).join("; "));
const browser = await chromium.launch({ executablePath: CHROME, args: ["--no-sandbox"] });
const rows = [];
let failed = 0;
for (const [vpName, w, h] of VIEWPORTS) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, reducedMotion: "reduce" });
  const page = await ctx.newPage();
  for (const c of CASES) {
    await page.goto(`${BASE}#/pages/home/index`);
    await page.evaluate(([k, v]) => localStorage.setItem(k, v), [KEY, seeded(c.item.id)]);
    await page.reload();
    await page.click('[data-action="resume"]');
    await page.waitForSelector('[data-testid="train"]');
    for (const ch of c.type) {
      // fraction_fields: 「|」 = tap the denominator box (there is no 「/」 key).
      if (ch === "|") await page.click('[data-testid="fraction-fields"] [data-field="denominator"]');
      else await page.click(`[data-testid="train"] .key[data-key="${ch}"]`);
    }
    if (c.submit) await page.click('[data-testid="train"] .key[data-key="submit"]');
    // wait until Taro's page slide-in has finished (the page box sits at x = 0)
    await page.waitForTimeout(400);
    await page.waitForFunction(() => {
      const p = document.querySelector('[data-testid="train"]').closest(".taro_page");
      return !p || (Math.abs(p.getBoundingClientRect().left) < 0.5 && getComputedStyle(p).transform === "none");
    }, null, { timeout: 5000 });
    await page.waitForTimeout(150);
    const m = await page.evaluate(() => {
      const root = document.querySelector('[data-testid="train"]');
      // Measure the screen as the student first sees it: nothing scrolled (Playwright's clicks may scroll).
      const scroller0 = root.closest(".taro_page") || document.scrollingElement;
      scroller0.scrollTop = 0;
      window.scrollTo(0, 0);
      const submit = root.querySelector('.key[data-key="submit"]').getBoundingClientRect();
      const scroller = root.closest(".taro_page") || document.scrollingElement;
      const keys = [...root.querySelectorAll(".key:not(.ghost)")].map((k) => k.getBoundingClientRect().height);
      const texts = [...root.querySelectorAll("*")].filter((e) => e.childElementCount === 0 && e.textContent.trim() && e.checkVisibility());
      const q = root.querySelector(".question");
      const qs = getComputedStyle(q);
      const all = [...root.querySelectorAll("*")];
      const right = Math.max(...all.map((e) => e.getBoundingClientRect().right));
      const over = all.filter((e) => e.getBoundingClientRect().right > window.innerWidth + 0.5).map((e) => `${e.tagName.toLowerCase()}.${String(e.className).replace(/ /g, ".")}`).slice(0, 3);
      return {
        submitTop: Math.round(submit.top),
        submitBottom: Math.round(submit.bottom),
        submitHeight: Math.round(submit.height),
        vh: window.innerHeight,
        scrollTop: scroller.scrollTop,
        scrolls: scroller.scrollHeight > scroller.clientHeight + 1,
        hOverflow: document.documentElement.scrollWidth > window.innerWidth || right > window.innerWidth + 0.5,
        minKey: Math.round(Math.min(...keys)),
        minFont: Math.min(...texts.map((e) => parseFloat(getComputedStyle(e).fontSize))),
        qFont: parseFloat(qs.fontSize),
        qLines: Math.round(q.getBoundingClientRect().height / parseFloat(qs.lineHeight)),
        nudge: root.querySelector('[data-testid="nudge"]').textContent,
        over,
      };
    });
    const ok = m.submitBottom <= m.vh && m.scrollTop === 0 && !m.hOverflow && m.minKey >= 44 && m.minFont >= 12;
    if (!ok) failed += 1;
    rows.push({ viewport: vpName, case: c.name, item: c.item.id, ...m, ok });
    if (["375x667", "375x603-wechat-se-window", "390x844", "1366x768"].includes(vpName)) await page.screenshot({ path: `${SHOTS}/${LABEL}-${vpName}-${c.name}.png` });
  }
  await ctx.close();
}
await browser.close();
for (const r of rows) {
  console.log(`${r.ok ? "PASS" : "FAIL"} ${r.viewport.padEnd(26)} ${r.case.padEnd(26)} ${r.item.padEnd(15)} submit ${r.submitTop}–${r.submitBottom} / vh ${r.vh} (h ${r.submitHeight})  scrolls:${r.scrolls} hOverflow:${r.hOverflow} minKey:${r.minKey} minFont:${r.minFont} q:${r.qFont}px×${r.qLines}${r.nudge ? ` nudge「${r.nudge}」` : ""}${r.over.length ? ` over:${r.over.join(",")}` : ""}`);
}
writeFileSync(`${SHOTS}/${LABEL}-viewport.json`, JSON.stringify(rows, null, 1));
console.log(`\n${rows.length - failed}/${rows.length} passed`);
process.exit(failed ? 1 : 0);
