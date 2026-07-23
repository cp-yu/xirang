---
element: cap.cli.authoring-help
---

# cli-authoring-help Specification

## Purpose
Define schema-backed authoring help for the active architecture delta and LikeC4 relation vocabulary.

## Requirements
### Requirement: 文件级 authoring help
CLI SHALL provide `opsx help authoring [file]`; without a file it SHALL list `architecture-delta.c4`, and with that file it SHALL render purpose, compilation role, includes, excludes, write policy, and validation commands.

#### Scenario: List authoring topics
- **WHEN** the user runs `opsx help authoring`
- **THEN** output SHALL list only active versioned authoring topics

### Requirement: Relation authoring help
Architecture delta help SHALL derive active relation kinds and authoring rules from `ActiveRelationDefinitionRegistry`.

#### Scenario: Relation help is requested
- **WHEN** the user runs `opsx help authoring architecture-delta.c4`
- **THEN** output SHALL include active relation meaning, endpoints, use guidance, and examples

### Requirement: Authoring help JSON 输出
The `--json` form SHALL return stable machine-readable file definition and relation metadata.

#### Scenario: Agent requests JSON
- **WHEN** the user adds `--json`
- **THEN** stdout SHALL be valid JSON with `file`, `definition`, and registry-derived `relations`

### Requirement: Commander help 兼容
The same `opsx help` command SHALL continue to resolve ordinary Commander command paths.

#### Scenario: Command help is requested
- **WHEN** topics do not start with `authoring`
- **THEN** CLI SHALL display the matched command help or fail clearly for an unknown path

### Requirement: Schema-backed file definition help
Authoring help SHALL resolve the file definition from the built-in `spec-driven` schema and SHALL NOT duplicate its semantics in command code.

#### Scenario: Definition is unavailable
- **WHEN** the active schema lacks the requested artifact definition
- **THEN** help SHALL fail instead of fabricating guidance
