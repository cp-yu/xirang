---
entity: element-declaration
identity: change-derived-views
kind: capability
parent: derived-views
title: Change-derived Views
definition: 由当前 Semantic Model 与一个活动 Change 的 Semantic Delta 确定性推导、用于呈现目标模型及语义差异的 View。它按 Change 独立建模以支持对一次演进意图的理解与审查；包含目标模型的层级浏览和 diff，不包含当前 Semantic Model 的默认浏览或 Authored View 视角。
---

## Requirements

### Requirement: 从模型与 Delta 确定性推导

Change-derived View SHALL 由当前 Semantic Model 与该 Change 的 Semantic Delta 确定性推导。

#### Scenario: 重建 Change View

- **WHEN** 系统以相同模型和 Delta 再次生成视图
- **THEN** 得到语义等价的 Change-derived View

### Requirement: 呈现 Change 语义差异

Change-derived View SHALL 以 diff 视角呈现该 Change 新增、修改或移除的语义。

#### Scenario: 审查 Change

- **WHEN** 用户查看一个活动 Change
- **THEN** 视图区分 ADDED、MODIFIED 与 REMOVED 语义

### Requirement: 每个活动 Change 形成唯一 View

每个活动 Change SHALL 只形成一个 Change-derived View，其 identity SHALL 在该 Change 存续期间稳定，且 Element focus 变化 SHALL NOT 创建其他 Views。

#### Scenario: 浏览 Change 中的不同层级

- **WHEN** 用户在同一活动 Change 中连续下钻多个 Elements
- **THEN** Browser 保持同一 Change-derived View identity 并只更新 focus 与导航历史

### Requirement: 支持目标模型层级下钻

Change-derived View SHALL 以目标模型的 Project Root 作为初始 focus，并 SHALL 使用与 Model View 相同的 focus projection、breadcrumb、前进后退与 leaf details 行为，同时保留 Semantic Delta 的差异编码。

#### Scenario: 下钻已修改子树

- **WHEN** 用户从 Change-derived View 进入目标模型中具有 children 的 Element
- **THEN** Browser 在同一 View 内显示新的当前层投影并继续区分 ADDED、MODIFIED 与 REMOVED 语义

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
