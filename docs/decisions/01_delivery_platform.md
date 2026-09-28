# Delivery Platform Decision

状态：交付平台决策，供 Owner 与 ChatGPT Review。

本文不是 Contract Freeze，不是 Technical Architecture，也不是 Build Instruction。它不改写已经通过的 Product Contract 和 UX Contract。

# Decision

v0.1 首发实现：WeChat Mini Program First（微信小程序优先）。

同时保留：Responsive H5 / Web compatibility direction（响应式 H5 / Web 作为后续兼容方向）。

核心原则：

- Product Contract 保持平台中立。
- UX Contract 保持平台中立。
- 首发 Delivery Platform 是微信小程序。
- Responsive H5 / Web 保留为后续兼容运行面。
- 不因为首发平台改变核心训练逻辑。
- 不因为小程序提前增加登录、后端或云同步。

# Why

首发用微信小程序，是为了让当前这个小产品先被真实用起来。

- 目标用户是初中生。微信是他们和家庭已经在用的环境，打开一条练习的门槛低。
- 产品本身是每天 5～10 分钟的短时训练，不需要先安装一个独立 App。
- 家庭、同学和亲友试用时，转发小程序比分发一个安装包更直接。
- 已通过的 UX 以手机上的短路径和一题一屏为主，与小程序的使用方式一致。
- 首发目标是验证学生是否愿意再练、关系是否更稳。小程序足以承载这次验证。

这不是对某个平台的宣传，也不表示其他运行面被否定。

# What Does Not Change

以下已经通过的契约保持不变：

- 三个 MVP 训练域。
- 一题一屏。
- 正确优先于速度。
- 不展示倒计时。
- 不向学生显示原始 response time。
- 不登录。
- 不依赖后端。
- 本地数据优先。
- 不做排行榜。
- 不做 AI、OCR、手写或语音。
- A4 打印仍是产品能力。
- P0 Product Gate 与 U0 UX Gate 的结论不被重写。

PRD 与 UX 规格继续作为平台中立的核心契约。本文只增加首发交付平台，不回头改写那些文档。

# v0.1 Runtime Model

当前建议的运行方式：

```text
Mini Program Client
        ↓
Local Training Logic
        ↓
Local Storage
        ↓
No Backend Required
```

v0.1 不为了「有云服务器」而增加后端。训练逻辑和进度留在小程序客户端本地。没有账号，也没有同步服务。

# Future Extension

这些只是以后可能的方向，不是当前承诺。

v0.2 可以再讨论：

- 可选的后端。
- 可选的云同步。

v0.3 及以后可以再讨论：

- 多设备。
- 家长或老师场景。
- 更完整的账号能力。

每一项都要单独经过决策。本文不批准它们进入 v0.1。

# H5 / Web Position

Responsive H5 / Web 不取消。

它仍是后续兼容方向，以后可以作为：

- 浏览器版本。
- 演示或预览。
- 开源参考实现。
- 小程序之外的后备运行面。

v0.1 的首发实现优先做微信小程序。H5 / Web 不因此被写成已经开工，也不从产品范围里删除。

# Deployment Boundary

微信小程序客户端本身：

- 用微信开发者工具开发。
- 经微信平台审核后发布。

它不是「把小程序部署到云服务器」。

云服务器若在以后出现，可能负责的是：

- API。
- 后端。
- 同步。
- H5。
- 静态资源。
- 运行与运维服务。

v0.1 不要求这些服务器能力。没有后端，小程序仍然要能完成核心训练。

# Role Boundary

- ChatGPT：编排、Gate Review、架构判断。
- Cursor：THINK。负责产品、UX、UI、项目、架构和契约文档。
- Grok Bot：Contract Freeze 之后负责实现。
- WorkBuddy：部署和运维执行，包括云服务器、Nginx、HTTPS、API 部署和运行检查。

WorkBuddy 不修改产品契约或架构契约。当前还没有 Contract Freeze，Grok Bot 不进入实现。

# Architecture Implication

这里只记录后续架构要面对的方向，不决定框架，也不决定代码结构。

Technical Architect 之后需要考虑：

- 小程序工程如何组织。
- 本地存储如何承载训练进度。
- 领域逻辑如何与界面分开，以便以后的 H5 兼容。
- 未来后端的边界放在哪里，以及 v0.1 如何保持没有后端。
- 内容数据如何表示。
- 核心训练如何被测试。

这些是后续架构阶段的问题。本文不回答它们。

# Status

本文是 Delivery Platform Decision。

它不是 Contract Freeze。
它不是 Technical Architecture。
它不是 Build Instruction。
