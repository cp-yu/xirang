---
entity: element-declaration
identity: arch-validate
kind: element
parent: deterministic-operations
title: Arch Validate
definition: Arch Validate 定义 `xirang arch validate` 的行为：验证当前 Semantic Model 的四分区记法与语义、支持 `--delta` 选项对 change-local delta 做目标模型校验，且不修改 Formal source。
---

## Requirements

### Requirement: arch validate 命令 SHALL 验证模型记法

`xirang arch validate` SHALL 运行模型的记法解析与语义验证，报告语法与语义错误。

#### Scenario: 验证语法正确的模型

- **GIVEN** 模型四分区语法正确
- **WHEN** 运行 `xirang arch validate`
- **THEN** SHALL 输出验证通过信息
- **AND** 退出码 SHALL 为 0

#### Scenario: 验证失败时显示错误

- **GIVEN** 模型语法错误
- **WHEN** 运行 `xirang arch validate`
- **THEN** SHALL 显示错误输出
- **AND** 退出码 SHALL 为非零

### Requirement: arch validate SHALL 执行语义验证

arch validate SHALL 在记法验证后执行语义检查，包括 containment（恰有一个 parent、无环）、precedes cycle 与 Metamodel 约束。

#### Scenario: 检查 precedes cycle

- **GIVEN** 模型包含 precedes cycle: A → B → C → A
- **WHEN** 运行 `xirang arch validate`
- **THEN** SHALL 检测到 cycle
- **AND** SHALL 输出错误 "Precedes cycle detected: A → B → C → A"
- **AND** precedes relations MUST 形成 DAG
#### Scenario: 检查 containment cycle
- **WHEN** 一个非根 Element 的 parent chain 形成 cycle
- **THEN** SHALL 检测到 containment cycle 并输出错误
#### Scenario: 检查非根 Element 恰有一个 parent
- **WHEN** 一个非根 Element 没有 parent
- **THEN** SHALL 输出 "Element <id> has no parent" 类错误
### Requirement: arch validate SHALL 支持 --delta 选项

`xirang arch validate --delta <path>` SHALL 解析 change-local Semantic Delta，在 immutable Formal snapshot 上 materialize Target Model，并验证 declared operations 与完整 target integrity。

#### Scenario: 验证合法 delta 文件
- **GIVEN** change 包含四分区 Semantic Delta
- **WHEN** 运行 `xirang arch validate --delta <path>`
- **THEN** SHALL 验证 operations、identity preconditions、完整 target payloads、containment、Metamodel、relationships 与 strict removals
- **AND** validation 成功时 exit code SHALL 为 0

#### Scenario: Empty delta 被拒绝
- **WHEN** delta 不含任何真实 identity operation
- **THEN** SHALL 返回 structured ERROR
- **AND** SHALL 指引在无变化时省略 delta

#### Scenario: Partial target 失败
- **WHEN** MODIFIED element 缺少必填完整 target fields
- **THEN** SHALL 返回包含 identity、field 与 source location 的 ERROR

#### Scenario: Formal snapshot 不被修改
- **WHEN** 执行任意 `arch validate --delta`
- **THEN** command SHALL NOT 写入 Formal model、Contracts 或 change artifacts
#### Scenario: Raw extend delta 被拒绝
- **WHEN** delta 使用 raw LikeC4 `extend` 作为 reconciliation operation
- **THEN** SHALL 返回 unsupported delta syntax ERROR
- **AND** SHALL NOT 将 additive merge 当作 target replacement
