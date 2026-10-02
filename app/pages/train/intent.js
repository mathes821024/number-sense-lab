/**
 * What a training page opened with (?intent=…) asks for — the same actions
 * h5/app.js runs from Home, 专项练习 and 错题本: start-daily / restart-daily /
 * resume / see-last / start-focus (one released domain) / start-mistakes.
 * Anything unknown starts today's set, like Home's main path.
 */
import { DOMAIN_ORDER } from "../../../src/core/content.js";
import { MISTAKE_BOOK_SOURCE } from "../../../src/core/schedule.js";

export function trainingIntent(params = {}) {
  const intent = params.intent || "start-daily";
  if (intent === "resume") return { kind: "resume" };
  if (intent === "restart-daily") return { kind: "restart", mode: "daily", domain: null };
  if (intent === "see-last") return { kind: "last" };
  if (intent === "start-focus" && DOMAIN_ORDER.includes(params.domain)) {
    return { kind: "begin", mode: "focused", domain: params.domain };
  }
  if (intent === "start-mistakes") return { kind: "begin", mode: MISTAKE_BOOK_SOURCE, domain: null };
  return { kind: "begin", mode: "daily", domain: null };
}
