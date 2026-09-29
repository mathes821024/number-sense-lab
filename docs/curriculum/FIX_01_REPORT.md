# CONTENT CONTRACT REVIEW — FIX 01 REPORT

对 ChatGPT《CONTENT CONTRACT REVIEW — FIX 01》的逐项回应。

---

**Squares**

- Core：16（6²–20² + 25²）
- Tier counts：Tier 1 = 7（6² 7² 8² 9² 10² 15² 20²）｜Tier 2 = 6（11² 12² 13² 14² 16² 25²）｜Tier 3 = 3（17² 18² 19²）｜Total = 16。文档（01、REVIEW_REPORT）与 JSON 已一致。

**Hook Audit（FIX 2）**

- changed count：**6**（square-8、square-12、square-13、square-14、square-16、product-16-8）
  - 12²：移除「一打的平方」，改为诚实提取锚点。
  - 16²：移除「计算机里天天见」；2⁸=256 下沉 Level 3（frames / family），默认层改为提取锚点。
  - 8²：默认 Hook 去掉 2⁶ 附加信息，回归「八八六十四」；2⁶ 保留在 Level 3。
  - 13² / 14²：默认 Hook 改为各自末位特征（个位 9 / 个位 6）；易混辨别下沉 Level 3（pattern.check）。
  - 16×8：默认 Hook 改为拆分结构（80+48=128）；2⁷ 网络下沉 Level 3。
- retrieval-anchor final count：**9**（6²、7²、8²、9²、12²、16²、17²、17×8、1/2）
- 其余 69 条经同一标准复核（Hook 若比直接记住更复杂即降级），无需变更。

**Evidence Language（FIX 3）**

- changed count：**14** 处选条理由修订（square-12、square-16、square-25、product-12-7、product-12-14、product-13-7、product-13-8、product-13-14、product-14-8、product-15-8、product-15-12、product-17-6、product-16-8、及分数域 0.15/0.35/0.65/0.12/0.32 等），另加全文档「依据性质说明」段落。
- 处理规则：无教材语料 / 题库统计 / 文献支撑的频次判断，统一改为「复用价值较高（设计判断，待真实使用数据验证）」；有数学事实支撑的单独注明（180 = 三角形内角和；14×16 = 15²−1）。
- 证据维度「初中高频复现」更名为「后续计算复用价值」（01 第 4.2 节同步修订）。

**Learning Science Corrections（FIX 4）：PASS**

1. Level 1→2→3 改标为 Progressive Disclosure / Scaffolding；Worked Example Fading 重新定义为跨多次训练逐渐撤掉示例与 Hook、最终独立提取。
2. Generation Effect 回归正确定义（主动生成优于阅读答案；对应输入作答与 A4 纸笔）；「答错后不立即原题重做」改归 spacing / delayed retrieval / interleaving。
3. 新增明确条款：Content Tier ≠ Review Interval（01 第 6 节、03 第 5 节）。tier = 内容进入顺序 / 初始教学建议；复习调度由运行时按学生表现决定。

**Citation Accuracy（FIX 5）：PASS**

- Roediger & Karpicke (2006) 的 61% vs 40% 保留，归属不变。
- Interleaving 的 61% vs 38% 已明确归属 Rohrer, Dedrick & Hartwig (2020) 随机课堂实验；Rohrer & Taylor (2007) 只表述为最早验证，不再挂该数字。

**Q1：RESOLVED** — Squares Core Recall = 6²–20² + 25²（已批准）；Knowledge Map = 1²–100²。遗留动作：Content Freeze 前对 PRD 默认平方范围做小型对齐修订（需 Owner 授权，产品契约流程）。

**Q2：RESOLVED** — 按数学等价值判题（0.5 = 0.50 = .5；289 = 0289），统一 answer normalization，展示 canonical_answer；不逐条枚举 accepted forms。已写入 01 第 7 节与 REVIEW_REPORT 第 8 节。

**Q3：RESOLVED** — 正式 BUILD 时 `content/v0.1/*.core.json` 取代原型 `firstSliceCatalog`；35² 仅作 supporting example / knowledge-map item。本次未触碰业务代码。

**JSON Validation**

- 75 条核心关系答案逐一重算：PASS
- id 全局唯一：PASS
- 乘积交换去重：PASS
- 文档 / JSON 数量一致性（tier 分布、Hook 统计、各域计数）：PASS

**Changed Files**

- `content/v0.1/squares.core.json`（5 条记录修订）
- `content/v0.1/products.core.json`（1 条记录修订）
- `docs/curriculum/01_curriculum_structure.md`（tier 数量、选条标准措辞、Content Tier ≠ Review Interval、判题规则、Q1 落档）
- `docs/curriculum/02_content_inventory.md`（证据语言、依据性质说明、Hook 统计动态一致）
- `docs/curriculum/03_feedback_design.md`（FIX 4、FIX 5 校正）
- `docs/curriculum/REVIEW_REPORT.md`（Q1–Q3 落档、统计更新、最终状态）
- `docs/curriculum/FIX_01_REPORT.md`（本文件，新增）

**Branch**：docs/curriculum-v0.1
**Commit**：见该分支最新提交（本报告随 FIX 01 提交一同入库）

**Final Status：READY_FOR_CONTENT_FREEZE_REVIEW**
