# v0.2A Local Learning Scheduler

状态：待审阅。本文不是已冻结契约。通过审阅并 Freeze 之前，不实现。

本文只回答一件事：在这台设备上，一条关系下一次什么时候再出现。

它不新增课程，不改掌握状态的含义，不改学生看见的句子，不引入账号、后端或云同步。

## 0. 已有事实

v0.1 已经具备，v0.2A 继续使用：

- 掌握状态只有四种：`unpracticed`、`learning`、`stable`、`shaky`。学生看见的对应说法不变，不出现「动摇」。
- 进入 `stable` 的现行规则不变：至少 3 次非慢答对、分布在至少 2 个日期、最近 2 次都答对。一次答对不是掌握。答对但慢不单独推进到 `stable`，也不把 `stable` 降为 `shaky`。
- 本节内错题再出现不变：隔开 2 题，同一条在本节最多再出现 1 次。这是本节内的复习，不是日历间隔。
- 今日训练仍跨三个域交错。专项训练仍只在一个域内。
- 每条作答已经记下日期、对错、是否慢、输入方式和用时。Core 不读时钟，继续使用客户端传入的本地日期 `YYYY-MM-DD`。
- 内容 tier 只决定未练关系的进入顺序，不是复习间隔。
- A4 仍然印当前不稳定的关系（`learning` 与 `shaky`），不改成「今天到期的题」。

## 1. 不持久化的字段

下列字段都能从已有 `attempts` 算出来，或者会和 `attempts` 打架。v0.2A 不另存：

| 建议字段 | 决定 |
| --- | --- |
| `relation_id` | 不放进记录里。它已经是 `relations` 的键 |
| `mastery` | 不新造字段。继续用 `status` |
| `correct_streak` | 由末尾连续答对推出 |
| `wrong_count` | 由答错次数推出 |
| `last_seen_at` / `last_correct_at` / `last_wrong_at` | 不存时刻。用作答里的日期 |
| `recent_attempts` | 不另做一份短日志。`attempts` 就是日志，本版不截断 |
| `distinct_correct_days` | 由非慢答对的日期集合推出 |
| `input_mode` 统计 | 不另做汇总。慢的判断继续只看同一输入方式的历史 |

唯一新增的持久化调度事实是 `schedule`。

## 2. 关系上的调度状态

```text
relations[id] = {
  status,      // 四种掌握状态，含义不变
  attempts,    // 已有作答日志
  schedule     // 未练时为 null
}

schedule = {
  due_day,     // "YYYY-MM-DD"；未练为 null
  bucket,      // "1d" | "2-3d" | "5-7d" | "maintenance"
  reason       // 下面的闭集
}
```

`reason` 只允许：

`first-correct`、`same-day-correct`、`correct-after-wrong`、`correct-new-day`、`became-stable`、`stable-maintenance`、`slow-correct`、`wrong`、`stable-wrong`。

间隔用固定天数，取建议区间的短端，避免再做一个隐藏的随机或公式：

| bucket | 从作答日加上 |
| --- | --- |
| `1d` | 1 天 |
| `2-3d` | 2 天 |
| `5-7d` | 5 天 |
| `maintenance` | 7 天 |

本节内的「隔 2 题再见」不写入 `schedule`。它仍记在本节的 `reappearPlan` 上。

## 3. 调度规则

一天指本地日历日，不是满 24 小时。

阶梯只在「新的一天、答对、且不慢」时前进一步：`1d` → `2-3d` → `5-7d` → `maintenance`。同一天再答对不前进。同日纠错成功也不前进：它只说明刚刚答对，下一次仍要到明天。答对但慢不前进，也不把已经拉长的间隔缩短到比明天更近。

| 事件 | 掌握状态 | `due_day` | bucket | reason |
| --- | --- | --- | --- | --- |
| 从未练过，第一次答对 | 变为 `learning` | 明天 | `1d` | `first-correct` |
| 同一天再次答对，且上一次也是答对 | 不变 | 保持原到期日 | 不变 | `same-day-correct` |
| 同一天答对，且上一次是答错 | 按现有掌握规则更新，不因此进入 `stable` | 明天 | `1d` | `correct-after-wrong` |
| 新的一天答对，仍未进入 `stable` | 保持 `learning` | 今天 + 下一档 | 前进一步 | `correct-new-day` |
| 这一次答对使状态进入 `stable` | 变为 `stable` | 今天 + 5 天 | `5-7d` | `became-stable` |
| 已经是 `stable`，新的一天再答对且不慢 | 保持 `stable` | 今天 + 7 天 | `maintenance` | `stable-maintenance` |
| 答对但慢 | 按原掌握规则，不因此降级 | 若今天已到期，则改为明天；若到期日还在未来，则保持 | 不变 | `slow-correct` |
| `learning` 或未练时答错 | 变为或保持 `learning` | 明天 | `1d` | `wrong` |
| `stable` 时答错 | 变为 `shaky` | 今天 | `1d` | `stable-wrong` |
| 到期日已过仍未练 | 不变 | 不变 | 不变 | 不改 reason；选择时视为已到期 |

补充：

- 答错后，本节内仍按原规则隔 2 题再出现一次。这次再现若答对，用 `correct-after-wrong`：到期日是明天，bucket 仍是 `1d`，不进入 `2-3d` 或更长。这次再现若再错，本节不再插入，明天的队列会优先见到它。
- 同日纠错这条优先于 `slow-correct` 和 `same-day-correct`。就算这次答对偏慢，到期日仍是明天，reason 仍是 `correct-after-wrong`。
- `stable` 答错后变为 `shaky`，阶梯清零。同一天再答对同样用 `correct-after-wrong`：不回到 `stable`，也不恢复原来的 7 天。变回 `stable` 仍须跨天，那时才用 `became-stable`。
- 还没到期就被抽到并答对：不前进阶梯，保留原 `due_day`。答错则按答错规则重排。
- 长时间未见只提高「已到期」的优先级，不把状态改成 `shaky`。缺席不是答错。

## 4. 一节怎么选题

一节的题量、今日训练的跨域交错、专项训练的单域限制，都保持现状。

每个域内部的顺序：

1. `shaky`，且 `due_day` 早于或等于今天。
2. `learning`，已到期，且最后一次答错。
3. `learning`，已到期，最后一次答对。
4. 未练。同组内仍按 tier 从低到高，然后按 id。tier 不表示间隔。
5. `stable` 且已到期。只在前面四类填不满本节时进入。只要还有未稳定或未练的关系，`stable` 让位。

同组内按 `due_day` 从早到晚，再按 tier，再按 id。

今日训练：三个域按现有域顺序轮流取，取满本节。这样不会被一个域的到期题占满。

专项训练：同一套顺序，只看一个域，不轮流。

没有任何到期题、也没有未练题时，本节仍可以开始：取到期日最近的 `stable`。答对且不慢才按维护间隔后推；提前答对不额外加长。

未到期的 `learning` 不提前进入系统主动选出的今日训练或专项。调度决定系统何时主动出示一条关系，不禁止学习者从错题本主动练习当前错题。那次主动练习可以包含尚未到期的当前错题：答对不推进间隔，保留原 `due_day`；答错按答错规则重排。不因此另写一套调度。详见 `docs/product/02_learner_mistake_book.md`。

## 5. 存储边界

```text
客户端传入今天的日期和这次作答
        ↓
Core 更新 status、attempts、schedule，并选出下一节的 id
        ↓
Adapter 把整份状态写进当前平台的本地存储
```

- Core 不调用 `localStorage`、小程序存储或任何网络接口。
- H5 继续用现有浏览器 Adapter。未来微信小程序用自己的 Adapter 存同一份状态。两端不各写一套调度。
- 不新增后端，不新增账号，也不登录。设备、浏览器或小程序是档案存放处。学习档案的内部身份是本地生成的 `learner_id`，不是设备号，也不是平台用户标识。本阶段仍只有一个学习者。字段见 `docs/architecture/01_learner_state_v3.md`。
- 存储键保持 `nsl-v01-state`。不换键，避免旧记录留在旧键里被丢掉。
- `reason` 不展示给学生，也不进入进度页或 A4。

## 6. 从 v0.1 升级

v0.1 的状态是 `version: 1`，关系里只有 `status` 和 `attempts`。升级不得清空历史，也不得重算并覆盖已经写下的 `status`。

可读的 version 1 或 version 2 都要保留。现在的浏览器 Adapter 会把 `version !== 1` 读成空状态；实现时必须先改掉这个门槛，再写入 version 2。读不懂的 JSON 仍按现在的失败方式处理。

迁移时：

- 保留 `attempts`、`status`、`sessions`、`activeSession`、`prefs`。
- 不重建正在进行的一节。这一节做完后，下一节才用新规则选题。
- 还没有作答的关系：`schedule` 为 `null`。
- 已有作答的关系，只根据最后一次作答和已保存的 `status` 补 `schedule`。下表自上而下，命中第一条即停止：

| 已保存状态与最后一次作答 | `due_day` | bucket | reason |
| --- | --- | --- | --- |
| 最后一次答错，状态是 `shaky` | 最后作答日 | `1d` | `stable-wrong` |
| 最后一次答错，状态不是 `shaky` | 最后作答日 + 1 | `1d` | `wrong` |
| 最后一次答对，且同一天更早有答错；状态不是 `stable` | 最后作答日 + 1 | `1d` | `correct-after-wrong` |
| 最后一次答对但慢 | 最后作答日 + 1 | `1d` | `slow-correct` |
| `learning`，非慢答对只出现在 1 个日期 | 最后作答日 + 1 | `1d` | `first-correct` |
| `learning`，非慢答对出现在 2 个日期 | 最后作答日 + 2 | `2-3d` | `correct-new-day` |
| `learning`，非慢答对出现在 3 个及以上日期 | 最后作答日 + 5 | `5-7d` | `correct-new-day` |
| `stable`，最后一次非慢答对 | 最后作答日 + 7 | `maintenance` | `stable-maintenance` |

迁移后把 `version` 写成 `2` 并保存。之后只走第 3 节的规则，不再用这张投影表。

## 7. 验收例子

日期都是客户端传入的本地日期。除单独写明外，都假设不慢、输入方式不变。掌握状态沿用第 0 节的现行规则。

### Case 1：`square-15`（15²）分三天答对

| 日期 | 发生的事 | status | due_day | bucket | reason |
| --- | --- | --- | --- | --- | --- |
| 2026-10-01 | 第一次答对 | `learning` | 2026-10-02 | `1d` | `first-correct` |
| 2026-10-02 | 到期后再答对 | `learning` | 2026-10-04 | `2-3d` | `correct-new-day` |
| 2026-10-04 | 到期后第三次非慢答对，已跨两天以上 | `stable` | 2026-10-09 | `5-7d` | `became-stable` |

2026-10-01 若再答对一次，`due_day` 仍是 2026-10-02，reason 改为 `same-day-correct`。同一天的连对不拉长间隔，也不进入 `stable`。

### Case 2：`fraction-1-8`（1/8）连续两次答错

第一次答错：状态变为 `learning`，本节隔 2 题再出现一次，`due_day` 为明天，bucket `1d`，reason `wrong`。

第二次就是这次再现，又答错：状态保持 `learning`，本节不再插入第三次。`due_day` 仍是明天。

下一次见到它，是下一个本地日期的练习，排在「已到期且最后一次答错」里，先于未练，也先于最后一次答对的 `learning`。

### Case 4：`fraction-1-8`（1/8）同一天先错、隔两题再答对

2026-10-01 第一次答错：状态变为 `learning`，本节隔 2 题再出现，`due_day` 为 2026-10-02，bucket `1d`，reason `wrong`。

同日这次再现答对：状态仍是 `learning`。`due_day` 仍是 2026-10-02，bucket 仍是 `1d`，reason `correct-after-wrong`。不进入 `2-3d`。下一次要到 2026-10-02，并且那天答对且不慢，间隔才前进。

`stable` 答错变成 `shaky` 后，同一天隔两题再答对，用同一条：状态保持 `shaky`，`due_day` 改为明天，bucket `1d`，reason `correct-after-wrong`。不回到 `stable`，也不恢复答错前的维护间隔。

### Case 3：已经 `stable` 的关系，两周后答错

假设 `due_day` 是 14 天前，期间没有作答。状态仍是 `stable`，只是选择时视为逾期维护，不降级。

这一天答错：

- status 变为 `shaky`。
- `due_day` 改为今天，bucket `1d`，reason `stable-wrong`。原来的 7 天间隔作废。
- 本节内隔 2 题再出现一次。
- 今天若再开一节，它排在该域的 `shaky` 组最前。
- 同一天随后答对，使用 Case 4 的 `correct-after-wrong`：状态保持 `shaky`，`due_day` 改为明天，bucket 为 `1d`。不回到 `stable`，也不恢复 7 天。要再次 `stable`，仍须满足第 0 节的跨天规则；那时 reason 才是 `became-stable`，到期日为那天之后的 5 天。

## 8. 契约核对

没有 `CONTRACT_CONFLICT`。

- 产品契约要求跨天、错题再出现、慢答对不降级、稳定后少出现。本文只把「少」写成可解释的天数，没有改这四条原则，也没有冻住产品故意留开的次数门槛。
- 课程契约写明复习间隔是 Technical Design，tier 不是间隔。本文是那份设计。
- 架构契约把调度放在 Core、把存储放在 Adapter，并禁止为本地进度引入后端。本文沿用这个边界。
- 学生可见的掌握说法、错题不立刻重做、A4 的范围，都没有改。
