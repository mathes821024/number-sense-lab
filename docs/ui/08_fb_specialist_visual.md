# 练习页视觉基线：F-B

状态：现行视觉基线。实现对照为 PASS WITH 2 FIXES。本文只回写允许的差异和两处修正，不改信息架构，不改运行代码。

F-B 是温暖品牌化学习面板。它是首页的兄弟页：奶油纸底、青绿主色、现有吉祥物、分组双列。不是另一套应用，也不是知识地图。

布局、分组和卡片内容仍以 `docs/ux/05_specialist_grouped_grid.md` 为准。本文只定这一页怎么画。

# 1. 语义映射

`concept-design/F-B-final/` 是设计过程和评审证据，包括原稿、参照图和交接清单。生产页面不得再从这条路径加载图标或吉祥物。清理概念稿不能把正式页面的图一起删掉。

运行目录只放客户端会打包、会加载的文件：8 张 256px 域图标，加 1 张 512px 吉祥物，再加运行时清单。域图标的 `@2x` 和吉祥物的 1024px 母版留在设计目录，不复制进去。

运行时清单放在 `assets/themes/math-lab/specialist/asset-manifest.json`。它由同步脚本生成。域图标的键仍是 `domains.<id>.asset`。吉祥物只保留 `mascot.asset`，指向那张实际使用的 512px 图。设计清单里那张 512px 图的文件名仍可能叫 `specialist-mascot@2x.png`，这只是源文件名。运行时不要再用 `asset_2x` 当吉祥物的键，也不要把它理解成「更高密度的那一张」。1024px 母版在设计清单里仍叫 `mascot.asset`，那个键名不到运行时。

仓库根上的 `assets/specialist/` 若仍带分组底图、装饰图或 SVG，不是这套运行时资源。主题清单里旧的三枚 SVG 和 `futureDomains` 也不是练习页的现行图标。

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

设计原稿仍在 `concept-design/F-B-final/assets/specialist/`。运行时只有上面说的 9 张图，放在 `assets/themes/math-lab/specialist/`。透明 PNG。H5 和微信用同一套文件。

清单里的 `groups.powers`、`groups.products`、`groups.numbers` 只是导航分组的键。`powers` 和 `products` 与同名 `domain_id` 撞字，不能把组键交给调度、掌握或错题本。

这些图是语义资产。换文件、改色、换 PNG，都不改 `domain_id`、调度、掌握、错题语义和课程含义。

# 2. 怎么画

- 页底和主按钮继续用现有 `math-lab` 令牌。不为这一页另起一套青绿。
- 三组浅底用样式画，不用底图 PNG。幂与乘方浅蓝，乘法与凑整浅暖橙，数与分数浅薄荷绿。色值见 `concept-design/F-B-final/VISUAL_TOKENS.md`。组色只铺在组底、组名色点和该组图标浅底上。
- 组里的 tile 是白底紧凑双列。图标是主角。状态仍是那四句弱文字，不做徽章，不用红黄绿。状态色是 `specialist.status.color`，现为 `#667085`。英文组名 POWERS / PRODUCTS / NUMBERS 用 `specialist.group.metaColor`，现也是 `#667085`。两个令牌分开。以后改淡英文组名，不能把状态文字一起改淡。状态仍小于、淡于域名。
- 吉祥物复用现有欢迎姿态。运行时文件在 `assets/themes/math-lab/specialist/mascot/`。只放页头一侧，不高于标题区，不加气泡。不新画一个角色。高度可以随屏幕在上限内缩放；微信标题栏占掉空间时，保持和标题区的比例，不必死守 80px。430 宽上吉祥物约 84px、标题区约 86px，是接受的结果。做题屏、键盘和纸页仍然不要吉祥物。
- 文字都由程序渲染。图片里不烘焙域名、状态或按钮。
- 不依赖内联 SVG。小程序和 H5 都读 PNG。

「今天想练哪个？」可以留在页头，但是辅助小字。它弱于三个分组标题，不是一段的标题。

# 3. 这一版先用着的图

常见幂现在是上升的阶梯。补数现在是缺口圆环。两枚都接受，实现不被它们挡住。以后可以换更像 xⁿ、或更像「补满」的 PNG。换图只改清单指向的文件。

图标按文件本身的留白显示，不要在运行时裁成「主体占画布 70%」。现在的八枚可以先用。以后若统一留白，只换 PNG。

# 4. 窄屏可以紧一点

`concept-design/F-B-final/VISUAL_TOKENS.md` 里的数字是默认值，不是每一档都必须像素相同。375、390、430 都要能用。窄屏为了长名字、可点区域和微信自己的标题栏、底栏，可以用更紧的间距，只要层级不变：分组标题仍大于状态，图标仍是 tile 的主角，可点区域仍不小于 44×44。

375 宽已经接受的紧凑值：分组内边距 6px，tile 间距 8px，过长的域名可以用 14px。不要为了贴齐设计稿把页面再拉长。

验收仍看这三档。参照图在 `concept-design/F-B-final/mockups/`，只作外观对照，不增加新交互。

# 5. 资源管线

`scripts/sync-fb-assets.mjs` 是设计源进入运行目录的唯一路径。换图时先改设计目录里的 PNG 和 `concept-design/F-B-final/asset-manifest.json`，再运行：

```text
node scripts/sync-fb-assets.mjs
node scripts/sync-fb-assets.mjs --check
```

脚本复制运行时需要的图，并生成这两份文件。它们都标成生成结果，禁止手改：

- `assets/themes/math-lab/specialist/asset-manifest.json`
- `app/theme/fb-specialist-assets.js`

H5 读运行时清单，不读设计目录。`feat/v04-content-expansion` 上已有 `test/fb-specialist.test.js` 核对这份同步。本文不另加一条 CI 规则。

先换批准过的设计图，改设计清单，再跑同步脚本。不要直接改运行目录里的副本。

# 6. 明确不动

八个 `domain_id`、三个导航组、双列、知识地图仍是未来入口、调度、掌握、错题本、打印、首页主路径。
