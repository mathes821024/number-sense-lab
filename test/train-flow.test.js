import assert from "node:assert/strict";
import test from "node:test";

import { createTrainingFlow } from "../app/pages/train/flow.js";
import { trainingIntent } from "../app/pages/train/intent.js";
import { emptyState } from "../src/core/store.js";
import { loadCoreCatalog } from "../src/core/content.js";
import { isReferenceSession } from "../src/core/reference-session.js";

function memoryStore(root) {
  let data = root;
  return {
    read: () => data,
    write: (next) => {
      data = next;
      return true;
    },
  };
}

test("trainingIntent recognizes start-reference", () => {
  assert.deepEqual(trainingIntent({ intent: "start-reference", domain: "products" }), {
    kind: "begin-reference",
    domain: "products",
  });
  assert.equal(trainingIntent({ intent: "start-reference", domain: "nope" }).kind, "begin");
});

test("flow beginReference leaves historical relations byte-identical after a full set", () => {
  const coreId = loadCoreCatalog()[0].id;
  const root = emptyState({ learnerId: "flow-ref", createdOn: "2026-10-12" });
  root.learners["flow-ref"].relations = {
    [coreId]: {
      status: "stable",
      attempts: [{ correct: true, day: "2026-10-01", at: 1 }],
      schedule: { due_day: "2026-10-30", interval_days: 20 },
    },
  };
  const before = JSON.stringify(root.learners["flow-ref"].relations);
  const flow = createTrainingFlow({
    store: memoryStore(root),
    today: () => "2026-10-12",
    now: () => 1000,
    clock: () => 42,
  });
  flow.beginReference("products");
  assert.equal(isReferenceSession(flow.session), true);

  for (let i = 0; i < 40 && flow.view().screen !== "end"; i += 1) {
    const screen = flow.view().screen;
    if (screen === "train") {
      flow.input("9");
      const outcome = flow.submit();
      if (outcome === "nudge") {
        flow.erase();
        flow.input("9");
        flow.input("9");
        flow.submit();
      }
    } else if (screen === "correct" || screen === "wrong") {
      flow.advance();
    } else {
      break;
    }
  }
  assert.equal(flow.view().screen, "end");
  assert.equal(flow.view().result.title, "乘除关系练习");
  assert.equal(flow.view().result.subtitle, "从乘积反推因数，也从因数得到乘积");
  assert.equal(JSON.stringify(flow.state.relations), before);
  assert.equal(flow.state.activeSession, null);
});

test("refreshing a reference intent resumes the reference session instead of a focused mastery set", () => {
  const root = emptyState({ learnerId: "resume-ref", createdOn: "2026-10-12" });
  const store = memoryStore(root);
  const flow = createTrainingFlow({
    store,
    today: () => "2026-10-12",
    now: () => 1000,
    clock: () => 7,
  });
  flow.beginReference("squares");
  flow.input("1");
  const midQueue = flow.session.queue.slice();

  const flow2 = createTrainingFlow({
    store,
    today: () => "2026-10-12",
    now: () => 2000,
    clock: () => 7,
  });
  flow2.resume();
  assert.equal(isReferenceSession(flow2.session), true);
  assert.equal(flow2.session.domain, "squares");
  assert.deepEqual(flow2.session.queue, midQueue);
});
