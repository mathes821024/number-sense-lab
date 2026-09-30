# Number Sense Lab — 视觉资产拆解报告（Visual Asset Decomposition）

来源视觉稿：`产品原型.png`（12 屏整页 UI 总览 + 左侧品牌区）。
本文件只做**视觉还原**，不做新 UX、不发明业务逻辑。

> 三条总原则（贯穿全文）
> - **Role defines intent.** 角色定义意图。
> - **Mockup defines appearance.** 视觉稿定义长相。
> - **Assets enable implementation.** 视觉资产支撑实现。
>
> 任何在图上无法可靠判断的元素，一律标 `NEED_OWNER_CONFIRMATION`，不猜。

---

## 0. 边界与功能分级

图里 12 屏并非都已落地。按现状分三级：

- **A. 已有真实功能** —— 可接真实数据（依据 README v0.1 / `src/core`）：
  答题页(分数→小数、平方、乘法)、答对/答错反馈、错题本(在审但 UX 已定)、最近练得怎么样、选题打印→打印预览(A4)。
- **B. 只有视觉、功能未实现** —— 做视觉占位，不接逻辑：
  探索页除「分数与小数」外的训练域、知识地图 Tab、底部「概念/例题/动画」、知识卡片内容、设置里的动画开关/清空记录/关于。
- **C. 明显未来功能** —— 立方与魔方、补数关系、倍数和因数、规律探索、用户档案/账号/云同步。

对 B/C 统一规则：**VISUAL FIRST, FUNCTION PLACEHOLDER ONLY**。
可进页面就用「功能名 + 这个功能正在准备中，敬请期待。 + 返回」；只是首页/入口图标就保留卡片视觉，点击轻提示「敬请期待」。
**不新增**：登录、用户数据、新接口、新状态机、新业务流程。

---

## 1. 全局视觉令牌（从图中提取，与现有 theme.css 对齐）

组件只读语义令牌，不写死色值。以下值与 `h5/themes/math-lab/theme.css` 一致。

| 类别 | 令牌 | 值 | 说明 |
| --- | --- | --- | --- |
| 底色 | `--surface-page` | `#F7F3E8` | 奶油纸底，12 屏统一 |
| 卡片 | `--surface-card` | `#FFFDF8` | 卡片/答案框 |
| 主色 | `--color-brand-primary` | `#0F7F5A` | 唯一主按钮（图中深青绿胶囊） |
| 亮品牌 | `--color-brand-bright` | `#14956A` | Logo 青、徽章、tile |
| 薄荷 | `--color-brand-secondary` | `#7DCFB6` | 次级块、浅绿山丘 |
| 太阳黄 | `--color-accent-sun` | `#F5C451` | 星、铅笔杆、点缀 |
| 琥珀 | `--color-accent-amber` | `#F4A261` | 点缀 |
| 天蓝 | `--color-accent-sky` | `#5B8DEF` | 立方图标、信息 |
| 珊瑚红 | `--feedback-wrong` | `#C4563A` | 答错、X、「再想想哦」 |
| 对绿 | `--feedback-correct` | `#1E8F5A` | 答对、勾、「太棒了」 |
| 正文 | `--text-primary` | `#1C2430` | 题目/标题 |
| 次要 | `--text-secondary` | `#5C6670` | 说明/安静链接 |
| 描边 | `--border-subtle` | `#E6DCCB` | 卡片边/发丝分隔 |
| 圆角 | `--radius-card` / `--radius-button` | `24px` / `999px` | 卡片大圆角、按钮全圆角胶囊 |
| 阴影 | `--shadow-card` | 轻投影 | 卡片成组，不厚重 |
| 字体 | `--font-ui` | `Nunito, PingFang SC, Noto Sans SC, system-ui` | 图注：Nunito Rounded，圆润清晰现代 |

> 品牌五色圆点（图左）：深青绿 `#0F7F5A`、薄荷 `#7DCFB6`、明黄 `#F5C451`、珊瑚 `#C4563A`、天蓝 `#5B8DEF`。这是品牌点缀板，不是业务状态色。

---

## 2. 12 屏逐页拆解

每屏固定分析：目标 / 功能状态 / 八层结构 / 切图 vs 不切 / 占位策略。

通用分层语义（所有屏）：
- L1 页面背景 → CSS（`--surface-page`，浅网格可选）
- L2 背景装饰 → SVG（云/叶/山丘，低透明度，仅首页/探索/启动）
- L3 品牌/吉祥物/插画 → PNG/WebP 透明资产
- L4 卡片/容器 → CSS（圆角、阴影、surface-card）
- L5 图标 → SVG 或 Phosphor（`@phosphor-icons/web`）
- L6 文本 → 真实文字（绝不烘焙进图）
- L7 动态数据/数学内容 → 前端渲染（分数 `2/3`、循环小数 `0.6̇`、统计数）
- L8 按钮/交互 → CSS 组件

### 屏 1 · 启动页 Splash
- **目标**：品牌第一印象，短暂停留后进入首页。**功能状态：A（视觉即终态，无业务）**。
- **视觉结构**：居中纵向。奶油底 → 软云/淡绿山丘(L2) → 吉祥物抱铅笔居中(L3) → 字标「Number Sense Lab」+「数感训练场」(L6) → 底部小嫩芽插画 + 文案「看见数字的意义 / 让思考走得更远」(L3+L6) → 极细进度条(L8)。
- **层级**：L1 `#F7F3E8`｜L2 云+山丘 SVG 低透明｜L3 `mascot.welcome`｜L6 大号深青绿字标｜L8 底部 2px 进度条（CSS 动画，loading 用）。
- **吉祥物**：`asset.mascot.welcome`（挥手抱笔、微笑）。
- **图标/装饰**：云朵、软山丘、嫩芽 `asset.decor.sprout`。
- **文本层级**：字标 28–32px 加粗 brand-bright；中文副标题 15px secondary；标语 13px secondary 居中两行。
- **CTA**：无（自动跳转或任意点击进首页；底部进度条仅装饰/loading）。
- **要切**：`mascot-welcome.webp`、`decor-sprout.svg`、`cloud-01/02.svg`、`hill-01.svg`。
- **不切**：字标文字、进度条、背景色。
- **占位**：无。

### 屏 2 · 首页 Home
- **目标**：今天练什么 + 四个主入口。**功能状态：A（开始练习/专项/错题本/进度均接真实）**。
- **视觉结构**：
  - 顶部右：齿轮设置图标（Phosphor `gear`）。
  - 标题区：「Number Sense Lab / 数感训练场」(L6) + 右侧吉祥物小像(L3) + 圆角对话气泡「和数字做朋友，发现更多有趣的规律！」(L4+L6，气泡用 CSS 圆角尾巴，不切图)。
  - 4 张横向列表卡（surface-card、圆角 24、轻阴影）：左彩色圆角 tile 图标 + 标题 + 副标题 + 右箭头。
    1. 开始练习 — 绿 tile ▶ —「每天追一点点」
    2. 专项练习 — 红 tile ◎(target) —「按你需要的主题练习」
    3. 错题本 — 紫 tile 📖(book) —「把容易出错的题再练一练」
    4. 最近练得怎么样 — 橙 tile 柱状图 —「看看自己的进步」
  - 底部 Tab Bar：首页 / 练习 / 错题本 / 我的（图标+文字，Phosphor）。
- **层级**：L1 奶油底｜L2 云/山丘(只铺边缘)｜L3 mascot 小像｜L4 四张卡+气泡+tabbar｜L5 四枚彩色 tile 图标｜L6 文本｜L8 卡片整卡可点（CSS hover/active）。
- **吉祥物**：`asset.mascot.welcome` 缩小复用（不切第二张）。
- **图标**：四枚 tile 用 Phosphor（play-circle / target / book-open / chart-bar）+ 各自浅底色 tile，**CSS 实现，不切 PNG**。齿轮、底栏同 Phosphor。
- **装饰**：`cloud-01/02`、`hill-01`，透明度 ≤0.5。
- **文本层级**：页面标题 22px bold primary；卡标题 16px semibold；副标题 12–13px secondary。
- **CTA**：四卡均可点；「开始练习」为主路径。
- **要切**：`mascot-welcome.webp`(复用)、`cloud-01/02.svg`、`hill-01.svg`。
- **不切**：四张卡、tile、气泡、tabbar、箭头、背景。
- **占位**：无（四入口均 A）。

### 屏 3 · 练习入口 / 选择主题 Explore
- **目标**：选训练域。**功能状态：A 仅「分数与小数」当前卡；其余 B/C 占位**。
- **视觉结构**：
  - 导航：返回箭头 + 大标题「探索数学世界」+ 副标题「从一个主题开始，走更远的路」。
  - 顶部 Tab：`主题训练`(active 绿底胶囊) / `知识地图`(未选)。**知识地图 = C，点击轻提示「敬请期待」**。
  - 中央放射：圆心绿色大圆「数感核心」，周围 6 枚圆形 tile 图标：
    - 平方关系（蓝立方）— A
    - 立方与魔方（紫骰子）— C
    - 乘法表（橙 ×）— A
    - 补数关系（粉环）— C
    - 倍数和因数（绿 ∞）— C
    - 规律探索（黄星）— C
  - 当前训练卡：橙色角标「今天推荐」+「分数与小数」+ 绿色胶囊「开始练习 →」。
  - 底部三小图标：概念 / 例题 / 动画 —— **全 C，点击「敬请期待」**。
  - 背景：左右植物/叶子装饰(L2)。
- **层级**：L1 奶油底｜L2 叶子/枝叶 SVG 贴边｜L4 中心圆+当前训练卡｜L5 六枚域图标(SVG)｜L6｜L8 按钮。
- **吉祥物**：本屏不出现（练习入口保持克制）。
- **图标**：六枚域图标全部 SVG（见清单）；概念/例题/动画用 Phosphor（lightbulb / pencil-ruler / film）。
- **装饰**：`leaf-01.svg`、`leaf-02.svg` 枝叶。
- **文本层级**：大标题 24px bold；中心圆内「数感核心」15px 白；tile 下标签 11–12px secondary。
- **CTA**：当前卡「开始练习 →」主按钮；A 域(平方/乘法)可进真实练习；C 域点击 → 占位页。
- **要切**：6 枚域 SVG、`leaf-01/02.svg`。
- **不切**：中心圆、放射布局、Tab、当前卡、角标、按钮（全 CSS/布局）。
- **占位**：立方与魔方/补数关系/倍数和因数/规律探索 → 占位页；知识地图/概念/例题/动画 → 轻提示。
- `NEED_OWNER_CONFIRMATION`：图中「乘法表」tile 与 README 的 Products 域是否一一对应；「平方关系」是否即 Squares。建议按域 id 接，不按图上文案改名。

### 屏 4 · 练习过程 / 答题 Session
- **目标**：做题。**功能状态：A（真实引擎驱动）**。
- **视觉结构**：导航返回 + 标题「分数到小数」+ 右侧暂停「II」；进度「2 / 10」+ 绿色进度条；题目 `2/3 = ?`（横分数线，课本样式）；答案输入 `0.(   )`（循环小数括号框，当前位高亮）；数字键盘 1–9/0/删除；底部大绿「提交」。
- **层级**：L1 奶油底｜L4 题目卡/答案框/键盘键｜L6 题目文本｜L7 动态数学内容（分数、循环记号、题号进度）｜L8 键盘+提交。
- **吉祥物**：**本屏不出现**（视觉规范明确：写答案时吉祥物让开）。
- **图标**：暂停用 Phosphor `pause`；删除键文字「删除」。
- **装饰**：仅极淡纸纹网格，无插画。
- **文本层级**：题目分数 40–48px bold primary；题号进度 13px secondary。
- **CTA**：「提交」主按钮；数字键盘。
- **要切**：**无业务素材**。最多极淡 `home-bg-grid` CSS 网格。
- **不切（强制）**：题目、分数、循环小数 `0.6̇`、数字键、删除、提交、进度条、对/错状态——全部真实前端渲染。
- **占位**：无。

### 屏 5 · 练习反馈 / 答对 Correct
- **目标**：正向反馈，可继续或回看知识点。**功能状态：A**。
- **视觉结构**：返回 + 大标题「太棒了！」(绿)；吉祥物开心姿势 + 周围星星迸发；答案卡 `2/3 = 0.6̇` + 绿圆勾；说明文字「这是一个循环小数，6 会一直重复出现。」；进度点指示器；两按钮：「下一题」(主绿) / 「再看一眼这个知识点」(浅底)。
- **层级**：L1 奶油底｜L3 `mascot.correct` + `decor.sparkle`｜L4 答案卡｜L5 Phosphor `check-circle`｜L6｜L8 按钮。
- **吉祥物**：`asset.mascot.correct`（开心、星星迸发）。
- **装饰**：`decor-sparkle.svg`（金色小星/放射，绕吉祥物）。
- **图标**：绿勾用 Phosphor `check-circle`（correct 色），不切图。
- **文本层级**：「太棒了！」26px bold correct；答案卡分数 28px；说明 13px secondary。
- **CTA**：下一题（主）、看知识点（次）。
- **要切**：`mascot-correct.webp`、`decor-sparkle.svg`。
- **不切**：答案卡、勾、说明文字、按钮、进度点。
- **占位**：「再看一眼这个知识点」→ 屏 11 知识卡（B，内容静态占位）。

### 屏 6 · 练习反馈 / 答错 Wrong
- **目标**：停在正确关系旁，给提示。**功能状态：A**。
- **视觉结构**：返回 + 「再想想哦」(珊瑚红)；吉祥物思考姿势 + 旁边红问号；答案卡 `2/3 = 0.6̇` + 红圆叉；两行：`你的答案：0.7`(粉底) / `正确答案：0.6`；「小提示」带灯泡图标：把 2÷3 用竖式想一想，会发现 6 一直重复；按钮「再做一遍」(主绿) / 「再看一眼这个知识点」(浅)。
- **层级**：L1 奶油底｜L3 `mascot.thinking` + `decor.question`｜L4 答案卡+提示卡｜L5 Phosphor `x-circle` + `lightbulb`｜L6｜L8 按钮。
- **吉祥物**：`asset.mascot.thinking`（抬手、疑惑）。
- **装饰**：`decor-question.svg`（红色小问号，吉祥物旁）。
- **图标**：红叉 Phosphor `x-circle`；灯泡 Phosphor `lightbulb`。
- **文本层级**：「再想想哦」26px bold wrong；你的答案/正确答案 14px。
- **CTA**：再做一遍（主）、看知识点（次）。
- **要切**：`mascot-thinking.webp`、`decor-question.svg`。
- **不切**：答案卡、X、两行答案、提示文字、按钮。
- **占位**：同屏 5。

### 屏 7 · 最近练得怎么样 Progress
- **目标**：当日小结 + 最近一刷对错。**功能状态：A（数据本地）**。
- **视觉结构**：标题「最近练得怎么样」；日期行「9月30日 · 做完了 / 对了 8/10」；小标题「最近练过的题（显示最近一次作答对错）」；10 行列表：题号 + 分数题 + 右侧绿勾/红叉；底部「选这些题打印」(描边按钮) + 「再练一次」(主绿)。
- **层级**：L1 奶油底｜L4 列表行(发丝分隔 `border-subtle`)｜L5 Phosphor check/x｜L6+L7 动态日期/对错/分数｜L8 按钮。
- **吉祥物**：无。
- **图标**：勾/叉 Phosphor；打印按钮 Phosphor `printer`。
- **文本层级**：标题 20px bold；日期行 13px secondary；列表题 16px。
- **CTA**：再练一次（主）、选这些题打印（次，跳屏 9）。
- **要切**：无。
- **不切**：全部——日期、统计数、对错、列表、按钮均真实渲染。
- **占位**：无。

### 屏 8 · 错题本 Mistake Book
- **目标**：按掌握状态筛错题。**功能状态：A-（UX 在审，按真实错题列表渲染）**。
- **视觉结构**：返回 + 标题「错题本」；三 Tab：`当前错题`(active) / `已掌握` / `全部`；列表行：空方 checkbox + 分数题 `1/5 = 0.2` + 右侧「最近一次：答对/答错」+ 日期；底部「印这些题」(描边) + 「再练一次」(主绿)。
- **层级**：L1｜L4 Tab + 列表行｜L5 checkbox(自定义 CSS)｜L6+L7 状态/日期｜L8 按钮。
- **图标**：checkbox 用 CSS 方形（选中打勾），不切图。
- **文本层级**：标题 20px；状态字「答错」用 wrong 色、「答对」用 correct 色。
- **CTA**：再练一次、印这些题（跳屏 9）。
- **要切**：无。
- **不切**：Tab、checkbox、对错状态、日期、按钮。
- **占位**：空态时显示空插画（复用 `mascot.thinking` 缩小 + 文案「还没有错题，很棒」）——文案可静态。

### 屏 9 · 选题打印 Select for Print
- **目标**：勾选要打印的题。**功能状态：A**。
- **视觉结构**：返回 + 标题「选择要打印的题」；说明「只会显示已练过的题，默认勾选当前错题。你也可以勾选其他题。」；复选列表（同屏 8 勾选态）；底部「已选择 3 道题」+「生成并打印」(主绿)。
- **层级**：纯组件页，全部 CSS/动态。
- **要切**：无。
- **不切**：checkbox、计数、按钮、说明文字。
- **占位**：无。

### 屏 10 · 打印预览 Print Preview
- **目标**：A4 纸面预览，只显示题干或只显示答案（不同屏同现）。**功能状态：A**。
- **视觉结构**：返回 + 标题「打印预览」+ 右上「1/1」；白色 A4 纸卡：抬头「数感训练场 · 练习题 / 9月30日 · 选题打印」+ 编号题干 + 横线作答位；底部「保存为 PDF」(描边) + 「直接打印」(浅蓝底)。
- **层级**：L1 奶油底｜L4 白纸卡(strong white、轻投影)｜L6+L7 题干/横线｜L8 按钮。
- **吉祥物/图标**：纸面上**绝不出现吉祥物或装饰**。
- **要切**：无。
- **不切**：纸卡、抬头、题号、横线、分页计数、按钮。
- **占位**：无。

### 屏 11 · 知识卡片 / 规律提示 Knowledge Card
- **目标**：讲一个规律（如循环小数写法）。**功能状态：B（视觉保留，内容静态 placeholder）**。
- **视觉结构**：返回 + 「知识小卡片」+「1/3」；黄色星徽章 + 标题「循环小数的写法」；正文数学记法：`0.6666… 可以写作 0.6̇`、`0.142857142857… 可以写作 0.142857̇`；吉祥物 + 气泡「在学生的课本中，用数字上面的点表示循环节。」；底部小圆点 + 「我知道了」(主绿)。
- **层级**：L1 奶油底｜L3 `mascot.welcome` 复用 + 气泡(CSS)｜L4 卡片｜L5 `decor.knowledge-star`(黄星)｜L6+L7 数学记法(真实文本，上点用 combining dot)｜L8 按钮。
- **要切**：`knowledge-star.svg`(黄星徽章)；吉祥物复用 welcome。
- **不切**：循环小数记法、气泡、分页点、按钮。
- **占位**：卡片正文先写死 1–3 张静态卡；**任何「换知识点/下一张/收藏」都不做逻辑**，分页点纯装饰。按钮「我知道了」关闭。
- `NEED_OWNER_CONFIRMATION`：循环节上点用 `U+0307` 组合上点是否在 Nunito/中文字体下渲染稳定；必要时改用 SVG 小上点或专门 math font。

### 屏 12 · 我的 / 设置 Profile & Settings
- **目标**：设置入口。**功能状态：B（声音开关真实；其余静态/未来）**。
- **视觉结构**：圆形头像 + 昵称「数感小达人」+ 副标「每天进步一点点！」(mock data)；设置行：声音(开关 on，真实) / 动画效果(开关 on，reduced-motion 映射) / 清空本地练习记录(右箭头，真实=清本地存储) / 关于数感训练场(右箭头，静态页)；底部 Tab 同首页。
- **层级**：L1 奶油底｜L4 头像+设置行(发丝分隔)｜L5 Phosphor volume/film/trash/info｜L6 mock 文本｜L8 toggle(CSS)。
- **吉祥物**：头像用 `asset.brand.avatar`(吉祥物头圆形裁切)。
- **要切**：`brand-avatar.webp`(吉祥物头像方/圆版)。
- **不切**：昵称、开关、行、箭头、tabbar。
- **占位**：昵称/头像写死 mock；**涉及账号、云同步、用户身份一律标 `FUTURE FUNCTION`**，本屏不出现登录/头像上传。
- `NEED_OWNER_CONFIRMATION`：图中「动画效果」开关是否即 reduced-motion 开关；建议复用同一开关语义，不新增状态。

---

## 3. 共用组件（全部 CSS/Phosphor，不切图）

| 组件 | 实现 | 备注 |
| --- | --- | --- |
| 主按钮 PrimaryButton | CSS 胶囊 `--radius-button`，bg primary，ink 白 | 每屏唯一主 CTA |
| 次按钮/描边按钮 | CSS 透明底 + `--border-strong` 描边 | 打印相关、返回 |
| 浅底按钮 | CSS `--tint-mint` / sky tint | 「再看一眼知识点」「直接打印」 |
| 卡片 Card | CSS `--surface-card` + `--radius-card:24px` + `--shadow-card` | |
| 列表行 Row | flex + `border-subtle` 发丝底分隔 | 错题本/进度/设置 |
| Tab 胶囊组 | CSS pill，active=绿底白字 | 探索页、错题本 |
| 底部 TabBar | CSS 4 等分，Phosphor 图标+文字 | 首页/练习/错题本/我的 |
| Toggle 开关 | CSS 自定义 checkbox | 声音/动画 |
| Checkbox 方框 | CSS 方形 + 选中勾 | 打印选题/错题本 |
| 数字键盘 | CSS 网格 3×4 键 | 答题屏，绝不切图 |
| 分数组件 | 真实文本 + 横分数线（CSS 上下排） | 课本横杠式 |
| 循环小数 | 文本 + 组合上点 `̇` | 见屏 11 待确认项 |
| 进度条/进度点 | CSS | 顶部进度条、反馈页圆点 |
| 对话气泡 | CSS 圆角 + 小三角尾巴 | 首页/知识卡文案 |
| 空状态 | 复用 mascot 小像 + 静态文案 | |

## 4. 共用资产 vs 独占资产

- **共用**：`mascot.welcome`（启动/首页/知识卡）、云/山丘/嫩芽/星星/问号 SVG、品牌 N 标、App Icon。
- **独占**：`mascot.correct`(屏5)、`mascot.thinking`(屏6/错题空态)、6 枚域图标(屏3)、黄星徽章(屏11)。

## 5. 实现介质分类

- **CSS**：全部按钮、卡片、圆角、阴影、背景色、分隔线、Tab、Toggle、Checkbox、数字键盘、进度、选中态、气泡、纸纹网格。
- **SVG（矢量、透明、可无损缩放）**：云、山丘、叶子、嫩芽、星星迸发、问号、6 枚域图标、黄星徽章、N 字标。
- **PNG/WebP（透明位图、2x/3x）**：吉祥物三姿势、App Icon、圆形头像。
- **真实文本（绝不烘焙进图）**：所有标题/副标题/按钮/日期/统计/分数/循环小数/对错。
- **动态数据**：题号进度、对错、日期、已选数量、分数与答案、toggle 状态。

## 6. 未来占位功能清单（统一「敬请期待」）

| 位置 | 功能 | 占位方式 |
| --- | --- | --- |
| 屏3 Tab | 知识地图 | 轻提示 toast「敬请期待」 |
| 屏3 域 tile | 立方与魔方 / 补数关系 / 倍数和因数 / 规律探索 | 进占位页（标题+正文「这个功能正在准备中，敬请期待。」+返回） |
| 屏3 底部 | 概念 / 例题 / 动画 | 轻提示 toast |
| 屏11 | 知识卡正文 | 静态 1–3 张，无翻页逻辑 |
| 屏12 | 昵称/头像/账号/云同步 | mock 静态，标 FUTURE FUNCTION |
| 屏12 | 关于 | 静态说明页 |

占位页统一文案：标题＝功能名；正文「这个功能正在准备中，敬请期待。」；按钮「返回」。

## 7. 风险点 / NEED_OWNER_CONFIRMATION

1. `屏3`：图上 6 域 tile 与 content v0.1 真实三域（Squares/Products/Fraction→Decimal）的映射关系，需 Owner 确认后再接线，禁止按图新造域。
2. `屏11`：循环小数上点 `̇` 在 Nunito + 中文字体栈的跨端渲染稳定性（H5 / 微信小程序）。
3. `屏12`：「动画效果」开关是否复用 reduced-motion，避免新增状态。
4. 吉祥物三姿势需保持同一身份/服装/光线；现有仓库旧 mascot PNG 按用户指示**不作为基准**，以本稿重新切图为准。
5. 微信小程序对 WebP 透明位图支持有限，落地时需备 PNG 兜底。

---

# B. FRONTEND HANDOFF ASSET MANIFEST

目录只做 `math-lab`；`magic-academy / space / forest` 仅保留未来空目录概念，本轮不产出。

```
assets/
  brand/
    logo-mark.svg            # N 字标（青绿 N，圆角方/圆两版）
    app-icon.png             # 吉祥物圆角 App 图标
    brand-avatar.webp        # 吉祥物圆形头像
  themes/
    math-lab/
      mascot/
        mascot-welcome.webp
        mascot-correct.webp
        mascot-thinking.webp
      domains/
        domain-squares.svg
        domain-cubes.svg
        domain-products.svg
        domain-complements.svg
        domain-factors.svg
        domain-patterns.svg
      decor/
        cloud-01.svg
        cloud-02.svg
        hill-01.svg
        leaf-01.svg
        leaf-02.svg
        sprout.svg
        sparkle.svg
        question.svg
        knowledge-star.svg
```

| Asset ID | File | Format | Transparent | Reusable | Pages | Suggested Size | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| asset.logo.mark | logo-mark.svg | SVG | YES | YES | Splash/Home/Profile | vector | 青绿 N 单字标；字标文字本身用真实文本，不切 |
| asset.app.icon | app-icon.png | PNG@3x | NO(满版圆角) | YES | 桌面/Home | 1024×1024 | 吉祥物圆角 App 图标，含底色 |
| asset.brand.avatar | brand-avatar.webp | WebP | YES | YES | Profile | 400×400 | 吉祥物头圆形，渲染 ~56–72px |
| asset.mascot.welcome | mascot-welcome.webp | WebP | YES | YES | Splash/Home/Knowledge | 1024×1024 master，渲染 140–220px | 挥手抱笔微笑；启动/首页/知识卡复用 |
| asset.mascot.correct | mascot-correct.webp | WebP | YES | YES | 答对 | 1024×1024 | 开心+星星迸发姿势 |
| asset.mascot.thinking | mascot-thinking.webp | WebP | YES | YES | 答错/错题空态 | 1024×1024 | 抬手疑惑姿势 |
| asset.domain.squares | domain-squares.svg | SVG | YES | YES | Explore/Home | vector | 蓝色圆角立方＝平方关系(A) |
| asset.domain.cubes | domain-cubes.svg | SVG | YES | YES | Explore | vector | 紫色骰子＝立方与魔方(C 占位) |
| asset.domain.products | domain-products.svg | SVG | YES | YES | Explore/Home | vector | 橙色 × 圆＝乘法表(A) |
| asset.domain.complements | domain-complements.svg | SVG | YES | YES | Explore | vector | 粉色环＝补数关系(C) |
| asset.domain.factors | domain-factors.svg | SVG | YES | YES | Explore | vector | 绿色 ∞＝倍数和因数(C) |
| asset.domain.patterns | domain-patterns.svg | SVG | YES | YES | Explore | vector | 黄色星＝规律探索(C) |
| asset.decor.cloud | cloud-01/02.svg | SVG | YES | YES | Splash/Home | vector | 软白云，边缘低透明 |
| asset.decor.hill | hill-01.svg | SVG | YES | YES | Splash/Home | vector | 淡绿软山丘 |
| asset.decor.leaf | leaf-01/02.svg | SVG | YES | YES | Explore | vector | 枝叶贴边装饰 |
| asset.decor.sprout | sprout.svg | SVG | YES | YES | Splash/Brand | vector | 两瓣嫩芽 |
| asset.decor.sparkle | sparkle.svg | SVG | YES | YES | 答对/Brand | vector | 金色小星/放射 |
| asset.decor.question | question.svg | SVG | YES | YES | 答错 | vector | 红色小问号 |
| asset.decor.knowledge-star | knowledge-star.svg | SVG | YES | YES | Knowledge | vector | 黄色星徽章 |

> 命名规范：全小写、连字符 `kebab-case`、按 `mascot- / domain- / decor-` 前缀分语义。组件只按语义 `asset.*` 取用，不写死文件路径。
> 位图均需 2x/3x 导出，保留透明背景；允许等比缩放，禁止非等比拉伸；吉祥物**不允许镜像**（铅笔在固定手）；SVG 可随主题换色。

---

# C. FRONTEND IMPLEMENTATION NOTES（给 Grok Bot）

1. **必须用 CSS 重建**：全部按钮、卡片、圆角矩形、阴影、背景色、发丝分隔、Tab/Toggle/Checkbox、数字键盘、进度条/进度点、对话气泡、纸纹网格、首页四张列表卡、底部 TabBar。
2. **必须使用提供素材**：吉祥物三姿势（透明 WebP）、N 字标与 App Icon、6 枚域图标 SVG、云/山丘/叶/嫩芽/星星/问号/黄星装饰 SVG。组件通过语义资产名（`asset.mascot.correct` 等）取用，经 `theme.js` 映射，不写死路径。
3. **可暂时占位**：知识卡正文写死静态 1–3 张；错题本空态复用 mascot 小像 + 静态文案；我的页昵称/头像用 mock。
4. **只显示「敬请期待」**：知识地图、立方与魔方、补数关系、倍数和因数、规律探索、概念/例题/动画、账号与云同步。可进页用统一占位页，入口图标用 toast。
5. **禁止从截图反推业务逻辑**：不设计状态机、不发明接口、不新增数据库、不补 UX。
6. **禁止整页做背景图**：任何屏都不许把整屏 PNG 当底图。
7. **禁止文字烘焙进图片**：所有标题/按钮/题目/数字/日期/对错必须是真实文本，循环小数用文本+组合上点。
8. **禁止主题资产写死进业务组件**：组件读 `asset.*` 语义名与 CSS 令牌，色值/文件路径集中在 `themes/math-lab/`。
9. **Mobile-first**：按 ~390×844 设计，垂直流式，安全区适配；桌面端同套卡片居中限宽。
10. **后续适配 H5 与微信小程序**：SVG 优先（小程序可转 base64/image）；位图备 PNG 兜底（小程序 WebP 兼容）；不依赖 DOM 专属能力做布局关键路径。

> 仍存疑项见第 7 节，落地前找 Owner 确认，不要自行假设。
