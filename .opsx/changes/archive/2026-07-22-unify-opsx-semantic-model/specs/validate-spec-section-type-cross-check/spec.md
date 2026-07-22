---
element: validation.spec_section_type_cross_check
---
## MODIFIED Requirements

### Requirement: Frontmatter capabilities 存在性校验

Validation SHALL 对每份新版 formal 或 change-local Spec 的 singular `element` binding 校验 owner 存在于对应 Target Semantic Model。一个 Spec 绑定多个 elements、绑定不存在 element 或使用 legacy `capabilities` ownership array SHALL 产生 ERROR。

#### Scenario: [ADDED] Element 存在
- **WHEN** Spec 声明 `element: cli.archive`
- **AND** Target Semantic Model 包含该 `elementId`
- **THEN** binding validation SHALL 通过

#### Scenario: [ADDED] Element 只存在于同一 graph delta
- **WHEN** change-local Spec 绑定同一 change 新增的 element
- **THEN** combined validation SHALL 通过

#### Scenario: [ADDED] Element 不存在
- **WHEN** Spec 绑定 `missing.element`
- **THEN** validation SHALL 返回 ERROR
- **AND** SHALL 包含 Spec ID 与 elementId

#### Scenario: [ADDED] Multiple owner syntax
- **WHEN**新版 Spec 使用 `capabilities` 数组或 array-valued `element`
- **THEN** validation SHALL 返回 ERROR
- **AND** MUST NOT 自动选择 owner

#### Scenario: [REMOVED] Frontmatter cap 存在于 OPSX

- **WHEN** spec `.opsx/specs/foo/spec.md` 的 frontmatter 声明 `capabilities: [cap.cli.archive]`
- **AND** `project.opsx.yaml` 包含 `cap.cli.archive`
- **THEN** 验证 SHALL 通过

#### Scenario: [REMOVED] Frontmatter cap 不存在于 OPSX

- **WHEN** spec `.opsx/specs/foo/spec.md` 的 frontmatter 声明 `capabilities: [cap.nonexistent]`
- **AND** `project.opsx.yaml` 不包含 `cap.nonexistent`
- **THEN** 验证 SHALL 产生 WARNING（非 ERROR）
- **AND** 警告信息 SHALL 包含 cap ID 和 spec 名称

### Requirement: 缺失 frontmatter 的 warning

新版 Spec 缺失 singular `element` binding SHALL 产生 ERROR，而非 warning。Legacy profile Specs MAY 继续按 legacy validation 报告，但 MUST NOT 被视为满足新版 contract completeness。

#### Scenario: [ADDED] 新版 Spec 无 binding
- **WHEN** Target Semantic Model 使用新版 language version
- **AND** Spec 无 frontmatter 或 `element` 为空
- **THEN** validation SHALL 返回 `MISSING_SPEC_ELEMENT` ERROR

#### Scenario: [ADDED] Required element coverage
- **WHEN** Metamodel 将 element kind 标记为 `contract required`
- **AND** 没有任何 Spec 绑定该 element
- **THEN** validation SHALL 返回 `MISSING_REQUIRED_CONTRACT` ERROR

#### Scenario: [ADDED] Optional element coverage
- **WHEN** element kind 为 `contract optional` 且无 Spec
- **THEN** validation SHALL 通过且不产生 missing binding issue

#### Scenario: [REMOVED] spec 无 frontmatter

- **WHEN** `.opsx/specs/foo/spec.md` 不包含 YAML frontmatter
- **THEN** 验证 SHALL 产生 WARNING
- **AND** 警告信息 SHALL 指明 spec 名称并建议添加 capabilities frontmatter

#### Scenario: [REMOVED] spec 有 frontmatter 但 capabilities 为空

- **WHEN** `.opsx/specs/foo/spec.md` 的 frontmatter 为 `---\ncapabilities: []\n---`
- **THEN** 验证 SHALL 产生 WARNING

#### Scenario: [REMOVED] OPSX 文件不存在时跳过 cap 存在性校验

- **WHEN** `opsx/project.opsx.yaml` 不存在
- **THEN** 验证 SHALL 跳过 frontmatter cap 存在性校验
- **AND** SHALL 仍然对缺失 frontmatter 的 spec 产生 WARNING
