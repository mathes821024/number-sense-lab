import assert from "node:assert/strict";
import test from "node:test";

import {
  REQUIRED_ATLAS_ROOTS,
  atlasLayers,
  loadAtlas,
  neighbors,
  nodeById,
  validateAtlas
} from "../src/core/atlas.js";

test("Atlas v0.1 covers every accepted topic family", () => {
  const ids = new Set(loadAtlas().nodes.map((node) => node.id));
  for (const id of REQUIRED_ATLAS_ROOTS) assert.ok(ids.has(id), id);
});

test("mapped-only nodes never expose a released entry", () => {
  for (const node of loadAtlas().nodes.filter((item) => item.status === "mapped")) {
    assert.equal(node.released_entry, null, node.id);
  }
});

test("reader exposes stable lookup, typed neighbors and frozen layer order", () => {
  assert.equal(nodeById("grade7.rational-numbers")?.label, "有理数");
  assert.ok(neighbors("grade7.rational-numbers", "prerequisite").length > 0);
  assert.deepEqual(atlasLayers(), [
    "representation",
    "fact",
    "relation-family",
    "strategy",
    "formula",
    "estimate-verify",
    "transfer"
  ]);
});

test("loadAtlas returns detached data", () => {
  const first = loadAtlas();
  first.nodes[0].label = "changed";
  first.edges.length = 0;
  const second = loadAtlas();
  assert.notEqual(second.nodes[0].label, "changed");
  assert.ok(second.edges.length > 0);
});

test("validator rejects duplicate ids, unknown endpoints, self edges and cycles", () => {
  const valid = loadAtlas();
  assert.throws(
    () => validateAtlas({ nodes: [...valid.nodes, valid.nodes[0]], edges: valid.edges }),
    /duplicate node id/
  );
  assert.throws(
    () => validateAtlas({ nodes: valid.nodes, edges: [...valid.edges, { id: "bad-end", from: "missing", to: valid.nodes[0].id, type: "derives" }] }),
    /unknown edge endpoint/
  );
  assert.throws(
    () => validateAtlas({ nodes: valid.nodes, edges: [...valid.edges, { id: "self", from: valid.nodes[0].id, to: valid.nodes[0].id, type: "derives" }] }),
    /self edge/
  );

  const nodes = valid.nodes.slice(0, 2).map((node, index, selected) => ({
    ...node,
    prerequisites: [selected[index === 0 ? 1 : 0].id]
  }));
  const edges = [
    { id: "cycle-a", from: nodes[0].id, to: nodes[1].id, type: "prerequisite" },
    { id: "cycle-b", from: nodes[1].id, to: nodes[0].id, type: "prerequisite" }
  ];
  assert.throws(() => validateAtlas({ nodes, edges }), /prerequisite cycle/);
});

test("inverse edges are paired and schema vocabularies are closed", () => {
  const valid = loadAtlas();
  const unpaired = {
    nodes: valid.nodes,
    edges: [...valid.edges, { id: "inverse-unpaired", from: valid.nodes[0].id, to: valid.nodes[1].id, type: "inverse" }]
  };
  assert.throws(() => validateAtlas(unpaired), /inverse edge must be paired/);

  assert.throws(
    () => validateAtlas({ nodes: [{ ...valid.nodes[0], status: "coming-soon" }], edges: [] }),
    /invalid node status/
  );
  assert.throws(
    () => validateAtlas({ nodes: valid.nodes.slice(0, 2), edges: [{ id: "bad-type", from: valid.nodes[0].id, to: valid.nodes[1].id, type: "similar" }] }),
    /invalid edge type/
  );
});
