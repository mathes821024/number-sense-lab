import assert from "node:assert/strict";
import test from "node:test";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const coreDir = join(dirname(fileURLToPath(import.meta.url)), "../src/core");

test("core sources do not call platform APIs", () => {
  const banned = [
    "localStorage",
    "sessionStorage",
    "document.",
    "window.",
    "wx.",
    "tt.",
    "my.",
    "indexedDB",
  ];
  const files = readdirSync(coreDir).filter((f) => f.endsWith(".js"));
  assert.ok(files.length >= 6);
  for (const file of files) {
    const source = readFileSync(join(coreDir, file), "utf8");
    for (const token of banned) {
      assert.equal(source.includes(token), false, `${file} contains ${token}`);
    }
  }
});

test("prototype firstSliceCatalog is not the formal content source", () => {
  const files = readdirSync(coreDir).filter((f) => f.endsWith(".js"));
  for (const file of files) {
    const source = readFileSync(join(coreDir, file), "utf8");
    assert.equal(source.includes("firstSliceCatalog"), false, file);
  }
});
