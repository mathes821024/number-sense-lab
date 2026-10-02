# ASSET_MANIFEST — 专项训练页 F-B 资源清单

视觉冻结候选稿。所有位图资源均为 PNG，微信 / H5 通用，不依赖 inline SVG。
文字（标题、名称、状态、Tab）一律程序渲染，未烘焙进任何图片。

## domains/（8 个训练域图标）

统一规格：256×256 基础版 + 512×512 @2x，透明背景，主体居中约占画布 70%，
56px 显示尺寸下可辨认。统一 semi-flat 风格：同一线条粗细、同一圆角逻辑、
同一柔和单色明暗、无投影、无外层卡片。组内同色系（幂与乘方=蓝，乘法与凑整=暖橙，数与分数=薄荷绿）。

| filename | purpose | recommended display size | transparent | crop allowed | stretch allowed | platform notes |
|---|---|---|---|---|---|---|
| domain-squares.png (+@2x) | 平方：2×2 面积格，左上格加深 | 56–72px 方形 | 是 | 否 | 否（等比缩放） | 微信/H5 通用 |
| domain-cubes.png (+@2x) | 立方：等距立方体三面 | 56–72px 方形 | 是 | 否 | 否（等比缩放） | 同上 |
| domain-powers.png (+@2x) | 常见幂：三级上升阶梯 + 悬浮方块 | 56–72px 方形 | 是 | 否 | 否（等比缩放） | 同上 |
| domain-products.png (+@2x) | 常用乘积：4×4 点阵 | 56–72px 方形 | 是 | 否 | 否（等比缩放） | 同上 |
| domain-special-products.png (+@2x) | 凑整乘积家族：两块拼合成完整方块 | 56–72px 方形 | 是 | 否 | 否（等比缩放） | 同上 |
| domain-fraction-decimal.png (+@2x) | 分数到小数：横线分数 ½ ↔ 0.5 | 64–72px 方形 | 是 | 否 | 否（等比缩放） | 含数学符号字形，属冻结语义 |
| domain-halves.png (+@2x) | 半数与翻倍：一变二 + ×2 | 56–72px 方形 | 是 | 否 | 否（等比缩放） | 同上 |
| domain-complements.png (+@2x) | 补数：缺口圆环 + 补位弧块 | 56–72px 方形 | 是 | 否 | 否（等比缩放） | 同上 |

## mascot/

| filename | purpose | recommended display size | transparent | crop allowed | stretch allowed | platform notes |
|---|---|---|---|---|---|---|
| specialist-mascot.png (+@2x) | 页头右侧品牌吉祥物（现有 welcome 姿态，复用不重绘） | 高 72–88px | 是 | 是（轻量裁切） | 否 | 复用 math-lab 主题现有素材 |

## groups/ 与 decor/

不输出位图。三组浅底色（淡蓝 / 淡橙 / 淡薄荷）、圆角、星点闪光均由 CSS/程序绘制。
若未来确需闪光装饰图，再单独立项补充，本轮不制造无意义 PNG。

## 效果图合成说明

最终效果图（final-375 / 390 / 430）页头吉祥物为 specialist-mascot.png 原图直接合成，
与资源包为同一文件，非 AI 重绘；角色与首页完全一致。

## 已知限制

- 图标为 AI 生成的 semi-flat 位图，缩放到 56px 时辨识度已按 256 基础版验证；
  若 Gate 要求完全矢量化的线条一致性，可在此基础上以同一构图重绘为 SVG 再导出 PNG，构图与语义不变。
