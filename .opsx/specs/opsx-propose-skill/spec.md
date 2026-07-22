---
element: project.root/domain.ai_integration/cap.ai.workflow-generation
---

# opsx-propose-skill Specification

## Purpose
Define how the propose workflow authors and validates change-local Semantic Delta source modules.

## Requirements
### Requirement: propose skill SHALL 生成 architecture-delta.c4
When a change affects architecture, the propose skill SHALL author graph changes in `architecture-delta.c4` and behavior changes in change-local Specs. Every change-local Spec SHALL use singular `element: <elementId>` frontmatter; the skill MUST NOT write element-side Spec indexes.

#### Scenario: Architecture scope is present
- **WHEN** propose identifies an architecture impact
- **THEN** it SHALL create or update `architecture-delta.c4`
- **AND** it SHALL use LikeC4-compatible `extend` syntax and stable `elementId` references

### Requirement: propose skill SHALL 指导 relationship 类型选择
The skill SHALL select only relation kinds declared by the current Semantic Model and SHALL use containment, not persisted ownership edges, for refinement hierarchy.

#### Scenario: A semantic interaction is required
- **WHEN** propose adds a relation
- **THEN** it SHALL choose the declared kind matching the reviewed intent
- **AND** it SHALL reject dangling, self, or unsupported relations

### Requirement: propose skill SHALL 指导验证 delta
After authoring, the skill SHALL validate delta Specs, `architecture-delta.c4`, and the combined change before reporting completion.

#### Scenario: Delta authoring completes
- **WHEN** all artifacts are present
- **THEN** the skill SHALL run `opsx validate --change <name> --artifacts architecture-delta`
- **AND** it SHALL run full change validation and resolve blocking errors
