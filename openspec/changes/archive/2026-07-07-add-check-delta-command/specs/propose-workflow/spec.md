## ADDED Requirements

### Requirement: Propose pre-write delta reference guidance

The propose workflow SHALL mention `openspec check-delta` before writing change-local specs when the workflow guidance describes spec artifact generation. The guidance SHALL instruct agents to run the command with target spec ids and planned `--added`, `--modified`, `--removed`, and `--renamed-from` requirement headers, and SHALL treat Missing existing-reference checks and duplicate ADDED checks as blocking before writing specs.

#### Scenario: Propose guidance includes check-delta before writing specs
- **WHEN** the generated `openspec-propose` skill describes the specs generation flow
- **THEN** it SHALL include `openspec check-delta`
- **AND** SHALL mention `--added`, `--modified`, `--removed`, and `--renamed-from`
- **AND** SHALL place the guidance before writing change-local specs

#### Scenario: Propose guidance distinguishes pre-write blocking from post-write validation
- **WHEN** the generated `openspec-propose` skill describes validation around specs
- **THEN** it SHALL treat `openspec check-delta` Missing and Conflict results as blocking before writing specs
- **AND** SHALL keep post-propose validation warning-only
- **AND** SHALL continue to mention `openspec validate --change "<name>" --artifacts specs --json` for post-write specs validation

#### Scenario: Propose does not create a reference file only for short check-delta guidance
- **WHEN** `openspec-propose` has no existing `referenceFiles` entry for specs authoring guidance
- **THEN** the check-delta guidance SHALL remain concise in the main skill instructions
- **AND** SHALL NOT require adding a new `referenceFiles` entry only to hold the command synopsis
