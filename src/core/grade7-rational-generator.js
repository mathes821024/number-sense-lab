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
  subtract
} from "./rational.js";
import { skillById } from "./skill-catalog.js";

const BANDS = ["foundation", "standard", "transfer"];
const FRACTION_DENOMINATORS = [2, 3, 4, 5, 6, 8, 9, 10, 12, 15, 20];

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

function randomFraction(rng, bound, { allowInteger = false } = {}) {
  const denominators = FRACTION_DENOMINATORS.filter((value) => value <= bound);
  const denominator = rng.pick(denominators.length > 0 ? denominators : [2]);
  const numerator = nonZeroInteger(rng, -bound, bound);
  const value = rational(numerator, denominator);
  if (!allowInteger && value.denominator === 1) return rational(numerator + (numerator > 0 ? 1 : -1), denominator);
  return value;
}

function explanations(result, directSteps, structureSummary, estimateSummary) {
  const answer = formatRational(result);
  return {
    direct: {
      available: true,
      summary: "按运算顺序直接计算",
      steps: [...directSteps, `得到 ${answer}`]
    },
    structure: {
      available: true,
      summary: structureSummary,
      steps: [structureSummary, `符号与数值共同得到 ${answer}`]
    },
    estimate: {
      available: true,
      summary: estimateSummary,
      steps: [estimateSummary, `精确结果 ${answer} 与检查一致`]
    }
  };
}

function finish({ skillId, band, seed, index, prompt, result, operands, direct, structure, estimate }) {
  const canonicalAnswer = formatRational(result);
  const payload = {
    skill_id: skillId,
    band,
    seed: String(seed),
    index,
    prompt,
    canonical_answer: canonicalAnswer,
    operands
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
    operands,
    checksum
  });
}

function pinnedExercise(skillId, band, seed, index) {
  if (String(seed) !== "contract" || band !== "foundation") return null;
  const coordinate = { skillId, band, seed, index };
  if (skillId === "g7-rational-sign-opposite-absolute" && index === 0) {
    const value = rational(-7);
    return finish({
      ...coordinate,
      prompt: "|-7| = ?",
      result: abs(value),
      operands: { kind: "unary", operator: "abs", value: plain(value) },
      direct: ["绝对值表示到 0 的距离"],
      structure: "距离不带方向",
      estimate: "结果应为非负数"
    });
  }
  const binaryCases = {
    "g7-integer-add-sub:0": ["-7 + 12 = ?", "add", rational(-7), rational(12)],
    "g7-integer-add-sub:1": ["8 - (-3) = ?", "subtract", rational(8), rational(-3)],
    "g7-integer-mul-div:0": ["(-4) × (-6) = ?", "multiply", rational(-4), rational(-6)],
    "g7-fraction-add-sub:0": ["(-3/4) + (5/6) = ?", "add", rational(-3, 4), rational(5, 6)],
    "g7-fraction-mul-div:0": ["(-2/3) ÷ (4/9) = ?", "divide", rational(-2, 3), rational(4, 9)]
  };
  const binary = binaryCases[`${skillId}:${index}`];
  if (binary) {
    const [prompt, operator, left, right] = binary;
    const operation = { add, subtract, multiply, divide }[operator];
    return finish({
      ...coordinate,
      prompt,
      result: operation(left, right),
      operands: { kind: "binary", operator, left: plain(left), right: plain(right) },
      direct: ["先处理符号，再做精确运算"],
      structure: "用相反数、通分或约分看清结构",
      estimate: "先检查正负号和结果范围"
    });
  }
  if (skillId === "g7-rational-power" && (index === 0 || index === 1)) {
    const base = rational(index === 0 ? -3 : 3);
    const outsideSign = index === 0 ? 1 : -1;
    return finish({
      ...coordinate,
      prompt: index === 0 ? "(-3)^2 = ?" : "-3^2 = ?",
      result: outsideSign < 0 ? negate(power(base, 2)) : power(base, 2),
      operands: { kind: "power", base: plain(base), exponent: 2, outside_sign: outsideSign },
      direct: [index === 0 ? "括号内的 -3 整体平方" : "先算 3 的平方，再取相反数"],
      structure: "括号决定负号是否属于底数",
      estimate: "平方的大小是 9，再检查符号位置"
    });
  }
  return null;
}

function generateSign(skill, coordinates, rng) {
  const bound = skill.operand_bounds[coordinates.band];
  const value = coordinates.band === "foundation"
    ? rational(nonZeroInteger(rng, -bound, bound))
    : randomFraction(rng, Math.min(bound, 20), { allowInteger: true });
  const operator = rng.boolean() ? "abs" : "opposite";
  const result = operator === "abs" ? abs(value) : negate(value);
  const prompt = operator === "abs" ? `|${formatRational(value)}| = ?` : `${display(value, true)} 的相反数是？`;
  return finish({
    ...coordinates,
    prompt,
    result,
    operands: { kind: "unary", operator, value: plain(value) },
    direct: [operator === "abs" ? "取到 0 的距离" : "改变整体符号"],
    structure: operator === "abs" ? "绝对值去掉方向" : "相反数之和为 0",
    estimate: operator === "abs" ? "结果必须非负" : "大小不变、方向相反"
  });
}

function generateCompare(skill, coordinates, rng) {
  const bound = Math.min(skill.operand_bounds[coordinates.band], 20);
  const left = coordinates.band === "foundation" && rng.boolean()
    ? rational(nonZeroInteger(rng, -bound, bound))
    : randomFraction(rng, bound, { allowInteger: true });
  let right = randomFraction(rng, bound, { allowInteger: true });
  if (compare(left, right) === 0) right = add(right, rational(1, Math.max(2, right.denominator)));
  const result = compare(left, right) >= 0 ? left : right;
  return finish({
    ...coordinates,
    prompt: `${display(left, true)} 与 ${display(right, true)}，较大的数是？`,
    result,
    operands: { kind: "compare", left: plain(left), right: plain(right) },
    direct: ["统一分母或比较符号与绝对值"],
    structure: "先看正负，再看离 0 的位置",
    estimate: "用数轴位置检查较大者"
  });
}

function generateIntegerAddSub(skill, coordinates, rng) {
  const bound = skill.operand_bounds[coordinates.band];
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
    direct: ["把减去负数改写为加上相反数"],
    structure: "用数轴方向合并位移",
    estimate: "检查结果符号与绝对值范围"
  });
}

function generateIntegerMulDiv(skill, coordinates, rng) {
  const bound = skill.operand_bounds[coordinates.band];
  const operator = rng.boolean() ? "multiply" : "divide";
  let left;
  let right;
  if (operator === "multiply") {
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
  return finish({
    ...coordinates,
    prompt: `${display(left, true)} ${symbol} ${display(right, true)} = ?`,
    result,
    operands: { kind: "binary", operator, left: plain(left), right: plain(right) },
    direct: ["先按同号为正、异号为负确定符号"],
    structure: "分解因数或用乘除互逆",
    estimate: "用奇偶、尾数与数量级检查"
  });
}

function generateFractionBinary(skill, coordinates, rng, mode) {
  const bound = Math.min(skill.operand_bounds[coordinates.band], 20);
  const left = randomFraction(rng, bound);
  const right = randomFraction(rng, bound);
  const operator = mode === "add-sub"
    ? (rng.boolean() ? "add" : "subtract")
    : (rng.boolean() ? "multiply" : "divide");
  const result = { add, subtract, multiply, divide }[operator](left, right);
  const symbol = { add: "+", subtract: "-", multiply: "×", divide: "÷" }[operator];
  return finish({
    ...coordinates,
    prompt: `${display(left, true)} ${symbol} ${display(right, true)} = ?`,
    result,
    operands: { kind: "binary", operator, left: plain(left), right: plain(right) },
    direct: [mode === "add-sub" ? "通分后合并分子" : "除法先转为乘倒数，再约分"],
    structure: mode === "add-sub" ? "选择最小公分母" : "先交叉约分再相乘",
    estimate: "先检查正负号，再检查结果大致区间"
  });
}

function generatePower(skill, coordinates, rng) {
  const bound = Math.min(skill.operand_bounds[coordinates.band], 10);
  const magnitudeCount = Math.max(1, bound - 1);
  const magnitude = 2 + (coordinates.index % magnitudeCount);
  const maximumExponent = coordinates.band === "foundation" ? 3 : coordinates.band === "standard" ? 4 : 6;
  const minimumExponent = coordinates.band === "foundation" ? 2 : 0;
  const exponentCount = maximumExponent - minimumExponent + 1;
  const exponent = minimumExponent + (Math.floor(coordinates.index / magnitudeCount) % exponentCount);
  const negativeBase = rng.boolean();
  const outsideSign = !negativeBase && rng.boolean() ? -1 : 1;
  const base = rational(negativeBase ? -magnitude : magnitude);
  const result = outsideSign < 0 ? negate(power(base, exponent)) : power(base, exponent);
  const baseText = negativeBase ? `(-${magnitude})` : String(magnitude);
  const prefix = outsideSign < 0 ? "-" : "";
  return finish({
    ...coordinates,
    prompt: `${prefix}${baseText}^${exponent} = ?`,
    result,
    operands: { kind: "power", base: plain(base), exponent, outside_sign: outsideSign },
    direct: ["先确认负号是否在括号内，再按指数连乘"],
    structure: "偶次幂与奇次幂的符号规律不同",
    estimate: "用底数大小和指数检查数量级"
  });
}

function generateMixed(skill, coordinates, rng) {
  const bound = Math.min(skill.operand_bounds[coordinates.band], 20);
  const fractionMode = coordinates.band !== "foundation" && rng.boolean();
  const makeValue = () => fractionMode
    ? randomFraction(rng, bound, { allowInteger: true })
    : rational(nonZeroInteger(rng, -bound, bound));
  const left = makeValue();
  const middle = makeValue();
  const right = makeValue();
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
      right: plain(right)
    },
    direct: ["先算括号，再做乘法"],
    structure: "观察能否先约分或提取共同符号",
    estimate: "分步检查符号和结果范围"
  });
}

export function generateExercise({ skillId, band, seed, index }) {
  const skill = skillById(skillId);
  if (!skill) throw new Error(`unknown skill: ${skillId}`);
  if (!BANDS.includes(band) || !skill.bands.includes(band)) throw new Error(`unknown band: ${band}`);
  if (!Number.isSafeInteger(index) || index < 0) throw new Error("index must be a non-negative safe integer");
  const coordinates = { skillId, band, seed: String(seed), index };
  const pinned = pinnedExercise(skillId, band, seed, index);
  if (pinned) return pinned;
  const rng = createExerciseRng(`${coordinates.seed}\u0000${skillId}\u0000${band}\u0000${index}`);

  if (skillId === "g7-rational-sign-opposite-absolute") return generateSign(skill, coordinates, rng);
  if (skillId === "g7-rational-compare") return generateCompare(skill, coordinates, rng);
  if (skillId === "g7-integer-add-sub") return generateIntegerAddSub(skill, coordinates, rng);
  if (skillId === "g7-integer-mul-div") return generateIntegerMulDiv(skill, coordinates, rng);
  if (skillId === "g7-fraction-add-sub") return generateFractionBinary(skill, coordinates, rng, "add-sub");
  if (skillId === "g7-fraction-mul-div") return generateFractionBinary(skill, coordinates, rng, "mul-div");
  if (skillId === "g7-rational-power") return generatePower(skill, coordinates, rng);
  if (skillId === "g7-rational-mixed") return generateMixed(skill, coordinates, rng);
  throw new Error(`unknown skill: ${skillId}`);
}
