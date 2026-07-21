## ADDED Requirements

### Requirement: Granularity init state SHALL be explicit
Bootstrap init SHALL require an explicit `granularity` value supplied by the agent workflow and SHALL persist it in `scope.yaml` without applying a hidden default.

#### Scenario: [ADDED] Agent supplies explicit granularity to init
- **WHEN** the bootstrap agent has confirmed `coarse` with the user
- **AND** the agent runs `openspec bootstrap init --mode full --granularity coarse`
- **THEN** init SHALL create `openspec/bootstrap/scope.yaml` with `granularity: coarse`
- **AND** init SHALL NOT rewrite the value to `fine`

#### Scenario: [ADDED] Missing granularity fails fast
- **WHEN** `openspec bootstrap init --mode full` is executed without a granularity value
- **THEN** init SHALL fail fast with an error that identifies `--granularity coarse|fine` as required
- **AND** init SHALL NOT create a workspace with an inferred granularity

#### Scenario: [ADDED] Invalid granularity fails fast
- **WHEN** `openspec bootstrap init --mode full --granularity medium` is executed
- **THEN** init SHALL fail fast with an error listing valid values `coarse` and `fine`
- **AND** init SHALL NOT create or update `openspec/bootstrap/scope.yaml`

#### Scenario: [ADDED] Restart carries explicit granularity
- **GIVEN** a completed retained workspace is restarted
- **WHEN** the agent runs `openspec bootstrap init --mode refresh --restart --granularity fine`
- **THEN** the new workspace SHALL contain `granularity: fine`
- **AND** the explicit value SHALL override any retained workspace granularity
