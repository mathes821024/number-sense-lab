// Taro H5 runtime check of the pages migrated from h5/ (shared with the Mini
// Program): 专项练习 (the grouped two-column grid of docs/ux/05; every domain
// card → its confirmation → a focused set from
// that domain only), 错题本 (grouped by domain incl. the v0.4 domains, empty
// groups hidden, fraction_fields drawn stacked), 最近练得怎么样, and the print
// selector → A4 → answers, with print-media emulation and an A4 PDF. Each at
// 375×667 and 390×753: no horizontal overflow, bottom nav on screen.
//
//   npm run build:h5 && (cd dist/h5 && python3 -m http.server 4180) &
//   BASE=http://localhost:4180/ CHROME=/usr/bin/google-chrome SHOTS=… node scripts/taro-pages-e2e.mjs
import { mkdirSync, writeFileSync } from "node:fs";
import { chromium } from "playwright-core";
import { DOMAIN_ORDER, loadCoreCatalog } from "../src/core/content.js";
import { pagesSeed } from "./pages-seed.mjs";

const BASE = process.env.BASE || "http://localhost:4180/";
const SHOTS = process.env.SHOTS || "dist/taro-pages-shots";
const CHROME = process.env.CHROME || "/usr/bin/google-chrome";
const KEY = "nsl-v01-state";
const LABELS = ["平方", "常用乘积", "分数到小数", "半数与翻倍", "补数", "立方", "常见幂", "凑整乘积家族"];
mkdirSync(SHOTS, { recursive: true });
const catalog = loadCoreCatalog();
const byId = new Map(catalog.map((i) => [i.id, i]));
const seed = pagesSeed(catalog);
const RAW = JSON.stringify(seed.root);

const results = [];
let failed = 0;
const check = (c, m) => {
  if (!c) throw new Error(m);
};
async function step(name, fn) {
  try {
    results.push(`PASS ${name} — ${await fn()}`);
  } catch (e) {
    failed += 1;
    results.push(`FAIL ${name} — ${e.message.split("\n")[0]}`);
  }
}

const V = (sel) => `${sel} >> visible=true`;
const browser = await chromium.launch({ executablePath: CHROME, args: ["--no-sandbox"] });
const layoutRows = [];

// VPS="375x603,430x932,1366x768" adds sizes (default: the two the suite always ran).
const VPS = (process.env.VPS || "375x667,390x753").split(",").map((v) => [v, ...v.split("x").map(Number)]);
for (const [vp, width, height] of VPS) {
  const ctx = await browser.newContext({ viewport: { width, height }, reducedMotion: "reduce" });
  const page = await ctx.newPage();
  const errors = [];
  const foreign = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("request", (r) => !r.url().startsWith(BASE) && !r.url().startsWith("data:") && foreign.push(r.url()));
  const shot = (n) => page.screenshot({ path: `${SHOTS}/${vp}-${n}.png` });
  const stored = async () => JSON.parse(await page.evaluate((k) => localStorage.getItem(k), KEY));
  const learner = async () => {
    const r = await stored();
    return r.learners[r.active_learner_id];
  };
  /** Open a page fresh (stack of one) over a given stored record. */
  const open = async (path, raw = RAW) => {
    await page.goto(`${BASE}#/pages/home/index`);
    await page.evaluate(([k, v]) => localStorage.setItem(k, v), [KEY, raw]);
    await page.goto(`${BASE}#/pages/${path}/index`);
    await page.reload();
  };
  /** Wait for a page's slide-in to end (box at x = 0), then measure it as the student sees it. */
  const settle = async (testid) => {
    await page.waitForSelector(V(`[data-testid="${testid}"]`));
    await page.waitForFunction((t) => {
      const el = [...document.querySelectorAll(`[data-testid="${t}"]`)].find((e) => e.checkVisibility());
      const p = el && el.closest(".taro_page");
      return el && (!p || (Math.abs(p.getBoundingClientRect().left) < 0.5 && getComputedStyle(p).transform === "none"));
    }, testid, { timeout: 5000 });
    await page.waitForTimeout(120);
  };
  const layout = async (name, testid) => {
    const m = await page.evaluate((t) => {
      const root = [...document.querySelectorAll(`[data-testid="${t}"]`)].find((e) => e.checkVisibility());
      const pg = root.closest(".taro_page") || document.body;
      const scroller = root.closest(".taro_page") || document.scrollingElement;
      const W = innerWidth;
      const over = [...pg.querySelectorAll("*")]
        .filter((e) => e.checkVisibility() && !e.closest(".sheet-list"))
        .filter((e) => {
          const r = e.getBoundingClientRect();
          return r.width > 0 && (r.right > W + 0.5 || r.left < -0.5);
        })
        .map((e) => e.className || e.tagName)
        .slice(0, 5);
      const nav = [...pg.querySelectorAll(".tabbar")].find((e) => e.checkVisibility());
      const nr = nav && nav.getBoundingClientRect();
      const fonts = [...pg.querySelectorAll("*")]
        .filter((e) => e.checkVisibility() && [...e.childNodes].some((c) => c.nodeType === 3 && c.textContent.trim()))
        .map((e) => parseFloat(getComputedStyle(e).fontSize));
      return {
        scrollW: scroller.scrollWidth,
        clientW: scroller.clientWidth,
        docW: document.documentElement.scrollWidth,
        over,
        nav: nav ? { top: Math.round(nr.top), bottom: Math.round(nr.bottom), tabs: nav.querySelectorAll(".tab").length } : null,
        minFont: Math.min(...fonts),
        innerH: innerHeight,
      };
    }, testid);
    layoutRows.push({ vp, page: name, ...m });
    check(m.scrollW <= m.clientW + 1 && m.docW <= width + 1, `${name}: horizontal overflow ${m.scrollW}/${m.clientW} doc ${m.docW}`);
    check(m.over.length === 0, `${name}: elements past the edge ${m.over.join(",")}`);
    check(m.nav && m.nav.tabs === 4 && m.nav.bottom <= m.innerH + 1 && m.nav.top < m.innerH, `${name}: bottom nav ${JSON.stringify(m.nav)}`);
    return `no overflow, nav ${m.nav.top}–${m.nav.bottom}/${m.innerH}, min text ${m.minFont}px`;
  };
  /** Scroll the visible page to its end (content clears the bottom nav there). */
  const toEnd = () =>
    page.evaluate(() => {
      const pg = [...document.querySelectorAll(".taro_page")].find((e) => e.checkVisibility());
      if (pg) pg.scrollTop = pg.scrollHeight;
      window.scrollTo(0, document.body.scrollHeight);
    });
  const navOn = () => page.$eval(V(".tabbar .tab.is-on .tab-label"), (e) => e.textContent);

  // ---------- 专项练习 ----------
  await step(`${vp} 1 专项练习 · 主题训练 (F-B): header, three colour zones, two columns, every tile its F-B PNG, no 敬请期待 cards`, async () => {
    await open("home");
    await page.waitForSelector(V('[data-testid="home"]'));
    await page.click(V('[data-action="explore"]'));
    await settle("explore");
    await page.waitForFunction(() => {
      const imgs = [...document.querySelectorAll('[data-testid="explore"] .tile-art img, [data-testid="explore"] .fb-mascot img')];
      return imgs.length === 9 && imgs.every((i) => i.complete && i.naturalWidth > 0);
    }, null, { timeout: 5000 });
    const v = await page.evaluate(() => {
      const root = [...document.querySelectorAll('[data-testid="explore"]')].find((e) => e.checkVisibility());
      const px = (el, p) => parseFloat(getComputedStyle(el)[p]);
      const mascot = root.querySelector(".fb-mascot");
      const headText = root.querySelector(".fb-head-text").getBoundingClientRect();
      return {
        title: root.querySelector(".title").textContent,
        kicker: root.querySelector(".fb-kicker").textContent,
        lede: root.querySelector(".lede").textContent,
        hint: root.querySelector(".fb-hint").textContent,
        hintPx: px(root.querySelector(".fb-hint"), "fontSize"),
        hintW: px(root.querySelector(".fb-hint"), "fontWeight"),
        groupPx: px(root.querySelector(".practice-group-title"), "fontSize"),
        groupW: px(root.querySelector(".practice-group-title"), "fontWeight"),
        mascot: mascot ? { h: Math.round(mascot.getBoundingClientRect().height), src: mascot.querySelector("img").src, headH: Math.round(headText.height) } : null,
        zones: [...root.querySelectorAll(".practice-group")].map((g) => ({ bg: getComputedStyle(g).backgroundColor, img: getComputedStyle(g).backgroundImage, en: g.querySelector(".practice-group-en").textContent })),
        groups: [...root.querySelectorAll(".practice-group")].map((g) => ({
          head: g.querySelector(".practice-group-title").textContent,
          role: g.querySelector(".practice-group-title").getAttribute("role"),
          cards: [...g.querySelectorAll(".practice-card")].map((d) => {
            const r = d.getBoundingClientRect();
            const tile = d.querySelector(".tile");
            return {
              id: d.dataset.domain,
              name: d.querySelector(".practice-name").textContent,
              status: d.querySelector(".practice-status").textContent,
              aria: d.getAttribute("aria-label"),
              tone: (tile.className.match(/tone-(\w+)/) || [])[1] || "",
              pic: Boolean(d.querySelector(".tile-art")),
              picSrc: (d.querySelector(".tile-art img") || {}).src || "",
              picW: (d.querySelector(".tile-art img") || {}).naturalWidth || 0,
              nameLines: Math.round(d.querySelector(".practice-name").getBoundingClientRect().height / parseFloat(getComputedStyle(d.querySelector(".practice-name")).lineHeight)),
              statusLines: Math.round(d.querySelector(".practice-status").getBoundingClientRect().height / parseFloat(getComputedStyle(d.querySelector(".practice-status")).lineHeight)),
              textInside: [".practice-name", ".practice-status"].every((s) => d.querySelector(s).getBoundingClientRect().right <= r.right + 0.5),
              glyph: Boolean(d.querySelector(".tile-glyph .icon") && d.querySelector(".tile-glyph .icon").textContent.trim() && d.querySelector(".tile-glyph .icon").getBoundingClientRect().width > 4),
              picOk: [...d.querySelectorAll(".tile-art img")].some((i) => i.complete && i.naturalWidth > 0),
              box: { l: Math.round(r.left), t: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height) },
            };
          }),
        })),
        soon: [...root.querySelectorAll(".soon-tile, .soon-chip, .section-label")].length,
        segSoon: [...root.querySelectorAll(".seg[data-action=soon]")].map((s) => s.dataset.soon),
      };
    });
    const want = [["幂与乘方", "sky", ["平方", "立方", "常见幂"]], ["乘法与凑整", "amber", ["常用乘积", "凑整乘积家族"]], ["数与分数", "mint", ["分数到小数", "半数与翻倍", "补数"]]];
    check(JSON.stringify(v.groups.map((g) => [g.head, g.cards[0].tone, g.cards.map((c) => c.name)])) === JSON.stringify(want), `groups ${JSON.stringify(v.groups.map((g) => [g.head, g.cards.map((c) => c.name)]))}`);
    const cards = v.groups.flatMap((g) => g.cards);
    check(cards.length === 8 && new Set(cards.map((c) => c.id)).size === 8 && cards.every((c) => DOMAIN_ORDER.includes(c.id)), `cards ${cards.map((c) => c.id)}`);
    for (const c of cards) {
      check(c.name === LABELS[DOMAIN_ORDER.indexOf(c.id)], `${c.id} name ${c.name}`);
      check(["还没怎么练", "正在熟悉", "有几题要再巩固", "大多已经很稳"].includes(c.status), `${c.name} status ${c.status}`);
      check(c.aria === `${c.name}，${c.status}`, `${c.name} aria ${c.aria}`);
      check(c.pic && c.picOk && c.picW === 256, `${c.name}: F-B picture not loaded (${c.picSrc})`);
      const file = { squares: "domain-squares", cubes: "domain-cubes", powers: "domain-powers", products: "domain-products", special_products: "domain-special-products", fraction_decimal: "domain-fraction-decimal", halves: "domain-halves", complements: "domain-complements" }[c.id];
      check(c.picSrc.includes(`concept-design/F-B-final/assets/specialist/domains/${file}`) && /\.png$/.test(c.picSrc), `${c.name}: not the manifest's PNG (${c.picSrc})`);
      check(c.nameLines === 1 && c.statusLines === 1 && c.textInside, `${c.name}: name/status lines ${c.nameLines}/${c.statusLines}, inside ${c.textInside}`);
      check(c.box.w >= 44 && c.box.h >= 44, `${c.name} target ${c.box.w}×${c.box.h}`);
    }
    check(v.groups.every((g) => g.role === "heading" && g.cards.every((c) => c.tone === g.cards[0].tone)), "headings + one tint per group");
    for (const g of v.groups) {
      const [a, b, c] = g.cards.map((x) => x.box);
      check(b.l >= a.l + a.w - 1 && Math.abs(b.t - a.t) <= 1 && Math.abs(a.w - b.w) <= 1, `${g.head}: two columns ${JSON.stringify(g.cards.map((x) => x.box))}`);
      if (c) check(Math.abs(c.l - a.l) <= 1 && Math.abs(c.w - a.w) <= 1 && c.t >= a.t + a.h - 1, `${g.head}: 3rd card left, not stretched ${JSON.stringify(c)}`);
    }
    check(v.soon === 0, "no 敬请期待 cards / 更多方向 on the practice page");
    check(v.kicker === "EXPLORE MATH" && v.title === "探索数学世界" && v.lede === "从一个主题开始，走更远的路" && v.hint === "今天想练哪个？", `header ${v.kicker}/${v.title}/${v.lede}/${v.hint}`);
    check(v.hintPx < v.groupPx && v.hintW < v.groupW, `helper line ${v.hintPx}px/${v.hintW} vs group title ${v.groupPx}px/${v.groupW}`);
    check(v.mascot && v.mascot.h <= 80 && v.mascot.h <= v.mascot.headH && /specialist-mascot@2x\.png$/.test(v.mascot.src), `mascot ${JSON.stringify(v.mascot)}`);
    check(JSON.stringify(v.zones.map((z) => [z.bg, z.img, z.en])) === JSON.stringify([["rgb(234, 242, 251)", "none", "POWERS"], ["rgb(253, 243, 231)", "none", "PRODUCTS"], ["rgb(233, 246, 240)", "none", "NUMBERS"]]), `zones ${JSON.stringify(v.zones)}`);
    check(v.segSoon.join("/") === "知识地图", `segment ${v.segSoon}`);
    check((await navOn()) === "练习", `nav on ${await navOn()}`);
    const lay = await layout("explore", "explore");
    await shot("01-explore");
    await page.click(V('.seg[data-soon="知识地图"]'));
    const toast = await page.textContent(V('[data-testid="toast"]'));
    check(toast === "知识地图 · 敬请期待", `toast ${toast}`);
    check((await page.$$(V(".practice-card"))).length === 8, "知识地图 does not draw the cards again");
    // the list end clears the bottom nav
    await toEnd();
    await page.waitForTimeout(150);
    const end = await page.evaluate(() => {
      const root = [...document.querySelectorAll('[data-testid="explore"]')].find((e) => e.checkVisibility());
      const pg = root.closest(".taro_page") || document;
      const last = [...root.querySelectorAll(".practice-card")].pop().getBoundingClientRect();
      const nav = [...pg.querySelectorAll(".tabbar")].find((e) => e.checkVisibility()).getBoundingClientRect();
      return { last: Math.round(last.bottom), nav: Math.round(nav.top) };
    });
    check(end.last <= end.nav, `last card ${end.last} under the nav ${end.nav}`);
    await shot("01b-explore-more");
    // A picture that fails to load falls back to the glyph: never an empty chip.
    await page.route("**/domain-cubes.png", (r) => r.abort());
    await page.reload();
    await settle("explore");
    await page.waitForTimeout(400);
    const fb = await page.evaluate(() => {
      const root = [...document.querySelectorAll('[data-testid="explore"]')].find((e) => e.checkVisibility());
      const t = root.querySelector('.practice-card[data-domain="cubes"] .tile');
      const g = t.querySelector(".tile-glyph .icon");
      return { cls: t.className, glyph: Boolean(g && g.textContent.trim() && g.getBoundingClientRect().width > 4), img: Boolean(t.querySelector("img")) };
    });
    await page.unroute("**/domain-cubes.png");
    check(fb.glyph && !fb.img && /is-broken/.test(fb.cls), `failed picture fallback ${JSON.stringify(fb)}`);
    errors.splice(0, errors.length, ...errors.filter((e) => !/domain-cubes|ERR_FAILED|Failed to load resource/.test(e)));
    await page.reload();
    await settle("explore");
    return `「${v.kicker} / ${v.title}」 mascot ${v.mascot.h}px; ${v.groups.map((g) => `${g.head}: ${g.cards.map((c) => `${c.name}[${c.pic ? "png" : "glyph"}]`).join("/")}`).join("; ")}; failed 立方 picture → glyph; no 敬请期待 cards (知识地图 → 「${toast}」); end ${end.last} ≤ nav ${end.nav}; ${lay}`;
  });

  for (const [n, domain] of DOMAIN_ORDER.entries()) {
    await step(`${vp} 2.${n + 1} ${LABELS[n]} card → confirm → focused set`, async () => {
      await open("explore");
      await settle("explore");
      await page.click(V(`.practice-card[data-domain="${domain}"]`));
      await settle("focus-confirm");
      const c = await page.evaluate(() => {
        const r = [...document.querySelectorAll('[data-testid="focus-confirm"]')].find((e) => e.checkVisibility());
        return { domain: r.dataset.domain, title: r.querySelector(".title").textContent, lede: r.querySelector(".lede").textContent, back: r.querySelector(".back").textContent, cta: r.querySelector('[data-action="start-focus"]').textContent };
      });
      check(c.domain === domain && c.title === LABELS[n], `confirm ${c.domain} ${c.title}`);
      check(c.lede === "只练这一块，同样是一小段，不是一直刷。" && c.cta === "开始这一小段" && c.back.includes("返回练习"), `confirm copy ${JSON.stringify(c)}`);
      const lay = await layout(`focus-${domain}`, "focus-confirm");
      await shot(`02-${n + 1}-focus-${domain}`);
      await page.click(V('[data-action="start-focus"]'));
      await settle("train");
      const s = (await learner()).activeSession;
      check(s && s.mode === "focused" && s.domain === domain, `session ${s && s.mode}/${s && s.domain}`);
      const off = s.queue.filter((id) => byId.get(id).domain !== domain);
      check(s.queue.length > 0 && off.length === 0, `queue mixes domains: ${off}`);
      const onScreen = await page.getAttribute(V('[data-testid="train"]'), "data-item");
      check(byId.get(onScreen).domain === domain, `first item ${onScreen}`);
      const navInTrain = await page.evaluate(() => [...document.querySelectorAll(".tabbar")].some((e) => e.checkVisibility()));
      check(!navInTrain, "no bottom nav while answering");
      await shot(`03-${n + 1}-train-${domain}`);
      return `confirm 「${c.title}」 → set of ${s.queue.length} all from ${domain} (first 「${byId.get(onScreen).prompt}」); ${lay}`;
    });
  }

  // ---------- 错题本 ----------
  await step(`${vp} 3 错题本: grouped by domain (new domains incl.), empty groups hidden, stacked fraction`, async () => {
    await open("home");
    await page.waitForSelector(V('[data-testid="home"]'));
    await page.click(V('.tabbar [data-tab="mistakes"]'));
    await settle("mistakes");
    const m = await page.evaluate(() => {
      const r = [...document.querySelectorAll('[data-testid="mistakes"]')].find((e) => e.checkVisibility());
      const ffRow = r.querySelector('.list-row[data-id="ifraction-1-2"]');
      const fb = ffRow && ffRow.querySelector(".frac-blank");
      const num = fb && fb.querySelector(".num").getBoundingClientRect();
      const den = fb && fb.querySelector(".den").getBoundingClientRect();
      return {
        title: r.querySelector(".title").textContent,
        groups: [...r.querySelectorAll(".mistake-group")].map((g) => ({ d: g.dataset.domain, label: g.querySelector(".group-label").textContent, ids: [...g.querySelectorAll(".list-row")].map((x) => x.dataset.id) })),
        ffText: ffRow && ffRow.querySelector(".row-prompt").textContent,
        stacked: Boolean(num && den && num.bottom <= den.top + 2 && Math.abs(num.left - den.left) < 2),
        badges: r.closest(".taro_page").querySelectorAll(".badge, .tab-badge, .dot, [class*=count]").length,
        segs: [...r.querySelectorAll(".seg")].map((s) => s.textContent),
        actions: [...r.querySelectorAll(".action-pair .cta")].map((s) => s.textContent.replace(/[\uE000-\uF8FF]/g, "").trim()),
      };
    });
    check(m.groups.map((g) => g.d).join() === DOMAIN_ORDER.join(), `groups ${m.groups.map((g) => g.d)}`);
    check(m.groups.map((g) => g.label).join() === LABELS.join(), `labels ${m.groups.map((g) => g.label)}`);
    for (const g of seed.groups) check(m.groups.find((x) => x.d === g.domain).ids.join() === g.ids.join(), `${g.domain} rows`);
    check(!m.groups.some((g) => g.ids.includes(seed.recovered) || g.ids.includes(seed.right)), "recovered / right not listed");
    check(m.stacked && !/[/?]/.test(m.ffText), `fraction_fields row 「${m.ffText}」 stacked ${m.stacked}`);
    check(m.badges === 0, `badges ${m.badges}`);
    check((await navOn()) === "错题本", "nav 错题本 on");
    check(m.actions.join("/") === "印这些题/练这些错题", `actions ${m.actions}`);
    const lay = await layout("mistakes", "mistakes");
    await shot("04-mistakes");
    await toEnd();
    await page.waitForTimeout(150);
    await shot("04b-mistakes-end");
    // Only two domains with mistakes → only those two groups.
    const two = structuredClone(seed.root);
    const L = two.learners[two.active_learner_id];
    for (const id of Object.keys(L.relations)) if (!["half-64", "pow-2-5"].includes(id)) delete L.relations[id];
    await open("mistakes", JSON.stringify(two));
    await settle("mistakes");
    const shown = await page.$$eval(V(".mistake-group"), (els) => els.map((g) => g.dataset.domain));
    check(shown.join() === "halves,powers", `two groups ${shown}`);
    await shot("04c-mistakes-two-groups");
    return `「${m.title}」 ${m.groups.map((g) => `${g.label}(${g.ids.length})`).join(" ")}; 0.5 = stacked empty bar 「${m.ffText}」; segments ${m.segs.join("/")}; no badges; only halves+powers → ${shown.length} groups; ${lay}`;
  });

  await step(`${vp} 3b 错题本 empty / 练这些错题`, async () => {
    const empty = structuredClone(seed.root);
    empty.learners[empty.active_learner_id].relations = {};
    await open("mistakes", JSON.stringify(empty));
    await settle("mistakes");
    const isEmpty = await page.getAttribute(V('[data-testid="mistakes"]'), "data-empty");
    check(isEmpty === "true", "empty state");
    await shot("04d-mistakes-empty");
    await open("mistakes");
    await settle("mistakes");
    await page.click(V('[data-action="start-mistakes"]'));
    await settle("train");
    const s = (await learner()).activeSession;
    check(s.mode === "mistake_book" && s.queue.every((id) => seed.mistakes.includes(id)), `mistake set ${s.mode} ${s.queue}`);
    return `empty book shows its message; 练这些错题 → core mistake_book set of ${s.queue.length}, all current mistakes`;
  });

  // ---------- 最近练得怎么样 ----------
  await step(`${vp} 4 最近练得怎么样`, async () => {
    await open("home");
    await page.waitForSelector(V('[data-testid="home"]'));
    await page.click(V('[data-action="progress"]'));
    await settle("progress");
    const p = await page.evaluate(() => {
      const r = [...document.querySelectorAll('[data-testid="progress"]')].find((e) => e.checkVisibility());
      return {
        title: r.querySelector(".title").textContent,
        sessions: [...r.querySelectorAll(".sessions .list-row")].map((x) => x.textContent),
        outcomes: [...r.querySelectorAll('[data-testid="recent-outcomes"] .list-row')].map((x) => [x.dataset.id, x.dataset.outcome]),
        ff: Boolean(r.querySelector('[data-testid="recent-outcomes"] .list-row[data-id="ifraction-1-2"] .frac-blank')),
        back: r.querySelector(".back").textContent,
        cols: getComputedStyle(r.querySelector(".outcomes")).gridTemplateColumns.split(" ").length,
      };
    });
    check(p.title === "最近练得怎么样" && p.back.includes("回首页"), `title ${p.title}`);
    check(p.sessions.length === 2 && /先停了/.test(p.sessions[0]) && /对了 2\/3/.test(p.sessions[0]) && /做完了/.test(p.sessions[1]) && /对了 7\/10/.test(p.sessions[1]), `sessions ${p.sessions}`);
    check(p.outcomes.length === seed.practiced, `outcomes ${p.outcomes.length}`);
    check(p.outcomes.find(([id]) => id === seed.right)[1] === "right" && p.outcomes.find(([id]) => id === "cube-2")[1] === "wrong", "right / wrong marks");
    check(p.ff, "fraction_fields outcome drawn with an empty bar");
    check((await navOn()) === "首页", "nav 首页 on");
    const lay = await layout("progress", "progress");
    await shot("05-progress");
    return `${p.sessions.join(" | ")}; ${p.outcomes.length} outcomes in ${p.cols} columns; ${lay}`;
  });

  // ---------- 印到纸上 ----------
  await step(`${vp} 5 选题打印 → A4 → 答案 (and print media)`, async () => {
    await open("mistakes");
    await settle("mistakes");
    await page.click(V('[data-action="a4-mistakes"]'));
    await settle("print-select");
    const count = () => page.textContent(V('[data-testid="print-count"]'));
    const rows = () => page.$eval(V('[data-testid="print-list"]'), (l) => [...l.querySelectorAll('[role="checkbox"]')].map((r) => [r.dataset.id, r.dataset.selected]));
    check((await page.getAttribute(V('[data-testid="print-select"]'), "data-source")) === "mistakes", "source mistakes");
    check((await count()) === `已选 ${seed.mistakes.length} 题`, `count ${await count()}`);
    let r = await rows();
    check(r.length === seed.mistakes.length && r.every(([, s]) => s === "true"), `default rows ${r}`);
    const chips = await page.$eval(V(".filters"), (f) => [...f.querySelectorAll(".chip")].map((c) => c.textContent));
    check(chips.join("/") === ["全部", ...LABELS].join("/"), `chips ${chips}`);
    const selLay = await layout("print-select", "print-select");
    await shot("06-print-select");
    await toEnd();
    await page.waitForTimeout(150);
    await shot("06c-print-select-end");
    await page.click(V('[data-action="print-show-others"]'));
    r = await rows();
    check(r.length === seed.practiced && r.filter(([, s]) => s === "false").length === 2, `with others ${r.length}`);
    await page.click(V(`[role="checkbox"][data-id="${seed.right}"]`));
    await page.click(V('[role="checkbox"][data-id="square-6"]'));
    check((await count()) === `已选 ${seed.mistakes.length} 题`, `toggle count ${await count()}`);
    await page.click(V(`[role="checkbox"][data-id="${seed.right}"]`));
    await page.click(V('[role="checkbox"][data-id="square-6"]'));
    r = await rows();
    check(r.find(([id]) => id === seed.right)[1] === "false" && r.find(([id]) => id === "square-6")[1] === "true", "toggled back");
    await page.click(V('.chip[data-domain="cubes"]'));
    r = await rows();
    check(r.every(([id]) => byId.get(id).domain === "cubes") && r.length === 2, `cubes rows ${r}`);
    await page.click(V('[data-action="print-clear"]'));
    check((await count()) === `已选 ${seed.mistakes.length - 1} 题`, `clear cubes ${await count()}`);
    await shot("06b-print-filter-cubes");
    await page.click(V('[data-action="print-select-mistakes"]'));
    await page.click(V('.chip[data-domain=""]'));
    const picked = Number((await count()).match(/\d+/)[0]);
    check(picked === seed.mistakes.length, `before preview ${picked}`);
    await page.click(V('[data-action="print-preview"]'));
    await settle("a4");
    const a = await page.evaluate(() => {
      const root = [...document.querySelectorAll('[data-testid="a4"]')].find((e) => e.checkVisibility());
      const sheet = root.querySelector('[data-testid="a4-sheet"]');
      const ff = sheet.querySelector('.sheet-item[data-id="ifraction-1-2"]');
      const fb = ff.querySelector(".frac-blank");
      const nr = fb.querySelector(".num").getBoundingClientRect();
      const dr = fb.querySelector(".den").getBoundingClientRect();
      const bg = getComputedStyle(sheet).backgroundColor;
      return {
        title: sheet.querySelector(".sheet-title").textContent,
        sub: sheet.querySelector(".sheet-sub").textContent,
        items: [...sheet.querySelectorAll(".sheet-item")].map((i) => i.dataset.id),
        ffText: ff.textContent,
        ffStacked: nr.bottom <= dr.top + 2,
        ffLine: Boolean(ff.querySelector(".blank")),
        lines: sheet.querySelectorAll(".sheet-item .blank").length,
        cols: getComputedStyle(sheet.querySelector(".sheet-list")).columnCount,
        bg,
        print: root.querySelector('[data-action="print"]')?.textContent,
        note: root.querySelector(".print-note").textContent,
      };
    });
    check(a.title === "数感训练场 · 纸上再写一次" && /月\d+日/.test(a.sub), `sheet head ${a.title} ${a.sub}`);
    check(a.items.length === picked && a.items.every((id) => seed.mistakes.includes(id)), `sheet items ${a.items}`);
    check(a.ffStacked && !a.ffLine && !/[/?]/.test(a.ffText.replace(/^\d+\./, "")), `A4 fraction_fields 「${a.ffText}」`);
    check(a.lines === picked - 1, `writing lines ${a.lines}`);
    check(a.bg === "rgb(255, 255, 255)" && a.cols === "2", `paper ${a.bg} cols ${a.cols}`);
    check(a.print === "打印 / 保存为 PDF" && /存储为 PDF/.test(a.note), `print button ${a.print}`);
    const a4Lay = await layout("a4", "a4");
    await shot("07-a4");
    await toEnd();
    await page.waitForTimeout(150);
    await shot("07c-a4-end");
    // print media: only the sheet, no nav / buttons / other pages
    await page.emulateMedia({ media: "print" });
    const pm = await page.evaluate(() => {
      const vis = (s) => [...document.querySelectorAll(s)].filter((e) => e.checkVisibility()).length;
      return { sheet: vis('[data-testid="a4-sheet"]'), nav: vis(".tabbar"), buttons: vis(".no-print .cta, .back"), pages: vis(".taro_page"), mistakes: vis('[data-testid="mistakes"]') };
    });
    check(pm.sheet === 1 && pm.nav === 0 && pm.buttons === 0 && pm.pages === 1 && pm.mistakes === 0, `print media ${JSON.stringify(pm)}`);
    await shot("07b-a4-print-media");
    let pdfNote = "";
    if (vp === "375x667") {
      await page.pdf({ path: `${SHOTS}/a4-print.pdf`, format: "A4", printBackground: true, preferCSSPageSize: true });
      pdfNote = `; PDF ${SHOTS}/a4-print.pdf`;
    }
    await page.emulateMedia({ media: "screen" });
    await page.click(V('[data-action="toggle-answers"]'));
    await page.waitForSelector(V('[data-testid="a4-answers"]'));
    const ans = await page.$eval(V('[data-testid="a4-answers"]'), (s) => [...s.querySelectorAll(".sheet-item")].map((i) => i.dataset.id));
    const sheetGone = !(await page.$(V('[data-testid="a4-sheet"]')));
    check(ans.join() === a.items.join() && sheetGone, `answers ${ans.length}, sheet hidden ${sheetGone}`);
    await shot("08-a4-answers");
    await page.click(V('[data-action="print-back"]'));
    await page.waitForSelector(V('[data-testid="print-select"]'));
    check((await count()) === `已选 ${picked} 题`, "selection kept on 返回选题");
    // from 最近练得怎么样: same selector, current mistakes pre-selected
    await open("progress");
    await settle("progress");
    await page.click(V('[data-action="a4-progress"]'));
    await settle("print-select");
    check((await page.getAttribute(V('[data-testid="print-select"]'), "data-source")) === "progress" && (await count()) === `已选 ${seed.mistakes.length} 题`, "from progress");
    return `${seed.mistakes.length} pre-selected, 全部 + 8 domain chips, show others/toggle/filter/clear/select-all; A4 「${a.sub}」 ${a.items.length} items in 2 columns on white, 0.5 = stacked bar (no line), ${a.lines} writing lines; print media → sheet only (${JSON.stringify(pm)})${pdfNote}; answers separate (${ans.length}); 选题 ${selLay}; A4 ${a4Lay}`;
  });

  await step(`${vp} 6 pages never touch the learner record`, async () => {
    await open("mistakes");
    await settle("mistakes");
    await page.click(V('[data-action="a4-mistakes"]'));
    await settle("print-select");
    await page.click(V('[data-action="print-preview"]'));
    await settle("a4");
    await page.click(V('.tabbar [data-tab="explore"]'));
    await settle("explore");
    await page.click(V('.practice-card[data-domain="cubes"]'));
    await settle("focus-confirm");
    const r = await stored();
    check(JSON.stringify(r) === RAW, "stored record changed by viewing pages");
    check(r.version === 3, "version 3");
    return "viewing 错题本 → 选题 → A4 → 专项练习 → confirm leaves nsl-v01-state byte-identical (v3)";
  });

  await step(`${vp} 7 no errors, no outside requests`, async () => {
    check(errors.length === 0, `errors ${errors.slice(0, 3).join(" | ")}`);
    check(foreign.length === 0, `foreign ${foreign.slice(0, 3)}`);
    return "0 console errors, 0 requests outside the app";
  });
  await ctx.close();
}
await browser.close();
writeFileSync(`${SHOTS}/taro-pages-layout.json`, JSON.stringify(layoutRows, null, 2));
console.log(results.join("\n"));
console.log(`\n${results.length - failed}/${results.length} passed`);
process.exit(failed ? 1 : 0);
