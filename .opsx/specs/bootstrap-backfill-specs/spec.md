---
element: project.root/domain.architecture/cap.architecture.bootstrap
---

# bootstrap-backfill-specs Specification

## Purpose
Backfill missing Spec ownership with singular stable element bindings without guessing semantic ownership.

## Requirements
### Requirement: 命名匹配算法
Backfill SHALL write a deterministic match only when exactly one candidate element matches a Spec ID; it MAY use normalized ID segments to produce that candidate.

#### Scenario: Multiple candidates match
- **WHEN** zero or multiple elements match
- **THEN** the Spec SHALL remain unmatched pending explicit reviewed mapping

### Requirement: Frontmatter 写入
`writeSpecFrontmatter` SHALL write exactly one `element: <stable-id>` field and SHALL NOT emit a `capabilities` array.

#### Scenario: Spec has no frontmatter
- **WHEN** one approved element is selected
- **THEN** frontmatter SHALL be prepended without changing Markdown body content

### Requirement: Backfill Engine 完整流程
Backfill SHALL read candidates from the v1 LikeC4 model when present, use legacy capability identities only as pre-migration candidate input, skip already-owned or legacy-owned Specs, and report all unmatched Specs.

#### Scenario: V1 workspace is backfilled
- **WHEN** architecture language version 1 exists
- **THEN** candidate IDs SHALL come from stable element metadata

### Requirement: CLI 子命令
`opsx bootstrap backfill-specs` SHALL report written and unmatched Specs in text or JSON and MAY consume an explicit mapping file.

#### Scenario: JSON handoff is requested
- **WHEN** `--json` is used
- **THEN** output SHALL include unmatched Spec content, candidate elements, singular mapping format, and the apply command

### Requirement: Semantic mapping SHALL require explicit reviewed writeback
Mapping files SHALL contain one `element` per Spec, reject unknown elements and duplicate Spec mappings, and SHALL NOT infer semantic association from text similarity.

#### Scenario: Mapping references an unknown element
- **WHEN** an explicit mapping names an absent element
- **THEN** backfill SHALL fail before writing the Spec
