export function judgeAnswer(item, raw) {
  const text = String(raw ?? "").trim();
  if (!text) return { kind: "empty" };
  if (item.integerOnly && !/^\d+$/.test(text)) return { kind: "invalid" };
  const sameInteger = item.integerOnly && Number(text) === Number(item.answer);
  if (text === item.answer || sameInteger) return { kind: "correct" };
  return { kind: "wrong" };
}
