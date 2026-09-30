/**
 * v0.3 visual system: theme layer contract (docs/ui/05_visual_system_v03.md).
 * Structure and token checks only — no pixels, no learning behaviour.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { mathLabTheme } from "../h5/themes/math-lab/theme.js";
import { DEFAULT_THEME_ID, activeTheme, applyTheme, asset, assetUrl, loadTheme, manifestUrl, themeIds, useManifest } from "../h5/theme.js";

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
  "domain.squares",
  "domain.products",
  "domain.fractions",
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
      assert.match(asset(`mascot.${pose}`), /^<picture><source type="image\/webp" srcset="[^"]+\.webp"><img [^>]*alt=""[^>]*><\/picture>$/);
    }
    for (const [domain, slot] of Object.entries(mathLabTheme.icons)) {
      assert.match(asset(slot), /^<img [^>]*alt=""/, `icon for ${domain}`);
    }
    assert.equal(asset("mascot.not-in-this-theme"), "", "missing optional asset falls back to nothing");
    // A manifest for another theme is refused, so no pictures rather than wrong ones.
    assert.equal(useManifest({ id: "space", assets: {} }), false);
    assert.equal(asset("mascot.welcome"), "");
  } finally {
    useManifest(null);
  }
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

test("training shows a calm 「k / N」 position and a still bar, never a timer", () => {
  const train = section("renderTrain");
  assert.match(train, /id="set-count">\$\{position\} \/ \$\{total\}</);
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
  for (const name of ["知识地图", "立方", "补数", "倍数与因数", "规律探索", "概念", "例题", "动画", "已掌握", "全部", "昵称", "清空练习记录", "关于数感训练场"]) {
    assert.match(appJs, new RegExp(name), `placeholder ${name}`);
  }
  // No 动画 preference state and no 再做一遍 (07 §占位, 05 §11/§17).
  assert.doesNotMatch(appJs, /prefs\.(animation|motion)|再做一遍/);
  assert.match(indexHtml, /id="toast" role="status"/);
});

test("stable semantic hooks and interaction guards survive the restyle", () => {
  for (const id of ["home", "explore", "me", "train", "correct", "wrong", "pause", "end", "progress", "mistakes", "print-select", "a4", "a4-sheet", "a4-answers", "recent-outcomes", "print-count", "keys", "answer", "nudge", "set-count"]) {
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
