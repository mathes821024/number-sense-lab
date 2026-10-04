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
