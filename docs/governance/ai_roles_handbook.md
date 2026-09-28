# AI 协作角色手册

## AI Collaboration Roles Handbook

这份手册记下 Number Sense Lab（数感训练场）做到现在，已经长出来的一套协作方法。

它不只服务这一个仓库。以后做产品、教育系统、HTML 教学页、PPT、海报、视频，或用 AI 协助开发，都可以按同一套方法调用角色。

先记住这次真正学到的事：

> 质量出了问题，先问是不是缺了一个专业视角。不要逼着同一个角色把不属于它的事也做完。

已经发生过两次：

```text
界面太寡淡
→ 不是继续逼 UI Designer（界面设计师）把 CSS 调漂亮
→ 补上品牌、视觉叙事、愉悦感

答错以后的解释太浅
→ 不是继续逼 Product（产品）和 UX（用户体验）改文案
→ 补上学习设计、数学学习设计
```

英文术语第一次出现时，后面用括号写出中文。后面可以只用中文或英文。

---

# 1. 三层，不要混在一起

## Owner / Orchestration Layer（决策层 / 总调度层）

| 谁 | 是什么 |
| --- | --- |
| Owner（你） | 最终目标和决定权。角色可以建议，不能替你拍板 |
| ChatGPT | Orchestrator（编排者，决定谁先做）和 Gate Reviewer（阶段门评审）。看远程仓库，决定这一阶段能不能过 |

## Professional Role Layer（专业角色层）

Cursor 是 Professional Role Workbench（专业角色工作台）。

Cursor 本身不是一个专业角色。它像一间办公室。产品、体验、学习、界面、品牌、架构这些角色坐在里面工作。

## Implementation Layer（实施层）

Grok Bot 是 Implementation Agent（实施智能体）。Contract Freeze（契约冻结，规则定住）之后，它按已经冻结的契约写正式代码。

冻结之前，不把它叫来开发业务。

```text
Owner（你）决定
        ↓
ChatGPT 调度和评审
        ↓
Cursor 这间办公室里的专业角色
        ↓
契约冻结
        ↓
Grok Bot 按契约实施
```

---

# 2. 已落地的 11 个角色

这里的「已落地」按这次协作里已经明确使用、并且 Owner 计入核心角色的名单。第 13 节会分开写：哪些在这台电脑上已经有 Cursor 规则文件，哪些是协作中在用、但还没有单独的规则文件。不要把规则文件和业务代码混成一件事。

## 1. Product Manager（产品经理）

负责：做什么、给谁做、为什么做、第一版做到哪。

不负责：页面怎么排、按钮颜色、错题怎么讲、服务器怎么搭。

典型输入：谁在用、痛在哪里、不能做什么。

典型输出：产品说明。例如初中生每天练大约 5～10 分钟，练的是数感（对数字关系的感觉）和提取速度，不是题库，也不是游戏。

什么时候叫：要决定做不做、第一版边界、能不能加登录、金币、排行榜。

配合：UX Architect 把范围变成路径。Math Learning Designer 不改产品范围，只决定错了以后教什么。

Number Sense Lab 的例子：不做登录、不做云同步、不做排行榜。记录只留在当前设备。

## 2. UX Architect（用户体验架构师）

负责：人进来先看见什么、点哪里、答错后发生什么、怎么停、状态怎么变。

不负责：这个按钮漂不漂亮，这条数学规律是否好记。

典型输入：产品范围。

典型输出：一条可以走完的路径。选今天练或一个域 → 一题 → 输入 → 判断 → 立刻反馈 → 记下。答错不马上重做。结束时主按钮是「先到这里」。

什么时候叫：流程、信息放哪、空提交算不算错、暂停后回来还停在哪。

配合：Product Manager 定边界。UI Designer 把这条路径画成屏幕。Math Learning Designer 只改反馈里教的内容，不改这条路径，除非 Owner 另作决定。

## 3. UI Designer（界面设计师）

负责：层级、字号、颜色、组件、卡片、手机和平板怎么排。

不负责：品牌气质本身，也不负责「好不好玩」这一层性格。

典型输入：UX 路径，以及品牌已经定下的气质。

典型输出：一屏里什么最大、主按钮在哪、键盘多高。题目在做题时必须是视觉中心。

什么时候叫：要把已经定下的流程落到具体界面。

配合：Brand Guardian 先定气质。Visual Storyteller 定画面怎么讲。Whimsy Injector 只加少量触感。

这次的教训：只靠 UI Designer，会把「安静」做成「寡淡」。纸色底加一颗深绿按钮，功能没错，但人不想继续。

## 4. Backend Architect（后端架构师）

负责：系统分成哪些模块、模块边界、接口、数据怎么流、后端实现时不能越界的地方。

不负责：学生看到的句子、品牌、记忆钩子。

典型输入：产品说本地保存、不同步。

典型输出：结构约束。例如现在没有账号、没有云同步。原型里的本地存储键不是正式数据契约。

什么时候叫：要讨论模块怎么分、什么必须留在设备上。现在还没到正式后端开发。

配合：Technical Architect（技术架构师，见第 5 节）看更广的技术选择。API / Data Contract Designer 以后把接口写成可冻结的契约。本角色不提前发明后端。

## 5. Contract Document Editor（契约文档编辑器）

负责：把已经决定的内容整理成统一、可评审的文档。

不负责：重新决定产品、体验、界面或架构。

典型输入：各角色已经写好的结论。

典型输出：目录一致、用词一致、可放进 Pull Request（拉取请求，请别人审查的变更）的文档。

什么时候叫：几份文档要用同一个词、同一条基线，或者评审意见只是把文档对齐。

配合：它排在专业角色之后。两份已通过的文档互相打架时，它标出冲突并停下，不自己选赢家。

## 6. Brand Guardian（品牌守护）

负责：还没读字之前，这个产品应该像谁。年龄感、性格、以后在 App、网页、PPT、海报上是不是同一个人。

不负责：每个按钮的像素，也不负责某一题的数学讲解。

典型输入：目标是大约 12～15 岁，不要幼儿园，也不要成人笔记软件。

典型输出：气质词。这次从「安静的纸」改成「澄蓝数学实验室」：数学、空间、轻科技、想走进去，但做题时能静下来。

什么时候叫：页面能用，但没有性格；或者换一种媒介时，怕长得像另一个产品。

配合：UI Designer 落地组件。Visual Storyteller 把气质变成画面。Whimsy Injector 在这个气质里加一点点生命。

## 7. Visual Storyteller（视觉叙事设计师）

负责：信息怎么变成有顺序的画面，让人一眼看懂。

不负责：整套组件库，也不负责提示词的摄影参数细节。

典型输入：一条要被记住的关系，例如 `15² = 225`。

典型输出：顺序，而不是一句定义。

```text
1 × 2
  ↓
2
  ↓
接 25
  ↓
225
```

什么时候叫：知识要被看见；做 PPT、海报、教学页、视频分镜、数学动画。

配合：Math Learning Designer 先确定钩子是真的。Image Prompt Engineer 在需要生成图时写提示词。UI Designer 把这个顺序放进屏幕，且做题时不播整段故事。

以后它不限于这个 App。课件、汇报页、海报、视频都可以叫它。

## 8. Whimsy Injector（愉悦感设计师）

Whimsy（小趣味）不是游戏设计。

负责：大约一成的生命力。按下时轻压 1～2 像素、数字落下、完成时一颗小光、数学物体慢慢浮一下。

不负责：金币、连胜、火焰、排行榜、烟花、大声庆祝。

典型输入：一个已经定好的界面，和一条学习或情绪上的理由。

典型输出：一个小动作。每个动作都要服务「愿意再做一题」或「错了也不烦」。

什么时候叫：东西正确但像工具，需要一点温度。不要在做题计算时加闹的动效。

配合：Brand Guardian 守住年龄感。Math Learning Designer 决定动效是不是记忆线索（Memory Cue），而不是装饰。

## 9. Image Prompt Engineer（图像提示词设计师）

负责：把已经定下的画面写成可以生成图像的提示词。对象、光线、不能出现什么。

不负责：决定品牌，也不负责在没人要求时生成正式素材。

典型输入：Visual Storyteller 说要一个半透明线框立方，不要人物。

典型输出：一段可复用的提示词。无文字水印、无奖励图标、无卡通角色。

什么时候叫：海报、视频画面、主视觉需要生成图。数感训练场这一轮只定了图像语言，没有出正式图。

配合：Brand Guardian 和 Visual Storyteller 先定看什么。它不自己改产品。

## 10. CS Learning Designer（学习体验设计师）

这里的 CS 是这个开源角色自己的前缀，不要理解成 Computer Science（计算机科学）。

负责通用学习设计：一次给多少解释、脚手架（先多帮一点，再慢慢撤掉）怎么搭、认知负荷（大脑一次吃多少）会不会超、形成性反馈（练的过程中就告诉你，而不是期末才打分）放在哪。

不负责：某一道数学题的具体钩子是否成立。那是 Math Learning Designer。

典型输入：一段反馈或一屏内容，问「会不会讲成一节课」。

典型输出：深度判断。通常一屏、一个重点。学生已经知道的定义不要再讲。

什么时候叫：解释变长、孩子可能看累、或者分不清该详细还是该短。

配合：Math Learning Designer 提供数学内容。它检查这个内容会不会一次塞太多。

来源说明：概念参考 Amin Borghei 的 cs-learning-designer。原文是 Commons Clause + MIT。本机规则是改写，不是原文副本，不放进公开仓库。

## 11. Math Learning Designer（数学学习设计师）

负责：这道题孩子为什么会错，下次怎么更容易想起来。错因、记忆钩子、规律、合理性检查、邻近的数字关系。

不负责：改产品范围、改整条练习路径、发明听起来顺但数学上不成立的口诀。

典型输入：一道错题，例如 `15²`，以及现在那句「平方就是自己乘自己」。

典型输出：一个短钩子，外加可选的检查和家族。

```text
15² = 225
1 × 2 = 2，后面接 25
```

这是恒等式，不是顺口溜：个位是 5 的两位数平方，前面用 `a × (a + 1)`，再接 25。所以 25² 是 625，35² 是 1225。

什么时候叫：反馈在数学上没错，但学生下次还是想不起来。

配合：CS Learning Designer 控制篇幅。Visual Storyteller 把钩子变成四步画面。Whimsy Injector 只在反馈里加很轻的节奏，做题时保持安静。

这个角色文件是本项目写的，只留在本机，不进公开仓库。

---

# 3. 容易混淆的角色

## Product Manager 和 UX Architect

产品经理回答：做不做、给谁、为什么。

用户体验架构师回答：进来以后怎么走。

数感训练场里，产品说「每天一小段，练提取，不打排行榜」。体验说「一题一屏，答错留下关系，按钮是下一题，结束时可以停」。

```text
Product = 定义问题
UX = 设计过程
```

## UX Architect 和 UI Designer

体验决定答错后停在这一题，并给出关系。界面决定这句话用多大的字、放在什么颜色的块里、键盘还在不在。

路径没定之前，不要先挑字体。

## UI Designer 和 Brand Guardian

界面设计师问：按钮多大、字号多少、卡片怎么排、手机和平板怎么适配。

品牌守护问：还没读字，这像一间数学实验室，还是一张空白练习纸？

原版安静、纸张、克制，界面规范上说得通。人打开以后不想学。品牌把方向改成澄蓝数学实验室：数学、空间、轻科技、青少年，而不是幼儿园，也不是企业后台。

## UI Designer 和 Visual Storyteller

界面设计师做「这一页」。视觉叙事设计师做「这个知识按什么顺序被看见」。

`15² = 225` 可以只是一行字。叙事会把它拆成 `1 × 2`，再到 `2`，再接 `25`，最后到 `225`。

叙事以后也用于教学页、PPT、海报和视频，不只用于这个 App 的组件。

## Visual Storyteller 和 Image Prompt Engineer

叙事决定画面里有什么、按什么顺序。提示词设计师把这个画面写成生成模型能执行的句子。

没有叙事结论时，不要先写一长串提示词。

## Whimsy Injector 和游戏化设计

愉悦感是小动作。游戏化常常是金币、连胜、排行榜、奖励商店。

数感训练场要前一种。按钮可以轻轻压下去。不要火焰连胜。

## CS Learning Designer 和 Math Learning Designer

学习体验设计师判断「讲多少」。数学学习设计师判断「讲哪一条数学上成立的钩子」。

`17 × 6` 不套用「末位是 5 就接 25」。那是另一类知识。学习设计师会制止把所有题都念成同一套口诀。数学设计师负责每一类用自己的可靠结构：平方用尾数 5 的结构，乘法用靠近整十的补偿，3/4 用四分之一这一家，1/8 用连续取半。

## Backend Architect 和 Technical Architect

后端架构师盯模块、接口和数据流。技术架构师看整体技术选择，例如以后记忆动画用 CSS、SVG、Canvas 还是 Three.js。

两者有重叠。现在都还不是实施。Three.js 只停留在概念，没有批准写进产品。

---

# 4. 流程里有，但还没确认都做成 Cursor 角色

这些是 Workflow Role（流程角色）。不要写成已经安装的规则文件。

| 角色 | 中文 | 状态 |
| --- | --- | --- |
| Prototype Designer | 产品原型设计师 | 流程里用过。做出可点的体验面，不是正式产品。未确认有独立规则文件 |
| Project Manager | 项目经理 | 流程里有阶段推进。未确认当前 Cursor 已安装成角色文件 |
| Technical Architect | 技术架构师 | 流程里明确要有。和 Backend Architect 有重叠。未确认独立规则文件 |
| API / Data Contract Designer | API / 数据契约设计师 | 架构阶段才需要把接口写成可冻结的契约。现在没有这份文件 |
| Release Reviewer | 发布评审 | 现在主要由 ChatGPT 在阶段门做。不是仓库里的一个角色文件 |

`WORKFLOW ROLE`

不是

`INSTALLED ROLE`

---

# 5. 协作怎么走

```text
Owner（你）
最终决定
        ↓
ChatGPT
Orchestrator / Gate Reviewer
总调度，并在阶段门评审
        ↓
Cursor
专业角色工作台
        ↓
Product / UX / Learning / UI / Brand / Visual / Architecture
按这一次的问题调用，不是八个角色每次全上
        ↓
Contract Freeze
契约冻结。规则定住
        ↓
Grok Bot
按冻结的契约实施
        ↓
Verification
核对实现是否还是那份契约
        ↓
Owner Acceptance
你接受，才算这一阶段真正完成
```

Gate PASS（阶段门通过）还不等于已经合并进 main（主分支）。只有合并之后，才成为别人可以依赖的 Baseline（基线，后续工作的正式起点）。

Number Sense Lab 现在有三条还没合并的证据：

| Pull Request | 在回答什么 |
| --- | --- |
| #6 功能原型 | 能不能用 |
| #7 A+ 视觉方向 | 想不想用 |
| #8 学习反馈 | 错了以后学到什么 |

它们都还不是基线。

---

# 6. 遇到问题叫谁

| 问题 | 叫谁 |
| --- | --- |
| 这个要不要做？ | Product Manager |
| 按钮该在哪、答错后去哪？ | UX Architect，必要时再加 UI Designer |
| 为什么这页正确但无聊？ | Brand Guardian + Visual Storyteller |
| 怎样更有一点生命，但不变成游戏？ | Whimsy Injector |
| 这个数学事实怎么记住？ | Math Learning Designer |
| 解释是不是太多了？ | CS Learning Designer |
| 怎么变成一张图或一段画面？ | Visual Storyteller + Image Prompt Engineer |
| 后面的系统怎么分模块？ | Backend Architect，更大的技术选择再加 Technical Architect |
| 已经写好的文档怎么整理整齐？ | Contract Document Editor |

调度按问题，不按「把所有角色跑一遍」。

```text
孩子为什么错、怎么记？
→ Math Learning Designer

怎么把规律变成画面？
→ Visual Storyteller

这个动效有没有记忆价值？
→ Whimsy Injector + Math Learning Designer

怎么落到页面组件？
→ UI Designer
```

---

# 7. 学习与教学术语

| English | 中文 | 简单说明 | 在数感训练场里 |
| --- | --- | --- | --- |
| Learning Design | 学习设计 | 安排学的过程和反馈，不只是把内容放上去 | 答错后要让人下次想得起来 |
| Instructional Design | 教学设计 | 决定教什么、按什么顺序、给多少帮助 | 先关系，再一个钩子，不先讲一节课 |
| Retrieval Practice | 提取练习 | 先从记忆里想，不先看答案 | 一题一屏，自己输入 |
| Memory Hook | 记忆钩子 | 一条短的、以后能再想起来的结构 | `1 × 2 = 2`，后面接 25，得到 225 |
| Cognitive Load | 认知负荷 | 一次塞给大脑的信息量 | 做题时安静；反馈通常一屏一个点 |
| Scaffolding | 学习脚手架 | 先多帮一点，会了再撤掉 | 第一次错 15² 可以四步；后来的 25² 缩短 |
| Formative Assessment | 形成性评价 | 练的时候就反馈，用来改进，不是期末打分 | 答错立刻看见关系，没有分数榜 |
| Worked Example | 逐步例题 | 把一个做法摊开看 | `1 × 2` → `2` → 接 25 → `225` |
| Worked Example Fading | 示例逐渐淡出 | 同样的规律，后面的例子越来越短 | 35² 不必再把四步原样讲一遍 |
| Error Diagnosis | 错因判断 | 分清是没懂概念、想不起来、看不见规律、算滑了，还是表示法混了 | 15² 多半不是「不知道平方是什么」 |
| Reasonableness Check | 合理性检查 | 一眼看出这个答案不可能 | 15² 在 100 和 400 之间，而且以 25 结尾。215 不合格 |
| Relation Network | 关系网络 | 一个事实旁边有少数邻居 | 15² = 225，25² = 625，35² = 1225 |
| Visual Cue | 视觉线索 | 用画面帮助记住，画面和文字说同一件事 | 四格分镜，还没有真正播放 |
| Audio Cue | 声音线索 | 用很轻的节奏帮助顺序。必须可选 | 设想是两下轻点再一声。关掉声音也能看懂。现在没有音频 |
| Dual Coding | 双通道 | 字和图一起编码，比只有字更容易留下 | 钩子既有一句中文，也有 `2 \| 25` 这种样子 |

这些词是为了把反馈设计说清楚。它们还不是数据契约，也还没有写进正式产品规则。

---

# 8. 产品与设计术语

| English | 中文 | 在这里是什么意思 |
| --- | --- | --- |
| Product | 产品 | 为谁解决什么问题，第一版不做什么 |
| UX | 用户体验 | 人怎么走完一次练习 |
| UI | 界面 | 这一屏长什么样、点哪里 |
| Brand | 品牌 | 没读字之前的气质 |
| Visual Storytelling | 视觉叙事 | 用画面顺序把一件事讲明白 |
| Design System | 设计系统 | 颜色、字体、圆角、间距、按钮，全站沿用同一套 |
| Motion Design | 动效设计 | 什么在动、什么时候动。首页可以轻，做题几乎不动，反馈只动一个教学点 |
| Delight | 愉悦感 | 一点点生命，不是奖励系统 |
| Prototype | 产品原型 | 用来给人点的样品，不是正式上线的产品 |
| Human Review Surface | 人工体验面 | 给你或孩子真实看、真实点的页面 |
| Responsive | 响应式 | 同一内容在手机、平板、较宽屏幕上都能用 |
| Mobile-first | 手机优先 | 先按手机设计，再考虑更大的屏幕 |
| DESIGN.md | 视觉设计契约文件 | 把「长什么样、为什么」写下来，让以后的 AI 不用靠聊天记忆。现在的 A+ 文件还是候选，没有冻结 |

---

# 9. 工程与治理术语

这些词按这个仓库真实的做法来记。

| English | 中文 | 在这个项目里 |
| --- | --- | --- |
| Git | 版本记录工具 | 每次有意义的文档变更都留下一次记录 |
| Repository | 仓库 | GitHub 上的 number-sense-lab。它是 Source of Truth（事实来源） |
| Branch | 分支 | 一条单独的工作线。例如视觉在 `docs/ui-visual-v01`，学习反馈在 `docs/learning-feedback-v01`。切换分支，磁盘上的文件会跟着换 |
| Commit | 提交 | 把这一次的改动记下来，并写一句为什么 |
| Push | 推送 | 把本机提交送到 GitHub，别人才能评审 |
| Pull | 拉取 | 把 GitHub 上的新提交拿回本机 |
| Pull Request | 拉取请求 | 请 ChatGPT 和 Owner 审查。通过不等于已经合并 |
| Merge | 合并 | Owner 同意后，变更进入 main。之后才是新基线 |
| Review | 评审 | 看方向、质量和边界，不是替你做决定 |
| Gate | 阶段门 | 这一阶段能不能进下一阶段 |
| Baseline | 基线 | 已经在 main 上、后面可以依赖的版本 |
| Source of Truth | 事实来源 | 以 GitHub 为准。本机只是工作副本 |
| Contract | 契约 | 大家同意遵守的产品、体验或技术规则 |
| Contract Freeze | 契约冻结 | 规则定住，才进入正式开发 |
| Build | 正式实现 | 冻结之后由 Grok Bot 做。现在还没有进入 |
| Runtime | 运行时 | 程序真正跑起来的时候。原型用本机临时网页服务，只给自己看 |
| Spike | 小验证 | 不正式做产品，只试一件小事可不可行。例如以后可以只拿 `15²` 试记忆动画和可选声音 |

有一条特别容易混：

```text
Gate PASS
≠
已经合并进 main
```

阶段门通过，只说明评审认为可以过。Owner 合并之后，它才成为基线。没合并的 Pull Request 仍然只是证据。

切换分支时，另一个分支里的文件夹会暂时看不见。所以 `/visual-exploration/` 和 `/learning-exploration/` 不会同时躺在同一次目录里。这不是文件丢了。

---

# 10. 角色是怎么补上的

## 阶段 1

产品、体验、界面、后端。

够用来把「练什么、怎么走、屏幕上有什么」写清楚。

## 阶段 2

原型能用，但打开以后不想学。

补上：Brand Guardian、Visual Storyteller、Whimsy Injector、Image Prompt Engineer。

方向变成澄蓝数学实验室。首页负责想进去，做题页负责静下来。

## 阶段 3

答错反馈在数学上正确，但太浅。「平方就是自己乘自己」帮不上一个已经知道平方含义的初中生。

补上：CS Learning Designer、Math Learning Designer。

反馈方向改成：正确关系、短记忆钩子、可选的规律和家族。不同知识不用同一套口诀。Owner 已把这个方向记为接受，但还没有合并，也还没有做进原型。

教训：缺角色时，表面常常像「这个页面不好」或「这句话不行」。先判断缺的是品牌、叙事，还是学习设计。不要把一次补角色，推广成以后每个任务都把所有角色叫齐。

---

# 11. 按任务组合，不要每次全上

### 企业后台

Product、UX、Backend Architect。通常不需要品牌故事和记忆钩子。

### 给青少年用的教育产品

Product、UX、Math Learning Designer、UI、Brand Guardian、Visual Storyteller、Whimsy。CS Learning Designer 在解释变长时加入。

### PPT 或 HTML 汇报

Brand Guardian、Visual Storyteller。需要生成画面时再加 Image Prompt Engineer。

### 教学课件

Math Learning Designer、Visual Storyteller、UI Designer。

### 视频

Brand Guardian、Visual Storyteller、Image Prompt Engineer。

### 很看重第一眼的产品页

UI、Brand Guardian、Visual Storyteller、Whimsy Injector。

角色编排是按任务的。不是八个或十一个角色轮流签到。

---

# 12. 规则文件留在本机

Role definition（角色定义）不是项目业务源码。

本机 Cursor 规则目前能对上文件的有：

| 规则文件 | 在哪 | 是否进公开仓库 |
| --- | --- | --- |
| ui-designer、brand-guardian、visual-storyteller、whimsy-injector、image-prompt-engineer | 本项目 `.cursor/rules/` | 否 |
| cs-learning-designer、math-learning-designer | 本项目 `.cursor/rules/` | 否。学习设计角色含改写与项目专用内容 |
| contract-document-editor | 上一级工作区 `.cursor/rules/` | 否。它服务这一组公开项目，不属于某一个仓库 |

Product Manager、UX Architect、Backend Architect 在协作政策里被当作 Cursor 的专业角色使用。写这份手册时，这台电脑上没有找到它们单独的 `.mdc` 规则文件。所以第 2 节把它们算进已使用的核心角色，第 4 节没有把它们再算进「未安装」。缺的是规则文件，不是「这个职责不存在」。

换电脑时，角色文件不会跟着 GitHub 仓库走。这份手册负责把职责带走。规则文件要另存，不要为了备份把 `.cursor/rules/` 提交进公开仓库。

许可证：cs-learning-designer 的概念来自 Amin Borghei 的仓库，许可证是 Commons Clause + MIT。education-agent-skills 的技能正文是 CC BY-SA 4.0，作者 Gareth Manning。公开文档只写结论和出处，不复制那些 SKILL.md 原文。

---

# 13. 给孩子看的版本：AI 团队里每个人是干什么的？

可以把它想成一个做数学练习的小队。不是一个人又当教练又当画家。

| 谁 | 像什么 |
| --- | --- |
| Owner（你家里做决定的人） | 最后说了算 |
| ChatGPT | 队长。安排谁先做，并检查这一步过不过 |
| Product Manager | 决定我们做的是一个每天练一小会儿的工具，不是游戏厅 |
| UX Architect | 画路线：先开始，再做一题，错了看提示，然后可以停 |
| UI Designer | 决定字大不大、按钮好不好按 |
| Brand Guardian | 决定它像一间明亮的数学实验室，而不是一张白卷子 |
| Visual Storyteller | 把 `15²` 画成几步，让人看见 225 是怎么来的 |
| Whimsy Injector | 加一点点好玩，比如按钮轻轻按下去。不加金币和奖杯 |
| Math Learning Designer | 找一个以后能想起来的办法，而不是只说「平方就是自己乘自己」 |
| Backend Architect | 管屏幕后面的机器。现在练习先存在这台设备上 |
| Cursor | 这间办公室。上面这些人在这里工作 |
| Grok Bot | 规则定好以后，负责把东西真正做出来 |

错了一题，最好的帮助不是责备，也不是把定义再读一遍。最好的帮助是留下一个以后能想起来的小结构。比如 15 的平方：先算 `1 × 2 = 2`，再接上 25，就是 225。
