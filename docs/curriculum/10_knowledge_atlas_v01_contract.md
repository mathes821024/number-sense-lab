# Knowledge Atlas v0.1 Contract

状态：`FROZEN FOR FIRST-LAUNCH BUILD`

## 1. 目的

Atlas 回答“知识全不全、在哪里、和什么相连”，不回答“今天随机练哪题”。完整是覆盖边界完整，不是全部发布。

## 2. 数据文件

- `content/atlas/v0.1/nodes.json`
- `content/atlas/v0.1/edges.json`

节点字段：`id`、`label`、`band`、`layer`、`track`、`status`、`prerequisites`、`released_entry`、`review_evidence`。

边字段：`id`、`from`、`to`、`type`。`type` 只允许：

```text
prerequisite, derives, inverse, representation, verifies, transfers
```

状态只允许：

```text
released, contracted, mapped
```

`mapped` 的 `released_entry` 必须为 `null`。

## 3. 必须存在的根节点

```text
foundation.number-representation
facts.complements-10-20-100
facts.products-1-19
facts.squares-cubes-powers
representation.fraction-decimal-percent-repeating
skills.roots
skills.reduce-fractions
skills.common-denominator
formula.perfect-square
formula.difference-of-squares
formula.cube-identities
reasoning.estimation-interval
reasoning.last-digit-parity-factor
grade7.rational-numbers
future.exponents
future.logarithms
future.inequalities
future.geometry-models
```

未来指数、对数、不等式、几何模型首次上线状态为 `mapped`，不能出现假入口。

## 4. 层级

`layer` 只允许：

```text
representation, fact, relation-family, strategy,
formula, estimate-verify, transfer
```

`track` 只允许 `fact_memory`、`calculation_skill`、`atlas_only`。

## 5. 图约束

- 节点 ID 和边 ID 全局唯一。
- 边端点必须存在。
- 禁止自环。
- `prerequisite` 子图必须无环。
- `inverse` 必须有语义对称关系；校验器检查成对端点。
- 浏览、筛选、展开节点不写学习者状态。

## 6. 首次上线呈现

移动端为分层列表加局部关系链；H5/PC 可以增强为宽布局，但读取同一数据。筛选项固定为：

```text
基础事实 / 运算关系 / 策略与检验 / 迁移方向
已发布 / 已契约 / 已映射
```

只有 `released` 且存在合法 `released_entry` 的节点可以进入练习或解释。

## 7. 验收

```bash
npm run check:atlas
node --test test/atlas.test.js test/atlas-page.test.js
```

验收必须独立检查根节点覆盖、状态、端点、环、入口和不写进度。
