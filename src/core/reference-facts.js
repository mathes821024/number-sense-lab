/**
 * Sync/build-time generators for reference_practice facts and product
 * practice variants. scripts/sync-content.mjs materializes the outputs into
 * stable data modules; runtime must read those modules and must not call
 * these builders to invent anonymous facts.
 */
export function gcd(a, b) {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y) [x, y] = [y, x % y];
  return x || 1;
}

export function exactDecimal(n, d) {
  let num = n;
  let den = d;
  const g = gcd(num, den);
  num /= g;
  den /= g;
  let twos = 0;
  let fives = 0;
  while (den % 2 === 0) {
    den /= 2;
    twos += 1;
  }
  while (den % 5 === 0) {
    den /= 5;
    fives += 1;
  }
  if (den !== 1) throw new Error(`non-terminating fraction ${n}/${d}`);
  const places = Math.max(twos, fives);
  // num / (2^twos * 5^fives) = scaled / 10^places
  // => scaled = num * 2^(places-twos) * 5^(places-fives)
  let scaled = num;
  for (let i = twos; i < places; i += 1) scaled *= 2;
  for (let i = fives; i < places; i += 1) scaled *= 5;
  if (places === 0) return String(scaled);
  const digits = String(scaled).padStart(places + 1, "0");
  const whole = digits.slice(0, digits.length - places).replace(/^0+(?=\d)/, "") || "0";
  const frac = digits.slice(-places).replace(/0+$/, "");
  return frac ? `${whole}.${frac}` : whole;
}

export function exactPercent(n, d) {
  return exactDecimal(n * 100, d);
}

export function repeatingCanonical(n, d) {
  let rem = n % d;
  const seen = new Map();
  let decimals = "";
  while (rem !== 0 && !seen.has(rem)) {
    seen.set(rem, decimals.length);
    rem *= 10;
    decimals += Math.floor(rem / d);
    rem %= d;
  }
  if (rem === 0) throw new Error(`terminating fraction ${n}/${d} is not repeating`);
  const start = seen.get(rem);
  const prefix = decimals.slice(0, start);
  const block = decimals.slice(start);
  return prefix ? `0.${prefix}(${block})` : `0.(${block})`;
}

const superscriptDigits = {
  "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴",
  "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹",
};

function superscript(value) {
  return String(value).split("").map((digit) => superscriptDigits[digit]).join("");
}

function productKey(a, b) {
  return `product:${Math.min(a, b)}:${Math.max(a, b)}`;
}

function referenceRelation({
  id,
  domain,
  key,
  prompt,
  answer,
  direction,
  relation,
  hook,
  answerType = "integer",
  check = "先判断结果范围，再用逆运算或相邻事实检查。",
  frames = null,
  families = [],
  entryAfter = null,
}) {
  return {
    id,
    domain,
    collection: "reference_practice",
    semantic_key: key,
    level: "reference_practice",
    tier: 3,
    hook_type: "definition",
    prompt,
    canonical_answer: String(answer),
    answer_type: answerType,
    direction,
    relation,
    hook,
    pattern: { check, family: [] },
    frames: frames || [
      { title: "直接算", detail: hook },
      { title: "检查", detail: "用逆运算或相邻事实检查结果。" },
    ],
    families,
    entry_after: entryAfter,
  };
}

/** Historical core product id when present; otherwise the reference id. */
export function productRelationId(a, b, knownIds) {
  const lo = Math.min(a, b);
  const hi = Math.max(a, b);
  const coreId = `product-${lo}-${hi}`;
  if (knownIds?.has(coreId)) return coreId;
  // Some historical ids may not be sorted lo-hi — check both orders.
  const alt = `product-${a}-${b}`;
  if (knownIds?.has(alt)) return alt;
  const alt2 = `product-${b}-${a}`;
  if (knownIds?.has(alt2)) return alt2;
  return `ref-product-${lo}-${hi}`;
}

/**
 * Build the 551 materialized practice variants for 1≤a≤b≤19.
 * Variants hang off the fact family's relation_id; they are NOT mastery ids.
 */
export function buildProductPracticeVariants(knownIds = new Set()) {
  /** @type {Record<string, object[]>} */
  const byRelation = {};
  let multiply = 0;
  let divide = 0;
  for (let a = 1; a <= 19; a += 1) {
    for (let b = a; b <= 19; b += 1) {
      const p = a * b;
      const relationId = productRelationId(a, b, knownIds);
      const variants = [
        {
          practice_variant_id: `${relationId}:multiply`,
          direction: "multiply",
          prompt: `${a} × ${b} = ?`,
          canonical_answer: String(p),
          answer_type: "integer",
          family_key: productKey(a, b),
          operands: { a, b, product: p },
        },
      ];
      multiply += 1;
      variants.push({
        practice_variant_id: `${relationId}:divide-a`,
        direction: "divide-a",
        prompt: `${p} ÷ ${a} = ?`,
        canonical_answer: String(b),
        answer_type: "integer",
        family_key: productKey(a, b),
        operands: { a, b, product: p, divisor: a, quotient: b },
      });
      divide += 1;
      if (a !== b) {
        variants.push({
          practice_variant_id: `${relationId}:divide-b`,
          direction: "divide-b",
          prompt: `${p} ÷ ${b} = ?`,
          canonical_answer: String(a),
          answer_type: "integer",
          family_key: productKey(a, b),
          operands: { a, b, product: p, divisor: b, quotient: a },
        });
        divide += 1;
      }
      byRelation[relationId] = variants;
    }
  }
  return { byRelation, multiply, divide, families: Object.keys(byRelation).length, directions: multiply + divide };
}

/**
 * Square / cube root practice variants (arithmetic root, no ±).
 * Attached to forward square/cube relation ids.
 */
export function buildPowerRootPracticeVariants(knownIds = new Set()) {
  /** @type {Record<string, object[]>} */
  const byRelation = {};
  for (let value = 1; value <= 100; value += 1) {
    const square = value * value;
    const forwardId = knownIds.has(`square-${value}`) ? `square-${value}` : `ref-square-${value}`;
    byRelation[forwardId] = [
      {
        practice_variant_id: `${forwardId}:forward`,
        direction: "forward",
        prompt: `${value}² = ?`,
        canonical_answer: String(square),
        answer_type: "integer",
        family_key: `square:forward:${value}`,
      },
      {
        practice_variant_id: `${forwardId}:root`,
        direction: "root",
        prompt: `√${square} = ?`,
        canonical_answer: String(value),
        answer_type: "integer",
        family_key: `square:inverse:${value}`,
      },
    ];
  }
  for (let value = 1; value <= 20; value += 1) {
    const cube = value * value * value;
    const forwardId = knownIds.has(`cube-${value}`) ? `cube-${value}` : `ref-cube-${value}`;
    byRelation[forwardId] = [
      {
        practice_variant_id: `${forwardId}:forward`,
        direction: "forward",
        prompt: `${value}³ = ?`,
        canonical_answer: String(cube),
        answer_type: "integer",
        family_key: `cube:forward:${value}`,
      },
      {
        practice_variant_id: `${forwardId}:root`,
        direction: "root",
        prompt: `∛${cube} = ?`,
        canonical_answer: String(value),
        answer_type: "integer",
        family_key: `cube:inverse:${value}`,
      },
    ];
  }
  return byRelation;
}

/**
 * @param {Iterable<string>} knownKeys semantic keys already owned by mastery_core
 * @param {{ complementTargets?: number[], knownIds?: Set<string> }} [opts]
 */
export function buildReferenceRelations(knownKeys, opts = {}) {
  const known = knownKeys instanceof Set ? knownKeys : new Set(knownKeys);
  const knownIds = opts.knownIds instanceof Set ? opts.knownIds : new Set();
  const referenceRelations = [];
  function add(spec) {
    if (known.has(spec.key)) return;
    known.add(spec.key);
    referenceRelations.push(referenceRelation(spec));
  }

  for (let a = 1; a <= 19; a += 1) {
    for (let b = a; b <= 19; b += 1) {
      const answer = a * b;
      add({
        id: `ref-product-${a}-${b}`,
        domain: "products",
        key: productKey(a, b),
        prompt: `${a} × ${b} = ?`,
        answer,
        direction: "forward",
        relation: `${a} × ${b} = ${answer}`,
        hook: `${a} 个 ${b}，按乘法定义得到 ${answer}。`,
      });
    }
  }

  for (const target of opts.complementTargets || [10, 20, 100]) {
    for (let operand = 1; operand < target; operand += 1) {
      const answer = target - operand;
      add({
        id: `ref-complement-${target}-${operand}`,
        domain: "complements",
        key: `complement:${target}:${operand}`,
        prompt: `${operand} + ? = ${target}`,
        answer,
        direction: "forward",
        relation: `${operand} + ${answer} = ${target}`,
        hook: `从 ${operand} 补到 ${target}，还差 ${answer}。`,
      });
    }
  }

  for (let value = 1; value <= 100; value += 1) {
    const answer = value * value;
    add({
      id: `ref-square-${value}`,
      domain: "squares",
      key: `square:forward:${value}`,
      prompt: `${value}² = ?`,
      answer,
      direction: "forward",
      relation: `${value}² = ${answer}`,
      hook: `${value}² 就是 ${value} × ${value}。`,
    });
    add({
      id: `ref-isquare-${value}`,
      domain: "squares",
      key: `square:inverse:${value}`,
      prompt: `√${answer} = ?`,
      answer: value,
      direction: "inverse",
      relation: `√${answer} = ${value}`,
      hook: `${answer} 的算术平方根是 ${value}，不是 ±${value}。`,
    });
  }

  for (let value = 1; value <= 20; value += 1) {
    const answer = value * value * value;
    add({
      id: `ref-cube-${value}`,
      domain: "cubes",
      key: `cube:forward:${value}`,
      prompt: `${value}³ = ?`,
      answer,
      direction: "forward",
      relation: `${value}³ = ${answer}`,
      hook: `${value}³ 就是 ${value} × ${value} × ${value}。`,
    });
    add({
      id: `ref-icube-${value}`,
      domain: "cubes",
      key: `cube:inverse:${value}`,
      prompt: `∛${answer} = ?`,
      answer: value,
      direction: "inverse",
      relation: `∛${answer} = ${value}`,
      hook: `${answer} 的算术立方根是 ${value}。`,
    });
  }

  for (const [base, end] of [[2, 10], [3, 6], [5, 5], [10, 6]]) {
    for (let exponent = 1; exponent <= end; exponent += 1) {
      const answer = base ** exponent;
      const forwardKey = exponent === 2
        ? `square:forward:${base}`
        : exponent === 3
          ? `cube:forward:${base}`
          : `power:forward:${base}:${exponent}`;
      add({
        id: `ref-power-${base}-${exponent}`,
        domain: "powers",
        key: forwardKey,
        prompt: `${base}${superscript(exponent)} = ?`,
        answer,
        direction: "forward",
        relation: `${base}${superscript(exponent)} = ${answer}`,
        hook: `${base} 连乘 ${exponent} 次。`,
      });
      add({
        id: `ref-ipower-${base}-${exponent}`,
        domain: "powers",
        key: `power:inverse:${base}:${exponent}`,
        prompt: `${answer} = ${base} 的几次方？`,
        answer: exponent,
        direction: "inverse",
        relation: `${answer} = ${base}${superscript(exponent)}`,
        hook: `沿 ${base} 的幂链定位指数，不使用对数符号。`,
      });
    }
  }

  const FINITE_DENOMINATORS = [2, 4, 5, 8, 10, 20, 25];
  for (const d of FINITE_DENOMINATORS) {
    for (let n = 1; n < d; n += 1) {
      if (gcd(n, d) !== 1) continue;
      const frac = `${n}/${d}`;
      const decimal = exactDecimal(n, d);
      const percent = exactPercent(n, d);
      add({
        id: `ref-fraction-${n}-${d}`,
        domain: "fraction_decimal",
        key: `fraction_decimal:to_decimal:${frac}`,
        prompt: `${frac} = ?`,
        answer: decimal,
        direction: "forward",
        relation: `${frac} = ${decimal}`,
        hook: `${n} ÷ ${d} = ${decimal}。`,
        answerType: "decimal",
        check: `${decimal} × ${d} = ${n}。`,
      });
      add({
        id: `ref-ifraction-${n}-${d}`,
        domain: "fraction_decimal",
        key: `fraction_decimal:to_fraction:${frac}`,
        prompt: `${decimal} = ?/?`,
        answer: frac,
        direction: "inverse",
        relation: `${decimal} = ${frac}`,
        hook: `${decimal} 就是最简分数 ${frac}。`,
        answerType: "fraction_fields",
        check: `${n}/${d} = ${decimal}。`,
      });
      add({
        id: `ref-pct-${n}-${d}`,
        domain: "fraction_decimal",
        key: `fraction_decimal:to_percent:${frac}`,
        prompt: `${frac} = ?%`,
        answer: percent,
        direction: "forward",
        relation: `${frac} = ${percent}%`,
        hook: `${frac} = ${decimal} = ${percent}%。`,
        answerType: "percent_number",
        check: `${percent}% = ${frac}。`,
      });
      add({
        id: `ref-ipct-${n}-${d}`,
        domain: "fraction_decimal",
        key: `fraction_decimal:from_percent:${frac}`,
        prompt: `${percent}% = ?/?`,
        answer: frac,
        direction: "inverse",
        relation: `${percent}% = ${frac}`,
        hook: `${percent}% 就是最简分数 ${frac}。`,
        answerType: "fraction_fields",
        check: `${frac} = ${percent}%。`,
      });
    }
  }

  const REPEATING_FRACTIONS = [
    [1, 3], [2, 3],
    [1, 6], [5, 6],
    [1, 9], [2, 9], [4, 9], [5, 9], [7, 9], [8, 9],
    [1, 7], [2, 7], [3, 7], [4, 7], [5, 7], [6, 7],
  ];
  for (const [n, d] of REPEATING_FRACTIONS) {
    const frac = `${n}/${d}`;
    const repeating = repeatingCanonical(n, d);
    add({
      id: `ref-rep-${n}-${d}`,
      domain: "fraction_decimal",
      key: `fraction_decimal:repeating_to_decimal:${frac}`,
      prompt: `${frac} = ?`,
      answer: repeating,
      direction: "forward",
      relation: `${frac} = ${repeating}`,
      hook: `${n} ÷ ${d} 得到循环小数 ${repeating}。`,
      answerType: "decimal_repeating",
      check: `循环节还原后应回到 ${frac}。`,
    });
    add({
      id: `ref-irep-${n}-${d}`,
      domain: "fraction_decimal",
      key: `fraction_decimal:repeating_to_fraction:${frac}`,
      prompt: `${repeating} = ?/?`,
      answer: frac,
      direction: "inverse",
      relation: `${repeating} = ${frac}`,
      hook: `${repeating} 就是最简分数 ${frac}。`,
      answerType: "fraction_fields",
      check: `${frac} = ${repeating}。`,
    });
  }

  for (let value = 2; value <= 100; value += 2) {
    const answer = value / 2;
    add({
      id: `ref-half-${value}`,
      domain: "halves",
      key: `half:${value}`,
      prompt: `${value} 的一半是？`,
      answer,
      direction: "forward",
      relation: `${value} 的一半是 ${answer}`,
      hook: `${value} ÷ 2 = ${answer}。`,
    });
  }

  for (let value = 1; value <= 50; value += 1) {
    const answer = value * 2;
    add({
      id: `ref-double-${value}`,
      domain: "halves",
      key: `double:${value}`,
      prompt: `${value} 翻倍是？`,
      answer,
      direction: "forward",
      relation: `${value} 翻倍是 ${answer}`,
      hook: `${value} × 2 = ${answer}。`,
    });
  }

  return referenceRelations;
}
