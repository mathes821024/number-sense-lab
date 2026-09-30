/**
 * v0.3 visual system: theme layer contract (docs/ui/05_visual_system_v03.md).
 * Structure and token checks only — no pixels, no learning behaviour.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { mathLabTheme } from "../h5/themes/math-lab/theme.js";
import { DEFAULT_THEME_ID, activeTheme, applyTheme, asset, themeIds } from "../h5/theme.js";

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

const REQUIRED_ASSETS = [
  "logo",
  "mascot.default",
  "mascot.correct",
  "mascot.thinking",
  "background.home",
  "domain.squares",
  "domain.products",
  "domain.fractions",
];

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
  for (const key of ["id", "colors", "typography", "radius", "shadows", "background", "mascot", "icons", "motion", "sounds", "assets"]) {
    assert.ok(key in mathLabTheme, `theme.${key}`);
  }
  for (const name of REQUIRED_ASSETS) {
    assert.match(asset(name), /^<svg[\s\S]*<\/svg>$/, `asset ${name}`);
    const body = asset(name).replaceAll(' xmlns="http://www.w3.org/2000/svg"', "");
    assert.doesNotMatch(body, /<image|href=|url\(|https?:/, `asset ${name} is self-contained`);
  }
  for (const [domain, slot] of Object.entries(mathLabTheme.icons)) {
    assert.ok(asset(slot), `icon for ${domain}`);
  }
  assert.equal(asset("mascot.not-in-this-theme"), "", "missing optional asset falls back to nothing");
});

test("components ask for assets by semantic name, not by a theme file path", () => {
  assert.doesNotMatch(appJs, /themes\/math-lab|\.svg|\.png/);
  assert.match(appJs, /asset\("background\.home"\)/);
  assert.match(appJs, /mascot\("thinking"/);
});

test("training (FOCUS) markup has no mascot, decoration or theme art", () => {
  const train = appJs.slice(appJs.indexOf("function renderTrain"), appJs.indexOf("function renderCorrect"));
  assert.ok(train.length > 100);
  assert.doesNotMatch(train, /mascot|asset\(|home-decor|bottom-nav/);
});

test("stable semantic hooks and interaction guards survive the restyle", () => {
  for (const id of ["home", "train", "correct", "wrong", "pause", "end", "progress", "mistakes", "print-select", "a4", "a4-sheet", "a4-answers", "recent-outcomes", "print-count", "keys", "answer", "nudge"]) {
    assert.match(appJs, new RegExp(`id="${id}"`), `#${id}`);
  }
  assert.match(styles, /#train, \.keys, \.key, \.cta \{ touch-action: manipulation; \}/);
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(styles, /:focus-visible/);
  assert.doesNotMatch(indexHtml, /user-scalable|maximum-scale/);
  assert.doesNotMatch(appJs, /bottom-nav|tabbar/);
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
});
