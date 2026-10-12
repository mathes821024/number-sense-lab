import { SKILL_IDS } from "../../../src/core/skill-catalog.js";

const stages = [
  { id: "recognize", label: "认识有理数", note: "看见符号、位置与大小", skills: SKILL_IDS.slice(0, 2) },
  { id: "operations", label: "掌握四则", note: "沿着数轴与分组来计算", skills: SKILL_IDS.slice(2, 4) },
  { id: "fractions", label: "进入分数", note: "对齐单位，再组合关系", skills: SKILL_IDS.slice(4, 6) },
  { id: "transfer", label: "综合运用", note: "从乘方走向运算结构", skills: SKILL_IDS.slice(6, 8) },
];

export const GRADE7_STAGES = Object.freeze(stages.map((stage) => Object.freeze({
  ...stage,
  skills: Object.freeze([...stage.skills]),
})));

const STRUCTURE_KINDS = Object.freeze({
  "g7-rational-sign-opposite-absolute": "number-line",
  "g7-rational-compare": "compare-points",
  "g7-integer-add-sub": "signed-move",
  "g7-integer-mul-div": "grouping",
  "g7-fraction-add-sub": "fraction-align",
  "g7-fraction-mul-div": "fraction-area",
  "g7-rational-power": "power",
  "g7-rational-mixed": "operation-tree",
});

export function structureKindForSkill(skillId) {
  return STRUCTURE_KINDS[skillId] || null;
}
