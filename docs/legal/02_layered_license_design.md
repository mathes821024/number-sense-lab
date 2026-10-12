# Layered License Design

状态：`FROZEN DESIGN — NOT YET CUT OVER`

本文冻结授权边界，供独立授权切换使用；它本身不改变当前 `LICENSE`，也不是法律意见。公开发布前必须经过合格律师复核并由 Owner 确认权利主体。

## 1. 已确认方向

- 软件代码与工程工具：`MPL-2.0`；
- 课程、教学表达、知识地图和产品/教学文案：All Rights Reserved（保留全部权利）；
- 名称、Logo、吉祥物、主题、视觉资产和整体识别：All Rights Reserved + Brand Policy；
- 未来云同步、AI Tutor、教师端、内容管理和分析服务：私有仓库或另行商业授权；
- 第三方材料继续受其原许可证控制。

MPL-2.0 是文件级 Copyleft（文件级互惠）：公开分发修改过的 MPL 文件时需提供这些文件的相应源码，但可与闭源模块组合。不得把“禁止商业使用”的自定义条款称为开源软件。

## 2. 历史权利

- 原始 MIT 根提交：`643d8f1`。
- 历史上已按 MIT 公开的版本，其既有许可不可被未来换证撤回。
- 真正切换时，`docs/legal/03_cutover_record.md` 必须记录最后一个全仓 MIT 提交和第一个分层授权提交的完整 40 位 SHA。
- 冻结合同时的实施基线为本次合同冻结提交的父提交；具体 SHA 在切换分支上取证，不能预填猜测。
- 已公开分支、品牌资产路径和全部已知提交作者必须在切换 Gate 重新由 Git 历史生成并复核。

## 3. 文件分类合同

机器可读的 `license-boundary.json` 必须让每个受控发布文件恰好落入一个分类：

| 分类 | 典型路径 | 权利 |
| --- | --- | --- |
| `software` | `src/`、`app/`、`h5/`、`config/`、`scripts/`、`test/`、工程配置 | MPL-2.0 |
| `protected_content` | `content/`、课程、产品、UX、UI、学习合同和知识地图 | 保留全部权利 |
| `protected_brand` | `assets/`、概念稿、mockup、Logo、吉祥物、主题源资产 | 保留全部权利与品牌权利 |
| `governance` | 治理、架构、决策、计划、发布记录 | 文档保留权利 |
| `third_party` | 明确登记的第三方文件 | 由第三方许可证控制 |
| `legal` | LICENSE、NOTICE、授权政策、贡献规则和边界清单 | 以文件自身为准 |

分类不得“先匹配者获胜”；零匹配或多匹配都必须失败。新顶层目录未分类时，CI 必须失败。

## 4. MPL 明确不包含

MPL 代码授权不自动授予下列内容的复制、改编、再发布、商用、模型训练或品牌使用权：

- 课程文本、例题编排、讲解脚本、记忆钩子和推演步骤；
- Knowledge Atlas（知识地图）的具体节点选择、关系编排与表达；
- Product、UX、UI 和 Curriculum 合同中的具体产品/教学表达；
- Number Sense Lab / 数感训练场名称、Logo、吉祥物、主题、视觉母版和 trade dress（整体商业外观）；
- 未明确加入运行时许可清单的设计源文件。

数学事实、数学概念、数学方法和抽象教学思想本身不主张排他权；受保护的是具体表达、编排、软件、图形和品牌识别。

## 5. 外部贡献

- 软件贡献按 MPL-2.0 inbound（同许可证进入），并采用 DCO sign-off（开发者原创声明签署）。
- 在建立独立书面权利协议前，不接受外部对受保护内容或品牌路径的直接贡献。
- 同时触及软件与受保护路径的 Pull Request（拉取请求）必须拆分或进入权利复核。

## 6. 切换交付物

独立授权切换必须同时产生并一致：

```text
LICENSE                         官方未修改 MPL-2.0 正文
NOTICE.md                       历史 MIT、分层范围和精确切点
CONTENT_LICENSE.md              内容权利与允许的评估查看
BRAND_POLICY.md                 名称、标志、吉祥物和整体识别政策
CONTRIBUTING.md                 MPL inbound、DCO 和受保护路径规则
license-boundary.json           机器可读分类
docs/legal/03_cutover_record.md 精确 SHA、权利主体、复核与回滚记录
```

## 7. Legal Gate（法律门）

以下信息未齐全前，不得对外宣称完成授权切换：

- Owner 提供并确认准确的自然人或法律实体权利主体名称；
- Git 历史核验作者、公开分支、历史品牌/内容资产和第三方材料；
- 合格律师复核 NOTICE、内容许可、品牌政策和贡献规则；
- 构建包检查证明未泄漏设计母版和受保护源资产；
- README 与 package metadata 只说“软件核心是 MPL-2.0 开源”，不暗示整个仓库开源。

若权利主体、第三方权利或文件边界无法确定，状态为 `BLOCKED_LEGAL_REVIEW`，不影响其他功能在未公开分支继续验证，但阻止对外发布。
