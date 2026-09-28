# Multi-client Architecture Direction

## 多端客户端架构方向

状态：ARCHITECTURE DIRECTION ONLY（架构方向）。

NOT CONTRACT FREEZE（不是契约冻结）。本文不是 Build Instruction（实施说明），也不选定框架。

本轮为了消除已确认的交付决定与旧 PRD、旧 UX 里的平台表述冲突，对 Product Contract 和 UX Contract 做了平台语义对齐。不改变目标用户、三个训练域、大约 5～10 分钟、掌握原则、学习价值，也不扩大产品范围。UI Contract 未改。学习反馈方向仍在单独评审中，本文不改那份学习契约。

本轮同时澄清以后代码应该怎么分层，避免每个平台各写一套学习逻辑。

---

# 0. 谁回答了哪一层

专业角色只回答自己的一层。Technical Architect（技术架构师）目前是流程角色，没有独立的本地 Cursor Rule。它在这里只提出技术分层，不冻结实现。

| 角色 | 本文件里回答的问题 |
| --- | --- |
| Product Manager（产品经理） | 各端给谁用、解决什么场景。PC 不是另一个产品 |
| UX Architect（用户体验架构师） | 哪些心理模型必须相同，哪些操作可以因端而不同 |
| UI Designer（界面设计师） | 一套设计语言，按屏幕做布局适配 |
| Backend Architect（后端架构师） | v0.1 要不要后端 |
| Technical Architect（技术架构师） | 核心、适配层、客户端壳怎么分开 |

长期规则：

> 产品契约和学习契约属于核心层，平台 API 属于适配层。

> Product and learning contracts belong to the core layer; platform APIs belong to adapters.

---

# 1. Why multi-client

## 为什么要多端

Number Sense Lab（数感训练场）要验证的是：初中生愿不愿意用大约 5～10 分钟，把少量数字关系练得更稳。这个学习任务不属于某一个应用商店。

如果把产品写成「微信小程序项目」或「PC H5 项目」，后面很容易变成四套练习：微信一套、抖音一套、支付宝一套、浏览器再一套。平台可以换，学习核心不能散。

因此方向是：

> One Core, Multiple Clients（一个核心，多端客户端）

不是只有微信小程序，不是只有 H5，也不是一个靠后端才能运行的 SaaS（软件即服务）。

v0.1 保持 Local-first（本地优先）和 Frontend-first（前端优先）。没有出现真正必须放在服务器上的责任时，不引入后端。

---

# 2. One Core, Multiple Clients

## 一个核心，多端客户端

```text
Core Learning Engine
核心学习引擎
        ↓
Platform Adapter Layer
平台适配层
        ↓
┌────────────┬────────────┬────────────┬────────────┐
微信小程序    抖音小程序    支付宝小程序    H5 / PC Web
WeChat       Douyin       Alipay       Browser
```

四个名字都是同一学习系统的 Client（客户端），不是四个产品。

目标客户端：

1. WeChat Mini Program（微信小程序）
2. Douyin Mini Program（抖音小程序）
3. Alipay Mini Program（支付宝小程序）
4. H5 / PC Web（H5 / PC 浏览器端）

已有交付决定仍然有效：v0.1 首发实现是 WeChat Mini Program First（微信小程序优先）。

更新后的解释是：优先不等于唯一。H5 / PC Web 是一等客户端，不是退路。抖音小程序和支付宝小程序属于同一支持方向，本轮不开始写它们的工程。

交付顺序和架构地位是两件事。先做微信，是为了先被真实用起来。核心仍然不能调用微信、抖音、支付宝或浏览器的专有 API。

---

# 3. Role of Mini Programs

## 小程序负责什么

Product Manager 对三类小程序的场景定义相同。它们是低门槛的日常练习端，不是三套课程产品。

主要用途：

- 快速打开
- 手机上练习
- 少摩擦
- 分享和被发现
- 每天大约 5～10 分钟

微信仍然是 v0.1 的首发端，因为目标学生和家庭已经在用这个环境，转发一条练习比分发安装包更直接。抖音和支付宝以后若进入，承接的是同一种短时练习，不是新的训练规则。

小程序不单独拥有：题库含义、掌握状态、错题反馈、暂停和结束。这些属于核心。

---

# 4. Role of H5 / PC

## H5 / PC 负责什么

H5 / PC Web is NOT a fallback. It is a first-class client.

H5 / PC Web 不是退路，也不是「小程序做不了时的备用网页」。它是一等客户端。

它仍然是同一个学习系统，不是单独的 PC 产品。不能出现「电脑上才能完成今天的训练」或「手机上的掌握状态是另一套」。

主要用途：

- 桌面上学习
- 物理键盘输入
- 更大的视觉空间
- 家长或老师在旁边一起看
- 更清楚的数学关系可视化
- 打印
- 以后的教学内容
- 动画和交互式数学探索

这些优势使它适合作为实验场，尤其是以后若要试验 SVG、Canvas 或 Three.js。小程序仍然负责触达和每天打开。两边同时重要，分工不同。

本轮不把 H5 / PC 写成已经开工，也不把它从范围内删除。

---

# 5. Local-first

## 本地优先

v0.1 的用户数据留在当前设备。

可能留在本地的数据：

- practice history（练习记录）
- mastery state（掌握状态）
- wrong relations（尚未稳定的关系）
- response time（反应时间；不作为学生成绩展示）
- input mode（输入方式：屏幕按键或物理键盘）
- local preferences（本机偏好，例如声音开关）

学生可见的存储说明保持已有产品句子：练习记录只保存在当前设备，不会自动同步到其他设备。

换设备、清除该客户端的本地数据或删除小程序，进度不会跟着走。这是 v0.1 的已知限制，不是本版要补上的同步功能。同一批当前关系也不承诺换一台设备后还能继续预览或打印。

---

# 6. Frontend-first

## 前端优先

一次训练的出题、输入、判断、反馈、记录和结束，都要能在客户端完成。

v0.1 不依赖：

- 账号
- 服务器判题
- 云端题库
- 远程配置

没有网络时，已经安装或已经打开的客户端仍应能完成本地训练。各端如何处理「第一次打开时没有网」，留给以后的平台适配，不在这里发明后端。

---

# 7. Backend-on-Demand

## 按需引入后端

Backend Architect 的结论：v0.1 采用 Client-only architecture（仅客户端架构）。现在不需要后端。不建后端也是一个架构决定。

下面这些都不构成引入后端的理由：

- 本地题库
- 判断对错
- 本地进度
- 本地掌握状态
- 本地错题记录
- Memory Hook（记忆钩子）
- 视觉反馈
- 可选音效
- 静态学习内容

Backend-on-Demand（按需引入后端）的意思是：只有出现真正的服务器责任时，才单独开一轮决策。题目变多，本身不是这个责任。

以后才可能构成理由的需求：

- account identity（账号身份）
- cross-device sync（跨设备同步）
- multi-user profiles（多用户档案）
- teacher/student collaboration（师生协作）
- cloud content management（云端内容管理）
- centralized analytics（集中分析）
- remote assignment（远程布置作业）
- cloud AI analysis（云端 AI 分析）
- LLM / AI Tutor（大语言模型 / AI 辅导）
- dynamic content delivery（必须由服务器下发的动态内容）

每一项都要单独经过 Owner 决定。本文不批准它们进入 v0.1。

---

# 8. Core Learning Engine

## 核心学习引擎

Core Learning Engine（核心学习引擎）是平台无关的。它只处理学习含义，不处理微信登录、分享按钮或浏览器地址栏。

方向上包含：

- question model（题目模型）
- answer validation（答案校验）
- learning state（学习状态）
- mastery logic（掌握逻辑）
- feedback rules（反馈规则）
- Memory Hook metadata（记忆钩子的内容数据）
- relation-family logic（同一关系族的逻辑）
- review scheduling logic（复习出现的逻辑）

这些规则在四个客户端上必须得到同一种结果。同一个答案，不能在微信上算对、在浏览器上算错。同一种掌握状态，不能在手机上叫「已经很稳」、在电脑上换成另一套词。

本文不改已经通过的产品含义：三个训练域、一题一屏、正确优先于速度、不展示倒计时、不向学生显示原始反应时间、不登录、本地优先、不做排行榜。记忆钩子的具体教法仍以学习设计为准，不在这里重写。

---

# 9. Platform Adapter

## 平台适配层

Platform Adapter Layer（平台适配层）把核心接到某个运行环境。核心通过这层使用能力，不直接调用平台 API。

方向上包含：

- storage（存储）
- audio（音频）
- animation capability（当前环境做得到的动画能力）
- navigation integration（和平台导航、返回的衔接）
- share（分享）
- platform lifecycle（小程序或页面的前后台生命周期）
- login only if later introduced（只有以后批准了，才接登录）

Client Shell（客户端壳）是学生真正打开的那一端：

- 微信小程序
- 抖音小程序
- 支付宝小程序
- H5 / PC Web

壳负责布局、输入控件和平台允许的入口。它不复制掌握算法，也不各自保存一套互相矛盾的进度含义。

本轮不选定跨端框架，也不比较具体框架。把某一端的 API 写进核心，不在这个方向里。

---

# 10. Responsive / interaction differences

## 相同的心理模型，不同的操作条件

UX Architect 的原则：

> same mental model, different interaction affordances

> 心理模型相同，操作条件可以不同。

所有客户端保持一致的：

- learning loop（选择今天或一个域 → 一题 → 输入 → 判断 → 立即反馈 → 记录）
- mastery semantics（掌握状态的含义和学生能看见的说法）
- wrong-answer feedback（答错后留下，给出正确关系和结构提示，不立刻重做，不说「你错了」）
- Memory Hook（记忆钩子属于反馈内容，不属于某个平台）
- progress semantics（进度是一份短清单，不是仪表盘）
- pause / resume（先停一下；已经做的会留下；可以继续）
- completion（先到这里）
- content meaning（同一批关系、同一种对错）

可以因端而不同的：

### Mobile / Mini Program（手机 / 小程序）

- 触摸数字键盘
- 竖屏优先
- 可视区域更小
- 动效更轻
- 使用该平台自己的本地存储 API

### PC / H5

- 物理键盘，同时仍可点击输入
- 更宽的版面
- 可以有悬停，但完成训练不能依赖悬停、右键、多窗口或键盘快捷键
- 解释和可视化可以占用更多空间
- 浏览器打印是这一端的交付适配，不是所有客户端都必须提供系统打印机
- 宽屏布局

UI Designer 的原则：不要做四套设计系统。

> One Design Language（统一设计语言）

> Different Layout Adaptation（不同布局适配）

视觉方向保持 A+ Math Lab（A+ 澄蓝数学实验室）。那是单独的视觉评审，本文件不冻结色值，也不改写 `docs/ui/03_ui_spec.md`。

布局方向：

- Mobile（手机）：单列，触摸优先，点击目标足够大。
- Tablet（平板）：间距更宽，视觉更舒展。训练任务与手机相同，不出现另一套模式。
- PC：内容居中，键盘可用，反馈可以在更宽的区域里展开，可视化可以占用更大的说明区。宽屏不是第二套信息架构。

训练页仍然比首页更安静。一题一屏不因为屏幕变大就改成多题同屏。

---

# 11. Data portability

## 数据可携带的是含义，不是文件格式

语义数据模型保持平台中立。存储实现可以不同：微信、抖音、支付宝和浏览器各自有自己的本地存储。核心只认识同一套字段含义。

v0.1 不提供自动迁移、账号搬运或二维码转移。所谓 portability（可携带性）在这一版的意思是：同一套模型以后可以被另一个客户端读懂，而不是现在就要把进度同步过去。

输入方式要被记下来。手机点按和键盘输入的时间不能直接解释成数学能力变了。这个区别属于数据含义，不属于某一个平台的私有字段。

---

# 12. Future backend triggers

## 以后什么时候才重新讨论后端

见第 7 节的清单。出现其中任何一项之前，架构回答仍然是：不要建后端。

可选云同步、账号、学习历史上云、内容服务和 API 边界，都只在被单独批准后才成为 Backend Architect 的实施范围。提前设计数据库、账号表或同步协议，不属于本方向。

---

# 13. Three.js / Canvas / SVG boundary

## 可视化技术的边界

SVG、Canvas、Three.js 都是客户端上的表现能力，不是核心学习引擎的一部分。

它们可以在以后帮助看见一条关系是怎么来的。PC / H5 的大屏幕更适合做这种试验。小程序若做，也只能使用该平台做得到的轻量动效，不能因此改学习规则。

当前状态：

- Three.js 只停留在视觉 / 学习概念。
- 不进入生产实现。
- 不在本轮选定 SVG、Canvas 或 Three.js。
- 动画做不到时，文字和静态结构仍然要能完成反馈。学习不能依赖某一个图形库。

---

# 14. Open questions

## 本轮不拍板的问题

1. 产品契约里的平台表述已与「微信小程序优先、但不是唯一」对齐。H5 / PC 相对微信首发的编码顺序，本轮仍不冻结。
2. 抖音小程序和支付宝小程序进入实现的时间，本轮不冻结。
3. 若当前客户端不能打印、分享或保存这份 A4 预览，应明确说明。不为此增加同步或后端。
4. 本地存储用哪一种平台 API，本轮不选定。
5. 静态内容用 JSON、TypeScript 还是 JavaScript，下面只是例子，不是格式冻结。

---

# 15. Not Contract Freeze

## 还没有冻结

本文是架构方向，供 Owner 与 ChatGPT Review。

它不是 Contract Freeze。
它不是 Build Instruction。
它不批准改产品范围、学习教法或视觉契约。

本轮明确不做：

- 不建后端
- 不选数据库
- 不实现账号
- 不实现云同步
- 不重写原型
- 不选定最终跨端框架
- 不开始小程序生产编码
- 不开始 H5 生产编码
- 不把 Three.js 放进生产
- 不把平台专有逻辑并进核心学习逻辑

---

# Content packaging

## 内容怎么打包

题库变大，不会自动变成后端需求。

小规模和中等规模的内容可以作为静态内容包随客户端发布，例如：

```text
content/
  squares.json
  products.json
  fractions.json
  feedback-hooks.json
```

这是打包方向的例子，不是本轮要新增的文件，也不是已冻结的目录。核心读取的是题目、答案、关系族和反馈元数据。文件放在哪一个客户端工程里，属于以后的适配，不属于服务器。

---

# What this round changes

## 本轮改了什么，没改什么

Product Scope Changed（产品范围改变）：NO

Product Contract Platform Alignment（产品契约的平台语义对齐）：YES

UX Contract Platform Alignment（体验契约的平台语义对齐）：YES

Architecture Direction Added（新增架构方向）：YES

没有改变：目标用户、三个训练域、大约 5～10 分钟、掌握原则、学习价值、产品范围。

- 界面契约：未改。
- 学习契约：未改。
- 原型：未改。
- 后端：未增加。
- 框架：未选定。
