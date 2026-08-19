---
operation: MODIFIED
entity: element-declaration
identity: xirang-projection-service
kind: element
parent: web
title: Xirang Projection Service
definition: Xirang Projection Service 是 Web 对 LikeC4 的服务端投影改造：将受管 Semantic Model、active Candidate 与活动 Change 的语义内容确定性转换为原生 LikeC4 base model，并经官方 parser、validator、compute-view 与 Graphviz layout 生产 runtime projection。它独立建模以隔离投影机制与差异呈现、Contract 投递及浏览编排的边界；包含 base model 生成与原子缓存发布、runtime manifest 与 fingerprint 失效、当前层 Relationship 聚合与 Xirang→LikeC4 内容映射，不包含语义差异的视觉表达与 Element Contract 的按需投递。
---

## MODIFIED Requirements

### Requirement: 使用分区 Runtime Manifest

Web runtime manifest SHALL 使用 `version: 5`，分别表达 `model`、`authoredViews`、`changes` 以及可选的 `candidate`；`candidate` source 结构 SHALL 与 Change source 对齐，携带 `diff`、`architecture`、`diffArchitecture`、`likec4Sources`、`diffLikec4Sources` 等字段；`candidate` 与每个 change source SHALL 各自携带对其 target Model 实例解析的 `authoredViews` 结果（selection、roots、virtualRoot），供 View Selection 过滤与投影使用；manifest SHALL NOT 包含独立的 `candidateDiff` 字段；旧 manifest version SHALL NOT 被静默解释为 version 5。

#### Scenario: 构建普通 Browser 状态

- **WHEN** Browser 加载 version 5 manifest
- **THEN** View Selection 从 `model` 与当前 Model source 携带的解析结果建立
- **AND** Model Selection 从 `changes` 与可选的 `candidate` 建立

#### Scenario: Candidate 可用

- **WHEN** active Candidate 存在
- **THEN** manifest 包含独立 `candidate` 字段，结构与 Change source 对齐
- **AND** 其 `authoredViews` 为对该 Candidate target 实例的解析结果

#### Scenario: 读取旧 manifest

- **WHEN** Browser 收到非 version 5 manifest
- **THEN** Browser 返回明确协议错误
- **AND** SHALL NOT 猜测或迁移字段含义

### Requirement: 服务端计算 Runtime Projection

Web SHALL 由服务端根据 View Selection、Model Selection、Presentation Mode、focus、expanded set 与 expected model fingerprint 确定当前可见 projection；服务端 SHALL 按 `model` 值路由 source（baseline 路由到 `manifest.model`，Candidate 路由到 `manifest.candidate`，活动 Change 路由到 `manifest.changes[<identity>]`），SHALL NOT 依赖 Change Selection 的 reserved identifier；Authored View 投影 SHALL 使用该 source 携带的实例级解析边界生成 predicates；该 projection SHALL 基于已由官方 parser 与 validator 建立的 base model，服务端 SHALL NOT 为单次 request 重复 parse 或 validate 同一 base model。

#### Scenario: 请求有效 projection

- **WHEN** Controller 提交与当前模型 fingerprint 一致的 projection descriptor
- **THEN** 服务端以官方 include/exclude predicates 在已 parse 且已 validate 的 base model 上计算该 projection
- **AND** 返回 projection key、layouted DiagramView 与 diagnostics

#### Scenario: model 路由

- **WHEN** projection request 的 `model` 分别为 baseline、`candidate` 或某活动 Change
- **THEN** 服务端分别路由到 `manifest.model`、`manifest.candidate` 或 `manifest.changes[<identity>]`
- **AND** 三态 Mode 逻辑对非 baseline Model 完全一致

#### Scenario: 请求使用旧 fingerprint

- **WHEN** request 的 expected model fingerprint 已不是当前有效版本
- **THEN** 服务端拒绝该 request 并返回结构化 stale diagnostic

### Requirement: 检测活动 Change 生命周期变化并重建 manifest

Web 服务端 SHALL 将活动 Change 目录自身事件、`changes/archive` 侧事件以及缺少 filename 的 watcher 事件视为重建 manifest 的信号，使该 Change 不再出现在 Model Selection 的 change 值中。

#### Scenario: 缺少 filename 的 watcher 事件

- **WHEN** watcher 返回缺少 filename 的事件或 `changes/archive` 侧事件
- **THEN** 服务端触发一次完整重建，使活动 Change 列表与磁盘当前状态一致

### Requirement: 分层呈现 Element Definition

Web SHALL 在被浏览 Model 实例（Semantic Model、active Candidate 或活动 Change 的 Expected Semantic Model）的 Xirang→LikeC4 投影中将完整 Element Definition 映射为 LikeC4 `description`，并将只供 Browser 紧凑展示的确定性 excerpt 映射为 LikeC4 `summary`；该 excerpt SHALL NOT 进入 Semantic Model、Candidate、Semantic Delta、CLI 输出、diff 或 fingerprint。

#### Scenario: 查看图节点与 Element 详情

- **WHEN** Browser 呈现一个具有多段 Definition 的被浏览 Model 实例中的 Element
- **THEN** 图节点和 Browser 搜索使用 excerpt，Element Details 使用完整 Definition
