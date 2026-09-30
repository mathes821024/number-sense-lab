# 学习者档案与 state v3

状态：待审阅。本文不是已冻结契约。通过审阅并 Freeze 之前，不实现。

本文回答档案放在哪里、错题如何从现有状态推导、以及 v2 记录如何升级且不丢历史。调度天数、掌握判定和 A4 的原列表都不在这里重写。

Backend Architect 的结论：本阶段仍然不要后端。`learner_id` 不是引入服务器的理由。

# 1. 设备与学习者

```text
当前客户端的本地存储
        └── 一份 state
              └── 一个 active learner
                    └── relations / sessions / activeSession / prefs
```

设备或客户端是存储边界。`learner_id` 是这份档案的主键。二者不相等。

本阶段 `learners` 里可以只有一个键。模型允许多个键，产品不提供切换。读和写都只碰 `active_learner_id` 指向的那一个。

不保存平台用户标识。以后的绑定若被单独批准，发生在后端，形状只作备忘，本阶段不建字段：

```text
learner_id  ↔  wechat openid | douyin openid | alipay user id
```

# 2. state v3

存储键保持 `nsl-v01-state`。换键会把旧记录留在读不到的地方。

```text
{
  version: 3,
  active_learner_id: "<uuid>",
  learners: {
    "<uuid>": {
      profile: { learner_id, created_on },
      relations: {},
      sessions: [],
      activeSession: null,
      prefs: { sound: true }
    }
  }
}
```

`created_on` 是客户端传入的本地日期 `YYYY-MM-DD`。Core 不读时钟。

`profile` 没有姓名、头像和平台 id。`lastResult` 若 v2 里已有，原样放进该学习者，不重算。

关系的形状保持 v2：`status`、`attempts`、`schedule`。不把错题标志、错次、钩子正文或平台 id 写进关系。

新设备的空状态直接是 version 3，并带一个新的 `learner_id`。不要先写成 version 2 再升级。

# 3. v2 → v3

顺序：

1. 读到的 version 1 先按已冻结的 v0.2A 规则变成 version 2。不重算已经写下的 mastery。
2. version 2 再包进 version 3。生成一次 `learner_id`，把 `relations`、`sessions`、`activeSession`、`prefs`、`lastResult` 移入该学习者。
3. 移入后，顶层不再保留一份平行的 `relations`。
4. 已经是合法 version 3 的档案：保持原来的 `learner_id`，不重新生成，也不因为某条关系缺少 `schedule` 而换人。
5. JSON 无法解析，或 version 不是 1、2、3：按现在的失败方式交回空状态，并且不覆盖存储里的原文。

升级不截断 `attempts`，不改 `status`，不重投影已经合法的 `schedule`，不重建 `activeSession.queue`。

`learner_id` 由 Adapter 生成后传给 Core。Core 不调用 `crypto`、`localStorage`、小程序存储或网络。

# 4. 错题如何推导

对一条关系，只看已有字段：

| 判断 | 条件 |
| --- | --- |
| 历史错题 | `attempts` 里至少有一次 `correct === false` |
| 当前错题 | 是历史错题，且 `status` 为 `learning` 或 `shaky` |
| 已恢复 | 是历史错题，且 `status` 为 `stable` |
| 不是错题 | 没有答错记录。含未练，以及只有答对的 `learning` |

空提交不成行，因此也不会进入错题。值对但还没约成最简同样不成行：不追加 `attempts`，不改 `status`，不改 `schedule`。只有 `correct` 和 `incorrect` 写入作答。这沿用现有判题边界，不另造错题状态。

当前错题仍用上面的谓词，并且在选题页里默认勾选。`listUnstableIds` 本身不改，它不再决定纸上有哪些题。纸上只出现勾上的、已经练过的关系。

# 5. 错题练习如何复用调度

调度决定系统什么时候主动出示一条关系。它不禁止学习者从错题本主动练习当前错题。不因此新写第二套间隔。

增加选题来源 `mistake_book`。它不是第四个训练域。

步骤：

1. 从目录中留下当前错题。未练和已恢复的 `stable` 不进入。
2. 分成两组：按现有规则已到期的，以及尚未到期的。没有 `schedule` 的 `learning` 或 `shaky`，继续视为到期。
3. 先排已到期组，再排尚未到期组。组内仍用现有顺序，多个域仍交错。
4. 没有当前错题时，队列为空。不使用「从 stable 开始」的回退。

今日训练和专项不传这个来源。它们仍不把未到期的关系提前抽进系统主动队列。

主动练到一条尚未到期的当前错题时，沿用已有更新，不复制一份：

- 答对：不推进间隔，保留原来的 `due_day`。
- 答错：按已有答错规则重排。

本节内隔 2 题再现、最多一次，仍在 session 上，不写入 `schedule`。

# 6. 存储

H5 继续用现在的 localStorage Adapter。微信、抖音、支付宝以后各写自己的 Storage Adapter，读写同一份 version 3 含义。Core 不调用这些 API。

以当前 75 条和每天一小段的体量，localStorage 够用。出现下面任一情况再单独评估 IndexedDB，本阶段不引入：

- 单份档案序列化后接近本地存储配额的明显风险
- 需要按关系或日期做索引查询，而不再是整份读入

不引入 SQLite、后端数据库或同步队列。

# 7. 什么时候才需要后端

下面任何一件发生，才重新讨论后端。多几族课程、错题本、本地 `learner_id`、打印和记忆钩子都不是理由。

- 换设备后还要找回同一份档案
- H5 与微信要共用一个学习者的进度
- 家长在另一台设备上看孩子的记录
- 多端同步
- 清除本地数据之后档案仍必须还在

在那之前，不设计账号表、绑定表或同步协议。

# 8. 内容扩展

错题谓词和调度键都是关系 id，不是写死的三个域名。新的可训练关系写入目录和该学习者的 `relations` 后，自动进入同一套错题视图。

内容条目上已有 `hook`、`pattern`、`frames`。以后若增加视觉链、变换步骤、相关关系或合理性检查，它们仍留在内容层，反馈时按 id 读取。学习者档案不快照这些正文。

# 9. 实现前不得做的事

- 不把 `learner_id` 显示给学生，不要求填写名字
- 不把 openid 写入本地档案
- 不把错题列表持久化成第二份数据
- 不改 v0.2A 的到期阶梯和恢复边界。A4 不再自动印出全部不稳定关系，改为同一选题页。
- 在本文 Freeze 之前不实现。三处原契约修订已经写入，见产品文档第 7 节。

# 10. 长期约束：升级不能丢学习历史

从现在起，学习状态按版本演进。可以改结构，不能把「清空本地数据、重新开始」当成正常升级。

```text
state v1 → migrate_v1_to_v2 → state v2 → migrate_v2_to_v3 → state v3 → …
```

不写一个从任意旧结构猜到最新结构的大函数。每一跳只认识相邻的两个版本。

- 每份状态带 `version`。
- 已存在且合法的 mastery、`attempts`、`sessions`、`schedule`、`activeSession` 原样保留。
- 新字段可以补默认值。旧字段只有明确废弃时才迁走。
- `learner_id` 一旦生成，以后的升级不得重新生成。
- 迁移必须有自动测试。
- 迁移成功之后才写回。失败时不覆盖原来的存储。读不懂或损坏、无法恢复的原文，仍按现在的失败方式处理，并且不把空档案写回去盖住它。
- 这条对 H5、微信、抖音、支付宝同一适用。Adapter 可以不同，迁移含义相同。

关系 id 是数据主键，不是展示名。题干、学生看见的句子、Memory Hook 可以改。id 一旦进入正式可训练内容，就尽量不改。把 `fraction-1-8` 改成另一个 id，会切断这条关系上已有的作答、掌握、到期日和错题历史。需要改含义时，新增 id，并写明旧 id 如何迁到新 id；不靠静默换名。
