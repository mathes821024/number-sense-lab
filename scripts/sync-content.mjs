import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

/**
 * Trainable Core Recall sources, in catalog order.
 * The original 75 keep their v0.1 order; v0.2C relations are appended,
 * then the v0.4 domains in DOMAIN_ORDER (halves, complements, cubes, powers,
 * special_products).
 * Knowledge maps and Structured Practice files are never synced.
 */
export const CORE_SOURCES = [
  "content/v0.1/squares.core.json",
  "content/v0.1/products.core.json",
  "content/v0.1/fractions.core.json",
  "content/v0.2c/squares_inverse.core.json",
  "content/v0.2c/fractions_inverse.core.json",
  "content/v0.2c/fractions_repeating.core.json",
  "content/v0.4/halves.core.json",
  "content/v0.4/complements.core.json",
  "content/v0.4/cubes.core.json",
  "content/v0.4/powers.core.json",
  "content/v0.4/special_products.core.json",
];

const relations = [];
for (const file of CORE_SOURCES) {
  const data = JSON.parse(readFileSync(join(root, file), "utf8"));
  relations.push(...data.relations);
}
const out = join(root, "src/core/catalog-data.js");
const body = `/** Auto-synced from content/v0.1 + content/v0.2c + content/v0.4 *.core.json — do not edit by hand. */\nexport const CORE_RELATIONS = ${JSON.stringify(relations, null, 2)};\n`;
writeFileSync(out, body);
console.log(`Synced ${relations.length} relations → src/core/catalog-data.js`);

const superscriptDigits = {
  "0": "⁰",
  "1": "¹",
  "2": "²",
  "3": "³",
  "4": "⁴",
  "5": "⁵",
  "6": "⁶",
  "7": "⁷",
  "8": "⁸",
  "9": "⁹",
};

function superscript(value) {
  return String(value).split("").map((digit) => superscriptDigits[digit]).join("");
}

function productKey(a, b) {
  return `product:${Math.min(a, b)}:${Math.max(a, b)}`;
}

function semanticKey(item) {
  let match = item.prompt?.match(/^(\d+) × (\d+) = \?$/);
  if (item.domain === "products" && match) return productKey(Number(match[1]), Number(match[2]));
  match = item.prompt?.match(/^(\d+) \+ \? = (\d+)$/);
  if (item.domain === "complements" && match) {
    return `complement:${Number(match[2])}:${Number(match[1])}`;
  }
  match = item.id?.match(/^square-(\d+)$/);
  if (match) return `square:forward:${Number(match[1])}`;
  match = item.id?.match(/^isquare-(\d+)$/);
  if (match) return `square:inverse:${Number(match[1])}`;
  match = item.id?.match(/^cube-(\d+)$/);
  if (match) return `cube:forward:${Number(match[1])}`;
  match = item.id?.match(/^icube-(\d+)$/);
  if (match) return `cube:inverse:${Number(match[1])}`;
  match = item.id?.match(/^pow-(\d+)-(\d+)$/);
  if (match) return `power:forward:${Number(match[1])}:${Number(match[2])}`;
  match = item.id?.match(/^ipow-(\d+)-(\d+)$/);
  if (match) return `power:inverse:${Number(match[1])}:${Number(match[2])}`;
  return `legacy:${item.id}`;
}

function referenceRelation({ id, domain, key, prompt, answer, direction, relation, hook }) {
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
    answer_type: "integer",
    direction,
    relation,
    hook,
    pattern: {
      check: "先判断结果范围，再用逆运算或相邻事实检查。",
      family: [],
    },
    frames: [
      { title: "直接算", detail: hook },
      { title: "检查", detail: "用逆运算或相邻事实检查结果。" },
    ],
    families: [],
    entry_after: null,
  };
}

const manifest = JSON.parse(readFileSync(join(root, "content/v0.5/manifest.json"), "utf8"));
const knownKeys = new Map(relations.map((item) => [semanticKey(item), item.id]));
const referenceRelations = [];

function addReference(spec) {
  if (knownKeys.has(spec.key)) return;
  knownKeys.set(spec.key, spec.id);
  referenceRelations.push(referenceRelation(spec));
}

for (let a = 1; a <= 19; a += 1) {
  for (let b = a; b <= 19; b += 1) {
    const answer = a * b;
    addReference({
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

for (const target of manifest.complements.targets) {
  for (let operand = 1; operand < target; operand += 1) {
    const answer = target - operand;
    addReference({
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
  addReference({
    id: `ref-square-${value}`,
    domain: "squares",
    key: `square:forward:${value}`,
    prompt: `${value}² = ?`,
    answer,
    direction: "forward",
    relation: `${value}² = ${answer}`,
    hook: `${value}² 就是 ${value} × ${value}。`,
  });
  addReference({
    id: `ref-isquare-${value}`,
    domain: "squares",
    key: `square:inverse:${value}`,
    prompt: `哪个正数的平方是 ${answer}？`,
    answer: value,
    direction: "inverse",
    relation: `${value}² = ${answer}`,
    hook: `寻找平方等于 ${answer} 的正数。`,
  });
}

for (let value = 1; value <= 20; value += 1) {
  const answer = value * value * value;
  addReference({
    id: `ref-cube-${value}`,
    domain: "cubes",
    key: `cube:forward:${value}`,
    prompt: `${value}³ = ?`,
    answer,
    direction: "forward",
    relation: `${value}³ = ${answer}`,
    hook: `${value}³ 就是 ${value} × ${value} × ${value}。`,
  });
  addReference({
    id: `ref-icube-${value}`,
    domain: "cubes",
    key: `cube:inverse:${value}`,
    prompt: `哪个正数的立方是 ${answer}？`,
    answer: value,
    direction: "inverse",
    relation: `${value}³ = ${answer}`,
    hook: `寻找立方等于 ${answer} 的正数。`,
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
    addReference({
      id: `ref-power-${base}-${exponent}`,
      domain: "powers",
      key: forwardKey,
      prompt: `${base}${superscript(exponent)} = ?`,
      answer,
      direction: "forward",
      relation: `${base}${superscript(exponent)} = ${answer}`,
      hook: `${base} 连乘 ${exponent} 次。`,
    });
    addReference({
      id: `ref-ipower-${base}-${exponent}`,
      domain: "powers",
      key: `power:inverse:${base}:${exponent}`,
      prompt: `${answer} = ${base} 的几次方？`,
      answer: exponent,
      direction: "inverse",
      relation: `${answer} = ${base}${superscript(exponent)}`,
      hook: `沿 ${base} 的幂链定位指数。`,
    });
  }
}

const referenceOut = join(root, "src/core/reference-catalog-data.js");
const referenceBody = `/** Auto-synced from content/v0.5/manifest.json — do not edit by hand. */\nexport const REFERENCE_RELATIONS = ${JSON.stringify(referenceRelations, null, 2)};\n`;
writeFileSync(referenceOut, referenceBody);
console.log(`Synced ${referenceRelations.length} reference relations → src/core/reference-catalog-data.js`);
