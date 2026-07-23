---
element: cap.ai.propose-smart-routing
---

# opsx-propose-skill Specification

## Purpose
Define how the propose workflow authors and validates change-local Semantic Delta source modules.
## Requirements
### Requirement: propose skill SHALL 生成 architecture-delta.c4

Propose skill SHALL 指导 Agent 在 graph scope 变化时生成 identity-level `architecture-delta.c4`；graph scope 为 None 时 SHALL 省略该文件。

#### Scenario: 指导生成 OPSX Architecture delta
- **WHEN** change 影响 Architecture semantics
- **THEN** skill SHALL 指导创建顶层 ADDED、MODIFIED、REMOVED sections
- **AND** SHALL 要求 MODIFIED entity 使用完整 target payload

#### Scenario: 禁止 raw extend reconciliation
- **WHEN** skill 指导 delta authoring
- **THEN** MUST NOT 将 raw LikeC4 `extend` 描述为 canonical operation
- **AND** SHALL 指引使用 identity-level dialect

#### Scenario: Graph no-op
- **WHEN** Architecture Source 为 None
- **THEN** SHALL 省略 `architecture-delta.c4`
- **AND** SHALL NOT 创建空 model

### Requirement: propose skill SHALL 指导 relationship 类型选择

Skill SHALL 要求 relationship 使用 Metamodel 声明的 canonical kind 与 `(source, kind, target)` identity。

#### Scenario: 提供 relationship kinds 参考
- **WHEN** skill 指导添加或删除 relationship
- **THEN** SHALL 从当前 Metamodel/Registry 读取允许 kinds
- **AND** SHALL 说明 containment 不使用 relationship 重复表达

#### Scenario: 修改 endpoint 或 kind
- **WHEN** relationship endpoint 或 kind 变化
- **THEN** SHALL 指导使用 REMOVED old tuple 与 ADDED new tuple
- **AND** MUST NOT 使用 MODIFIED 改 identity

### Requirement: propose skill SHALL 指导验证 delta

Skill SHALL 要求 Agent 使用 combined validation 与 effective semantic diff 检查实际表达的 Target Semantic Model。

#### Scenario: 验证与审阅 delta
- **WHEN** Agent 完成 change artifacts
- **THEN** SHALL 指导运行 `opsx validate --change <name> --json`
- **AND** validation 无 ERROR 后 SHALL 运行 `opsx diff --change <name> --write`
- **AND** SHALL 要求 Agent 审阅 unexpected operations
- **AND** MUST NOT 运行 Scenario label command

