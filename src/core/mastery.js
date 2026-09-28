export function studentLabel(status) {
  const labels = {
    未练: "还没练到",
    学习中: "正在熟悉",
    稳定: "已经很稳",
    动摇: "再巩固一下",
  };
  return labels[status];
}

export function emptyRelation() {
  return { status: "未练", attempts: [] };
}

function dayCount(attempts) {
  return new Set(attempts.map((attempt) => attempt.day)).size;
}

function meetsSuggestedStable(attempts) {
  // PRD 给出的起点，不是已冻结的次数。慢的正确不计入。
  const counted = attempts.filter((attempt) => attempt.correct && !attempt.slow);
  if (counted.length < 3 || dayCount(counted) < 2) return false;
  const recent = attempts.slice(-2);
  return recent.length === 2 && recent.every((attempt) => attempt.correct);
}

export function applyAttempt(relation, attempt) {
  const next = {
    status: relation.status,
    attempts: relation.attempts.concat(attempt),
  };
  if (!attempt.correct) {
    next.status = relation.status === "稳定" ? "动摇" : "学习中";
    return next;
  }
  if (relation.status === "稳定") {
    next.status = "稳定";
    return next;
  }
  next.status = !attempt.slow && meetsSuggestedStable(next.attempts) ? "稳定" : "学习中";
  return next;
}
