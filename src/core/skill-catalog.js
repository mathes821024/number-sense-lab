import skillDocument from "../../content/skills/v0.1/grade7-rational.json" with { type: "json" };

export const SKILL_IDS = Object.freeze([
  "g7-rational-sign-opposite-absolute",
  "g7-rational-compare",
  "g7-integer-add-sub",
  "g7-integer-mul-div",
  "g7-fraction-add-sub",
  "g7-fraction-mul-div",
  "g7-rational-power",
  "g7-rational-mixed"
]);

const BANDS = ["foundation", "standard", "transfer"];

function validateCatalog(skills) {
  if (!Array.isArray(skills) || skills.length !== SKILL_IDS.length) {
    throw new Error("CONTRACT_CONFLICT: Grade 7 skill count");
  }
  const ids = skills.map((skill) => skill.id);
  if (new Set(ids).size !== ids.length || ids.some((id, index) => id !== SKILL_IDS[index])) {
    throw new Error("CONTRACT_CONFLICT: Grade 7 skill IDs or order");
  }
  for (const skill of skills) {
    if (JSON.stringify(skill.bands) !== JSON.stringify(BANDS)) {
      throw new Error(`CONTRACT_CONFLICT: bands for ${skill.id}`);
    }
    for (const band of BANDS) {
      if (!Number.isSafeInteger(skill.operand_bounds[band]) || skill.operand_bounds[band] <= 0) {
        throw new Error(`CONTRACT_CONFLICT: operand bound for ${skill.id}:${band}`);
      }
      if (!Number.isSafeInteger(skill.step_limits[band]) || skill.step_limits[band] <= 0) {
        throw new Error(`CONTRACT_CONFLICT: step limit for ${skill.id}:${band}`);
      }
    }
  }
}

validateCatalog(skillDocument.skills);

function cloneSkill(skill) {
  return {
    ...skill,
    bands: [...skill.bands],
    operand_bounds: { ...skill.operand_bounds },
    step_limits: { ...skill.step_limits },
    answer_types: [...skill.answer_types],
    exclusions: [...skill.exclusions],
    explanation_templates: [...skill.explanation_templates]
  };
}

export function skillCatalog() {
  return skillDocument.skills.map(cloneSkill);
}

export function skillById(id) {
  const skill = skillDocument.skills.find((candidate) => candidate.id === id);
  return skill ? cloneSkill(skill) : null;
}
