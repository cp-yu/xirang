## ADDED Requirements

### Requirement: Post-propose staged validation guidance

The propose workflow SHALL guide agents to validate generated specs and OPSX delta through artifact-scoped validate commands while keeping post-propose validation warning-only.

#### Scenario: Propose guidance includes staged validation commands
- **WHEN** the generated `openspec-propose` skill describes post-propose validation
- **THEN** it SHALL include `openspec validate --change "<name>" --artifacts specs --json`
- **AND** SHALL include `openspec validate --change "<name>" --artifacts opsx-delta --json`
- **AND** SHALL describe these commands as staged checks for generated specs and `opsx-delta.yaml`

#### Scenario: Propose guidance keeps full validation available
- **WHEN** the generated `openspec-propose` skill describes final post-propose validation
- **THEN** it SHALL include `openspec validate --change "<name>" --json` as the full change validation command
- **AND** SHALL keep validation warning-only for the propose workflow
- **AND** SHALL NOT instruct agents to run `openspec sync` during post-propose validation
