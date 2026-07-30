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

Semantic Browser SHALL 使用 Model View 或 Change-derived View 在单一 View identity 内呈现不同抽象层级的 Elements、Element Contracts 与 Relationships；初始 focus SHALL 为 Project Root，当前层 SHALL 包含 focus Element、direct children 与可映射到不同可见 endpoints 的 Relationships。

#### Scenario: 下钻 Element

- **WHEN** 用户进入一个具有 children 的 Element
- **THEN** Browser 保持当前 View identity，更新 focus、当前层布局、breadcrumb 与导航历史

#### Scenario: 浏览 Element 详情

- **WHEN** 用户选择没有 children 的 Element
- **THEN** Browser 展示其声明、Contract、Relationships 与 refinement context 且不创建空 View

### Requirement: 呈现 Change 目标与差异

Semantic Browser SHALL 为每个活动 Change 提供一个由当前 Semantic Model 与该 Change 的 Semantic Delta 确定性推导的 Change-derived View，并呈现目标模型及其相对当前 Semantic Model 的差异。

#### Scenario: 审查活动 Change

- **WHEN** 用户选择一个 Change-derived View
- **THEN** Browser 显示目标模型并区分其相对当前 Semantic Model 的 ADDED、MODIFIED 与 REMOVED 语义

### Requirement: 优先使用 Authored scoped View

Semantic Browser SHALL 在一个 Element 同时具有 Authored scoped View 与 Element-derived View 时导航到 Authored scoped View，并 SHALL 仅在没有适用 Authored scoped View 时使用派生视图。

#### Scenario: 根 Element 具有 Authored scoped View

- **WHEN** 用户从索引下钻一个已声明 Authored scoped View 的 Element
- **THEN** Browser 导航到该 Authored View，且其没有 Authored scoped View 的 child Elements 仍可继续导航到 Element-derived Views

### Requirement: 保持 LikeC4 投影有效

Semantic Browser 的 LikeC4 投影 SHALL 关闭 `implicitViews`、固定生成 identity 为 `model` 的默认 View，并省略 LikeC4 无法表示的 self 与 ancestor-chain relationships；投影 SHALL 保持 siblings、跨子树关系及 Semantic Model 中的原始 Relationships 不变。

#### Scenario: 生成 Browser 缓存

- **WHEN** CLI 从 Semantic Model 生成 LikeC4 缓存
- **THEN** 缓存包含唯一默认 `model` View、不包含按 Element 生成的 View ids、通过 LikeC4 校验且不修改 Semantic Model

#### Scenario: 模型包含祖先链关系

- **WHEN** Semantic Model 包含 ancestor-to-descendant 或 descendant-to-ancestor Relationship
- **THEN** LikeC4 缓存省略该关系且 Semantic Model 仍保留原始三元组

### Requirement: 分层呈现 Element Definition

Semantic Browser SHALL 在 Semantic Model 与 Change-derived View 的 Xirang→LikeC4 投影中将完整 Element Definition 映射为 LikeC4 `description`，并将只供 Browser 紧凑展示的确定性 excerpt 映射为 LikeC4 `summary`；该 excerpt SHALL NOT 进入 Semantic Model、Semantic Delta、CLI 输出、diff 或 fingerprint。

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

### Requirement: 通过 Contract 接口加载 Element Contract

Semantic Browser SHALL 通过 Xirang-specific Contract loader、provider、tab 与 HTTP endpoint `/__xirang/contract` 加载 Semantic Model 或活动 Change 目标模型中的 Element Contract；请求 MAY 使用 `change=<change-name>` 选择目标模型，且 public exports、runtime state、errors 与 test selectors SHALL NOT 使用 `variant`、`formal` 或旧 Spec aliases。

#### Scenario: 加载 Semantic Model Contract

- **WHEN** 用户在 Model View 中打开一个 Element 的 Contract tab
- **THEN** Browser 不提供 `change` 参数并返回 Semantic Model 中的 `XirangContractContent`

#### Scenario: 加载活动 Change Contract

- **WHEN** 用户在 Change-derived View 中打开一个 Element Contract
- **THEN** loader 携带 `change=<change-name>` 并呈现目标模型中的 Contract、diff 与 diagnostics

#### Scenario: Contract 不存在

- **WHEN** endpoint 对有效 project、element 与可选 change 返回 Contract not found
- **THEN** loader 将该结果表示为无 Contract，而不是未处理异常

#### Scenario: 新请求替代旧请求

- **WHEN** 用户在前一个 Contract request 完成前切换 Element、Model View 或 Change-derived View
- **THEN** Browser 取消或忽略旧请求，且旧结果不得覆盖当前 Contract state

#### Scenario: 拒绝旧接口术语

- **WHEN** consumer 使用 `variant` 参数、旧 Xirang-specific runtime aliases、`/__xirang/spec` 或旧 Spec loader aliases
- **THEN** Browser protocol 与 public exports 明确拒绝或不提供该接口

#### Scenario: 使用 Contract selectors

- **WHEN** 自动化测试或 Browser integration 定位 Contract tab 与内容
- **THEN** UI 暴露 `data-xirang-contracts` 与 `data-xirang-contract-content` selectors，且不暴露旧 `data-xirang-spec*` selectors

### Requirement: 只列出真实 Views

Semantic Browser 的 View selector SHALL 只列出唯一 Model View、实际 Authored Views 与每个活动 Change 的唯一 Change-derived View，且 SHALL NOT 列出 focus projection 或按 Element 生成的 Views。

#### Scenario: 查看 View selector

- **WHEN** 项目包含 Authored Views 和活动 Changes
- **THEN** selector 显示 `Model View`、这些 Authored Views 与对应 Change-derived Views，且没有 Element View entries

### Requirement: 保持 Authored View 声明视角

Authored View SHALL 严格呈现其 `include` 与 `of` 声明且 SHALL NOT 自动下钻；Element details SHALL 提供显式命令在 Model View 中以该 Element 为 focus 打开。

#### Scenario: 从 Authored View 浏览 Element

- **WHEN** 用户在 Authored View 中选择一个具有 children 的 Element
- **THEN** Browser 打开 details 而不改变 Authored View，并允许用户显式跳转到 Model View

### Requirement: 聚合当前层 Relationships

Semantic Browser SHALL 将深层 Relationship endpoints 映射到当前 focus 下最近的可见 child；仅当两个 endpoints 均可映射且映射结果不同时形成 edge，同一可见 endpoints 的 edge 标签 SHALL 按 UTF-8 byte order 显示去重后的全部 Relationship Kind identities，详情 SHALL 保留原始三元组。

#### Scenario: 聚合跨子树 Relationships

- **WHEN** 两个可见 children 的 descendants 之间存在不同 Kinds 的 Relationships
- **THEN** 当前层显示一条聚合 edge、稳定排序的 Kind identity 标签及全部原始 Relationships

#### Scenario: Relationship 无法映射到当前层

- **WHEN** Relationship endpoint 位于当前 focus 子树之外或两个 endpoints 折叠为同一可见节点
- **THEN** 当前层不显示该 edge 且原始 Relationship 在 Semantic Model 或目标模型中保持不变

### Requirement: 呈现 Perspective Elements

Semantic Browser SHALL 只对 Kind 为 `perspective` 的可见 Elements 使用 `component` shape 与基于 identity 确定性分配的不同无障碍颜色；普通 descendants SHALL 保持自身 Kind 样式，且这些样式 SHALL NOT 写入 Semantic Model 或 Semantic Delta。

#### Scenario: 同层包含多个 Perspectives

- **WHEN** 当前层显示多个 sibling Perspective Elements
- **THEN** 它们使用相同特殊 shape、互不重复的颜色且普通 child 不继承这些颜色

### Requirement: focus 失效时确定性回退

Semantic Model 或 Semantic Delta 刷新使当前 focus 不再存在时，Semantic Browser SHALL 沿刷新前的 ancestor 链回退到最近仍存在的 Element，并在没有可用 ancestor 时回退 Project Root。

#### Scenario: Change 更新移除当前 focus

- **WHEN** 用户正在 Change-derived View 中浏览的 Element 被更新后的 Semantic Delta 移除
- **THEN** Browser 选择最近仍存在的 ancestor、更新布局和 breadcrumb，且旧请求不得恢复已移除 focus
