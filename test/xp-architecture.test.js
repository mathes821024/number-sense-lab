// Cross-platform boundary check (docs/architecture/02_cross_platform_frontend_architecture.md):
// no platform API in src/core, src/adapter, or the shared Taro pages, components and theme.
// Platform code lives only under app/platform/.
import assert from "node:assert/strict";
import test from "node:test";
import { readdirSync, readFileSync, statSync } from "node:fs";
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

const BANNED = [
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
  assert.ok(shared.length >= 25, `scanned ${shared.length} files`);
  const leaks = [];
  for (const file of shared) {
    const source = readFileSync(file, "utf8");
    for (const [pattern, label] of BANNED) {
      if (pattern.test(source)) leaks.push(`${relative(root, file)}: ${label}`);
    }
  }
  assert.deepEqual(leaks, []);
});

test("src/adapter holds only the storage contract", () => {
  assert.deepEqual(readdirSync(join(root, "src/adapter")), ["storage-contract.js"]);
});

test("shared pages reach a platform only through app/platform/current", () => {
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
  const all = files(join(root, "app"), [".js", ".jsx"]).map((f) => relative(root, f));
  const perPlatform = all.filter((f) => /\.(h5|weapp|tt|alipay|swan|qq|jd)\.jsx?$/.test(f));
  assert.ok(perPlatform.length >= 2);
  for (const f of perPlatform) assert.ok(f.startsWith("app/platform/"), f);
  assert.ok(all.includes("app/platform/h5/browser-store.js"));
  assert.ok(all.includes("app/platform/wechat/wx-store.js"));
});

test("one shared page set: both targets build the same pages", () => {
  const config = readFileSync(join(root, "app/app.config.js"), "utf8");
  assert.match(config, /"pages\/home\/index", "pages\/train\/index"/);
  const pages = files(join(root, "app/pages"), [".jsx"]).map((f) => relative(root, f));
  assert.ok(pages.every((p) => !/\.(h5|weapp)\./.test(p)), pages.join());
});

test("the scan itself catches a leak", () => {
  const sample = "const v = wx.getStorageSync('k'); window.x = document.title; Taro.setStorageSync('a', 1);";
  const hits = BANNED.filter(([p]) => p.test(sample)).map(([, l]) => l);
  for (const l of ["wx.", "window", "document", "Taro", "*Storage(Sync)"]) assert.ok(hits.includes(l), l);
});
