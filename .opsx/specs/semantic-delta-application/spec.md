---
element: project.root/domain.change_workflow/cap.change.semantic-delta
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
- **WHEN** the user runs `opsx sync <change>`
- **THEN** output SHALL be human-readable and SHALL identify `architecture-delta.c4` or the affected Spec
