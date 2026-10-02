// H5 runtime check of the shared pages (Taro build in dist/h5) at 375 and 1366:
// Home → Training → Correct / Wrong, fraction fields / repeating / needs_simplification,
// pause / stop / resume, a full set, write protection, reduced motion.
//
//   npm run build:h5 && (cd dist/h5 && python3 -m http.server 4180) &
//   npm i --no-save playwright-core   # once; uses a local Chrome
//   BASE=http://localhost:4180/ CHROME=/usr/bin/google-chrome node scripts/h5-browser-e2e.mjs
import { mkdirSync } from "node:fs";
import { chromium } from "playwright-core";
import { loadCoreCatalog } from "../src/core/content.js";
import { startSession } from "../src/core/session.js";

const BASE = process.env.BASE || "http://localhost:4180/";
const SHOTS = process.env.SHOTS || "dist/h5-shots";
const CHROME = process.env.CHROME || "/usr/bin/google-chrome";
const KEY = "nsl-v01-state";
mkdirSync(SHOTS, { recursive: true });
const catalog = loadCoreCatalog();
const byId = new Map(catalog.map((i) => [i.id, i]));

const results = [];
let failed = 0;
const check = (cond, msg) => {
  if (!cond) throw new Error(msg);
};
async function step(name, fn) {
  try {
    results.push(`PASS ${name} — ${await fn()}`);
  } catch (e) {
    failed += 1;
    results.push(`FAIL ${name} — ${e.message}`);
  }
}
const blockOf = (item) => (item.answer_type === "decimal_repeating" ? item.canonical_answer.replace(/^\d+\.\((\d+)\)$/, "$1") : item.canonical_answer);
const wrongFor = (item) => (item.canonical_answer === "1" ? "2" : "1");

/** A stored v3 record with an unfinished set over chosen items (one already answered). */
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
function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const browser = await chromium.launch({ executablePath: CHROME, args: ["--no-sandbox"] });
for (const [vp, size] of [["mobile", { width: 375, height: 812 }], ["mobile390", { width: 390, height: 844 }], ["desktop", { width: 1366, height: 900 }]]) {
  const desktop = vp === "desktop";
  const ctx = await browser.newContext({ viewport: size });
  const page = await ctx.newPage();
  const errors = [];
  const foreign = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("request", (r) => !r.url().startsWith(BASE) && !r.url().startsWith("data:") && foreign.push(r.url()));
  const shot = (n) => page.screenshot({ path: `${SHOTS}/${vp}-${n}.png` });
  const stored = () => page.evaluate((k) => localStorage.getItem(k), KEY);
  const learner = async () => {
    const r = JSON.parse(await stored());
    return r.learners[r.active_learner_id];
  };
  const screen = () =>
    page.evaluate(() => ["home", "train", "correct", "wrong", "pause", "end"].find((s) => document.querySelector(`[data-testid="${s}"]`)) || "none");
  const currentItem = async () => byId.get(await page.getAttribute('[data-testid="train"]', "data-item"));
  const press = async (text, physical = false) => {
    for (const ch of text) {
      // A fraction_fields answer 「n/d」: 「/」 means "tap the denominator box" (there is no 「/」 key).
      if (ch === "/" && (await page.$('[data-testid="fraction-fields"]'))) await page.click('[data-testid="fraction-fields"] [data-field="denominator"]');
      else if (physical) await page.keyboard.press(ch);
      else await page.click(`[data-testid="train"] .key[data-key="${ch}"]`);
    }
  };
  const submit = (physical = false) => (physical ? page.keyboard.press("Enter") : page.click('[data-testid="train"] .key[data-key="submit"]'));
  const freshHome = async (raw) => {
    await page.goto(`${BASE}#/pages/home/index`);
    await page.evaluate(([k, v]) => (v === null ? localStorage.clear() : localStorage.setItem(k, v)), [KEY, raw]);
    await page.reload();
    await page.waitForSelector('[data-testid="home"]');
  };

  await freshHome(null);

  await step(`${vp} 1 Home`, async () => {
    await page.waitForFunction(() => {
      const i = document.querySelector('[data-slot="mascot.welcome"] img');
      return i && i.complete && i.naturalWidth > 0;
    });
    const h = await page.evaluate(() => ({
      cta: document.querySelector('[data-action="start-daily"] .entry-name')?.textContent,
      sub: document.querySelector('[data-action="start-daily"] .entry-sub')?.textContent,
      title: document.querySelector(".bubble-title")?.textContent,
      cards: [...document.querySelectorAll(".entry .entry-name")].map((e) => e.textContent),
      note: document.querySelector(".device-note")?.textContent,
      nav: [...document.querySelectorAll(".tabbar .tab-label")].map((e) => e.textContent),
      navOn: document.querySelector(".tabbar .tab.is-on .tab-label")?.textContent,
      mascotSrc: document.querySelector('[data-slot="mascot.welcome"] img')?.getAttribute("src"),
      logo: Boolean(document.querySelector('[data-slot="logo.mark"] img')),
      font: getComputedStyle(document.querySelector(".bubble-title")).fontFamily,
    }));
    check(h.cta === "开始今天的练习" && h.sub === "大约 5～10 分钟", `cta ${h.cta}/${h.sub}`);
    check(h.title === "和数字做朋友", `title ${h.title}`);
    check(h.cards.join("/") === "开始今天的练习/专项练习/错题本/最近练得怎么样", `cards ${h.cards}`);
    check(h.note === "练习记录只保存在当前设备，不会自动同步到其他设备。", "device note");
    check(h.nav.join("/") === "首页/练习/错题本/我的" && h.navOn === "首页", `nav ${h.nav}`);
    check(/mascot-welcome-512\.webp/.test(h.mascotSrc), `mascot ${h.mascotSrc}`);
    check(!/Nunito/.test(h.font) && /PingFang SC/.test(h.font), `font ${h.font}`);
    await shot("01-home");
    // 专项练习 is a page now (no longer 敬请期待): eight domain cards, then back to 首页 by the bottom entry.
    await page.click('[data-action="explore"]');
    await page.waitForSelector('[data-testid="explore"]:visible');
    const domains = await page.$$eval('[data-testid="explore"] .domain', (els) => els.filter((e) => e.checkVisibility()).length);
    check(domains === 8, `domains ${domains}`);
    await page.click('.tabbar:visible [data-tab="home"]');
    await page.waitForSelector('[data-testid="home"]:visible');
    await page.waitForTimeout(200);
    return `「${h.title}」, CTA 「${h.cta}」/${h.sub}, 3 cards, nav ${h.nav.join("/")} (首页 on), welcome mascot = display WebP, logo ${h.logo}, system font, 专项练习 → ${domains} domain cards → 首页`;
  });

  await step(`${vp} 2 Home → Training (FOCUS)`, async () => {
    await page.waitForTimeout(1900);
    await page.click('[data-action="start-daily"]');
    await page.waitForSelector('[data-testid="train"]');
    const t = await page.evaluate(() => ({
      count: document.querySelector('[data-testid="set-count"]').textContent,
      label: document.querySelector(".practice-label").textContent,
      nav: [...document.querySelectorAll(".tabbar")].some((e) => e.checkVisibility()),
      mascots: document.querySelectorAll('[data-testid="train"] .mascot').length,
      decor: document.querySelectorAll('[data-testid="train"] .deco').length,
      q: parseFloat(getComputedStyle(document.querySelector(".math.question")).fontSize),
      keys: [...document.querySelectorAll('[data-testid="train"] .key')].map((k) => k.getAttribute("data-key") || "·"),
      pause: document.querySelector('[data-action="pause"]').textContent,
      hash: location.hash,
    }));
    check(t.count === "第 1 题 · 共 10 题", t.count);
    check(!t.nav && t.mascots === 0 && t.decor === 0, `nav ${t.nav} mascots ${t.mascots}`);
    check(t.q === (desktop ? 60 : 40), `question ${t.q}px`);
    check(t.keys.slice(0, 9).join("") === "123456789" && t.keys.includes("del") && t.keys.includes("submit"), t.keys.join());
    await submit();
    const nudge = await page.textContent('[data-testid="nudge"]');
    const item = await currentItem();
    check(nudge === (item.answer_type === "fraction_fields" ? "先写一个分数" : "先写一个数"), `nudge ${nudge}`);
    check((await learner()).relations[item.id] === undefined, "empty submit recorded nothing");
    await shot("02-training");
    return `${t.hash}; 「${t.count}」, 「${t.label}」, 「${t.pause}」, no nav / mascot / decoration; question ${t.q}px; empty 提交 → 「${nudge}」, nothing stored`;
  });

  await step(`${vp} 3 Correct → auto next`, async () => {
    const item = await currentItem();
    await press(blockOf(item), desktop);
    const t0 = Date.now();
    await submit(desktop);
    await page.waitForSelector('[data-testid="correct"]');
    await page.waitForSelector('[data-slot="mascot.correct"] img', { timeout: 500 }).catch(() => {}); // Taro's <Image> adds its <img> a tick later
    const c = await page.evaluate(() => ({
      title: document.querySelector(".feedback-title").textContent,
      word: document.querySelector(".word").textContent,
      tick: Boolean(document.querySelector(".ok .ok-check")),
      mascot: document.querySelector('[data-slot="mascot.correct"] img')?.getAttribute("src"),
      buttons: document.querySelectorAll('[data-testid="correct"] .cta, [data-testid="correct"] [role="button"]').length,
      keys: document.querySelectorAll(".key").length,
      nav: [...document.querySelectorAll(".tabbar")].some((e) => e.checkVisibility()),
      relation: document.querySelector(".correct-eq").getAttribute("aria-label"),
    }));
    await page.waitForTimeout(120);
    await shot("03-correct");
    await page.waitForFunction(() => document.querySelector('[data-testid="set-count"]')?.textContent === "第 2 题 · 共 10 题", null, { timeout: 3000 });
    const ms = Date.now() - t0;
    const l = await learner();
    const att = l.relations[item.id].attempts.at(-1);
    check(c.title === "太棒了！" && c.word === "对" && c.tick, JSON.stringify(c));
    check(/mascot-correct-512\.webp/.test(c.mascot || ""), `correct mascot ${c.mascot}`);
    check(c.buttons === 0 && c.keys === 0 && !c.nav, `buttons ${c.buttons} keys ${c.keys}`);
    check(c.relation === item.relation, `relation ${c.relation}`);
    check(ms >= 650 && ms < 1500, `advanced after ${ms}ms`);
    check(att.correct === true && att.inputMode === (desktop ? "physical_keyboard" : "onscreen_keypad"), JSON.stringify(att));
    check(l.activeSession.answered === 1, "answered 1");
    return `${item.id} 「${blockOf(item)}」 via ${desktop ? "physical keys + Enter" : "on-screen keypad"} → 「太棒了！」, 「${c.relation}」 ✓ 「对」, correct mascot, no button / keypad / nav; 第 2 题 · 共 10 题 after ${ms}ms with no tap; stored inputMode ${att.inputMode}`;
  });

  await step(`${vp} 4 Wrong → 下一题`, async () => {
    const item = await currentItem();
    await press(wrongFor(item));
    await submit();
    await page.waitForSelector('[data-testid="wrong"]');
    await page.waitForTimeout(1300);
    const w = await page.evaluate(() => {
      const px = (s) => parseFloat(getComputedStyle(document.querySelector(s)).fontSize);
      return {
        still: Boolean(document.querySelector('[data-testid="wrong"]')),
        keys: document.querySelectorAll(".key").length,
        nav: [...document.querySelectorAll(".tabbar")].some((e) => e.checkVisibility()),
        eq: document.querySelector(".panel .eq").getAttribute("aria-label"),
        hint: document.querySelector(".hint-label").textContent,
        see: document.querySelector(".see").textContent,
        more: [...document.querySelectorAll(".more")].map((e) => e.textContent),
        next: document.querySelector('[data-testid="next"]').textContent,
        retry: /再做一遍|重试/.test(document.body.textContent),
        sizes: { demoted: px(".math.demoted"), eq: px(".panel .eq"), hook: px(".hook") },
        thinking: Boolean(document.querySelector('[data-slot="mascot.thinking"] img')),
      };
    });
    await page.keyboard.press("5");
    const ignored = await page.evaluate(() => !document.querySelector('[data-testid="answer"]'));
    check(w.still && w.keys === 0 && !w.nav && !w.retry, "focus " + JSON.stringify(w));
    check(w.eq === item.relation, `eq ${w.eq}`);
    check(w.sizes.eq > w.sizes.demoted && w.sizes.eq > w.sizes.hook, `hierarchy ${JSON.stringify(w.sizes)}`);
    check(w.hint.replace(/[\ue000-\uf8ff]/g, "").trim() === "小提示" && /看这里/.test(w.see) && w.more.join("/") === "看看这个规律/看看这几步" && w.next === "下一题", "copy " + JSON.stringify(w));
    check(ignored, "typing ignored");
    await shot("04-wrong");
    await page.click('[data-action="expand-pattern"]');
    await page.waitForSelector('[data-testid="pattern"]');
    await shot("04b-wrong-pattern");
    const l = await learner();
    check(l.relations[item.id].attempts.at(-1).correct === false, "wrong recorded");
    check(Object.keys(l.activeSession.reappearPlan || {}).includes(item.id), "reappearance planned");
    await page.click('[data-testid="next"]');
    await page.waitForFunction(() => document.querySelector('[data-testid="set-count"]')?.textContent === "第 3 题 · 共 10 题");
    const next = await currentItem();
    check(next.id !== item.id, "different item");
    return `${item.id} 「${wrongFor(item)}」 → stays >1.3s; relation ${w.sizes.eq}px > question ${w.sizes.demoted}px > hook ${w.sizes.hook}px; 小提示 / 看这里 / 看看这个规律 / 看看这几步; thinking mascot; no keypad, nav or retry; typing ignored; reappearPlan has it; 下一题 → 第 3 题 · 共 10 题 (${next.id})`;
  });

  await step(`${vp} 5 Pause → 继续做 / 先停 → end → Home`, async () => {
    await press("1");
    await page.click('[data-action="pause"]');
    await page.waitForSelector('[data-testid="pause"]');
    const p = await page.evaluate(() => ({ ask: document.querySelector(".ask").textContent, stay: document.querySelector(".stay").textContent, nav: [...document.querySelectorAll(".tabbar")].some((e) => e.checkVisibility()) }));
    check(p.ask === "先停在这里？" && p.stay === "已经做的会留下。" && !p.nav, JSON.stringify(p));
    await page.waitForTimeout(300);
    await shot("05-pause");
    await page.click('[data-action="resume-train"]');
    const kept = await page.getAttribute('[data-testid="answer"]', "data-answer");
    check(kept === "1", `answer kept ${kept}`);
    await page.click('[data-action="pause"]');
    await page.click('[data-action="stop-session"]');
    await page.waitForSelector('[data-testid="end"]');
    const e = await page.evaluate(() => ({
      title: document.querySelector(".end-title").textContent,
      body: document.querySelector(".end-card .body").textContent,
      nav: [...document.querySelectorAll(".tabbar")].some((e) => e.checkVisibility()),
    }));
    check(e.title === "先停在这里了" && e.body === "对了 1 题，做了 2 题。" && e.nav, JSON.stringify(e));
    await page.waitForTimeout(300);
    await shot("06-end-stopped");
    const l = await learner();
    check(l.activeSession === null && l.lastResult.earlyStop === true, "early stop stored");
    await page.click('[data-action="home"]');
    await page.waitForSelector('[data-testid="home"]');
    await page.reload();
    await page.waitForSelector('[data-testid="home"]');
    const title = await page.textContent(".bubble-title");
    check(title === "和数字做朋友", `home after stop: ${title}`);
    return `「${p.ask}」 → 继续做 keeps answer 「${kept}」 → 先停 → 「${e.title}」 「${e.body}」 (nav back) → 先到这里 → Home; reload keeps the record (earlyStop)`;
  });

  // Visible text of a student screen with a slash fraction in it (「1/2」, 「?/?」).
  // The set position 「第 k 题 · 共 N 题」 has no slash, so nothing on screen is skipped.
  const slashScan = () =>
    page.evaluate(() => {
      const hits = [];
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      for (let n = walker.nextNode(); n; n = walker.nextNode()) {
        const el = n.parentElement;
        if (!el || !el.checkVisibility()) continue;
        if (/[\d?]\s*\/\s*[\d?]/.test(n.textContent)) hits.push(n.textContent.trim());
      }
      return { hits, slashKey: Boolean(document.querySelector('.key[data-key="/"]')) };
    });
  const fieldsState = () =>
    page.evaluate(() => {
      const ff = document.querySelector('[data-testid="fraction-fields"]');
      if (!ff) return null;
      const n = ff.querySelector('[data-field="numerator"]');
      const d = ff.querySelector('[data-field="denominator"]');
      return { focus: ff.getAttribute("data-focus"), n: n.getAttribute("data-value"), d: d.getAttribute("data-value"), bar: Boolean(ff.querySelector(".ff-bar")), q: document.querySelector('[data-testid="train"] .question').textContent.trim() };
    });
  const tapField = (which) => page.click(`[data-testid="fraction-fields"] [data-field="${which}"]`);
  const nudgeText = () => page.evaluate(() => document.querySelector('[data-testid="nudge"] .math')?.getAttribute("aria-label") || document.querySelector('[data-testid="nudge"]').textContent);

  await step(`${vp} 6 Fraction fields · not-an-attempt · needs_simplification · 1/2 · repeating · decimal`, async () => {
    await freshHome(JSON.stringify(seededRoot(["ifraction-1-2", "fraction-1-3", "fraction-1-2", "fraction-1-7"])));
    const h = await page.evaluate(() => ({ t: document.querySelector(".bubble-title").textContent, cta: document.querySelector(".home-cta .entry-name").textContent, sec: document.querySelector(".home-secondary")?.textContent }));
    check(h.t === "还有一小段" && h.cta === "继续刚才的练习" && h.sec === "重新开始一小段", JSON.stringify(h));
    await page.click('[data-action="resume"]');
    await page.waitForSelector('[data-testid="train"]');
    check((await currentItem()).id === "ifraction-1-2", "resumed at item 2");
    let f = await fieldsState();
    check(f && f.focus === "numerator" && f.n === "" && f.d === "" && f.bar && f.q === "0.5 =", `fields ${JSON.stringify(f)}`);
    let scan = await slashScan();
    check(!scan.slashKey && scan.hits.length === 0, `slash ${JSON.stringify(scan)}`);
    await shot("06-fraction-fields-empty");
    // 4: both / numerator empty; 5: denominator empty; 6: denominator 0 — none is an attempt.
    await submit();
    check((await nudgeText()) === "先写一个分数", "empty → 先写一个分数");
    await press("1");
    await submit();
    check((await nudgeText()) === "先写一个分数", "denominator empty → 先写一个分数");
    await tapField("denominator");
    await press("0");
    f = await fieldsState();
    check(f.focus === "denominator" && f.n === "1" && f.d === "0", JSON.stringify(f));
    await submit();
    check((await nudgeText()) === "先写一个分数", "denominator 0 → 先写一个分数");
    await shot("06b-denominator-zero");
    await page.click('.key[data-key="del"]');
    await page.click('.key[data-key="del"]');
    f = await fieldsState();
    check(f.focus === "denominator" && f.d === "" && f.n === "1", `backspace stays in the empty box ${JSON.stringify(f)}`);
    await press("2");
    await tapField("numerator");
    await page.click('.key[data-key="del"]');
    await submit();
    check((await nudgeText()) === "先写一个分数", "numerator empty → 先写一个分数");
    check((await learner()).relations["ifraction-1-2"] === undefined, "no attempt recorded for empty / zero");
    // 2: 2/4 → needs_simplification, stays editable, nothing recorded (leading zeros: 02/04).
    await press("02");
    await tapField("denominator");
    await page.click('.key[data-key="del"]');
    await press("04");
    f = await fieldsState();
    check(f.n === "2" && f.d === "4", `typed 02 over 04 shows 2 over 4 ${JSON.stringify(f)}`);
    await shot("06c-typed-02-04-shows-2-4");
    await submit();
    const nudge = await page.evaluate(() => ({ label: document.querySelector('[data-testid="nudge"] .math').getAttribute("aria-label"), fracs: document.querySelectorAll('[data-testid="nudge"] .frac').length }));
    check(nudge.label === "2/4 和 1/2 一样大，再约到最简：1/2。" && nudge.fracs === 3, JSON.stringify(nudge));
    check((await learner()).relations["ifraction-1-2"] === undefined, "needs_simplification recorded nothing");
    f = await fieldsState();
    check(f.n === "2" && f.d === "4", `no auto-simplify ${JSON.stringify(f)}`);
    scan = await slashScan();
    check(scan.hits.length === 0, `slash ${JSON.stringify(scan)}`);
    await shot("07-needs-simplification");
    // 1: 1/2 → correct.
    await page.click('.key[data-key="del"]');
    await page.click('.key[data-key="del"]');
    await press("2");
    await tapField("numerator");
    await page.click('.key[data-key="del"]');
    await page.click('.key[data-key="del"]');
    await press("1");
    await submit();
    await page.waitForSelector('[data-testid="correct"]');
    scan = await slashScan();
    check(scan.hits.length === 0, `correct screen slash ${JSON.stringify(scan)}`);
    await page.waitForSelector('[data-testid="train"]');
    const rep = await currentItem();
    check(rep.id === "fraction-1-3", rep.id);
    const empty = await page.evaluate(() => ({ int: document.querySelector(".rep-int")?.textContent, slot: Boolean(document.querySelector(".rep-slot")), extra: Boolean(document.querySelector('.key[data-key="."], .key[data-key="/"]')) }));
    check(empty.int === "0." && empty.slot && !empty.extra, JSON.stringify(empty));
    await press("3");
    const dotted = await page.evaluate(() => {
      const rd = document.querySelector('[data-testid="answer"] .rd');
      return rd && getComputedStyle(rd, "::before").content;
    });
    check(dotted === '"•"', `dot ${dotted}`);
    await shot("08-repeating");
    await submit();
    await page.waitForSelector('[data-testid="correct"]');
    const repRel = await page.evaluate(() => ({ label: document.querySelector(".correct-eq .rep").getAttribute("aria-label"), brackets: /\(|\)/.test(document.querySelector(".correct-eq").textContent) }));
    check(repRel.label === "0.3，3 循环" && !repRel.brackets, JSON.stringify(repRel));
    await shot("09-repeating-correct");
    await page.waitForSelector('[data-testid="train"]');
    check((await currentItem()).id === "fraction-1-2", "decimal item");
    check(await page.$('.key[data-key="."]'), "「.」 key for a decimal answer");
    scan = await slashScan();
    check(scan.hits.length === 0, `fraction → decimal prompt drawn with a bar ${JSON.stringify(scan)}`);
    await press(".5");
    await submit();
    await page.waitForSelector('[data-testid="correct"]');
    const l = await learner();
    check(l.relations["ifraction-1-2"].attempts.length === 1 && l.relations["ifraction-1-2"].attempts[0].correct && l.relations["fraction-1-3"].attempts[0].correct && l.relations["fraction-1-2"].attempts[0].correct, "recorded once each");
    return `0.5 = [分子]/[分母] (focus 分子, no 「/」 key, no slash text) → empty / 1+empty / 1 over 0 / empty over 2 → 「先写一个分数」, 0 records; backspace stays in the empty box; 02 over 04 shows 2 over 4 → 「2/4 和 1/2 一样大，再约到最简：1/2。」 (3 bars, 0 records) → 1 over 2 ✓ (1 record); 0.( slot ) → 3 ✓; 「.5」 ✓`;
  });

  await step(`${vp} 6b Fraction fields: 0.5 → 3 over 5 is wrong; the Wrong screen draws bars only`, async () => {
    await freshHome(JSON.stringify(seededRoot(["ifraction-1-2"])));
    await page.click('[data-action="resume"]');
    await page.waitForSelector('[data-testid="train"]');
    await press("3");
    await tapField("denominator");
    await press("5");
    await submit();
    await page.waitForSelector('[data-testid="wrong"]');
    const w = await page.evaluate(() => ({
      blank: Boolean(document.querySelector('[data-testid="wrong"] .frac-blank')),
      eq: document.querySelector('[data-testid="wrong"] .eq')?.getAttribute("aria-label") || document.querySelector('[data-testid="wrong"] .eq')?.textContent,
      bars: document.querySelectorAll('[data-testid="wrong"] .frac').length,
    }));
    const scan = await slashScan();
    check(scan.hits.length === 0, `wrong screen slash ${JSON.stringify(scan)}`);
    const l = await learner();
    check(l.relations["ifraction-1-2"].attempts.length === 1 && l.relations["ifraction-1-2"].attempts[0].correct === false, "recorded once, incorrect");
    await shot("10-fraction-wrong");
    return `3 over 5 → Wrong; prompt with an empty bar ${w.blank}, ${w.bars} drawn fractions, relation 「${w.eq}」; recorded once (incorrect); no slash text`;
  });

  await step(`${vp} 6c Fraction fields: leading zeros 01 over 02 = 1/2${desktop ? " (physical keyboard + Enter)" : ""}`, async () => {
    await freshHome(JSON.stringify(seededRoot(["ifraction-1-2"])));
    await page.click('[data-action="resume"]');
    await page.waitForSelector('[data-testid="train"]');
    if (desktop) {
      await press("01", true);
      await page.keyboard.press("/"); // ignored: there is no 「/」
      await page.keyboard.press(".");
      await tapField("denominator");
      await press("02", true);
    } else {
      await press("01");
      await tapField("denominator");
      await press("02");
    }
    const f = await fieldsState();
    check(f.n === "1" && f.d === "2", `typed 01 over 02 shows 1 over 2 ${JSON.stringify(f)}`);
    await shot("11-leading-zeros");
    await submit(desktop);
    await page.waitForSelector('[data-testid="correct"]');
    const l = await learner();
    check(l.relations["ifraction-1-2"].attempts.length === 1 && l.relations["ifraction-1-2"].attempts[0].correct === true, "01/02 recorded once, correct");
    return `01 over 02 → correct (integer value)${desktop ? "; 「/」 and 「.」 keys ignored; Enter submits" : ""}`;
  });

  await step(`${vp} 7 Full set of 10 → end → Home done → 看看这次`, async () => {
    await freshHome(null);
    await page.click('[data-action="start-daily"]');
    for (let i = 0; i < 10; i += 1) {
      await page.waitForSelector('[data-testid="train"]');
      const item = await currentItem();
      await press(blockOf(item));
      await submit();
      await page.waitForSelector('[data-testid="correct"]');
    }
    await page.waitForSelector('[data-testid="end"]', { timeout: 4000 });
    const e = await page.evaluate(() => ({ t: document.querySelector(".end-title").textContent, b: document.querySelector(".end-card .body").textContent }));
    check(e.t === "先到这里" && e.b === "对了 10 题，做了 10 题。", JSON.stringify(e));
    await page.waitForTimeout(300);
    await shot("10-end-finished");
    await page.click('[data-action="home"]');
    await page.waitForSelector('[data-testid="home"]');
    const h = await page.evaluate(() => ({ t: document.querySelector(".bubble-title").textContent, cta: document.querySelector(".home-cta .entry-name").textContent, sec: document.querySelector(".home-secondary")?.textContent }));
    check(h.t === "今天这段练完了" && h.cta === "看看这次" && h.sec === "再练一小段", JSON.stringify(h));
    await shot("11-home-done");
    await page.click('[data-action="see-last"]');
    await page.waitForSelector('[data-testid="end"]');
    const again = await page.textContent(".end-card .body");
    check(again === "对了 10 题，做了 10 题。", again);
    return `10 answers → 「${e.t}」 「${e.b}」 → Home 「${h.t}」 / 「${h.cta}」 / 「${h.sec}」 → 看看这次 → same summary`;
  });

  await step(`${vp} 8 Write protection (bad JSON, future version)`, async () => {
    const out = [];
    for (const raw of ["{not-json", JSON.stringify({ version: 4, active_learner_id: "f", learners: { f: {} } })]) {
      await freshHome(raw);
      await page.click('[data-action="start-daily"]');
      await page.waitForSelector('[data-testid="train"]');
      const item = await currentItem();
      await press(blockOf(item));
      await submit();
      await page.waitForSelector('[data-testid="correct"]');
      await page.waitForSelector('[data-testid="train"]');
      await page.click('[data-action="pause"]');
      await page.click('[data-action="stop-session"]');
      await page.waitForSelector('[data-testid="end"]');
      const body = await page.textContent(".end-card .body");
      check(body === "对了 1 题，做了 1 题。", `memory-only progress ${body}`);
      check((await stored()) === raw, "stored text untouched");
      out.push(raw.slice(0, 12));
    }
    return `${out.join(" | ")}: practice works in memory (end page 「对了 1 题，做了 1 题。」), stored text byte-for-byte unchanged`;
  });

  await step(`${vp} 9 Reduced motion + no external requests + no console errors`, async () => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await freshHome(null);
    const anim = await page.evaluate(() => getComputedStyle(document.querySelector(".screen")).animationName);
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.reload();
    await page.waitForSelector('[data-testid="home"]');
    const animOn = await page.evaluate(() => getComputedStyle(document.querySelector(".screen")).animationName);
    check(anim === "none" && animOn !== "none", `reduce ${anim} / normal ${animOn}`);
    check(foreign.length === 0, `external requests ${foreign}`);
    check(errors.length === 0, `console ${errors}`);
    return `reduce → animation 「${anim}」, normal → 「${animOn}」; 0 external requests (no font host); 0 console errors`;
  });
  await ctx.close();
}
await browser.close();
console.log(results.join("\n"));
console.log(`\n${results.length - failed}/${results.length} passed`);
process.exit(failed ? 1 : 0);
