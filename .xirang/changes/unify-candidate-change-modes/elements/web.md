---
entity: element-declaration
identity: web
operation: MODIFIED
kind: element
parent: interaction-surfaces
title: Web
definition: Web 是息壤在浏览器中的可视化交互界面，以经 Xirang 改造的 LikeC4 为技术支撑，与 CLI 并列作为 Interaction Surface，向用户呈现 Semantic Model、active Candidate 与 active Changes 的层级浏览与差异审查。它独立建模以承接面向用户的浏览编排语义；不包含 CLI 的配置维护与确定性操作，不构成规范性语义来源，不负责规范语义持久化、Candidate promotion 与 Change Closure。
---

## MODIFIED Requirements

### Requirement: 提供三维独立控制

Web SHALL 在单一 Browser route 中以持久可见且相互独立的 View Selection、Change Selection 与 Presentation Mode 控件形成当前浏览状态；View Selection SHALL 只选择 Model 或一个 Authored View，Change Selection SHALL 为无 Change、一个活动 Change 或 active Candidate（以 reserved identifier `candidate` 表示），Presentation Mode SHALL 在选中 Change 或 Candidate 时提供 `complete`、`complete-with-diff` 与 `diff-only`，无 Change 与 Candidate 时锁定为 `complete`。

#### Scenario: 三维独立切换

- **WHEN** 用户改变 View Selection、Change Selection 或 Presentation Mode
- **THEN** 另外两个维度的选择保持不变
- **AND** 新的组合状态立即生成对应 projection

### Requirement: 首页提供 Candidate 与活动 Change 快速入口

Web 首页 SHALL 为 active Candidate（若存在）与每个活动 Change 提供快速入口卡片；Candidate 卡片 SHALL 以 `change=candidate&mode=complete-with-diff` 状态打开单一 route；活动 Change 卡片 SHALL 以 `change=<name>&mode=diff-only` 状态打开单一 route；活动 Change SHALL NOT 因首页入口而形成独立 View source。

#### Scenario: 点击 Candidate 卡片

- **WHEN** 用户在首页点击 Candidate 入口卡片
- **THEN** Browser 以 `change=candidate&mode=complete-with-diff` 状态打开
- **AND** Change Selection 显示 Candidate，Mode 为 `complete-with-diff`

#### Scenario: 点击活动 Change 卡片

- **WHEN** 用户在首页点击一个活动 Change 卡片
- **THEN** Browser 以 `change=<name>&mode=diff-only` 状态打开
- **AND** View Selection 保持 Model View

### Requirement: 呈现 Candidate 目标与差异

Web SHALL 在 active Candidate 存在时，通过 Change Selection 的 `candidate` 选项提供对 Candidate 目标模型与语义差异的浏览；Candidate 选中时 SHALL 支持与活动 Change 相同的三态 Presentation Mode，默认为 `complete-with-diff`；Candidate 的 complete-with-diff projection SHALL 使用 candidate-only target sources 并通过 diff overlay 叠加差异标记，diff-only projection SHALL 使用 formal+candidate union sources 并仅投影 changed elements 与必要上下文。

#### Scenario: 浏览 Candidate 目标模型

- **WHEN** 用户选择 `change=candidate&mode=complete`
- **THEN** Browser 呈现 Candidate 目标模型，无差异标记

#### Scenario: 审查 Candidate 差异

- **WHEN** 用户选择 `change=candidate&mode=complete-with-diff`
- **THEN** Browser 呈现 Candidate 目标模型并在可见节点上叠加 ADDED/MODIFIED/REMOVED 差异标记

#### Scenario: Diff-only 聚焦 Candidate 差异

- **WHEN** 用户选择 `change=candidate&mode=diff-only`
- **THEN** Browser 仅投影 changed elements、必要 ancestors 与 changed relationship endpoints

### Requirement: 呈现 Change 目标与差异

Web SHALL 将当前 Semantic Model、一个可选活动 Change 与当前 View Selection 确定性组合，并提供 `complete`、`complete-with-diff` 与 `diff-only` 三种 Presentation Mode；系统 SHALL NOT 为每个 Change 创建独立可选 View source。`complete` 与 `complete-with-diff` projection SHALL 使用 change-only target sources，`diff-only` projection SHALL 使用 formal+change union sources；REMOVED elements SHALL 仅在 `diff-only` 中以 ghost 保留。

#### Scenario: Complete 模式

- **WHEN** 用户使用 `complete`
- **THEN** 无 Change 时呈现当前模型，有 Change 时呈现 after model
- **AND** 不添加 diff overlay

#### Scenario: Complete with diff 模式

- **WHEN** 用户使用 `complete-with-diff`
- **THEN** Browser 呈现 Change target projection
- **AND** 可见节点与边叠加 ADDED、MODIFIED 与 REMOVED 差异标记
- **AND** REMOVED elements 不属于 target projection，不在该模式中呈现

#### Scenario: Diff only 模式

- **WHEN** 用户使用 `diff-only`
- **THEN** Browser 仅保留 changed objects、必要 ancestors、Relationship endpoints 与 removed ghosts
- **AND** unchanged context 不计入 diff counts

### Requirement: 支持分层语义浏览

Web SHALL 在单一 route 中使用 Model 或 Authored View Selection，并可结合一个活动 Change 或 active Candidate，在各自适用目标模型内呈现不同抽象层级的 Elements、Element Contracts 与 Relationships；普通 Browser 的当前层 SHALL 由 View Selection 边界、focus、direct children、已就地展开后代与可映射到不同可见 endpoints 的 Relationships 共同确定。

#### Scenario: 下钻 Model 或 Authored View

- **WHEN** 用户在 Model 或 Authored View Selection 中进入具有 children 的 Element
- **THEN** Browser 保持当前 View Selection，更新 focus、runtime projection、breadcrumb 与导航历史

#### Scenario: 浏览 Element 详情

- **WHEN** 用户选择没有 children 的 Element
- **THEN** Browser 展示其声明、Contract、Relationships 与 refinement context
- **AND** 不创建新的 View identity 或空 route

### Requirement: focus 失效时确定性回退

Semantic Model、Candidate 或 Semantic Delta 刷新使当前 focus 不再存在时，Web SHALL 沿刷新前的 ancestor 链回退到最近仍存在的 Element，并在没有可用 ancestor 时回退 Project Root。

#### Scenario: Change 更新移除当前 focus

- **WHEN** 用户正在 Change-derived View 中浏览的 Element 被更新后的 Semantic Delta 移除
- **THEN** Browser 选择最近仍存在的 ancestor、更新布局和 breadcrumb，且旧请求不得恢复已移除 focus

#### Scenario: Candidate 更新移除当前 focus

- **WHEN** 用户正在 Candidate 目标模型中浏览的 Element 被更新后的 Candidate 移除
- **THEN** Browser 选择最近仍存在的 Candidate ancestor、更新布局和 breadcrumb，且旧 source 内容不得恢复已移除 focus

## REMOVED Requirements

### Requirement: 只列出真实 Views
