# Reasoning Tools and Correct-Answer Explanation Contract

状态：`FROZEN FOR FIRST-LAUNCH BUILD`

## 1. 目标

练习保持短路径，但答对和答错都能主动看原理。理解是可进入、可退出的工具，不是每题强制上课。

## 2. 三工具

标签和顺序固定为：

1. `直接算`
2. `结构算`
3. `估算检查`

数据来自 `explanationsFor(item)`：

```text
{ direct, structure, estimate }
tool = { available, summary, steps[] }
```

旧内容兼容映射：

- `relation/frames` → 直接算；
- `hook/frames` → 结构算；
- `pattern.check/pattern.family` → 估算检查。

显式 `item.explanations` 优先。没有内容时标记不可用，不编造。

## 3. 答对流程

```text
提交 → 记录一次正确 → 正确反馈
                    ├─ 未操作：按冻结时长自动进入下一题
                    └─ 点击“看原理”：取消计时 → 三工具 → “继续” → 下一题
```

- 标题：`正确`
- 关系状态：`关系成立`
- 安静操作：`看原理`
- 展开后主操作：`继续`
- 打开/关闭工具不再次判题、不再次记录、不改变掌握。
- 计时器与点击竞争时只能发生一次 advance。
- 页面隐藏时取消计时；恢复后保持当前明确状态。

## 4. 答错流程

- 标题：`先看这条关系`
- 正确关系仍是最大内容。
- 使用同一个三工具面板，替换“看看这个规律/看看这几步”两个重复入口。
- 不允许当场重做本题；按现有重现计划稍后再见。
- `下一题` 只 advance 一次。

## 5. 吉祥物和语气

- 训练、正确、错误、键盘、三工具面板均无吉祥物。
- 不使用“太棒了”“真聪明”等固定幼儿教师式夸奖。
- 默认语气是中性、可靠、简短：`正确`、`关系成立`、`检查通过`。
- 首页可以保留一次欢迎姿态；Explore/Atlas 最多一个边缘伙伴。

## 6. 焦点和读屏

正确反馈顺序：关系 → 状态 → 看原理。展开后：标题 → 三工具控制 → 内容 → 继续。

错误反馈顺序：暂停 → 原题 → 正确关系 → 三工具控制 → 内容 → 下一题。

不可用工具说明“这题不需要”，不作为可点击项。关系线、刻度和动画 `aria-hidden`，数学含义由顺序文本承载。

## 7. 验收

```bash
node --test test/explanations.test.js
node --test test/xp-shared-ui.test.js test/flow.integration.test.js
node --test test/xp-pages.test.js
```

必须覆盖正确计时器竞争、生命周期中断、无重复记录、三工具缺项和低动态。
