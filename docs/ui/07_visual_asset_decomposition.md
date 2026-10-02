# Number Sense Lab｜视觉资产契约

状态：VA0 已通过。本文把有效内容从实现分支沉淀到正式文档。图片文件仍在 `feat/v03-concentrated-build` 的 `assets/themes/math-lab/`，提交 `62c7388`。这里不重复放位图。

来源：Owner、配偶和孩子选定的 `产品原型.png`。工程入口是 `assets/themes/math-lab/manifest.json`。

组件按语义槽位取图，不写死文件名。换主题时换同一组槽位里的文件。

## 已锁定的槽位

| 槽位 | 用途 |
| --- | --- |
| `mascot.welcome` | 启动、首页 |
| `mascot.correct` | 答对的短反馈 |
| `mascot.thinking` | 答错，站在正确关系旁边 |
| `brand.appIcon` | 应用图标。用吉祥物这一版 |
| `brand.avatar` | 需要头像时的圆形吉祥物 |
| `logo.mark` | N 字标。现在可以不用，以后再补，不为此返工 |
| `domain.squares` | 平方 |
| `domain.products` | 常用乘积 |
| `domain.fraction_decimal` | 分数到小数。旧槽名 `domain.fractions` 不再作为当前名 |
| `domain.halves` | 半数与翻倍 |
| `domain.complements` | 补数 |
| `domain.cubes` | 立方 |
| `domain.powers` | 常见幂 |
| `domain.special_products` | 凑整乘积家族 |
| `decor.cloud1` `decor.cloud2` `decor.hill` `decor.leaf1` `decor.leaf2` `decor.sprout` `decor.sparkle` `decor.question` | 边缘装饰。做题时不用 |

欢迎、答对、思考三张已经锁定。不再为了更像最初那张人物稿重新生成。

练习页八个域的现行文件在 `concept-design/F-B-final/asset-manifest.json`。分组浅底用样式画，不用分组底图。知识地图仍是以后的入口。换这些 PNG 不改 `domain_id`。

## 什么用图，什么用界面画

用图：吉祥物、八个域图标、边缘装饰、应用图标。

用界面画出来，不烘焙进图片：按钮、卡片、圆角、阴影、底栏、键盘、分数线、对勾、叉、进度、全部文字。

循环小数的点由共享数学渲染画在数字上方。不用组合字符，也不把 `0.(6)` 显示给学生。存储和判题仍是 `0.(6)`。

纸上的题目页不用吉祥物，也不用装饰。黑字白底。

## 占位

这些可以按图出现，点击只说「敬请期待」：

- 知识地图、概念、例题、动画
- 独立知识卡
- 「已掌握」「全部」
- 我的里的昵称、清空记录、关于

声音开关是已有功能，留在「我的」。不新增动画开关。减少动态继续跟随系统。

不新增登录、后端、同步，也不清空学习记录。

## 和流程的关系

资产说明曾经按图写下「再做一遍」和括号式循环小数。那些不进入实现。流程以 Product、UX 和 `docs/ui/05_visual_system_v03.md` 的第 11、17 节为准：答错按「下一题」，答对短反馈后自己进入下一题，做题时没有底栏。
