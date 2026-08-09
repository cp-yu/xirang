---
entity: element-declaration
identity: change-derived-views
kind: element
parent: derived-views
title: Change-derived Views
definition: Change-derived Views 是由当前 Semantic Model、一个活动 Change 的 Semantic Delta、当前 Model 或 Authored View Selection 与 Presentation Mode 确定性推导的 runtime projections。它们面向单次演进意图呈现目标模型和语义差异，但不形成独立 View source、route 或持久 identity；其选择边界来自当前 View Selection。它们不替代当前 Semantic Model 的默认浏览、Authored View 定义、Candidate View 或 Candidate Diff View。
---

## Requirements

### Requirement: 从模型与 Delta 确定性推导

Change-derived projection SHALL 由当前 Semantic Model、所选 Change 的 Semantic Delta、当前 View Selection、Presentation Mode、focus 与 expanded set 确定性推导，相同输入 SHALL 产生语义等价 projection 与相同 projection key。

#### Scenario: 重建 Change projection

- **WHEN** 系统以相同模型 fingerprint、Change fingerprint 与 Browser state 再次生成 projection
- **THEN** 得到语义等价的原生 LikeC4 projection

### Requirement: 呈现 Change 语义差异

Change-derived projection SHALL 提供 `complete`、`complete-with-diff` 与 `diff-only`：`complete` 呈现 after model 且无 diff overlay；`complete-with-diff` 呈现完整目标上下文与联合图差异；`diff-only` 仅保留 changed objects、必要 ancestors、Relationship endpoints 与 removed ghosts。unchanged context SHALL NOT 计入 diff counts。

#### Scenario: Complete with diff

- **WHEN** 用户选择 `complete-with-diff`
- **THEN** Browser 同时呈现目标上下文和 ADDED、MODIFIED、REMOVED overlay

#### Scenario: Diff only

- **WHEN** 用户选择 `diff-only`
- **THEN** Browser 移除不必要 unchanged context
- **AND** 保留解释差异所需的 ancestors 与 endpoints

#### Scenario: Complete

- **WHEN** 用户选择 `complete`
- **THEN** Browser 呈现 after model 且不显示 diff overlay

### Requirement: 支持目标模型层级下钻

Change-derived projection SHALL 使用当前 View Selection 的默认 root，并 SHALL 使用与无 Change 浏览相同的 focus projection、breadcrumb、前进后退与 leaf details 行为，同时按当前 Presentation Mode 保留或省略差异编码。

#### Scenario: 下钻已修改子树

- **WHEN** 用户在 diff-capable mode 中进入目标模型内具有 children 的 Element
- **THEN** Browser 保持当前 View、Change 与 Mode，只更新 focus 与 projection

#### Scenario: 当前 View 没有 Change 差异

- **WHEN** 所选 Change 与当前 View Selection 没有交集
- **THEN** Browser 显示明确空差异状态
- **AND** 不自动改变 View、Change 或 Mode

### Requirement: 支持 Element 级别的变更差异审查

Change-derived View SHALL 支持在 Element Details 面板中查看单个 Element 的 declaration 和 contract 的 before/after diff。

#### Scenario: 查看 Element 变更差异

- **WHEN** 用户查看一个活动 Change 中某个 Element 的详情
- **THEN** Element Details 面板展示该 Element 的 declaration 和 contract 的 before/after diff

#### Scenario: ADDED 元素投影与交互

- **GIVEN** Change 包含 ADDED elements
- **WHEN** 用户在 Change-derived View 中浏览
- **THEN** ADDED elements SHALL 被投影在架构图上，使用 Xirang 投影层而非基础 LikeC4 模型查询
- **AND** 投影元素节点 SHALL 支持展开/收起子元素按钮（桌面和移动端均可用，不依赖 hover）
- **AND** 详情面板 SHALL 仅显示投影数据可支持的 tabs：Properties、Contracts、Diff

#### Scenario: 标准分栏 diff 展示

- **GIVEN** 用户查看 Change-derived View 中 Element 的 Diff tab
- **WHEN** 存在 declaration 或 contract 的 before/after 变更
- **THEN** diff SHALL 以标准编辑器风格双栏展示
- **AND** 每栏 SHALL 有独立行号
- **AND** 移动端 SHALL 通过横向滚动保持双栏列宽，不逐字折行
- **AND** Diff tab 整体 SHALL 支持纵向滚动，避免长内容被详情卡裁切

### Requirement: 由单个 Change Selection 形成组合投影

一个 Change-derived projection SHALL 由当前 View Selection、一个活动 Change Selection、Presentation Mode、focus 与 expanded set 共同形成，并 SHALL 保持 Change、View 与 Mode 为独立状态；系统 SHALL NOT 支持在同一 projection 中聚合多个 Changes。

#### Scenario: 在 Model 中选择 Change

- **WHEN** 用户在 Model View Selection 中选择一个活动 Change
- **THEN** Browser 在相同 Model Selection 内形成 Change-derived projection
- **AND** 不创建独立 Change View entry

#### Scenario: 在 Authored View 中选择 Change

- **WHEN** 用户在 Authored View Selection 中选择一个活动 Change
- **THEN** Browser 将该 Change 的目标与差异限制在 Authored selection boundary 内

### Requirement: 使用 Before After 联合图

`complete-with-diff` 与 `diff-only` SHALL 从 before model 与 after model 形成同一可布局联合图，使 ADDED、MODIFIED 与 REMOVED objects 共存；REMOVED Elements 与 Relationships SHALL 以携带明确 operation metadata 的 ghost/tombstone 参与 projection，但 SHALL NOT 成为 after Semantic Model 或 Authored View 的组成。

#### Scenario: Change 移除 Element

- **WHEN** Change 从目标模型移除一个在 View Selection 内的 Element
- **THEN** diff-capable projection 以可选择 ghost 呈现该 Element
- **AND** Element Details 可读取 before-state 信息

#### Scenario: Change 移除 Relationship

- **WHEN** Change 移除一个 endpoints 可在当前 projection 中表达的 Relationship
- **THEN** Browser 保留该 Relationship 的 before-state edge 与 REMOVED overlay
