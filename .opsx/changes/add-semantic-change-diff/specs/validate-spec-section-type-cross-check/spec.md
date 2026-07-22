## MODIFIED Requirements

### Requirement: REMOVED/RENAMED requirement header 必须存在于主 spec

`validateChangeDeltaSpecs()` SHALL 对 `## REMOVED Requirements` 中引用的 header 验证其存在于 Formal Spec，并 SHALL 拒绝 `## RENAMED Requirements` section。

#### Scenario: REMOVED header 存在于 Formal Spec
- **WHEN** change Spec 包含 REMOVED `### Requirement: Old`
- **AND** Formal Spec 包含同名 identity
- **THEN** validation SHALL 通过 identity precondition

#### Scenario: REMOVED header 不存在于 Formal Spec
- **WHEN** change Spec 包含 REMOVED `### Requirement: Ghost`
- **AND** Formal Spec 不包含该 identity
- **THEN** validation SHALL 报 ERROR

#### Scenario: RENAMED section 被拒绝
- **WHEN** change Spec 包含 `## RENAMED Requirements`
- **THEN** validation SHALL 报 unsupported operation ERROR
- **AND** SHALL 指引使用 REMOVED old 与 ADDED new
