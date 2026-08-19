---
operation: MODIFIED
entity: element-declaration
identity: xirang-contract-delivery
kind: element
parent: web
title: Xirang Contract Delivery
definition: Xirang Contract Delivery 是 Web 对 LikeC4 的 Contract 投递改造：按稳定 Element identity 构建 identity→content 索引，经受控 HTTP 端点向浏览器按需安全提供 Semantic Model、active Candidate 与活动 Change 目标中的 Element Contract，并以只读方式渲染。它独立建模以隔离 Contract 内容获取与投影计算、差异呈现的边界；不负责 projection 计算与差异视觉表达，不构成规范性语义来源。
---

## MODIFIED Requirements

### Requirement: 通过 Contract 接口加载 Element Contract

Web SHALL 通过 Xirang-specific Contract loader、provider、tab 与 HTTP endpoint `/__xirang/contract`，按统一 source reference 加载 Semantic Model、active Candidate 或活动 Change target 中的 Element Contract；请求 MAY 使用 `source=candidate` 或 `source=change:<change-name>` 选择来源，分别路由到 `manifest.candidate.contracts` 与 `manifest.changes[<change-name>].contracts`；SHALL NOT 存在 `source=change:candidate` reserved 编码；Candidate 的 Contract diff 与 diagnostics 呈现逻辑与活动 Change 一致。

#### Scenario: 加载 Semantic Model Contract

- **WHEN** 用户在 Full Model 中打开一个 Element 的 Contract tab
- **THEN** Browser 不提供 `source` 参数并返回 Semantic Model 中的 `XirangContractContent`

#### Scenario: 加载活动 Change Contract

- **WHEN** 用户在 Model Selection 为活动 Change 时打开一个 Element Contract
- **THEN** loader 携带 `source=change:<change-name>` 并呈现目标模型中的 Contract、diff 与 diagnostics

#### Scenario: 加载 Candidate Contract

- **WHEN** 用户在 Model Selection 为 Candidate 时打开一个 Element Contract
- **THEN** loader 携带 `source=candidate` 并呈现 active Candidate target 中的 Contract、diff 与 diagnostics

#### Scenario: Contract 不存在

- **WHEN** endpoint 对有效 project、element 与可选 source 返回 Contract not found
- **THEN** loader 将该结果表示为无 Contract，而不是未处理异常

#### Scenario: Contract state 与当前选择一致

- **WHEN** Contract tab 呈现
- **THEN** Contract state 对应当前选中的 Element 与 View source，且仅反映最新加载请求的结果

#### Scenario: 新请求替代旧请求

- **WHEN** 用户在前一个 Contract request 完成前切换 Element 或 Model Selection
- **THEN** Browser 取消或忽略旧请求，且旧结果不得覆盖当前 Contract state

#### Scenario: 使用 Contract selectors

- **WHEN** 自动化测试或 Browser integration 定位 Contract tab 与内容
- **THEN** UI 暴露 `data-xirang-contracts` 与 `data-xirang-contract-content` selectors
