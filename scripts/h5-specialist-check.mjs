// v0.4 regression for the h5/ shell (served by scripts/serve.mjs):
// - 练习 · 主题训练 is the grouped two-column grid (docs/ux/05_specialist_grouped_grid.md):
//   3 headings, 8 cards (icon, name, status), none clipped, the odd 3rd card left and not
//   stretched, no 敬请期待 cards (概念 / 例题 / 动画 / 规律探索 belong to 知识地图);
// - each card starts a focused set drawn only from that domain, FOCUS hides the nav;
// - Submit for the new domains' longest prompts sits no lower than for the old worst
//   cases (scripts/viewport-cases.mjs). h5/ never got the Taro shell's short-screen
//   layout, so at 375x667 Submit is below the fold for the old items on main as well;
//   `fits` reports the absolute result, the pass criterion is "no worse than before";
// - the Mistake Book groups new-domain mistakes under the card names.
//
//   node scripts/serve.mjs --port 4173 &
//   BASE=http://localhost:4173/ CHROME=/usr/bin/google-chrome node scripts/h5-specialist-check.mjs
import { mkdirSync, writeFileSync } from "node:fs";
import { chromium } from "playwright-core";
import { DOMAIN_LABELS, DOMAIN_ORDER, loadCoreCatalog } from "../src/core/content.js";
import { peekCurrent, startSession, submitAnswer } from "../src/core/session.js";
import { emptyLearner } from "../src/core/store.js";
import { VIEWPORT_CASES, seededRaw, today } from "./viewport-cases.mjs";

const BASE = process.env.BASE || "http://localhost:4173/";
const SHOTS = process.env.SHOTS || "dist/h5-specialist";
const CHROME = process.env.CHROME || "/usr/bin/google-chrome";
const KEY = "nsl-v01-state";
// PARTS=submit OLD_CASES=1 measures only the pre-v0.4 worst cases (e.g. against base main).
const PARTS = new Set((process.env.PARTS || "cards,focus,submit,mistakes").split(","));
const CASES = process.env.OLD_CASES ? VIEWPORT_CASES.filter((c) => c.legacy) : VIEWPORT_CASES;
const NEW = ["halves", "complements", "cubes", "powers", "special_products"];
const catalog = loadCoreCatalog();
const byId = Object.fromEntries(catalog.map((i) => [i.id, i]));
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

// 1. 练习 cards at phone and desktop sizes.
const GRID = [["幂与乘方", "sky", ["squares", "cubes", "powers"]], ["乘法与凑整", "amber", ["products", "special_products"]], ["数与分数", "mint", ["fraction_decimal", "halves", "complements"]]];
const STATUS = ["还没怎么练", "正在熟悉", "有几题要再巩固", "大多已经很稳"];
if (PARTS.has("cards")) for (const [vp, w, h] of [["375x603", 375, 603], ["375x667", 375, 667], ["390x844", 390, 844], ["390x753", 390, 753], ["430x932", 430, 932], ["1366x768", 1366, 768], ["1366x900", 1366, 900]]) {
  const { ctx, page, errors } = await freshPage(w, h);
  await page.click('#home [data-action="explore"]');
  await page.waitForSelector("#explore");
  const m = await page.evaluate(() => {
    const vw = window.innerWidth;
    const tab = document.getElementById("tabbar")?.getBoundingClientRect();
    const cards = [...document.querySelectorAll("#explore .practice-card")].map((el) => {
      el.scrollIntoView({ block: "center" });
      const r = el.getBoundingClientRect();
      const t = document.getElementById("tabbar")?.getBoundingClientRect();
      const name = el.querySelector(".practice-name");
      const tile = el.querySelector(".tile");
      const img = el.querySelector(".tile img");
      return {
        domain: el.dataset.domain,
        group: el.closest(".practice-group").querySelector(".practice-group-title").textContent.trim(),
        headTag: el.closest(".practice-group").querySelector(".practice-group-title").tagName,
        name: name.textContent.trim(),
        status: el.querySelector(".practice-status").textContent.trim(),
        aria: el.getAttribute("aria-label"),
        tag: el.tagName,
        tone: (tile.className.match(/tone-(\w+)/) || [])[1] || "",
        img: img ? img.getAttribute("src") : "",
        h: r.height,
        w: r.width,
        inside: r.left >= 0 && r.right <= vw + 0.5,
        aboveNav: r.top >= 0 && (!t || r.bottom <= t.top + 0.5),
        nameClipped: name.scrollWidth > name.clientWidth + 1,
        hasTile: !!el.querySelector(".tile img, .tile .tile-glyph .ph"),
      };
    });
    window.scrollTo(0, 0);
    const boxes = [...document.querySelectorAll("#explore .practice-group")].map((g) => [...g.querySelectorAll(".practice-card")].map((el) => { const r = el.getBoundingClientRect(); return { l: Math.round(r.left), t: Math.round(r.top + scrollY), w: Math.round(r.width) }; }));
    // At the bottom of the page the last card still clears the nav.
    window.scrollTo(0, document.scrollingElement.scrollHeight);
    const lastCard = [...document.querySelectorAll("#explore .practice-card")].pop().getBoundingClientRect();
    const tabAtEnd = document.getElementById("tabbar")?.getBoundingClientRect();
    const endClear = !tabAtEnd || lastCard.bottom <= tabAtEnd.top + 0.5;
    window.scrollTo(0, 0);
    return {
      endClear,
      cards,
      boxes,
      heads: [...document.querySelectorAll("#explore .practice-group-title")].map((e) => e.textContent.trim()),
      soon: document.querySelectorAll("#explore .soon-tile, #explore .soon-chip, #explore .section-label").length,
      text: document.getElementById("explore").innerText,
      hOverflow: document.scrollingElement.scrollWidth > vw + 0.5,
      tabTop: tab?.top ?? null,
    };
  });
  const order = GRID.flatMap(([, , d]) => d);
  check(`${vp} 练习: 3 headings (h2) over 8 cards in the 05 order`, JSON.stringify(m.heads) === JSON.stringify(GRID.map(([g]) => g)) && JSON.stringify(m.cards.map((c) => c.domain)) === JSON.stringify(order) && m.cards.every((c) => c.headTag === "H2" && GRID.find(([g]) => g === c.group)[2].includes(c.domain)), m.cards.map((c) => `${c.group}:${c.name}`).join(" / "));
  check(`${vp} 练习: card = button with icon, name, one status word; aria 「名，状态」; group tint`, m.cards.every((c) => c.tag === "BUTTON" && c.name === DOMAIN_LABELS[c.domain] && STATUS.includes(c.status) && c.aria === `${c.name}，${c.status}` && c.tone === GRID.find(([g]) => g === c.group)[1] && c.hasTile && !/domain-squares/.test(c.img)), m.cards.map((c) => `${c.name}:${c.img ? "pic" : "glyph"}:${c.tone}`).join(" "));
  check(`${vp} 练习: two columns; odd 3rd card left, not stretched`, m.boxes.every((g) => g[1].l >= g[0].l + g[0].w - 1 && Math.abs(g[1].t - g[0].t) <= 1 && Math.abs(g[1].w - g[0].w) <= 1 && (!g[2] || (Math.abs(g[2].l - g[0].l) <= 1 && Math.abs(g[2].w - g[0].w) <= 1 && g[2].t > g[0].t))), JSON.stringify(m.boxes.map((g) => g.map((b) => `${b.l},${b.t} ${b.w}`))));
  check(`${vp} 练习: no card clipped or hidden under the nav`, m.endClear && m.cards.every((c) => c.inside && c.aboveNav && !c.nameClipped && c.h >= 44 && c.w >= 44), m.cards.map((c) => `${c.domain}:${Math.round(c.w)}×${Math.round(c.h)}`).join(" "));
  check(`${vp} 练习: no 敬请期待 cards; 半数与翻倍, never 倍数与因数`, m.soon === 0 && !/规律探索|概念|例题|动画|倍数与因数/.test(m.text) && m.text.includes("半数与翻倍"));
  {
    const before = await page.$$eval("#explore .practice-card", (els) => els.map((e) => e.outerHTML).join(""));
    await page.click('#explore .seg[data-soon="知识地图"]');
    const toast = await page.textContent("#toast");
    const after = await page.$$eval("#explore .practice-card", (els) => els.map((e) => e.outerHTML).join(""));
    check(`${vp} 知识地图: only 敬请期待, the cards stay as they are`, toast === "知识地图 · 敬请期待" && before === after && (await page.$("#explore")) !== null, toast);
  }
  check(`${vp} 练习: no horizontal overflow, no page errors`, !m.hOverflow && errors.length === 0, errors.join(" | "));
  await page.waitForTimeout(2600);
  await page.screenshot({ path: `${SHOTS}/explore-${vp}.png`, fullPage: true });
  await page.screenshot({ path: `${SHOTS}/explore-${vp}-viewport.png` });
  await ctx.close();
}

// 2. Each new card starts a focused set from that domain only; FOCUS hides the nav.
if (PARTS.has("focus")) for (const domain of DOMAIN_ORDER) {
  const { ctx, page, errors } = await freshPage(375, 667);
  await page.click('#home [data-action="explore"]');
  await page.click(`#explore .practice-card[data-domain="${domain}"]`);
  await page.waitForSelector("#focus-confirm");
  const title = await page.textContent("#focus-confirm .title");
  if (domain === "halves") await page.screenshot({ path: `${SHOTS}/focus-confirm-halves-375x667.png` });
  await page.click('#focus-confirm [data-action="start-focus"]');
  await page.waitForSelector(".keys");
  const info = await page.evaluate((k) => {
    const st = JSON.parse(localStorage.getItem(k));
    const learner = st.learners[st.active_learner_id];
    return {
      queue: learner.activeSession?.queue || [],
      mode: learner.activeSession?.mode,
      sessionDomain: learner.activeSession?.domain,
      pill: document.querySelector(".pill")?.textContent.trim(),
      question: document.querySelector(".question")?.innerText.trim(),
      nav: !!document.getElementById("tabbar"),
    };
  }, KEY);
  const domains = new Set(info.queue.map((id) => byId[id]?.domain));
  check(`focus ${domain}: card title, queue only from ${domain}, nav hidden`,
    title.trim() === DOMAIN_LABELS[domain] && info.mode === "focused" && info.sessionDomain === domain && info.queue.length > 0 && domains.size === 1 && domains.has(domain) && !info.nav,
    `${info.queue.length} items, pill「${info.pill}」, first「${info.question}」`);
  // answer the first one right, then one wrong: feedback shows the right relation + hook, then 下一题.
  const first = byId[info.queue[0]];
  for (const ch of first.canonical_answer) await page.click(`.keys .key[data-digit="${ch}"]`);
  await page.click('.keys [data-action="submit"]');
  await page.waitForTimeout(1200);
  const second = byId[info.queue[1]];
  await page.waitForSelector(".keys");
  for (const ch of "1") await page.click(`.keys .key[data-digit="${ch}"]`);
  await page.click('.keys [data-action="submit"]');
  await page.waitForSelector("#wrong, .feedback-card");
  const wrongText = await page.evaluate(() => document.querySelector("#app").innerText);
  check(`focus ${domain}: wrong shows the relation and hook`, wrongText.includes(second.hook.split(/[；：]/)[0]) && wrongText.includes(second.canonical_answer) && /下一题/.test(wrongText), `${second.id}`);
  if (domain === "complements" || domain === "powers") await page.screenshot({ path: `${SHOTS}/wrong-${domain}-375x667.png` });
  check(`focus ${domain}: no page errors`, errors.length === 0, errors.join(" | "));
  await ctx.close();
}

// 3. Submit inside the viewport for the worst-case prompts (old and new domains).
const vpRows = [];
if (PARTS.has("submit")) for (const [vp, w, h] of [["375x667", 375, 667], ["390x753", 390, 753], ["390x844", 390, 844], ["1366x768", 1366, 768]]) {
  for (const c of CASES) {
    const { ctx, page } = await freshPage(w, h, seededRaw(c.item.id));
    await page.click('#home [data-action="resume"]');
    await page.waitForSelector(".keys");
    for (const ch of c.type) {
      // fraction_fields: 「|」 = tap the denominator box (there is no 「/」 key).
      if (ch === "|") await page.click('#answer [data-field="denominator"]');
      else await page.click(`.keys .key[data-digit="${ch}"]`);
    }
    if (c.submit) await page.click('.keys [data-action="submit"]');
    await page.waitForTimeout(150);
    const m = await page.evaluate(() => {
      window.scrollTo(0, 0);
      const go = document.querySelector('.keys [data-action="submit"]').getBoundingClientRect();
      const keys = [...document.querySelectorAll(".keys .key:not(.ghost)")].map((k) => k.getBoundingClientRect().height);
      const q = document.querySelector(".question");
      return {
        bottom: Math.round(go.bottom),
        vh: window.innerHeight,
        minKey: Math.round(Math.min(...keys)),
        hOverflow: document.scrollingElement.scrollWidth > window.innerWidth + 0.5,
        qLines: Math.round(q.getBoundingClientRect().height / parseFloat(getComputedStyle(q).lineHeight || "1")),
        q: q.innerText.trim(),
        nav: !!document.getElementById("tabbar"),
      };
    });
    const fits = m.bottom <= m.vh;
    const oldWorst = Math.max(...vpRows.filter((r) => r.vp === vp && r.old).map((r) => r.bottom));
    const old = Boolean(c.legacy);
    // fraction_fields: 提交 must be on screen (docs/curriculum/09 §3), never "no worse than before".
    const ok = (c.item.fractionFields ? fits : old || fits || m.bottom <= oldWorst) && m.minKey >= 44 && !m.hOverflow && !m.nav;
    vpRows.push({ vp, case: c.name, id: c.item.id, ...m, fits, old, ok });
    check(`submit ${vp} ${c.name} (${c.item.id}「${c.item.prompt}」)`, ok, `submit bottom ${m.bottom} / vh ${m.vh} fits:${fits}${old ? " (old case)" : ` old worst ${oldWorst}`}, minKey ${m.minKey}`);
    if (vp === "375x667" || vp === "390x753") await page.screenshot({ path: `${SHOTS}/train-${vp}-${c.name}.png` });
    await ctx.close();
  }
}

// 4. Mistake Book: new-domain mistakes grouped under their card names, empty groups hidden.
if (PARTS.has("mistakes")) {
  let learner = emptyLearner();
  const meta = { day: today(), inputMode: "onscreen_keypad", elapsedMs: 900 };
  for (const [domain, id, wrong] of [["cubes", "cube-7", "21"], ["complements", "comp-37", "73"], ["powers", "pow-2-10", "1000"]]) {
    let s = startSession({ mode: "focused", domain, day: today(), catalog, relations: learner.relations, seed: 1 });
    s = { ...s, queue: [id, ...s.queue.filter((q) => q !== id)] };
    const p = peekCurrent(s, catalog);
    learner = submitAnswer({ item: p.item, state: learner, session: p.session, raw: wrong, meta }).state;
  }
  const raw = JSON.stringify({ version: 3, active_learner_id: "mb", learners: { mb: { ...learner, profile: { learner_id: "mb", created_on: today() }, activeSession: null, prefs: { sound: false } } } });
  const { ctx, page, errors } = await freshPage(375, 667, raw);
  await page.click('[data-action="mistakes"]');
  await page.waitForSelector(".group-label");
  const groups = await page.$$eval(".group-label", (els) => els.map((e) => e.textContent.trim()));
  check("mistake book: groups 补数 / 立方 / 常见幂 in DOMAIN_ORDER, no empty groups", JSON.stringify(groups) === JSON.stringify(["补数", "立方", "常见幂"]), groups.join(" / "));
  check("mistake book: no page errors", errors.length === 0, errors.join(" | "));
  await page.screenshot({ path: `${SHOTS}/mistakes-375x667.png`, fullPage: true });
  // The print picker's domain filters follow DOMAIN_ORDER and wrap; nothing overflows.
  await page.click("text=印这些题");
  await page.waitForSelector("#print-select");
  const p = await page.evaluate(() => ({
    chips: [...document.querySelectorAll('#print-select [data-action="print-domain"]')].map((e) => e.textContent.trim()),
    hOverflow: document.scrollingElement.scrollWidth > window.innerWidth + 0.5,
  }));
  check("print picker: 全部 + 8 domain filters, no horizontal overflow", p.chips.length === 9 && p.chips[0] === "全部" && !p.hOverflow, p.chips.join(" / "));
  await page.screenshot({ path: `${SHOTS}/print-select-375x667.png` });
  await ctx.close();
}

await browser.close();
const failed = results.filter((r) => !r.ok).length;
writeFileSync(`${SHOTS}/h5-specialist-check.json`, JSON.stringify({ results, viewport: vpRows }, null, 2));
console.log(`\n${results.length - failed}/${results.length} passed`);
process.exit(failed ? 1 : 0);
