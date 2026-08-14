---
entity: element-declaration
identity: change-derived-views
kind: element
parent: derived-views
title: Change-derived Views
definition: Change-derived Views 是由当前 Semantic Model、一个活动 Change 的 Semantic Delta、当前 Model 或 Authored View Selection 与 Presentation Mode 确定性推导的 runtime projections。它们面向单次演进意图呈现目标模型和语义差异，但不形成独立 View source、route 或持久 identity；其选择边界来自当前 View Selection。它们不替代当前 Semantic Model 的默认浏览、Authored View 定义、Candidate View 或 Candidate Diff View。
---

## MODIFIED Requirements

### Requirement: 支持 Element 级别的变更差异审查

Change-derived View SHALL 支持在 Element Details 面板中查看单个 Element 的 declaration 和 contract 的 before/after diff。对于不在基础 LikeC4 model 中的投影元素，详情面板 SHALL 使用投影节点 metadata 携带的语义 identity 解析 declaration 与 diff，SHALL NOT 依赖基础 LikeC4 model 查询或以 LikeC4 FQN 作为查询 key。

#### Scenario: 查看 Element 变更差异

- **WHEN** 用户查看一个活动 Change 中某个 Element 的详情
- **THEN** Element Details 面板展示该 Element 的 declaration 和 contract 的 before/after diff

#### Scenario: ADDED 元素投影与交互

- **GIVEN** Change 包含 ADDED elements
- **WHEN** 用户在 Change-derived View 中浏览
- **THEN** ADDED elements SHALL 被投影在架构图上，使用 Xirang 投影层而非基础 LikeC4 模型查询
- **AND** 投影元素节点 SHALL 支持展开/收起子元素按钮（桌面和移动端均可用，不依赖 hover）
- **AND** 详情面板 SHALL 仅显示投影数据可支持的 tabs：Properties、Contracts、Diff

#### Scenario: 单击打开 ADDED 元素详情

- **GIVEN** Change 包含 ADDED elements
- **WHEN** 用户单击或通过详情按钮打开 ADDED 元素节点
- **THEN** 详情面板 SHALL 使用投影节点携带的语义 identity 解析 declaration 与 diff
- **AND** 面板标题 SHALL 显示该 Element 的 title 而非 LikeC4 FQN
- **AND** 面板 SHALL 显示 declaration 的 kind、parent、title 与完整 definition
- **AND** 面板 SHALL 仅显示投影数据可支持的 tabs：Properties、Contracts、Diff
- **AND** 该行为在 `complete` 模式下同样生效

#### Scenario: 标准分栏 diff 展示

- **GIVEN** 用户查看 Change-derived View 中 Element 的 Diff tab
- **WHEN** 存在 declaration 或 contract 的 before/after 变更
- **THEN** diff SHALL 以标准编辑器风格双栏展示
- **AND** 每栏 SHALL 有独立行号
- **AND** 移动端 SHALL 通过横向滚动保持双栏列宽，不逐字折行
- **AND** Diff tab 整体 SHALL 支持纵向滚动，避免长内容被详情卡裁切
