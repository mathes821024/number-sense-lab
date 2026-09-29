# CONTENT CONTRACT REVIEW REPORT

# Number Sense Lab v0.1｜课程内容契约自检报告

状态：随 C0 课程交付提交，供 Owner 与 ChatGPT 做 Content Review 与 Content Freeze 决策。

交付清单：

- `docs/curriculum/01_curriculum_structure.md`（课程结构）
- `docs/curriculum/02_content_inventory.md`（完整内容清单，含逐条选条理由）
- `docs/curriculum/03_feedback_design.md`（反馈与 Memory Hook 设计，含教学原理与学习科学依据）
- `docs/curriculum/99_future_backlog.md`（未来内容池）
- `content/v0.1/squares.core.json`、`squares.knowledge_map.json`
- `content/v0.1/products.core.json`、`products.knowledge_map.json`
- `content/v0.1/fractions.core.json`、`fractions.knowledge_map.json`

---

# 1. Squares（平方域）

- **Trainable relation count：16**（6²–20² 共 15 条 + 25²，上限 40 ✅）
- **Tiers**：Tier 1 即取层 6 条（6²–10²、15²、20²）；Tier 2 结构层 6 条（11²–16²、25²）；Tier 3 锚点层 4 条（17²–19² 及 18²、19² 的借 20 结构）。分层依据是提取策略而非数字顺序，详见 01 第 3.2 节。
- **知识地图**：1²–100² 共 100 条，Core Recall 16 / Structured Practice 28 / Recognition & Estimate 8 / Reference 48。

# 2. Useful Products（常用乘积域）

- **Trainable relation count：32**（上限 40 ✅）
- **Selection logic**：候选池 6 ≤ a < b ≤ 19 共 91 对（交换去重、平方归平方域）；每条入选须命中至少一类证据（初中高频复现 / 后续代数价值 / 结构代表性 / 关系网络价值 / 降低工作记忆负担），逐条理由见 02 第 2 节。教学上按 ×11、×15、×12、13×、14×、16–19×一位数、十几×十几、6×十几组织；不是 6–19 完整笛卡尔积，不沿用任何现成资料的分族命名。

# 3. Fraction → Decimal（分数 → 小数域）

- **Trainable relation count：27**（上限 40 ✅）
- **Denominator coverage**：分母 2（1 条）、4（2）、5（4）、8（4）、10（3）、20（6）、25（7），全部最简真分数、有限小数、仅分数→小数方向。知识地图覆盖这 7 个分母的全部最简真分数共 43 条（Core 27 / Structured Practice 16）。循环小数分母（3、6、7、9、11…）按 PRD 排除，进 Backlog。

# 4. Memory Hooks（记忆钩子统计）

| 类别 | 数量 |
| --- | --- |
| Natural structure（结构 34 + 变换 18 + 锚点 9 + 关系网络 5 + 合理性 2） | **68（91%）** |
| Artificial mnemonic（人工口诀） | **0** |
| Retrieval Anchor（诚实标记的纯提取锚点） | **7（9%）** |

每条 Hook 均为双层：学生看到的短句（`hook` 字段）+ 课程层的 Teaching Rationale（03 第 3 节，含数学结构、迁移性、认知负担、误用风险、适用学生）。学习科学依据（提取练习、间隔、交错、合意困难、生成效应、组块化、双重编码、精加工、示例淡出、认知负荷、估算）及文献见 03 第 5 节，并区分了【研究】与【经验】。

# 5. Supporting Examples（辅助相关例分离）

- 判别规则已写入 01 第 2 节：一条关系是 trainable，当且仅当它作为独立记录出现在 `*.core.json`；出现在 `pattern.family`、知识地图、课程文档其他位置的一律是 supporting example。
- 实例：15² 的 family 含 25²=625、35²=1225。其中 25² 因范围修订提议同时是 Core 成员；**35²、2⁸、2⁶、21² 等仅为 supporting example / 知识地图条目，不是可训练关系、mastery 对象或抽题对象**。
- ⚠️ 已知遗留：原型代码 `src/core/content.js` 的 `firstSliceCatalog` 含 square-25、square-35 两条可训练记录。按 Owner Decision，35² 不得作为可训练关系。本次交付不修改业务代码；开发启动时须以 `content/v0.1/` 数据替换该原型目录（见第 9 节 Open Questions Q3）。

# 6. Scope Check（范围检查）

| 检查项 | 结果 |
| --- | --- |
| 仅三个域（平方 / 常用乘积 / 分数→小数） | ✅ |
| 每域可训练关系 ≤ 40 | ✅（16 / 32 / 27） |
| 常用乘积非 6–19 全集、交换不重复、不含平方 | ✅（91 选 32） |
| 分数→小数非候选分母全集、仅最简、仅有限小数、仅分数→小数 | ✅（43 选 27） |
| 立方、根式、常量、循环小数、小数→分数、开方、一步应用 | ✅ 全部未进入，记录于 99_future_backlog.md |
| 25/125/37 特殊家族 | ✅ 未扩大 6–19 候选池，整体进 Backlog |
| 知识地图层不进 UI、不进抽题、不要求新页面 | ✅（01 第 7 节） |
| 未修改 PRD / UX / UI / 架构 / 业务代码 | ✅ |

唯一超出已冻结范围的内容提议：25² 进入 Core Recall（见第 9 节 Q1）。

# 7. Originality Check（原创性检查）

- 原始大九九资料仅作候选来源与研究材料；只借用数学事实本身。
- 未复制其：命名（无「家族」）、分族方式（×11/×15 等是按提取策略的教学组织，非原表分族）、版式、编排、表述、原题组织。
- 原创性的核心证据：每条关系有独立选条理由（02），回答「为什么 Number Sense Lab 认为这个关系值得孩子直接记住」，而不是「这张表里有没有这道题」；Hook 体系（六类 + 优先级 + 双层内容）为自建；知识地图分层模型为自建。

# 8. Runtime Content（运行时内容）

**文件**（`content/v0.1/`）：

| 文件 | 内容 | 记录数 |
| --- | --- | --- |
| `squares.core.json` | 平方 Core Recall | 16 |
| `squares.knowledge_map.json` | 1²–100² 知识地图 | 100 |
| `products.core.json` | 常用乘积 Core Recall | 32 |
| `products.knowledge_map.json` | 6–19 候选池 | 91 |
| `fractions.core.json` | 分数→小数 Core Recall | 27 |
| `fractions.knowledge_map.json` | 7 分母最简真分数全集 | 43 |

**Schema（core 文件，运行时层）**：

```json
{
  "id": "square-15",
  "domain": "squares | products | fraction_decimal",
  "level": "core_recall",
  "tier": 1,
  "hook_type": "structure | transformation | anchor | relation_network | reasonableness | retrieval_anchor",
  "prompt": "15² = ?",
  "canonical_answer": "225",
  "answer_type": "integer | decimal",
  "relation": "15² = 225",
  "hook": "1 × 2 = 2，后面接 25。",
  "pattern": { "check": "……", "family": ["25² = 625"] },
  "frames": [{ "title": "1 × 2", "detail": "先看 5 前面的 1" }]
}
```

**Schema（knowledge_map 文件）**：`{ n/a/b/numerator…, value…, relation, level, strategy?/reasonableness? }`，`level ∈ core_recall | structured_practice | recognition_estimate | reference`。

**治理字段隔离**：`selection_rationale`、`teaching_rationale`、`review_status` 只存在于 docs/curriculum 文档，未进入任何运行时 JSON。`tier`、`hook_type` 是抽题与反馈需要的运行时元数据，保留在 JSON。

**机器校验**：全部 75 条核心关系的答案已经脚本验证数学正确（平方、乘积、小数换算逐一重算）；id 全局唯一；乘积无交换重复。

# 9. Open Questions（仅保留阻断 Content Freeze 的问题）

**Q1｜平方范围修订（需 Owner / ChatGPT 拍板）**：Core Recall 提议为 6²–20² **+ 25²**（16 条）。PRD 冻结的默认范围是 6²–20²，但 PRD 待验证问题 6 恰好询问该范围是否合适。25² 的入选理由：625 高频、尾 5 结构价值、与 15² 形成规律对。若否，则从 `squares.core.json` 移除 square-25（降为 supporting example），其余不变。

**Q2｜答案等价形式（产品待验证问题，影响判题）**：`0.50` 与 `0.5`、`.5` 与 `0.5`、`0289` 与 `289` 是否算对，仍是 UX 第 18 节 PRODUCT_DECISION_REQUIRED。运行时 JSON 目前只提供 `canonical_answer`，未预置 `accepted_answer_forms`，避免内容层越权替产品做决定。冻结内容前无需解决，但开发启动前需要产品给出规则。

**Q3｜原型代码替换（开发启动时的衔接，非内容问题）**：`src/core/content.js` 的 firstSliceCatalog（square-15/25/35）是原型示例，开发启动时须整体替换为 `content/v0.1/` 数据，其中 square-35 按 Owner Decision 不得作为可训练关系。本次交付未触碰业务代码。

---

自检结论：除 Q1 待拍板外，本交付满足 v0.1 Content Contract 的全部既定要求，建议进入 Owner / ChatGPT Content Review。
