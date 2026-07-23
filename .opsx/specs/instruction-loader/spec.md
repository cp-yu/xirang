---
element: project.root/domain.artifact_graph/cap.artifact-graph.workflow-compilation
---

# instruction-loader Specification

## Purpose
The instruction-loader loads instruction templates from schema directories, validates and enriches them with metadata and parameters (such as change context and dependency status), and exposes them for use by downstream services including template retrieval, parameter substitution, and enrichment.
## Requirements
### Requirement: Template Loading
The system SHALL load templates from schema directories.

#### Scenario: Load template from schema directory
- **WHEN** `loadTemplate(schemaName, templatePath)` is called
- **THEN** the system loads the template from `schemas/<schemaName>/templates/<templatePath>`

#### Scenario: Template file not found
- **WHEN** a template file does not exist in the schema's templates directory
- **THEN** the system throws an error with the template path

### Requirement: Change Context Loading
The system SHALL load change context combining graph and completion state.

#### Scenario: Load context for existing change
- **WHEN** `loadChangeContext(projectRoot, changeName)` is called for an existing change
- **THEN** the system returns a context with graph, completed set, schema name, and change info

#### Scenario: Load context with custom schema
- **WHEN** `loadChangeContext(projectRoot, changeName, schemaName)` is called
- **THEN** the system uses the specified schema instead of default

#### Scenario: Load context for non-existent change directory
- **WHEN** `loadChangeContext` is called for a non-existent change directory
- **THEN** the system returns context with empty completed set

### Requirement: Template Enrichment
The system SHALL enrich templates with change-specific context.

#### Scenario: Include artifact metadata
- **WHEN** instructions are generated for an artifact
- **THEN** the output includes change name, artifact ID, schema name, and output path

#### Scenario: Include dependency status
- **WHEN** an artifact has dependencies
- **THEN** the output shows each dependency with completion status (done/missing)

#### Scenario: Include unlocked artifacts
- **WHEN** instructions are generated
- **THEN** the output includes which artifacts become available after this one

#### Scenario: Root artifact indicator
- **WHEN** an artifact has no dependencies
- **THEN** the dependency section indicates this is a root artifact

### Requirement: Status Formatting
The system SHALL format change status as readable output.

#### Scenario: All artifacts completed
- **WHEN** all artifacts are completed
- **THEN** status shows all artifacts as "done"

#### Scenario: Mixed completion status
- **WHEN** some artifacts are completed
- **THEN** status shows completed as "done", ready as "ready", blocked as "blocked"

#### Scenario: Blocked artifact details
- **WHEN** an artifact is blocked
- **THEN** status shows which dependencies are missing

#### Scenario: Include output paths
- **WHEN** status is formatted
- **THEN** each artifact shows its output path pattern

### Requirement: Artifact current state projection

Instruction loader SHALL 将 artifact completion state 投影为独立的结构化 `currentState`，并与 definition、dependencies、instruction、template 和 config projection 分离。该状态 SHALL 只包含完成状态、当前 output paths 与可选 completion marker 状态，MUST NOT 嵌入文件内容。

#### Scenario: Existing outputs 被投影为路径
- **WHEN** instruction loader 为已有 output 的 artifact 生成 instructions
- **THEN** `currentState.completed` SHALL 反映 artifact completion detection 结果
- **AND** `currentState.outputs` SHALL 包含当前匹配的 canonical output paths
- **AND** SHALL NOT 读取并嵌入这些 output 的内容

#### Scenario: Completion marker 独立于 outputs
- **WHEN** artifact 通过 completion marker 完成
- **THEN** `currentState.completed` SHALL 为 `true`
- **AND** `currentState.outputs` MAY 为空
- **AND** `currentState.completionMarker` SHALL 分别包含 marker path 与 `present: true`

#### Scenario: Absent completion marker 仍暴露预期路径
- **WHEN** artifact 定义 completion marker 但该 marker 不存在
- **THEN** `currentState.completionMarker.path` SHALL 指向预期 marker path
- **AND** `currentState.completionMarker.present` SHALL 为 `false`

