# Grade 7 Rational Skills Contract

状态：`FROZEN FOR FIRST-LAUNCH BUILD`

## 1. 首发技能 ID

```text
g7-rational-sign-opposite-absolute
g7-rational-compare
g7-integer-add-sub
g7-integer-mul-div
g7-fraction-add-sub
g7-fraction-mul-div
g7-rational-power
g7-rational-mixed
```

每个技能提供 `foundation`、`standard`、`transfer`；默认日常只用前两带。

## 2. 精确有理数

Core 使用 `{ numerator, denominator }`：

- 分母为正；
- gcd 为 1；
- 零为 `0/1`；
- 所有中间整数是安全整数；
- 除数不为零；
- 不用浮点数决定对错；
- 幂指数首发只允许整数 `0..6`。

## 3. 技能边界

### `g7-rational-sign-opposite-absolute`

- foundation：辨认正负、相反数、`|a|`，`|a| ≤ 30`。
- standard：双层绝对值或相反数组合，最多两步。
- transfer：结合数轴解释距离，不引入字母参数。

### `g7-rational-compare`

- foundation：整数和同分母分数比较。
- standard：异分母、正负混合比较，分母不超过 20。
- transfer：用区间、离零距离和估算说明，不使用小数近似判题。

### `g7-integer-add-sub`

- foundation：一步，操作数绝对值不超过 20。
- standard：两步或含括号，操作数绝对值不超过 100。
- transfer：要求结构解释或估算检查，最多三项。

### `g7-integer-mul-div`

- foundation：一步，乘法因子绝对值不超过 12；除法整除。
- standard：两步符号运算，结果绝对值不超过 400。
- transfer：因数重组、奇偶或尾数检查。

### `g7-fraction-add-sub`

- foundation：同分母或一方为整数，分母不超过 12。
- standard：异分母，分母集合 `2,3,4,5,6,8,9,10,12,15,20`。
- transfer：先估符号/区间再通分；结果可为假分数。

### `g7-fraction-mul-div`

- foundation：可直接约分，分子/分母绝对值不超过 12。
- standard：正负分数与整数混合，原始分母不超过 20。
- transfer：先约分后相乘、倒数与符号检查。

### `g7-rational-power`

- foundation：正负整数平方、立方，明确括号。
- standard：绝对值与乘方组合，指数 `0..4`。
- transfer：必须包含 `(-3)^2 = 9` 与 `-3^2 = -9` 的区别。

### `g7-rational-mixed`

- foundation：两种运算、最多三项。
- standard：含一层括号与乘方，最多四步。
- transfer：结构选择和估算检查，不引入字母式或复杂分式。

## 4. 强制语义样例

```text
|-7| = 7
-7 + 12 = 5
8 - (-3) = 11
(-4) × (-6) = 24
(-3/4) + (5/6) = 1/12
(-2/3) ÷ (4/9) = -3/2
(-3)^2 = 9
-3^2 = -9
```

这些样例必须出现在自动测试中，不要求作为固定题进入每日队列。

## 5. 输入和判题

- `signed_integer`：整体正负号 + 整数。
- `signed_fraction_fields`：整体正负号 + 分子框 + 分母框；分母不接受负号。
- 空、仅 `-`、空分子/分母、分母零：不记录尝试。
- 等值但未最简：`needs_simplification`，不记录掌握。
- `0/n` 判为零并规范为 `0/1`。
- H5 支持物理 `-`；所有小程序仅靠屏幕 `±` 也可完成。

## 6. 生成确定性

同一 `seed + skill_id + band + index` 必须产生完全相同的题、答案、解释和 checksum。Core 禁止 `Math.random()`。同一 10 题会话不得重复 `exercise_id`。

## 7. 三种工具

每题提供 `direct`、`structure`、`estimate`；不适用时写 `available: false`，不得编造。讲解不写入学习者状态。

## 8. 验收

```bash
node --test test/rational.test.js
node --test test/grade7-rational-generator.test.js
node --test test/signed-answer.test.js
node --test test/skill-session.test.js test/migration-v4.test.js
npm test
```

每个技能/难度带至少运行 1,000 组生成不变量检查。

## 9. 停止条件

- 数学内容歧义或错误
- 需要浮点数容差判定精确答案
- 无法保留 v3 历史或活跃会话
- `skill_id` 与 `relation_id` 混用
