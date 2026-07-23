---
element: cap.schema.architecture-delta-artifact
---

# architecture-delta-artifact Specification

## Purpose
Define the reviewed Built-in Workflow Definition contract for Change SHALL 使用 architecture-delta.c4 表达架构增量; Delta 文件 SHALL 使用 LikeC4 extend 语法; Delta 文件 SHALL 引用 change-local specs; and 2 additional reviewed Requirements.
## Requirements
### Requirement: Change SHALL 使用 architecture-delta.c4 表达架构增量

Change SHALL 使用 `architecture-delta.c4` 表达 OPSX Semantic Model 的 graph semantic operations，并使用 change-local Specs 表达 contract operations。两类 modules SHALL 共同形成一个 project-level Semantic Delta；active artifact surface SHALL 继续使用 artifact ID `architecture-delta`。

#### Scenario: 创建 graph delta
- **WHEN** change 修改 Metamodel、elements、containment 或 semantic relationships
- **THEN** SHALL 创建 `.opsx/changes/<name>/architecture-delta.c4`
- **AND** SHALL 使用 change 声明的 target language version 与 OPSX delta dialect

#### Scenario: 只有 contract delta
- **WHEN** change 仅修改 Element Contracts 且 graph facts 不变
- **THEN** SHALL 省略 `architecture-delta.c4`
- **AND** MUST NOT 生成空 model、空 operation section 或 no-op graph file

#### Scenario: Delta 文件必须包含真实 operation
- **WHEN** `architecture-delta.c4` 存在
- **THEN** SHALL 至少包含一个 `ADDED`、`MODIFIED` 或 `REMOVED` identity operation
- **AND** 只有 review hint 的文件 SHALL 验证失败

### Requirement: Delta 文件 SHALL 使用 LikeC4 extend 语法

Architecture delta SHALL 使用 OPSX identity-level dialect，而 MUST NOT 使用 raw LikeC4 `extend` 作为 reconciliation semantics。Operation vocabulary SHALL 只有 `ADDED`、`MODIFIED`、`REMOVED`；每个 section SHALL 直接包含 element、relationship、Metamodel element kind 或 Metamodel relationship kind identities。

#### Scenario: 新增 element
- **WHEN** delta 在 `ADDED` 中声明 element
- **THEN** payload SHALL 包含 stable identity、kind、parent、title、summary 与完整目标 metadata
- **AND** identity SHALL 不存在于 Formal Model

#### Scenario: 修改 existing element
- **WHEN** delta 在 `MODIFIED` 中声明 existing element
- **THEN** payload SHALL 包含完整 target `kind`、`parent`、`title`、`summary` 与 metadata
- **AND** `kind` SHALL 与 Formal Model 一致
- **AND** omitted optional direct property SHALL 不存在于 Target Model

#### Scenario: 修改 parent
- **WHEN** `MODIFIED element` 的 target parent 与 Formal Model 不同
- **THEN** Target SHALL 保持 stable element identity
- **AND** validation SHALL 重新检查 containment 与 Metamodel constraints

#### Scenario: 修改 kind 或 identity
- **WHEN** element kind 或 stable identity 发生变化
- **THEN** delta SHALL 使用一个 `REMOVED` old element 与一个完整 `ADDED` new element
- **AND** MUST NOT 使用 `MODIFIED` 改变 kind 或 identity

#### Scenario: Relationship identity
- **WHEN** delta 声明 relationship operation
- **THEN** identity SHALL 为 `(source elementId, relationship kind, target elementId)`
- **AND** 同一 tuple SHALL 最多存在一条 relationship
- **AND** endpoint 或 kind 变化 SHALL 使用 `REMOVED + ADDED`

#### Scenario: Metamodel target state
- **WHEN** delta `MODIFIED` element kind 或 relationship kind
- **THEN** payload SHALL 包含该 identity 的完整目标 constraints
- **AND** Target Model 中全部 elements 与 relationships SHALL 重新验证

### Requirement: Delta 文件 SHALL 引用 change-local specs

Graph delta MUST NOT 通过 element metadata 复制 change-local Spec 内容。每个 change-local Spec SHALL 通过 singular `element: <elementId>` 绑定 Formal 或同一 delta 新增的 element；bindings SHALL 作为独立 contract module facts 验证。

#### Scenario: Spec 绑定新 element
- **GIVEN** graph delta 新增 `payment.authorize`
- **AND** change 包含 `specs/payment-authorization/spec.md`
- **WHEN** 构造 Target Semantic Model
- **THEN** Spec frontmatter SHALL 声明 `element: payment.authorize`
- **AND** validator SHALL 联合解析 graph 与 contract modules

#### Scenario: Element 删除不级联删除 binding
- **WHEN** delta 删除一个仍被 change-local 或 formal Spec 绑定的 element
- **THEN** validation SHALL 返回 dangling binding ERROR
- **AND** MUST NOT 自动删除或迁移该 Spec

### Requirement: Delta 验证 SHALL 检查 extend 目标存在

Delta validation SHALL 对 declared operations 与 materialized Target Semantic Model 执行完整检查，包括 identity preconditions、operation conflicts、containment、Spec bindings、Metamodel constraints、relationship endpoints 与 strict removals。

#### Scenario: Operation identity precondition
- **WHEN** `ADDED` identity 已存在，或 `MODIFIED`/`REMOVED` identity 不存在
- **THEN** SHALL 返回包含 operation、identity 与 source location 的 ERROR

#### Scenario: Declared MODIFIED 无 effective change
- **WHEN** `MODIFIED` payload 与 Formal aggregate 相同
- **THEN** validation SHALL 返回 operation reconciliation ERROR

#### Scenario: 同一 identity operation 冲突
- **WHEN** 同一 identity 出现多个不构成合法 structural replacement 的 operations
- **THEN** validation SHALL 返回 conflict ERROR
- **AND** MUST NOT 依赖 source order 选择 operation

#### Scenario: 删除存在未处理依赖
- **WHEN** removed element 仍有 surviving descendants、relationships、Spec bindings 或其他 references
- **THEN** SHALL 返回所有 unresolved dependencies
- **AND** MUST NOT cascade delete

### Requirement: Delta 合并 SHALL 原子性更新 formal 模型

Sync SHALL 从一个 immutable Formal snapshot 将 graph 与 contract operations materialize 为完整 Target Semantic Model，执行 combined validation 与 fingerprint freshness check，再将干净 formal LikeC4 modules 与 Specs 原子写入。`architecture-delta.c4` MUST NOT 作为含 negative operations 的长期 formal module 被直接复制。

#### Scenario: 联合编译成功
- **WHEN** Target Semantic Model 完整 validation 通过且 Formal fingerprint 未变化
- **THEN** graph modules 与 Specs SHALL 在同一 prepared transaction 中写入
- **AND** registry SHALL 从写入后的 Specs 确定性重建

#### Scenario: Formal snapshot 变更
- **WHEN** prepare 后 Formal fingerprint 与读取时不同
- **THEN** sync SHALL 拒绝全部 writes
- **AND** SHALL 要求重新 validate 或 diff

#### Scenario: 任一 module 失败回滚
- **WHEN** graph、contract、registry、validation 或 filesystem write 任一失败
- **THEN** SHALL 回滚全部 formal modifications
- **AND** formal OPSX Semantic Model SHALL 保持 transaction 前状态

### Requirement: Element replacement review hint

Architecture delta MAY 在顶层声明 `replace element '<old-id>' with '<new-id>'`，用于将一个 `REMOVED` element 与一个 `ADDED` element 关联为 review presentation。该 hint SHALL 不改变 Semantic Delta application 或 Target Semantic Model。

#### Scenario: 合法 replacement hint
- **WHEN** old identity 在 `REMOVED` 中恰好一次且 new identity 在 `ADDED` 中恰好一次
- **THEN** Diff IR MAY 将两项关联为 structural replacement
- **AND** raw operation counts SHALL 仍包含一个 REMOVED 与一个 ADDED

#### Scenario: Hint 不迁移引用
- **WHEN** replacement 两端 identity 不同
- **THEN** relationships、children、Spec bindings 与其他 references SHALL 继续要求显式 reconciliation
- **AND** hint MUST NOT 自动重写任何引用

#### Scenario: 非 element hint 被拒绝
- **WHEN** source 尝试为 relationship 或 Metamodel kind 声明 replacement hint
- **THEN** validation SHALL 返回 ERROR

#### Scenario: 删除 hint 不改变 target
- **WHEN** 从一个合法 delta 删除 replacement hint
- **THEN** materialized Target Semantic Model SHALL 完全相同

