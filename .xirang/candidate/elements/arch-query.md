---
entity: element-declaration
identity: arch-query
kind: capability
parent: deterministic-operations
title: Arch Query
definition: Arch Query 定义 `xirang arch query` 的结构化查询行为：按稳定 identity 或当前 FQN 定位 Element、`--relations` 返回持久化语义关系、`--depth` 展开 refinement 与 relation 邻接、`--json` 输出与不存在的 Element 处理。
---

## Requirements

### Requirement: arch query 命令 SHALL 查询 Element 详情

`xirang arch query <element-id-or-fqn>` SHALL 查询任意 kind 的 Semantic Model element。命令 SHALL 接受稳定 identity 或当前 FQN，并以稳定 identity 作为 canonical output identity。

#### Scenario: 通过稳定 identity 查询
- **GIVEN** model 包含某 element 且当前 FQN 与 stable identity 不同
- **WHEN** 运行 `xirang arch query <element-id>`
- **THEN** SHALL 输出 Element identity、kind、FQN、title、definition、parent 与 contract policy

#### Scenario: 通过 FQN 查询
- **WHEN** 运行带当前 FQN 的 `xirang arch query`
- **THEN** SHALL 定位同一 element
- **AND** canonical output SHALL 仍使用稳定 identity

#### Scenario: 输出 element-owned Contracts
- **WHEN** 查询的 Element 在其单元中携带 Contract（requirements 非空）
- **THEN** query SHALL 输出该 Element 的 contract policy、hasContract 与（`--contract` 时）完整 Requirements
- **AND** MUST NOT 从 metadata 字段读取索引
#### Scenario: 通过稳定 elementId 查询
- **GIVEN** model 包含 `identity: payment.authorize` 且当前 FQN 为 `project.orders.payment.authorize`
- **WHEN** 运行 `xirang arch query payment.authorize`
- **THEN** SHALL 输出 `Element: payment.authorize`
- **AND** SHALL 输出 kind、FQN、title、definition、parent 与 contract policy
#### Scenario: Query guidance 与新版 output 一致
- **WHEN** 检查 fragment
- **THEN** SHALL 说明 parent、children、Contracts 与 incoming/outgoing relationships
- **AND** SHALL 使用 identity 作为 canonical identity
- **AND** SHALL NOT 承诺 code-map refs
### Requirement: arch query SHALL 支持 --relations 选项

`--relations` SHALL 返回 element 的持久化 semantic relationships，并 SHALL 将 endpoints 归一化为稳定 identity。Containment 派生的 `belongs_to`、`refines` 与 `abstracts` MUST NOT 伪装成 persisted relationship records。

#### Scenario: 查询 semantic relationships
- **WHEN** element 有 semantic relations
- **THEN** output SHALL 保留 relation kind、direction 与 canonical endpoints

### Requirement: arch query SHALL 支持 --depth 选项

`--depth N` SHALL 同时支持按 semantic relationship 邻接和 refinement hierarchy 展开到指定深度，并 SHALL 标注 context 来源。

#### Scenario: 深度查询包含 refinement
- **WHEN** 查询 parent element 并使用 `--depth 2`
- **THEN** SHALL 包含两层 descendants 与其 depth
- **AND** SHALL 提供确定性 Refinement Overview

#### Scenario: Element 移动后仍可查询
- **GIVEN** element 的 FQN 因 parent 变化而改变
- **WHEN** 以稳定 identity 查询
- **THEN** SHALL 返回移动后的当前 FQN 与正确 parent

### Requirement: arch query SHALL 支持 --json 输出

`--json` SHALL 输出包含 `element`、`refinement`、可选 `relations` 与 owned `contracts` 的结构化 JSON。

#### Scenario: JSON 格式输出
- **WHEN** 运行带 `--relations --json` 的查询
- **THEN** SHALL 输出有效 JSON
- **AND** `element.id` SHALL 为稳定 identity
- **AND** SHALL 包含当前 `fqn`、`kind`、`parent`、`children` 与 `contracts`

### Requirement: arch query SHALL 处理不存在的 element

查询不存在的 identity 与 FQN SHALL 以非零状态失败并返回清晰错误。

#### Scenario: Element 不存在
- **WHEN** 运行 `xirang arch query missing.element`
- **THEN** SHALL 输出 `Element not found: missing.element`
- **AND** exit code SHALL 非零
