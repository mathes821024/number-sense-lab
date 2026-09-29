# Delivery Workflow

## 交付工作流总纲

本文是整个项目协作方式的导航图，不新增细则。细则在：

- 授权与 PR 流程：[collaboration.md](collaboration.md)
- BUILD 交接与退回规则：[build_handoff.md](build_handoff.md)
- 角色定义与调用方法：[ai_roles_handbook.md](ai_roles_handbook.md)

先记住这一句：

> 人负责方向与体验，规格负责约束，AI 负责连续执行，证据负责推动下一轮演进。

---

# 1. 三层，各管各的

```text
判断层    Owner + ChatGPT        方向、边界、优先级、最终验收
规格层    专业角色（经 Cursor）   最少必要规格文档
执行层    Grok Bot / WorkBuddy   把冻结后的规格连续实现出来
          + 工程 Skills
```

执行层不顺手改需求，规格层不顺手改架构。Skill（TDD / Debug / 浏览器验证）是执行增强器，不是决策者：它决定代码怎么写好，不决定做什么。

---

# 2. 六阶段

```text
Define 定义 → Specify 规格 → Freeze 冻结 → Build 开发 → Experience 体验 → Evolve 演进
```

| 阶段 | 做什么 | 对应规则 |
| --- | --- | --- |
| Define | Owner 提出目标，ChatGPT 总控分析、拆解 | collaboration.md |
| Specify | 按需补专业角色，写最少必要规格。标准是：开发者看完知道做什么、为什么、边界在哪、什么不能自己决定。多于此就是 Specification Drift（规格漂移） | ai_roles_handbook.md |
| Freeze | ChatGPT Gate Review，Owner 拍板，契约冻结（CF0） | build_handoff.md §1 |
| Build | 冻结后连续开发，尽量不打断执行 | build_handoff.md §2、§6 |
| Experience | Owner 在真实成果上验收：好不好用，不看 commit 细节 | — |
| Evolve | 按 §5 分流：小问题直接修，契约变化回规格层，Re-Freeze 后继续 | build_handoff.md §5 |

节奏是：Freeze 之前减速，允许充分讨论；Freeze 之后加速，让执行连续跑完。

---

# 3. 什么时候调用专业角色

缺什么补什么，不走全员流程。例如：

- 产品范围不清 → Product
- 学习方法有问题 → Learning / Math Learning Designer
- 体验路径有问题 → UX
- 视觉表达有问题 → UI / Brand / Visual
- 架构边界变了 → Architecture
- 写代码 → Grok Bot

反例：Number Sense Lab 后来缺的不是更多 UI 文档，而是 Content Contract（课程内容契约）。发现缺专业能力才补角色，不为流程完整多跑一个 Agent。

---

# 4. 什么时候允许开发连续执行

同时满足两个条件：

1. 对应契约已 Freeze（CF0 通过），见 build_handoff.md §1；
2. Developer Preflight 确认没有歧义——把"理解错了"拦截在写代码之前。

进入 BUILD 后，里程碑之间默认不做人类过程 Review，但工程自检、测试、Debug、自动化验证继续执行。Owner 的 Review 只发生在可体验的成果上。

---

# 5. 变更分流（Change Classification）

```text
改变"怎么实现"       → 不回规格层，Developer 自己解决
                       （按钮偏了、接口报错、存储失败）
改变"实现什么"       → 回产品契约
改变"用户怎么体验"   → 回 UX / UI 契约
改变"教什么、怎么教" → 回 Content / Learning 契约
改变"系统边界"       → 回 Architecture 契约
```

回规格层的路径固定：补对应专业角色 → 更新契约 → ChatGPT Gate Review → Owner 决定 → Re-Freeze → 继续 BUILD。

实现与冻结契约冲突时，报告 `CONTRACT_CONFLICT` 并停住。不要让代码通过去改写契约。细则见 build_handoff.md §5。

---

# 6. 本文没有改什么

- 授权与 PR 流程：未改，见 collaboration.md。
- BUILD 交接规则：未改，见 build_handoff.md。
- 角色定义：未改，见 ai_roles_handbook.md。
- 产品、体验、界面、学习、架构契约：未改。
- 本文不声明当前项目 Gate 状态；具体 Gate 状态以对应阶段的 Review / Freeze 记录为准。
