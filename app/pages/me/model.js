export function profileView(learner = {}) {
  const relations = Object.values(learner.relations || {});
  const practiced = relations.filter((relation) => (relation?.attempts || []).length > 0);
  const nickname = learner.profile?.nickname || "";
  return {
    nickname,
    displayName: nickname || "小研究员",
    practicedRelations: practiced.length,
    stableRelations: practiced.filter((relation) => relation.status === "stable").length,
    sound: learner.prefs?.sound !== false,
  };
}
