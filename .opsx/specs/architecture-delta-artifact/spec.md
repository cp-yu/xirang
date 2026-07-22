---
element: project.root/domain.schema/cap.schema.workflow-definition
---

# architecture-delta-artifact Specification

## Purpose
Define the reviewed Built-in Workflow Definition contract for Change SHALL 使用 architecture-delta.c4 表达架构增量; Delta 文件 SHALL 使用 LikeC4 extend 语法; Delta 文件 SHALL 引用 change-local specs; and 2 additional reviewed Requirements.

## Requirements
### Requirement: Change SHALL 使用 architecture-delta.c4 表达架构增量

Change SHALL 使用 `architecture-delta.c4` 表达 OPSX Semantic Model 的 graph module delta，并使用 change-local Specs 表达 contract module deltas。两类 modules SHALL 共同形成一个 Semantic Delta；active artifact surface SHALL 继续使用 artifact ID `architecture-delta`，MUST NOT 恢复 `opsx-delta.yaml`。

#### Scenario: 创建 graph delta
- **WHEN** change 修改 Metamodel、elements、containment、semantic relationships 或 views
- **THEN** SHALL 创建 `.opsx/changes/<name>/architecture-delta.c4`
- **AND** SHALL 使用 change 所声明的 target language version

#### Scenario: 只有 contract delta
- **WHEN** change 仅修改 Element Contracts 且 graph facts 不变
- **THEN** MAY 省略 `architecture-delta.c4`
- **AND** MUST NOT 生成空 graph operations

### Requirement: Delta 文件 SHALL 使用 LikeC4 extend 语法

在 LikeC4-compatible scope 内，Delta SHALL 使用 `extend` 修改现有 element 或添加 nested element；versioned OPSX annotations SHALL 用于 Metamodel 与 Project Root changes。新增或修改 element SHALL 声明稳定 `elementId`，不得依赖 kind-specific `capabilityId` 作为 canonical identity。

#### Scenario: 扩展任意 existing element
- **GIVEN** formal model 包含任意 kind element
- **WHEN** delta 在其下添加 child
- **THEN** SHALL 使用 `extend <fqn> { ... }`
- **AND** child SHALL 声明唯一 `elementId` 与 summary

#### Scenario: 修改 existing element
- **WHEN** delta 修改 element summary、lifecycle 或 OPSX annotations
- **THEN** SHALL extend 该 element 自身
- **AND** SHALL NOT 在 parent 中重复声明同一 element

#### Scenario: 添加 semantic relationship
- **WHEN** delta 添加 `invokes`、`produces`、`consumes` 或其他 Metamodel relationship
- **THEN** SHALL 使用 canonical relationship kind syntax
- **AND** endpoints SHALL resolve to elements in Target Semantic Model

#### Scenario: Staged validation 忽略运行缓存
- **WHEN** validator 构造 formal graph 加 delta 的临时 workspace
- **THEN** SHALL 排除 `.likec4/` 运行缓存
- **AND** SHALL 只使用 source modules 判断目标模型

### Requirement: Delta 文件 SHALL 引用 change-local specs

Graph delta MUST NOT 通过 element `metadata.specs` 引用 change-local Specs。每个 change-local Spec SHALL 在自身 frontmatter 中使用 singular `element: <elementId>` 绑定 formal 或同一 delta 新增的 element。

#### Scenario: Spec 绑定新 element
- **GIVEN** graph delta 新增 `elementId: payment.authorize`
- **AND** change 包含 `specs/payment-authorization/spec.md`
- **WHEN** 构造 Target Semantic Model
- **THEN** Spec frontmatter SHALL 声明 `element: payment.authorize`
- **AND** validator SHALL 联合解析 graph 与 contract modules

### Requirement: Delta 验证 SHALL 检查 extend 目标存在

Delta validation SHALL 在 Formal Model 与同一 graph delta 的合并上下文中检查 extend target、element identity、containment constraints、Spec bindings 与 relation endpoints。

#### Scenario: Extend target 不存在
- **WHEN** delta extend 一个不存在于 Formal Model 或 delta 的 element
- **THEN** SHALL 返回 ERROR 并包含 target FQN

#### Scenario: Spec target 只存在于同一 delta
- **WHEN** change-local Spec 绑定同一 delta 新增的 `elementId`
- **THEN** validation SHALL 接受该 binding

### Requirement: Delta 合并 SHALL 原子性更新 formal 模型

Sync SHALL 将 graph delta 与 contract deltas 作为一个 Semantic Delta 原子应用。任何 syntax、identity、containment、binding、contract 或 relation failure SHALL 阻止全部 formal writes。

#### Scenario: 联合合并成功
- **WHEN** Target Semantic Model 完整 validation 通过
- **THEN** graph modules 与 Specs SHALL 在同一 prepared transaction 中写入
- **AND** registry SHALL 从写入后的 Specs 确定性重建

#### Scenario: 任一 module 失败回滚
- **WHEN** graph 或 contract module 合并失败
- **THEN** SHALL 回滚全部 formal modifications
- **AND** formal OPSX Semantic Model SHALL 保持合并前状态
