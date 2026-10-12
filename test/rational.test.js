import assert from "node:assert/strict";
import test from "node:test";

import {
  abs,
  add,
  compare,
  divide,
  formatRational,
  multiply,
  negate,
  parseRational,
  power,
  rational,
  subtract
} from "../src/core/rational.js";

test("normalization makes the denominator positive, reduces, and canonicalizes zero", () => {
  assert.deepEqual(rational(-2, -4), { numerator: 1, denominator: 2 });
  assert.deepEqual(rational(2, -4), { numerator: -1, denominator: 2 });
  assert.deepEqual(rational(0, -7), { numerator: 0, denominator: 1 });
  assert.deepEqual(rational(-0, 9), { numerator: 0, denominator: 1 });
  assert.ok(Object.isFrozen(rational(3, 7)));
});

test("exact operations match mandatory signed-fraction cases", () => {
  assert.equal(formatRational(add(rational(-3, 4), rational(5, 6))), "1/12");
  assert.equal(formatRational(divide(rational(-2, 3), rational(4, 9))), "-3/2");
  assert.equal(formatRational(subtract(rational(8), rational(-3))), "11");
  assert.equal(formatRational(multiply(rational(-4), rational(-6))), "24");
  assert.equal(formatRational(abs(rational(-7))), "7");
  assert.equal(formatRational(negate(rational(-7))), "7");
});

test("parse and format accept only canonical integer/fraction syntax", () => {
  assert.deepEqual(parseRational(" -06/08 "), rational(-3, 4));
  assert.deepEqual(parseRational("+12"), rational(12));
  assert.equal(formatRational(parseRational("0/-9")), "0");
  for (const invalid of ["", "-", "+", "1/", "/2", "1/0", "1.5", "1/2/3", "a/b"]) {
    assert.throws(() => parseRational(invalid), /invalid rational|zero denominator/, invalid);
  }
});

test("power is exact and limited to release exponents", () => {
  assert.equal(formatRational(power(rational(-3), 2)), "9");
  assert.equal(formatRational(power(rational(-3), 3)), "-27");
  assert.equal(formatRational(power(rational(5, 7), 0)), "1");
  assert.throws(() => power(rational(2), -1), /exponent/);
  assert.throws(() => power(rational(2), 7), /exponent/);
  assert.throws(() => power(rational(2), 1.5), /exponent/);
});

test("zero division and unsafe integers fail closed", () => {
  assert.throws(() => rational(1, 0), /zero denominator/);
  assert.throws(() => divide(rational(1), rational(0)), /division by zero/);
  assert.throws(() => rational(Number.MAX_SAFE_INTEGER + 1), /safe integer/);
  assert.throws(() => multiply(rational(Number.MAX_SAFE_INTEGER), rational(2)), /safe integer/);
});

test("algebraic properties hold across the release property range", () => {
  const values = [];
  for (let numerator = -20; numerator <= 20; numerator += 1) {
    for (let denominator = 1; denominator <= 12; denominator += 1) {
      const value = rational(numerator, denominator);
      values.push(value);
      assert.ok(value.denominator > 0);
      assert.deepEqual(add(value, rational(0)), value);
      assert.deepEqual(multiply(value, rational(1)), value);
      assert.deepEqual(add(value, negate(value)), rational(0));
    }
  }

  for (const left of values) {
    for (const right of values) {
      assert.equal(compare(left, right) + compare(right, left), 0);
    }
  }
});
