// Cross-platform boundary check (docs/architecture/02_cross_platform_frontend_architecture.md):
// no platform API in src/core, src/adapter, or the shared pages, components and theme.
// Platform code lives only under app/platform/. One page set; h5/ stays as the V0.3 reference.
import assert from "node:assert/strict";
import test from "node:test";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function files(dir, exts = [".js", ".jsx", ".css"]) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...files(p, exts));
    else if (exts.some((e) => name.endsWith(e))) out.push(p);
  }
  return out;
}

export const BANNED = [
  [/\bwindow\b(?!\s*:)/, "window"], // `window:` is the app.config key, not the global
  [/\bdocument\b/, "document"],
  [/\blocalStorage\b/, "localStorage"],
  [/\bsessionStorage\b/, "sessionStorage"],
  [/\bindexedDB\b/, "indexedDB"],
  [/\bnavigator\b/, "navigator"],
  [/\blocation\./, "location."],
  [/AudioContext/, "AudioContext"],
  [/\bwx\s*\./, "wx."],
  [/\btt\s*\./, "tt."],
  [/\bmy\s*\./, "my."],
  [/\bTaro\b/, "Taro"],
  [/@tarojs\/taro\b/, "@tarojs/taro"],
  [/(get|set|remove|clear)Storage(Sync)?\b/, "*Storage(Sync)"],
  [/TARO_ENV/, "TARO_ENV"],
  [/\bglobalThis\b/, "globalThis"],
  [/fonts\.googleapis/, "runtime font link"],
  [/\bperformance\s*\./, "performance."],
];

const shared = [
  ...files(join(root, "src/core")),
  ...files(join(root, "src/adapter")),
  ...files(join(root, "app/pages")),
  ...files(join(root, "app/components")),
  ...files(join(root, "app/theme")),
  join(root, "app/app.js"),
  join(root, "app/app.config.js"),
  join(root, "app/app.css"),
];

test("no platform API in src/core, src/adapter or the shared app layer", () => {
  assert.ok(shared.length >= 35, `scanned ${shared.length} files`);
  const leaks = [];
  for (const file of shared) {
    const source = readFileSync(file, "utf8");
    for (const [pattern, label] of BANNED) {
      if (pattern.test(source)) leaks.push(`${relative(root, file)}: ${label}`);
    }
  }
  assert.deepEqual(leaks, []);
});

test("the app layer avoids host-only APIs the Mini Program engine lacks (structuredClone, createMemoryStore)", () => {
  // src/core/store.js createMemoryStore uses structuredClone (a browser / Node
  // host API, not ECMAScript); it works for h5/ but not in the WeChat engine,
  // so nothing under app/ may use either.
  const offenders = [];
  for (const file of files(join(root, "app"), [".js", ".jsx"])) {
    const source = readFileSync(file, "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
    if (/\bstructuredClone\b|\bcreateMemoryStore\b/.test(source)) offenders.push(relative(root, file));
  }
  assert.deepEqual(offenders, []);
});

test("src/adapter holds only the storage contract", () => {
  assert.deepEqual(readdirSync(join(root, "src/adapter")), ["storage-contract.js"]);
});

test("shared code reaches a platform only through app/platform/current", () => {
  const offenders = [];
  for (const file of shared.filter((f) => f.includes("/app/"))) {
    const source = readFileSync(file, "utf8");
    for (const [, spec] of source.matchAll(/from\s+["']([^"']+)["']/g)) {
      if (/platform\//.test(spec) && !/platform\/current$/.test(spec)) offenders.push(`${relative(root, file)} → ${spec}`);
    }
  }
  assert.deepEqual(offenders, []);
});

test("per-platform files exist only under app/platform", () => {
  const all = files(join(root, "app"), [".js", ".jsx", ".css"]).map((f) => relative(root, f));
  const perPlatform = all.filter((f) => /\.(h5|weapp|tt|alipay|swan|qq|jd)\.(jsx?|css)$/.test(f));
  assert.ok(perPlatform.length >= 2);
  for (const f of perPlatform) assert.ok(f.startsWith("app/platform/"), f);
  for (const f of [
    "app/platform/h5/browser-store.js",
    "app/platform/h5/index.js",
    "app/platform/h5/theme-assets.js",
    "app/platform/wechat/wx-store.js",
    "app/platform/wechat/index.js",
    "app/platform/wechat/theme-assets.js",
  ]) {
    assert.ok(all.includes(f), f);
  }
});

test("one shared page set: no pages-h5 / pages-wechat, no duplicate Home / Training / Correct / Wrong", () => {
  for (const dir of ["app/pages-h5", "app/pages-wechat", "app/pages-weapp", "pages-h5", "pages-wechat"]) {
    assert.equal(existsSync(join(root, dir)), false, dir);
  }
  const config = readFileSync(join(root, "app/app.config.js"), "utf8");
  assert.match(config, /pages: \["pages\/home\/index", "pages\/train\/index"\]/);
  const pages = files(join(root, "app/pages"), [".jsx"]).map((f) => relative(root, f));
  assert.deepEqual(pages.sort(), ["app/pages/home/index.jsx", "app/pages/train/index.jsx"]);
  const comps = files(join(root, "app/components"), [".jsx"]).map((f) => relative(root, f));
  for (const name of ["CorrectFeedback", "WrongFeedback", "Keypad"]) {
    assert.equal(comps.filter((c) => c.includes(name)).length, 1, name);
  }
});

test("the scan itself catches a leak", () => {
  const sample =
    "const v = wx.getStorageSync('k'); window.x = document.title; Taro.setStorageSync('a', 1); process.env.TARO_ENV; performance.now()";
  const hits = BANNED.filter(([p]) => p.test(sample)).map(([, l]) => l);
  for (const l of ["wx.", "window", "document", "Taro", "*Storage(Sync)", "TARO_ENV", "performance."]) {
    assert.ok(hits.includes(l), l);
  }
});

test("old h5/ stays as the V0.3 reference and uses the moved H5 store", () => {
  for (const f of ["h5/index.html", "h5/app.js", "h5/styles.css", "h5/math-text.js", "h5/theme.js", "h5/sound.js"]) {
    assert.ok(existsSync(join(root, f)), f);
  }
  const app = readFileSync(join(root, "h5/app.js"), "utf8");
  assert.match(app, /from "\.\.\/app\/platform\/h5\/browser-store\.js"/);
  assert.equal(existsSync(join(root, "src/adapter/browser-store.js")), false, "not kept in two places");
});

// ---- theme: semantic slots resolve to the approved pack, no copies ----

const manifest = JSON.parse(readFileSync(join(root, "assets/themes/math-lab/manifest.json"), "utf8"));
function manifestValue(key) {
  const [group, name] = key.split(".");
  return manifest.assets[group]?.[name];
}

for (const [client, file] of [
  ["h5", "app/platform/h5/theme-assets.js"],
  ["wechat", "app/platform/wechat/theme-assets.js"],
]) {
  test(`theme assets (${client}): every slot is the manifest's file for that slot`, () => {
    const source = readFileSync(join(root, file), "utf8");
    const imports = new Map([...source.matchAll(/import (\w+) from "([^"]+)";/g)].map((m) => [m[1], m[2]]));
    const entries = [...source.matchAll(/"([\w.]+)": \{ src: (\w+), manifestKey: "([\w.]+)" \}/g)];
    assert.ok(entries.length >= 3, "has mascot slots");
    for (const [, slot, varName, key] of entries) {
      const spec = imports.get(varName);
      assert.ok(spec, `${slot} imported`);
      const expected = manifestValue(key);
      assert.ok(expected, `${key} exists in manifest`);
      assert.equal(spec, `../../../assets/${expected}`, `${slot} → ${key}`);
      assert.ok(key.startsWith(slot.split(".")[0] === "logo" ? "logo." : slot.split(".")[0] + "."), `${slot} vs ${key}`);
      assert.ok(existsSync(join(root, "assets", expected)), expected);
      // Only display-size mascots ship; the 1024px masters stay in the pack.
      if (slot.startsWith("mascot.")) assert.match(key, /Display/, `${slot} uses a display-size copy`);
    }
    for (const pose of ["welcome", "correct", "thinking"]) {
      assert.ok(entries.some(([, slot]) => slot === `mascot.${pose}`), `mascot.${pose}`);
    }
  });
}

test("theme: no picture files copied into app/", () => {
  const pictures = files(join(root, "app"), [".png", ".webp", ".svg", ".jpg", ".gif"]);
  assert.deepEqual(pictures.map((f) => relative(root, f)), []);
});

test("wechat ships no SVG (待核) and no WebP (local WebP not relied on); h5 prefers WebP", () => {
  const wx = readFileSync(join(root, "app/platform/wechat/theme-assets.js"), "utf8");
  assert.equal(/\.svg"/.test(wx), false);
  assert.equal(/\.webp"/.test(wx), false);
  const h5 = readFileSync(join(root, "app/platform/h5/theme-assets.js"), "utf8");
  assert.match(h5, /mascot-welcome-512\.webp/);
});

test("theme tokens: same semantic values as h5/themes/math-lab/theme.css, system font only", () => {
  const props = (css) => new Map([...css.matchAll(/(--[\w-]+):\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]));
  const ref = props(readFileSync(join(root, "h5/themes/math-lab/theme.css"), "utf8"));
  const ours = props(readFileSync(join(root, "app/theme/math-lab/tokens.css"), "utf8"));
  assert.ok(ref.size >= 40);
  for (const [name, value] of ref) {
    assert.ok(ours.has(name), `${name} present`);
    if (name === "--font-ui" || name === "--font-math") continue;
    assert.equal(ours.get(name), value, name);
  }
  for (const name of ["--font-ui", "--font-math"]) {
    assert.equal(/Nunito/.test(ours.get(name)), false, `${name}: no web font`);
    assert.match(ours.get(name), /PingFang SC/);
  }
  const css = readFileSync(join(root, "app/app.css"), "utf8");
  assert.equal(/#[0-9a-fA-F]{3,8}\b/.test(css), false, "app.css writes no colour of its own");
  assert.equal(/@import|url\(/.test(css), false, "app.css loads nothing");
});

test("icon subset: generated from the Phosphor dependency, embedded, no runtime request", () => {
  const css = readFileSync(join(root, "app/components/icon/icon-font.css"), "utf8");
  assert.match(css, /Phosphor Icons [\d.]+ \(regular\), MIT License/);
  assert.match(css, /url\("data:font\/truetype;charset=utf-8;base64,/);
  assert.equal(/url\("(?!data:)/.test(css), false);
  const glyphs = readFileSync(join(root, "app/components/icon/glyphs.js"), "utf8");
  const used = new Set();
  for (const f of files(join(root, "app"), [".jsx", ".js"])) {
    for (const m of readFileSync(f, "utf8").matchAll(/(?:name|icon)[=:]\s*["{]?"([a-z-]+)"/g)) used.add(m[1]);
  }
  for (const name of used) assert.ok(glyphs.includes(`"${name}"`), `glyph ${name} in subset`);
});
