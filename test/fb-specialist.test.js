// F-B specialist page (docs/ui/08_fb_specialist_visual.md; design hand-off
// concept-design/F-B-final/asset-manifest.json, runtime copy
// assets/themes/math-lab/specialist/asset-manifest.json): the eight domain entries, their
// navigation groups, one F-B asset slot per domain on both clients, no empty icon,
// each tile entering its own domain, domain ids unchanged, the long name, the
// reused mascot and the F-B tokens; runtime never loads the design folder, and the
// WeChat package stays under 2 MB. Visual only: learning code never sees any of it.
import assert from "node:assert/strict";
import test from "node:test";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { DOMAIN_ORDER, DOMAIN_LABELS, loadCoreCatalog, filterByDomain } from "../src/core/content.js";
import { DOMAIN_GLYPHS, PRACTICE_GROUPS, isLongLabel, practiceGroups } from "../src/core/practice-groups.js";
import { focusView } from "../app/pages/models.js";
import { trainingIntent } from "../app/pages/train/intent.js";
import { startSession } from "../src/core/session.js";
import {
  fbTable,
  manifestText,
  runtimeManifest,
  runtimeCopies,
  runtimeFiles,
  SOURCE_MANIFEST,
  SOURCE_DIR,
  SOURCE_DOMAIN_KEY,
  SOURCE_MASCOT_KEY,
  RUNTIME_MASCOT,
  RUNTIME_DIR,
  RUNTIME_MANIFEST,
  OUT,
  DOMAIN_KEY,
  MASCOT_KEY,
} from "../scripts/sync-fb-assets.mjs";
import { checkWeappPackage, LIMIT } from "../scripts/weapp-package-check.mjs";
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
/** The design hand-off (the mapping's origin) and the runtime copy every client reads. */
const design = JSON.parse(read(SOURCE_MANIFEST));
const manifest = JSON.parse(read(RUNTIME_MANIFEST));
const FB_DIR = RUNTIME_DIR;
const catalog = loadCoreCatalog();
const ID8 = ["squares", "cubes", "powers", "products", "special_products", "fraction_decimal", "halves", "complements"];
const FB_BASE = new URL(`../${RUNTIME_DIR}/`, import.meta.url).href;

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
  assert.equal(read(RUNTIME_MANIFEST), manifestText(runtimeManifest(design)), `${RUNTIME_MANIFEST} is out of date: node scripts/sync-fb-assets.mjs`);
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

test("F-B runtime folder: only the 9 production pictures (8 × 256px domains + 1 × 512px mascot), byte-for-byte from the design source", () => {
  const copies = runtimeCopies(design);
  assert.equal(copies.length, 9, "8 domains + 1 mascot");
  for (const [from, to] of copies) assert.equal(sha(join(root, to)), sha(join(root, from)), `${to} = ${from}`);
  // Exactly these files, and the generated manifest: nothing else is shipped from the folder.
  const files = runtimeFiles(root);
  assert.deepEqual(files, [...copies.map(([, to]) => to), RUNTIME_MANIFEST].sort());
  const pngs = files.filter((f) => f.endsWith(".png"));
  assert.equal(pngs.length, 9);
  assert.equal(pngs.filter((f) => /@2x/.test(f)).length, 0, "no @2x copies");
  const domains = pngs.filter((f) => f.startsWith(`${RUNTIME_DIR}/domains/`));
  assert.equal(domains.length, 8);
  for (const f of domains) assert.deepEqual([pngInfo(join(root, f)).w, pngInfo(join(root, f)).h], [256, 256], f);
  const mascots = pngs.filter((f) => f.startsWith(`${RUNTIME_DIR}/mascot/`));
  assert.deepEqual(mascots, [`${RUNTIME_DIR}/${RUNTIME_MASCOT}`], "exactly one mascot");
  assert.deepEqual([pngInfo(join(root, mascots[0])).w, pngInfo(join(root, mascots[0])).h], [512, 512], "the 512px mascot");
  // No 1024px master and no 512px design derivative of a domain, under any name.
  const master = sha(join(root, SOURCE_DIR, design.mascot.asset));
  const derivatives = Object.values(design.domains).map((d) => sha(join(root, SOURCE_DIR, d.asset_2x)));
  for (const f of pngs) {
    assert.notEqual(sha(join(root, f)), master, `${f} is the 1024px master`);
    assert.equal(derivatives.includes(sha(join(root, f))), false, `${f} is a 512px domain derivative`);
  }
  assert.deepEqual([pngInfo(join(root, SOURCE_DIR, design.mascot.asset)).w], [1024], "the master stays in the design folder");
});

test("F-B runtime manifest: domains.<id>.asset and mascot.asset only (no asset_2x key); grouping unchanged", () => {
  assert.equal(SOURCE_DOMAIN_KEY, "asset");
  assert.equal(SOURCE_MASCOT_KEY, "asset_2x", "the design manifest's 512px mascot");
  assert.equal(DOMAIN_KEY, "asset");
  assert.equal(MASCOT_KEY, "asset");
  assert.doesNotMatch(read(RUNTIME_MANIFEST), /asset_2x|@2x/);
  assert.match(manifest.generated, /GENERATED by scripts\/sync-fb-assets\.mjs/);
  assert.deepEqual(Object.keys(manifest.domains), Object.keys(design.domains), "same domain_ids, same order");
  for (const [id, d] of Object.entries(design.domains)) {
    assert.deepEqual(Object.keys(manifest.domains[id]), ["asset", "group"], id);
    assert.equal(manifest.domains[id].group, d.group, id);
    assert.equal(manifest.domains[id].asset, `domains/${d.asset.split("/").pop()}`, id);
  }
  assert.deepEqual(Object.keys(manifest.mascot).sort(), ["asset", "source"]);
  assert.equal(manifest.mascot.asset, RUNTIME_MASCOT);
  assert.equal(sha(join(root, RUNTIME_DIR, manifest.mascot.asset)), sha(join(root, SOURCE_DIR, design.mascot.asset_2x)), "mascot.asset is the 512px picture");
  assert.deepEqual(manifest.groups, design.groups);
  assert.match(read(OUT), /"specialist\.mascot": \{ src: specialistMascot, manifestKey: "mascot\.asset" \}/);
  assert.doesNotMatch(read(OUT), /asset_2x|@2x/);
});

test("F-B: no runtime file references concept-design/ (design evidence only, 08 §1)", () => {
  const scan = (dir) => readdirSync(join(root, dir), { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? scan(`${dir}/${e.name}`) : [`${dir}/${e.name}`]));
  const runtime = [...scan("app"), ...scan("h5"), ...scan("src"), ...scan("assets/themes")].filter((f) => /\.(js|jsx|mjs|css|json|html|scss)$/.test(f));
  assert.ok(runtime.length > 50, "scanned the runtime sources");
  for (const f of runtime) assert.doesNotMatch(read(f), /concept-design|F-B-final/, f);
  for (const line of read(OUT).split("\n").filter((l) => l.startsWith("import "))) assert.match(line, new RegExp(`"\\.\\./\\.\\./${RUNTIME_DIR}/`), line);
  assert.match(read("h5/specialist-assets.js"), /new URL\("\.\.\/assets\/themes\/math-lab\/specialist\/", import\.meta\.url\)/);
});

test("F-B WeChat package: under 2 MB, no concept-design/, the page's PNGs from the theme folder (after build:weapp)", (t) => {
  const dist = join(root, "dist/weapp");
  if (!existsSync(join(dist, "app.json"))) return t.skip("no dist/weapp: run npm run build:weapp (or scripts/weapp-package-check.mjs after it)");
  const r = checkWeappPackage(dist);
  assert.deepEqual(r.problems, [], r.problems.join("; "));
  assert.ok(r.bytes < LIMIT, `${r.bytes} bytes`);
  assert.equal(r.pngs.length, 9);
  // Only the 9 runtime pictures: no @2x, no 1024px master.
  const shipped = readdirSync(join(dist, RUNTIME_DIR), { recursive: true }).map(String).filter((f) => f.endsWith(".png"));
  assert.equal(shipped.length, 9, shipped.join(" "));
  assert.equal(shipped.filter((f) => /@2x/.test(f)).length, 0);
  assert.ok(statSync(join(dist, RUNTIME_DIR, manifest.mascot.asset)).size < 300 * 1024);
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
  const fb = join(root, RUNTIME_DIR, manifest.mascot[MASCOT_KEY]);
  assert.equal(sha(fb), sha(join(root, "assets/themes/math-lab/mascot/mascot-welcome-512.png")), "same file as the Home welcome mascot (512px)");
  // The design source's 1024px master is the Home welcome master; it never reaches the runtime folder.
  assert.equal(sha(join(root, SOURCE_DIR, design.mascot.asset)), sha(join(root, "assets/themes/math-lab/mascot/mascot-welcome.png")));
  assert.equal(design.mascot.source.includes("welcome"), true);
  assert.match(read(OUT), /"specialist\.mascot": \{ src: specialistMascot, manifestKey: "mascot\.asset" \}/);
  // Header only: not on training, keypad or paper.
  for (const f of ["app/pages/train/index.jsx", "app/pages/a4/index.jsx", "app/pages/print/index.jsx"]) {
    if (existsSync(join(root, f))) assert.doesNotMatch(read(f), /specialist\.mascot/, f);
  }
});

test("F-B tokens: the VISUAL_TOKENS colours, the same in both themes; teal stays math-lab's brand primary", () => {
  const tokens = read("concept-design/F-B-final/VISUAL_TOKENS.md");
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
    // Two semantic tokens (08 §2): learner status and the English group label; same value today.
    assert.ok(css.includes(`--fb-status-color: ${value("specialist.status.color")};`), `${f} --fb-status-color = specialist.status.color`);
    assert.ok(css.includes(`--fb-group-meta-color: ${value("specialist.group.metaColor")};`), `${f} --fb-group-meta-color = specialist.group.metaColor`);
    assert.match(css, /--fb-status-color: #667085;/);
    assert.match(css, /--fb-group-meta-color: #667085;/);
    assert.doesNotMatch(css, /--fb-status:/, "the old shared token is gone");
    assert.doesNotMatch(css, /8A94A6/i);
    assert.match(css, /--fb-chip-sky: rgba\(74, 143, 217, 0\.10\);/, "chip = group accent at 10%");
  }
  assert.equal(value("specialist.status.color"), "#667085");
  assert.equal(value("specialist.group.metaColor"), "#667085");
  // Status words use the status token; the English group label uses its own.
  for (const css of [read("app/app.css"), read("h5/styles.css")]) {
    assert.match(css, /\.practice-status \{[^}]*color: var\(--fb-status-color\);/);
    assert.match(css, /\.practice-group-en \{[^}]*color: var\(--fb-group-meta-color\);/);
    assert.doesNotMatch(css, /var\(--fb-status\)/);
  }
  // The colour lives in the token only: components and page CSS never hard-code it.
  for (const f of ["app/app.css", "h5/styles.css", "app/platform/h5/page-shell.css", "app/pages/explore/index.jsx", "app/components/DomainTile.jsx", "h5/app.js"]) {
    assert.doesNotMatch(read(f), /#667085|#8A94A6/i, f);
  }
  // 08 §2: the selected tab and the page keep math-lab's tokens (no second teal).
  for (const css of [read("app/app.css"), read("h5/styles.css")]) {
    assert.match(css, /\.seg\.is-on \{ background: var\(--color-brand-primary\);/);
  }
});
