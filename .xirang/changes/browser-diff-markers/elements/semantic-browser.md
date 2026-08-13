---
entity: element-declaration
identity: semantic-browser
kind: element
parent: interaction-surfaces
title: Semantic Browser
definition: Semantic Browser 是以 Views 可视化浏览项目语义的 Interaction Surface。它独立建模以提供面向用户的层级浏览与差异审查，包含 Semantic Model、active Candidate 与 active Changes 派生视角中的 Metamodel、Elements、Element Contracts、Relationships 与 Authored Views；不负责规范语义持久化、Candidate promotion 或 Change Closure。
---

## MODIFIED Requirements

### Requirement: 呈现 Change 目标与差异

Semantic Browser SHALL 将当前 Semantic Model、一个可选活动 Change 与当前 View Selection 确定性组合，并提供 `complete`、`complete-with-diff` 与 `diff-only` 三种 Presentation Mode；系统 SHALL NOT 为每个 Change 创建独立可选 View source。diff overlay 激活时，元素节点以 outline 与计数徽标分层表达语义差异：element-declaration 级操作由橙黄 outline 表达——ADDED 节点以 100% 透明度、橙黄点线 outline 呈现，MODIFIED 节点以 100% 透明度、加粗橙黄实线 outline 呈现，REMOVED 节点以 45% ghost 透明度、橙黄虚线 outline 呈现；requirement 级变更由计数徽标表达——节点以绿色 `+N`、琥珀 `~N`、红色 `−N` 徽标分别呈现其新增、修改、移除的 requirement 数量，仅渲染非零项，同一节点 SHALL 可同时渲染多个徽标，徽标 SHALL 保持 100% 透明度；节点不再使用单字符 `+`/`~`/`−` 徽标。changed 关系边保留其 `+`/`~`/`−` 徽标。unchanged 节点与边 SHALL 仅在存在 element-declaration 或 relationship 级 diff 时以 25% 透明度且无 outline、无徽标呈现；Change 仅包含 contract 级变更时节点与边 SHALL 保持默认透明度。Change 面板的 `+N ~N −N` 计数 SHALL 仅统计 element-declaration 与 relationship 级 diff，requirement 级变更 SHALL NOT 计入。

#### Scenario: Complete 模式

- **WHEN** 用户使用 `complete`
- **THEN** 无 Change 时呈现当前模型，有 Change 时呈现 after model
- **AND** 不添加 diff overlay

#### Scenario: Complete with diff 模式

- **WHEN** 用户使用 `complete-with-diff`
- **THEN** Browser 呈现完整目标上下文与 ADDED、MODIFIED、REMOVED overlay
- **AND** REMOVED objects 以可选择的 ghost 保留

#### Scenario: Diff only 模式

- **WHEN** 用户使用 `diff-only`
- **THEN** Browser 仅保留 changed objects、必要 ancestors、Relationship endpoints 与 removed ghosts
- **AND** unchanged context 不计入 diff counts

#### Scenario: 四态节点视觉区分

- **WHEN** diff overlay 激活且 View 同时包含 ADDED、MODIFIED、REMOVED 与 unchanged 元素
- **THEN** unchanged 元素以 25% 透明度且无 outline、无徽标呈现
- **AND** ADDED 元素以 100% 透明度、橙黄点线 outline 呈现
- **AND** MODIFIED 元素以 100% 透明度、加粗橙黄实线 outline 呈现，其 outline 宽于 ADDED
- **AND** REMOVED 元素以 45% ghost 透明度、橙黄虚线 outline 呈现
- **AND** 存在 requirement 级变更的元素额外显示对应计数徽标

#### Scenario: 关系边视觉区分

- **WHEN** diff overlay 激活且 View 同时包含 changed 与 unchanged 关系
- **THEN** unchanged 关系边以 25% 透明度呈现
- **AND** changed 关系边保留其 `+`/`~`/`−` 徽标且以全透明度呈现

#### Scenario: Requirement 计数徽章

- **GIVEN** diff overlay 激活且一个 Element 的 Contract 包含 requirement 级变更
- **WHEN** 用户查看该 Element 所在 Change-derived View
- **THEN** 该 Element 节点 SHALL 显示绿色 `+N`、琥珀 `~N`、红色 `−N` 计数徽标，仅渲染非零项
- **AND** 同一 Element 存在多类 requirement 变更时，多个计数徽标 SHALL 并排呈现
- **AND** 无 element-declaration 级变更的 Element SHALL NOT 施加 outline，且不因此 dim 其他未变更节点与边

#### Scenario: 无 diff 时默认呈现

- **WHEN** 用户使用 `complete` 模式，或在无 diff 的 Candidate View 中浏览
- **THEN** 节点与关系边保持默认透明度且不施加四态视觉
