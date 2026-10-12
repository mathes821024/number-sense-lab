# Learning Asset Tracks Contract

状态：`FROZEN FOR FIRST-LAUNCH BUILD`

冻结依据：Owner 于 2026-10-12 确认首版“一核四端”、七年级有理数与学习资产分层方向；本文件记录其中与当前仓库直接相关的稳定边界。

## 1. 三条轨道

Number Sense Lab 的学习资产固定分为三条轨道：

| 轨道 | 身份 | 掌握单位 | 当前实现 |
| --- | --- | --- | --- |
| Fact Memory | `relation_id` | 一条有限事实关系 | 保留现有 173 条，追加参考事实 |
| Calculation Skills | `skill_id` + 可复现 `exercise_id` | 一个技能与难度带 | 新增七年级有理数 8 技能 |
| Knowledge Atlas | `node_id` / `edge_id` | 不进入掌握 | 新增 Atlas v0.1 |

不得把 Atlas 浏览记录当成掌握证据，不得给随机生成的每道题永久 `relation_id`，不得让一次技能作答改变事实关系掌握。

## 2. 持久身份

- 现有 173 个 `relation_id`、答案、顺序和历史证据保持不变。
- 新有限事实只追加。语义与旧事实相同时复用旧 ID。
- `skill_id` 一经发布不得改义。题目由 `seed + skill_id + band + index` 决定。
- `exercise_id` 用于审计一次生成结果，不作为跨版本永久课程身份。
- Atlas 节点和边有稳定 ID；改文案不改 ID，改语义必须新增 ID 并标记旧项状态。

## 3. 数据接口

```text
loadCoreCatalog()                         → 历史 173 条 Mastery Core
loadFactCatalog({ includeReference })     → Core + Reference Practice
loadAtlas()                               → { nodes, edges }
generateExercise({ skillId, band, seed, index }) → Exercise
```

`Exercise` 至少包含：

```text
id, skill_id, band, prompt, canonical_answer,
answer_type, explanations, operands, checksum
```

`explanations` 固定为 `direct`、`structure`、`estimate`。每项含 `available`、`summary`、`steps`。

## 4. 学习者状态 v4

v4 在 v3 基础上只追加：

```text
skills: Record<skill_id, { status, attempts, schedule }>
activeSkillSession: SkillSession | null
```

旧 `relations`、`activeSession`、`sessions`、`lastResult`、`learner_id` 和偏好不得重算或改义。v3→v4 必须逐版本迁移；未来未知版本继续写保护。

技能尝试只保存：

```text
exercise_id, band, outcome, normalized, day,
elapsedMs, inputMode, mixedInput
```

不把讲解正文、Atlas 文本或视觉状态写入学习记录。

## 5. 调度

- 每日事实训练只读取 `mastery_core`。
- `reference_practice` 只由学生主动进入专项。
- `exploration_only` 不进入事实或技能调度。
- Grade 7 默认进入 `foundation` 和 `standard`；`transfer` 主动选择。
- 事实会话与技能会话独立恢复、独立结束、独立记录。

## 6. 平台边界

`src/core/` 不调用 `window`、`document`、`wx`、`tt`、`my`、Taro 或平台存储。四端用同一生成器、同一精确判题和同一迁移。平台差异只进入 `app/platform/`。

## 7. 验证命令

```bash
npm test
npm run check:atlas
npm run sync-content
git diff --exit-code src/core/catalog-data.js src/core/reference-catalog-data.js
```

## 8. 停止条件

- `CONTENT_ID_CONFLICT`
- `DATA_MIGRATION_RISK`
- 生成器需要浮点数才能决定对错
- Atlas 节点被实现成掌握项目
- 平台差异进入 Core
