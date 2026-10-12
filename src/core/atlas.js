import nodeDocument from "../../content/atlas/v0.1/nodes.json" with { type: "json" };
import edgeDocument from "../../content/atlas/v0.1/edges.json" with { type: "json" };

export const ATLAS_STATUSES = Object.freeze(["released", "contracted", "mapped"]);
export const ATLAS_LAYERS = Object.freeze([
  "representation",
  "fact",
  "relation-family",
  "strategy",
  "formula",
  "estimate-verify",
  "transfer"
]);
export const ATLAS_TRACKS = Object.freeze(["fact_memory", "calculation_skill", "atlas_only"]);
export const ATLAS_EDGE_TYPES = Object.freeze([
  "prerequisite",
  "derives",
  "inverse",
  "representation",
  "verifies",
  "transfers"
]);

export const REQUIRED_ATLAS_ROOTS = Object.freeze([
  "foundation.number-representation",
  "facts.complements-10-20-100",
  "facts.products-1-19",
  "facts.squares-cubes-powers",
  "representation.fraction-decimal-percent-repeating",
  "skills.roots",
  "skills.reduce-fractions",
  "skills.common-denominator",
  "formula.perfect-square",
  "formula.difference-of-squares",
  "formula.cube-identities",
  "reasoning.estimation-interval",
  "reasoning.last-digit-parity-factor",
  "grade7.rational-numbers",
  "future.exponents",
  "future.logarithms",
  "future.inequalities",
  "future.geometry-models"
]);

function cloneAtlas(atlas) {
  return {
    nodes: atlas.nodes.map((node) => ({ ...node, prerequisites: [...node.prerequisites] })),
    edges: atlas.edges.map((edge) => ({ ...edge }))
  };
}

function assertString(value, message) {
  if (typeof value !== "string" || value.length === 0) throw new Error(message);
}

function assertNoPrerequisiteCycle(nodes, edges) {
  const outgoing = new Map(nodes.map((node) => [node.id, []]));
  for (const edge of edges) {
    if (edge.type === "prerequisite") outgoing.get(edge.from).push(edge.to);
  }
  const visiting = new Set();
  const visited = new Set();

  function visit(id) {
    if (visiting.has(id)) throw new Error(`prerequisite cycle at ${id}`);
    if (visited.has(id)) return;
    visiting.add(id);
    for (const next of outgoing.get(id)) visit(next);
    visiting.delete(id);
    visited.add(id);
  }

  for (const node of nodes) visit(node.id);
}

export function validateAtlas(atlas) {
  if (!atlas || !Array.isArray(atlas.nodes) || !Array.isArray(atlas.edges)) {
    throw new Error("atlas must contain node and edge arrays");
  }

  const nodeIds = new Set();
  for (const node of atlas.nodes) {
    assertString(node?.id, "node id is required");
    if (nodeIds.has(node.id)) throw new Error(`duplicate node id: ${node.id}`);
    nodeIds.add(node.id);
    assertString(node.label, `node label is required: ${node.id}`);
    assertString(node.band, `node band is required: ${node.id}`);
    if (!ATLAS_LAYERS.includes(node.layer)) throw new Error(`invalid node layer: ${node.id}`);
    if (!ATLAS_TRACKS.includes(node.track)) throw new Error(`invalid node track: ${node.id}`);
    if (!ATLAS_STATUSES.includes(node.status)) throw new Error(`invalid node status: ${node.id}`);
    if (!Array.isArray(node.prerequisites)) throw new Error(`invalid prerequisites: ${node.id}`);
    if (node.status === "mapped" && node.released_entry !== null) {
      throw new Error(`mapped node has released entry: ${node.id}`);
    }
    if (node.status === "released" && typeof node.released_entry !== "string") {
      throw new Error(`released node is missing entry: ${node.id}`);
    }
    assertString(node.review_evidence, `review evidence is required: ${node.id}`);
  }

  for (const node of atlas.nodes) {
    const seen = new Set();
    for (const prerequisite of node.prerequisites) {
      if (!nodeIds.has(prerequisite)) {
        throw new Error(`unknown prerequisite ${prerequisite}: ${node.id}`);
      }
      if (prerequisite === node.id) throw new Error(`self prerequisite: ${node.id}`);
      if (seen.has(prerequisite)) throw new Error(`duplicate prerequisite ${prerequisite}: ${node.id}`);
      seen.add(prerequisite);
    }
  }

  const edgeIds = new Set();
  const prerequisitePairs = new Set();
  const inversePairs = new Set();
  for (const edge of atlas.edges) {
    assertString(edge?.id, "edge id is required");
    if (edgeIds.has(edge.id)) throw new Error(`duplicate edge id: ${edge.id}`);
    edgeIds.add(edge.id);
    if (!ATLAS_EDGE_TYPES.includes(edge.type)) throw new Error(`invalid edge type: ${edge.id}`);
    if (!nodeIds.has(edge.from) || !nodeIds.has(edge.to)) {
      throw new Error(`unknown edge endpoint: ${edge.id}`);
    }
    if (edge.from === edge.to) throw new Error(`self edge: ${edge.id}`);
    if (edge.type === "prerequisite") prerequisitePairs.add(`${edge.from}\u0000${edge.to}`);
    if (edge.type === "inverse") inversePairs.add(`${edge.from}\u0000${edge.to}`);
  }

  for (const node of atlas.nodes) {
    for (const prerequisite of node.prerequisites) {
      if (!prerequisitePairs.has(`${prerequisite}\u0000${node.id}`)) {
        throw new Error(`missing prerequisite edge ${prerequisite} -> ${node.id}`);
      }
    }
  }
  for (const pair of prerequisitePairs) {
    const [from, to] = pair.split("\u0000");
    const node = atlas.nodes.find((candidate) => candidate.id === to);
    if (!node.prerequisites.includes(from)) {
      throw new Error(`prerequisite edge not declared by node: ${from} -> ${to}`);
    }
  }
  for (const pair of inversePairs) {
    const [from, to] = pair.split("\u0000");
    if (!inversePairs.has(`${to}\u0000${from}`)) {
      throw new Error(`inverse edge must be paired: ${from} -> ${to}`);
    }
  }

  assertNoPrerequisiteCycle(atlas.nodes, atlas.edges);
  return true;
}

const SOURCE_ATLAS = {
  nodes: nodeDocument.nodes,
  edges: edgeDocument.edges
};
validateAtlas(SOURCE_ATLAS);

export function loadAtlas() {
  return cloneAtlas(SOURCE_ATLAS);
}

export function nodeById(id) {
  const node = SOURCE_ATLAS.nodes.find((candidate) => candidate.id === id);
  return node ? { ...node, prerequisites: [...node.prerequisites] } : null;
}

export function neighbors(id, type) {
  if (type !== undefined && !ATLAS_EDGE_TYPES.includes(type)) {
    throw new Error(`invalid edge type: ${type}`);
  }
  const adjacentIds = new Set();
  for (const edge of SOURCE_ATLAS.edges) {
    if (type && edge.type !== type) continue;
    if (edge.from === id) adjacentIds.add(edge.to);
    if (edge.to === id) adjacentIds.add(edge.from);
  }
  return [...adjacentIds].map((nodeId) => nodeById(nodeId));
}

export function atlasLayers() {
  return [...ATLAS_LAYERS];
}
