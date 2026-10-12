import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { judgeAnswer } from "../src/core/answer.js";
import {
  emptySignedFields,
  eraseSignedDigit,
  focusSignedField,
  signedFieldsAnswer,
  toggleSignedSign,
  typeSignedDigit,
} from "../src/core/signed-fraction-fields.js";

test("signed integer judging normalizes one leading sign and zeros", () => {
  const item = { answer_type: "signed_integer", canonical_answer: "-7" };
  assert.equal(judgeAnswer(item, "-07").kind, "correct");
  assert.equal(judgeAnswer(item, "-7.0").kind, "correct", "keeps the existing integer .0 equivalence");
  assert.equal(judgeAnswer(item, "7").kind, "wrong");
  for (const raw of ["", "-", "+", "--7", "7-"]) {
    assert.equal(judgeAnswer(item, raw).outcome, null, raw);
  }
});

test("signed fraction judging keeps sign on the whole rational", () => {
  const negativeHalf = { answer_type: "signed_fraction_fields", canonical_answer: "-1/2" };
  assert.deepEqual(judgeAnswer(negativeHalf, "-01/02"), {
    kind: "correct",
    normalized: "-1/2",
    outcome: "correct",
  });
  assert.deepEqual(judgeAnswer(negativeHalf, "-2/4"), {
    kind: "needs_simplification",
    normalized: "-2/4",
    simplest: "-1/2",
    outcome: "needs_simplification",
  });
  assert.equal(judgeAnswer(negativeHalf, "1/-2").outcome, null);
  assert.equal(judgeAnswer(negativeHalf, "--1/2").outcome, null);
  assert.equal(judgeAnswer(negativeHalf, "1/0").outcome, null);
});

test("zero may be written over a non-zero denominator and normalizes to zero", () => {
  const zero = { answer_type: "signed_fraction_fields", canonical_answer: "0" };
  assert.deepEqual(judgeAnswer(zero, "-0/9"), {
    kind: "correct",
    normalized: "0",
    outcome: "correct",
  });
});

test("very long safe fields fail closed instead of overflowing during comparison", () => {
  const item = {
    answer_type: "signed_fraction_fields",
    canonical_answer: "888888888888887/999999999999999",
  };
  assert.doesNotThrow(() => judgeAnswer(item, "999999999999999/999999999999998"));
  assert.equal(judgeAnswer(item, "999999999999999/999999999999998").outcome, null);
});

test("signed fraction fields toggle sign without putting a sign in either box", () => {
  let fields = emptySignedFields();
  fields = toggleSignedSign(fields);
  assert.deepEqual(fields, { negative: true, numerator: "", denominator: "", focus: "numerator" });
  assert.equal(signedFieldsAnswer(fields), "", "a sign alone is not an attempt");

  fields = typeSignedDigit(fields, "0");
  fields = typeSignedDigit(fields, "2");
  fields = focusSignedField(fields, "denominator");
  fields = typeSignedDigit(fields, "0");
  fields = typeSignedDigit(fields, "4");
  assert.equal(signedFieldsAnswer(fields), "-2/4");
  assert.equal(typeSignedDigit(fields, "-"), null, "the denominator never accepts a sign");

  fields = eraseSignedDigit(fields);
  assert.equal(fields.denominator, "");
  fields = toggleSignedSign(fields);
  assert.equal(fields.negative, false);
});

test("shared UI exposes a visible ± key and H5 maps minus keys to the same action", () => {
  const keypad = readFileSync(new URL("../app/components/Keypad.jsx", import.meta.url), "utf8");
  const page = readFileSync(new URL("../app/pages/train/index.jsx", import.meta.url), "utf8");
  const h5 = readFileSync(new URL("../app/platform/h5/index.js", import.meta.url), "utf8");
  assert.match(keypad, /signKey/);
  assert.match(keypad, /切换正负号/);
  assert.match(page, /SignedFractionFields/);
  assert.match(page, /flow\.toggleSign/);
  assert.match(h5, /event\.key === "-"/);
  assert.match(h5, /event\.key === "Subtract"/);
  assert.match(h5, /toggle-sign/);
});
