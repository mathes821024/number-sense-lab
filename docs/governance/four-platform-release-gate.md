# Four-Platform Release Gate

状态：`FROZEN FOR FIRST-LAUNCH BUILD`

本文定义 H5、微信小程序、抖音小程序、支付宝小程序的统一验收证据和发布边界。能构建不等于已经上线。

## 1. 五种状态

平台状态只能使用下列值，并按证据逐级推进：

1. `BUILD_VERIFIED`：在记录的提交上可重复生成构建产物；
2. `TOOL_VERIFIED`：对应开发者工具打开产物并走完统一关键路径；
3. `DEVICE_ACCEPTED`：Owner/家庭在真实设备完成体验验收；
4. `SUBMITTED`：Owner 已授权并完成平台提交；
5. `PUBLIC`：审核通过且公众可访问。

缺少前一级证据时不得宣称后一级。`NOT_RUN`、`FAILED`、`BLOCKED` 是检查结果，不是发布状态。

## 2. 平台记录

每个平台必须保存以下字段：

```text
status, commit, artifact, build_command,
tool_evidence, device_evidence, submission_id,
public_url_or_version, known_limits, rollback
```

- `commit` 必须为 40 位 Git SHA；构建产物记录 SHA-256。
- 没有证据的字段明确写 `NOT_RUN`，不得写空白暗示通过。
- `submission_id` 和 `public_url_or_version` 只有 Owner 授权发布后才能填写。
- `rollback` 指向上一份不可变产物/公开版本和恢复步骤，不保存账号、密钥或签名材料。

## 3. 同一 Core 与平台退路

| 能力 | H5 | 微信 | 抖音 | 支付宝 |
| --- | --- | --- | --- | --- |
| 存储 | 浏览器适配 | 微信适配 | `tt` 适配 | `my` 适配 |
| 音效失败 | 静音继续 | 静音继续 | 静音继续 | 静音继续 |
| 安全区缺失/异常 | `0px` | `0px` | `0px` | `0px` |
| 生命周期 | 取消待执行反馈，不重复记录 | 同左 | 同左 | 同左 |
| 物理键盘 | 增强 | 不依赖 | 不依赖 | 不依赖 |
| 运行时 SVG | 不作为必要条件 | PNG 退路 | PNG 退路 | PNG 退路 |
| WebP 不可用 | PNG | PNG | PNG | PNG |
| 减少动态信号缺失 | 低动态 | 低动态 | 低动态 | 低动态 |
| 打印 | 系统打印 | 预览/保存/分享 | 预览/保存/分享 | 预览/保存/分享 |
| 分享/导出不可用 | 不阻断学习 | 明示不可用 | 明示不可用 | 明示不可用 |

四端使用同一事实目录、技能生成器、精确判题、学习者状态 v4、共用页面和主题语义。平台全局对象只允许出现在 `app/platform/`。

## 4. 构建与产物

```text
H5       npm run build:h5       → dist/h5
微信     npm run build:weapp     → dist/weapp
抖音     npm run build:tt        → dist/tt
支付宝   npm run build:alipay    → dist/alipay
```

当前合同冻结时，H5/微信已有工程基线但必须在首发提交上重新取证；抖音/支付宝是待实现目标。旧截图、旧构建和口头“跑通”不能替代本次证据。

合同冻结基线复跑（2026-10-12）：

| 端 | 提交 | 环境 | 命令 | 产物 | 结果 |
| --- | --- | --- | --- | --- | --- |
| H5 | `9cac8de214c96ab58326311fc5ab62fc15e5b915` | Node `v22.23.1` / npm `10.9.8` / Taro `4.3.0` | `npm run build:h5` | `dist/h5`，约 2036 KiB | `BUILD_VERIFIED`；有 321 KiB 入口体积警告 |
| 微信 | `9cac8de214c96ab58326311fc5ab62fc15e5b915` | Node `v22.23.1` / npm `10.9.8` / Taro `4.3.0` | `npm run build:weapp` | `dist/weapp`，约 1840 KiB | `BUILD_VERIFIED` |
| 抖音 | 同上 | 插件尚未加入 | `npm run build:tt` | `NOT_RUN` | `NOT_RUN` |
| 支付宝 | 同上 | 插件尚未加入 | `npm run build:alipay` | `NOT_RUN` | `NOT_RUN` |

以上只证明构建。开发者工具版本、模拟器/设备、真机 OS 和 S01–S12 结果仍为 `NOT_RUN`，不得升级为 `TOOL_VERIFIED` 或 `DEVICE_ACCEPTED`。

### 4.1 Math Exploration Desk 首发候选取证（2026-10-12）

本节记录视觉与体验优化分支的交付候选，不替代 Owner 真机验收，也不构成合并、提审或公开发布许可。

| 端 | 提交 | 环境 | 产物与指纹 | 当前证据 | 未验证 |
| --- | --- | --- | --- | --- | --- |
| H5 | `9e5091d672020f70345d890ca4a4e64dccfe1d5b` | Node `v22.23.1` / npm `10.9.8` / Taro `4.3.0` | `dist/h5`，约 3472 KiB；tree SHA-256 `dca408182defe4feb731f5996985f45fe6b7bd587af9313e97a15a780d0c1bb1` | `BUILD_VERIFIED`；320/375/390/430 px 浏览器初验无横向溢出，控制台 0 error，业务资源 0×404；昵称刷新保留、产品介绍、知识路径、错题空态与训练区无吉祥物已检查 | 200% 缩放、键盘全路径、正式读屏与真实移动设备仍为 `NOT_RUN` |
| 微信 | `9e5091d672020f70345d890ca4a4e64dccfe1d5b` | 同上 | `dist/weapp`，51 文件 / 2058419 bytes（1.96 MB）；tree SHA-256 `7715f9671061e22411a6ae10224f5c0d57855a7290d952a2731028625c36b031` | `BUILD_VERIFIED`；包体门禁通过 | 微信开发者工具、模拟器自动化与真机均为 `NOT_RUN` |
| 抖音 | 同上 | 平台适配尚未进入本里程碑 | `NOT_RUN` | `NOT_RUN` | 构建、开发者工具与真机均未验证 |
| 支付宝 | 同上 | 平台适配尚未进入本里程碑 | `NOT_RUN` | `NOT_RUN` | 构建、开发者工具与真机均未验证 |

本次共享层回归为 `422/422 PASS`，Knowledge Atlas 为 `24 nodes / 34 edges PASS`。H5 仍有现存体积告警，微信 `common.js` 仍有现存体积告警；二者不是本次视觉改造新增的学习逻辑失败。

## 5. 统一场景

四端使用相同场景编号：

```text
S01 全新打开并创建本地学习者
S02 现有 v3 历史迁移到 v4
S03 每日事实练习：答对与答错
S04 七年级负整数答案
S05 七年级带符号分数与约分提示
S06 答对 → 看原理 → 三工具 → 继续
S07 答错 → 三工具 → 下一题 → 稍后重现
S08 暂停/后台/恢复，无重复记录
S09 知识地图：仅映射节点与已发布入口
S10 进度、错题、打印/预览语义
S11 安全区、窄屏、大字/缩放退路
S12 离线重开，保留本地包与数据
```

自动化、开发者工具和真实设备分别记录。任何一类不得冒充另一类。

## 6. 角色与发布权

- Grok Bot：主要实现与构建证据；
- WorkBuddy：H5、微信工具与交付；
- Doubao：抖音适配支持和视觉资产工程；
- Owner 指定执行人：支付宝工具验证；
- ChatGPT：跨端 Architecture Gate（架构门）和里程碑 Review；
- Owner：真实体验、提交、合并和发布决定。

## 7. 停止条件

- 某平台要求复制 Core 或改变学习语义；
- 本地数据迁移不能保持历史；
- 安全区、输入或读屏退路不能完成同一学习路径；
- 需要账号、App ID、签名、审核承诺、付费或公开发布而未获 Owner 授权；
- 只能以构建/截图证据宣称真机或公开状态。
