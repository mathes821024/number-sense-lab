# Number Sense Lab｜视觉系统 v0.3

状态：微信上线前的视觉重构契约，供 ChatGPT 做 Visual Gate Review。

本文只定义视觉表达层。不改学习逻辑、调度、掌握、错题本、进度语义、打印语义、判题、本地优先，也不增加后端或账号。

已认可的视觉板是默认主题的主要参考。按规则提取设计系统，不按屏幕逐张临摹。

上游交互仍以这些文件为准：

- `docs/ux/02_ux_spec.md`
- `docs/ux/03_mistake_book_ux.md`
- `docs/ui/03_ui_spec.md`
- `docs/product/01_prd.md`
- `docs/product/02_learner_mistake_book.md`

图和交互契约不一致时，已通过的 UX 胜出。冲突记在第 17 节，不在这里改流程。

---

# 1. Visual Direction

默认气质：明亮、温暖、像一本可以摸到的数学练习本。奶油色纸底，青绿作为品牌色，黄、橙、红、蓝只做点缀。圆角、轻阴影、卡片成组。有吉祥物，但练习时让开。

适合初中生，也让家长看着不幼稚。它比 v0.1 的安静纸更有识别度，仍然是学习产品，不是游戏大厅，也不是考试仪表盘。

一句话：同一套 Number Sense Lab，外面可以换气氛，里面还是同一道题。

# 2. Brand Personality

性格：温暖、鼓励、清楚、有一点劲、可信、轻快。

不采用：学前卡通堆砌、游戏货币和连胜、赛博霓虹、SaaS 仪表盘、考前焦虑、满屏装饰。

品牌说法可以更暖，例如「和数字做朋友」。首页仍要回答：今天练什么、大约多久、记录只在这台设备。

## 吉祥物

一个固定的原创孩子形象，抱着铅笔，圆脸、短动作、不抢数学。

可以出现：打开时的欢迎、一段练完、答对后的短暂停顿、答错时站在正确关系旁边。

必须离开：正在写答案的题目屏、数字键盘上方、打印到纸上的题目页。装饰若挡住题目或键盘，就去掉。

## 标志与图标

- 字标：`Number Sense Lab` 与「数感训练场」可以同屏。英文不压过中文。
- 应用图标：同一吉祥物或字母 N 的圆角标。两端用同一枚。
- 图标：圆角、面性、少细节。现有三个域各一枚。不为一张图里的新学科先做图标。
- 背景：云、叶子、淡淡的几何形，只铺在首页和探索页的边缘，透明度要低。

# 3. Color Tokens

这些是实现令牌，不是新的产品状态。组件读令牌名，不把色值写进页面。

默认主题 `math-lab`（澄蓝数学实验室 / Bright Number Lab）的建议值：

| 令牌 | 建议值 | 用途 |
| --- | --- | --- |
| `color.brand.primary` | `#0F7F5A` | 唯一主按钮 |
| `color.brand.bright` | `#14956A` | 字标、徽章 |
| `color.brand.primary-ink` | `#F7FBF8` | 主按钮上的字 |
| `color.brand.secondary` | `#7DCFB6` | 次级块、浅强调 |
| `color.accent.sun` | `#F5C451` | 小星、轻完成 |
| `color.accent.amber` | `#F4A261` | 点缀，不表示警告判决 |
| `color.accent.sky` | `#5B8DEF` | 信息，不表示分数 |
| `color.surface.page` | `#F7F3E8` | 屏幕底 |
| `color.surface.card` | `#FFFDF8` | 卡片、答案框 |
| `color.text.primary` | `#1C2430` | 题目、标题 |
| `color.text.secondary` | `#5C6670` | 说明、安静链接 |
| `color.border.subtle` | `#E6DCCB` | 卡片边、分隔 |
| `color.feedback.correct` | `#1E8F5A` | 「对」和勾 |
| `color.feedback.wrong` | `#C4563A` | 停下来看的标记 |
| `color.feedback.hint` | `#F3EBE3` | 正确关系所在的浅底 |
| `color.disabled` | `#C9C3B8` | 不可用 |

规则：

- 主按钮的绿只表示「现在最该做的那一个动作」，不表示答对。
- 答对不全屏刷绿。答错不全屏刷红。红叉不能是唯一反馈。
- 对错同时有文字和形状。
- 打印到纸上的题目页不吃这套屏幕色。纸上是黑字白底。

对比：题目字对纸底、主按钮字对按钮底，达到正文级别。次级字不用于题目和提交。

# 4. Typography

中文用系统字体栈：`"PingFang SC", "Noto Sans SC", "Source Han Sans SC", sans-serif`。不要求付费字体。

数字和拉丁可用 Nunito（SIL Open Font License）。数字用表格数字，避免进位时跳动。没有 Nunito 时退回系统无衬线。不用书法体，不用等宽体当界面主字体。

| 角色 | 手机 | 平板 / 电脑 | 用途 |
| --- | --- | --- | --- |
| Question | 40px | 56–64px | 题干。训练屏最大 |
| Title | 28px | 34px | 页标题 |
| Body | 17px | 18px | 说明、反馈句 |
| Label | 13px | 14px | 域、日期、已选数量 |
| Answer | 32px | 40px | 正在输入的答案 |

循环小数的循环点画在数字上方，不改成括号。读屏仍读「0.6，6 循环」。

# 5. Spacing / Radius / Shadow

间距刻度：4、8、12、16、24、32、48。

| 令牌 | 默认主题 | 用途 |
| --- | --- | --- |
| `radius.button` | 999px | 主按钮、胶囊 |
| `radius.card` | 24px | 卡片 |
| `radius.chip` | 999px | 筛选、标签 |
| `radius.input` | 16px | 答案框、按键 |
| `shadow.card` | 很轻的一层 | 浮起的卡片 |
| `shadow.floating` | 略深一层 | 仅键盘或临时层 |

触控目标至少 44×44。按键可以更大。卡片之间 12–16。页边 20。

# 6. Component System

页面用同一组组件拼，不给每一屏单独做一套。

| 组件 | 职责 |
| --- | --- |
| Primary CTA | 全宽胶囊，品牌底。一屏最多一个 |
| Secondary CTA | 浅底或描边，明显弱于主按钮 |
| Quiet Link | 无底，次级字色 |
| Topic / Domain Card | 只装现有三个域：平方、常用乘积、分数到小数 |
| Practice Card | 训练中的题目区。字最大，装饰最少 |
| Feedback Card | 答对或答错后的短反馈。关系比吉祥物大 |
| Selection Row | 可勾选的一行 |
| Print Selection Row | 选题行。可带「当前错题」或「最近答对」，不做徽章墙 |
| Status Tag | 文字加形状。进度页上是「对 / 错」，不是掌握度 |
| Progress Row | 日期、做完或先停、对了几题 |
| Empty State | 一句人话，加回到开始的路。可以有小插画 |
| Mascot Message Bubble | 吉祥物旁的短句。不放在题目屏 |
| Bottom Navigation item | 普通页面四个入口。正在写答案时隐藏 |
| Header / Top Bar | 返回或「先停一下」、域标签。训练中没有计时 |

主按钮在首页仍是「开始今天的练习」，并带「大约 5～10 分钟」。

# 7. Mascot Rules

见第 2 节。补充：答错时吉祥物可以是思考的姿势，句子仍是正确关系加一句为什么，不说「你太差了」。答对时一个短反应就够。同一屏不要两只吉祥物。

# 8. Illustration Rules

插画解释气氛，不解释另一套数学。循环点、分数线以教材写法为准，插画不能改写它们。

装饰形状停在内容背后。题目、答案、键盘在最上层。

# 9. Motion / Delight

允许：按钮按下约 100ms、答对时一个小星或一次轻脉冲、吉祥物一个短动作、题目到反馈的短过渡、平台做得到时的轻音效。音效仍可关。关掉之后判题和记录不变。

不允许：每题撒花、连胜压力、金币、倒计时、排名、持续弹跳、做题时循环播放的装饰动画。

系统开启减少动态时，脉冲、吉祥物动作和过渡改为直接出现。

趣味服务于记得住、愿意再来、做对时有把握。不服务于停不下来。

# 10. Focus / Feedback / Exploration Modes

| 模式 | 在哪 | 画面 |
| --- | --- | --- |
| FOCUS | 正在写这一题 | 装饰最少，题目对比最强，背景安静，没有吉祥物，没有底栏 |
| FEEDBACK | 刚提交之后的短暂停顿，以及一段结束 | 可以有吉祥物和更明确的颜色。答对短，答错停住看关系。动画短 |
| EXPLORATION | 知识卡、知识地图。当前只占位 | 可以保留图上的样子。点了说「敬请期待」。不在做题时自动打开 |

做题时保持 FOCUS。提交之后才进入 FEEDBACK。EXPLORATION 不插入当前这一题的输入。

# 11. Screen Mapping

每块图只取视觉，不把图上的新入口算进当前版本。

| 图上的屏 | 归类 | 当前版本怎么用 |
| --- | --- | --- |
| 1 启动 | OPTIONAL 视觉 | 可以有很短的品牌帧。不能变成必须点过的引导，也不能挡住「打开就能练」 |
| 2 首页 | APPROVED CURRENT FEATURE | 吉祥物、四张入口卡、四个底部入口、设备上的那一句。开始练习是今天的主路径 |
| 3 选主题 | 三个现有域是 APPROVED；其余是占位 | 平方、常用乘积、分数到小数进入真练习。其他方向、知识地图、概念 / 例题 / 动画只说「敬请期待」 |
| 4 做题 | APPROVED CURRENT FEATURE | 一题、循环点、大键盘、「先停一下」、「2 / 10」。没有底栏，没有吉祥物，没有倒计时 |
| 5 答对 | APPROVED CURRENT FEATURE | 用新的答对画面和吉祥物。短暂停顿后进入下一题，不必再点一次。「看知识点」只说「敬请期待」 |
| 6 答错 | APPROVED CURRENT FEATURE | 用新的答错画面。主按钮是「下一题」。没有「再做一遍」。正确关系仍是主角 |
| 7 最近练得怎么样 | APPROVED CURRENT FEATURE | 段落摘要，加上最近一次「对 / 错」。「选题打印」进入同一个选题器 |
| 8 错题本 | 当前错题列表是 APPROVED | 「已掌握」「全部」点了只说「敬请期待」，不另做一份错题状态。打印和再练走已有入口 |
| 9 选题 | APPROVED CURRENT FEATURE | 同一个选题器。当前错题默认勾上。勾选不改掌握 |
| 10 打印预览 | APPROVED CURRENT FEATURE | 只有勾上的题目。答案另页。纸上黑字白底 |
| 11 知识卡 | VISUAL PLACEHOLDER | 答错时已有的那一句结构提示保留。独立知识卡点了说「敬请期待」 |
| 12 我的 | VISUAL PLACEHOLDER | 声音开关是真的。昵称、清空记录、动画开关都不做。动画继续跟随系统的减少动态 |

做题时的「2 / 10」可以有一条平静的进度。它不是倒计时，也不用动画催促。

进度页的「再练一次」和错题本的「练这些错题」可以做成这一页上的实心按钮。它们不是第二个今日训练，也不新写一套调度。

# 12. Responsive Rules

一套界面，三种宽度。

- 手机竖屏：主目标。单列，先触摸，留白够，不挤。
- 平板：间距和卡片更大。任务与手机相同。
- 电脑：内容居中，练习列最大宽度约 480–560。键盘可以作答，按钮仍可点。说明可以更宽，题目仍是一题一屏。不把手机界面拉成一条横幅。

训练所需的操作不依赖悬停、右键或桌面快捷键。

# 13. H5 / Mini Program Adaptation

H5、电脑和微信小程序用同一套设计语言：同一颜色令牌、同一字号层级、同一吉祥物、同一组件、同一对错语义、同一数学写法。

可以不同的只有：安全区、顶部系统栏、平台返回、分享或系统打印、触控间距、平台图标。不做成两个品牌。

# 14. Accessibility

- 题目和主按钮达到正文对比。
- 对错不单靠颜色。
- 焦点环可见。
- 触控不小于 44。
- 减少动态时去掉装饰动画。
- 循环小数有可读的无障碍名称。
- 任何主题若让数学更难读，这套主题不能用。

数字键上快速连点必须记成按键，不能变成页面放大。整页双指缩放保留。这条仍是交互验收，不因主题改变。

# 15. Asset Checklist

VA0 已锁定 `math-lab` 资产包。语义槽位和取用规则见 `docs/ui/07_visual_asset_decomposition.md`。文件本身留在实现分支，契约以槽位名为准。缺某一张时，仍可用 N 标或形状顶上，不因此停掉重构。

| 资产 | 分级 |
| --- | --- |
| `mascot.welcome` / `correct` / `thinking` | REQUIRED FOR CURRENT BUILD。VA0 已锁定，不再为了更像原稿重做 |
| 应用图标，用吉祥物这一版 | REQUIRED FOR CURRENT BUILD |
| `domain.squares` / `products` / `fractions` | REQUIRED FOR CURRENT BUILD |
| 对、错的形状标记 | REQUIRED FOR CURRENT BUILD |
| 单独的 N 字标 | OPTIONAL。现在不返工 |
| 云、叶子、淡几何底 | OPTIONAL |
| 空状态小图 | OPTIONAL |
| 加载插画 | OPTIONAL |
| 知识讲解姿势 | FUTURE |
| 立方、倍数等新域图标 | FUTURE |
| 魔法学院、星空、森林的整包 | FUTURE |

# 16. Non-goals

本文不增加：登录、后端、同步、排行榜、支付、新的训练域、知识地图、概念 / 例题 / 动画分段、错题历史分段、个人档案、独立知识卡产品、第二套打印。

主题不能改变：题目逻辑、判题、掌握、调度、错题定义、进度上的最近一次对错、选题打印、本地存储。

# 17. Visual / UX Conflicts

Owner 已在 VA0 之后裁决。下面这些不再悬着。

已吸收进当前体验：普通页面四个底部入口；做题时隐藏底栏；轻进度「2 / 10」；答对用新画面但仍短反馈；答错用新画面，主按钮仍是「下一题」。

仍不采用图上的业务：答错后的「再做一遍」；用组合字符硬凑循环点；动画开关作为新状态；知识卡、我的档案、新域和知识地图的真实功能。这些只说「敬请期待」。

**VISUAL_UX_CONFLICT:** NONE

**VISUAL_PRODUCT_CONFLICT:** NONE

# 18. Implementation Handoff

实现时：

- 组件只读语义令牌，例如 `--color-primary`、`--surface-card`、`--text-main`、`--feedback-correct`、`--feedback-wrong`。
- 不在页面里写死某一枚绿或某一枚黄。
- 资源经主题的资产名取得，不把某个主题的文件路径写进组件。
- 先做默认主题 `math-lab`。组件吃语义令牌，不写死吉祥物文件路径。其他主题包只留结构。
- 现在不做主题切换界面，也不做皮肤商店。Theme-ready 不等于现在就实现 Theme Switching。
- 纸上的题目页保持黑字白底，不随皮肤变成彩色海报。

建议的主题对象：

```js
theme = {
  id: "math-lab",
  colors: {},
  typography: {},
  radius: {},
  shadows: {},
  background: {},
  mascot: {},
  icons: {},
  motion: {},
  sounds: {}
}
```

# Theme System / 主题皮肤系统

## 1. Theme boundary

层次是：

```text
Core Learning Engine
        ↓
UX / Interaction Contract
        ↓
UI Component System
        ↓
Theme Layer
```

主题只替换视觉表达。同一个答对组件，在默认主题里是勾、青绿和一个小星；在以后的主题里可以是另一套表面和另一段短动画。`correct = true` 不变。

主题可以改：颜色、背景、字体风格、图标、插画、吉祥物造型、卡片和按钮的表面、装饰、轻动效、可选音效。

主题不可以改：题目逻辑、判题、掌握、调度、错题语义、进度语义、打印语义、学习契约、有没有后端。

若一个主题必须改产品、UX、学习契约或 Core 状态，记 `THEME_ARCHITECTURE_CONFLICT`，不要把皮肤和学习绑在一起。

## 2. Semantic tokens

至少这些名字。值由主题包提供。

```text
color.brand.primary
color.brand.secondary
color.surface.page
color.surface.card
color.text.primary
color.text.secondary
color.feedback.correct
color.feedback.wrong
color.feedback.hint

radius.card
radius.button

shadow.card
shadow.floating

motion.correct
motion.wrong
motion.transition

asset.logo
asset.mascot.default
asset.mascot.correct
asset.mascot.thinking
asset.background.home
asset.domain.squares
asset.domain.products
asset.domain.fractions
```

## 3. Theme assets

每个主题包提供：令牌、图标、插画、吉祥物、可选的动效预设、可选的音效。缺了可选资产时，组件退回形状和文字，不报错，也不改判题。

## 4. Component / theme relationship

组件按语义取令牌和资产名。答对永远是 `CorrectFeedback`。主题只换它的颜色、表面和短动画。

## 5. Default theme

当前实现边界：

CURRENT BUILD：只实现 `math-lab`。组件按主题来写：读语义令牌，资源尽量走主题里的资产名，默认加载这一套。视觉板是参照，不是拿去切图后嵌进页面的位图。吉祥物整包若还没齐，可以用简化的 N 标和形状图标，不因此停掉前端重构。

DO NOT BUILD：主题选择器、主题设置页、魔法学院资源、星空资源、森林资源、运行时的皮肤商店或下载。主题架构现在就要留好。换肤界面是 FUTURE。

## 5.1 Default theme identity

当前这张已由 Owner、家人和孩子看过的视觉板，就是默认主题。

- id：`math-lab`
- 名字：澄蓝数学实验室
- 英文工作名：Bright Number Lab

这是架构说明里已点过名、当时故意不冻结色值的那个方向。色值现在写在本文第 3 节。不为了「以后能换肤」把这套默认质量做淡。

## 6. Future theme packs

以后的目录可以是：

```text
themes/
  math-lab/        当前默认，这一轮要做
  magic-academy/   未来
  space/           未来
  forest/          未来
```

魔法学院、星空宇宙、森林探索都是 FUTURE，不是当前版本的功能，也不在这一轮出图。

魔法学院若以后做，用原创的魔法数学学院：羊皮纸、图书馆、星图、计量、几何纹样、烛光、深蓝和金。数学可以有自己的比喻，例如平方像方砖、分数像配比、数轴像轨道。那仍是比喻，不改题目本身。

不用：哈利·波特这个名字、霍格沃茨、原作角色、原作学院徽章、电影画面、专有字体和标志、一看就知道来自该系列的道具。要的是原创气氛，不是那套作品的皮肤。

## 7. Accessibility

每一套主题都要保住第 14 节：对比、数学能读、对错不单靠颜色、焦点可见、触控尺寸、减少动态。伤可读性的主题不接受。

## 8. Copyright / originality

吉祥物、图标、插画、主题名都用原创。不把其他作品的角色、徽章、海报或字体当成资源。Nunito 若使用，遵守它的开源字体许可，并保留中文系统字体后备。

## 9. Theme acceptance checklist

- 只换了表达，题目和判题仍走同一条路径。
- 组件没有写死色值或某个主题的文件路径。
- 默认主题仍是澄蓝数学实验室，并且达到这张视觉板的清楚和温暖。
- 纸上题目仍是黑字白底。
- 做题时仍是 FOCUS，吉祥物不进键盘。
- 减少动态和关掉声音之后，练习仍然完整。
- 未来主题没有被算进当前范围。
