# v0.4 内容与现有引擎

状态：契约设计，供 Contract Gate 复检。

51 条用现有 relation 记录就能表示。不改判题、掌握、调度算法、错题语义，也不升级 state 版本。

需要扩展 Core 的内容目录登记（domain labels、order、count verification）。这是内容注册变化，不是 Learning Engine 算法变化。登记就在 `src/core/content.js`。只加 JSON、不改这份登记的话，`verifyContentCounts()` 会拒绝未知 domain。

三类变更：

| 类 | v0.4 |
| --- | --- |
| 内容 | 是。加 51 条 relation |
| 内容目录登记 | 是。加已发布的域、显示名、顺序和计数 |
| 学习引擎算法 | 否 |

# 1. 一条 relation 已经有的字段

现有核心记录已经包含：`id`、`domain`、`level`、`tier`、`hook_type`、`prompt`、`canonical_answer`、`answer_type`、`direction`、`families`、`entry_after`、`relation`、`hook`、`pattern.check`、`pattern.family`、`frames`。

v0.4 的 51 条全部落在这些字段里。

| 需要 | 现有能力 | 是否要新结构 |
| --- | --- | --- |
| 整数答案 | `answer_type: integer`，等值判断已接受 `06` 与 `6` | 否 |
| 补数题干 | `prompt` 是普通字符串 | 否。语义靠题干，不靠新题型 |
| 关系族洗牌 | `families` 的 `scaling` | 否。只用在 25 与 125 两组 |
| 进入顺序 | `tier` 1–3，`entry_after` 为空 | 否 |
| 同值不同题 | 不同 `id` 各自掌握 | 否。除 OQ5 明确合并的 5³ 以外，不合并 |
| 相关例 | `pattern.family` 与 `frames` | 否。相关例不是 relation |
| 旧学生进度 | state 里的 `relations` 按 id 存放，缺省表示没练过 | 否。不迁移、不改键 `nsl-v01-state`、不升版本 |

`pow-5-3` 不出现。5³ 只有 `cube-5`。

# 2. 内容目录登记必须改

今天 `src/core/content.js` 把域写死成三个，`verifyContentCounts()` 遇到未知 domain 会抛出 `CONTRACT_CONFLICT`。BUILD 必须扩展这份登记，才能放入新 relation。

要改的是登记，不是学习算法。BUILD 会碰到：

- `DOMAIN_LABELS`
- `DOMAIN_ORDER`
- `FROZEN_COUNTS` 与 `verifyContentCounts()`
- relation 的 domain 类型说明
- 对应的计数测试

登记里只出现当前已发布的域。未发布的域不写进名单，也不出现在目录里。没有域级解锁字段。

五域全部发布时，`DOMAIN_ORDER` 是：

1. `squares`
2. `products`
3. `fraction_decimal`
4. `halves`
5. `complements`
6. `cubes`
7. `powers`
8. `special_products`

分批发布时，仍按这个相对顺序，只保留已发布的域。例如先发布半数，顺序就是前三个旧域，再加 `halves`。

`pickAcrossDomains` 的轮流算法不改。它已经会让名单里的域按顺序交错。

下面这些不改：

- `buildSessionQueue` 的选取规则
- `pickAcrossDomains` 的轮流算法
- `scheduleAfterAttempt`
- 掌握状态转移
- 错题谓词
- 本节内错题再现
- state 版本
- 判题

断言「每日只有三个域」的测试，在新域进入登记后改成「当前已发布的域都参与交错」。这是期望值更新。

# 3. 计数检查不能放宽

旧三域的条数保持不变：

| 域 | 条数 |
| --- | --- |
| `squares` | 32 |
| `products` | 32 |
| `fraction_decimal` | 58 |

完整 v0.4 包再加：

| 域 | 条数 |
| --- | --- |
| `cubes` | 8 |
| `halves` | 14 |
| `complements` | 12 |
| `powers` | 9 |
| `special_products` | 8 |

五域都发布时，总数是 173。

分批发布时，检查的是「当前发布包」，不是把 122 改成「不少于 122」：

- 已发布的新域必须是整域，条数等于上表。
- 未发布的新域条数必须是 0，那些 id 不得出现。
- 旧三域仍是 32、32、58。
- 当前总数 = 122 + 已发布新域的条数之和。
- 未知 domain 仍然拒绝。

完整包是这条规则的一种情况：五个新域都已发布，总数 173。两种检查用同一套规则，不另写一个更松的总数。

# 4. 旧档

已经练过的 id 继续留在原来的 relation 上。新 id 在第一次作答前可以不存在于存档里。坏 JSON 仍不覆盖。不用新域去回写旧的 122 条。
