# Grade 7 Rational Skills Contract

状态：`FROZEN FOR FIRST-LAUNCH BUILD`

第 10–13 节记录 Owner 于 2026-10-12 确认的第一阶段题面规则，状态为 `PENDING CONTRACT GATE`。Gate 通过前，这四节不是实现许可。第 1–9 节的技能边界、判题和生成确定性保持原冻结文本，只有第 5 节按本次复审补上「仅 `+` 不记录尝试」。复审通过后，第 5 节的这一句、第 10–13 节，以及 UI、UX 里的嵌入式空位例外，统一并入冻结文本，去掉 `PENDING CONTRACT GATE`。

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
- 空、仅 `-`、仅 `+`、空分子/分母、分母零：不记录尝试。仅有正号、没有数字时，与仅有负号一样，不构成作答。已经写出数字时，显式 `+` 与未写符号一样表示正数，按第 5 节其余规则判题。
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

## 10. 公式优先题面（第一阶段）

状态：`PENDING CONTRACT GATE`。Owner 已确认方向。本节只规定已经在生成的一元题如何呈现，不新增题族。

适用范围只有 `g7-rational-sign-opposite-absolute` 里、`operands.kind === "unary"` 的题：

- `operator === "opposite"`：学生看见的题面是「已知数 + 答案空位 = 0」。空位符号是 `□`。已知数由 `operands.value` 使用与身份题干一致的规范格式生成；不得解析、修改或回写 `prompt`。规范格式与身份题干里的已知数相同：负数带括号。因此 `operands.value` 为 `4/5` 时显示 `4/5 + □ = 0`，为 `-4/5` 时显示 `(-4/5) + □ = 0`。揭晓后的关系把规范答案填进空位；答案为负时加括号，例如 `4/5 + (-4/5) = 0`。这个空位是等式中唯一的可编辑项，布局例外见 `docs/ui/03_ui_spec.md` 第 6 节和 `docs/ux/02_ux_spec.md` 的 Answer Area。
- `operator === "abs"`：学生看见的题面继续是竖线式，与身份题干 `|${值}| = ?` 相同。本阶段不把绝对值改写成和为零的等式。

学生看见的分数仍是分子在上、横线、分母在下。身份题干继续使用已生成的斜线记法。这与现有「存储用斜线、界面用横线」的规则相同。

`signed_fraction_fields` 在七年级等式里呈现为一个项：整体符号、分子、分母连成一组，视觉重量与题干中的已知分数相当，避免答案区盖过等式。具体像素、字号和组件尺寸不在本课程合同中规定。紧凑呈现不改变第 5 节判题：分母不接受负号；空、仅 `-`、仅 `+`、空分子或分母、分母为零不记录尝试；等值未最简仍是 `needs_simplification`。已有小数到分数的两格契约不由本节修改。

三个难度带都不使用字母 `x`。这与本技能已有排除项「字母参数」一致，并明确覆盖 foundation 与 standard，不只 transfer。题面不写成 `0 - 已知数 = □`，也不写成移项或解方程。

## 11. 读屏

读屏读关系，不把题面读成符号名称。`□` 读作「一个数」或「多少」，不读「方框」「空白」「问号」。竖线读作「绝对值」，不读「竖线」。负号读在整个数之前，只读一次。

有理数的读法：

- `0` 读「零」。
- 整数读常用中文数目；负数先读「负」。例如 `6` 读「六」，`-8` 读「负八」。十位用「十、十一、二十」，不读成「一零」「二零」。
- 分数先读分母，再读「分之」，再读分子的绝对值。`4/5` 读「五分之四」。`5/4` 读「四分之五」。`-2/5` 读「负五分之二」。`-5/6` 读「负六分之五」。

句式：

| 题 | 朗读 |
| --- | --- |
| 相反数，已知数为 4/5 | 五分之四加上一个数等于零。 |
| 相反数，已知数为 -2/5 | 负五分之二加上一个数等于零。 |
| 绝对值，内部为 -5/6 | 负六分之五的绝对值等于多少。 |
| 绝对值，内部为 5/6 | 六分之五的绝对值等于多少。 |

上表是规范性例子。实现时由 `operands.value` 推出朗读，不把朗读句子写入 checksum 载荷。

## 12. 身份、显示层与兼容

预览环境已经有人完成七年级练习。尝试、活动会话和错题重现计划都保存了由现行生成器算出的 `exercise_id`。本节因此把「学生看见的式子」和「生成器身份」分开。

现行身份载荷是下面这个对象的 `JSON.stringify`，键顺序固定，然后交给现行 `checksumText`：

```text
skill_id, band, seed, index, prompt, canonical_answer, operands
```

`seed` 以字符串进入载荷。`exercise_id` 的形式是：

```text
gx:{skill_id}:{band}:{index}:{checksum}
```

一元相反数的身份 `prompt` 保持 `${已知数} 的相反数是？`。一元绝对值的身份 `prompt` 保持 `|${值}| = ?`。`operands` 保持 `{ kind: "unary", operator, value: { numerator, denominator } }`。规范答案、解释字符串、载荷字段和字段顺序都保持不变。解释虽然不在 checksum 载荷里，第 6 节仍要求同一坐标再生出同一段解释。

显示层公式和读屏文本是展示时从已生成的 `operands` 与规范答案推出的结果。已知数只取 `operands.value`，不解析 `prompt`。它们不写回 `prompt`，不进入 checksum 载荷，不产生新的 `exercise_id`。训练题干、揭晓后的正确关系、错题再次出现时的题面、读屏名称，都使用这个展示结果。日志、校验和测试里的身份题干仍是原来的 `prompt`。

同一 `seed + skill_id + band + index` 在本阶段之后必须再生出与本阶段之前相同的 `prompt`、`operands`、`canonical_answer`、解释、`checksum` 和 `exercise_id`。由此同时满足：

- `skills.*.attempts[].exercise_id` 仍指向同一道生成题。
- `activeSkillSession.coordinates` 再次生成时得到原来的 `exercise_id`；会话中的 `outcomes` 仍对得上。
- `reappearPlan` 以 `exercise_id` 为键，值里保存坐标。坐标再生后的 `exercise_id` 必须仍等于该键。重现计划因此继续插回原来那一题。
- 不升学习者状态版本，不重写已有尝试，不迁移历史 `exercise_id`。

禁止把 `activeSkillSession` 清空、写成 `null`，或靠丢弃活动会话来回避身份变化。活动会话继续按已保存的坐标恢复。

掌握单位仍是技能及其难度带。`exercise_id` 不是新的永久课程身份；它已经进入尝试、会话结果和重现计划，所以同一坐标不得改出另一个 checksum。`docs/architecture/04_learning_asset_tracks.md` 里「`exercise_id` 不作为跨版本永久课程身份」这句话仍然指掌握单位，不表示可以替换已保存的校验值。

本阶段采用的方案是：从 `operands` 派生显示层。不采用「直接修改 `prompt` 并接受新 checksum」的方案。

若以后必须修改 `prompt`、`canonical_answer` 或 `operands`，才允许另议生成器版本化，并且要同时满足：已经出现在尝试、`outcomes` 或 `reappearPlan` 中的坐标，仍由原版本生成原来的 `exercise_id`；新版本的区分不能塞进现行载荷，否则旧题的 checksum 会变；活动会话保留并继续，不得删除。本阶段不批准这条版本化路径，只把它记为以后的门槛，避免把改 `prompt` 当成无迁移变更。

Gate 通过后的实现必须用现有生成器测试和技能会话测试锁住上述身份不变，并另证相反数显示式与第 11 节的朗读例子。本轮不修改运行时代码。

## 13. 第一阶段非目标

- 不修改 `docs/curriculum/06_v04_content_contract.md` 与 `docs/curriculum/07_v04_relation_spec.md`。14 条半数的题干、`relation_id`、策略和整数答案保持原冻结文本，包括「86 的一半是？」。
- 不把 `÷ 2`、`× 1/2`、`× 0.5` 写入半数题面，也不轮换这 14 条的表述。
- 不新增嵌套绝对值、两次相反数、零的专门题，或其他新题型。第 3 节 standard 的「双层绝对值或相反数组合，最多两步」保持原文，供以后单独审查。本阶段不扩展生成器去填满这句边界。当前已发布生成只产生一元绝对值和一元相反数；第 10 节只覆盖这两种 `operands`。以后若要生成双层绝对值，必须单独审查，并遵守第 12 节的版本化门槛，且不得改写已有一元题的 `prompt`。
- 不改另外七个技能的题干，不改强制语义样例的文本。
- 不把补数题干里的 `?` 改成 `□`。
- 不部署，不改 `.deploy-staging/`。
