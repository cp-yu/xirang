---
element: cap.architecture.delta-merger
---

# semantic-delta-application Specification

## Purpose
Define active validation, merge, transaction, and diagnostic behavior for LikeC4 architecture deltas and element-owned Spec deltas.
## Requirements
### Requirement: Architecture delta validation and merge
Active sync SHALL validate `architecture-delta.c4` against the current Semantic Model, merge valid LikeC4 extensions into durable architecture modules, and reject unknown elements, invalid relations, or invalid resulting models.

#### Scenario: Architecture delta is invalid
- **WHEN** the merged target model fails LikeC4 or OPSX semantic validation
- **THEN** sync SHALL fail before formal writes

### Requirement: Semantic delta writes are atomic
Architecture and Spec writes SHALL be prepared as one manifest and committed atomically; any write or post-write validation failure SHALL restore every preimage.

#### Scenario: A write fails mid-transaction
- **WHEN** one prepared write cannot be committed
- **THEN** all architecture and Spec files SHALL be restored

### Requirement: Sync diagnostics are actionable
Sync validation failures SHALL identify the artifact, semantic issue, and affected path without dumping opaque parser structures.

#### Scenario: Delta validation fails
- **WHEN** the user runs `xirang sync <change>`
- **THEN** output SHALL be human-readable and SHALL identify `architecture-delta.c4` or the affected Spec

### Requirement: Target compiler SHALL 删除显式清空的 Spec module
当一个 formal Spec 的全部 Requirements 均通过 change-local `REMOVED Requirements` 被显式删除，且 target 中没有 surviving、ADDED 或 MODIFIED Requirement 时，Target Semantic Model compiler SHALL 将该 Spec module 从 target 中删除，而不是写入空 contract file。

#### Scenario: 全部 Requirements 被删除
- **GIVEN** formal Spec 包含一个或多个 Requirements
- **WHEN** change 对每个 Requirement 声明精确 REMOVED operation
- **AND** target 没有新增或修改 Requirement
- **THEN** compiler SHALL 将该 Spec directory 标记为 removed target module
- **AND** atomic writer SHALL 删除对应 `.xirang/specs/<spec-id>/spec.md`

#### Scenario: 删除不完整
- **WHEN** formal Spec 仍有 surviving Requirement
- **THEN** compiler SHALL 保留该 Spec module
- **AND** SHALL NOT 因 Requirement 数量减少而推断 whole-Spec removal

#### Scenario: Removed Spec 仍被引用
- **WHEN** target architecture 或 registry 仍要求该 Spec module 才能满足 required contract closure
- **THEN** target validation SHALL 失败
- **AND** formal source SHALL 保持不变

