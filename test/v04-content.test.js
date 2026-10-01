/**
 * v0.4 content expansion (docs/curriculum/06–08, docs/architecture/03_v04).
 * 51 new Core Recall relations in five domains; registry extended, engine untouched.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  DOMAIN_LABELS,
  DOMAIN_ORDER,
  FROZEN_COUNTS,
  filterByDomain,
  getRelationById,
  loadCoreCatalog,
  verifyContentCounts,
} from "../src/core/content.js";
import { CORE_RELATIONS } from "../src/core/catalog-data.js";
import { judgeAnswer } from "../src/core/answer.js";
import { buildMistakeBook } from "../src/core/mistakes.js";
import { buildSessionQueue } from "../src/core/schedule.js";
import { peekCurrent, startSession, submitAnswer } from "../src/core/session.js";
import { emptyLearner, STATE_VERSION } from "../src/core/store.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const catalog = loadCoreCatalog();
const V04 = ["halves", "complements", "cubes", "powers", "special_products"];
const V04_COUNTS = { halves: 14, complements: 12, cubes: 8, powers: 9, special_products: 8 };
const newItems = catalog.filter((item) => V04.includes(item.domain));
const sources = V04.map((domain) => JSON.parse(readFileSync(join(root, `content/v0.4/${domain}.core.json`), "utf8")));
const SUP = { "⁰": 0, "¹": 1, "²": 2, "³": 3, "⁴": 4, "⁵": 5, "⁶": 6, "⁷": 7, "⁸": 8, "⁹": 9 };
const sup = (n) => String(n).split("").map((d) => Object.keys(SUP)[Number(d)]).join("");
const meta = { day: "2026-10-01", inputMode: "onscreen_keypad", elapsedMs: 900 };

test("v0.4: exactly 51 new relations, 173 in total, counts 32/32/58/14/12/8/9/8", () => {
  assert.equal(newItems.length, 51);
  assert.equal(catalog.length, 173);
  const counts = verifyContentCounts(catalog);
  for (const [domain, n] of Object.entries({ squares: 32, products: 32, fraction_decimal: 58, ...V04_COUNTS })) {
    assert.equal(counts[domain], n, domain);
    assert.equal(filterByDomain(domain, catalog).length, n, domain);
  }
  assert.equal(counts.v04, 51);
  assert.equal(counts.total, 173);
  assert.equal(FROZEN_COUNTS.total, 173);
  // The new 51 come after the old 122, one content/v0.4 file per domain in DOMAIN_ORDER.
  assert.deepEqual(catalog.slice(122).map((r) => r.id), sources.flatMap((s) => s.relations.map((r) => r.id)));
  for (const [i, s] of sources.entries()) {
    assert.equal(s.domain, V04[i]);
    assert.equal(s.relations.length, V04_COUNTS[V04[i]]);
    assert.ok(s.relations.every((r) => r.domain === V04[i]));
  }
});

test("v0.4: no duplicate ids; pow-5-3 absent; cube-5 is the only trainable 5³ = 125", () => {
  assert.equal(new Set(catalog.map((r) => r.id)).size, 173);
  assert.equal(getRelationById("pow-5-3", catalog), null);
  assert.equal(catalog.some((r) => /pow-5-3/.test(JSON.stringify(r.families)) || r.entry_after === "pow-5-3"), false);
  const fiveCubed = catalog.filter((r) => /5³/.test(r.prompt) || /^5³/.test(r.relation) || (r.domain === "powers" && r.canonical_answer === "125"));
  assert.deepEqual(fiveCubed.map((r) => r.id), ["cube-5"]);
  assert.equal(getRelationById("cube-5", catalog).canonical_answer, "125");
  // 5³ may appear only as a supporting example (cube-5 itself), never as a second prompt.
  assert.equal(catalog.filter((r) => r.prompt === "5³ = ?").length, 1);
});

test("v0.4: every one of the 51 answers is arithmetically correct (computed independently)", () => {
  for (const r of newItems) {
    let m;
    let expected;
    let prompt;
    if ((m = r.id.match(/^cube-(\d+)$/))) {
      const n = Number(m[1]);
      expected = n * n * n;
      prompt = `${n}³ = ?`;
    } else if ((m = r.id.match(/^half-(\d+)$/))) {
      const n = Number(m[1]);
      assert.equal(n % 2, 0, `${r.id}: only even halves`);
      expected = n / 2;
      prompt = `${n} 的一半是？`;
    } else if ((m = r.id.match(/^comp-(\d+)$/))) {
      const n = Number(m[1]);
      expected = 100 - n;
      prompt = `${n} 和几凑成 100？`;
    } else if ((m = r.id.match(/^pow-(\d+)-(\d+)$/))) {
      const [a, b] = [Number(m[1]), Number(m[2])];
      expected = a ** b;
      prompt = `${a}${sup(b)} = ?`;
    } else if ((m = r.id.match(/^sp-(\d+)-(\d+)$/))) {
      const [a, b] = [Number(m[1]), Number(m[2])];
      expected = a * b;
      prompt = `${a} × ${b} = ?`;
    } else {
      assert.fail(`unexpected v0.4 id ${r.id}`);
    }
    assert.equal(r.canonical_answer, String(expected), r.id);
    assert.equal(r.prompt, prompt, r.id);
    assert.equal(judgeAnswer(r, String(expected)).kind, "correct", r.id);
  }
});

test("v0.4: all 51 are core_recall, forward, integer, empty entry_after, two frames", () => {
  for (const r of newItems) {
    assert.equal(r.level, "core_recall", r.id);
    assert.equal(r.direction, "forward", r.id);
    assert.equal(r.answer_type, "integer", r.id);
    assert.equal(r.integerOnly, true, r.id);
    assert.equal(r.entry_after, null, r.id);
    assert.match(r.canonical_answer, /^[1-9]\d*$/, r.id);
    assert.ok([1, 2, 3].includes(r.tier), r.id);
    assert.deepEqual(r.frames, [{ title: "这一步", detail: r.hook }, { title: r.canonical_answer, detail: r.relation }], r.id);
  }
});

test("v0.4: complements say 凑成 and never use a subtraction as the prompt", () => {
  const comps = filterByDomain("complements", catalog);
  assert.equal(comps.length, 12);
  for (const r of comps) {
    assert.match(r.prompt, /^\d{1,2} 和几凑成 100？$/, r.id);
    assert.doesNotMatch(r.prompt, /[-−–]|减/, r.id);
    assert.equal(Number(r.prompt.match(/^\d+/)[0]) + Number(r.canonical_answer), 100, r.id);
  }
});

test("v0.4: halves are the 14 even representatives; no odd half, no decimal", () => {
  const halves = filterByDomain("halves", catalog);
  assert.deepEqual(halves.map((r) => r.id).sort(), [
    "half-38", "half-46", "half-52", "half-54", "half-58", "half-62", "half-64",
    "half-72", "half-74", "half-78", "half-86", "half-94", "half-96", "half-98",
  ]);
  for (const r of newItems) assert.doesNotMatch(r.canonical_answer, /\./, r.id);
  assert.equal(catalog.some((r) => r.canonical_answer === "18.5"), false);
});

test("v0.4: only the 8 frozen special products carry f25 / f125, type scaling", () => {
  const withFamily = catalog.filter((r) => r.families.some((f) => f.id === "f25" || f.id === "f125"));
  assert.deepEqual(withFamily.map((r) => r.id).sort(), [
    "sp-125-2", "sp-125-4", "sp-125-8", "sp-25-2", "sp-25-3", "sp-25-4", "sp-25-6", "sp-25-8",
  ]);
  for (const r of withFamily) {
    const want = r.id.startsWith("sp-125-") ? "f125" : "f25";
    assert.deepEqual(r.families, [{ id: want, type: "scaling", role: "member" }], r.id);
  }
  for (const r of newItems.filter((r) => r.domain !== "special_products")) assert.deepEqual(r.families, [], r.id);
  assert.equal(catalog.some((r) => r.families.some((f) => /37/.test(f.id))), false);
});

test("v0.4: content JSON equals the frozen table in docs/curriculum/07_v04_relation_spec.md", () => {
  const spec = readFileSync(join(root, "docs/curriculum/07_v04_relation_spec.md"), "utf8");
  const rows = spec
    .split("\n")
    .filter((l) => /^\| (cube|half|comp|pow|sp)-/.test(l))
    .map((l) => l.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim()));
  assert.equal(rows.length, 51);
  for (const [id, tier, prompt, answer, relation, hookType, hook, check, family] of rows) {
    const r = getRelationById(id, catalog);
    assert.ok(r, `missing ${id}`);
    assert.equal(r.tier, Number(tier), id);
    assert.equal(r.prompt, prompt, id);
    assert.equal(r.canonical_answer, answer, id);
    assert.equal(r.relation, relation, id);
    assert.equal(r.hook_type, hookType, id);
    assert.equal(r.hook, hook, id);
    assert.equal(r.pattern.check, check, id);
    assert.deepEqual(r.pattern.family, family.split("；").map((s) => s.trim()), id);
  }
});

test("v0.4: the old 122 are unchanged (deep-equal to base main 0300997)", () => {
  const raw122 = CORE_RELATIONS.slice(0, 122);
  // sha256 of JSON.stringify(CORE_RELATIONS) on main 0300997, when it held exactly these 122.
  const hash = createHash("sha256").update(JSON.stringify(raw122)).digest("hex");
  assert.equal(hash, "155aa008ff0b440f66f11ee36616cbd8d492e060ca7f03c4a61bc978548fb196");
  // And field-for-field equal to the untouched v0.1 / v0.2c source files, in order.
  const files = [
    "v0.1/squares", "v0.1/products", "v0.1/fractions",
    "v0.2c/squares_inverse", "v0.2c/fractions_inverse", "v0.2c/fractions_repeating",
  ];
  const fromSources = files.flatMap((f) => JSON.parse(readFileSync(join(root, `content/${f}.core.json`), "utf8")).relations);
  assert.deepEqual(raw122, fromSources);
  assert.ok(raw122.every((r) => ["squares", "products", "fraction_decimal"].includes(r.domain)));
});

test("v0.4 registry: frozen domain order and card names; unknown or partial domains still fail", () => {
  assert.deepEqual(DOMAIN_ORDER, ["squares", "products", "fraction_decimal", "halves", "complements", "cubes", "powers", "special_products"]);
  assert.deepEqual(DOMAIN_LABELS, {
    squares: "平方", products: "常用乘积", fraction_decimal: "分数到小数", halves: "半数与翻倍",
    complements: "补数", cubes: "立方", powers: "常见幂", special_products: "凑整乘积家族",
  });
  const probe = { ...getRelationById("cube-2", catalog), id: "probe-1" };
  for (const domain of ["factors", "patterns", "constructor", "toString"]) {
    assert.throws(() => verifyContentCounts([...catalog, { ...probe, domain }]), /CONTRACT_CONFLICT: unknown domain/, domain);
  }
  // A partial domain, an extra relation, or a duplicate id never passes.
  assert.throws(() => verifyContentCounts(catalog.filter((r) => r.id !== "cube-9")), /CONTRACT_CONFLICT: cubes expected 8, got 7/);
  assert.throws(() => verifyContentCounts([...catalog, { ...probe, domain: "powers", id: "pow-5-3" }]), /CONTRACT_CONFLICT: powers expected 9, got 10/);
  assert.throws(() => verifyContentCounts([...catalog, getRelationById("cube-5", catalog)]), /CONTENT_ID_CONFLICT/);
  // The old three stay exact as well.
  assert.throws(() => verifyContentCounts(catalog.filter((r) => r.id !== "square-6")), /CONTRACT_CONFLICT: squares/);
  assert.equal(STATE_VERSION, 3, "no state schema change");
});

test("daily training interleaves all 8 released domains with the existing round-robin", () => {
  const queue = buildSessionQueue(catalog, {}, { size: 10, day: "2026-10-01", interleave: true, seed: 3 });
  const domains = queue.map((id) => getRelationById(id, catalog).domain);
  assert.deepEqual(domains.slice(0, 8), DOMAIN_ORDER);
  const session = startSession({ mode: "daily", day: "2026-10-01", catalog, relations: {}, seed: 3 });
  assert.equal(new Set(session.queue.map((id) => getRelationById(id, catalog).domain)).size, 8);
  // Fresh relations still enter tier 1 first inside a new domain.
  for (const domain of V04) {
    const first = queue.find((id) => getRelationById(id, catalog).domain === domain);
    assert.equal(getRelationById(first, catalog).tier, 1, domain);
  }
});

test("focused training selects each new domain on its own", () => {
  for (const domain of V04) {
    const session = startSession({ mode: "focused", domain, day: "2026-10-01", catalog, relations: {}, seed: 9 });
    assert.equal(session.queue.length, Math.min(10, V04_COUNTS[domain]), domain);
    assert.ok(session.queue.every((id) => getRelationById(id, catalog).domain === domain), domain);
    // A right answer goes through the unchanged session path.
    const peeked = peekCurrent(session, catalog);
    const result = submitAnswer({ item: peeked.item, state: emptyLearner(), session: peeked.session, raw: peeked.item.canonical_answer, meta });
    assert.equal(result.judged.kind, "correct", domain);
    assert.equal(result.state.relations[peeked.item.id].attempts.length, 1);
  }
});

test("mistake book groups new-domain mistakes by domain with no new logic", () => {
  let state = emptyLearner();
  for (const [domain, id, wrong] of [["cubes", "cube-7", "21"], ["complements", "comp-37", "73"], ["squares", "square-6", "12"]]) {
    let session = startSession({ mode: "focused", domain, day: "2026-10-01", catalog, relations: state.relations, seed: 1 });
    session = { ...session, queue: [id, ...session.queue.filter((q) => q !== id)] };
    const peeked = peekCurrent(session, catalog);
    const result = submitAnswer({ item: peeked.item, state, session: peeked.session, raw: wrong, meta });
    assert.equal(result.judged.kind, "wrong", id);
    assert.equal(result.feedback.relation, getRelationById(id, catalog).relation);
    state = result.state;
  }
  const book = buildMistakeBook(catalog, state.relations);
  assert.deepEqual(book.groups.map((g) => g.domain), ["squares", "complements", "cubes"]);
  assert.deepEqual(book.groups.map((g) => g.items.map((i) => i.id)), [["square-6"], ["comp-37"], ["cube-7"]]);
  assert.equal(book.total, 3);
  // Empty groups (halves, powers, special_products, …) are not shown.
  assert.equal(book.groups.some((g) => g.items.length === 0), false);
});
