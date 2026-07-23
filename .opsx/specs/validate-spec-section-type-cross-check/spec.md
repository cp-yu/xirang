---
element: cap.validation.spec-section-type-cross-check
---

# validate-spec-section-type-cross-check Specification

## Purpose
Define the reviewed Semantic Contract Validation contract for MODIFIED requirement header 必须存在于主 spec; ADDED requirement header 不得已存在于主 spec; REMOVED/RENAMED requirement header 必须存在于主 spec; and 2 additional reviewed Requirements.
## Requirements
### Requirement: MODIFIED requirement header 必须存在于主 spec

`validateChangeDeltaSpecs()` SHALL 对每个 `## MODIFIED Requirements` 下的 `### Requirement: <name>` 读取对应主 spec（`.opsx/specs/<capability>/spec.md`），使用 `normalizeRequirementName()` 匹配，验证该 header 存在。不存在时 SHALL 报 ERROR。

#### Scenario: MODIFIED header 存在于主 spec

- **WHEN** change spec `specs/foo/spec.md` 包含 `## MODIFIED Requirements` 下的 `### Requirement: Bar`
- **AND** 主 spec `.opsx/specs/foo/spec.md` 存在且包含 `### Requirement: Bar`
- **THEN** 验证 SHALL 通过，不产生 ERROR

#### Scenario: MODIFIED header 不存在于主 spec

- **WHEN** change spec `specs/foo/spec.md` 包含 `## MODIFIED Requirements` 下的 `### Requirement: Bar`
- **AND** 主 spec `.opsx/specs/foo/spec.md` 存在但不包含 `### Requirement: Bar`
- **THEN** 验证 SHALL 报 ERROR
- **AND** 错误信息 SHALL 包含 requirement 名称和建议（应使用 `## ADDED Requirements`）

#### Scenario: MODIFIED 引用不存在的主 spec

- **WHEN** change spec `specs/foo/spec.md` 包含 `## MODIFIED Requirements`
- **AND** 主 spec `.opsx/specs/foo/spec.md` 不存在
- **THEN** 验证 SHALL 报 ERROR
- **AND** 错误信息 SHALL 说明主 spec 不存在，MODIFIED 无效

#### Scenario: header 匹配使用 normalizeRequirementName

- **WHEN** change spec 中 header 为 `### Requirement:  Bar ` (含多余空格)
- **AND** 主 spec 中 header 为 `### Requirement: Bar`
- **THEN** 匹配 SHALL 成功（通过 `normalizeRequirementName()` 规范化后比较）

### Requirement: ADDED requirement header 不得已存在于主 spec

`validateChangeDeltaSpecs()` SHALL 对每个 `## ADDED Requirements` 下的 `### Requirement: <name>` 检查对应主 spec 中是否已存在同名 header。已存在时 SHALL 报 ERROR。

#### Scenario: ADDED header 不存在于主 spec

- **WHEN** change spec `specs/foo/spec.md` 包含 `## ADDED Requirements` 下的 `### Requirement: New Thing`
- **AND** 主 spec `.opsx/specs/foo/spec.md` 不包含 `### Requirement: New Thing`
- **THEN** 验证 SHALL 通过

#### Scenario: ADDED header 已存在于主 spec

- **WHEN** change spec `specs/foo/spec.md` 包含 `## ADDED Requirements` 下的 `### Requirement: Existing`
- **AND** 主 spec `.opsx/specs/foo/spec.md` 已包含 `### Requirement: Existing`
- **THEN** 验证 SHALL 报 ERROR
- **AND** 错误信息 SHALL 建议使用 `## MODIFIED Requirements`

#### Scenario: 主 spec 不存在时 ADDED 合法

- **WHEN** change spec `specs/foo/spec.md` 包含 `## ADDED Requirements`
- **AND** 主 spec `.opsx/specs/foo/spec.md` 不存在
- **THEN** 验证 SHALL 通过（新 capability 的所有 requirement 都是 ADDED）

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

### Requirement: Frontmatter capabilities 存在性校验

Validation SHALL 对每份新版 formal 或 change-local Spec 的 singular `element` binding 校验 owner 存在于对应 Target Semantic Model。一个 Spec 绑定多个 elements、绑定不存在 element 或使用 legacy `capabilities` ownership array SHALL 产生 ERROR。

#### Scenario: Element 存在
- **WHEN** Spec 声明 `element: cli.archive`
- **AND** Target Semantic Model 包含该 `elementId`
- **THEN** binding validation SHALL 通过

#### Scenario: Element 只存在于同一 graph delta
- **WHEN** change-local Spec 绑定同一 change 新增的 element
- **THEN** combined validation SHALL 通过

#### Scenario: Element 不存在
- **WHEN** Spec 绑定 `missing.element`
- **THEN** validation SHALL 返回 ERROR
- **AND** SHALL 包含 Spec ID 与 elementId

#### Scenario: Multiple owner syntax
- **WHEN**新版 Spec 使用 `capabilities` 数组或 array-valued `element`
- **THEN** validation SHALL 返回 ERROR
- **AND** MUST NOT 自动选择 owner

### Requirement: 缺失 frontmatter 的 warning

新版 Spec 缺失 singular `element` binding SHALL 产生 ERROR，而非 warning。Legacy profile Specs MAY 继续按 legacy validation 报告，但 MUST NOT 被视为满足新版 contract completeness。

#### Scenario: 新版 Spec 无 binding
- **WHEN** Target Semantic Model 使用新版 language version
- **AND** Spec 无 frontmatter 或 `element` 为空
- **THEN** validation SHALL 返回 `MISSING_SPEC_ELEMENT` ERROR

#### Scenario: Required element coverage
- **WHEN** Metamodel 将 element kind 标记为 `contract required`
- **AND** 没有任何 Spec 绑定该 element
- **THEN** validation SHALL 返回 `MISSING_REQUIRED_CONTRACT` ERROR

#### Scenario: Optional element coverage
- **WHEN** element kind 为 `contract optional` 且无 Spec
- **THEN** validation SHALL 通过且不产生 missing binding issue

