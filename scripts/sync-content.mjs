import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildProductPracticeVariants,
  buildReferenceRelations,
} from "../src/core/reference-facts.js";

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
  match = item.id?.match(/^half-(\d+)$/);
  if (match) return `half:${Number(match[1])}`;
  match = item.prompt?.match(/^(\d+) 的一半是？$/);
  if (item.domain === "halves" && match) return `half:${Number(match[1])}`;
  match = item.id?.match(/^i?fraction-(\d+)-(\d+)$/);
  if (match && item.domain === "fraction_decimal") {
    const frac = `${Number(match[1])}/${Number(match[2])}`;
    if (item.answer_type === "decimal_repeating") return `fraction_decimal:repeating_to_decimal:${frac}`;
    if (item.answer_type === "fraction_fields") return `fraction_decimal:to_fraction:${frac}`;
    return `fraction_decimal:to_decimal:${frac}`;
  }
  return `legacy:${item.id}`;
}

const manifest = JSON.parse(readFileSync(join(root, "content/v0.5/manifest.json"), "utf8"));
const knownKeys = new Set(relations.map((item) => semanticKey(item)));
const knownIds = new Set(relations.map((item) => item.id));
const referenceRelations = buildReferenceRelations(knownKeys, {
  complementTargets: manifest.complements.targets,
  knownIds,
});

// Compact, field-stripped JSON keeps the WeChat package under 2 MB.
function compactReference(item) {
  const out = {
    id: item.id,
    domain: item.domain,
    semantic_key: item.semantic_key,
    prompt: item.prompt,
    canonical_answer: item.canonical_answer,
    direction: item.direction,
    relation: item.relation,
    hook: item.hook,
  };
  if (item.answer_type && item.answer_type !== "integer") {
    out.answer_type = item.answer_type;
  }
  // collection is always reference_practice for this file; restore in loader.
  return out;
}

function compactProductVariants(byRelation) {
  // Compact rows: [suffix, direction-code, prompt, answer]
  // suffix is multiply|divide-a|divide-b; family_key rebuilt as product:a:b from prompt/operands.
  const out = {};
  for (const [relationId, variants] of Object.entries(byRelation)) {
    out[relationId] = variants.map((variant) => {
      const suffix = variant.practice_variant_id.slice(relationId.length + 1);
      return [suffix, variant.prompt, variant.canonical_answer];
    });
  }
  return out;
}

const referenceOut = join(root, "src/core/reference-catalog-data.js");
const compactRefs = referenceRelations.map(compactReference);
const referenceBody = `/** Auto-synced from content/v0.5/manifest.json via reference-facts.js — do not edit by hand. */\nexport const REFERENCE_RELATIONS = ${JSON.stringify(compactRefs)};\n`;
writeFileSync(referenceOut, referenceBody);
console.log(`Synced ${compactRefs.length} reference relations → src/core/reference-catalog-data.js`);

const productVariants = buildProductPracticeVariants(knownIds);

const variantsOut = join(root, "src/core/practice-variants-data.js");
const compactProducts = compactProductVariants(productVariants.byRelation);
const variantsBody = `/** Auto-synced practice variants (not mastery relation ids) — do not edit by hand. */\nexport const PRODUCT_PRACTICE_VARIANTS = ${JSON.stringify(compactProducts)};\nexport const PRODUCT_PRACTICE_VARIANT_STATS = ${JSON.stringify({
  families: productVariants.families,
  multiply: productVariants.multiply,
  divide: productVariants.divide,
  directions: productVariants.directions,
})};\n`;
writeFileSync(variantsOut, variantsBody);
console.log(
  `Synced product practice variants: ${productVariants.families} families, ` +
  `${productVariants.multiply} multiply, ${productVariants.divide} divide, ` +
  `${productVariants.directions} directions → src/core/practice-variants-data.js`
);
