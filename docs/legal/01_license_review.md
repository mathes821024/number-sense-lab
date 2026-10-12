# Number Sense Lab｜许可证复查

状态：只研究，不改许可证。`LICENSE` 仍是 MIT。本文不是律师意见，也不代替 Owner 的决定。

复查时的 `main`：`60bdb110ec6c6bffa8d900d4f1b7c4cb0426a714`。

公开仓库从第一次提交 `643d8f1`（2026-09-27）起，根目录就是 MIT，版权行写着 `Copyright (c) 2026 mathes821024`。没有 git tag，也没有在文件里另写一份许可证。

## 1. 现在的 MIT 已经允许什么

根目录 `LICENSE` 允许得到副本的人：使用、复制、修改、合并、发布、分发、再许可、出售。条件是保留版权声明和许可声明。软件按「原样」提供，没有担保。

「这份软件及其相关文档」在本仓库里，实际就是当时提交进去的整棵树。代码、`content/`、`docs/` 都在同一份 MIT 下面。没有把教学内容或品牌单独摘出去。

因此，已经拿到某个公开提交的人，可以在遵守 MIT 的前提下，用那一份副本做学习、修改，也可以做成自己的产品并收费。MIT 不授予商标权。名字「Number Sense Lab」「数感训练场」没有在仓库里注册成商标；许可文本本身也不等于把名字送出去。但若没有单独的品牌声明，别人仍可能用那些公开文件里的文字和图形。

## 2. 哪些已经发不回来

已经按 MIT 公开的提交，不能靠以后改 `LICENSE` 把别人手里的权利收回。

至少包括：

- `main` 上从 `643d8f1` 到 `60bdb11` 的全部公开历史。
- 公开分支 `feat/v03-concentrated-build`。该分支根目录仍是同一份 MIT，并且已经包含 `assets/brand/`、`assets/themes/math-lab/` 的吉祥物、图标、装饰，以及 `content/v0.2c/`。

别人已经克隆、分叉或下载的那些提交，继续按 MIT 使用。以后的新提交可以换许可证，只约束你从那次提交起新提供的副本。

`main` 上目前还没有 `assets/`。品牌图在公开的实现分支里，不在当前 `main` 树上。就「别人是否已经能按 MIT 拿到吉祥物」而言，公开分支已经发出去了。

## 3. 仓库里的四层

| 层 | 现在在哪 | 当前许可证事实 |
| --- | --- | --- |
| 代码 | `src/`、`h5/`、`scripts/`、`test/` | 在 MIT 树里 |
| 教学内容 | `content/v0.1/*.json`；课程说明在 `docs/curriculum/`。v0.2C 的 JSON 在公开实现分支的 `content/v0.2c/` | 在 MIT 树里，没有单独的内容许可 |
| 品牌与视觉 | 公开实现分支的 `assets/brand/`、`assets/themes/math-lab/`；视觉规则在 `docs/ui/05_visual_system_v03.md` 与 `docs/ui/07_visual_asset_decomposition.md` | 文件已随 MIT 仓库公开；文档没有另写「保留全部权利」 |
| 名称 | README 与产品文档中的 Number Sense Lab、数感训练场 | 没有单独的商标或品牌许可文件 |

Nunito 若以后随产品分发，遵守它自己的 SIL Open Font License，不因为本仓库换许可证而变成你的字体。

## 4. 三种代码许可证

下面只比较以后的新版本。都不追溯已经发出的 MIT 副本。

### MPL-2.0

文件级弱 copyleft。别人修改了标成 MPL 的文件，并再分发这些文件时，修改后的那些文件要继续以 MPL 提供源码。它可以和别的闭源文件放在同一个产品里。商业使用是允许的。它不授予商标。

适合：代码继续公开、可学习、可修改；不想用 MIT 让人连修改后的引擎文件都闭源带走。它管不住别人用自己的界面和自己的内容做一个类似产品。

### AGPL-3.0

强 copyleft，并且覆盖通过网络提供的修改版。别人改了代码并用网络向用户提供服务时，要向那些用户提供对应源码。商业使用仍然允许。它禁止的不是收费，而是「改完拿去当服务、却不给源码」。

若目标是「未许可就不能拿去运营赚钱」，AGPL 做不到这一点。它比 MPL 更重，和以后的小程序、课程闭源部分也更难拼接。

### BSL-1.1

源码可见，不是 OSI 意义上的开源。常见写法是：允许复制、修改和非生产使用；生产用途由附加授权条款限制；到变更日再转成事先写明的开源许可证。超出附加授权的生产使用需要单独商业许可。

若采用它，README 不能再写 open source，应写成 source-available（源码可见）。

## 5. 品牌、内容和名称分开

代码许可证不要自动盖住这三样。无论代码选 MPL、AGPL 还是 BSL，都可以另外声明：

- 吉祥物、标志、主题插画、装饰：保留全部权利。
- 题目组织、记忆钩子、课程说明：保留全部权利，或改用 CC BY-NC-ND。CC BY-NC-ND 仍允许别人复制该内容，但不能商用、不能改、须署名。它比「保留全部权利」松。
- 产品名和标志：不随代码许可授予。若以后要靠名字防他人使用，那是商标，不是换一行 LICENSE 能完成的。

已经随 MIT 公开的旧文件，这份新声明管不到别人手里的旧副本。新声明只从切换提交起，约束你新提供的那些文件。

## 6. 贡献者

`git shortlog` 里只有两个提交身份：`lixiangyang1024` 与 `mathes821024`。没有第三位外部贡献者。

在接受外部补丁之前先定许可证。若没有贡献条款，以后再把别人的补丁改到另一种许可证会变难。现在还来得及在贡献说明里写清：提交补丁即同意按仓库当时的许可证使用，并且允许维护者把同一份贡献再许可以兼容的方式分发。真的要改到 BSL 或做商业双许可时，再补一份贡献者协议。本文不起草那份协议。

## 7. 从哪里切开

没有 tag，不能说「从 v0.3 起收回」。建议的切点是：Owner 选定方案之后的下一次提交。

- 该提交以前的公开历史：已经是 MIT。
- 该提交起新提供的副本：按新选的代码许可证，加上内容和品牌的单独声明。
- 不改写旧提交里的 `LICENSE`。
- 实现分支若继续公开，切换后的新提交也要带上同一份声明，避免吉祥物只在分支上仍被理解成 MIT。

## 8. 候选，尚未决定

和「代码可以学习，品牌和课程不跟着送掉」最接近、又仍是开源软件的组合是：

- 代码：MPL-2.0
- 吉祥物、标志、主题资产、教学内容：保留全部权利

AGPL 更重，仍允许别人收费。BSL 能把生产使用收成单独授权，但项目就要改口为源码可见，不再称开源。

Owner 还没有选定。本次不修改 `LICENSE`、`package.json` 或 README 的许可陈述。

## 9. 选定之后 README 可以怎么写

下面只是草稿，现在不要放进 README。

若选 MPL 加保留权利：

```text
Source code in src/, h5/, scripts/, and test/ is under the Mozilla Public License 2.0.
See LICENSE.

Brand assets, mascots, themes, and teaching content are not under that license.
All rights in those files are reserved unless a file says otherwise.

The names Number Sense Lab and 数感训练场 are not licensed with the code.
```

若选 BSL：

```text
Source code is source-available under the Business Source License 1.1.
It is not an OSI open-source license.
Production use beyond the Additional Use Grant needs a separate commercial license.
Brand, mascot, theme assets, and teaching content are all rights reserved.
```

## 10. 这次没有做的事

- 没有改 `LICENSE`。
- 没有把历史提交改写成别的许可证。
- 没有判断劳动合同、职务作品或小程序主体。注册主体和版权人不是一回事；那部分不在本仓库里下结论。
