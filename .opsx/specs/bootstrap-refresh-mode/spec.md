---
element: project.root/domain.architecture/cap.architecture.bootstrap
---

# bootstrap-refresh-mode Specification

## Purpose
Refresh a legacy or existing formal baseline into a complete reviewed v1 Semantic Model candidate.

## Requirements
### Requirement: Refresh mode SHALL support formal OPSX repositories
A valid formal baseline SHALL expose refresh mode; legacy source MAY be read as migration evidence, but refresh output SHALL be a complete LikeC4 architecture and singular element-bound Spec candidate.

#### Scenario: Legacy baseline is valid
- **WHEN** refresh starts from a valid legacy repository
- **THEN** old files SHALL be review input only
- **AND** promotion SHALL write `.opsx/architecture` and `.opsx/specs`

### Requirement: Refresh scan SHALL use a git anchor when available
Refresh SHALL record and reuse a git anchor to bound implementation evidence without making Git history semantic source.

#### Scenario: Git anchor exists
- **WHEN** refresh resumes
- **THEN** scan evidence SHALL be scoped from the recorded anchor and current tracked files

### Requirement: Refresh review and promote SHALL be delta-first
Refresh SHALL show explicit source-to-target element, Spec, Requirement, and relation decisions before atomic promotion.

#### Scenario: Review has unresolved decisions
- **WHEN** any required decision remains unresolved
- **THEN** promotion SHALL be blocked

### Requirement: Refresh restart SHALL preserve retained workspace audit history
Explicit restart SHALL move the retained workspace to history before creating a fresh workspace.

#### Scenario: User restarts refresh
- **WHEN** restart is confirmed
- **THEN** prior evidence and review state SHALL remain auditable and SHALL NOT become target source
