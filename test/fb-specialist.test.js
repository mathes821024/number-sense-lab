// F-B specialist page (docs/ui/08_fb_specialist_visual.md,
// concept-design/F-B-final/asset-manifest.json): the eight domain entries, their
// navigation groups, one F-B asset slot per domain on both clients, no empty icon,
// each tile entering its own domain, domain ids unchanged, the long name, the
// reused mascot and the F-B tokens. Visual only: learning code never sees any of it.
import assert from "node:assert/strict";
import test from "node:test";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { DOMAIN_ORDER, DOMAIN_LABELS, loadCoreCatalog, filterByDomain } from "../src/core/content.js";
import { DOMAIN_GLYPHS, PRACTICE_GROUPS, isLongLabel, practiceGroups } from "../src/core/practice-groups.js";
import { focusView } from "../app/pages/models.js";
import { trainingIntent } from "../app/pages/train/intent.js";
import { startSession } from "../src/core/session.js";
import { fbTable, FB_DIR, FB_MANIFEST, OUT, DOMAIN_KEY, MASCOT_KEY } from "../scripts/sync-fb-assets.mjs";
import {
  useSpecialistManifest,
  domainIconUrl,
  domainAssetGroup,
  specialistMascotUrl,
  DOMAIN_KEY as H5_DOMAIN_KEY,
  MASCOT_KEY as H5_MASCOT_KEY,
} from "../h5/specialist-assets.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (f) => readFileSync(join(root, f), "utf8");
const manifest = JSON.parse(read(FB_MANIFEST));
const catalog = loadCoreCatalog();
const ID8 = ["squares", "cubes", "powers", "products", "special_products", "fraction_decimal", "halves", "complements"];
const FB_BASE = new URL(`../${FB_DIR}/`, import.meta.url).href;

/** Width, height and colour type of a PNG from its IHDR. */
function pngInfo(file) {
  const b = readFileSync(file);
  assert.equal(b.subarray(0, 8).toString("hex"), "89504e470d0a1a0a", `${file} is a PNG`);
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20), colorType: b[25] };
}
const sha = (f) => createHash("sha256").update(readFileSync(f)).digest("hex");

test("F-B: exactly the eight domains, ids unchanged, each one entry on the page", () => {
  assert.deepEqual([...DOMAIN_ORDER].sort(), [...ID8].sort(), "domain ids unchanged");
  assert.deepEqual(Object.keys(manifest.domains).sort(), [...ID8].sort(), "manifest names the same eight ids");
  assert.equal(manifest.page, "specialist-training");
  assert.equal(manifest.status, "current-visual-baseline");
  const cards = practiceGroups(catalog, {}).flatMap((g) => g.cards);
  assert.equal(cards.length, 8);
  assert.deepEqual(cards.map((c) => c.domain).sort(), [...ID8].sort());
  for (const c of cards) {
    assert.equal(c.label, DOMAIN_LABELS[c.domain]);
    assert.ok(filterByDomain(c.domain, catalog).length > 0, `${c.domain} has content`);
  }
});

test("F-B: group assignment follows the manifest; group keys are navigation only", () => {
  const want = [
    ["幂与乘方", "POWERS", "powers", ["squares", "cubes", "powers"]],
    ["乘法与凑整", "PRODUCTS", "products", ["products", "special_products"]],
    ["数与分数", "NUMBERS", "numbers", ["fraction_decimal", "halves", "complements"]],
  ];
  assert.deepEqual(PRACTICE_GROUPS.map((g) => [g.label, g.en, g.assetGroup, [...g.domains]]), want);
  for (const g of PRACTICE_GROUPS) for (const d of g.domains) assert.equal(manifest.domains[d].group, g.assetGroup, `${d} → ${g.assetGroup}`);
  assert.deepEqual(Object.keys(manifest.groups), ["powers", "products", "numbers"]);
  for (const g of Object.values(manifest.groups)) assert.equal(g.background, "CSS", "group zones are drawn, not pictures");
  // The code's group ids never collide with a domain id; the manifest keys never reach learning code.
  for (const g of PRACTICE_GROUPS) assert.equal(ID8.includes(g.id), false, g.id);
  for (const f of readdirSync(join(root, "src/core"))) {
    if (f === "practice-groups.js") continue;
    assert.doesNotMatch(read(`src/core/${f}`), /assetGroup|asset-manifest|F-B-final|practice-groups/, f);
  }
});

test("F-B: one asset slot per domain, generated from the manifest only; same PNG files on H5 and WeChat", () => {
  assert.equal(read(OUT), fbTable(manifest), `${OUT} is out of date: node scripts/sync-fb-assets.mjs`);
  const table = read(OUT);
  const rows = [...table.matchAll(/"(domain\.\w+)": \{ src: (\w+), manifestKey: "domains\.(\w+)\.(\w+)", group: "(\w+)" \}/g)];
  assert.equal(rows.length, 8, "8 / 8 slots");
  for (const [, slot, ident, domain, key, group] of rows) {
    assert.equal(slot, `domain.${domain}`);
    assert.equal(key, DOMAIN_KEY);
    assert.equal(group, manifest.domains[domain].group);
    const path = table.match(new RegExp(`import ${ident} from "\\.\\./\\.\\./([^"]+)";`))[1];
    assert.equal(path, `${FB_DIR}/${manifest.domains[domain][DOMAIN_KEY]}`, `${slot} is the manifest's file`);
    const info = pngInfo(join(root, path));
    assert.deepEqual([info.w, info.h, info.colorType], [256, 256, 6], `${domain}: 256px RGBA (transparent)`);
    const two = join(root, FB_DIR, manifest.domains[domain].asset_2x);
    assert.deepEqual([pngInfo(two).w, pngInfo(two).h], [512, 512], `${domain} @2x`);
  }
  // Both clients read this one table (app/theme/index.js): no per-platform copy, no SVG, no second mapping.
  assert.match(read("app/theme/index.js"), /fbSpecialistAssets\[slot\] \|\| themeAssets\[slot\]/);
  for (const f of ["app/platform/h5/theme-assets.js", "app/platform/wechat/theme-assets.js"]) {
    assert.doesNotMatch(read(f), /"domain\./, `${f} maps no domain icon`);
  }
  assert.doesNotMatch(table, /\.svg"/);
  // Not the repo-root assets/specialist/asset-manifest.json (08 §1).
  for (const f of ["app/theme/index.js", "h5/app.js", "h5/specialist-assets.js", "scripts/sync-fb-assets.mjs"]) {
    assert.doesNotMatch(read(f), /["'`]assets\/specialist\//, f);
  }
});

test("F-B h5/: the manifest is read at run time; a domain's icon is the file it names", () => {
  assert.equal(H5_DOMAIN_KEY, DOMAIN_KEY);
  assert.equal(H5_MASCOT_KEY, MASCOT_KEY);
  try {
    assert.equal(useSpecialistManifest(manifest, FB_BASE), true);
    for (const d of ID8) {
      const url = domainIconUrl(d);
      assert.equal(url, new URL(manifest.domains[d].asset, FB_BASE).href);
      assert.ok(existsSync(new URL(url)), `${d} file exists`);
      assert.equal(domainAssetGroup(d), manifest.domains[d].group);
    }
    assert.ok(existsSync(new URL(specialistMascotUrl())));
    // Unknown domains have no picture: the glyph stands in, never an empty chip.
    assert.equal(domainIconUrl("factors"), "");
    assert.equal(domainIconUrl("__proto__"), "");
    // Another manifest is refused, so glyphs rather than wrong pictures.
    assert.equal(useSpecialistManifest({ page: "other", domains: {} }), false);
    assert.equal(domainIconUrl("squares"), "");
    assert.equal(specialistMascotUrl(), "");
  } finally {
    useSpecialistManifest(null);
  }
  const explore = read("h5/app.js");
  assert.match(explore, /await Promise\.all\(\[loadTheme\(\), loadSpecialistAssets\(\)\]\);/);
});

test("F-B: no empty icon — every domain has a file and a fallback glyph", () => {
  for (const c of practiceGroups(catalog, {}).flatMap((g) => g.cards)) {
    assert.ok(DOMAIN_GLYPHS[c.domain] && c.glyph === DOMAIN_GLYPHS[c.domain], `${c.domain} fallback glyph`);
    assert.equal(c.slot, `domain.${c.domain}`);
    assert.ok(existsSync(join(root, FB_DIR, manifest.domains[c.domain].asset)), `${c.domain} file`);
  }
  const glyphs = read("app/components/icon/glyphs.js");
  for (const g of Object.values(DOMAIN_GLYPHS)) assert.ok(glyphs.includes(`"${g}"`), `${g} in the embedded font`);
});

test("F-B: each tile enters its own domain (confirm → a focused set from that domain only)", () => {
  const page = read("app/pages/explore/index.jsx");
  assert.match(page, /data-domain=\{c\.domain\}/);
  assert.match(page, /onClick=\{\(\) => \(c\.released \? setFocused\(c\.domain\) : showSoon\(c\.label\)\)\}/);
  assert.match(page, /navigate\.toTraining\("start-focus", \{ domain: focus\.domain \}\)/);
  assert.match(read("h5/app.js"), /data-domain="\$\{c\.domain\}"/);
  for (const d of ID8) {
    assert.equal(focusView(d, { relations: {} }, catalog).domain, d);
    const intent = trainingIntent({ intent: "start-focus", domain: d });
    assert.deepEqual(intent, { kind: "begin", mode: "focused", domain: d });
    const s = startSession({ catalog, mode: "focused", domain: d, day: "2026-10-03", relations: {} });
    assert.equal(s.domain, d);
    assert.ok(s.queue.length > 0 && s.queue.every((id) => catalog.find((i) => i.id === id).domain === d), `${d}: own domain only`);
  }
});

test("F-B: the long name 凑整乘积家族 stays on one line (smaller size), others at 15px", () => {
  const long = ID8.filter((d) => isLongLabel(DOMAIN_LABELS[d]));
  assert.deepEqual(long, ["special_products"]);
  for (const css of [read("app/app.css"), read("h5/styles.css")]) {
    assert.match(css, /\.practice-name\.is-long \{ font-size: 14px; \}/);
    assert.match(css, /\.practice-name \{[^}]*white-space: nowrap;/);
  }
  // Browsers keep px as px: from 386px wide the long name has room for 15px again.
  for (const css of [read("app/platform/h5/page-shell.css"), read("h5/styles.css")]) {
    assert.match(css, /@media \(min-width: 386px\) \{\s*\.practice-name\.is-long \{ font-size: 15px; \}\s*\}/);
  }
});

test("F-B mascot: the existing welcome pose, reused byte for byte — never a new character", () => {
  const fb = join(root, FB_DIR, manifest.mascot[MASCOT_KEY]);
  assert.equal(sha(fb), sha(join(root, "assets/themes/math-lab/mascot/mascot-welcome-512.png")), "same file as the Home welcome mascot");
  assert.equal(sha(join(root, FB_DIR, manifest.mascot.asset)), sha(join(root, "assets/themes/math-lab/mascot/mascot-welcome.png")));
  assert.match(read(OUT), /"specialist\.mascot": \{ src: specialistMascot, manifestKey: "mascot\.asset_2x" \}/);
  // Header only: not on training, keypad or paper.
  for (const f of ["app/pages/train/index.jsx", "app/pages/a4/index.jsx", "app/pages/print/index.jsx"]) {
    if (existsSync(join(root, f))) assert.doesNotMatch(read(f), /specialist\.mascot/, f);
  }
});

test("F-B tokens: the VISUAL_TOKENS colours, the same in both themes; teal stays math-lab's brand primary", () => {
  const tokens = read(`${FB_DIR}/VISUAL_TOKENS.md`);
  const value = (name) => tokens.match(new RegExp(`\\| ${name.replace(/\./g, "\\.")} \\| ([^|]+) \\|`))[1].trim();
  const want = {
    "--fb-group-bg-sky": value("specialist.group.bg.powers"),
    "--fb-group-bg-amber": value("specialist.group.bg.products"),
    "--fb-group-bg-mint": value("specialist.group.bg.numbers"),
    "--fb-accent-sky": value("specialist.group.accent.powers"),
    "--fb-accent-amber": value("specialist.group.accent.products"),
    "--fb-accent-mint": value("specialist.group.accent.numbers"),
    "--fb-tile-bg": value("specialist.tile.bg"),
    "--fb-tile-shadow": value("specialist.tile.shadow").replace(/,(\S)/g, ", $1"),
  };
  for (const f of ["app/theme/math-lab/tokens.css", "h5/themes/math-lab/theme.css"]) {
    const css = read(f);
    for (const [k, v] of Object.entries(want)) assert.ok(css.includes(`${k}: ${v};`), `${f} ${k}: ${v}`);
    assert.match(css, /--fb-status: #8A94A6;/);
    assert.match(css, /--fb-chip-sky: rgba\(74, 143, 217, 0\.10\);/, "chip = group accent at 10%");
  }
  // 08 §2: the selected tab and the page keep math-lab's tokens (no second teal).
  for (const css of [read("app/app.css"), read("h5/styles.css")]) {
    assert.match(css, /\.seg\.is-on \{ background: var\(--color-brand-primary\);/);
  }
});
