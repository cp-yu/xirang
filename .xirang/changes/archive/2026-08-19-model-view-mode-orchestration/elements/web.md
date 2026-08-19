---
operation: MODIFIED
entity: element-declaration
identity: web
kind: element
parent: interaction-surfaces
title: Web
definition: Web 是息壤在浏览器中的可视化交互界面，以经 Xirang 改造的 LikeC4 为技术支撑，与 CLI 并列作为 Interaction Surface，向用户呈现 Semantic Model、active Candidate 与 active Changes 的层级浏览与差异审查。它独立建模以承接面向用户的浏览编排语义；不包含 CLI 的配置维护与确定性操作，不构成规范性语义来源，不负责规范语义持久化、Candidate promotion 与 Change Closure。
---

## MODIFIED Requirements

### Requirement: 支持分层语义浏览

Web SHALL 在单一 route 中使用 Full Model 或 Authored View Selection，并可结合 Model Selection（active Candidate 或活动 Change 的 Expected Semantic Model），在被浏览 Model 实例内呈现不同抽象层级的 Elements、Element Contracts 与 Relationships；普通 Browser 的当前层 SHALL 由 View Selection 边界、focus、direct children、已就地展开后代与可映射到不同可见 endpoints 的 Relationships 共同确定。

#### Scenario: 下钻 Full Model 或 Authored View

- **WHEN** 用户在 Full Model 或 Authored View Selection 中进入具有 children 的 Element
- **THEN** Browser 保持当前 View Selection，更新 focus、runtime projection、breadcrumb 与导航历史

#### Scenario: 浏览 Element 详情

- **WHEN** 用户选择没有 children 的 Element
- **THEN** Browser 展示其声明、Contract、Relationships 与 refinement context
- **AND** 不创建新的 View identity 或空 route

### Requirement: URL 编码导航状态并响应浏览器前进后退

Web SHALL 在单一 route 的 URL 中编码 `view`、`model`、`mode` 与 `focus`，并将三维选择与 focus 变化呈现为浏览器历史步；expanded set SHALL 只存储于 Controller 会话和 browser history state，不进入 URL。浏览器前进/后退 SHALL 恢复对应状态，且同步 SHALL NOT 产生循环或重复历史条目。

#### Scenario: 下钻与 breadcrumb 跳转

- **WHEN** 用户下钻 Element 或点击 breadcrumb ancestor
- **THEN** Browser 将新 focus 写入 URL 并新增历史步
- **AND** 浏览器后退恢复先前 focus 与 projection

#### Scenario: 控件变化

- **WHEN** 用户改变 View Selection、Model Selection 或 Presentation Mode
- **THEN** Browser 将对应 `view`、`model` 或 `mode` 写入 URL
- **AND** 一次用户操作只形成一个历史步

#### Scenario: expanded 不进入 URL

- **WHEN** 用户就地展开任意数量的 Elements
- **THEN** URL 不增加 expanded identities
- **AND** 前进后退可通过 history state 恢复，刷新后使用当前 focus 的默认折叠状态

#### Scenario: 深链恢复

- **WHEN** 用户直接打开携带有效 `view`、`model`、`mode` 或 `focus` 的 URL
- **THEN** Controller 建立对应合法状态
- **AND** 不存在的 identity 触发确定性默认回退而不是空白画布

### Requirement: 提供三维独立控制

Web SHALL 在单一 Browser route 中以持久可见且相互独立的 Model Selection、View Selection 与 Presentation Mode 控件形成当前浏览状态。Model Selection SHALL 为 baseline、active Candidate（若存在，`model=candidate`）或一个活动 Change 的 Expected Semantic Model（`model=change:<identity>`），Candidate 不存在时 SHALL NOT 出现该值；View Selection SHALL 只选择 Full Model 或一个对当前 Model 实例解析非空的 Authored View；Presentation Mode SHALL 在非 baseline Model 时提供 `complete`、`complete-with-diff` 与 `diff-only`，baseline 时锁定为 `complete`。

#### Scenario: 三维独立切换

- **WHEN** 用户改变 Model Selection、View Selection 或 Presentation Mode
- **THEN** 另外两个维度的选择保持不变
- **AND** 新的组合状态立即生成对应 projection

#### Scenario: Candidate 提供三态 Mode

- **WHEN** Model Selection 为 active Candidate
- **THEN** Presentation Mode 控件列出 `complete`、`complete-with-diff` 与 `diff-only`
- **AND** 默认为 `complete`

### Requirement: 首页提供 Candidate 与活动 Change 快速入口

Web 首页 SHALL 为 active Candidate（若存在）与每个活动 Change 提供快速入口卡片；Candidate 卡片 SHALL 以 `model=candidate` 状态打开单一 route 并省略 `mode`；活动 Change 卡片 SHALL 以 `model=change:<name>&mode=diff-only` 状态打开单一 route；活动 Change 与 Candidate SHALL NOT 因首页入口而形成独立 View source。

#### Scenario: 点击 Candidate 卡片

- **WHEN** 用户在首页点击 Candidate 入口卡片
- **THEN** Browser 以 `model=candidate` 状态打开，URL 不含 `mode`
- **AND** Model Selection 显示 Candidate，Mode 为 `complete`

#### Scenario: 点击活动 Change 卡片

- **WHEN** 用户在首页点击一个活动 Change 卡片
- **THEN** Browser 以 `model=change:<name>&mode=diff-only` 状态打开
- **AND** View Selection 保持 Full Model

### Requirement: 协调 View Selection 运行时状态

Web SHALL 在切换 View Selection 时保留仍属于新选择边界的 focus，并将 expanded set 限制为新选择中仍有效且可达的 Elements；focus 不再有效时 SHALL 回到新 View 默认 root，Model Selection 与 Presentation Mode SHALL 保持不变。

#### Scenario: 切换到仍包含当前 focus 的 Authored View

- **WHEN** 当前 focus 与部分 expanded Elements 仍属于新 Authored View 的选择边界
- **THEN** Browser 保留 focus 与仍有效的 expanded Elements
- **AND** 使用新 projection key 重新布局

#### Scenario: 切换后 focus 不可用

- **WHEN** 当前 focus 不在新选择中或被 `exclude` 剪除
- **THEN** Browser 回到新 View 默认 root
- **AND** 被排除或不可达的 expanded Elements 不得重新出现

#### Scenario: 当前 Model 在新 View 中无差异

- **WHEN** 保留的非 baseline Model Selection 与新 View Selection 没有交集
- **THEN** Browser 显示明确的空差异状态
- **AND** 不自动修改 View、Model 或 Mode

## REMOVED Requirements

### Requirement: 切换 View、Change 或 Mode 后自动适配视口

### Requirement: 呈现 Change 目标与差异

### Requirement: 呈现 Candidate 目标与差异

### Requirement: 活动 Change 生命周期变化时收敛状态

## ADDED Requirements

### Requirement: 切换 View、Model 或 Mode 后自动适配视口

Web SHALL 在 View Selection、Model Selection 或 Presentation Mode 切换产生的新 projection 应用后，自动缩放并居中，使该 projection 的全部内容完整可见；由 focus 下钻或就地展开引起的 projection 更新 SHALL NOT 触发自动适配，SHALL 保持用户当前视口。

#### Scenario: 切换 View 后适配

- **WHEN** 用户在交互式 Browser 中切换 View Selection
- **THEN** 新 projection 应用后视口自动缩放并居中
- **AND** 该 projection 的全部内容完整可见

#### Scenario: 切换 Model 后适配

- **WHEN** 用户切换 Model Selection
- **THEN** 新 projection 应用后视口自动缩放并居中
- **AND** 该 projection 的全部内容完整可见

#### Scenario: 切换 Mode 后适配

- **WHEN** 用户切换 Presentation Mode
- **THEN** 新 projection 应用后视口自动缩放并居中
- **AND** 该 projection 的全部内容完整可见

#### Scenario: 快速入口进入后适配

- **WHEN** 用户通过首页快速入口卡片以 `view`/`model`/`mode` 状态打开单一 route
- **THEN** 首个 projection 应用后视口自动缩放并居中
- **AND** 该 projection 的全部内容完整可见

#### Scenario: 下钻与就地展开不触发适配

- **WHEN** 用户下钻 focus 或就地展开后代
- **THEN** 视口保持用户当前位置
- **AND** 不自动缩放或居中

### Requirement: 呈现 Model 目标与差异

Web SHALL 将 Model Selection、View Selection 与 Presentation Mode 确定性组合并呈现对应 projection；非 baseline Model SHALL 提供 `complete`、`complete-with-diff` 与 `diff-only` 三种 Presentation Mode，默认值按 Model 值区分（Candidate 为 `complete`，活动 Change 为 `complete-with-diff`），baseline SHALL 锁定为 `complete`；系统 SHALL NOT 为每个 Model 值创建独立可选 View source。`complete` 与 `complete-with-diff` projection SHALL 使用该 Model 的 target-only sources，`diff-only` projection SHALL 使用 baseline 与该 Model 的 union sources；REMOVED elements SHALL 仅在 `diff-only` 中以 ghost 保留。

#### Scenario: Complete 模式

- **WHEN** 用户使用 `complete`
- **THEN** baseline 呈现当前模型，非 baseline Model 呈现其目标模型
- **AND** 不添加 diff overlay

#### Scenario: Complete with diff 模式

- **WHEN** 用户使用 `complete-with-diff`
- **THEN** Browser 呈现该 Model 的 target projection
- **AND** 可见节点与边叠加 ADDED、MODIFIED 与 REMOVED 差异标记
- **AND** REMOVED elements 不属于 target projection，不在该模式中呈现

#### Scenario: Diff only 模式

- **WHEN** 用户使用 `diff-only`
- **THEN** Browser 仅保留 changed objects、必要 ancestors、Relationship endpoints 与 removed ghosts
- **AND** unchanged context 不计入 diff counts

#### Scenario: 浏览 Candidate 默认目标态

- **WHEN** 用户以 `model=candidate` 打开
- **THEN** Browser 呈现 Candidate 目标模型，Mode 为默认 `complete`，无差异标记
