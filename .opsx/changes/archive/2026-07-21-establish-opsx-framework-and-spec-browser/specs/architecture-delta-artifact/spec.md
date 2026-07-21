# architecture-delta-artifact Specification

## MODIFIED Requirements

### Requirement: Delta 文件 SHALL 使用 LikeC4 extend 语法

Delta SHALL 使用 LikeC4 `extend` 扩展已有 domain 或 nested element，或定义新 domain。扩展已有 nested element 时，change-local metadata SHALL 表达目标 intent、lifecycle 和 Specs 索引；sync SHALL 将这些字段 lowering 为 formal element 的 description、status 和 formal Specs 路径，而不是在同一 domain 中重复声明该 capability。

#### Scenario: [MODIFIED] 扩展已有 domain 添加 capability

- **GIVEN** formal 模型包含 `ai_integration` domain
- **AND** change 添加新 capability `new_feature`
- **WHEN** 生成 architecture-delta.c4
- **THEN** SHALL 使用 `extend ai_integration { ... }` 添加 capability
- **AND** SHALL 为新 capability 声明 canonical `capabilityId`

#### Scenario: [ADDED] 扩展已有 capability metadata

- **GIVEN** formal 模型包含 `cli.view_element` capability
- **WHEN** change 修改该 capability 的 intent、lifecycle 或 Specs 索引
- **THEN** architecture-delta.c4 SHALL 使用 `extend cli.view_element { metadata { ... } }`
- **AND** SHALL NOT 在 `extend cli { ... }` 内重复声明 `view_element = capability ...`
- **AND** sync SHALL 将 `intent` lowering 为 formal capability description
- **AND** sync SHALL 合并并去重 Specs 索引
- **AND** sync SHALL 将 change-local Specs 路径转换为 `.opsx/specs/` formal 路径

#### Scenario: [MODIFIED] 添加新 relation

- **GIVEN** change 添加 relation: `cap.a.feature1 -[invokes]-> cap.b.feature2`
- **WHEN** 生成 architecture-delta.c4
- **THEN** SHALL 使用 canonical LikeC4 relationship kind 表达 source、target 和可选 description

#### Scenario: [ADDED] Staged validation 忽略 LikeC4 运行缓存

- **GIVEN** formal Architecture 目录包含 `.likec4/` 自动布局 snapshot
- **AND** architecture delta 添加或修改 element
- **WHEN** validator 构造 formal model 加 delta 的临时验证 workspace
- **THEN** SHALL 排除 `.likec4/` 运行缓存
- **AND** SHALL 仅以 durable LikeC4 source 判断 delta 是否有效

### Requirement: Delta 文件 SHALL 引用 change-local specs

Delta 中新增或修改 capability 的 metadata.specs SHALL 指向 `.opsx/changes/<name>/specs/` 下的 change-local 路径。

#### Scenario: [MODIFIED] 引用 change-local spec

- **GIVEN** change 名为 `add-new-feature`
- **AND** 包含 `specs/new-capability/spec.md`
- **WHEN** 生成 architecture-delta.c4 的 capability metadata
- **THEN** metadata.specs SHALL 为 `['.opsx/changes/add-new-feature/specs/new-capability/spec.md']`
