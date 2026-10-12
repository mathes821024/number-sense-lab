import { loadAtlas, validateAtlas } from "../src/core/atlas.js";

function countBy(items, key) {
  return Object.fromEntries(
    [...new Set(items.map((item) => item[key]))]
      .sort()
      .map((value) => [value, items.filter((item) => item[key] === value).length])
  );
}

try {
  const atlas = loadAtlas();
  validateAtlas(atlas);
  console.log(`Atlas valid: ${atlas.nodes.length} nodes, ${atlas.edges.length} edges`);
  console.log(`By status: ${JSON.stringify(countBy(atlas.nodes, "status"))}`);
  console.log(`By layer: ${JSON.stringify(countBy(atlas.nodes, "layer"))}`);
  console.log(`By band: ${JSON.stringify(countBy(atlas.nodes, "band"))}`);
} catch (error) {
  console.error(`Atlas invalid: ${error.message}`);
  process.exitCode = 1;
}
