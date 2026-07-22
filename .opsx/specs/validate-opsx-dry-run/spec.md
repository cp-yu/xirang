---
element: project.root/domain.validation/cap.validation.semantic-contract
---

# validate-architecture-delta Specification

## Purpose
Validate change-local LikeC4 architecture deltas together with behavior contracts without mutating formal source.

## Requirements
### Requirement: Validator 支持 architecture-delta dry-run 校验
Validator SHALL copy the current architecture to an isolated workspace, apply `architecture-delta.c4`, and run LikeC4 plus OPSX semantic validation before reporting success.

#### Scenario: Delta references an unknown element
- **WHEN** architecture delta validation runs
- **THEN** it SHALL fail with the delta path and semantic error
- **AND** formal architecture SHALL remain unchanged

### Requirement: validate 命令变更路径并行执行 spec + architecture 校验
Change validation SHALL validate delta Specs and `architecture-delta.c4` as distinct source modules and combine their issues in one result.

#### Scenario: One source module fails
- **WHEN** either behavior or architecture delta validation fails
- **THEN** the change SHALL be invalid and SHALL report the failing module
