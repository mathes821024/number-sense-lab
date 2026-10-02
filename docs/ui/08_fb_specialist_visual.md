# 练习页视觉基线：F-B

状态：现行视觉基线。Visual Asset Gate 为 PASS WITH MINOR FIXES。本文不改运行代码，不改信息架构。

F-B 是温暖品牌化学习面板。它是首页的兄弟页：奶油纸底、青绿主色、现有吉祥物、分组双列。不是另一套应用，也不是知识地图。

布局、分组和卡片内容仍以 `docs/ux/05_specialist_grouped_grid.md` 为准。本文只定这一页怎么画。

# 1. 语义映射

唯一映射来源是 `concept-design/F-B-final/asset-manifest.json`。组件按这份清单里的 `domain_id` 取图，不在代码里写死文件名，也不另找一套图。

仓库根上的 `assets/specialist/asset-manifest.json` 不是这份基线。那里的分组底图、装饰图和内联 SVG 不进入实现。

八个域槽：

| domain_id | 文件 | 导航组 |
| --- | --- | --- |
| `squares` | `domain-squares.png` | 幂与乘方 |
| `cubes` | `domain-cubes.png` | 幂与乘方 |
| `powers` | `domain-powers.png` | 幂与乘方 |
| `products` | `domain-products.png` | 乘法与凑整 |
| `special_products` | `domain-special-products.png` | 乘法与凑整 |
| `fraction_decimal` | `domain-fraction-decimal.png` | 数与分数 |
| `halves` | `domain-halves.png` | 数与分数 |
| `complements` | `domain-complements.png` | 数与分数 |

路径相对于 `concept-design/F-B-final/`。每枚另有同名 `@2x`。透明 PNG。H5 和微信用同一套文件。

清单里的 `groups.powers`、`groups.products`、`groups.numbers` 只是导航分组的键。`powers` 和 `products` 与同名 `domain_id` 撞字，不能把组键交给调度、掌握或错题本。

这些图是语义资产。换文件、改色、换 PNG，都不改 `domain_id`、调度、掌握、错题语义和课程含义。

# 2. 怎么画

- 页底和主按钮继续用现有 `math-lab` 令牌。不为这一页另起一套青绿。
- 三组浅底用样式画，不用底图 PNG。幂与乘方浅蓝，乘法与凑整浅暖橙，数与分数浅薄荷绿。色值见 `concept-design/F-B-final/VISUAL_TOKENS.md`。组色只铺在组底、组名色点和该组图标浅底上。
- 组里的 tile 是白底紧凑双列。图标是主角。状态仍是那四句弱文字，不做徽章，不用红黄绿。
- 吉祥物复用现有欢迎姿态，文件是清单里的 `specialist-mascot.png`。只放页头一侧，不高于标题区，不加气泡。不新画一个角色。做题屏、键盘和纸页仍然不要吉祥物。
- 文字都由程序渲染。图片里不烘焙域名、状态或按钮。
- 不依赖内联 SVG。小程序和 H5 都读 PNG。

「今天想练哪个？」可以留在页头，但是辅助小字。它弱于三个分组标题，不是一段的标题。

# 3. 这一版先用着的图

常见幂现在是上升的阶梯。补数现在是缺口圆环。两枚都接受，实现不被它们挡住。以后可以换更像 xⁿ、或更像「补满」的 PNG。换图只改清单指向的文件。

验收看三档宽度：375、390、430。参照 `concept-design/F-B-final/mockups/` 里的 `final-375.png`、`final-390.png`、`final-430.png`。参照图不增加新交互。

# 4. 明确不动

八个 `domain_id`、三个导航组、双列、知识地图仍是未来入口、调度、掌握、错题本、打印、首页主路径。
