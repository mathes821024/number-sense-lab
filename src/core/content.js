export const square15 = {
  id: "square-15",
  domain: "squares",
  prompt: "15² = ?",
  answer: "225",
  integerOnly: true,
  relation: "15² = 225",
  hook: "1 × 2 = 2，后面接 25。",
  pattern: {
    check: "末位是 5 的整数平方，一定以 25 结尾。225 在 100 和 400 之间。",
    family: ["25² = 625", "35² = 1225"],
  },
  frames: [
    { title: "1 × 2", detail: "先看 5 前面的 1" },
    { title: "2", detail: "1 × 2 得到前面这一截" },
    { title: "2 | 25", detail: "后面接上 25" },
    { title: "225", detail: "15² = 225" },
  ],
};

export const firstSliceCatalog = [square15];
