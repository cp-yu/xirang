## ADDED Requirements

### Requirement: Artifact-scoped change validation

The validate command SHALL support explicit change selection and artifact-scoped validation so authors can validate generated change artifacts incrementally without waiting for every artifact to be complete.

#### Scenario: Explicit change validation defaults to full change validation
- **WHEN** executing `openspec validate --change my-change`
- **THEN** the CLI SHALL validate `openspec/changes/my-change`
- **AND** SHALL run the same full change validation as `openspec validate my-change --type change`
- **AND** SHALL include both change delta spec validation and OPSX delta validation in the merged report

#### Scenario: Specs artifact scope validates only delta specs
- **WHEN** executing `openspec validate --change my-change --artifacts specs`
- **THEN** the CLI SHALL validate `openspec/changes/my-change/specs/**/spec.md`
- **AND** SHALL report issues from change delta spec validation
- **AND** SHALL NOT report issues from OPSX delta dry-run validation

#### Scenario: OPSX delta artifact scope validates only opsx-delta
- **WHEN** executing `openspec validate --change my-change --artifacts opsx-delta`
- **THEN** the CLI SHALL validate `openspec/changes/my-change/opsx-delta.yaml`
- **AND** SHALL report issues from OPSX delta dry-run validation
- **AND** SHALL NOT report issues from change delta spec validation

#### Scenario: Unknown artifact scope fails deterministically
- **WHEN** executing `openspec validate --change my-change --artifacts unknown`
- **THEN** the CLI SHALL print an error that lists supported artifact scopes `specs` and `opsx-delta`
- **AND** SHALL exit with code 1 without running validation

#### Scenario: Missing explicit change fails deterministically
- **WHEN** executing `openspec validate --change missing-change`
- **THEN** the CLI SHALL print an unknown change error
- **AND** SHALL exit with code 1 without validating specs or unrelated changes
