---
entity: element-declaration
identity: deterministic-operations
kind: capability
parent: cli
title: Deterministic Operations
definition: 为查询、校验、证据与原子状态转换提供一致结果的 CLI 操作集合。
---

## ADDED Requirements

### Requirement: 使用 Verb-first CLI 与 Element Contract 术语

Deterministic Operations SHALL 仅通过顶层 verb-first commands 提供 Change 展示、列表与验证能力，并 SHALL 以 `contract` 作为 Element Contract 在 flags、type selectors、JSON discriminators、交互选项、completion 与 diagnostics 中的公开术语；CLI SHALL NOT 注册 deprecated `xirang change` command group，也 SHALL NOT 接受旧 `spec` forms 或 forwarding aliases。

#### Scenario: 使用唯一 Change 操作入口

- **WHEN** 用户运行顶层 `xirang show <change>`、`xirang list` 或 `xirang validate --change <change>`
- **THEN** CLI 提供对应有效能力，且 `xirang change ...` 不再是已注册 command group

#### Scenario: 创建 Change 不受影响

- **WHEN** 用户运行 `xirang new change <name>`
- **THEN** CLI 继续通过 verb-first `new` group 创建 Change

#### Scenario: 校验全部 Element Contracts

- **WHEN** 用户运行 `xirang validate --contracts --json`
- **THEN** CLI 校验 Formal Semantic Model 中携带 Contract 的 Elements，并以 `type: "contract"` 返回每项结果

#### Scenario: 按类型校验一个 Element Contract

- **WHEN** 用户运行 `xirang validate <element> --type contract`
- **THEN** CLI 以 Element identity 定位并校验其 Contract

#### Scenario: 拒绝旧公开形式

- **WHEN** 用户提供 `--specs`、`--type spec` 或 `xirang change ...`
- **THEN** CLI 将其视为未注册 option、type 或 command，而不静默转发到新形式

## MODIFIED Requirements

### Requirement: 通过 Show 与 List 呈现 Change 编译结果

Deterministic Operations SHALL 从当前 Semantic Model 与 Change 的四分区 Semantic Delta 编译顶层 `show` JSON、顶层 `list` JSON 与 `--long` 文本结果，SHALL NOT 将 Change Plan 或 change-local `specs/` 作为 Semantic Delta 来源。

#### Scenario: 获取 Change JSON

- **WHEN** 用户或 Agent 运行 `xirang show sample --json`
- **THEN** CLI 返回 `id`、`title`、`valid`、实体级 `summary`、以 entity kind 和稳定 identity 表达的 concise `entries` 及 compiler `diagnostics`

#### Scenario: 获取稳定 Change 列表 JSON

- **WHEN** 用户或 Agent 运行 `xirang list --json`
- **THEN** CLI 返回 `{ changes: [...] }` envelope，每项保留 `name`、task、last-modified、status 与 freshness information，并增加 compiler-derived `title` 和 `deltaCount`

#### Scenario: 获取详细 Change 文本列表

- **WHEN** 用户运行 `xirang list --long`
- **THEN** 每个活动 Change 的文本结果包含 title、实体级 Delta 数量与 task status

#### Scenario: 列出 Change Delta 数量

- **WHEN** 用户或 Agent 请求包含 Delta 数量的 Change 列表
- **THEN** `deltaCount` 等于 compiler diff 的实体级 `summary.total`

#### Scenario: Change 编译失败

- **WHEN** 四分区 Semantic Delta 无法形成有效 Expected Semantic Model
- **THEN** `show` JSON 返回 `valid: false` 与结构化 `diagnostics`，且消费者不得将返回的 `entries` 视为有效目标状态

#### Scenario: 忽略旧 Change 语义来源

- **WHEN** Change Plan 含有旧式 Delta 描述或 Change 目录含有 change-local `specs/`
- **THEN** Show 与 List 只使用四分区 Semantic Delta 和当前 Semantic Model 推导结果
