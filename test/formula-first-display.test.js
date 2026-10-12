import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { generateExercise } from "../src/core/grade7-rational-generator.js";
import {
  FORMULA_FIRST_SKILL_ID,
  absDisplayModel,
  displayAriaLabelFor,
  displayPromptFor,
  displayRelationAriaLabelFor,
  displayRelationFor,
  formatAddendTerm,
  formatOperandTerm,
  formulaFirstDisplayFor,
  formulaFirstUiBindings,
  isFormulaFirstExercise,
  isUnaryAbs,
  isUnaryOpposite,
  oppositeDisplayModel,
  speakRational,
} from "../src/core/formula-first-display.js";
import { createTrainingFlow } from "../app/pages/train/flow.js";
import { createMemoryStore, emptyState } from "../src/core/store.js";

const SKILL = "g7-rational-sign-opposite-absolute";
const DAY = "2026-10-12";

function exerciseAt(seed, index, band = "standard") {
  return generateExercise({ skillId: SKILL, band, seed, index });
}

test("formatOperandTerm matches identity prompt: negatives in parentheses", () => {
  assert.equal(formatOperandTerm({ numerator: 4, denominator: 5 }), "4/5");
  assert.equal(formatOperandTerm({ numerator: -4, denominator: 5 }), "(-4/5)");
  assert.equal(formatOperandTerm({ numerator: 6, denominator: 1 }), "6");
  assert.equal(formatOperandTerm({ numerator: -8, denominator: 1 }), "(-8)");
});

test("formatAddendTerm parentheses only for negative answers", () => {
  assert.equal(formatAddendTerm("4/5"), "4/5");
  assert.equal(formatAddendTerm("-4/5"), "(-4/5)");
  assert.equal(formatAddendTerm("6"), "6");
  assert.equal(formatAddendTerm("-6"), "(-6)");
});

test("opposite display for 4/5 shows equation blank and Chinese a11y", () => {
  const model = oppositeDisplayModel(
    { kind: "unary", operator: "opposite", value: { numerator: 4, denominator: 5 } },
    "-4/5",
  );
  assert.equal(model.visibleFormula, "4/5 + □ = 0");
  assert.equal(model.revealedRelation, "4/5 + (-4/5) = 0");
  assert.equal(model.ariaLabel, "五分之四加上一个数等于零。");
  assert.equal(speakRational({ numerator: 4, denominator: 5 }), "五分之四");
});

test("opposite display for -4/5 and -2/5", () => {
  const model = oppositeDisplayModel(
    { kind: "unary", operator: "opposite", value: { numerator: -4, denominator: 5 } },
    "4/5",
  );
  assert.equal(model.visibleFormula, "(-4/5) + □ = 0");
  assert.equal(model.revealedRelation, "(-4/5) + 4/5 = 0");

  const spoken = oppositeDisplayModel(
    { kind: "unary", operator: "opposite", value: { numerator: -2, denominator: 5 } },
    "2/5",
  );
  assert.equal(spoken.ariaLabel, "负五分之二加上一个数等于零。");
});

test("opposite display for positive and negative integers", () => {
  const pos = oppositeDisplayModel(
    { kind: "unary", operator: "opposite", value: { numerator: 6, denominator: 1 } },
    "-6",
  );
  assert.equal(pos.visibleFormula, "6 + □ = 0");
  assert.equal(pos.revealedRelation, "6 + (-6) = 0");
  assert.equal(pos.ariaLabel, "六加上一个数等于零。");

  const neg = oppositeDisplayModel(
    { kind: "unary", operator: "opposite", value: { numerator: -8, denominator: 1 } },
    "8",
  );
  assert.equal(neg.visibleFormula, "(-8) + □ = 0");
  assert.equal(neg.revealedRelation, "(-8) + 8 = 0");
  assert.equal(neg.ariaLabel, "负八加上一个数等于零。");
});

test("abs stays vertical-bar form and does not become sum-to-zero", () => {
  const model = absDisplayModel(
    { kind: "unary", operator: "abs", value: { numerator: -5, denominator: 6 } },
    "5/6",
  );
  assert.equal(model.visibleFormula, "|-5/6| = ?");
  assert.equal(model.revealedRelation, "|-5/6| = 5/6");
  assert.equal(model.ariaLabel, "负六分之五的绝对值等于多少。");
  assert.equal(model.revealedAriaLabel, "负六分之五的绝对值等于六分之五。");

  const pos = absDisplayModel(
    { kind: "unary", operator: "abs", value: { numerator: 5, denominator: 6 } },
    "5/6",
  );
  assert.equal(pos.visibleFormula, "|5/6| = ?");
  assert.equal(pos.ariaLabel, "六分之五的绝对值等于多少。");
  assert.equal(pos.revealedAriaLabel, "六分之五的绝对值等于六分之五。");

  assert.equal(
    oppositeDisplayModel({ kind: "unary", operator: "abs", value: { numerator: -5, denominator: 6 } }, "5/6"),
    null,
  );
});

test("predicates only match unary opposite / abs", () => {
  assert.equal(isUnaryOpposite({ operands: { kind: "unary", operator: "opposite", value: { numerator: 1, denominator: 2 } } }), true);
  assert.equal(isUnaryAbs({ operands: { kind: "unary", operator: "abs", value: { numerator: 1, denominator: 2 } } }), true);
  assert.equal(isUnaryOpposite({ operands: { kind: "unary", operator: "abs", value: { numerator: 1, denominator: 2 } } }), false);
  assert.equal(isUnaryOpposite({ operands: { kind: "binary", operator: "add" } }), false);
});

test("display layer never changes generator identity for opposite coordinates", () => {
  let opposite = null;
  let oppositeIndex = -1;
  let abs = null;
  for (let index = 0; index < 40; index += 1) {
    const ex = exerciseAt("identity-lock", index);
    if (!opposite && ex.operands.operator === "opposite") {
      opposite = ex;
      oppositeIndex = index;
    }
    if (!abs && ex.operands.operator === "abs") abs = ex;
    if (opposite && abs) break;
  }
  assert.ok(opposite);
  assert.ok(abs);

  const again = generateExercise({
    skillId: opposite.skill_id,
    band: opposite.band,
    seed: "identity-lock",
    index: oppositeIndex,
  });
  assert.equal(again.prompt, opposite.prompt);
  assert.equal(again.canonical_answer, opposite.canonical_answer);
  assert.deepEqual(again.operands, opposite.operands);
  assert.equal(again.checksum, opposite.checksum);
  assert.equal(again.id, opposite.id);
  assert.deepEqual(again.explanations, opposite.explanations);

  const model = oppositeDisplayModel(opposite.operands, opposite.canonical_answer);
  assert.match(model.visibleFormula, / \+ □ = 0$/);
  assert.equal(model.visibleFormula.includes("的相反数"), false);
  assert.notEqual(model.revealedRelation, opposite.prompt.replace(/\?\s*$/, opposite.canonical_answer));

  const absModel = absDisplayModel(abs.operands);
  assert.equal(absModel.visibleFormula, abs.prompt);
});

test("training flow: opposite fraction blank accepts -4/5 and reveals formula relation", () => {
  // Find a coordinate whose known value is 4/5 (answer -4/5).
  let seed = null;
  let index = null;
  for (let s = 0; s < 200 && seed === null; s += 1) {
    for (let i = 0; i < 10; i += 1) {
      const ex = exerciseAt(`find-4-5-${s}`, i, "standard");
      if (
        ex.operands.operator === "opposite"
        && ex.operands.value.numerator === 4
        && ex.operands.value.denominator === 5
      ) {
        seed = `find-4-5-${s}`;
        index = i;
        break;
      }
    }
  }
  assert.ok(seed !== null, "expected a 4/5 opposite sample");

  const store = createMemoryStore(emptyState({ learnerId: "L-formula-4-5", createdOn: DAY }));
  const flow = createTrainingFlow({
    store,
    today: () => DAY,
    clock: () => 1,
    now: () => 100,
  });
  // Begin a 10-item session then walk to the matching index by answering earlier ones correctly.
  flow.beginSkill(SKILL, "standard", seed);
  for (let step = 0; step < index; step += 1) {
    const item = flow.view().item;
    const answer = item.canonical_answer;
    if (item.answer_type === "signed_fraction_fields") {
      if (answer.startsWith("-")) flow.toggleSign();
      const [num, den] = answer.replace("-", "").split("/");
      for (const d of num) flow.input(d);
      flow.focus("denominator");
      for (const d of den) flow.input(d);
    } else {
      if (answer.startsWith("-")) flow.toggleSign();
      for (const d of answer.replace("-", "")) flow.input(d);
    }
    assert.equal(flow.submit(), "correct");
    assert.equal(flow.advance(), "train");
  }

  const item = flow.view().item;
  assert.equal(item.operands.operator, "opposite");
  assert.deepEqual(item.operands.value, { numerator: 4, denominator: 5 });
  assert.equal(item.prompt, "4/5 的相反数是？");
  assert.equal(isUnaryOpposite(item), true);

  const model = oppositeDisplayModel(item.operands, item.canonical_answer);
  assert.equal(model.visibleFormula, "4/5 + □ = 0");

  flow.toggleSign();
  flow.input("4");
  flow.focus("denominator");
  flow.input("5");
  assert.equal(flow.submit(), "correct");
  assert.equal(flow.view().feedback.relation, "4/5 + (-4/5) = 0");
});

test("training flow: -4/5 opposite accepts blank sign or + as positive 4/5", () => {
  let seed = null;
  let index = null;
  for (let s = 0; s < 200 && seed === null; s += 1) {
    for (let i = 0; i < 10; i += 1) {
      const ex = exerciseAt(`find-n4-5-${s}`, i, "standard");
      if (
        ex.operands.operator === "opposite"
        && ex.operands.value.numerator === -4
        && ex.operands.value.denominator === 5
      ) {
        seed = `find-n4-5-${s}`;
        index = i;
        break;
      }
    }
  }
  assert.ok(seed !== null, "expected a -4/5 opposite sample");

  function answerUpTo(flow, stopIndex) {
    for (let step = 0; step < stopIndex; step += 1) {
      const item = flow.view().item;
      const answer = item.canonical_answer;
      if (item.answer_type === "signed_fraction_fields") {
        if (answer.startsWith("-")) flow.toggleSign();
        const [num, den] = answer.replace("-", "").split("/");
        for (const d of num) flow.input(d);
        flow.focus("denominator");
        for (const d of den) flow.input(d);
      } else {
        if (answer.startsWith("-")) flow.toggleSign();
        for (const d of answer.replace("-", "")) flow.input(d);
      }
      assert.equal(flow.submit(), "correct");
      assert.equal(flow.advance(), "train");
    }
  }

  // blank sign → positive
  {
    const store = createMemoryStore(emptyState({ learnerId: "L-blank-sign", createdOn: DAY }));
    const flow = createTrainingFlow({ store, today: () => DAY, clock: () => 2, now: () => 100 });
    flow.beginSkill(SKILL, "standard", seed);
    answerUpTo(flow, index);
    const item = flow.view().item;
    assert.equal(item.canonical_answer, "4/5");
    flow.input("4");
    flow.focus("denominator");
    flow.input("5");
    assert.equal(flow.submit(), "correct");
    assert.equal(flow.view().feedback.relation, "(-4/5) + 4/5 = 0");
  }

  // explicit + → positive
  {
    const store = createMemoryStore(emptyState({ learnerId: "L-plus-sign", createdOn: DAY }));
    const flow = createTrainingFlow({ store, today: () => DAY, clock: () => 3, now: () => 100 });
    flow.beginSkill(SKILL, "standard", seed);
    answerUpTo(flow, index);
    flow.toggleSign(); // -
    flow.toggleSign(); // +
    flow.input("4");
    flow.focus("denominator");
    flow.input("5");
    assert.equal(flow.submit(), "correct");
  }
});

test("sign-only submit does not record an attempt; digits then judge", () => {
  const store = createMemoryStore(emptyState({ learnerId: "L-sign-only", createdOn: DAY }));
  const flow = createTrainingFlow({ store, today: () => DAY, clock: () => 4, now: () => 100 });
  flow.beginSkill(SKILL, "standard", "seq-1");
  // seq-1 index 0 is opposite of 1/10 → answer -1/10
  assert.equal(flow.view().item.canonical_answer, "-1/10");
  flow.toggleSign(); // only "-"
  assert.equal(flow.submit(), "nudge");
  assert.equal(flow.view().screen, "train");
  assert.equal(flow.state.skills?.[SKILL]?.attempts?.length || 0, 0);

  flow.toggleSign(); // "+"
  assert.equal(flow.submit(), "nudge");
  assert.equal(flow.state.skills?.[SKILL]?.attempts?.length || 0, 0);

  flow.toggleSign(); // back to blank
  flow.toggleSign(); // "-"
  flow.input("1");
  flow.focus("denominator");
  flow.input("1");
  flow.input("0");
  assert.equal(flow.submit(), "correct");
  assert.equal(flow.view().feedback.relation, "1/10 + (-1/10) = 0");
});

test("|-5/6| stays abs form and accepts positive 5/6 by default", () => {
  let seed = null;
  let index = null;
  for (let s = 0; s < 300 && seed === null; s += 1) {
    for (let i = 0; i < 10; i += 1) {
      const ex = exerciseAt(`find-abs-56-${s}`, i, "standard");
      if (
        ex.operands.operator === "abs"
        && ex.operands.value.numerator === -5
        && ex.operands.value.denominator === 6
      ) {
        seed = `find-abs-56-${s}`;
        index = i;
        break;
      }
    }
  }
  assert.ok(seed !== null, "expected |-5/6| sample");

  const store = createMemoryStore(emptyState({ learnerId: "L-abs-56", createdOn: DAY }));
  const flow = createTrainingFlow({ store, today: () => DAY, clock: () => 5, now: () => 100 });
  flow.beginSkill(SKILL, "standard", seed);
  for (let step = 0; step < index; step += 1) {
    const item = flow.view().item;
    const answer = item.canonical_answer;
    if (item.answer_type === "signed_fraction_fields") {
      if (answer.startsWith("-")) flow.toggleSign();
      const [num, den] = answer.replace("-", "").split("/");
      for (const d of num) flow.input(d);
      flow.focus("denominator");
      for (const d of den) flow.input(d);
    } else {
      if (answer.startsWith("-")) flow.toggleSign();
      for (const d of answer.replace("-", "")) flow.input(d);
    }
    assert.equal(flow.submit(), "correct");
    assert.equal(flow.advance(), "train");
  }

  const item = flow.view().item;
  assert.equal(item.prompt, "|-5/6| = ?");
  assert.equal(isUnaryAbs(item), true);
  assert.equal(absDisplayModel(item.operands).visibleFormula, "|-5/6| = ?");
  assert.equal(flow.view().fields.sign, "");
  flow.input("5");
  flow.focus("denominator");
  flow.input("6");
  assert.equal(flow.submit(), "correct");
  // abs reveal keeps identity-style relation (not sum-to-zero)
  assert.equal(flow.view().feedback.relation, "|-5/6| = 5/6");
});

test("shared train page wires formula-first helpers into stem and feedback", () => {
  const page = readFileSync(new URL("../app/pages/train/index.jsx", import.meta.url), "utf8");
  const css = readFileSync(new URL("../app/app.css", import.meta.url), "utf8");
  const session = readFileSync(new URL("../src/core/skill-session.js", import.meta.url), "utf8");
  const mathText = readFileSync(new URL("../app/components/math/MathText.jsx", import.meta.url), "utf8");
  const correct = readFileSync(new URL("../app/components/CorrectFeedback.jsx", import.meta.url), "utf8");
  const wrong = readFileSync(new URL("../app/components/WrongFeedback.jsx", import.meta.url), "utf8");
  assert.match(page, /formulaFirstDisplayFor/);
  assert.match(page, /displayAriaLabelFor/);
  assert.match(page, /displayRelationAriaLabelFor/);
  assert.match(page, /formulaFirstUiBindings/);
  assert.match(page, /displayPromptFor/);
  assert.match(page, /formula-equation/);
  assert.match(page, /is-formula-term/);
  assert.match(css, /\.formula-equation/);
  assert.match(session, /displayRelationFor/);
  assert.match(mathText, /ariaLabel/);
  // H5/mini compile may rewrite call-site ariaLabel → aria-label; MathText must read both.
  assert.match(mathText, /ariaLabel \?\? .*\[\"aria-label\"\]/);
  assert.match(correct, /relationAriaLabel/);
  assert.match(wrong, /promptAriaLabel/);
  assert.match(wrong, /relationAriaLabel/);
});

test("abs display and reveal do not depend on prompt text", () => {
  const base = {
    skill_id: SKILL,
    band: "standard",
    seed: "prompt-independent",
    index: 0,
    prompt: "|-5/6| = ?",
    canonical_answer: "5/6",
    operands: { kind: "unary", operator: "abs", value: { numerator: -5, denominator: 6 } },
  };
  const sabotaged = { ...base, prompt: "UNRELATED GARBAGE ??? do not parse me" };
  assert.equal(displayPromptFor(sabotaged), "|-5/6| = ?");
  assert.equal(displayRelationFor(sabotaged), "|-5/6| = 5/6");
  assert.equal(displayAriaLabelFor(sabotaged), "负六分之五的绝对值等于多少。");
  assert.equal(displayRelationAriaLabelFor(sabotaged), "负六分之五的绝对值等于六分之五。");
  assert.equal(displayPromptFor(base), displayPromptFor(sabotaged));
  assert.equal(displayRelationFor(base), displayRelationFor(sabotaged));
});

test("opposite display also ignores a sabotaged prompt", () => {
  const base = {
    skill_id: SKILL,
    prompt: "4/5 的相反数是？",
    canonical_answer: "-4/5",
    operands: { kind: "unary", operator: "opposite", value: { numerator: 4, denominator: 5 } },
  };
  const sabotaged = { ...base, prompt: "please ignore this identity stem" };
  assert.equal(displayPromptFor(sabotaged), "4/5 + □ = 0");
  assert.equal(displayRelationFor(sabotaged), "4/5 + (-4/5) = 0");
  assert.equal(displayAriaLabelFor(sabotaged), "五分之四加上一个数等于零。");
  assert.equal(displayRelationAriaLabelFor(sabotaged), "五分之四加上负五分之四等于零。");
});

test("non-target skill_id with same unary opposite operands is not rewritten", () => {
  const foreign = {
    skill_id: "g7-rational-add-subtract",
    prompt: "keep-me-as-prompt 的相反数是？",
    canonical_answer: "-4/5",
    operands: { kind: "unary", operator: "opposite", value: { numerator: 4, denominator: 5 } },
  };
  assert.equal(isUnaryOpposite(foreign), true);
  assert.equal(isFormulaFirstExercise(foreign), false);
  assert.equal(formulaFirstDisplayFor(foreign), null);
  assert.equal(formulaFirstUiBindings(foreign), null);
  assert.equal(displayPromptFor(foreign), "keep-me-as-prompt 的相反数是？");
  assert.equal(displayRelationFor(foreign), "keep-me-as-prompt 的相反数是？".replace(/\?\s*$/, "-4/5"));
  assert.equal(displayAriaLabelFor(foreign), null);
  assert.equal(displayRelationAriaLabelFor(foreign), null);
});

test("ui bindings: abs and opposite train stems carry contract ariaLabel", () => {
  const absEx = {
    skill_id: FORMULA_FIRST_SKILL_ID,
    prompt: "|-5/6| = ?",
    canonical_answer: "5/6",
    operands: { kind: "unary", operator: "abs", value: { numerator: -5, denominator: 6 } },
  };
  const oppEx = {
    skill_id: FORMULA_FIRST_SKILL_ID,
    prompt: "4/5 的相反数是？",
    canonical_answer: "-4/5",
    operands: { kind: "unary", operator: "opposite", value: { numerator: 4, denominator: 5 } },
  };
  const absUi = formulaFirstUiBindings(absEx);
  assert.equal(absUi.kind, "unary_abs");
  assert.equal(absUi.stemText, "|-5/6| = ?");
  assert.equal(absUi.stemAriaLabel, "负六分之五的绝对值等于多少。");
  assert.equal(absUi.relationText, "|-5/6| = 5/6");
  assert.equal(absUi.relationAriaLabel, "负六分之五的绝对值等于六分之五。");
  assert.match(absUi.stemAriaLabel, /绝对值/);
  assert.equal(/竖线|斜线|问号/.test(absUi.stemAriaLabel), false);
  assert.equal(/竖线|斜线|问号/.test(absUi.relationAriaLabel), false);

  const oppUi = formulaFirstUiBindings(oppEx);
  assert.equal(oppUi.kind, "unary_opposite");
  assert.equal(oppUi.stemAriaLabel, "五分之四加上一个数等于零。");
  assert.equal(oppUi.relationAriaLabel, "五分之四加上负五分之四等于零。");
});

test("CorrectFeedback and WrongFeedback receive contract relation SR via ui bindings", () => {
  // Simulate the props train/index.jsx builds for feedback screens.
  function correctFeedbackProps(item, feedback) {
    return {
      relation: feedback?.relation || displayRelationFor(item),
      relationAriaLabel: displayRelationAriaLabelFor(item) || undefined,
    };
  }
  function wrongFeedbackProps(item, feedback) {
    const ui = formulaFirstUiBindings(item);
    return {
      prompt: displayPromptFor(item),
      promptAriaLabel: ui?.stemAriaLabel || undefined,
      feedback,
      relationAriaLabel: ui?.relationAriaLabel || undefined,
    };
  }

  const absItem = {
    skill_id: SKILL,
    prompt: "IGNORED",
    canonical_answer: "5/6",
    operands: { kind: "unary", operator: "abs", value: { numerator: -5, denominator: 6 } },
  };
  const oppItem = {
    skill_id: SKILL,
    prompt: "IGNORED",
    canonical_answer: "-4/5",
    operands: { kind: "unary", operator: "opposite", value: { numerator: 4, denominator: 5 } },
  };

  const absCorrect = correctFeedbackProps(absItem, { relation: displayRelationFor(absItem) });
  assert.equal(absCorrect.relation, "|-5/6| = 5/6");
  assert.equal(absCorrect.relationAriaLabel, "负六分之五的绝对值等于六分之五。");

  const absWrong = wrongFeedbackProps(absItem, { relation: displayRelationFor(absItem) });
  assert.equal(absWrong.prompt, "|-5/6| = ?");
  assert.equal(absWrong.promptAriaLabel, "负六分之五的绝对值等于多少。");
  assert.equal(absWrong.relationAriaLabel, "负六分之五的绝对值等于六分之五。");

  const oppCorrect = correctFeedbackProps(oppItem, { relation: displayRelationFor(oppItem) });
  assert.equal(oppCorrect.relation, "4/5 + (-4/5) = 0");
  assert.equal(oppCorrect.relationAriaLabel, "五分之四加上负五分之四等于零。");

  const oppWrong = wrongFeedbackProps(oppItem, { relation: displayRelationFor(oppItem) });
  assert.equal(oppWrong.prompt, "4/5 + □ = 0");
  assert.equal(oppWrong.promptAriaLabel, "五分之四加上一个数等于零。");
  assert.equal(oppWrong.relationAriaLabel, "五分之四加上负五分之四等于零。");
});

test("training flow feedback relation for abs uses operands-derived reveal", () => {
  let seed = null;
  let index = null;
  for (let s = 0; s < 300 && seed === null; s += 1) {
    for (let i = 0; i < 10; i += 1) {
      const ex = exerciseAt(`find-abs-sr-${s}`, i, "standard");
      if (
        ex.operands.operator === "abs"
        && ex.operands.value.numerator === -5
        && ex.operands.value.denominator === 6
      ) {
        seed = `find-abs-sr-${s}`;
        index = i;
        break;
      }
    }
  }
  assert.ok(seed !== null, "expected |-5/6| sample");

  const store = createMemoryStore(emptyState({ learnerId: "L-abs-sr", createdOn: DAY }));
  const flow = createTrainingFlow({ store, today: () => DAY, clock: () => 6, now: () => 100 });
  flow.beginSkill(SKILL, "standard", seed);
  for (let step = 0; step < index; step += 1) {
    const item = flow.view().item;
    const answer = item.canonical_answer;
    if (item.answer_type === "signed_fraction_fields") {
      if (answer.startsWith("-")) flow.toggleSign();
      const [num, den] = answer.replace("-", "").split("/");
      for (const d of num) flow.input(d);
      flow.focus("denominator");
      for (const d of den) flow.input(d);
    } else {
      if (answer.startsWith("-")) flow.toggleSign();
      for (const d of answer.replace("-", "")) flow.input(d);
    }
    assert.equal(flow.submit(), "correct");
    assert.equal(flow.advance(), "train");
  }

  const item = flow.view().item;
  const bindings = formulaFirstUiBindings(item);
  assert.equal(bindings.stemAriaLabel, "负六分之五的绝对值等于多少。");
  flow.input("5");
  flow.focus("denominator");
  flow.input("6");
  assert.equal(flow.submit(), "correct");
  assert.equal(flow.view().feedback.relation, "|-5/6| = 5/6");
  assert.equal(displayRelationAriaLabelFor(item), "负六分之五的绝对值等于六分之五。");
});
