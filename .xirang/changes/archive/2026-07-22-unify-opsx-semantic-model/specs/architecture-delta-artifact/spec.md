---
element: schema.architecture_delta_artifact
---
## MODIFIED Requirements

### Requirement: Change SHALL 使用 architecture-delta.c4 表达架构增量

Change SHALL 使用 `architecture-delta.c4` 表达 OPSX Semantic Model 的 graph module delta，并使用 change-local Specs 表达 contract module deltas。两类 modules SHALL 共同形成一个 Semantic Delta；active artifact surface SHALL 继续使用 artifact ID `architecture-delta`，MUST NOT 恢复 `opsx-delta.yaml`。

#### Scenario: [ADDED] 创建 graph delta
- **WHEN** change 修改 Metamodel、elements、containment、semantic relationships 或 views
- **THEN** SHALL 创建 `.opsx/changes/<name>/architecture-delta.c4`
- **AND** SHALL 使用 change 所声明的 target language version

#### Scenario: [ADDED] 只有 contract delta
- **WHEN** change 仅修改 Element Contracts 且 graph facts 不变
- **THEN** MAY 省略 `architecture-delta.c4`
- **AND** MUST NOT 生成空 graph operations

#### Scenario: [REMOVED] 创建 architecture-delta.c4

- **GIVEN** change 影响架构
- **WHEN** propose 生成 change artifacts
- **THEN** SHALL 创建 `.opsx/changes/<name>/architecture-delta.c4`
- **AND** MUST NOT 创建 `opsx-delta.yaml`

#### Scenario: [REMOVED] Spec-driven artifact graph 使用 LikeC4 delta

- **WHEN** Agent 查询 spec-driven artifact status 或 instructions
- **THEN** SHALL 暴露 artifact ID `architecture-delta` 与 output `architecture-delta.c4`
- **AND** MUST NOT 暴露 active artifact ID `opsx-delta`
- **AND** `opsx validate --change <name> --artifacts opsx-delta` SHALL 返回 unsupported scope error

### Requirement: Delta 文件 SHALL 使用 LikeC4 extend 语法

在 LikeC4-compatible scope 内，Delta SHALL 使用 `extend` 修改现有 element 或添加 nested element；versioned OPSX annotations SHALL 用于 Metamodel 与 Project Root changes。新增或修改 element SHALL 声明稳定 `elementId`，不得依赖 kind-specific `capabilityId` 作为 canonical identity。

#### Scenario: [ADDED] 扩展任意 existing element
- **GIVEN** formal model 包含任意 kind element
- **WHEN** delta 在其下添加 child
- **THEN** SHALL 使用 `extend <fqn> { ... }`
- **AND** child SHALL 声明唯一 `elementId` 与 summary

#### Scenario: [ADDED] 修改 existing element
- **WHEN** delta 修改 element summary、lifecycle 或 OPSX annotations
- **THEN** SHALL extend 该 element 自身
- **AND** SHALL NOT 在 parent 中重复声明同一 element

#### Scenario: [ADDED] 添加 semantic relationship
- **WHEN** delta 添加 `invokes`、`produces`、`consumes` 或其他 Metamodel relationship
- **THEN** SHALL 使用 canonical relationship kind syntax
- **AND** endpoints SHALL resolve to elements in Target Semantic Model

#### Scenario: [ADDED] Staged validation 忽略运行缓存
- **WHEN** validator 构造 formal graph 加 delta 的临时 workspace
- **THEN** SHALL 排除 `.likec4/` 运行缓存
- **AND** SHALL 只使用 source modules 判断目标模型

#### Scenario: [REMOVED] 扩展已有 domain 添加 capability

- **GIVEN** formal 模型包含 `ai_integration` domain
- **AND** change 添加新 capability `new_feature`
- **WHEN** 生成 architecture-delta.c4
- **THEN** SHALL 使用 `extend ai_integration { ... }` 添加 capability
- **AND** SHALL 为新 capability 声明 canonical `capabilityId`

#### Scenario: [REMOVED] 扩展已有 capability metadata

- **GIVEN** formal 模型包含 `cli.view_element` capability
- **WHEN** change 修改该 capability 的 intent、lifecycle 或 Specs 索引
- **THEN** architecture-delta.c4 SHALL 使用 `extend cli.view_element { metadata { ... } }`
- **AND** SHALL NOT 在 `extend cli { ... }` 内重复声明 `view_element = capability ...`
- **AND** sync SHALL 将 `intent` lowering 为 formal capability description
- **AND** sync SHALL 合并并去重 Specs 索引
- **AND** sync SHALL 将 change-local Specs 路径转换为 `.opsx/specs/` formal 路径

#### Scenario: [REMOVED] 添加新 relation

- **GIVEN** change 添加 relation: `cap.a.feature1 -[invokes]-> cap.b.feature2`
- **WHEN** 生成 architecture-delta.c4
- **THEN** SHALL 使用 canonical LikeC4 relationship kind 表达 source、target 和可选 description

#### Scenario: [REMOVED] Staged validation 忽略 LikeC4 运行缓存

- **GIVEN** formal Architecture 目录包含 `.likec4/` 自动布局 snapshot
- **AND** architecture delta 添加或修改 element
- **WHEN** validator 构造 formal model 加 delta 的临时验证 workspace
- **THEN** SHALL 排除 `.likec4/` 运行缓存
- **AND** SHALL 仅以 durable LikeC4 source 判断 delta 是否有效

### Requirement: Delta 文件 SHALL 引用 change-local specs

Graph delta MUST NOT 通过 element `metadata.specs` 引用 change-local Specs。每个 change-local Spec SHALL 在自身 frontmatter 中使用 singular `element: <elementId>` 绑定 formal 或同一 delta 新增的 element。

#### Scenario: [ADDED] Spec 绑定新 element
- **GIVEN** graph delta 新增 `elementId: payment.authorize`
- **AND** change 包含 `specs/payment-authorization/spec.md`
- **WHEN** 构造 Target Semantic Model
- **THEN** Spec frontmatter SHALL 声明 `element: payment.authorize`
- **AND** validator SHALL 联合解析 graph 与 contract modules

#### Scenario: [REMOVED] 引用 change-local spec

- **GIVEN** change 名为 `add-new-feature`
- **AND** 包含 `specs/new-capability/spec.md`
- **WHEN** 生成 architecture-delta.c4 的 capability metadata
- **THEN** metadata.specs SHALL 为 `['.opsx/changes/add-new-feature/specs/new-capability/spec.md']`

### Requirement: Delta 验证 SHALL 检查 extend 目标存在

Delta validation SHALL 在 Formal Model 与同一 graph delta 的合并上下文中检查 extend target、element identity、containment constraints、Spec bindings 与 relation endpoints。

#### Scenario: [ADDED] Extend target 不存在
- **WHEN** delta extend 一个不存在于 Formal Model 或 delta 的 element
- **THEN** SHALL 返回 ERROR 并包含 target FQN

#### Scenario: [ADDED] Spec target 只存在于同一 delta
- **WHEN** change-local Spec 绑定同一 delta 新增的 `elementId`
- **THEN** validation SHALL 接受该 binding

#### Scenario: [REMOVED] Extend 不存在的 domain

- **GIVEN** architecture-delta.c4 包含 `extend nonexistent_domain { ... }`
- **AND** formal 模型中不存在该 domain
- **WHEN** 运行 `opsx arch validate --delta`
- **THEN** SHALL 返回错误 "Cannot extend nonexistent domain: nonexistent_domain"

### Requirement: Delta 合并 SHALL 原子性更新 formal 模型

Sync SHALL 将 graph delta 与 contract deltas 作为一个 Semantic Delta 原子应用。任何 syntax、identity、containment、binding、contract 或 relation failure SHALL 阻止全部 formal writes。

#### Scenario: [ADDED] 联合合并成功
- **WHEN** Target Semantic Model 完整 validation 通过
- **THEN** graph modules 与 Specs SHALL 在同一 prepared transaction 中写入
- **AND** registry SHALL 从写入后的 Specs 确定性重建

#### Scenario: [ADDED] 任一 module 失败回滚
- **WHEN** graph 或 contract module 合并失败
- **THEN** SHALL 回滚全部 formal modifications
- **AND** formal OPSX Semantic Model SHALL 保持合并前状态

#### Scenario: [REMOVED] 合并成功更新所有文件

- **GIVEN** architecture-delta.c4 包含 2 个新 capabilities 和 3 个 relations
- **WHEN** 运行 `opsx sync <name>`
- **THEN** SHALL 将新 capabilities 添加到对应的 domain 文件
- **AND** SHALL 将新 relations 添加到对应文件
- **AND** 所有更新 SHALL 在同一事务中完成

#### Scenario: [REMOVED] 合并失败回滚

- **GIVEN** delta 合并过程中遇到冲突
- **WHEN** 合并失败
- **THEN** SHALL 回滚所有修改
- **AND** formal 模型 SHALL 保持合并前状态
