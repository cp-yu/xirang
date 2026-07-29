---
entity: element-declaration
identity: deterministic-operations
kind: capability
parent: cli
title: Deterministic Operations
definition: 为查询、校验、证据与原子状态转换提供一致结果的 CLI 操作集合。
---

## ADDED Requirements

### Requirement: 通过 Show 与 List 呈现 Change 编译结果

Deterministic Operations SHALL 从当前 Semantic Model 与 Change 的四分区 Semantic Delta 编译 `show` JSON 和列表 Delta 数量，SHALL NOT 将 Change Plan 或 change-local `specs/` 作为 Semantic Delta 来源。

#### Scenario: 获取 Change JSON

- **WHEN** 用户或 Agent 运行 `xirang show sample --json`
- **THEN** CLI 返回 `id`、`title`、`valid`、实体级 `summary`、以 entity kind 和稳定 identity 表达的 concise `entries` 及 compiler `diagnostics`

#### Scenario: 列出 Change Delta 数量

- **WHEN** 用户或 Agent 请求包含 Delta 数量的 Change 列表
- **THEN** `deltaCount` 等于 compiler diff 的实体级 `summary.total`

#### Scenario: Change 编译失败

- **WHEN** 四分区 Semantic Delta 无法形成有效 Expected Semantic Model
- **THEN** JSON 返回 `valid: false` 与结构化 `diagnostics`，且消费者不得将返回的 `entries` 视为有效目标状态

#### Scenario: 忽略旧 Change 语义来源

- **WHEN** Change Plan 含有旧式 Delta 描述或 Change 目录含有 change-local `specs/`
- **THEN** Show 与 List 只使用四分区 Semantic Delta 和当前 Semantic Model 推导结果
