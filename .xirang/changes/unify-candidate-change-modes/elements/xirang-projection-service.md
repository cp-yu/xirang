---
entity: element-declaration
identity: xirang-projection-service
operation: MODIFIED
kind: element
parent: web
title: Xirang Projection Service
definition: Xirang Projection Service 是 Web 对 LikeC4 的服务端投影改造：将受管 Semantic Model、active Candidate 与活动 Change 的语义内容确定性转换为原生 LikeC4 base model，并经官方 parser、validator、compute-view 与 Graphviz layout 生产 runtime projection。它独立建模以隔离投影机制与差异呈现、Contract 投递及浏览编排的边界；包含 base model 生成与原子缓存发布、runtime manifest 与 fingerprint 失效、当前层 Relationship 聚合与 Xirang→LikeC4 内容映射，不包含语义差异的视觉表达与 Element Contract 的按需投递。
---

## MODIFIED Requirements

### Requirement: 分层呈现 Element Definition

Web SHALL 在 Semantic Model、Candidate 与 Change-derived View 的 Xirang→LikeC4 投影中将完整 Element Definition 映射为 LikeC4 `description`，并将只供 Browser 紧凑展示的确定性 excerpt 映射为 LikeC4 `summary`；该 excerpt SHALL NOT 进入 Semantic Model、Candidate、Semantic Delta、CLI 输出、diff 或 fingerprint。

#### Scenario: 查看图节点与 Element 详情

- **WHEN** Browser 呈现一个具有多段 Definition 的 Semantic Model、Candidate 或 Change target Element
- **THEN** 图节点和 Browser 搜索使用 excerpt，Element Details 使用完整 Definition

### Requirement: 使用分区 Runtime Manifest

Web runtime manifest SHALL 使用 `version: 4`，分别表达 `model`、`authoredViews`、`changes` 以及可选的 `candidate`；`candidate` source 结构 SHALL 与 Change source 对齐，携带 `diff`、`architecture`、`diffArchitecture`、`likec4Sources`、`diffLikec4Sources` 等字段；manifest SHALL NOT 包含独立的 `candidateDiff` 字段；旧 manifest version SHALL NOT 被静默解释为 version 4。

#### Scenario: 构建普通 Browser 状态

- **WHEN** Browser 加载 version 4 manifest
- **THEN** View Selection 从 `model` 与 `authoredViews` 建立
- **AND** Change Selection 从 `changes` 与可选的 `candidate` 建立

#### Scenario: Candidate 可用

- **WHEN** active Candidate 存在
- **THEN** manifest 包含独立 `candidate` 字段，结构与 Change source 对齐
- **AND** manifest SHALL NOT 包含独立 `candidateDiff` 字段

#### Scenario: 读取旧 manifest

- **WHEN** Browser 收到非 version 4 manifest
- **THEN** Browser 返回明确协议错误
- **AND** SHALL NOT 猜测或迁移字段含义

### Requirement: 服务端计算 Runtime Projection

Web SHALL 由服务端根据 View Selection、可选 Change Selection（含 Candidate）、Presentation Mode、focus、expanded set 与 expected model fingerprint 确定当前可见 projection；当 `change=candidate` 时，服务端 SHALL 路由到 `manifest.candidate` source 并以与普通 Change 相同的三态逻辑计算 projection；该 projection SHALL 基于已由官方 parser 与 validator 建立的 base model，服务端 SHALL NOT 为单次 request 重复 parse 或 validate 同一 base model。

#### Scenario: 请求有效 projection

- **WHEN** Controller 提交与当前模型 fingerprint 一致的 projection descriptor
- **THEN** 服务端以官方 include/exclude predicates 在已 parse 且已 validate 的 base model 上计算该 projection
- **AND** 返回 projection key、layouted DiagramView 与 diagnostics

#### Scenario: change=candidate 路由

- **WHEN** projection request 的 change 为 `candidate`
- **THEN** 服务端路由到 `manifest.candidate` source，而非 `manifest.changes['candidate']`
- **AND** 三态 Mode 逻辑与普通 Change 完全一致

#### Scenario: 请求使用旧 fingerprint

- **WHEN** request 的 expected model fingerprint 已不是当前有效版本
- **THEN** 服务端拒绝该 request 并返回结构化 stale diagnostic

### Requirement: Candidate source 按输入刷新

Web SHALL 以 source identity、partition fingerprint 与 model fingerprint 区分 Candidate runtime data；Candidate source 变化 SHALL 只刷新 `manifest.candidate`，Semantic Model 变化 SHALL 在基础缓存原子替换成功后刷新 Model、Candidate 与活动 Change 数据，并失效旧 runtime projections。

#### Scenario: Candidate 修改后刷新

- **WHEN** `.xirang/candidate/` 下任一受管 Candidate file 发生变化
- **THEN** Browser 刷新 `manifest.candidate`
- **AND** 普通 Browser 的 View 与 Change selections 保持不变

#### Scenario: Semantic Model 修改后刷新

- **WHEN** `.xirang/model/` 下任一受管 Semantic Model file 发生变化
- **THEN** Browser 在完整缓存重建成功后发布新 manifest 与 fingerprint
- **AND** 旧 projection response 不得覆盖新状态
