---
entity: element-declaration
identity: web
kind: element
parent: interaction-surfaces
title: Web
definition: Web 是息壤在浏览器中的可视化交互界面，以经 Xirang 改造的 LikeC4 为技术支撑，与 CLI 并列作为 Interaction Surface，向用户呈现 Semantic Model、active Candidate 与 active Changes 的层级浏览与差异审查。它独立建模以承接面向用户的浏览编排语义；不包含 CLI 的配置维护与确定性操作，不构成规范性语义来源，不负责规范语义持久化、Candidate promotion 与 Change Closure。
---

## MODIFIED Requirements

### Requirement: 提供三维独立控制

Web SHALL 在单一 Browser route 中以持久可见且相互独立的 View Selection、Change Selection 与 Presentation Mode 控件形成当前浏览状态；View Selection SHALL 只选择 Model 或一个 Authored View，Change Selection SHALL 为无 Change、一个活动 Change 或 active Candidate（以 reserved identifier `candidate` 表示）；Presentation Mode SHALL 在选中活动 Change 时提供 `complete`、`complete-with-diff` 与 `diff-only`，在选中 Candidate 时仅提供 `complete` 与 `diff-only`，无 Change 与 Candidate 时锁定为 `complete`。

#### Scenario: 三维独立切换

- **WHEN** 用户改变 View Selection、Change Selection 或 Presentation Mode
- **THEN** 另外两个维度的选择保持不变
- **AND** 新的组合状态立即生成对应 projection

#### Scenario: Candidate 不提供 complete-with-diff

- **WHEN** Change Selection 为 Candidate
- **THEN** Presentation Mode 控件只列出 `complete` 与 `diff-only`
- **AND** `complete-with-diff` 不可选

### Requirement: 首页提供 Candidate 与活动 Change 快速入口

Web 首页 SHALL 为 active Candidate（若存在）与每个活动 Change 提供快速入口卡片；Candidate 卡片 SHALL 以 `change=candidate` 状态打开单一 route，并省略 `mode`；活动 Change 卡片 SHALL 以 `change=<name>&mode=diff-only` 状态打开单一 route；活动 Change SHALL NOT 因首页入口而形成独立 View source。

#### Scenario: 点击 Candidate 卡片

- **WHEN** 用户在首页点击 Candidate 入口卡片
- **THEN** Browser 以 `change=candidate` 状态打开，URL 不含 `mode`
- **AND** Change Selection 显示 Candidate，Mode 为 `complete`

#### Scenario: 点击活动 Change 卡片

- **WHEN** 用户在首页点击一个活动 Change 卡片
- **THEN** Browser 以 `change=<name>&mode=diff-only` 状态打开
- **AND** View Selection 保持 Model View

### Requirement: 呈现 Candidate 目标与差异

Web SHALL 在 active Candidate 存在时，通过 Change Selection 的 `candidate` 选项提供对 Candidate 目标模型与语义差异的浏览；Candidate 选中时 SHALL 仅支持 `complete` 与 `diff-only`，默认为 `complete`。`complete` projection SHALL 使用 candidate-only target sources 且不叠加 diff overlay；`diff-only` projection SHALL 使用 formal+candidate union sources，仅投影 changed elements 与必要上下文，并保留 REMOVED ghosts。当请求携带 `change=candidate` 且 `mode=complete-with-diff` 时，Web SHALL 将 Mode 收敛为 `complete`。

#### Scenario: 浏览 Candidate 目标模型

- **WHEN** 用户选择 `change=candidate` 或 `change=candidate&mode=complete`
- **THEN** Browser 呈现 Candidate 目标模型，无差异标记

#### Scenario: Diff-only 聚焦 Candidate 差异

- **WHEN** 用户选择 `change=candidate&mode=diff-only`
- **THEN** Browser 仅投影 changed elements、必要 ancestors 与 changed relationship endpoints
- **AND** REMOVED elements 以 ghost 保留

#### Scenario: 非法 Candidate complete-with-diff 收敛

- **WHEN** 用户打开 `change=candidate&mode=complete-with-diff`
- **THEN** Browser 将 Mode 收敛为 `complete`
- **AND** 呈现 Candidate 目标模型且无差异标记
