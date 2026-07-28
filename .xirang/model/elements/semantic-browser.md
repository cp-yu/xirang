---
entity: element-declaration
identity: semantic-browser
kind: capability
parent: interaction-surfaces
title: Semantic Browser
definition: 以 Views 可视化浏览 Semantic Model 与 Change-derived information 的界面。
---

## Requirements

### Requirement: 支持分层语义浏览

Semantic Browser SHALL 使用 Views 呈现不同抽象层级的 Elements、Element Contracts 与 Relationships，并允许用户沿层级下钻理解项目。

#### Scenario: 浏览 Element 详情

- **WHEN** 用户选择一个 Element
- **THEN** Browser 展示其声明、契约、关系和适用的 refinement context

### Requirement: 呈现 Change 目标与差异

Semantic Browser SHALL 对活动 Change 呈现由当前 Semantic Model 与 Semantic Delta 确定性推导的 Expected Semantic Model 和 change-derived diff。

#### Scenario: 审查活动 Change

- **WHEN** 用户切换到一个 Change 视角
- **THEN** Browser 显示目标模型及其相对正式模型的语义差异

### Requirement: 优先使用 Authored scoped View

Semantic Browser SHALL 在一个 Element 同时具有 Authored scoped View 与 Element-derived View 时导航到 Authored scoped View，并 SHALL 仅在没有适用 Authored scoped View 时使用派生视图。

#### Scenario: 根 Element 具有 Authored scoped View

- **WHEN** 用户从索引下钻一个已声明 Authored scoped View 的 Element
- **THEN** Browser 导航到该 Authored View，且其没有 Authored scoped View 的 child Elements 仍可继续导航到 Element-derived Views

### Requirement: 保持 LikeC4 投影有效

Semantic Browser 的 LikeC4 投影 SHALL 省略 LikeC4 无法表示的 self 与 ancestor-chain relationships，并 SHALL 保持 siblings、跨子树关系及正式 Semantic Model 中的原始关系不变。

#### Scenario: 模型包含祖先链关系

- **WHEN** CLI 从包含 ancestor-to-descendant 或 descendant-to-ancestor relationship 的 Semantic Model 生成 LikeC4 缓存
- **THEN** 缓存不包含该关系，LikeC4 校验通过，且正式 Semantic Model 仍保留原始 relationship

### Requirement: 分层呈现 Element Definition

Semantic Browser SHALL 在 Formal Model 与 Change variant 的 Xirang→LikeC4 投影中将完整 Element Definition 映射为 LikeC4 `description`，并将只供 Browser 紧凑展示的确定性 excerpt 映射为 LikeC4 `summary`；该 excerpt SHALL NOT 进入 Semantic Model、Semantic Delta、CLI 输出、diff 或 fingerprint。

#### Scenario: 查看图节点与 Element 详情

- **WHEN** Browser 呈现一个具有多段 Definition 的 Element
- **THEN** 图节点和 Browser 搜索使用 excerpt，Element Details 使用完整 Definition

### Requirement: 确定性派生 Definition Excerpt

Definition excerpt SHALL 对 trim 后文本取空行前第一段，将段内换行与连续空白折叠为单空格，并按 Unicode code points 限制为 120 个；超限时 SHALL 截断并追加 `...`，且 SHALL NOT 使用 LLM 或持久化结果。

#### Scenario: Definition 超过显示上限

- **WHEN** 第一段规范化后超过 120 Unicode code points
- **THEN** Browser summary 包含前 120 个 code points 和 `...`，description 保持完整原文

#### Scenario: Definition 不超过显示上限

- **WHEN** 第一段规范化后不超过 120 Unicode code points
- **THEN** Browser summary 原样使用该规范化段落且不追加省略号
