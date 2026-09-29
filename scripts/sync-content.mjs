import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dir = join(root, "content/v0.1");
const files = readdirSync(dir).filter((f) => f.endsWith(".core.json")).sort();
const relations = [];
for (const file of files) {
  const data = JSON.parse(readFileSync(join(dir, file), "utf8"));
  relations.push(...data.relations);
}
const out = join(root, "src/core/catalog-data.js");
const body = `/** Auto-synced from content/v0.1/*.core.json — do not edit by hand. */\nexport const CORE_RELATIONS = ${JSON.stringify(relations, null, 2)};\n`;
writeFileSync(out, body);
console.log(`Synced ${relations.length} relations → src/core/catalog-data.js`);
