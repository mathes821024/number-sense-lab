# ASSET_MANIFEST — 专项训练页 F-B 资源清单

这是设计源，不是运行目录。生产页面从 `assets/themes/math-lab/specialist/` 加载，不从这里加载。文字一律程序渲染，不烘焙进图片。

设计目录可以同时留下高分辨率母版和实际要用的较小文件。文件名里的 `@2x` 在这里只是历史文件名，不表示运行时要加载一张更高密度的图。

## domains/（8 个训练域图标）

统一规格：256×256 是运行时用的那张；512×512 的 `@2x` 只留在设计目录。透明背景。显示尺寸 56–72px，256px 对当前手机已经够。统一 semi-flat 风格：同一线条粗细、同一圆角逻辑、同一柔和单色明暗、无投影、无外层卡片。组内同色系（幂与乘方=蓝，乘法与凑整=暖橙，数与分数=薄荷绿）。

| filename | purpose | recommended display size | transparent | crop allowed | stretch allowed | platform notes |
|---|---|---|---|---|---|---|
| domain-squares.png | 平方：2×2 面积格，左上格加深。256px，进入运行目录 | 56–72px 方形 | 是 | 否 | 否（等比缩放） | 微信/H5 通用 |
| domain-cubes.png | 立方：等距立方体三面。256px，进入运行目录 | 56–72px 方形 | 是 | 否 | 否（等比缩放） | 同上 |
| domain-powers.png | 常见幂：三级上升阶梯 + 悬浮方块。256px，进入运行目录 | 56–72px 方形 | 是 | 否 | 否（等比缩放） | 同上 |
| domain-products.png | 常用乘积：4×4 点阵。256px，进入运行目录 | 56–72px 方形 | 是 | 否 | 否（等比缩放） | 同上 |
| domain-special-products.png | 凑整乘积家族：两块拼合成完整方块。256px，进入运行目录 | 56–72px 方形 | 是 | 否 | 否（等比缩放） | 同上 |
| domain-fraction-decimal.png | 分数到小数：横线分数 ½ ↔ 0.5。256px，进入运行目录 | 64–72px 方形 | 是 | 否 | 否（等比缩放） | 含数学符号字形，属冻结语义 |
| domain-halves.png | 半数与翻倍：一变二 + ×2。256px，进入运行目录 | 56–72px 方形 | 是 | 否 | 否（等比缩放） | 同上 |
| domain-complements.png | 补数：缺口圆环 + 补位弧块。256px，进入运行目录 | 56–72px 方形 | 是 | 否 | 否（等比缩放） | 同上 |

同名 `@2x`（512px）只留在本目录，不复制进运行目录。

## mascot/

| filename | purpose | recommended display size | transparent | crop allowed | stretch allowed | platform notes |
|---|---|---|---|---|---|---|
| specialist-mascot.png | 1024px 设计母版。留在本目录，不进运行目录 | 不直接上屏 | 是 | 否 | 否 | 现有 welcome 姿态，不重绘 |
| specialist-mascot@2x.png | 512px 实际用图。文件名沿用。运行时清单只把它记成 `mascot.asset` | 高 72–88px | 是 | 是（轻量裁切） | 否 | 不要把 `asset_2x` 当成运行时的键 |

## groups/ 与 decor/

不输出位图。三组浅底色（淡蓝 / 淡橙 / 淡薄荷）、圆角、星点闪光均由 CSS/程序绘制。
若未来确需闪光装饰图，再单独立项补充，本轮不制造无意义 PNG。

## 效果图合成说明

最终效果图（final-375 / 390 / 430）页头吉祥物为 specialist-mascot.png 原图直接合成，
与资源包为同一文件，非 AI 重绘；角色与首页完全一致。

## 已知限制

- 图标为 AI 生成的 semi-flat 位图，缩放到 56px 时辨识度已按 256 基础版验证；
  若 Gate 要求完全矢量化的线条一致性，可在此基础上以同一构图重绘为 SVG 再导出 PNG，构图与语义不变。
