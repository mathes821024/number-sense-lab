# CONTENT CONTRACT REVIEW REPORT

# Number Sense Lab v0.1｜课程内容契约自检报告（FIX 01 修订版）

状态：C0 → FIX 01 已修订。ChatGPT Content Review 结论「方向 PASS，NEEDS_FIX」中的全部修正项已执行，Q1–Q3 已按 Owner / ChatGPT Decision 落档。本报告供 Content Freeze Review 使用。

交付清单：

- `docs/curriculum/01_curriculum_structure.md`（课程结构）
- `docs/curriculum/02_content_inventory.md`（完整内容清单，含逐条选条理由）
- `docs/curriculum/03_feedback_design.md`（反馈与 Memory Hook 设计，含教学原理与学习科学依据）
- `docs/curriculum/99_future_backlog.md`（未来内容池）
- `docs/curriculum/FIX_01_REPORT.md`（本轮修正逐项报告）
- `content/v0.1/squares.core.json`、`squares.knowledge_map.json`
- `content/v0.1/products.core.json`、`products.knowledge_map.json`
- `content/v0.1/fractions.core.json`、`fractions.knowledge_map.json`

---

# 1. Squares（平方域）

- **Trainable relation count：16**（6²–20² 共 15 条 + 25²，上限 40 ✅）
- **Tiers**：Tier 1 即取层 **7** 条（6²、7²、8²、9²、10²、15²、20²）；Tier 2 结构层 **6** 条（11²、12²、13²、14²、16²、25²）；Tier 3 锚点层 **3** 条（17²、18²、19²）。分层依据是提取策略而非数字顺序，详见 01 第 3.2 节。文档与 JSON 已核对一致（FIX 1）。
- **知识地图**：1²–100² 共 100 条，Core Recall 16 / Structured Practice 28 / Recognition & Estimate 8 / Reference 48。

# 2. Useful Products（常用乘积域）

- **Trainable relation count：32**（上限 40 ✅）
- **Tiers**：Tier 1 四条（15×6、15×8、12×6、12×7）；Tier 2 十五条；Tier 3 十三条。
- **Selection logic**：候选池 6 ≤ a < b ≤ 19 共 91 对（交换去重、平方归平方域）；每条入选须命中至少一类证据维度，逐条理由见 02 第 2 节。频次类判断已统一标注为课程设计假设（FIX 3）。

# 3. Fraction → Decimal（分数 → 小数域）

- **Trainable relation count：27**（上限 40 ✅）
- **Denominator coverage**：分母 2（1 条）、4（2）、5（4）、8（4）、10（3）、20（6）、25（7），全部最简真分数、有限小数、仅分数→小数方向。知识地图 43 条（Core 27 / Structured Practice 16）。循环小数分母按 PRD 排除，进 Backlog。

# 4. Memory Hooks（记忆钩子统计，FIX 01 后）

| 类别 | 数量 |
| --- | --- |
| Natural structure（结构 35 + 变换 18 + 锚点 9 + 关系网络 2 + 合理性 2） | **66（88%）** |
| Artificial mnemonic（人工口诀） | **0** |
| Retrieval Anchor（诚实标记的纯提取锚点） | **9（12%）** |

FIX 2 学生版 Hook 审计：共修订 6 条（8²、12²、13²、14²、16²、16×8）。变化要点：移除「一打的平方」「计算机里天天见」等成人视角或新增概念的表达；13²/14² 默认 Hook 改为强化各自末位特征，易混辨别下沉到 Level 3；16²、8² 的 2 的连乘网络下沉到 Level 3（frames / family），默认层降级为诚实提取锚点；16×8 默认 Hook 改为拆分结构（80+48）。审计标准：Hook 若比「直接记住这条关系」更复杂，即降级为 Retrieval Anchor。

# 5. Supporting Examples（辅助相关例分离）

- 判别规则：一条关系是 trainable，当且仅当它作为独立记录出现在 `*.core.json`；出现在 `pattern.family`、知识地图、课程文档其他位置的一律是 supporting example。
- 实例：15² 的 family 含 25²=625、35²=1225。25² 是 Core 成员（Q1 已批准）；**35²、2⁸、2⁶、21² 等仅为 supporting example / 知识地图条目，不是可训练关系、mastery 对象或抽题对象**。
- 原型代码 `src/core/content.js` 的 `firstSliceCatalog` 含 square-25、square-35 两条可训练记录，正式 BUILD 时须以 `content/v0.1/` 数据整体替换（Q3 已确认），本次交付未触碰业务代码。

# 6. Scope Check（范围检查）

| 检查项 | 结果 |
| --- | --- |
| 仅三个域（平方 / 常用乘积 / 分数→小数） | ✅ |
| 每域可训练关系 ≤ 40 | ✅（16 / 32 / 27） |
| 常用乘积非 6–19 全集、交换不重复、不含平方 | ✅（91 选 32） |
| 分数→小数非候选分母全集、仅最简、仅有限小数、仅分数→小数 | ✅（43 选 27） |
| 立方、根式、常量、循环小数、小数→分数、开方、一步应用 | ✅ 全部未进入，记录于 99_future_backlog.md |
| 25/125/37 特殊家族 | ✅ 未扩大 6–19 候选池，整体进 Backlog |
| 知识地图层不进 UI、不进抽题、不要求新页面 | ✅ |
| 未修改 PRD / UX / UI / 架构 / 业务代码 | ✅ |

# 7. Originality Check（原创性检查）

- 原始大九九资料仅作候选来源与研究材料；只借用数学事实本身。未复制其命名、分族、版式、编排、表述、原题组织。
- 原创性核心证据：每条关系有独立选条理由（02）；Hook 体系（六类 + 优先级 + 双层内容）为自建；知识地图分层模型为自建；频次类表述已诚实标注为设计假设（FIX 3）。

# 8. Runtime Content（运行时内容）

**文件**（`content/v0.1/`）：`squares.core.json`（16）、`squares.knowledge_map.json`（100）、`products.core.json`（32）、`products.knowledge_map.json`（91）、`fractions.core.json`（27）、`fractions.knowledge_map.json`（43）。

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

**治理字段隔离**：`selection_rationale`、`teaching_rationale`、`review_status` 只存在于 docs/curriculum 文档，未进入任何运行时 JSON。

**判题规则（Q2 已批准）**：按数学等价值判题（0.5 = 0.50 = .5；289 = 0289），由统一 answer normalization 规则实现，不在内容数据中逐条枚举等价形式；展示统一用 `canonical_answer`。工程实现注意：不做 JS 浮点直接相等比较，需小数规范化。

**机器校验**：全部 75 条核心关系答案经脚本逐一重算验证；id 全局唯一；乘积无交换重复；文档与 JSON 的 tier 数量、Hook 统计已核对一致（FIX 1）。

# 9. Decisions & Remaining Actions

**Q1｜平方范围：RESOLVED（已批准并完成对齐）。** Squares Core Recall = 6²–20² + 25²；Knowledge Map = 1²–100²。PRD 对齐修订已完成（CONTENT FREEZE FINAL ALIGNMENT，2026-09-29）：`docs/product/01_prd.md` 第 9 节默认平方范围已更新为「6² 到 20²，外加 25²」，待验证问题 6 同步更新；未改动 PRD 其他任何内容。

**Q2｜答案等价形式：RESOLVED（已批准）。** 按数学等价值判题，统一 normalization，展示 canonical_answer；不逐条枚举 accepted forms。已写入 01 第 7 节接口表。

**Q3｜原型替换：CONFIRMED。** 正式 BUILD 时 `content/v0.1/*.core.json` 取代原型 `firstSliceCatalog`，成为训练内容唯一真相源；35² 只能作为 supporting example / knowledge-map item。

---

Final Status：**READY_FOR_CONTENT_FREEZE_REVIEW**
