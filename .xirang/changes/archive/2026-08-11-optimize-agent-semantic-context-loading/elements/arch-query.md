---
operation: MODIFIED
entity: element-declaration
identity: arch-query
kind: element
parent: deterministic-operations
title: Arch Query
definition: Arch Query 定义 `xirang arch query` 的显式语义读取行为：它接受一个或多个稳定 Element identities，确定性返回这些显式请求对象的完整 Element Declarations，并仅在调用方指定 `--contract` 时附加同一批对象的完整 Element Contracts；它不发现影响范围、不展开 children/refinement 或 semantic relationship adjacency，也不接受派生 FQN。
---

## ADDED Requirements

### Requirement: arch query SHALL 限定显式读取边界

`arch query` SHALL 只为命令行显式请求的稳定 identities 返回完整语义。每个结果 SHALL 包含完整 Element Declaration 的 `identity`、`kind`、`title`、`definition` 与 `parent`，并 SHALL 包含 Element Kind 派生的 contract policy 与 `hasContract`；`parent` 是规范 Declaration 字段，MUST NOT 作为导航扩展被移除。

#### Scenario: 不自动返回导航对象

- **WHEN** 显式请求的 Element 具有 parent、children、refinement descendants 或 semantic Relationships
- **THEN** query SHALL 只返回该显式 Element 及其规范 `parent` 字段
- **AND** SHALL NOT 返回 `children`、`refinement`、`relatedElements`、Relationship adjacency 或未请求 Element 的 Definition

#### Scenario: Contract 只作用于显式 identities

- **WHEN** 用户为多个 identities 传入 `--contract`
- **THEN** query SHALL 只为这些显式 identities 中携带 Contract 的 Elements 返回完整 Requirements 与 Scenarios
- **AND** SHALL NOT 向 parent、children、refinement 或 related Elements 广播 Contract

#### Scenario: 未请求 Contract 时只返回存在状态

- **WHEN** 用户省略 `--contract`
- **THEN** query SHALL 返回 contract policy 与 `hasContract`
- **AND** SHALL NOT 返回 Requirements 或 Scenarios

## MODIFIED Requirements

### Requirement: arch query 命令 SHALL 查询 Element 详情

`xirang arch query <element-ids...>` SHALL 接受一个或多个稳定 Element identities，去重并按稳定 identity 确定性排序后读取 Formal Semantic Model。命令 SHALL NOT 接受派生 FQN 或将未知输入猜测为其他 identity。

#### Scenario: 通过稳定 identity 查询

- **WHEN** 用户传入一个存在的稳定 identity
- **THEN** SHALL 输出该 Element 的 identity、kind、title、完整 definition、parent、contract policy 与 hasContract
- **AND** canonical output identity SHALL 与输入对应的稳定 identity 一致

#### Scenario: 批量查询稳定排序

- **WHEN** 用户传入多个 identities 且包含重复值
- **THEN** query SHALL 在一个结果中返回去重后的全部显式 Elements
- **AND** collection 与 text blocks SHALL 按稳定 identity 确定性排序

#### Scenario: 输出 element-owned Contract

- **WHEN** 显式请求的 Element 在其单元中携带 Contract 且用户传入 `--contract`
- **THEN** query SHALL 从该 Element 自身单元返回完整 Requirements 与 Scenarios
- **AND** MUST NOT 从 metadata、path pattern 或相关 Element 推测 Contract

#### Scenario: 派生 FQN 被拒绝

- **WHEN** 输入匹配当前生成的 FQN 但不是稳定 identity
- **THEN** 命令 SHALL 非零退出
- **AND** SHALL 指示调用方使用 stable identity

### Requirement: arch query SHALL 支持 --json 输出

`--json` SHALL 输出 identity-keyed `elements` map；每个 entry SHALL 只表示一个显式请求 Element，并可在 `--contract` 时携带该 Element 的完整 `requirements`。Human-readable 与 JSON 输出 SHALL 从同一个 canonical result object 生成。

#### Scenario: JSON 格式输出

- **WHEN** 用户运行 `xirang arch query element-a element-b --contract --json`
- **THEN** 输出 SHALL 为有效 JSON，且 `elements` SHALL 只包含 `element-a` 与 `element-b`
- **AND** 每个 entry SHALL 包含完整 Declaration fields、contract policy、hasContract 与适用的 requirements

#### Scenario: JSON 不包含导航 projection

- **WHEN** 用户运行任意 JSON query
- **THEN** result SHALL NOT 包含 `refinement`、`relatedElements`、`relations` 或 `children`
- **AND** SHALL NOT 包含未显式请求 identity 的语义内容

### Requirement: arch query SHALL 处理不存在的 element

查询任一不存在的稳定 identity 或派生 FQN SHALL 以非零状态失败并返回清晰错误；批量请求 SHALL fail as a whole，MUST NOT 静默返回部分结果。

#### Scenario: Element 不存在

- **WHEN** 运行 `xirang arch query missing.element`
- **THEN** SHALL 输出 `Element not found: missing.element`
- **AND** exit code SHALL 非零

#### Scenario: 批量请求包含未知 identity

- **WHEN** 批量请求同时包含存在与不存在的 identities
- **THEN** 整个 command SHALL 非零退出并报告未知 identity
- **AND** SHALL NOT 输出看似完整的部分 `elements` result

## REMOVED Requirements

### Requirement: arch query SHALL 支持 --relations 选项

### Requirement: arch query SHALL 支持 --depth 选项
