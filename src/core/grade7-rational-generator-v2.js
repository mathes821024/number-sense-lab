/**
 * Grade 7 rational generator v2 — expanded template matrix.
 * Checksum payload includes generator_version: 2. Does not alter v1.
 */
import { checksumText, createExerciseRng } from "./exercise-rng.js";
import {
  abs,
  add,
  compare,
  divide,
  formatRational,
  multiply,
  negate,
  power,
  rational,
  subtract,
} from "./rational.js";
import { skillById } from "./skill-catalog.js";

const BANDS = ["foundation", "standard", "transfer"];
const FRACTION_DENOMINATORS = [2, 3, 4, 5, 6, 8, 9, 10, 12, 15, 20];

function gcdInt(a, b) {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y) [x, y] = [y, x % y];
  return x || 1;
}

/** Required template tags per skill × band (contract §4.2). */
export const V2_REQUIRED_TEMPLATES = Object.freeze({
  "g7-rational-sign-opposite-absolute": {
    foundation: ["integer", "zero", "signed_integer"],
    standard: ["signed_fraction"],
    transfer: ["fraction_double_sign"],
  },
  "g7-rational-compare": {
    foundation: ["signed_integers"],
    standard: ["integer_vs_unlike_fraction"],
    transfer: ["two_negative_fractions", "cross_zero", "near_absolute"],
  },
  "g7-integer-add-sub": {
    foundation: ["two_term"],
    standard: ["three_term", "subtract_negative"],
    transfer: ["three_term_parentheses"],
  },
  "g7-integer-mul-div": {
    foundation: ["two_term_exact_div"],
    standard: ["three_factor", "mul_div_two_step"],
    transfer: ["parentheses_multi_sign"],
  },
  "g7-fraction-add-sub": {
    foundation: ["same_denominator"],
    standard: ["unlike_denominator"],
    transfer: ["signed_unlike_denominator", "signed_integer_result"],
  },
  "g7-fraction-mul-div": {
    foundation: ["positive_simple_cancel"],
    standard: ["signed_fraction", "division"],
    transfer: ["cross_cancel_improper"],
  },
  "g7-rational-power": {
    foundation: ["integer_base_exp_2_3"],
    standard: ["exp_0_4_paren_vs_outside"],
    transfer: ["fraction_base_exp_le_6"],
  },
  "g7-rational-mixed": {
    foundation: ["integer_two_ops_le_3"],
    standard: ["four_ops_exact_div"],
    transfer: ["signed_fraction_paren_power"],
  },
});

function plain(value) {
  return { numerator: value.numerator, denominator: value.denominator };
}

function answerType(value) {
  return value.denominator === 1 ? "signed_integer" : "signed_fraction_fields";
}

function display(value, parentheses = false) {
  const text = formatRational(value);
  return parentheses && value.numerator < 0 ? `(${text})` : text;
}

function nonZeroInteger(rng, minimum, maximum) {
  let value = 0;
  while (value === 0) value = rng.integer(minimum, maximum);
  return value;
}

function randomFraction(rng, bound, { allowInteger = false, positive = false } = {}) {
  const denominators = FRACTION_DENOMINATORS.filter((value) => value <= bound);
  const denominator = rng.pick(denominators.length > 0 ? denominators : [2]);
  let numerator = positive
    ? rng.integer(1, bound)
    : nonZeroInteger(rng, -bound, bound);
  const value = rational(numerator, denominator);
  if (!allowInteger && value.denominator === 1) {
    return rational(numerator + (numerator > 0 ? 1 : -1), denominator);
  }
  return value;
}

function coprimeNumerator(rng, denominator, minimum, maximum) {
  const candidates = [];
  for (let value = minimum; value <= maximum; value += 1) {
    if (value !== 0 && gcdInt(value, denominator) === 1) candidates.push(value);
  }
  if (!candidates.length) throw new Error(`CONTRACT_CONFLICT: no coprime numerator for ${denominator}`);
  return rng.pick(candidates);
}

function hasCrossCancellation(operands) {
  const { left, right, operator } = operands;
  if (operator === "multiply") {
    return gcdInt(left.numerator, right.denominator) > 1
      || gcdInt(right.numerator, left.denominator) > 1;
  }
  if (operator === "divide") {
    return gcdInt(left.numerator, right.numerator) > 1
      || gcdInt(right.denominator, left.denominator) > 1;
  }
  return false;
}

/** Runtime contract assertion: a template label must match the actual visible mathematics. */
export function assertV2TemplateContract(exercise) {
  const operands = exercise?.operands || {};
  const template = operands.template;
  const answer = exercise?.canonical_answer || "";
  const prompt = exercise?.prompt || "";
  const signed = operands.left?.numerator < 0 || operands.right?.numerator < 0;

  if (template === "same_denominator") {
    if (operands.left.denominator === 1 || operands.left.denominator !== operands.right.denominator) {
      throw new Error("CONTRACT_CONFLICT: same_denominator template does not have equal non-integer denominators");
    }
  } else if (template === "unlike_denominator") {
    if (operands.left.denominator === 1 || operands.right.denominator === 1
      || operands.left.denominator === operands.right.denominator) {
      throw new Error("CONTRACT_CONFLICT: unlike_denominator template does not have two unlike fractions");
    }
  } else if (template === "signed_unlike_denominator") {
    if (!signed || operands.left.denominator === 1 || operands.right.denominator === 1
      || operands.left.denominator === operands.right.denominator) {
      throw new Error("CONTRACT_CONFLICT: signed_unlike_denominator template is not signed and unlike");
    }
  } else if (template === "signed_integer_result") {
    if (!signed || answer.includes("/")) {
      throw new Error("CONTRACT_CONFLICT: signed_integer_result template is not signed with an integer result");
    }
  } else if (template === "positive_simple_cancel") {
    if (operands.operator !== "multiply" || operands.left.numerator <= 0
      || operands.right.numerator <= 0 || !hasCrossCancellation(operands)) {
      throw new Error("CONTRACT_CONFLICT: positive_simple_cancel template has no real cancellation");
    }
  } else if (template === "cross_cancel_improper") {
    const improper = Math.abs(operands.left.numerator) > operands.left.denominator
      || Math.abs(operands.right.numerator) > operands.right.denominator;
    if (!improper || !hasCrossCancellation(operands)) {
      throw new Error("CONTRACT_CONFLICT: cross_cancel_improper template lacks cancellation or an improper fraction");
    }
  } else if (template === "parentheses_multi_sign") {
    if ((prompt.match(/\(/g) || []).length < 2 || (prompt.match(/-/g) || []).length < 2) {
      throw new Error("CONTRACT_CONFLICT: parentheses_multi_sign template lacks two parenthesized negatives");
    }
  }
  return exercise;
}

function explanations(result, directSteps, structureSummary, estimateSummary) {
  const answer = formatRational(result);
  return {
    direct: {
      available: true,
      summary: "按运算顺序直接计算",
      steps: [...directSteps, `得到 ${answer}`],
    },
    structure: {
      available: true,
      summary: structureSummary,
      steps: [structureSummary, `符号与数值共同得到 ${answer}`],
    },
    estimate: {
      available: true,
      summary: estimateSummary,
      steps: [estimateSummary, `精确结果 ${answer} 与检查一致`],
    },
  };
}

function finish({ skillId, band, seed, index, prompt, result, operands, direct, structure, estimate, template }) {
  const canonicalAnswer = formatRational(result);
  const payload = {
    skill_id: skillId,
    band,
    seed: String(seed),
    index,
    prompt,
    canonical_answer: canonicalAnswer,
    operands,
    generator_version: 2,
  };
  const checksum = checksumText(JSON.stringify(payload));
  return Object.freeze({
    id: `gx:${skillId}:${band}:${index}:${checksum}`,
    skill_id: skillId,
    band,
    prompt,
    canonical_answer: canonicalAnswer,
    answer_type: answerType(result),
    explanations: explanations(result, direct, structure, estimate),
    operands: { ...operands, template },
    checksum,
    generator_version: 2,
  });
}

function pickTemplate(templates, index) {
  return templates[index % templates.length];
}

function generateSign(skill, coordinates, rng, template) {
  const bound = skill.operand_bounds[coordinates.band];
  let value;
  let operator;
  let prompt;
  let result;
  if (template === "zero") {
    value = rational(0);
    operator = rng.boolean() ? "abs" : "opposite";
    result = operator === "abs" ? abs(value) : negate(value);
    prompt = operator === "abs" ? "|0| = ?" : "0 的相反数是？";
  } else if (template === "signed_fraction" || template === "fraction_double_sign") {
    value = randomFraction(rng, Math.min(bound, 20));
    if (template === "fraction_double_sign") {
      // Double sign without nested abs: -(-a) or opposite of a negative fraction.
      const inner = value.numerator > 0 ? negate(value) : value;
      operator = "opposite";
      result = negate(inner);
      prompt = `${display(inner, true)} 的相反数是？`;
      value = inner;
    } else {
      operator = rng.boolean() ? "abs" : "opposite";
      result = operator === "abs" ? abs(value) : negate(value);
      prompt = operator === "abs" ? `|${formatRational(value)}| = ?` : `${display(value, true)} 的相反数是？`;
    }
  } else {
    // integer / signed_integer
    const n = template === "integer" ? rng.integer(1, bound) : nonZeroInteger(rng, -bound, bound);
    value = rational(n);
    operator = rng.boolean() ? "abs" : "opposite";
    result = operator === "abs" ? abs(value) : negate(value);
    prompt = operator === "abs" ? `|${formatRational(value)}| = ?` : `${display(value, true)} 的相反数是？`;
  }
  return finish({
    ...coordinates,
    prompt,
    result,
    operands: { kind: "unary", operator, value: plain(value) },
    template,
    direct: [operator === "abs" ? "取到 0 的距离" : "改变整体符号"],
    structure: operator === "abs" ? "绝对值去掉方向" : "相反数之和为 0",
    estimate: operator === "abs" ? "结果必须非负" : "大小不变、方向相反",
  });
}

function generateCompare(skill, coordinates, rng, template) {
  const bound = Math.min(skill.operand_bounds[coordinates.band], 20);
  let left;
  let right;
  if (template === "signed_integers") {
    left = rational(nonZeroInteger(rng, -bound, bound));
    right = rational(nonZeroInteger(rng, -bound, bound));
    if (compare(left, right) === 0) right = add(right, rational(1));
  } else if (template === "integer_vs_unlike_fraction") {
    left = rational(nonZeroInteger(rng, -bound, bound));
    right = randomFraction(rng, bound);
    if (right.denominator === 1) right = rational(right.numerator, 2);
    if (compare(left, right) === 0) right = add(right, rational(1, right.denominator));
  } else if (template === "two_negative_fractions") {
    left = negate(randomFraction(rng, bound, { positive: true }));
    right = negate(randomFraction(rng, bound, { positive: true }));
    if (compare(left, right) === 0) right = add(right, rational(-1, right.denominator));
  } else if (template === "cross_zero") {
    left = rational(-rng.integer(1, bound));
    right = rational(rng.integer(1, bound));
  } else {
    // near_absolute: values close in magnitude, opposite or same side
    const mag = rng.integer(2, Math.max(2, bound));
    left = rational(-mag);
    right = rational(mag - 1);
  }
  const result = compare(left, right) >= 0 ? left : right;
  return finish({
    ...coordinates,
    prompt: `${display(left, true)} 与 ${display(right, true)}，较大的数是？`,
    result,
    operands: { kind: "compare", left: plain(left), right: plain(right) },
    template,
    direct: ["统一分母或比较符号与绝对值"],
    structure: "先看正负，再看离 0 的位置",
    estimate: "用数轴位置检查较大者",
  });
}

function generateIntegerAddSub(skill, coordinates, rng, template) {
  const bound = skill.operand_bounds[coordinates.band];
  if (template === "two_term") {
    const left = rational(nonZeroInteger(rng, -bound, bound));
    const right = rational(nonZeroInteger(rng, -bound, bound));
    const operator = rng.boolean() ? "add" : "subtract";
    const result = operator === "add" ? add(left, right) : subtract(left, right);
    const symbol = operator === "add" ? "+" : "-";
    return finish({
      ...coordinates,
      prompt: `${formatRational(left)} ${symbol} ${display(right, true)} = ?`,
      result,
      operands: { kind: "binary", operator, left: plain(left), right: plain(right) },
      template,
      direct: ["把减去负数改写为加上相反数"],
      structure: "用数轴方向合并位移",
      estimate: "检查结果符号与绝对值范围",
    });
  }
  if (template === "subtract_negative") {
    const left = rational(nonZeroInteger(rng, -bound, bound));
    const right = rational(-rng.integer(1, bound));
    const result = subtract(left, right);
    return finish({
      ...coordinates,
      prompt: `${formatRational(left)} - ${display(right, true)} = ?`,
      result,
      operands: { kind: "binary", operator: "subtract", left: plain(left), right: plain(right) },
      template,
      direct: ["减去负数等于加上相反数"],
      structure: "减负即加正",
      estimate: "检查结果符号与绝对值范围",
    });
  }
  // three_term / three_term_parentheses
  const a = rational(nonZeroInteger(rng, -bound, bound));
  const b = rational(nonZeroInteger(rng, -bound, bound));
  const c = rational(nonZeroInteger(rng, -bound, bound));
  const op1 = rng.boolean() ? "add" : "subtract";
  const op2 = rng.boolean() ? "add" : "subtract";
  const mid = op1 === "add" ? add(a, b) : subtract(a, b);
  const result = op2 === "add" ? add(mid, c) : subtract(mid, c);
  const s1 = op1 === "add" ? "+" : "-";
  const s2 = op2 === "add" ? "+" : "-";
  const prompt = template === "three_term_parentheses"
    ? `(${formatRational(a)} ${s1} ${display(b, true)}) ${s2} ${display(c, true)} = ?`
    : `${formatRational(a)} ${s1} ${display(b, true)} ${s2} ${display(c, true)} = ?`;
  return finish({
    ...coordinates,
    prompt,
    result,
    operands: {
      kind: "ternary_add",
      op1,
      op2,
      a: plain(a),
      b: plain(b),
      c: plain(c),
      parentheses: template === "three_term_parentheses",
    },
    template,
    direct: ["从左到右依次加减，括号优先"],
    structure: "三项合并为两步位移",
    estimate: "检查结果符号与绝对值范围",
  });
}

function generateIntegerMulDiv(skill, coordinates, rng, template) {
  const bound = skill.operand_bounds[coordinates.band];
  if (template === "two_term_exact_div" || template === "parentheses_multi_sign") {
    const operator = template === "two_term_exact_div" && rng.boolean() ? "multiply" : (rng.boolean() ? "multiply" : "divide");
    let left;
    let right;
    if (template === "parentheses_multi_sign" && operator === "multiply") {
      left = rational(-rng.integer(1, bound));
      right = rational(-rng.integer(1, bound));
    } else if (template === "parentheses_multi_sign") {
      const divisor = -rng.integer(1, bound);
      const quotient = rng.integer(1, bound);
      left = rational(divisor * quotient);
      right = rational(divisor);
    } else if (operator === "multiply") {
      left = rational(nonZeroInteger(rng, -bound, bound));
      right = rational(nonZeroInteger(rng, -bound, bound));
    } else {
      const divisor = nonZeroInteger(rng, -bound, bound);
      const quotient = nonZeroInteger(rng, -bound, bound);
      left = rational(divisor * quotient);
      right = rational(divisor);
    }
    const result = operator === "multiply" ? multiply(left, right) : divide(left, right);
    const symbol = operator === "multiply" ? "×" : "÷";
    const prompt = template === "parentheses_multi_sign"
      ? `${display(left, true)} ${symbol} ${display(right, true)} = ?`
      : `${display(left, true)} ${symbol} ${display(right, true)} = ?`;
    return finish({
      ...coordinates,
      prompt,
      result,
      operands: { kind: "binary", operator, left: plain(left), right: plain(right) },
      template,
      direct: ["先按同号为正、异号为负确定符号"],
      structure: "分解因数或用乘除互逆",
      estimate: "用奇偶、尾数与数量级检查",
    });
  }
  if (template === "three_factor") {
    const a = rational(nonZeroInteger(rng, -Math.min(bound, 9), Math.min(bound, 9)));
    const b = rational(nonZeroInteger(rng, -Math.min(bound, 9), Math.min(bound, 9)));
    const c = rational(nonZeroInteger(rng, -Math.min(bound, 9), Math.min(bound, 9)));
    const result = multiply(multiply(a, b), c);
    return finish({
      ...coordinates,
      prompt: `${display(a, true)} × ${display(b, true)} × ${display(c, true)} = ?`,
      result,
      operands: { kind: "ternary_mul", a: plain(a), b: plain(b), c: plain(c) },
      template,
      direct: ["从左到右连乘，注意负号个数"],
      structure: "负因数个数决定结果符号",
      estimate: "用数量级检查",
    });
  }
  // mul_div_two_step: (a × b) ÷ c with exact division
  const a = rational(nonZeroInteger(rng, -Math.min(bound, 9), Math.min(bound, 9)));
  const c = rational(nonZeroInteger(rng, -Math.min(bound, 9), Math.min(bound, 9)));
  const quotient = rational(nonZeroInteger(rng, -Math.min(bound, 9), Math.min(bound, 9)));
  const b = divide(multiply(quotient, c), a); // so (a*b)/c = quotient when integers
  // Prefer constructing a×k ÷ c where a*k divisible by c
  const k = nonZeroInteger(rng, -Math.min(bound, 9), Math.min(bound, 9));
  const divisor = nonZeroInteger(rng, -Math.min(bound, 9), Math.min(bound, 9));
  const q = nonZeroInteger(rng, -Math.min(bound, 9), Math.min(bound, 9));
  const left = rational(k);
  const mid = rational(divisor * q);
  const right = rational(divisor);
  // (left × mid) ÷ right = left × q
  const product = multiply(left, mid);
  const result = divide(product, right);
  return finish({
    ...coordinates,
    prompt: `${display(left, true)} × ${display(mid, true)} ÷ ${display(right, true)} = ?`,
    result,
    operands: {
      kind: "mul_div_chain",
      left: plain(left),
      middle: plain(mid),
      right: plain(right),
    },
    template,
    direct: ["先乘后除，除数不为零且整除"],
    structure: "乘除互逆可先约分",
    estimate: "用符号与数量级检查",
  });
}

function generateFractionAddSub(skill, coordinates, rng, template) {
  const bound = Math.min(skill.operand_bounds[coordinates.band], 20);
  let left;
  let right;
  let operator;
  if (template === "same_denominator") {
    const d = rng.pick(FRACTION_DENOMINATORS.filter((v) => v <= bound && v > 1));
    function coprimeNumerator() {
      let n = nonZeroInteger(rng, -bound, bound);
      let guard = 0;
      while (gcdInt(Math.abs(n), d) !== 1 && guard < 32) {
        n = nonZeroInteger(rng, -bound, bound);
        guard += 1;
      }
      if (gcdInt(Math.abs(n), d) !== 1) n = n > 0 ? 1 : -1;
      return n;
    }
    left = rational(coprimeNumerator(), d);
    right = rational(coprimeNumerator(), d);
    operator = rng.boolean() ? "add" : "subtract";
  } else if (template === "unlike_denominator") {
    const denominators = FRACTION_DENOMINATORS.filter((value) => value <= bound && value > 1);
    const leftDenominator = rng.pick(denominators);
    const rightDenominator = rng.pick(denominators.filter((value) => value !== leftDenominator));
    left = rational(coprimeNumerator(rng, leftDenominator, 1, leftDenominator - 1), leftDenominator);
    right = rational(coprimeNumerator(rng, rightDenominator, 1, rightDenominator - 1), rightDenominator);
    operator = rng.boolean() ? "add" : "subtract";
  } else if (template === "signed_unlike_denominator") {
    const denominators = FRACTION_DENOMINATORS.filter((value) => value <= bound && value > 1);
    const leftDenominator = rng.pick(denominators);
    const rightDenominator = rng.pick(denominators.filter((value) => value !== leftDenominator));
    left = rational(-coprimeNumerator(rng, leftDenominator, 1, leftDenominator - 1), leftDenominator);
    right = rational(coprimeNumerator(rng, rightDenominator, 1, rightDenominator - 1), rightDenominator);
    operator = rng.boolean() ? "add" : "subtract";
  } else {
    // signed_integer_result — complementary signed fractions necessarily share a reduced denominator.
    const d = rng.pick([2, 3, 4, 5, 6].filter((value) => value <= bound));
    const a = coprimeNumerator(rng, d, 1, d - 1);
    const k = nonZeroInteger(rng, -3, 3);
    left = rational(-a, d);
    right = subtract(rational(k), left);
    operator = "add";
  }
  const result = operator === "add" ? add(left, right) : subtract(left, right);
  const symbol = operator === "add" ? "+" : "-";
  return finish({
    ...coordinates,
    prompt: `${display(left, true)} ${symbol} ${display(right, true)} = ?`,
    result,
    operands: { kind: "binary", operator, left: plain(left), right: plain(right) },
    template,
    direct: ["通分后合并分子"],
    structure: "选择最小公分母",
    estimate: "先检查正负号，再检查结果大致区间",
  });
}

function generateFractionMulDiv(skill, coordinates, rng, template) {
  const bound = Math.min(skill.operand_bounds[coordinates.band], 20);
  let left;
  let right;
  let operator;
  if (template === "positive_simple_cancel") {
    const factor = rng.pick([2, 3]);
    const leftDenominators = FRACTION_DENOMINATORS.filter((value) => value <= bound && gcdInt(value, factor) === 1);
    const leftDenominator = rng.pick(leftDenominators);
    const rightDenominator = rng.pick(FRACTION_DENOMINATORS.filter((value) => value <= bound && value % factor === 0));
    left = rational(factor, leftDenominator);
    right = rational(coprimeNumerator(rng, rightDenominator, 1, bound), rightDenominator);
    operator = "multiply";
  } else if (template === "division") {
    left = randomFraction(rng, bound);
    right = randomFraction(rng, bound);
    operator = "divide";
  } else if (template === "signed_fraction") {
    left = randomFraction(rng, bound);
    right = randomFraction(rng, bound);
    operator = rng.boolean() ? "multiply" : "divide";
  } else {
    // cross_cancel_improper — construct a real cancellation before applying the operation.
    const factor = rng.pick([2, 3]);
    const denominators = [2, 3, 4, 5].filter((value) => gcdInt(value, factor) === 1);
    const denL = rng.pick(denominators);
    const denR = rng.pick(denominators);
    operator = rng.boolean() ? "multiply" : "divide";
    left = rational(factor * (denL + 1), denL);
    right = operator === "multiply"
      ? rational(1, factor * denR)
      : rational(factor, denR + factor * denR);
  }
  const result = operator === "multiply" ? multiply(left, right) : divide(left, right);
  const symbol = operator === "multiply" ? "×" : "÷";
  return finish({
    ...coordinates,
    prompt: `${display(left, true)} ${symbol} ${display(right, true)} = ?`,
    result,
    operands: { kind: "binary", operator, left: plain(left), right: plain(right) },
    template,
    direct: ["除法先转为乘倒数，再约分"],
    structure: "先交叉约分再相乘",
    estimate: "先检查正负号，再检查结果大致区间",
  });
}

function generatePower(skill, coordinates, rng, template) {
  const bound = Math.min(skill.operand_bounds[coordinates.band], 10);
  if (template === "fraction_base_exp_le_6") {
    let base = randomFraction(rng, Math.min(bound, 6));
    if (base.denominator === 1) base = rational(base.numerator || 1, rng.pick([2, 3, 4, 5]));
    const exponent = rng.integer(0, 6);
    const result = power(base, exponent);
    return finish({
      ...coordinates,
      prompt: `(${formatRational(base)})^${exponent} = ?`,
      result,
      operands: { kind: "power", base: plain(base), exponent, outside_sign: 1 },
      template,
      direct: ["分数底数按指数连乘，注意约分"],
      structure: "偶次幂与奇次幂的符号规律不同",
      estimate: "用底数大小和指数检查数量级",
    });
  }
  const magnitude = 2 + (coordinates.index % Math.max(1, bound - 1));
  let exponent;
  let negativeBase;
  let outsideSign;
  if (template === "integer_base_exp_2_3") {
    exponent = rng.pick([2, 3]);
    negativeBase = rng.boolean();
    outsideSign = 1;
  } else {
    // exp_0_4_paren_vs_outside
    exponent = rng.integer(0, 4);
    negativeBase = rng.boolean();
    outsideSign = !negativeBase && rng.boolean() ? -1 : 1;
  }
  const base = rational(negativeBase ? -magnitude : magnitude);
  const result = outsideSign < 0 ? negate(power(base, exponent)) : power(base, exponent);
  const baseText = negativeBase ? `(-${magnitude})` : String(magnitude);
  const prefix = outsideSign < 0 ? "-" : "";
  return finish({
    ...coordinates,
    prompt: `${prefix}${baseText}^${exponent} = ?`,
    result,
    operands: { kind: "power", base: plain(base), exponent, outside_sign: outsideSign },
    template,
    direct: ["先确认负号是否在括号内，再按指数连乘"],
    structure: "偶次幂与奇次幂的符号规律不同",
    estimate: "用底数大小和指数检查数量级",
  });
}

function generateMixed(skill, coordinates, rng, template) {
  const bound = Math.min(skill.operand_bounds[coordinates.band], 20);
  if (template === "integer_two_ops_le_3") {
    const left = rational(nonZeroInteger(rng, -bound, bound));
    const middle = rational(nonZeroInteger(rng, -bound, bound));
    const right = rational(nonZeroInteger(rng, -bound, bound));
    const firstOperator = rng.boolean() ? "add" : "subtract";
    const first = firstOperator === "add" ? add(left, middle) : subtract(left, middle);
    const result = multiply(first, right);
    const symbol = firstOperator === "add" ? "+" : "-";
    return finish({
      ...coordinates,
      prompt: `(${formatRational(left)} ${symbol} ${display(middle, true)}) × ${display(right, true)} = ?`,
      result,
      operands: {
        kind: "mixed",
        first_operator: firstOperator,
        left: plain(left),
        middle: plain(middle),
        right: plain(right),
      },
      template,
      direct: ["先算括号，再做乘法"],
      structure: "观察能否先约分或提取共同符号",
      estimate: "分步检查符号和结果范围",
    });
  }
  if (template === "four_ops_exact_div") {
    const a = rational(nonZeroInteger(rng, -bound, bound));
    const b = rational(nonZeroInteger(rng, -bound, bound));
    const divisor = nonZeroInteger(rng, -bound, bound);
    const q = nonZeroInteger(rng, -bound, bound);
    const c = rational(divisor * q);
    const d = rational(divisor);
    const first = add(a, b);
    const result = divide(multiply(first, c), d);
    return finish({
      ...coordinates,
      prompt: `(${formatRational(a)} + ${display(b, true)}) × ${display(c, true)} ÷ ${display(d, true)} = ?`,
      result,
      operands: {
        kind: "mixed_four",
        a: plain(a),
        b: plain(b),
        c: plain(c),
        d: plain(d),
      },
      template,
      direct: ["括号 → 乘 → 除，除法保证整除"],
      structure: "乘除可先约分",
      estimate: "分步检查符号和结果范围",
    });
  }
  // signed_fraction_paren_power
  const base = randomFraction(rng, Math.min(bound, 6));
  const exponent = rng.pick([2, 3]);
  const powered = power(base, exponent);
  const addend = randomFraction(rng, bound, { allowInteger: true });
  const result = add(powered, addend);
  return finish({
    ...coordinates,
    prompt: `(${formatRational(base)})^${exponent} + ${display(addend, true)} = ?`,
    result,
    operands: {
      kind: "mixed_power",
      base: plain(base),
      exponent,
      addend: plain(addend),
    },
    template,
    direct: ["先算乘方，再加减"],
    structure: "乘方优先于加减",
    estimate: "分步检查符号和结果范围",
  });
}

function generateExerciseV2Attempt({ skillId, band, seed, index, attempt = 0 }) {
  const skill = skillById(skillId);
  if (!skill) throw new Error(`unknown skill: ${skillId}`);
  if (!BANDS.includes(band) || !skill.bands.includes(band)) throw new Error(`unknown band: ${band}`);
  if (!Number.isSafeInteger(index) || index < 0) throw new Error("index must be a non-negative safe integer");
  const coordinates = { skillId, band, seed: String(seed), index };
  const required = V2_REQUIRED_TEMPLATES[skillId]?.[band];
  if (!required?.length) throw new Error(`no v2 templates for ${skillId}:${band}`);
  // Rotate template with attempt so uniqueness retries still stay in-matrix.
  const template = pickTemplate(required, index + attempt * 7);
  const rng = createExerciseRng(`v2\u0000${coordinates.seed}\u0000${skillId}\u0000${band}\u0000${index}\u0000${template}\u0000${attempt}`);

  let exercise;
  if (skillId === "g7-rational-sign-opposite-absolute") exercise = generateSign(skill, coordinates, rng, template);
  else if (skillId === "g7-rational-compare") exercise = generateCompare(skill, coordinates, rng, template);
  else if (skillId === "g7-integer-add-sub") exercise = generateIntegerAddSub(skill, coordinates, rng, template);
  else if (skillId === "g7-integer-mul-div") exercise = generateIntegerMulDiv(skill, coordinates, rng, template);
  else if (skillId === "g7-fraction-add-sub") exercise = generateFractionAddSub(skill, coordinates, rng, template);
  else if (skillId === "g7-fraction-mul-div") exercise = generateFractionMulDiv(skill, coordinates, rng, template);
  else if (skillId === "g7-rational-power") exercise = generatePower(skill, coordinates, rng, template);
  else if (skillId === "g7-rational-mixed") exercise = generateMixed(skill, coordinates, rng, template);
  else throw new Error(`unknown skill: ${skillId}`);
  return assertV2TemplateContract(exercise);
}

function contentKeyOf(exercise) {
  return `${exercise.prompt}\u0000${exercise.canonical_answer}`;
}

export function selectUniqueV2Candidate({ usedKeys, candidateAtAttempt, maxAttempts = 64 }) {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const candidate = candidateAtAttempt(attempt);
    if (!usedKeys.has(contentKeyOf(candidate))) return candidate;
  }
  throw new Error(`CONTRACT_CONFLICT: unable to generate unique v2 exercise after ${maxAttempts} attempts`);
}

/** Deterministic memo: skill|band|seed|index → resolved unique-in-span exercise. */
const v2ResolvedCache = new Map();

function resolveV2Unique({ skillId, band, seed, index }) {
  const cacheKey = `${skillId}\u0000${band}\u0000${seed}\u0000${index}`;
  if (v2ResolvedCache.has(cacheKey)) return v2ResolvedCache.get(cacheKey);

  const used = new Set();
  const spanStart = Math.max(0, index - 9);
  for (let prior = spanStart; prior < index; prior += 1) {
    used.add(contentKeyOf(resolveV2Unique({ skillId, band, seed, index: prior })));
  }

  const chosen = selectUniqueV2Candidate({
    usedKeys: used,
    candidateAtAttempt: (attempt) => generateExerciseV2Attempt({ skillId, band, seed, index, attempt }),
  });
  v2ResolvedCache.set(cacheKey, chosen);
  return chosen;
}

/**
 * Public v2 entry. Deterministic in (skillId, band, seed, index, generator_version=2).
 * Enforces unique prompt+canonical_answer within any contiguous 10-index span.
 */
export function generateExerciseV2({ skillId, band, seed, index }) {
  return resolveV2Unique({ skillId, band, seed: String(seed), index });
}
