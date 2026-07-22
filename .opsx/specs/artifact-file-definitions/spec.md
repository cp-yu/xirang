---
element: project.root/domain.artifact_graph/cap.artifact-graph.workflow-compilation
---

# artifact-file-definitions Specification

## Purpose
Define structured file semantics used to compile change scaffolding, bootstrap state, LikeC4 architecture modules, and Element Contract Specs.

## Requirements
### Requirement: 结构化文件定义
Built-in schemas SHALL expose structured definitions with purpose, compilation role, included and excluded content, write policy, validation commands, and template guidance before artifact state is evaluated.

#### Scenario: Agent requests instructions
- **WHEN** an Agent requests instructions for a ready artifact
- **THEN** the resolved file definition SHALL be presented before state and template guidance

### Requirement: Spec-driven 文件语义边界
Proposal SHALL describe motive and source impact; change-local Specs SHALL define behavior deltas; `architecture-delta.c4` SHALL define architecture-source reconciliation; design SHALL record lowering decisions; tasks SHALL define evidence-gated work.

#### Scenario: Change affects architecture
- **WHEN** durable element, boundary, ownership, containment, or relation intent changes
- **THEN** the exact target architecture delta SHALL be authored in `architecture-delta.c4`
- **AND** design or code evidence SHALL NOT become a second architecture source

### Requirement: Agent definition-first authoring
Agent instructions SHALL require reading the resolved file definition before authoring or validating an artifact.

#### Scenario: Definition conflicts with prose guidance
- **WHEN** generic prose conflicts with a structured definition
- **THEN** the structured definition SHALL control the artifact boundary

### Requirement: Bootstrap phase 文件定义投影
Bootstrap instructions SHALL project only the file definitions for the active phase and SHALL preserve their dependency and completion semantics.

#### Scenario: Bootstrap phase changes
- **WHEN** bootstrap advances to another phase
- **THEN** instructions SHALL expose that phase's files without treating bootstrap state as durable semantic source

### Requirement: Formal OPSX 文件定义
Durable architecture source SHALL be `.opsx/architecture/**/*.c4`; durable behavior source SHALL be singular element-bound `.opsx/specs/**/spec.md` contracts.

#### Scenario: Agent requests formal source definitions
- **WHEN** formal source definitions are rendered
- **THEN** LikeC4 modules SHALL define Project Root, elements, containment, metamodel, views, and persisted semantic relations
- **AND** Specs SHALL define observable behavior through singular `element` ownership
- **AND** legacy two-file YAML SHALL NOT be described as active formal source
