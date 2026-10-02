/**
 * v0.3 visual system: theme layer contract (docs/ui/05_visual_system_v03.md).
 * Structure and token checks only — no pixels, no learning behaviour.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { mathLabTheme } from "../h5/themes/math-lab/theme.js";
import { DEFAULT_THEME_ID, MASCOT_SIZES, activeTheme, applyTheme, asset, assetUrl, loadTheme, manifestUrl, preloadAssets, themeIds, useManifest } from "../h5/theme.js";

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");
const themeCss = read("h5/themes/math-lab/theme.css");
const styles = read("h5/styles.css");
const indexHtml = read("h5/index.html");
const appJs = read("h5/app.js");

const REQUIRED_TOKENS = [
  "--color-brand-primary",
  "--color-brand-secondary",
  "--surface-page",
  "--surface-card",
  "--text-primary",
  "--text-secondary",
  "--feedback-correct",
  "--feedback-wrong",
  "--feedback-hint",
  "--radius-card",
  "--radius-button",
  "--shadow-card",
  "--shadow-floating",
  "--motion-correct",
  "--motion-wrong",
  "--motion-transition",
];

// Locked slots (docs/ui/07_visual_asset_decomposition.md §已锁定的槽位).
const REQUIRED_ASSETS = [
  "mascot.welcome",
  "mascot.correct",
  "mascot.thinking",
  "brand.appIcon",
  "brand.avatar",
  "logo.mark",
  // Domain slots are `domain.<domain_id>` (07). Only these two have a file in the pack;
  // domain.squares has none (its v0.3 picture is a cube: 05 §5) and, like the five
  // v0.4 domains, gets its interface glyph (07: 缺文件时可用形状顶上).
  "domain.products",
  "domain.fraction_decimal",
  "decor.cloud1",
  "decor.cloud2",
  "decor.hill",
  "decor.leaf1",
  "decor.leaf2",
  "decor.sprout",
  "decor.sparkle",
  "decor.question",
];

const ASSETS_DIR = new URL("../assets/", import.meta.url);
const manifestJson = JSON.parse(read("assets/themes/math-lab/manifest.json"));

function definedTokens(css) {
  return new Set([...css.matchAll(/(--[a-z0-9-]+)\s*:/g)].map((m) => m[1]));
}

test("math-lab theme defines every required semantic token", () => {
  const defined = definedTokens(themeCss);
  for (const token of REQUIRED_TOKENS) assert.ok(defined.has(token), `missing ${token}`);
  assert.match(themeCss, /\[data-theme="math-lab"\]/);
});

test("every token the components use is defined by the theme or the shared scale", () => {
  const defined = new Set([...definedTokens(themeCss), ...definedTokens(styles)]);
  const used = new Set([...styles.matchAll(/var\((--[a-z0-9-]+)/g)].map((m) => m[1]));
  for (const token of used) assert.ok(defined.has(token), `styles.css uses undefined ${token}`);
});

test("components write no raw colours; only the paper constants are literal", () => {
  const paper = /\/\* paper:start[\s\S]*?\/\* paper:end \*\//;
  assert.match(styles, paper, "paper block present");
  const rest = styles.replace(paper, "").replace(/\/\*[\s\S]*?\*\//g, "");
  const literals = rest.match(/#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\(|(?<![-\w])(white|black)(?![-\w])/g) || [];
  assert.deepEqual(literals, []);
  assert.doesNotMatch(appJs, /#[0-9a-fA-F]{6}\b|style="/, "app.js has no inline colours or styles");
});

test("math-lab is the default and only runtime theme", () => {
  assert.equal(DEFAULT_THEME_ID, "math-lab");
  assert.equal(activeTheme().id, "math-lab");
  assert.equal(activeTheme(), mathLabTheme);
  assert.deepEqual(themeIds(), ["math-lab"]);
  assert.equal(mathLabTheme.name, "澄蓝数学实验室");
  assert.match(indexHtml, /<html[^>]*data-theme="math-lab"/);
  assert.match(indexHtml, /href="\.\/themes\/math-lab\/theme\.css"/);
  assert.ok(
    indexHtml.indexOf("themes/math-lab/theme.css") < indexHtml.indexOf("styles.css"),
    "theme tokens load before components",
  );
  const set = [];
  applyTheme({ documentElement: { setAttribute: (k, v) => set.push([k, v]) } });
  assert.deepEqual(set, [["data-theme", "math-lab"]]);
  assert.deepEqual(readdirSync(new URL("../h5/themes/", import.meta.url)), ["math-lab"]);
});

test("no theme selector, theme settings or theme switching in the shell", () => {
  for (const src of [appJs, indexHtml]) {
    assert.doesNotMatch(src, /<select|theme-picker|data-action="[^"]*theme|setTheme|switchTheme|皮肤|换肤/);
  }
});

test("theme object keeps the documented structure and asset slots", () => {
  for (const key of ["id", "manifest", "colors", "typography", "radius", "shadows", "background", "mascot", "brand", "icons", "marks", "motion", "sounds"]) {
    assert.ok(key in mathLabTheme, `theme.${key}`);
  }
  const slots = [
    ...Object.values(mathLabTheme.mascot),
    ...Object.values(mathLabTheme.brand),
    ...Object.values(mathLabTheme.icons),
    ...Object.values(mathLabTheme.background),
  ];
  for (const name of REQUIRED_ASSETS) assert.ok(slots.includes(name), `theme names slot ${name}`);
  // The theme file names slots only; images live in the manifest (07).
  const themeSrc = read("h5/themes/math-lab/theme.js");
  assert.doesNotMatch(themeSrc, /\.(png|webp|svg)["']/, "no image file paths in theme.js");
  // Tick and ring are drawn by the interface, not pictures (07 §什么用图).
  assert.match(asset("mark.correct"), /^<svg[\s\S]*<\/svg>$/);
  assert.match(asset("mark.wrong"), /^<svg[\s\S]*<\/svg>$/);
});

test("every locked slot resolves through the manifest to a project-local file", () => {
  assert.equal(manifestJson.id, "math-lab");
  assert.equal(new URL(manifestUrl(ASSETS_DIR.href)).pathname.endsWith("/assets/themes/math-lab/manifest.json"), true);
  assert.equal(useManifest(manifestJson, ASSETS_DIR.href), true);
  try {
    for (const name of REQUIRED_ASSETS) {
      const url = assetUrl(name);
      assert.ok(url, `slot ${name} resolves`);
      assert.ok(url.startsWith(ASSETS_DIR.href), `slot ${name} stays under assets/`);
      assert.ok(existsSync(new URL(url)), `file for ${name} exists: ${url}`);
      assert.doesNotMatch(asset(name), /https?:|data:/, `asset ${name} stays project-local`);
    }
    for (const pose of ["welcome", "correct", "thinking"]) {
      assert.ok(existsSync(new URL(assetUrl(`mascot.${pose}Webp`))), `webp twin for ${pose}`);
      const html = asset(`mascot.${pose}`);
      assert.match(html, /^<picture><source type="image\/webp" srcset="[^"]+-512\.webp 512w, [^"]+\.webp 1024w" sizes="[^"]+"><img [^>]*alt=""[^>]*><\/picture>$/);
      // Pages load the 512px copy; the 1024px master is only a dense-screen candidate.
      assert.match(html, new RegExp(`<img src="[^"]+mascot-${pose}-512\\.png" srcset="[^"]+-512\\.png 512w, [^"]+mascot-${pose}\\.png 1024w"`));
    }
    for (const [domain, slot] of Object.entries(mathLabTheme.icons)) {
      assert.equal(slot, `domain.${domain}`, `${domain} slot name`);
      if (["products", "fraction_decimal"].includes(domain)) assert.match(asset(slot), /^<img [^>]*alt=""/, `icon for ${domain}`);
      else assert.equal(asset(slot), "", `${domain}: no file, the glyph stands in`);
    }
    assert.equal(Object.keys(mathLabTheme.icons).length, 8);
    assert.equal(asset("mascot.not-in-this-theme"), "", "missing optional asset falls back to nothing");
    // A manifest for another theme is refused, so no pictures rather than wrong ones.
    assert.equal(useManifest({ id: "space", assets: {} }), false);
    assert.equal(asset("mascot.welcome"), "");
  } finally {
    useManifest(null);
  }
});

/** Pixel size from a PNG (IHDR) or WebP (VP8X / VP8L / VP8) header. */
function imageSize(url) {
  const b = readFileSync(url);
  if (b.readUInt32BE(0) === 0x89504e47) return [b.readUInt32BE(16), b.readUInt32BE(20)];
  const kind = b.toString("ascii", 12, 16);
  if (kind === "VP8X") return [1 + b.readUIntLE(24, 3), 1 + b.readUIntLE(27, 3)];
  if (kind === "VP8L") { const n = b.readUInt32LE(21); return [(n & 0x3fff) + 1, ((n >> 14) & 0x3fff) + 1]; }
  return [b.readUInt16LE(26) & 0x3fff, b.readUInt16LE(28) & 0x3fff];
}

test("display-size copies are registered, small and derived from untouched masters", () => {
  assert.equal(useManifest(manifestJson, ASSETS_DIR.href), true);
  try {
    for (const pose of ["welcome", "correct", "thinking"]) {
      const master = new URL(assetUrl(`mascot.${pose}`));
      assert.deepEqual(imageSize(master), [1024, 1024], `${pose} PNG master stays 1024px`);
      assert.deepEqual(imageSize(new URL(assetUrl(`mascot.${pose}Webp`))), [1024, 1024], `${pose} WebP master stays 1024px`);
      for (const key of [`mascot.${pose}Display`, `mascot.${pose}DisplayWebp`]) {
        const url = new URL(assetUrl(key));
        assert.ok(existsSync(url), key);
        assert.deepEqual(imageSize(url), [512, 512], `${key} is 512px`);
      }
      const webp = readFileSync(new URL(assetUrl(`mascot.${pose}DisplayWebp`))).length;
      assert.ok(webp < 150 * 1024, `${pose} display WebP ${webp} bytes`);
    }
    assert.deepEqual(imageSize(new URL(assetUrl("brand.avatarDisplay"))), [192, 192]);
    assert.match(asset("brand.avatar"), /^<picture><source type="image\/webp" srcset="[^"]+brand-avatar-192\.webp"><img src="[^"]+brand-avatar-192\.png"/);
    assert.deepEqual(imageSize(new URL(assetUrl("brand.appIconSmall"))), [32, 32]);
    assert.deepEqual(imageSize(new URL(assetUrl("brand.touchIcon"))), [180, 180]);
    assert.match(indexHtml, /rel="icon"[^>]+href="\.\.\/assets\/brand\/app-icon-32\.png"/);
    assert.match(indexHtml, /rel="apple-touch-icon"[^>]+href="\.\.\/assets\/brand\/app-icon-180\.png"/);
    // The sizes hint covers the largest mascot on any page (the home hero).
    assert.match(styles, /\.mascot-hero \{ width: clamp\(150px, 44vw, 196px\);/);
    assert.equal(MASCOT_SIZES, "(min-width: 640px) 196px, 44vw");
  } finally {
    useManifest(null);
  }
});

test("preload: welcome first, feedback pictures once training starts, each once", () => {
  const head = [];
  const doc = { head: { appendChild: (l) => head.push(l) }, createElement: () => ({ attrs: {}, setAttribute(k, v) { this.attrs[k] = v; } }) };
  assert.equal(useManifest(manifestJson, ASSETS_DIR.href), true);
  try {
    preloadAssets(["mascot.welcome"], { doc, priority: "high" });
    preloadAssets(["mascot.welcome"], { doc });
    assert.equal(head.length, 1, "no duplicate preload");
    assert.equal(head[0].rel, "preload");
    assert.equal(head[0].as, "image");
    assert.equal(head[0].type, "image/webp");
    assert.match(head[0].attrs.imagesrcset, /mascot-welcome-512\.webp 512w, .*mascot-welcome\.webp 1024w/);
    assert.equal(head[0].attrs.imagesizes, MASCOT_SIZES);
    assert.equal(head[0].attrs.fetchpriority, "high");
    preloadAssets(["mascot.correct", "mascot.thinking"], { doc });
    assert.equal(head.length, 3);
  } finally {
    useManifest(null);
  }
  assert.match(appJs, /preloadAssets\(\[activeTheme\(\)\.mascot\.welcome\], \{ priority: "high" \}\)/);
  assert.match(appJs, /if \(screenName === "train"\) preloadAssets\(\[activeTheme\(\)\.mascot\.correct, activeTheme\(\)\.mascot\.thinking\]\)/);
  assert.match(indexHtml, /rel="preload" href="\.\.\/assets\/themes\/math-lab\/manifest\.json" as="fetch"/);
});

test("final polish: home label, correct pause without a button, muted future tabs", () => {
  const home = section("renderHome");
  assert.match(home, /let ctaLabel = "开始今天的练习";/);
  assert.match(home, /let ctaSub = "大约 5～10 分钟";/);
  assert.match(home, /ctaLabel = "继续刚才的练习";/);
  assert.match(home, /ctaLabel = "看看这次";/);
  assert.match(section("renderNav"), /tab\("explore", "explore", "[a-z-]+", "练习"\)/);
  // Correct feedback auto-advances after ~700ms; nothing to tap (05 §17 screen 5).
  const correct = section("renderCorrect");
  assert.doesNotMatch(correct, /<button|data-action=|继续/);
  assert.match(correct, /class="card feedback-card is-correct" tabindex="-1"/);
  assert.match(appJs, /correctTimer = window\.setTimeout\(\(\) => advanceAfterFeedback\(\), 700\);/);
  // Mistake Book: only 当前错题 is real; the other two look and say 敬请期待.
  const tabs = section("renderMistakes");
  for (const name of ["已掌握", "全部"]) {
    assert.match(tabs, new RegExp(`class="seg seg-soon" type="button" aria-disabled="true" data-action="soon" data-soon="${name}">${name}<span class="seg-note">敬请期待</span>`));
  }
  assert.match(styles, /\.seg\.seg-soon \{[^}]*color: var\(--text-secondary\);/);
});

test("a failed manifest load never throws and leaves words-only pages", async () => {
  const failing = await loadTheme({ fetchImpl: async () => ({ ok: false, status: 404 }), base: ASSETS_DIR.href });
  assert.equal(failing, null);
  assert.equal(asset("mascot.correct"), "");
  const thrown = await loadTheme({ fetchImpl: async () => { throw new Error("offline"); }, base: ASSETS_DIR.href });
  assert.equal(thrown, null);
  const ok = await loadTheme({ fetchImpl: async () => ({ ok: true, json: async () => manifestJson }), base: ASSETS_DIR.href });
  assert.equal(ok.id, "math-lab");
  assert.ok(assetUrl("decor.sparkle").endsWith("/assets/themes/math-lab/decor/sparkle.svg"));
  useManifest(null);
});

test("components ask for assets by semantic name, not by a theme file path", () => {
  assert.doesNotMatch(appJs, /themes\/math-lab|assets\/|\.svg|\.png|\.webp/);
  assert.match(appJs, /mascot\("thinking"/);
  assert.match(appJs, /mascot\("correct"/);
  assert.match(appJs, /mascot\("welcome"/);
  assert.match(appJs, /activeTheme\(\)\.background\.sparkle/);
});

/** Source of one top-level function in app.js (up to its closing brace). */
function section(name) {
  const start = appJs.indexOf(`function ${name}`);
  assert.ok(start >= 0, `function ${name}`);
  return appJs.slice(start, appJs.indexOf("\n}\n", start) + 2);
}

test("training (FOCUS) markup has no mascot, decoration or theme art", () => {
  const train = section("renderTrain");
  assert.ok(train.length > 100);
  assert.doesNotMatch(train, /mascot|asset\(|decor|tabbar|renderNav/);
  const pause = section("renderPause");
  assert.doesNotMatch(pause, /mascot|asset\(|decor/);
});

test("training shows a calm 「第 k 题 · 共 N 题」 position and a still bar, never a timer", () => {
  const train = section("renderTrain");
  assert.match(train, /id="set-count">\$\{setPositionLabel\(position, total\)\}</);
  assert.match(train, /<progress class="set-bar"/);
  const code = train.replace(/\/\/.*$/gm, "");
  assert.doesNotMatch(code, /%|倒计时|countdown|setTimeout|setInterval|秒/);
  const bar = styles.match(/\n\.set-bar \{[\s\S]*?\n\}/)[0];
  assert.match(bar, /transition: none/);
  assert.doesNotMatch(styles, /set-bar[^{]*\{[^}]*animation/);
});

test("bottom navigation: four entries on ordinary pages, hidden while answering", () => {
  // 02_ux_spec §4, 03_ui_spec 「普通页面的四个底部入口」, 05 §6 Bottom Navigation.
  assert.match(appJs, /const FOCUS_SCREENS = new Set\(\["train", "correct", "wrong", "pause"\]\)/);
  assert.match(appJs, /const withNav = !FOCUS_SCREENS\.has\(screenName\)/);
  const nav = section("renderNav");
  for (const [action, label] of [["home", "首页"], ["explore", "练习"], ["mistakes", "错题本"], ["me", "我的"]]) {
    assert.match(nav, new RegExp(`tab\\("[a-z]+", "${action}", "[a-z-]+", "${label}"\\)`), `${label} tab`);
  }
  assert.match(nav, /aria-current="page"/);
  for (const name of ["renderTrain", "renderCorrect", "renderWrong", "renderPause"]) {
    assert.doesNotMatch(section(name), /tabbar|renderNav/, `${name} renders no nav`);
  }
  const tab = styles.match(/\n\.tab \{[\s\S]*?\n\}/)[0];
  assert.match(tab, /min-height: (4[4-9]|[5-9]\d)px/, "tabs are at least 44px");
});

test("placeholders only say 敬请期待 and change nothing", () => {
  const soon = appJs.slice(appJs.indexOf('if (action === "soon")'));
  assert.match(soon.slice(0, 200), /showSoon\(.*\);\s*return;/);
  const show = section("showSoon").replace(/\/\/.*$/gm, "");
  assert.match(show, /敬请期待/);
  assert.doesNotMatch(show, /state|save|persist|render\(/);
  for (const name of ["知识地图", "已掌握", "全部", "昵称", "清空练习记录", "关于数感训练场"]) {
    assert.match(appJs, new RegExp(name), `placeholder ${name}`);
  }
  // 05: 概念 / 例题 / 动画 / 规律探索 belong to the future 知识地图 and are not 敬请期待 cards on the practice page.
  const explore = appJs.slice(appJs.indexOf("function renderExplore"), appJs.indexOf("function renderFocusConfirm"));
  assert.doesNotMatch(explore, /规律探索|概念|例题|动画|SOON_DOMAINS|soonButton/);
  assert.doesNotMatch(appJs, /倍数与因数/);
  // No 动画 preference state and no 再做一遍 (07 §占位, 05 §11/§17).
  assert.doesNotMatch(appJs, /prefs\.(animation|motion)|再做一遍/);
  assert.match(indexHtml, /id="toast" role="status"/);
});

test("我的: 昵称 and 清空练习记录 stay 敬请期待; 清空 clears nothing", () => {
  const me = section("renderMe");
  assert.match(me, /\$\{row\("user-circle", "昵称"\)\}/);
  assert.match(me, /\$\{row\("trash", "清空练习记录"\)\}/);
  assert.match(me, /data-action="soon" data-soon="\$\{name\}"/);
  assert.match(me, /data-action="about"/);
  assert.doesNotMatch(me, /row\("info", "关于数感训练场"\)/);
  // No reset / clear path exists anywhere in the shell.
  assert.doesNotMatch(appJs, /localStorage\.(clear|removeItem)|action === "clear|resetState|clearRecords/);
});

test("关于数感训练场 is a static page with the Owner's copy (Owner-approved 2026-09-30)", () => {
  const about = section("renderAbout");
  for (const line of [
    "关于数感训练场",
    "为什么做它",
    "我是一个程序员，也是一个陪孩子学数学的家长。",
    "我一直觉得，很多孩子不是“不会数学”，而是一些最基础、最常用的数字关系还没有真正熟悉。",
    "所以我想做一个简单的小工具：每天花几分钟，把这些关系练到能直接想起来。",
    "不追求刷很多题，不催速度，也不做排名。",
    "我更希望它像一段长期陪伴——",
    "今天多熟一点，明天再熟一点。",
    "陪孩子一起成长，也陪自己重新理解学习。",
    "我们的学习理念",
    "不是替孩子学习，而是帮孩子把“会”练成“熟”。",
    "隐私与数据",
    "练习记录默认只保存在当前设备，不自动上传。",
    "版本信息",
    "项目与许可",
    "项目代码托管于 GitHub。",
    "Number Sense Lab｜数感训练场",
    "一个从真实家庭学习场景里长出来的小项目。",
  ]) {
    assert.ok(about.includes(line), `about copy: ${line}`);
  }
  // Ordinary page under 我的, with a way back; never printed.
  assert.match(about, /<section class="screen no-print" id="about">/);
  assert.match(about, /data-action="me"/);
  assert.match(section("navTab"), /screenName === "me" \|\| screenName === "about"\) return "me"/);
  // Static: no storage, no learner state, no mascot art.
  assert.doesNotMatch(about, /persist|state\.|localStorage|save|mascot\(/);
  const build = section("loadBuildInfo");
  assert.doesNotMatch(build, /persist|state\.|localStorage/);
  assert.match(build, /catch \{\s*buildInfo = \{ missing: true \};/, "offline / local falls back quietly");
  assert.match(appJs, /const APP_VERSION = "v0\.3";/);
  assert.match(appJs, /new URL\("\.\.\/version\.json", import\.meta\.url\)/);
});

test("关于 names no license: no MIT or 开源项目 anywhere in the app copy", () => {
  // The Owner may change the license; the UI must not hard-code it.
  const about = section("renderAbout");
  assert.doesNotMatch(about, /\bMIT\b|开源项目|license|许可证/i);
  for (const src of [appJs, indexHtml, read("h5/theme.js"), read("h5/math-text.js"), read("h5/sound.js"), read("h5/themes/math-lab/theme.js")]) {
    assert.doesNotMatch(src, /\bMIT\b|开源项目/);
  }
  const foot = about.slice(about.indexOf('<footer class="about-foot">'));
  assert.match(foot, /Number Sense Lab｜数感训练场/);
  assert.match(foot, /一个从真实家庭学习场景里长出来的小项目。/);
});

test("关于: sections in order, ending with 项目与许可 as plain text", () => {
  const about = section("renderAbout");
  const heads = [...about.matchAll(/<h2 class="about-h">([^<]+)<\/h2>/g)].map((m) => m[1]);
  assert.deepEqual(heads, ["为什么做它", "我们的学习理念", "隐私与数据", "版本信息", "项目与许可"]);
  assert.match(about, /<h2 class="about-h">项目与许可<\/h2>\s*<p class="about-p">项目代码托管于 GitHub。<\/p>\s*<\/div>/);
});

test("关于 has no links and no URL text (some platforms forbid in-app URLs)", () => {
  const about = section("renderAbout");
  assert.doesNotMatch(about, /<a[\s>]|href=|target=/);
  assert.doesNotMatch(about, /https?:|www\.|github\.com|\.com\b|\.org\b/i);
  assert.doesNotMatch(about, /\bMIT\b/);
});

test("stable semantic hooks and interaction guards survive the restyle", () => {
  for (const id of ["home", "explore", "me", "about", "train", "correct", "wrong", "pause", "end", "progress", "mistakes", "print-select", "a4", "a4-sheet", "a4-answers", "recent-outcomes", "print-count", "keys", "answer", "nudge", "set-count"]) {
    assert.match(appJs, new RegExp(`id="${id}"`), `#${id}`);
  }
  assert.match(styles, /#train, \.keys, \.key, \.cta \{ touch-action: manipulation; \}/);
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(styles, /:focus-visible/);
  assert.doesNotMatch(indexHtml, /user-scalable|maximum-scale/);
});

test("printed paper stays black on white and ignores theme colours", () => {
  const sheet = styles.match(/\n\.sheet \{[\s\S]*?\n\}/)[0];
  assert.match(sheet, /background: var\(--paper-bg\)/);
  assert.match(sheet, /color: var\(--paper-ink\)/);
  assert.match(sheet, /box-shadow: none/);
  assert.match(styles, /--paper-bg: #ffffff;/);
  assert.match(styles, /--paper-ink: #111111;/);
  const print = styles.slice(styles.indexOf("@media print"));
  assert.match(print, /\.no-print \{ display: none !important; \}/);
  // Paper has no mascot or decoration (07): the A4 sheets draw no theme art.
  const a4 = section("renderA4");
  const sheets = a4.slice(a4.indexOf('<div class="sheet"'));
  assert.doesNotMatch(sheets, /mascot|asset\(|decor/);
  assert.match(appJs, /<nav class="tabbar no-print"/, "nav never prints");
});
