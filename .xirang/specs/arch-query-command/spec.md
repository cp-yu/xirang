---
element: cap.cli.arch-query
---

# arch-query-command Specification

## Purpose
Define the reviewed Architecture Navigation contract for arch query 命令 SHALL 查询 LikeC4 element 详情; arch query SHALL 支持 --relations 选项; arch query SHALL 支持 --depth 选项; and 2 additional reviewed Requirements.

## Requirements
### Requirement: arch query 命令 SHALL 查询 LikeC4 element 详情

`xirang arch query <element-id-or-fqn>` SHALL 查询任意 kind 的 OPSX Semantic Model element。命令 SHALL 接受稳定 `elementId` 或当前 LikeC4 FQN，并以 `elementId` 作为 canonical output identity。

#### Scenario: 通过稳定 elementId 查询
- **GIVEN** model 包含 `elementId: payment.authorize` 且当前 FQN 为 `project.orders.payment.authorize`
- **WHEN** 运行 `xirang arch query payment.authorize`
- **THEN** SHALL 输出 `Element: payment.authorize`
- **AND** SHALL 输出 kind、FQN、title、summary、parent 与 contract policy

#### Scenario: 通过 FQN 查询
- **WHEN** 运行 `xirang arch query project.orders.payment.authorize`
- **THEN** SHALL 定位同一 element
- **AND** canonical output SHALL 仍使用 `payment.authorize`

#### Scenario: 输出 element-owned Specs
- **WHEN** registry 包含一个或多个 Specs 绑定该 element
- **THEN** query SHALL 输出这些 Spec IDs 或 project-relative paths
- **AND** MUST NOT 从 `metadata.specs` 读取索引

### Requirement: arch query SHALL 支持 --relations 选项

`--relations` SHALL 返回 element 的持久化 semantic relationships，并 SHALL 将 endpoints 归一化为稳定 `elementId`。Containment 派生的 `belongs_to`、`refines` 与 `abstracts` MUST NOT 伪装成 persisted relationship records。

#### Scenario: 查询 semantic relationships
- **WHEN** element 有 `invokes`、`produces` 或 `consumes` relations
- **THEN** output SHALL 保留 relation kind、direction、canonical endpoints 与 description

### Requirement: arch query SHALL 支持 --depth 选项

`--depth N` SHALL 同时支持按 semantic relationship 邻接和 refinement hierarchy 展开到指定深度，并 SHALL 标注 context 来源。

#### Scenario: 深度查询包含 refinement
- **WHEN** 查询 parent element 并使用 `--depth 2`
- **THEN** SHALL 包含两层 descendants 与其 depth
- **AND** SHALL 提供确定性 Refinement Overview

#### Scenario: Element 移动后仍可查询
- **GIVEN** element 的 FQN 因 parent 变化而改变
- **WHEN** 以稳定 `elementId` 查询
- **THEN** SHALL 返回移动后的当前 FQN 与正确 parent

### Requirement: arch query SHALL 支持 --json 输出

`--json` SHALL 输出包含 `element`、`refinement`、可选 `relations` 与 owned `specs` 的结构化 JSON。

#### Scenario: JSON 格式输出
- **WHEN** 运行 `xirang arch query payment.authorize --relations --json`
- **THEN** SHALL 输出有效 JSON
- **AND** `element.id` SHALL 为稳定 `elementId`
- **AND** SHALL 包含当前 `fqn`、`kind`、`parent`、`children` 与 `specs`

### Requirement: arch query SHALL 处理不存在的 element

查询不存在的 `elementId` 与 FQN SHALL 以非零状态失败，并返回清晰错误。

#### Scenario: Element 不存在
- **WHEN** 运行 `xirang arch query missing.element`
- **THEN** SHALL 输出 `Element not found: missing.element`
- **AND** exit code SHALL 非零
