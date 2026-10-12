import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

import {
  completeDomainCatalog,
  listProductPracticeVariants,
  loadCoreCatalog,
  resolvePracticeVariant,
} from "../src/core/content.js";
import { emptyLearner } from "../src/core/store.js";
import { listCurrentMistakeIds } from "../src/core/mistakes.js";
import {
  FAMILY_SPACING_GAP,
  finishReferenceSession,
  isReferenceSession,
  peekReferenceItem,
  startReferenceSession,
  submitReferenceAnswer,
} from "../src/core/reference-session.js";

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

test("reference session builds a deterministic 10-item queue from the complete domain catalog", () => {
  const domain = "halves";
  const a = startReferenceSession({ domain, day: "2026-10-12", seed: "ref-seed-1" });
  const b = startReferenceSession({ domain, day: "2026-10-12", seed: "ref-seed-1" });
  assert.equal(a.queue.length, 10);
  assert.deepEqual(a.queue, b.queue);
  assert.equal(isReferenceSession(a), true);
  const catalog = completeDomainCatalog(domain);
  assert.ok(a.queue.every((id) => catalog.some((item) => item.id === id)));
  const other = startReferenceSession({ domain, day: "2026-10-12", seed: "ref-seed-2" });
  assert.notDeepEqual(a.queue, other.queue);
});

test("product reference sessions queue stable practice_variant_id values", () => {
  const session = startReferenceSession({
    domain: "products",
    day: "2026-10-12",
    seed: "product-variants",
  });
  assert.equal(session.queue.length, 10);
  assert.equal(session.usesVariants, true);
  assert.equal(session.title, "乘除关系练习");
  assert.equal(session.subtitle, "从乘积反推因数，也从因数得到乘积");
  const all = new Set(listProductPracticeVariants().map((v) => v.practice_variant_id));
  assert.ok(session.queue.every((id) => all.has(id)));
  assert.ok(session.queue.some((id) => id.endsWith(":multiply") || id.includes(":divide-")));

  const again = startReferenceSession({
    domain: "products",
    day: "2026-10-12",
    seed: "product-variants",
  });
  assert.deepEqual(again.queue, session.queue);
});

test("product queue keeps ≥2 answered-item spacing between same-family variants", () => {
  const seeds = ["gap-a", "gap-b", "gap-c", "gap-d", "gap-e", "gap-f", "gap-g", "gap-h"];
  const byId = new Map(listProductPracticeVariants().map((v) => [v.practice_variant_id, v]));
  for (const seed of seeds) {
    const session = startReferenceSession({ domain: "products", day: "2026-10-12", seed });
    for (let i = 0; i < session.queue.length; i += 1) {
      for (let j = i + 1; j < session.queue.length; j += 1) {
        const a = byId.get(session.queue[i]);
        const b = byId.get(session.queue[j]);
        if (a.family_key === b.family_key) {
          assert.ok(
            j - i >= FAMILY_SPACING_GAP + 1,
            `seed ${seed}: ${a.practice_variant_id} and ${b.practice_variant_id} too close (${j - i})`,
          );
        }
      }
    }
  }
});

test("product peek resolves multiply and both division directions", () => {
  const catalog = completeDomainCatalog("products");
  const family = catalog.find((item) => item.semantic_key === "product:7:8");
  const variants = family.practice_variants;
  assert.equal(variants.length, 3);
  const session = {
    domain: "products",
    usesVariants: true,
    queue: variants.map((v) => v.practice_variant_id),
    cursor: 0,
    answered: 0,
    reappearPlan: {},
    reappearCount: {},
  };
  const prompts = [];
  for (let i = 0; i < 3; i += 1) {
    const peeked = peekReferenceItem({ ...session, cursor: i }, catalog);
    prompts.push(peeked.item.prompt);
    assert.equal(peeked.item.practice_variant_id, variants[i].practice_variant_id);
    assert.equal(peeked.item.canonical_answer, variants[i].canonical_answer);
  }
  assert.deepEqual(prompts.sort(), ["56 ÷ 7 = ?", "56 ÷ 8 = ?", "7 × 8 = ?"].sort());
});

test("reference judging records outcomes but leaves mastery, mistakes and schedules untouched", () => {
  const coreId = loadCoreCatalog().find((item) => item.domain === "products").id;
  let state = {
    ...emptyLearner(),
    relations: {
      [coreId]: {
        status: "learning",
        attempts: [{ correct: true, day: "2026-10-11", at: 1 }],
        schedule: { due_day: "2026-10-20", interval_days: 9 },
      },
    },
  };
  const before = clone(state);
  let session = startReferenceSession({
    domain: "products",
    day: "2026-10-12",
    seed: "ref-judge",
  });
  const catalog = completeDomainCatalog("products");

  for (let i = 0; i < 3; i += 1) {
    const peeked = peekReferenceItem(session, catalog);
    session = peeked.session;
    const item = peeked.item;
    const result = submitReferenceAnswer({
      item,
      state,
      session,
      raw: "99999",
      meta: { day: "2026-10-12", inputMode: "onscreen_keypad", mixedInput: false, elapsedMs: 100 },
      catalog,
    });
    assert.equal(result.feedback.record, true);
    assert.ok(result.session.outcomes.at(-1).practice_variant_id);
    state = result.state;
    session = result.session;
  }

  const finished = finishReferenceSession(state, session, { earlyStop: true });
  state = finished.state;

  assert.deepEqual(state.relations, before.relations);
  assert.deepEqual(state.skills || {}, before.skills || {});
  assert.equal(JSON.stringify(state.relations), JSON.stringify(before.relations));
  assert.equal(
    listCurrentMistakeIds(loadCoreCatalog(), state.relations).length,
    listCurrentMistakeIds(loadCoreCatalog(), before.relations).length,
  );
  assert.equal(finished.summary.title, "乘除关系练习");
  assert.equal(finished.summary.subtitle, "从乘积反推因数，也从因数得到乘积");
  assert.equal(finished.summary.mode, "reference");
  assert.equal(state.activeSession, null);
});

test("wrong answers reappear after two answered items inside the reference session only", () => {
  const catalog = completeDomainCatalog("halves");
  let session = startReferenceSession({ domain: "halves", day: "2026-10-12", seed: "reappear", size: 10 });
  let state = emptyLearner();
  const first = peekReferenceItem(session, catalog);
  session = first.session;
  const wrongId = first.item.id;
  let result = submitReferenceAnswer({
    item: first.item,
    state,
    session,
    raw: "0",
    meta: { day: "2026-10-12", inputMode: "onscreen_keypad", mixedInput: false, elapsedMs: 50 },
    catalog,
  });
  state = result.state;
  session = result.session;
  assert.equal(result.judged.kind, "wrong");

  for (let i = 0; i < 2; i += 1) {
    const peeked = peekReferenceItem(session, catalog);
    session = peeked.session;
    assert.notEqual(peeked.item.id, wrongId, `gap item ${i}`);
    result = submitReferenceAnswer({
      item: peeked.item,
      state,
      session,
      raw: peeked.item.canonical_answer,
      meta: { day: "2026-10-12", inputMode: "onscreen_keypad", mixedInput: false, elapsedMs: 40 },
      catalog,
    });
    state = result.state;
    session = result.session;
  }

  const again = peekReferenceItem(session, catalog);
  assert.equal(again.item.id, wrongId);
  assert.equal(again.revisit, true);
  assert.deepEqual(state.relations, {});
});

test("square reference presentation uses arithmetic root for inverse items", () => {
  const catalog = completeDomainCatalog("squares");
  const inverse = catalog.find((item) => item.semantic_key === "square:inverse:12");
  let session = startReferenceSession({
    domain: "squares",
    day: "2026-10-12",
    seed: "sqrt",
    catalog: [inverse],
    size: 1,
  });
  const peeked = peekReferenceItem(session, catalog);
  assert.equal(peeked.item.prompt, "√144 = ?");
  assert.equal(peeked.item.canonical_answer, "12");
});
