---
element: cap.ai.template-artifact-pipeline
---

# template-artifact-pipeline Specification

## Purpose
Define the reviewed Agent Workflow Generation contract for Canonical Workflow Manifest; Tool Profile Registry; Ordered Transform Pipeline; and 2 additional reviewed Requirements.
## Requirements
### Requirement: Canonical Workflow Manifest
canonical workflow manifest SHALL 是生成 skill artifacts 的唯一 source of truth，并 SHALL 包含六个 user workflows：`propose`、`explore`、`apply`、`archive`、`build` 和 `snack`。

#### Scenario: 仅注册一次 Project Build
- **WHEN** 生成 Project Build workflow
- **THEN** manifest entry SHALL 使用 workflow ID `build`、skill name `opsx-build` 和 skill directory `opsx-build`
- **AND** 所有 tool projections SHALL 从该 entry 派生
- **AND** manifest SHALL NOT 包含 `bootstrap-arch`

### Requirement: Tool Profile Registry

The system SHALL define a tool profile registry that captures skill generation capabilities per tool.

#### Scenario: Resolve tool capabilities

- **WHEN** generating artifacts for a selected tool
- **THEN** the system SHALL resolve a tool profile that declares skill path capability and transform set
- **AND** tools with skills support SHALL be handled explicitly without command adapter fallback behavior

#### Scenario: Capability consistency validation

- **WHEN** running validation checks
- **THEN** the system SHALL detect mismatches between configured tools and profile definitions
- **AND** fail with actionable errors in development/CI

### Requirement: Ordered Transform Pipeline

The system SHALL support ordered artifact transforms with explicit scope semantics, and SHALL apply them to skill generation paths through the shared artifact sync engine.

#### Scenario: Execute pre-adapter and post-adapter transforms

- **WHEN** generating a skill artifact
- **THEN** matching skill transforms SHALL execute in deterministic order based on phase and priority
- **AND** command adapter phases SHALL NOT be required for skill artifact generation

#### Scenario: Apply tool-specific rewrites declaratively

- **WHEN** a tool requires instruction rewrites
- **THEN** those rewrites SHALL be implemented as registered transforms with explicit applicability predicates
- **AND** generation entry points SHALL NOT implement ad-hoc rewrite logic

#### Scenario: Command path uses transform pipeline

- **WHEN** workflow artifacts are generated
- **THEN** command artifact transform paths SHALL NOT run
- **AND** command adapters SHALL NOT be invoked

#### Scenario: Skills path uses transform pipeline

- **WHEN** `writeSkills()` generates skill artifacts via `ArtifactSyncEngine`
- **THEN** each skill's instructions SHALL be processed through `runTransforms` with `artifactType: 'skill'`
- **AND** transforms with `scope: 'both'` or `scope: 'skill'` SHALL apply to skill content

### Requirement: Shared Artifact Sync Engine
Setup 和 update SHALL 使用 shared artifact sync engine 生成 `opsx-build` 及相关 managed artifacts，并 SHALL NOT 生成第二套 bootstrap command surface。

#### Scenario: Setup/update 保持 parity
- **WHEN** setup 或 update 写入 workflow skills
- **THEN** 两者 SHALL 使用同一个 manifest-derived engine
- **AND** generated output SHALL 收敛到六个 fixed workflow set

### Requirement: Fidelity Guardrails

The system SHALL enforce guardrails that prevent output drift during refactors.

#### Scenario: Projection parity checks

- **WHEN** CI runs template generation tests
- **THEN** it SHALL verify manifest-derived projections remain consistent for workflows and skill directories
- **AND** detect missing exports or missing workflow registration

#### Scenario: Output parity checks

- **WHEN** running parity tests for representative workflow/tool combinations
- **THEN** generated skill artifacts SHALL remain behaviorally equivalent to approved baselines unless intentionally changed
- **AND** intentional changes SHALL be captured in explicit spec/proposal updates

