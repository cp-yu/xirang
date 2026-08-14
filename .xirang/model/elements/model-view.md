---
entity: element-declaration
identity: model-view
kind: element
parent: derived-views
title: Model View
definition: Model View 是由项目当前 Semantic Model 确定性派生、作为 Web 默认 View Selection 的唯一模型浏览视角。它在单一 Browser route 中提供完整模型选择边界，并可与一个活动 Change 和 Presentation Mode 正交组合；focus、导航历史、展开集合与布局属于运行时呈现状态，不产生其他 View identities。它不替代 Authored Views、Candidate View 或 Candidate Diff View，也不成为独立的 Change source。
---

## Requirements

### Requirement: 提供唯一默认 Model View

每个 Xirang 项目 SHALL 自动提供且只提供一个 identity 为 `model` 的 Model View Selection；该 identity SHALL 为系统保留且 SHALL NOT 被 Authored View 使用。

#### Scenario: 打开项目模型

- **WHEN** 用户打开任意有效 Xirang 项目
- **THEN** View Selection 包含唯一 Model 选项且其 identity 为 `model`

#### Scenario: Authored View 使用保留 identity

- **WHEN** Authored View 声明 identity `model`
- **THEN** 模型校验拒绝该声明

### Requirement: 从 Semantic Model 确定性派生

Model View SHALL 由完整 Semantic Model 和当前 runtime state 确定性派生，并 SHALL NOT 持久化为 Authored View、生成独立 LikeC4 route 或按 Element 生成其他 View identities。

#### Scenario: 相同输入重复生成

- **WHEN** 服务端对相同 Semantic Model fingerprint、focus、expanded set、Change 与 mode 重建 Model projection
- **THEN** 得到语义等价的原生 LikeC4 projection 与相同 projection key

### Requirement: 在单一 View 内维护层级焦点

Model View SHALL 以 Project Root 作为默认 focus，并在 `model` View Selection 内以 focus Element、direct children、展开集合内后代与当前层可表达的 Relationships 形成 runtime projection；breadcrumb 与前进后退 SHALL 只改变 focus，下钻 SHALL 与就地展开保持为不同交互。

#### Scenario: 下钻具有 children 的 Element

- **WHEN** 用户在 Model View 中下钻具有 children 的 Element
- **THEN** Browser 保持 `model` View Selection 并更新 focus、projection 与 breadcrumb

#### Scenario: 选择 leaf Element

- **WHEN** 用户选择没有 children 的 Element
- **THEN** Browser 打开 details 或 Contract
- **AND** 不创建空 View 或新 route

### Requirement: 支持就地展开层级

Model View SHALL 以属于当前 Controller 会话的 expanded set 决定哪些可见 Elements 就地呈现 children；expanded SHALL 与 focus 独立、可逐层叠加，并 SHALL NOT 改变 `model` identity。expanded SHALL 不进入 URL，浏览器前进后退 MAY 通过 history state 恢复，页面刷新后 SHALL 使用当前 focus 的默认折叠状态。

#### Scenario: 就地展开具有 children 的 Element

- **WHEN** 用户对当前层一个具有 children 的 Element 请求就地展开
- **THEN** Browser 保持当前 focus 与 `model` identity
- **AND** 通过新的 Graphviz projection 呈现其 children

#### Scenario: expanded 跨 focus 变化保持

- **WHEN** 用户在展开若干 Elements 后改变 focus
- **THEN** 当前 Controller 会话中的 expanded set 保持
- **AND** 仅当前选择内可达的 expanded Elements 参与 projection

#### Scenario: 按层级深度批量展开

- **WHEN** 用户请求从当前 focus 展开至第 N 层
- **THEN** Browser 将 focus 下第 1 至 N-1 层中具有 children 的 Elements 加入 expanded set
- **AND** N 不大于 1 时 expanded set 为空

### Requirement: 与 Change Selection 和 Presentation Mode 正交组合

Model View SHALL 作为 View Selection 与无 Change 或一个活动 Change Selection 组合，并在有 Change 时支持 `complete`、`complete-with-diff` 与 `diff-only`；该组合 SHALL 形成 runtime projection，SHALL NOT 创建或持久化新的 View identity。

#### Scenario: 查看 Model 目标态

- **WHEN** 用户选择 Model、一个活动 Change 与 `complete`
- **THEN** Browser 在 `model` View Selection 中呈现 after model
- **AND** 不添加 diff overlay

#### Scenario: 查看 Model 差异

- **WHEN** 用户选择 Model、一个活动 Change 与 diff-capable mode
- **THEN** Browser 在相同 `model` View Selection 中呈现对应联合 projection
- **AND** focus 与展开交互继续可用
