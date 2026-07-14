## MODIFIED Requirements

### Requirement: OPSX validation aligns with downstream sync/archive semantics

`opsx-delta.yaml` 的 post-propose validation SHALL 通过 artifact-scoped CLI 命令执行，而非由 Agent 手动模拟 merge。`openspec validate --change "<name>" --artifacts opsx-delta --json` SHALL 通过 `Validator.validateOpsxDelta()` 执行 OPSX v2 schema parsing、formal two-file bundle dry-run merge、referential integrity 与 `RelationDefinitionRegistry` semantic validation。Validation MUST NOT 读取、生成或要求 code-map。

#### Scenario: [ADDED] OPSX delta against current formal bundle
- **GIVEN** formal `project.opsx.yaml` 与 `project.opsx.relations.yaml` 存在
- **AND** change 中存在 `opsx-delta.yaml`
- **WHEN** Agent 执行 artifact-scoped validation
- **THEN** SHALL 对完整 formal bundle 执行 dry-run merge
- **AND** SHALL 检查 referential integrity 与 Registry semantic contract
- **AND** MUST NOT 调用 code-map validation

#### Scenario: [ADDED] Formal OPSX 不存在时优雅跳过
- **GIVEN** formal OPSX bundle 不存在
- **WHEN** change 中存在 `opsx-delta.yaml`
- **THEN** `Validator.validateOpsxDelta()` SHALL 优雅跳过 formal merge
- **AND** SHALL 返回可诊断的 skipped result 而非读取 code-map 或猜测 baseline

#### Scenario: [REMOVED] OPSX delta is validated against current project OPSX
- **GIVEN** `openspec/project.opsx.yaml` 存在
- **AND** change 中存在 `opsx-delta.yaml`
- **WHEN** agent 执行 post-propose validation
- **THEN** SHALL 调用 `openspec validate "<change>" --type change --json`
- **AND** 该命令 SHALL 通过 `Validator.validateOpsxDelta()` 以程序化方式执行 OPSX dry-run merge 校验
- **AND** SHALL 检查 referential integrity
- **AND** SHALL 检查 code-map integrity
- **AND** SHALL NOT 依赖 LLM 手动读取文件并模拟 merge 语义

#### Scenario: [REMOVED] No formal OPSX exists
- **GIVEN** `openspec/project.opsx.yaml` 不存在
- **WHEN** change 中存在 `opsx-delta.yaml`
- **THEN** `Validator.validateOpsxDelta()` SHALL 优雅跳过
- **AND** 返回 valid: true 且无 issues
- **AND** SHALL NOT 报错
