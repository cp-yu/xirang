---
operation: MODIFIED
entity: element-declaration
identity: semantic-browser
kind: capability
parent: interaction-surfaces
title: Semantic Browser
definition: Semantic Browser 是以 Views 可视化浏览项目语义的 Interaction Surface。它独立建模以提供面向用户的层级浏览与差异审查，包含 Semantic Model、active Candidate 与 active Changes 派生视角中的 Metamodel、Elements、Element Contracts、Relationships 与 Authored Views；不负责规范语义持久化、Candidate promotion 或 Change Closure。
---

## ADDED Requirements

### Requirement: 呈现 Candidate 目标与差异

Semantic Browser SHALL 在 active Candidate 存在时提供唯一的 Candidate View 与 Candidate Diff View：Candidate View 由 Candidate Semantic Model 确定性派生并呈现完整但尚未确认的目标模型，Candidate Diff View 由当前 Semantic Model 与 Candidate 确定性派生并固定呈现 diff-only 差异。

#### Scenario: 浏览 active Candidate

- **WHEN** active Candidate 存在且用户选择 Candidate View
- **THEN** Browser 显示 Candidate 四分区形成的完整目标模型，且 SHALL NOT 将当前 Semantic Model 的差异标记混入 Candidate View

#### Scenario: 审查 Candidate diff

- **WHEN** 当前 Semantic Model 与 active Candidate 可用于比较且用户选择 Candidate Diff View
- **THEN** Browser 显示 Candidate target 以及相对当前 Semantic Model 的 ADDED、MODIFIED、REMOVED 差异，且不提供 Full context 切换

#### Scenario: Candidate invalid

- **WHEN** active Candidate validation 返回 ERROR
- **THEN** Browser 仍保留两个 Candidate sources，显示 `valid: false` 与 diagnostics，能解析的 architecture MAY 继续只读呈现，且 SHALL NOT 显示 stale Candidate snapshot

### Requirement: Candidate source 按输入刷新

Semantic Browser SHALL 以 source identity 和 partition fingerprint 区分 runtime source，并 SHALL 在 Candidate、Semantic Model 或 active Change source 变化时只刷新受影响的 source。

#### Scenario: Candidate 修改后刷新

- **WHEN** `.xirang/candidate/` 下任一 Candidate file 发生变化
- **THEN** Browser SHALL 同时刷新 `candidate` 与 `candidate-diff` source，并保留其他可用 source

#### Scenario: Semantic Model 修改后刷新

- **WHEN** `.xirang/model/` 下任一 Semantic Model partition file 发生变化
- **THEN** Browser SHALL 刷新 Model、Candidate、Candidate Diff 与受影响的 Change-derived sources

### Requirement: Candidate source manifest 使用 version 3

Semantic Browser runtime manifest SHALL 使用 `version: 3`，保留 `semanticModel` 与 `changes`，并以显式 `candidate` 与 `candidateDiff` fields 表达两个 Candidate sources；旧 manifest version SHALL NOT 被静默解释为当前协议。

#### Scenario: active Candidate 存在

- **WHEN** View runtime 检测到 active Candidate
- **THEN** manifest SHALL 包含 `candidate` 与 `candidateDiff`，且两个 source 的 `valid`、diagnostics、architecture 与 `sourceFingerprint` SHALL 绑定同一 Candidate snapshot

#### Scenario: active Candidate 不存在

- **WHEN** View runtime 未检测到 active Candidate
- **THEN** manifest SHALL 不包含 `candidate` 或 `candidateDiff`，且 Model 与 active Changes SHALL 继续可浏览

## MODIFIED Requirements

### Requirement: 支持分层语义浏览

Semantic Browser SHALL 使用 Model View、Candidate View、Candidate Diff View 或 Change-derived View 在单一 View identity 内呈现不同抽象层级的 Elements、Element Contracts 与 Relationships；初始 focus SHALL 为适用目标模型的 Project Root，当前层 SHALL 包含 focus Element、direct children、已就地展开 Element 的后代与可映射到不同可见 endpoints 的 Relationships。

#### Scenario: 下钻 Element

- **WHEN** 用户进入一个具有 children 的 Element
- **THEN** Browser 保持当前 View identity，更新 focus、当前层布局、breadcrumb 与导航历史

#### Scenario: 浏览 Element 详情

- **WHEN** 用户选择没有 children 的 Element
- **THEN** Browser 展示其声明、Contract、Relationships 与 refinement context 且不创建空 View

### Requirement: 保持 LikeC4 投影有效

Semantic Browser 的 LikeC4 与 Xirang overlay 投影 SHALL 关闭 `implicitViews`、固定生成 identity 为 `model` 的默认 View，并省略 LikeC4 无法表示的 self 与 ancestor-chain relationships；投影 SHALL 保持 siblings、跨子树关系及 Semantic Model、Candidate 与 Change target 中的原始 Relationships 不变。

#### Scenario: 生成 Browser 缓存

- **WHEN** CLI 或 View runtime 从 Semantic Model 生成基础 LikeC4 source，或从 Candidate、Change target 生成 Xirang overlay
- **THEN** 缓存与 runtime projection 包含唯一默认 `model` View、不包含按 Element 生成的 View ids、通过 LikeC4/Xirang projection 校验且不修改 Semantic Model、Candidate 或 Change source

#### Scenario: 模型包含祖先链关系

- **WHEN** Semantic Model、Candidate 或 Change target 包含 ancestor-to-descendant 或 descendant-to-ancestor Relationship
- **THEN** LikeC4/Xirang projection 省略该关系且对应语义 source 仍保留原始三元组

### Requirement: 分层呈现 Element Definition

Semantic Browser SHALL 在 Semantic Model、Candidate View、Candidate Diff View 与 Change-derived View 的 Xirang→LikeC4 投影中将完整 Element Definition 映射为 LikeC4 `description`，并将只供 Browser 紧凑展示的确定性 excerpt 映射为 LikeC4 `summary`；该 excerpt SHALL NOT 进入 Semantic Model、Candidate、Semantic Delta、CLI 输出、diff 或 fingerprint。

#### Scenario: 查看图节点与 Element 详情

- **WHEN** Browser 呈现一个具有多段 Definition 的 Semantic Model、Candidate 或 Change target Element
- **THEN** 图节点和 Browser 搜索使用 excerpt，Element Details 使用完整 Definition

### Requirement: 通过 Contract 接口加载 Element Contract

Semantic Browser SHALL 通过 Xirang-specific Contract loader、provider、tab 与 HTTP endpoint `/__xirang/contract`，按统一 source reference 加载 Semantic Model、active Candidate、Candidate Diff 或活动 Change target 中的 Element Contract；请求 MAY 使用 `source=change:<change-name>`、`source=candidate` 或 `source=candidate-diff` 选择来源，且 public exports、runtime state、errors 与 test selectors SHALL NOT 使用 `variant`、`formal` 或旧 Spec aliases。

#### Scenario: 加载 Semantic Model Contract

- **WHEN** 用户在 Model View 中打开一个 Element 的 Contract tab
- **THEN** Browser 不提供 `source` 参数并返回 Semantic Model 中的 `XirangContractContent`

#### Scenario: 加载活动 Change Contract

- **WHEN** 用户在 Change-derived View 中打开一个 Element Contract
- **THEN** loader 携带 `source=change:<change-name>` 并呈现目标模型中的 Contract、diff 与 diagnostics

#### Scenario: 加载 Candidate Contract

- **WHEN** 用户在 Candidate View 中打开一个 Element Contract
- **THEN** loader 携带 `source=candidate` 并呈现 active Candidate target 中的 `XirangContractContent`

#### Scenario: 加载 Candidate Diff Contract

- **WHEN** 用户在 Candidate Diff View 中打开一个 Element Contract
- **THEN** loader 携带 `source=candidate-diff` 并呈现 Candidate target 中的 Contract、diff 与 diagnostics

#### Scenario: Contract 不存在

- **WHEN** endpoint 对有效 project、element 与可选 source 返回 Contract not found
- **THEN** loader 将该结果表示为无 Contract，而不是未处理异常

#### Scenario: 新请求替代旧请求

- **WHEN** 用户在前一个 Contract request 完成前切换 Element、Model View、Candidate source 或 Change-derived View
- **THEN** Browser 取消或忽略旧请求，且旧结果不得覆盖当前 Contract state

#### Scenario: 拒绝旧接口术语

- **WHEN** consumer 使用 `variant` 参数、`formal` source、旧 Xirang-specific runtime aliases、`/__xirang/spec` 或旧 Spec loader aliases
- **THEN** Browser protocol 与 public exports 明确拒绝或不提供该接口

#### Scenario: 使用 Contract selectors

- **WHEN** 自动化测试或 Browser integration 定位 Contract tab 与内容
- **THEN** UI 暴露 `data-xirang-contracts` 与 `data-xirang-contract-content` selectors，且不暴露旧 `data-xirang-spec*` selectors

### Requirement: 只列出真实 Views

Semantic Browser 的 View selector SHALL 只列出唯一 Model View、active Candidate 存在时的唯一 Candidate View 与 Candidate Diff View、实际 Authored Views 与每个活动 Change 的唯一 Change-derived View，且 SHALL NOT 列出 focus projection、Candidate Authored View 子选择器或按 Element 生成的 Views。

#### Scenario: 查看 View selector

- **WHEN** 项目包含 Authored Views、active Candidate 和活动 Changes
- **THEN** selector 显示 `Model View`、`Candidate View`、`Candidate Diff View`、这些 Authored Views 与对应 Change-derived Views，且没有 Element View entries

#### Scenario: 没有 active Candidate

- **WHEN** 项目没有 active Candidate
- **THEN** selector SHALL 不显示 `Candidate View` 或 `Candidate Diff View`

### Requirement: 保持 Authored View 声明视角

Authored View SHALL 严格呈现其 `include` 与 `of` 声明且 SHALL NOT 自动下钻；Element details SHALL 提供显式命令在 Model View 中以该 Element 为 focus 打开。Candidate View SHALL 保留 Candidate Authored View declarations 作为 runtime semantic data，但本 Change SHALL NOT 将其替换为普通 View selector entries。

#### Scenario: 从 Authored View 浏览 Element

- **WHEN** 用户在 Authored View 中选择一个具有 children 的 Element
- **THEN** Browser 打开 details 而不改变 Authored View，并允许用户显式跳转到 Model View

### Requirement: 呈现 Perspective Elements

Semantic Browser SHALL 只对 Kind 为 `perspective` 的可见 Elements 使用 `document` shape 与基于 identity 确定性分配的不同无障碍颜色；该 shape SHALL 将全部装饰限制在节点边界内；普通 descendants SHALL 保持自身 Kind 样式，且这些样式 SHALL NOT 写入 Semantic Model、Candidate 或 Semantic Delta。

#### Scenario: 区分同层 Perspectives

- **WHEN** 当前层包含多个 Kind 为 `perspective` 的 Elements
- **THEN** 每个 Perspective 使用 `document` shape 与由 identity 确定的互不相同的无障碍颜色

### Requirement: focus 失效时确定性回退

Semantic Model、Candidate 或 Semantic Delta 刷新使当前 focus 不再存在时，Semantic Browser SHALL 沿刷新前的 ancestor 链回退到最近仍存在的 Element，并在没有可用 ancestor 时回退 Project Root。

#### Scenario: Change 更新移除当前 focus

- **WHEN** 用户正在 Change-derived View 中浏览的 Element 被更新后的 Semantic Delta 移除
- **THEN** Browser 选择最近仍存在的 ancestor、更新布局和 breadcrumb，且旧请求不得恢复已移除 focus

#### Scenario: Candidate 更新移除当前 focus

- **WHEN** 用户正在 Candidate View 或 Candidate Diff View 中浏览的 Element 被更新后的 Candidate 移除
- **THEN** Browser 选择最近仍存在的 Candidate ancestor、更新布局和 breadcrumb，且旧 source 内容不得恢复已移除 focus

### Requirement: 合并呈现 Requirement 差异

Semantic Browser SHALL 在 Change-derived View 与 Candidate Diff View 的 Element Details 中，将每个存在差异的 Requirement 连同其全部 Scenario 呈现为单个 diff：该 diff 的 before 与 after 包含 Requirement 正文及全部 Scenario 文本，且不单独为 Scenario 呈现独立 diff。

#### Scenario: 查看新增 Requirement 的合并 diff

- **WHEN** 用户在 Change-derived View 或 Candidate Diff View 中查看一个 ADDED Requirement
- **THEN** Browser 呈现单个 diff，其 after 包含该 Requirement 正文与全部 Scenario 文本

#### Scenario: 查看修改 Requirement 的合并 diff

- **WHEN** 用户在 Change-derived View 或 Candidate Diff View 中查看一个 MODIFIED Requirement
- **THEN** Browser 呈现单个 diff，其 before 与 after 均包含该 Requirement 正文与全部 Scenario 文本
