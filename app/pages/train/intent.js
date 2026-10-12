/**
 * What a training page opened with (?intent=…) asks for — the same actions
 * h5/app.js runs from Home, 专项练习 and 错题本: start-daily / restart-daily /
 * resume / see-last / start-focus (one released domain) / start-mistakes.
 * Anything unknown starts today's set, like Home's main path.
 */
import { DOMAIN_ORDER } from "../../../src/core/content.js";
import { MISTAKE_BOOK_SOURCE } from "../../../src/core/schedule.js";
import { skillById } from "../../../src/core/skill-catalog.js";

export function trainingIntent(params = {}) {
  const intent = params.intent || "start-daily";
  if (intent === "resume") return { kind: "resume" };
  if (intent === "resume-skill") return { kind: "resume-skill" };
  if (intent === "restart-daily") return { kind: "restart", mode: "daily", domain: null };
  if (intent === "see-last") return { kind: "last" };
  if (intent === "start-reference" && DOMAIN_ORDER.includes(params.domain)) {
    return { kind: "begin-reference", domain: params.domain };
  }
  if (intent === "start-focus" && DOMAIN_ORDER.includes(params.domain)) {
    return { kind: "begin", mode: "focused", domain: params.domain };
  }
  if (intent === "start-mistakes") return { kind: "begin", mode: MISTAKE_BOOK_SOURCE, domain: null };
  if (intent === "start-skill" && skillById(params.skill)) {
    const skill = skillById(params.skill);
    const band = skill.bands.includes(params.band) ? params.band : "foundation";
    return { kind: "begin-skill", skillId: skill.id, band };
  }
  return { kind: "begin", mode: "daily", domain: null };
}
